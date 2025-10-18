/**
 * 进化系统 - 四层渐进式成长架构
 * 幼年期 -> 成长期 -> 成熟期 -> 完全体
 */

const logger = require('../utils/logger');

class EvolutionSystem {
  constructor(aiService, imageService) {
    this.aiService = aiService;
    this.imageService = imageService;
    
    // 四层进化阶段配置
    this.evolutionStages = {
      juvenile: {
        name: '幼年期',
        level: 0,
        maxLevel: 10,
        evolutionThreshold: {
          exp: 100,
          bond: 20,
          interactions: 5
        },
        difficulty: 'easy',
        description: '刚刚诞生的小生命，充满好奇心'
      },
      growth: {
        name: '成长期',
        level: 10,
        maxLevel: 25,
        evolutionThreshold: {
          exp: 500,
          bond: 50,
          battles: 3,
          explorations: 2
        },
        difficulty: 'medium',
        description: '开始展现天赋，渴望冒险'
      },
      mature: {
        name: '成熟期',
        level: 25,
        maxLevel: 50,
        evolutionThreshold: {
          exp: 1500,
          bond: 100,
          battles: 10,
          explorations: 5,
          specialEvents: 1
        },
        difficulty: 'hard',
        description: '实力强大，智慧深邃'
      },
      perfect: {
        name: '完全体',
        level: 50,
        maxLevel: 100,
        evolutionThreshold: {
          exp: 5000,
          bond: 200,
          battles: 25,
          explorations: 15,
          specialEvents: 3,
          legendaryQuest: 1
        },
        difficulty: 'legendary',
        description: '传说中的存在，拥有改变世界的力量'
      }
    };

    // 山海经生物进化链
    this.evolutionChains = {
      dragon: {
        juvenile: ['小龙', '龙蛋', '幼龙'],
        growth: ['青龙', '火龙', '冰龙', '雷龙'],
        mature: ['神龙', '应龙', '烛龙', '螣蛇'],
        perfect: ['祖龙', '天龙', '帝龙', '混沌龙']
      },
      phoenix: {
        juvenile: ['小凤', '雏鸟', '火雀'],
        growth: ['朱雀', '青鸾', '鸾鸟', '比翼鸟'],
        mature: ['凤凰', '重明鸟', '毕方', '精卫'],
        perfect: ['天凤', '九天玄鸟', '不死鸟', '涅槃凤']
      },
      qilin: {
        juvenile: ['小麒', '独角兽', '幼麟'],
        growth: ['麒麟', '白泽', '獬豸', '夔牛'],
        mature: ['神麒', '瑞兽', '圣麟', '天麒'],
        perfect: ['祖麒', '帝麟', '混元麒麟', '太初圣兽']
      },
      fox: {
        juvenile: ['小狐', '狐崽', '灵狐'],
        growth: ['三尾狐', '五尾狐', '七尾狐', '白狐'],
        mature: ['九尾狐', '天狐', '妖狐', '仙狐'],
        perfect: ['狐仙', '天狐帝', '混沌狐', '太古狐祖']
      }
    };
  }

  /**
   * 检查是否可以进化
   */
  async checkEvolution(pet, playerStats) {
    try {
      const currentStage = this.getCurrentStage(pet.level);
      const nextStage = this.getNextStage(currentStage);
      
      if (!nextStage) {
        return {
          canEvolve: false,
          reason: '已达到最高进化阶段',
          currentStage: currentStage.name
        };
      }

      // 检查进化条件
      const conditions = await this.checkEvolutionConditions(pet, playerStats, nextStage);
      
      if (conditions.allMet) {
        // 使用AI判断进化概率
        const evolutionChance = await this.calculateEvolutionChance(pet, playerStats, nextStage);
        
        return {
          canEvolve: evolutionChance.success,
          probability: evolutionChance.probability,
          conditions: conditions,
          nextStage: nextStage.name,
          requirements: nextStage.evolutionThreshold
        };
      } else {
        return {
          canEvolve: false,
          conditions: conditions,
          nextStage: nextStage.name,
          requirements: nextStage.evolutionThreshold
        };
      }

    } catch (error) {
      logger.error('Evolution check failed:', error);
      throw error;
    }
  }

