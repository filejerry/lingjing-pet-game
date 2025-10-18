/**
 * 增强剧情系统 - 集成山海经神话生物和图像生成
 * 支持最多3个选项、丰富的神话生物、关键场景图片生成
 */

const logger = require('../utils/logger');

class EnhancedStorySystem {
  constructor(aiService, imageService) {
    this.aiService = aiService;
    this.imageService = imageService;
    this.mythicalCreatures = this.initializeMythicalCreatures();
    this.storyTemplates = this.initializeStoryTemplates();
    this.currentStories = new Map();
  }

  /**
   * 初始化山海经神话生物数据库
   */
  initializeMythicalCreatures() {
    return {
      // 四大神兽
      divine_beasts: [
        { name: '青龙', type: '东方神兽', element: '木', power: '春生万物' },
        { name: '朱雀', type: '南方神兽', element: '火', power: '烈焰焚天' },
        { name: '白虎', type: '西方神兽', element: '金', power: '肃杀之气' },
        { name: '玄武', type: '北方神兽', element: '水', power: '玄冥护体' }
      ],
      
      // 上古凶兽
      fierce_beasts: [
        { name: '饕餮', type: '贪婪凶兽', element: '暗', power: '吞噬万物' },
        { name: '混沌', type: '无序凶兽', element: '虚无', power: '颠倒乾坤' },
        { name: '穷奇', type: '邪恶凶兽', element: '风', power: '煽风点火' },
        { name: '梼杌', type: '顽劣凶兽', element: '土', power: '顽石不化' }
      ],
      
      // 神话龙族
      dragon_clan: [
        { name: '烛龙', type: '时间之龙', element: '光', power: '昼夜轮转' },
        { name: '应龙', type: '有翼神龙', element: '雷', power: '呼风唤雨' },
        { name: '螣蛇', type: '腾云之蛇', element: '云', power: '腾云驾雾' },
        { name: '虺', type: '幼龙', element: '水', power: '兴云布雨' }
      ],
      
      // 神鸟族群
      divine_birds: [
        { name: '凤凰', type: '百鸟之王', element: '火', power: '涅槃重生' },
        { name: '鲲鹏', type: '巨鸟', element: '风', power: '扶摇九万里' },
        { name: '青鸾', type: '神鸟', element: '木', power: '传递神谕' },
        { name: '比翼鸟', type: '情侣鸟', element: '爱', power: '比翼双飞' },
        { name: '重明鸟', type: '双瞳鸟', element: '光', power: '破除邪祟' },
        { name: '精卫', type: '填海鸟', element: '意志', power: '坚韧不拔' },
        { name: '毕方', type: '火鸟', element: '火', power: '预示灾祸' }
      ],
      
      // 瑞兽仙禽
      auspicious_beasts: [
        { name: '麒麟', type: '仁兽', element: '德', power: '祥瑞降临' },
        { name: '白泽', type: '知识兽', element: '智', power: '通晓万物' },
        { name: '獬豸', type: '正义兽', element: '法', power: '辨别善恶' },
        { name: '夔牛', type: '雷兽', element: '雷', power: '雷鸣震天' },
        { name: '天马', type: '神马', element: '风', power: '日行千里' },
        { name: '龙马', type: '河图马', element: '文', power: '承载文明' }
      ],
      
      // 守护神兽
      guardian_beasts: [
        { name: '狻猊', type: '狮形兽', element: '威', power: '镇守门户' },
        { name: '椒图', type: '螺形兽', element: '守', power: '紧闭门扉' },
        { name: '蒲牢', type: '龙形兽', element: '声', power: '震慑邪恶' },
        { name: '狴犴', type: '虎形兽', element: '法', power: '执法如山' },
        { name: '负屃', type: '龟形兽', element: '文', power: '承载文字' },
        { name: '螭吻', type: '鱼形兽', element: '水', power: '防火镇宅' }
      ],
      
      // 山海异兽
      exotic_beasts: [
        { name: '九尾狐', type: '灵狐', element: '魅', power: '魅惑众生' },
        { name: '貔貅', type: '招财兽', element: '财', power: '招财进宝' },
        { name: '犼', type: '镇邪兽', element: '正', power: '镇压邪祟' },
        { name: '谛听', type: '听音兽', element: '听', power: '洞察真伪' },
        { name: '角端', type: '独角兽', element: '纯', power: '识别忠奸' },
        { name: '驳', type: '马形兽', element: '速', power: '追风逐电' }
      ]
    };
  }

