/**
 * 场景图片生成器 - 即梦4.0集成
 * 专门为关键剧情场景生成配套图片
 */

const logger = require('../utils/logger');

class SceneImageGenerator {
  constructor(imageService) {
    this.imageService = imageService;
    
    // 场景类型与提示词模板
    this.sceneTemplates = {
      // 探索场景
      exploration: {
        forest: '古老神秘的山海经森林，参天古树，灵气缭绕，{creature}在林间若隐若现',
        mountain: '巍峨的昆仑山脉，云雾缭绕，仙气飘渺，{creature}栖息在山峰之上',
        ocean: '波澜壮阔的归墟之海，海天一色，{creature}在海浪中翻腾',
        cave: '幽深的洞穴，钟乳石闪闪发光，{creature}守护着古老的秘密',
        sky: '九重天空，彩云飞舞，{creature}在云端自由翱翔'
      },
      
      // 战斗场景
      battle: {
        arena: '古老的斗兽场，雷电交加，{pet1}与{pet2}激烈对战',
        wilderness: '荒野战场，风沙飞舞，两只神兽展开生死决斗',
        temple: '神庙之中，神光普照，神圣的战斗即将开始',
        volcano: '火山口边缘，岩浆翻滚，烈焰中的终极对决'
      },
      
      // 进化场景
      evolution: {
        sacred: '神圣的进化祭坛，天地灵气汇聚，{pet}被进化之光包围',
        natural: '自然的力量觉醒，花草树木为{pet}的蜕变而欢呼',
        cosmic: '星空下的进化仪式，宇宙能量注入{pet}的身体',
        elemental: '五行元素环绕，{pet}在元素风暴中获得新生'
      },
      
      // 羁绊场景
      bonding: {
        peaceful: '宁静的世界树下，{trainer}与{pet}静静相伴',
        adventure: '{trainer}与{pet}并肩踏上冒险之路',
        celebration: '庆祝的时刻，{trainer}与{pet}分享胜利的喜悦',
        meditation: '冥想修炼，{trainer}与{pet}心灵相通'
      },
      
      // 特殊事件场景
      special: {
        artifact: '古老神器现世，神光冲天，改变了整个世界',
        prophecy: '预言成真的时刻，天象异变，命运之轮转动',
        awakening: '远古力量苏醒，大地震颤，新的时代即将开始',
        transcendence: '超越凡俗的瞬间，时空扭曲，达到更高境界'
      }
    };

    // 山海经风格描述词库
    this.styleKeywords = {
      colors: ['金辉', '紫气', '青光', '赤焰', '玄冰', '银辉', '碧绿', '朱红'],
      atmosphere: ['仙气缭绕', '灵气氤氲', '神光普照', '瑞气千条', '霞光万丈'],
      elements: ['五行流转', '阴阳调和', '天地合一', '星辰闪耀', '风雷激荡'],
      mood: ['庄严神圣', '神秘莫测', '威严肃穆', '祥和宁静', '激昂澎湃']
    };
  }