  /**
   * 执行进化
   */
  async executeEvolution(pet, playerStats) {
    try {
      const currentStage = this.getCurrentStage(pet.level);
      const nextStage = this.getNextStage(currentStage);
      
      if (!nextStage) {
        throw new Error('无法进化：已达最高阶段');
      }

      // 生成进化剧情
      const evolutionStory = await this.generateEvolutionStory(pet, currentStage, nextStage);
      
      // 选择新的进化形态
      const newForm = await this.selectEvolutionForm(pet, nextStage);
      
      // 生成进化场景图片
      const sceneImage = await this.generateEvolutionImage(pet, newForm, nextStage);
      
      // 计算新属性
      const newStats = this.calculateEvolutionStats(pet, nextStage);
      
      // 应用进化结果
      const evolvedPet = {
        ...pet,
        name: newForm.name,
        species: newForm.species,
        stage: nextStage.name,
        level: Math.max(pet.level, nextStage.level),
        stats: newStats,
        evolutionHistory: [...(pet.evolutionHistory || []), {
          from: pet.name,
          to: newForm.name,
          stage: nextStage.name,
          timestamp: new Date().toISOString()
        }]
      };

      return {
        success: true,
        beforeEvolution: {
          name: pet.name,
          stage: currentStage.name,
          stats: pet.stats
        },
        afterEvolution: {
          name: newForm.name,
          stage: nextStage.name,
          stats: newStats
        },
        story: evolutionStory,
        sceneImage: sceneImage,
        evolvedPet: evolvedPet
      };

    } catch (error) {
      logger.error('Evolution execution failed:', error);
      throw error;
    }
  }

  /**
   * 获取当前阶段
   */
  getCurrentStage(level) {
    if (level < 10) return this.evolutionStages.juvenile;
    if (level < 25) return this.evolutionStages.growth;
    if (level < 50) return this.evolutionStages.mature;
    return this.evolutionStages.perfect;
  }

  /**
   * 获取下一阶段
   */
  getNextStage(currentStage) {
    const stages = ['juvenile', 'growth', 'mature', 'perfect'];
    const currentIndex = stages.findIndex(stage => 
      this.evolutionStages[stage].name === currentStage.name
    );
    
    if (currentIndex < stages.length - 1) {
      return this.evolutionStages[stages[currentIndex + 1]];
    }
    
    return null;
  }

  /**
   * 检查进化条件
   */
  async checkEvolutionConditions(pet, playerStats, nextStage) {
    const threshold = nextStage.evolutionThreshold;
    const conditions = {
      exp: { required: threshold.exp, current: pet.totalExp || 0, met: false },
      bond: { required: threshold.bond, current: pet.bond || 0, met: false },
      level: { required: nextStage.level, current: pet.level || 0, met: false }
    };

    // 基础条件检查
    conditions.exp.met = conditions.exp.current >= conditions.exp.required;
    conditions.bond.met = conditions.bond.current >= conditions.bond.required;
    conditions.level.met = conditions.level.current >= conditions.level.required;

    // 高级条件检查
    if (threshold.battles) {
      conditions.battles = {
        required: threshold.battles,
        current: playerStats.battles || 0,
        met: (playerStats.battles || 0) >= threshold.battles
      };
    }

    if (threshold.explorations) {
      conditions.explorations = {
        required: threshold.explorations,
        current: playerStats.explorations || 0,
        met: (playerStats.explorations || 0) >= threshold.explorations
      };
    }

    if (threshold.specialEvents) {
      conditions.specialEvents = {
        required: threshold.specialEvents,
        current: playerStats.specialEvents || 0,
        met: (playerStats.specialEvents || 0) >= threshold.specialEvents
      };
    }

    if (threshold.legendaryQuest) {
      conditions.legendaryQuest = {
        required: threshold.legendaryQuest,
        current: playerStats.legendaryQuest || 0,
        met: (playerStats.legendaryQuest || 0) >= threshold.legendaryQuest
      };
    }

    // 检查所有条件是否满足
    const allMet = Object.values(conditions).every(condition => condition.met);

    return {
      conditions,
      allMet,
      summary: this.generateConditionSummary(conditions, allMet)
    };
  }