  /**
   * 初始化故事模板
   */
  initializeStoryTemplates() {
    return {
      encounter: {
        title: '神秘相遇',
        generateDescription: (creature, context) => {
          return `在${this.getRandomLocation()}，你和${context.petName}遇到了一只${creature.name}。这只${creature.type}身上散发着${creature.element}属性的灵力，${creature.power}的气息让周围的空气都为之颤动。`;
        },
        maxChoices: 3,
        generateChoices: (creature, context) => [
          {
            id: 'peaceful_approach',
            text: `🕊️ 以和平的方式接近${creature.name}`,
            effects: { bond: 2, wisdom: 1 },
            imagePrompt: `peaceful encounter with ${creature.name} in mystical ${creature.element} environment`
          },
          {
            id: 'cautious_observe',
            text: `👁️ 谨慎观察${creature.name}的行为`,
            effects: { wisdom: 2, courage: 1 },
            imagePrompt: `observing ${creature.name} from distance in ${creature.element} landscape`
          },
          {
            id: 'show_respect',
            text: `🙏 向这位${creature.type}表示敬意`,
            effects: { bond: 1, karma: 2 },
            imagePrompt: `showing respect to majestic ${creature.name} in sacred setting`
          }
        ]
      },
      
      discovery: {
        title: '重要发现',
        generateDescription: (item, context) => {
          const discoveries = [
            `古老的${item.name}石碑`,
            `发光的${item.name}符文`,
            `神秘的${item.name}遗迹`,
            `闪烁的${item.name}宝石`,
            `远古的${item.name}卷轴`
          ];
          const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
          return `通过仔细探索，你们发现了<span class="clue-item">${discovery}</span>，这可能是解开此地秘密的关键线索。`;
        },
        maxChoices: 3,
        generateChoices: (item, context) => [
          {
            id: 'investigate_thoroughly',
            text: '🔍 深入调查这个发现',
            effects: { wisdom: 3, exp: 15 },
            imagePrompt: `ancient mystical artifact discovery scene with glowing runes`
          },
          {
            id: 'seek_pet_opinion',
            text: `🐾 询问${context.petName}的看法`,
            effects: { bond: 2, insight: 1 },
            imagePrompt: `pet and trainer examining mysterious ancient artifact together`
          },
          {
            id: 'mark_and_continue',
            text: '📍 标记位置，继续探索',
            effects: { wisdom: 1, exploration: 1 },
            imagePrompt: `marking location on mystical map in ancient landscape`
          }
        ]
      },
      
      challenge: {
        title: '试炼挑战',
        generateDescription: (challenge, context) => {
          const challenges = [
            `需要解开${challenge.element}属性的古老谜题`,
            `必须通过${challenge.power}的勇气考验`,
            `要展示对${challenge.type}的理解和智慧`
          ];
          const challengeDesc = challenges[Math.floor(Math.random() * challenges.length)];
          return `前方出现了一道试炼：<span class="challenge-item">${challengeDesc}</span>。只有通过这个考验，才能继续前进。`;
        },
        maxChoices: 3,
        generateChoices: (challenge, context) => [
          {
            id: 'use_wisdom',
            text: '🧠 运用智慧解决问题',
            effects: { wisdom: 3, exp: 20 },
            requirements: { wisdom: 3 },
            imagePrompt: `solving ancient puzzle with mystical symbols and glowing elements`
          },
          {
            id: 'show_courage',
            text: '⚔️ 展现勇气面对挑战',
            effects: { courage: 3, exp: 20 },
            requirements: { courage: 3 },
            imagePrompt: `brave confrontation with mystical trial in epic landscape`
          },
          {
            id: 'combine_efforts',
            text: `🤝 与${context.petName}合作应对`,
            effects: { bond: 3, teamwork: 2 },
            requirements: { bond: 5 },
            imagePrompt: `trainer and pet working together to overcome mystical challenge`
          }
        ]
      }
    };
  }