  /**
   * 为剧情节点生成场景图片
   */
  async generateStorySceneImage(storyNode, context = {}) {
    try {
      logger.info(`Generating scene image for story node: ${storyNode.id}`);
      
      // 分析剧情内容，确定场景类型
      const sceneType = this.analyzeSceneType(storyNode, context);
      
      // 生成场景提示词
      const prompt = await this.generateScenePrompt(storyNode, sceneType, context);
      
      // 调用即梦4.0生成图片
      const imageResult = await this.imageService.generateSceneImage({
        prompt: prompt.text,
        style: '山海经神话风格',
        mood: prompt.mood,
        scene: sceneType.category,
        size: '2K',
        quality: 'high'
      });

      return {
        success: true,
        imageUrl: imageResult.url,
        prompt: prompt.text,
        sceneType: sceneType,
        metadata: {
          nodeId: storyNode.id,
          category: sceneType.category,
          subtype: sceneType.subtype,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to generate story scene image:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackImage(storyNode)
      };
    }
  }

  /**
   * 为进化过程生成专门的场景图片
   */
  async generateEvolutionSceneImage(evolutionData) {
    try {
      const { beforeEvolution, afterEvolution, stage } = evolutionData;
      
      const prompt = this.buildEvolutionPrompt(beforeEvolution, afterEvolution, stage);
      
      const imageResult = await this.imageService.generateSceneImage({
        prompt: prompt,
        style: '山海经神话风格，进化光效',
        mood: '神圣庄严，光芒万丈',
        scene: 'evolution_ceremony',
        effects: ['进化光芒', '能量爆发', '神圣仪式'],
        size: '2K'
      });

      return {
        success: true,
        imageUrl: imageResult.url,
        prompt: prompt,
        type: 'evolution',
        stage: stage
      };

    } catch (error) {
      logger.error('Failed to generate evolution scene image:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 为战斗场景生成图片
   */
  async generateBattleSceneImage(battleData) {
    try {
      const { attacker, defender, environment, battleType } = battleData;
      
      const template = this.sceneTemplates.battle[environment] || this.sceneTemplates.battle.arena;
      const prompt = template
        .replace('{pet1}', attacker.name)
        .replace('{pet2}', defender.name);

      const enhancedPrompt = this.enhancePromptWithStyle(prompt, 'battle');

      const imageResult = await this.imageService.generateSceneImage({
        prompt: enhancedPrompt,
        style: '山海经神话风格，激烈战斗',
        mood: '紧张激烈，电光火石',
        scene: 'epic_battle',
        effects: ['战斗特效', '能量碰撞', '神兽对决'],
        size: '2K'
      });

      return {
        success: true,
        imageUrl: imageResult.url,
        prompt: enhancedPrompt,
        type: 'battle',
        environment: environment
      };

    } catch (error) {
      logger.error('Failed to generate battle scene image:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 分析场景类型
   */
  analyzeSceneType(storyNode, context) {
    const title = storyNode.title?.toLowerCase() || '';
    const description = storyNode.description?.toLowerCase() || '';
    const nodeType = storyNode.type || 'normal';

    // 根据节点类型和内容判断场景
    if (nodeType === 'encounter') {
      if (description.includes('森林') || description.includes('树')) {
        return { category: 'exploration', subtype: 'forest' };
      } else if (description.includes('山') || description.includes('峰')) {
        return { category: 'exploration', subtype: 'mountain' };
      } else if (description.includes('海') || description.includes('水')) {
        return { category: 'exploration', subtype: 'ocean' };
      }
      return { category: 'exploration', subtype: 'wilderness' };
    }

    if (nodeType === 'battle') {
      return { category: 'battle', subtype: 'arena' };
    }

    if (nodeType === 'bond') {
      return { category: 'bonding', subtype: 'peaceful' };
    }

    if (nodeType === 'discovery') {
      return { category: 'exploration', subtype: 'cave' };
    }

    // 默认探索场景
    return { category: 'exploration', subtype: 'forest' };
  }

  /**
   * 生成场景提示词
   */
  async generateScenePrompt(storyNode, sceneType, context) {
    try {
      // 获取基础模板
      const template = this.sceneTemplates[sceneType.category]?.[sceneType.subtype] || 
                     '神秘的山海经世界场景';

      // 替换模板变量
      let prompt = template;
      if (context.petName) {
        prompt = prompt.replace('{creature}', context.petName);
        prompt = prompt.replace('{pet}', context.petName);
      }
      if (context.trainerName) {
        prompt = prompt.replace('{trainer}', context.trainerName);
      }

      // 增强提示词
      const enhancedPrompt = this.enhancePromptWithStyle(prompt, sceneType.category);

      // 确定情绪基调
      const mood = this.determineMood(storyNode, sceneType);

      return {
        text: enhancedPrompt,
        mood: mood,
        category: sceneType.category,
        subtype: sceneType.subtype
      };

    } catch (error) {
      logger.error('Failed to generate scene prompt:', error);
      return {
        text: '山海经神话世界的神秘场景',
        mood: '神秘莫测',
        category: 'default'
      };
    }
  }

  /**
   * 构建进化提示词
   */
  buildEvolutionPrompt(beforeEvolution, afterEvolution, stage) {
    const basePrompt = `
山海经神话风格的宠物进化场景：
${beforeEvolution.name}正在进化为${afterEvolution.name}
进化阶段：${stage}
场景描述：神圣的进化祭坛上，天地灵气汇聚成璀璨的光柱
${beforeEvolution.name}被进化之光包围，身体开始发生神奇的变化
光芒中隐约可见${afterEvolution.name}的轮廓正在显现
周围的空间因为强大的能量而扭曲，呈现出梦幻般的色彩
整个场景充满了神圣、庄严和希望的氛围
`;

    return this.enhancePromptWithStyle(basePrompt, 'evolution');
  }

  /**
   * 用风格关键词增强提示词
   */
  enhancePromptWithStyle(basePrompt, category) {
    const colors = this.getRandomKeywords(this.styleKeywords.colors, 2);
    const atmosphere = this.getRandomKeywords(this.styleKeywords.atmosphere, 1);
    const elements = this.getRandomKeywords(this.styleKeywords.elements, 1);

    const styleEnhancement = `
画面风格：中国古典神话，山海经传说风格
色彩：${colors.join('、')}为主调
氛围：${atmosphere[0]}，${elements[0]}
画质：超高清，细节丰富，光影效果逼真
构图：电影级别的视觉冲击力
`;

    return basePrompt + '\n' + styleEnhancement;
  }

  /**
   * 确定情绪基调
   */
  determineMood(storyNode, sceneType) {
    const nodeType = storyNode.type || 'normal';
    const moodMap = {
      encounter: '神秘莫测',
      battle: '激昂澎湃',
      discovery: '惊喜兴奋',
      bond: '祥和宁静',
      challenge: '紧张刺激',
      reward: '欢欣鼓舞',
      ending: '庄严神圣'
    };

    return moodMap[nodeType] || '神秘莫测';
  }

  /**
   * 获取随机关键词
   */
  getRandomKeywords(keywords, count) {
    const shuffled = [...keywords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * 获取备用图片
   */
  getFallbackImage(storyNode) {
    // 返回默认的场景图片URL或占位符
    return {
      url: '/images/default-scene.jpg',
      description: '默认山海经场景图片'
    };
  }

  /**
   * 批量生成场景图片
   */
  async batchGenerateSceneImages(storyNodes, context = {}) {
    const results = [];
    
    for (const node of storyNodes) {
      try {
        const result = await this.generateStorySceneImage(node, context);
        results.push({
          nodeId: node.id,
          ...result
        });
        
        // 避免API调用过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error(`Failed to generate image for node ${node.id}:`, error);
        results.push({
          nodeId: node.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 获取场景图片缓存
   */
  getCachedSceneImage(nodeId, context) {
    // 这里可以实现图片缓存逻辑
    // 根据nodeId和context生成缓存键，检查是否已有生成的图片
    return null;
  }

  /**
   * 清理过期的场景图片
   */
  cleanupExpiredImages() {
    // 实现图片清理逻辑
    logger.info('Cleaning up expired scene images...');
  }
}

module.exports = SceneImageGenerator;