  /**
   * 使用AI计算进化概率
   */
  async calculateEvolutionChance(pet, playerStats, nextStage) {
    try {
      const prompt = `
作为山海经世界的进化判定师，请评估以下宠物的进化概率：

宠物信息：
- 名称：${pet.name}
- 当前等级：${pet.level}
- 经验值：${pet.totalExp}
- 羁绊值：${pet.bond}
- 目标阶段：${nextStage.name}

玩家统计：
- 战斗次数：${playerStats.battles || 0}
- 探索次数：${playerStats.explorations || 0}
- 特殊事件：${playerStats.specialEvents || 0}

请根据以下因素给出进化成功概率（0-100）：
1. 基础条件满足度
2. 宠物与训练师的羁绊深度
3. 最近的成长表现
4. 随机的命运因素

返回格式：
{
  "probability": 85,
  "reasoning": "详细分析原因",
  "success": true/false
}
`;

      const response = await this.aiService.generateContent(prompt);
      const result = JSON.parse(response.content);
      
      // 添加随机因素
      const randomFactor = Math.random() * 100;
      const finalSuccess = randomFactor <= result.probability;

      return {
        probability: result.probability,
        reasoning: result.reasoning,
        success: finalSuccess,
        randomRoll: Math.floor(randomFactor)
      };

    } catch (error) {
      logger.error('Failed to calculate evolution chance:', error);
      // 降级处理：使用简单算法
      const baseProbability = Math.min(90, 50 + (pet.bond || 0) / 2);
      return {
        probability: baseProbability,
        success: Math.random() * 100 <= baseProbability,
        reasoning: '使用基础算法计算'
      };
    }
  }

  /**
   * 生成进化剧情
   */
  async generateEvolutionStory(pet, currentStage, nextStage) {
    try {
      const prompt = `
创作一段山海经风格的宠物进化剧情：

宠物：${pet.name}
从：${currentStage.name} -> ${nextStage.name}

要求：
1. 体现山海经的神话色彩
2. 描述进化过程的神秘与壮观
3. 突出宠物与训练师的羁绊
4. 长度控制在200字以内
5. 语言优美，富有诗意

请创作一段引人入胜的进化描述。
`;

      const response = await this.aiService.generateContent(prompt);
      return response.content;

    } catch (error) {
      logger.error('Failed to generate evolution story:', error);
      return `在天地灵气的包围下，${pet.name}开始了神圣的蜕变。光芒闪烁间，它从${currentStage.name}成功进化为${nextStage.name}，获得了更强大的力量！`;
    }
  }

  /**
   * 选择进化形态
   */
  async selectEvolutionForm(pet, nextStage) {
    try {
      // 根据宠物类型确定进化链
      const petType = this.determinePetType(pet);
      const evolutionChain = this.evolutionChains[petType] || this.evolutionChains.dragon;
      
      // 获取对应阶段的可选形态
      const stageKey = this.getStageKey(nextStage.name);
      const availableForms = evolutionChain[stageKey] || ['神秘生物'];
      
      // 使用AI选择最适合的形态
      const selectedForm = availableForms[Math.floor(Math.random() * availableForms.length)];
      
      return {
        name: selectedForm,
        species: selectedForm,
        type: petType
      };

    } catch (error) {
      logger.error('Failed to select evolution form:', error);
      return {
        name: pet.name + '·进化',
        species: pet.species || '神秘生物',
        type: 'unknown'
      };
    }
  }

  /**
   * 生成进化场景图片
   */
  async generateEvolutionImage(pet, newForm, nextStage) {
    try {
      if (!this.imageService) {
        return null;
      }

      const imagePrompt = `
山海经风格的宠物进化场景：
- 原形态：${pet.name}
- 新形态：${newForm.name}
- 进化阶段：${nextStage.name}
- 场景：神圣的进化光芒包围，天地灵气汇聚
- 风格：古典中国神话，庄严神圣
- 色调：金光璀璨，神秘梦幻
`;

      const sceneImage = await this.imageService.generateSceneImage({
        prompt: imagePrompt,
        style: '山海经神话风格',
        mood: '神圣庄严',
        scene: '宠物进化仪式'
      });

      return sceneImage;

    } catch (error) {
      logger.error('Failed to generate evolution image:', error);
      return null;
    }
  }