  /**
   * 开始新故事
   */
  async startStory(playerId, storyType, context = {}) {
    try {
      // 随机选择生物类型和具体生物
      const creatureCategories = Object.keys(this.mythicalCreatures);
      const randomCategory = creatureCategories[Math.floor(Math.random() * creatureCategories.length)];
      const creatures = this.mythicalCreatures[randomCategory];
      const selectedCreature = creatures[Math.floor(Math.random() * creatures.length)];

      // 选择故事模板
      const templateTypes = Object.keys(this.storyTemplates);
      const randomTemplate = templateTypes[Math.floor(Math.random() * templateTypes.length)];
      const template = this.storyTemplates[randomTemplate];

      // 生成故事内容
      const description = template.generateDescription(selectedCreature, context);
      const choices = template.generateChoices(selectedCreature, context);

      // 限制选择数量为最多3个
      const limitedChoices = choices.slice(0, 3);

      // 生成关键场景图片
      const sceneImagePrompt = `${selectedCreature.name} ${selectedCreature.type} in mystical ${selectedCreature.element} environment, Chinese mythology style, detailed fantasy art`;
      let sceneImage = null;
      
      try {
        sceneImage = await this.imageService.generateImage(sceneImagePrompt, {
          style: 'fantasy',
          quality: 'high',
          size: '1024x1024'
        });
      } catch (imageError) {
        logger.warn('Failed to generate scene image:', imageError);
      }

      const storyNode = {
        id: `${randomTemplate}_${Date.now()}`,
        type: randomTemplate,
        title: template.title,
        description: description,
        choices: limitedChoices,
        creature: selectedCreature,
        sceneImage: sceneImage,
        timestamp: new Date().toISOString()
      };

      // 保存故事状态
      const storyState = {
        playerId,
        currentNode: storyNode,
        context,
        history: [],
        startTime: new Date().toISOString()
      };

      this.currentStories.set(playerId, storyState);

      return {
        success: true,
        currentNode: storyNode,
        storyState
      };

    } catch (error) {
      logger.error('Failed to start enhanced story:', error);
      throw error;
    }
  }

  /**
   * 处理选择
   */
  async makeChoice(playerId, choiceId) {
    try {
      const storyState = this.currentStories.get(playerId);
      if (!storyState) {
        throw new Error('No active story found');
      }

      const currentNode = storyState.currentNode;
      const choice = currentNode.choices.find(c => c.id === choiceId);
      
      if (!choice) {
        throw new Error('Invalid choice');
      }

      // 检查要求
      if (choice.requirements) {
        for (const [req, value] of Object.entries(choice.requirements)) {
          if ((storyState.context[req] || 0) < value) {
            return {
              success: false,
              reason: `需要${req} >= ${value}，当前: ${storyState.context[req] || 0}`
            };
          }
        }
      }

      // 应用效果
      const effects = choice.effects || {};
      for (const [effect, value] of Object.entries(effects)) {
        storyState.context[effect] = (storyState.context[effect] || 0) + value;
      }

      // 生成选择结果图片
      let choiceImage = null;
      if (choice.imagePrompt) {
        try {
          choiceImage = await this.imageService.generateImage(choice.imagePrompt, {
            style: 'fantasy',
            quality: 'high',
            size: '1024x1024'
          });
        } catch (imageError) {
          logger.warn('Failed to generate choice image:', imageError);
        }
      }

      // 记录历史
      storyState.history.push({
        nodeId: currentNode.id,
        choiceId,
        effects,
        timestamp: new Date().toISOString()
      });

      // 生成后续故事或结束
      const shouldContinue = Math.random() > 0.3; // 70%概率继续
      
      if (shouldContinue && storyState.history.length < 5) {
        // 生成新的故事节点
        const nextStory = await this.generateNextStory(storyState);
        storyState.currentNode = nextStory;
        
        return {
          success: true,
          effects,
          nextNode: nextStory,
          choiceImage,
          storyState
        };
      } else {
        // 故事结束
        this.currentStories.delete(playerId);
        const endingImage = await this.generateEndingImage(storyState);
        
        return {
          success: true,
          effects,
          storyComplete: true,
          endingImage,
          storyState
        };
      }

    } catch (error) {
      logger.error('Failed to process choice:', error);
      throw error;
    }
  }

