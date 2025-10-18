/**
 * 剧情树引擎 - 类似影游的分支剧情系统
 * 支持随机事件、选择分支、结果反馈
 */

const logger = require('../utils/logger');

class StoryTreeEngine {
  constructor(aiService) {
    this.aiService = aiService;
    this.storyTrees = this.initializeStoryTrees();
    this.currentStories = new Map(); // playerId -> currentStoryState
  }

  /**
   * 初始化剧情树模板
   */
  initializeStoryTrees() {
    return {
      // 山海经探索剧情树
      shanhai_exploration: {
        id: 'shanhai_exploration',
        title: '山海经秘境探索',
        description: '在神秘的山海经世界中展开冒险',
        startNode: 'forest_entrance',
        nodes: {
          forest_entrance: {
            id: 'forest_entrance',
            type: 'event',
            title: '神秘森林入口',
            description: '你和{petName}来到一片被迷雾笼罩的古老森林前，空气中弥漫着神秘的灵力波动。',
            choices: [
              {
                id: 'enter_boldly',
                text: '🗡️ 勇敢进入森林深处',
                requirements: { courage: 3 },
                nextNode: 'deep_forest_encounter'
              },
              {
                id: 'careful_observation',
                text: '👁️ 仔细观察周围环境',
                requirements: { wisdom: 2 },
                nextNode: 'forest_clue_discovery'
              },
              {
                id: 'seek_guidance',
                text: '🙏 寻求宠物的意见',
                requirements: { bond: 5 },
                nextNode: 'pet_guidance'
              }
            ]
          },
          
          deep_forest_encounter: {
            id: 'deep_forest_encounter',
            type: 'encounter',
            title: '深林奇遇',
            description: '深入森林后，你们遇到了一只受伤的{encounterCreature}，它的眼中闪烁着求助的光芒。',
            choices: [
              {
                id: 'help_creature',
                text: '💚 立即救助这只生物',
                effects: { bond: +2, karma: +1 },
                nextNode: 'creature_gratitude'
              },
              {
                id: 'cautious_approach',
                text: '⚠️ 谨慎接近观察',
                effects: { wisdom: +1 },
                nextNode: 'creature_test'
              },
              {
                id: 'ignore_continue',
                text: '🚶 无视继续前进',
                effects: { courage: +1, karma: -1 },
                nextNode: 'forest_depths'
              }
            ]
          },
          
          forest_clue_discovery: {
            id: 'forest_clue_discovery',
            type: 'discovery',
            title: '线索发现',
            description: '通过仔细观察，你发现了{clueType}，这可能是解开森林秘密的关键。',
            choices: [
              {
                id: 'follow_clue',
                text: '🔍 跟随线索深入调查',
                effects: { wisdom: +2, exp: +10 },
                nextNode: 'hidden_shrine'
              },
              {
                id: 'mark_location',
                text: '📍 标记位置稍后再来',
                effects: { wisdom: +1 },
                nextNode: 'safe_retreat'
              }
            ]
          },
          
          pet_guidance: {
            id: 'pet_guidance',
            type: 'bond',
            title: '宠物指引',
            description: '{petName}感受到你的信任，{petReaction}。你们之间的羁绊更加深厚。',
            choices: [
              {
                id: 'follow_pet',
                text: '🐾 跟随宠物的指引',
                effects: { bond: +3, exp: +5 },
                nextNode: 'secret_path'
              },
              {
                id: 'combine_wisdom',
                text: '🤝 结合你们的智慧',
                effects: { bond: +2, wisdom: +1 },
                nextNode: 'perfect_solution'
              }
            ]
          },
          
          creature_gratitude: {
            id: 'creature_gratitude',
            type: 'reward',
            title: '生物的感激',
            description: '被救助的{encounterCreature}为了感谢你们，{rewardDescription}。',
            choices: [
              {
                id: 'accept_gift',
                text: '🎁 接受这份珍贵的礼物',
                effects: { exp: +15, item: 'mystery_gift' },
                nextNode: 'story_end_positive'
              },
              {
                id: 'decline_politely',
                text: '🙏 礼貌地谢绝礼物',
                effects: { karma: +2, bond: +1 },
                nextNode: 'moral_reward'
              }
            ]
          },
          
          story_end_positive: {
            id: 'story_end_positive',
            type: 'ending',
            title: '完美结局',
            description: '这次冒险让你和{petName}都收获颇丰，{endingDescription}。',
            effects: { exp: +20, bond: +3, achievement: 'forest_hero' },
            nextStories: ['mountain_expedition', 'ocean_depths']
          }
        }
      },
      
      // 宠物成长剧情树
      pet_growth: {
        id: 'pet_growth',
        title: '宠物成长历程',
        description: '见证宠物的成长与蜕变',
        startNode: 'growth_milestone',
        nodes: {
          growth_milestone: {
            id: 'growth_milestone',
            type: 'milestone',
            title: '成长里程碑',
            description: '{petName}达到了新的成长阶段，{growthDescription}。',
            choices: [
              {
                id: 'intensive_training',
                text: '💪 进行强化训练',
                effects: { attack: +3, defense: +2, exp: +10 },
                nextNode: 'training_results'
              },
              {
                id: 'bond_deepening',
                text: '💝 加深情感羁绊',
                effects: { bond: +5, special_ability: true },
                nextNode: 'bond_evolution'
              },
              {
                id: 'explore_potential',
                text: '🔮 探索隐藏潜力',
                effects: { magic: +4, hidden_trait: true },
                nextNode: 'potential_awakening'
              }
            ]
          }
        }
      },
      
      // 战斗剧情树
      battle_scenarios: {
        id: 'battle_scenarios',
        title: '战斗试炼',
        description: '在战斗中证明实力',
        startNode: 'battle_challenge',
        nodes: {
          battle_challenge: {
            id: 'battle_challenge',
            type: 'battle',
            title: '战斗挑战',
            description: '一只{opponentType}向你们发起了挑战，{battleDescription}。',
            choices: [
              {
                id: 'accept_challenge',
                text: '⚔️ 接受挑战',
                nextNode: 'battle_preparation'
              },
              {
                id: 'try_negotiation',
                text: '🗣️ 尝试和平解决',
                requirements: { wisdom: 4 },
                nextNode: 'peaceful_resolution'
              },
              {
                id: 'strategic_retreat',
                text: '🏃 战略性撤退',
                effects: { wisdom: +1 },
                nextNode: 'retreat_consequences'
              }
            ]
          }
        }
      }
    };
  }

