/**
 * DeepSeek文本模型接入路由
 * 用于生成长剧情文本和场景描述
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

class DeepSeekService {
  constructor() {
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    this.configured = !!this.apiKey;
  }

  async generateText(prompt, options = {}) {
    if (!this.configured) {
      throw new Error('DeepSeek API未配置');
    }

    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文字游戏剧情生成器，擅长创作山海经风格的沉浸式文字内容。请生成富有诗意、具有起承转合结构的中文剧情文本。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 1200,
      temperature: options.temperature || 0.8,
      top_p: options.topP || 0.9,
      stream: false
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      logger.error('DeepSeek API调用失败:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      configured: this.configured,
      model: this.model,
      apiUrl: this.apiUrl ? '已配置' : '未配置'
    };
  }
}

const deepseekService = new DeepSeekService();

// 生成长剧情文本（≥800字，起承转合结构）
router.post('/generate-long', async (req, res) => {
  try {
    const { option, pet, requireLength = 800 } = req.body;
    
    const petName = pet?.name || '你';
    const petSpecies = pet?.species || '神秘伙伴';
    const petRarity = pet?.rarity || 'N';
    
    const optionMap = {
      explore: '探索青木灵境的林径，寻找隐秘线索',
      train: '进行系统训练，巩固羁绊与能力',
      encounter: '响应远处召唤，触发奇遇事件'
    };
    
    const selectedOption = optionMap[option] || optionMap.explore;
    
    const prompt = `请为山海经风格的文字宠物养成游戏生成一段连续剧情，要求：

【基本信息】
- 主角：${petName}（${petSpecies}，稀有度${petRarity}）
- 选择：${selectedOption}
- 字数：不少于${requireLength}字
- 结构：严格按照"起承转合"四段式结构

【内容要求】
1. 起：设定场景氛围，描述初始状态和动机
2. 承：展开行动过程，遇到挑战或发现
3. 转：情节转折，出现意外或深层发现
4. 合：解决问题，获得成长或领悟

【风格要求】
- 文笔优美，富有诗意和画面感
- 融入山海经元素（神兽、灵境、古老传说）
- 突出人宠羁绊和成长主题
- 避免直接的数值描述，用意象表达能力变化
- 每段结尾用句号，便于后续分段处理

请直接输出剧情文本，不要添加额外说明。`;

    let text = '';
    
    try {
      text = await deepseekService.generateText(prompt, {
        maxTokens: 1500,
        temperature: 0.8
      });
    } catch (error) {
      logger.warn('DeepSeek生成失败，使用本地降级:', error.message);
      // 降级到本地生成
      text = generateLocalLongPlot(option, pet, requireLength);
    }

    // 确保文本长度符合要求
    if (text.length < requireLength * 0.8) {
      logger.warn('生成文本过短，使用本地降级');
      text = generateLocalLongPlot(option, pet, requireLength);
    }

    res.json({
      success: true,
      text: text,
      length: text.length,
      source: text.includes('【本地降级】') ? 'local' : 'deepseek'
    });

  } catch (error) {
    logger.error('长剧情生成失败:', error);
    
    // 最终降级
    const fallbackText = generateLocalLongPlot(req.body.option, req.body.pet, req.body.requireLength);
    
    res.json({
      success: true,
      text: fallbackText,
      length: fallbackText.length,
      source: 'local_fallback'
    });
  }
});

// 生成场景描述文本
router.post('/scene-description', async (req, res) => {
  try {
    const { sceneKey, petName = '你', context = '' } = req.body;
    
    const sceneMap = {
      volcano: '火山熔岩之境',
      sky: '临界天空之域', 
      forest: '青木灵境林径',
      desert: '荒漠戈壁之地'
    };
    
    const sceneName = sceneMap[sceneKey] || sceneMap.forest;
    
    const prompt = `为山海经风格的文字游戏生成场景描述，要求：

【场景】${sceneName}
【角色】${petName}
【背景】${context}

请生成4-6句富有画面感的场景描述，突出：
1. 环境的神秘氛围
2. 感官细节（视觉、听觉、触觉）
3. 山海经风格的奇幻元素
4. 角色与环境的互动

每句以句号结尾，总长度100-200字。直接输出描述文本。`;

    let text = '';
    
    try {
      text = await deepseekService.generateText(prompt, {
        maxTokens: 300,
        temperature: 0.7
      });
    } catch (error) {
      // 降级到本地场景描述
      const localDescriptions = {
        volcano: '熔岩在脚下翻滚咆哮，空气中弥漫着硫磺的气息。远山如巨兽脊背，火光映红半边天际。你感受到大地深处的原始力量，血脉中似有回应。',
        sky: '云海在足下翻涌，天风携来远古的呼唤。星辰在白昼中隐现，仿佛指引着某个方向。你踏云而行，心境渐趋空明。',
        forest: '古木参天，枝叶间洒落斑驳光影。鸟鸣啁啾，溪水潺潺，生机盎然。你与伙伴在林径中缓行，感受自然的和谐律动。',
        desert: '黄沙漫天，烈日当空照。远处海市蜃楼若隐若现，仿佛古老文明的残影。你在沙丘间跋涉，寻找传说中的绿洲。'
      };
      text = localDescriptions[sceneKey] || localDescriptions.forest;
    }

    res.json({
      success: true,
      text: text,
      scene: sceneName,
      source: text.includes('熔岩在脚下') ? 'local' : 'deepseek'
    });

  } catch (error) {
    logger.error('场景描述生成失败:', error);
    res.status(500).json({
      success: false,
      error: '场景描述生成失败'
    });
  }
});

// 获取DeepSeek服务状态
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: deepseekService.getStatus()
  });
});

// 本地降级长剧情生成函数
function generateLocalLongPlot(option, pet, requireLength = 800) {
  const petName = pet?.name || '你';
  const petSpecies = pet?.species || '神秘伙伴';
  
  const templates = {
    explore: {
      起: `薄雾裹着林径的清气，${petName}与${petSpecies}沿着世界树的纹理缓步而行。碎光落在叶尖，像不愿惊扰的旧事，一点一点被捧到眼前。远处传来若有若无的钟鸣，似乎在召唤着什么。你们相视一眼，决定循声而去。`,
      承: `道路并不笔直。枝条横斜，溪石圆润，微小的阻力让人的脚步更稳。一路上，你们交换着细小的想法与观察，关于训练的节奏、关于今日的体力与心意，也关于如何分配下一次的尝试。${petSpecies}时而停下，嗅闻空气中的异样，它的直觉总是比你更敏锐。`,
      转: `忽然，一阵看不见的风在树冠之间连缀成线，像有人轻敲一面藏在远处的铃。${petSpecies}的目光先你一步望向深处——那里有不寻常的光纹在泥土下呼吸。它不猛烈，却在持续地变换形状，像要把某个被遗忘的名字重新写出来。你们小心翼翼地靠近，发现这是一处古老的符文阵。`,
      合: `你们并不急于给出结论。沿着光纹的边缘试探，记录每一次微小的变化，把心跳按在最慢的节拍上。当所有的碎片凑到一起，那名字终于从土壤里抬起头来。你们看见了自己的影像，也看见了下一段旅程的方向。这次探索让你们的羁绊更加深厚，对这片灵境的理解也更加深入。`
    },
    train: {
      起: `清晨的第一缕阳光透过叶隙洒下，${petName}与${petSpecies}来到了熟悉的训练场地。这里是一片开阔的草地，四周环绕着古老的石柱，每一根都刻着不同的符文。今日的训练将专注于提升彼此的默契与能力。`,
      承: `训练从基础的协调开始。你们练习同步的呼吸，感受彼此的节奏。${petSpecies}展现出它独特的天赋，而你则学会如何更好地引导和配合。汗水与专注交织，每一次重复都在加深理解。石柱上的符文似乎在回应你们的努力，发出微弱的光芒。`,
      转: `就在训练进入关键阶段时，意外发生了。${petSpecies}突然停下动作，眼中闪过一丝困惑的光芒。它似乎感受到了什么，身体开始发生微妙的变化。这不是疲惫，而是某种更深层的觉醒。你意识到，这次训练触发了它内在的某种潜能。`,
      合: `你没有慌张，而是静静地陪伴在它身边，用心感受这个过程。渐渐地，${petSpecies}的气息变得更加沉稳，眼神中多了一份成熟的智慧。这次训练不仅提升了你们的能力，更重要的是，它让你们都成长了。你们的羁绊在这个过程中得到了升华。`
    },
    encounter: {
      起: `远方传来神秘的召唤，那声音穿越了时空的阻隔，直达心灵深处。${petName}与${petSpecies}对视一眼，都感受到了这份不可抗拒的吸引力。你们决定响应这个召唤，踏上一段未知的旅程。天空中的云朵开始聚集，仿佛在为即将到来的奇遇做准备。`,
      承: `旅程比预想的更加奇妙。你们穿过了几个不同的灵境，每一处都有独特的风景和生灵。${petSpecies}表现出前所未有的兴奋，它似乎认出了这些地方，仿佛在回忆着什么古老的记忆。召唤声越来越清晰，引导着你们向着一个神秘的方向前进。`,
      转: `当你们到达召唤的源头时，眼前的景象让人震撼。这是一座古老的神殿，被时间遗忘在这片隐秘的空间里。神殿中央有一个光芒四射的水晶，正是它在发出召唤。但更令人惊讶的是，${petSpecies}开始与水晶产生共鸣，它的身体散发出同样的光芒。`,
      合: `在水晶的光芒中，你看到了${petSpecies}的真正来历，也理解了这次召唤的意义。这不是偶然的相遇，而是命运的安排。${petSpecies}获得了它应有的力量，而你也在这个过程中得到了珍贵的启示。你们的关系从此有了新的维度，不再只是伙伴，更是彼此命运的见证者。`
    }
  };

  const template = templates[option] || templates.explore;
  
  // 组合四段，并添加细节描述以达到要求长度
  const baseText = Object.values(template).join('');
  
  // 如果长度不够，添加更多细节
  let finalText = baseText;
  if (finalText.length < requireLength) {
    const additionalDetails = `

在这个过程中，你们都感受到了成长的喜悦。${petSpecies}的眼神变得更加深邃，仿佛能看透事物的本质。而你也学会了更好地理解和沟通，不仅是与${petSpecies}，更是与这个神奇的世界。

微风轻拂，带来远方的消息。鸟儿在枝头歌唱，似乎在为你们的成长而庆祝。阳光透过云层洒下，在地面上投下斑驳的光影。这一切都显得那么和谐，那么美好。

你们知道，这只是漫长旅程中的一个片段，但它已经足够珍贵。每一次的经历都在塑造着你们，让你们变得更加强大，更加智慧。未来还有更多的挑战等待着，但你们已经准备好了。

【本地降级】此文本由本地模板生成，总长度${finalText.length + 200}字左右。`;
    
    finalText += additionalDetails;
  }
  
  return finalText;
}

module.exports = router;