  /**
   * 生成下一个故事节点
   */
  async generateNextStory(storyState) {
    // 基于当前状态选择合适的故事类型
    const context = storyState.context;
    let storyType;
    
    if (context.wisdom >= 5) {
      storyType = 'discovery';
    } else if (context.courage >= 5) {
      storyType = 'challenge';
    } else {
      storyType = 'encounter';
    }

    // 选择新的生物
    const creatureCategories = Object.keys(this.mythicalCreatures);
    const randomCategory = creatureCategories[Math.floor(Math.random() * creatureCategories.length)];
    const creatures = this.mythicalCreatures[randomCategory];
    const selectedCreature = creatures[Math.floor(Math.random() * creatures.length)];

    const template = this.storyTemplates[storyType];
    const description = template.generateDescription(selectedCreature, context);
    const choices = template.generateChoices(selectedCreature, context).slice(0, 3);

    return {
      id: `${storyType}_${Date.now()}`,
      type: storyType,
      title: template.title,
      description: description,
      choices: choices,
      creature: selectedCreature,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成结局图片
   */
  async generateEndingImage(storyState) {
    try {
      const context = storyState.context;
      const petName = context.petName || '神秘伙伴';
      
      let endingType = 'peaceful';
      if (context.courage >= 8) endingType = 'heroic';
      else if (context.wisdom >= 8) endingType = 'wise';
      else if (context.bond >= 10) endingType = 'harmonious';

      const endingPrompts = {
        peaceful: `${petName} and trainer in peaceful mountain landscape at sunset, Chinese mythology style`,
        heroic: `${petName} and trainer standing victorious on mountain peak, epic Chinese fantasy art`,
        wise: `${petName} and trainer in ancient library with mystical scrolls, wisdom and knowledge theme`,
        harmonious: `${petName} and trainer in perfect harmony, surrounded by mystical creatures, unity theme`
      };

      return await this.imageService.generateImage(endingPrompts[endingType], {
        style: 'fantasy',
        quality: 'high',
        size: '1024x1024'
      });
    } catch (error) {
      logger.warn('Failed to generate ending image:', error);
      return null;
    }
  }

  /**
   * 获取随机地点
   */
  getRandomLocation() {
    const locations = [
      '昆仑山脉深处', '东海之滨', '西王母瑶池', '不周山下', '蓬莱仙岛',
      '九重天阙', '幽冥地府', '桃花源中', '天山雪峰', '南海龙宫',
      '北冥之海', '瀛洲仙境', '方丈山中', '流沙河畔', '火焰山下'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * 获取当前故事状态
   */
  getCurrentStory(playerId) {
    return this.currentStories.get(playerId);
  }

  /**
   * 获取所有神话生物
   */
  getAllCreatures() {
    const allCreatures = [];
    for (const category of Object.values(this.mythicalCreatures)) {
      allCreatures.push(...category);
    }
    return allCreatures;
  }
}

module.exports = EnhancedStorySystem;