/**
 * MCP工具: 生成剧情文本
 */

import axios from 'axios'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('GenerateStory')

export const generateStoryTool = {
  name: 'generate_story',
  description: '使用AI生成游戏剧情文本',

  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['adventure', 'daily', 'battle', 'evolution'],
        description: '剧情类型'
      },
      context: {
        type: 'object',
        description: '剧情上下文信息'
      }
    },
    required: ['type', 'context']
  },

  async execute(args) {
    const { type, context } = args

    try {
      logger.info(`生成${type}类型剧情`, context)

      // 构建提示词
      const prompt = buildStoryPrompt(type, context)

      // 调用AI API (这里使用即梦4.0或其他AI服务)
      const aiResponse = await callAIService(prompt)

      return [{
        type: 'text',
        text: aiResponse
      }]

    } catch (error) {
      logger.error('剧情生成失败:', error)

      // 降级到本地模板
      const fallbackStory = getFallbackStory(type, context)
      return [{
        type: 'text',
        text: fallbackStory
      }]
    }
  }
}

/**
 * 构建剧情提示词
 */
function buildStoryPrompt(type, context) {
  const basePrompt = `你是"山海经灵境"的世界叙事器,负责生成文字放置RPG的剧情文本。

世界观:
- 灵境大陆由世界树种子衍生
- 存在各类山海经神兽和灵宠
- 玩家作为灵师与宠物契约冒险

文风要求:
- 文字为主,沉浸式演出
- 奇诡唯美,符合山海经美学
- 不出现现代物件
- 每段100-300字
`

  const typePrompts = {
    adventure: `
剧情类型: 冒险探索
场景: ${context.scene || '未知区域'}
当前状态: ${JSON.stringify(context)}

请生成一段冒险剧情,包含:
1. 场景氛围描述
2. 遭遇的事件或生物
3. 2-3个选择分支提示
`,
    daily: `
剧情类型: 日常互动
行动: ${context.action || '休息'}
宠物状态: ${JSON.stringify(context.petInfo || {})}

请生成日常互动剧情,包含:
1. 宠物反应和情绪
2. 互动过程描述
3. 羁绊变化提示
`,
    battle: `
剧情类型: 战斗
对手: ${context.opponent || '未知对手'}
场地: ${context.scene || '擂台'}

请生成战斗演出文本,包含:
1. 战斗开场氛围
2. 双方宠物登场
3. 战意描述
`,
    evolution: `
剧情类型: 进化
进化路径: ${context.evolutionPath || '未知'}
当前形态: ${context.currentForm || '未知'}

请生成进化剧情,包含:
1. 进化前兆描述
2. 能量变化过程
3. 新形态揭示
`
  }

  return basePrompt + (typePrompts[type] || typePrompts.adventure)
}

/**
 * 调用AI服务
 */
async function callAIService(prompt) {
  const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000/v1/chat/completions'
  const AI_API_KEY = process.env.AI_API_KEY || ''

  try {
    // 如果配置了AI API,调用远程服务
    if (AI_API_KEY) {
      const response = await axios.post(AI_API_URL, {
        model: 'vim-4.0', // 即梦4.0
        messages: [
          { role: 'system', content: '你是专业的游戏剧情生成器' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })

      return response.data.choices[0].message.content
    }

    // 否则使用本地模板
    throw new Error('AI API未配置')

  } catch (error) {
    logger.warn('AI API调用失败,使用本地模板', error.message)
    throw error
  }
}

/**
 * 降级模板
 */
function getFallbackStory(type, context) {
  const templates = {
    adventure: `你带着宠物踏入了${context.scene || '神秘的'}区域。

周围的空气中弥漫着奇异的灵力波动,古树参天,藤蔓交织。远处传来未知生物的低鸣,似乎在警告外来者。

你的宠物警觉地环顾四周,鼻尖微微抽动,捕捉着空气中的气息。

你可以选择:
- 深入探索,寻找宝物
- 谨慎前行,避免战斗
- 返回营地休整`,

    daily: `又是平静的一天。

你轻轻抚摸着宠物的头颅,它发出满足的低鸣,身体微微颤动。阳光透过树叶的缝隙洒在它身上,形成斑驳的光影。

宠物似乎很享受这份宁静,眼睛微微眯起,尾巴轻轻摇摆。你们之间的羁绊又深了一分。

(经验+5, 羁绊+3)`,

    battle: `战斗一触即发!

对面的${context.opponent || '对手'}散发着强大的气息,眼神锐利如刀。你的宠物没有退缩,昂首挺胸,战意熊熊燃烧。

两只灵宠在擂台上对峙,空气仿佛凝固。观众们屏住呼吸,等待着这场激烈对决的开始。

战斗即将开始...`,

    evolution: `一股神秘的能量包围着你的宠物!

它的身体开始发光,散发出耀眼的光芒。能量如潮水般涌入,身躯逐渐发生变化。这是进化的征兆!

光芒渐渐消散,一个全新的形态出现在你面前。宠物的气息变得更加强大,眼神中透露出前所未有的自信。

进化成功!`
  }

  return templates[type] || templates.adventure
}