  /**
   * 开始新的剧情
   */
  async startStory(playerId, storyType, context = {}) {
    try {
      const storyTree = this.storyTrees[storyType];
      if (!storyTree) {
        throw new Error(`Story type ${storyType} not found`);
      }

      const startNode = storyTree.nodes[storyTree.startNode];
      const storyState = {
        playerId,
        storyId: storyTree.id,
        currentNodeId: storyTree.startNode,
        context,
        history: [],
        effects: {},
        startTime: new Date().toISOString()
      };

      this.currentStories.set(playerId, storyState);

      // 生成动态内容
      const dynamicContent = await this.generateDynamicContent(startNode, context);
      
      return {
        success: true,
        storyState,
        currentNode: {
          ...startNode,
          ...dynamicContent
        }
      };

    } catch (error) {
      logger.error('Failed to start story:', error);
      throw error;
    }
  }

  /**
   * 处理玩家选择
   */
  async makeChoice(playerId, choiceId) {
    try {
      const storyState = this.currentStories.get(playerId);
      if (!storyState) {
        throw new Error('No active story found for player');
      }

      const storyTree = this.storyTrees[storyState.storyId];
      const currentNode = storyTree.nodes[storyState.currentNodeId];
      const choice = currentNode.choices.find(c => c.id === choiceId);

      if (!choice) {
        throw new Error('Invalid choice');
      }

      // 检查选择要求
      const canMakeChoice = this.checkChoiceRequirements(choice, storyState.context);
      if (!canMakeChoice.allowed) {
        return {
          success: false,
          reason: canMakeChoice.reason,
          requirements: choice.requirements
        };
      }

      // 应用选择效果
      const effects = await this.applyChoiceEffects(choice, storyState);

      // 记录选择历史
      storyState.history.push({
        nodeId: storyState.currentNodeId,
        choiceId,
        timestamp: new Date().toISOString(),
        effects
      });

      // 移动到下一个节点
      if (choice.nextNode) {
        storyState.currentNodeId = choice.nextNode;
        const nextNode = storyTree.nodes[choice.nextNode];
        
        // 生成下一个节点的动态内容
        const dynamicContent = await this.generateDynamicContent(nextNode, storyState.context);
        
        return {
          success: true,
          effects,
          nextNode: {
            ...nextNode,
            ...dynamicContent
          },
          storyState
        };
      } else {
        // 故事结束
        this.currentStories.delete(playerId);
        return {
          success: true,
          effects,
          storyComplete: true,
          storyState
        };
      }

    } catch (error) {
      logger.error('Failed to process choice:', error);
      throw error;
    }
  }