  /**
   * 计算进化后属性
   */
  calculateEvolutionStats(pet, nextStage) {
    const baseStats = pet.stats || {};
    const multiplier = this.getStageMultiplier(nextStage.name);
    
    return {
      hp: Math.floor((baseStats.hp || 50) * multiplier),
      attack: Math.floor((baseStats.attack || 20) * multiplier),
      defense: Math.floor((baseStats.defense || 15) * multiplier),
      speed: Math.floor((baseStats.speed || 10) * multiplier),
      magic: Math.floor((baseStats.magic || 15) * multiplier),
      special: Math.floor(Math.random() * 20) + 10 // 新增特殊属性
    };
  }

  /**
   * 获取阶段倍数
   */
  getStageMultiplier(stageName) {
    const multipliers = {
      '幼年期': 1.0,
      '成长期': 1.5,
      '成熟期': 2.2,
      '完全体': 3.5
    };
    return multipliers[stageName] || 1.0;
  }

  /**
   * 确定宠物类型
   */
  determinePetType(pet) {
    const name = pet.name.toLowerCase();
    if (name.includes('龙') || name.includes('dragon')) return 'dragon';
    if (name.includes('凤') || name.includes('鸟') || name.includes('phoenix')) return 'phoenix';
    if (name.includes('麒') || name.includes('麟') || name.includes('qilin')) return 'qilin';
    if (name.includes('狐') || name.includes('fox')) return 'fox';
    return 'dragon'; // 默认
  }

  /**
   * 获取阶段键名
   */
  getStageKey(stageName) {
    const stageMap = {
      '幼年期': 'juvenile',
      '成长期': 'growth',
      '成熟期': 'mature',
      '完全体': 'perfect'
    };
    return stageMap[stageName] || 'juvenile';
  }

  /**
   * 生成条件总结
   */
  generateConditionSummary(conditions, allMet) {
    const summary = [];
    
    Object.entries(conditions).forEach(([key, condition]) => {
      const status = condition.met ? '✅' : '❌';
      summary.push(`${status} ${key}: ${condition.current}/${condition.required}`);
    });

    return {
      text: summary.join('\n'),
      allMet,
      progress: Object.values(conditions).filter(c => c.met).length / Object.keys(conditions).length
    };
  }

  /**
   * 获取进化建议
   */
  async getEvolutionGuidance(pet, playerStats) {
    try {
      const currentStage = this.getCurrentStage(pet.level);
      const nextStage = this.getNextStage(currentStage);
      
      if (!nextStage) {
        return {
          message: '你的宠物已经达到了传说中的完全体阶段！',
          suggestions: ['继续培养羁绊', '探索更深层的奥秘', '寻找传说中的神器']
        };
      }

      const conditions = await this.checkEvolutionConditions(pet, playerStats, nextStage);
      const suggestions = [];

      Object.entries(conditions.conditions).forEach(([key, condition]) => {
        if (!condition.met) {
          switch (key) {
            case 'exp':
              suggestions.push(`还需要${condition.required - condition.current}点经验值`);
              break;
            case 'bond':
              suggestions.push(`需要加深羁绊${condition.required - condition.current}点`);
              break;
            case 'battles':
              suggestions.push(`还需要进行${condition.required - condition.current}次战斗`);
              break;
            case 'explorations':
              suggestions.push(`还需要完成${condition.required - condition.current}次探索`);
              break;
            case 'specialEvents':
              suggestions.push(`需要经历${condition.required - condition.current}个特殊事件`);
              break;
          }
        }
      });

      return {
        currentStage: currentStage.name,
        nextStage: nextStage.name,
        progress: conditions.summary.progress,
        suggestions: suggestions.length > 0 ? suggestions : ['条件已满足，可以尝试进化！']
      };

    } catch (error) {
      logger.error('Failed to get evolution guidance:', error);
      return {
        message: '无法获取进化指导',
        suggestions: ['继续培养你的宠物']
      };
    }
  }
}

module.exports = EvolutionSystem;