  /**
   * 检查选择要求
   */
  checkChoiceRequirements(choice, context) {
    if (!choice.requirements) {
      return { allowed: true };
    }

    for (const [requirement, value] of Object.entries(choice.requirements)) {
      const currentValue = context[requirement] || 0;
      if (currentValue < value) {
        return {
          allowed: false,
          reason: `需要${requirement} >= ${value}，当前值: ${currentValue}`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * 应用选择效果
   */
  async applyChoiceEffects(choice, storyState) {
    const effects = choice.effects || {};
    const appliedEffects = {};

    for (const [effect, value] of Object.entries(effects)) {
      switch (effect) {
        case 'exp':
          appliedEffects.exp = value;
          storyState.context.exp = (storyState.context.exp || 0) + value;
          break;
        case 'bond':
          appliedEffects.bond = value;
          storyState.context.bond = (storyState.context.bond || 0) + value;
          break;
        case 'attack':
        case 'defense':
        case 'magic':
        case 'wisdom':
        case 'courage':
          appliedEffects[effect] = value;
          storyState.context[effect] = (storyState.context[effect] || 0) + value;
          break;
        case 'item':
        case 'rare_item':
          appliedEffects.item = await this.generateRewardItem(effect, value);
          break;
        case 'achievement':
          appliedEffects.achievement = value;
          break;
        default:
          appliedEffects[effect] = value;
      }
    }

    return appliedEffects;
  }

  /**
   * 生成动态内容
   */
  async generateDynamicContent(node, context) {
    try {
      if (!node) {
        return { description: '在这片神秘的土地上，发生了一些有趣的事情...' };
      }
      
      const petName = context.petName || '你的宠物';
      let description = node.description || '在这片神秘的土地上，发生了一些有趣的事情...';

      // 替换模板变量
      description = description.replace(/{petName}/g, petName);

      // 根据节点类型生成特定内容
      switch (node.type) {
        case 'encounter':
          const creatures = [
            '九尾狐', '青鸾', '白泽', '麒麟', '凤凰', '龙龟', '朱雀', '玄武', '青龙', '白虎',
            '鲲鹏', '饕餮', '混沌', '穷奇', '梼杌', '烛龙', '应龙', '螣蛇', '勾陈', '腾蛇',
            '比翼鸟', '重明鸟', '精卫', '鸾鸟', '毕方', '獬豸', '夔牛', '犼', '狻猊', '椒图'
          ];
          const encounterCreature = creatures[Math.floor(Math.random() * creatures.length)];
          description = description.replace(/{encounterCreature}/g, encounterCreature);
          break;

        case 'discovery':
          const clueTypes = [
            '<span class="clue-item">古老的石碑</span>',
            '<span class="clue-item">发光的符文</span>',
            '<span class="clue-item">神秘的足迹</span>',
            '<span class="clue-item">闪烁的宝石</span>',
            '<span class="clue-item">古代的卷轴</span>'
          ];
          const clueType = clueTypes[Math.floor(Math.random() * clueTypes.length)];
          description = description.replace(/{clueType}/g, clueType);
          break;

        case 'challenge':
          const challenges = [
            '<span class="challenge-item">需要解开古老的谜题</span>',
            '<span class="challenge-item">必须通过勇气的考验</span>',
            '<span class="challenge-item">要展示智慧和耐心</span>'
          ];
          const challengeType = challenges[Math.floor(Math.random() * challenges.length)];
          description = description.replace(/{challengeType}/g, challengeType);
          break;

        case 'bond':
          const reactions = [
            '<span class="bond-item">轻轻蹭了蹭你的手，眼中满含信任</span>',
            '<span class="bond-item">发出温和的叫声，似乎在安慰你</span>',
            '<span class="bond-item">用鼻子嗅了嗅空气，然后坚定地看向某个方向</span>'
          ];
          const petReaction = reactions[Math.floor(Math.random() * reactions.length)];
          description = description.replace(/{petReaction}/g, petReaction);
          break;

        case 'reward':
          const rewards = [
            '<span class="reward-item">送给你们一颗闪闪发光的灵珠</span>',
            '<span class="reward-item">用法术为你们祝福</span>',
            '<span class="reward-item">告诉了你们一个古老的秘密</span>'
          ];
          const rewardDescription = rewards[Math.floor(Math.random() * rewards.length)];
          description = description.replace(/{rewardDescription}/g, rewardDescription);
          break;
      }

      return { description };

    } catch (error) {
      logger.error('Failed to generate dynamic content:', error);
      return { description: node.description || '在这片神秘的土地上，发生了一些有趣的事情...' };
    }
  }

  /**
   * 生成奖励物品
   */
  async generateRewardItem(type, value) {
    const items = {
      mystery_gift: {
        name: '神秘礼物',
        description: '一个散发着神秘光芒的小盒子',
        rarity: 'rare'
      },
      rare_item: {
        name: '稀有宝物',
        description: '传说中的神器碎片',
        rarity: 'legendary'
      }
    };

    return items[value] || items.mystery_gift;
  }

  /**
   * 获取可用的剧情类型
   */
  getAvailableStories(context = {}) {
    const available = [];
    
    for (const [storyType, story] of Object.entries(this.storyTrees)) {
      // 根据玩家状态判断是否可用
      let isAvailable = true;
      
      // 这里可以添加更复杂的可用性逻辑
      if (storyType === 'battle_scenarios' && (context.level || 1) < 5) {
        isAvailable = false;
      }
      
      if (isAvailable) {
        available.push({
          id: storyType,
          title: story.title,
          description: story.description
        });
      }
    }
    
    return available;
  }

  /**
   * 获取玩家当前故事状态
   */
  getCurrentStory(playerId) {
    return this.currentStories.get(playerId);
  }

  /**
   * 清理过期的故事状态
   */
  cleanupExpiredStories() {
    const now = new Date();
    const expireTime = 24 * 60 * 60 * 1000; // 24小时

    for (const [playerId, storyState] of this.currentStories.entries()) {
      const startTime = new Date(storyState.startTime);
      if (now - startTime > expireTime) {
        this.currentStories.delete(playerId);
        logger.info(`Cleaned up expired story for player ${playerId}`);
      }
    }
  }
}

module.exports = StoryTreeEngine;