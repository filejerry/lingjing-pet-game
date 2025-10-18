/**
 * 宠物进化路径体系
 * 定义完整的进化树和分支路线
 */

const logger = require('../utils/logger');

/**
 * 进化路径定义
 * 每个宠物有3条主要进化路线:力量/速度/智慧
 */
const EVOLUTION_PATHS = {
  // 龙族进化路径
  幼龙: {
    species: '幼龙',
    rarity: 'N',
    baseStats: { health: 100, attack: 15, defense: 10, speed: 12, magic: 8 },
    evolutionLevel: 0,
    branches: {
      // 力量路线(攻击型)
      power: {
        name: '力量觉醒',
        description: '走上追求极致力量的道路',
        requirements: {
          level: 20,
          bondLevel: 20,
          behaviorTendency: 'aggressive', // 攻击倾向
          minBattles: 10
        },
        evolution: {
          species: '烈焰龙',
          rarity: 'R',
          statBonus: { health: 50, attack: 40, defense: 15, speed: 10, magic: 10 },
          newTraits: ['烈焰吐息', '龙威', '坚韧鳞甲'],
          element: '火'
        }
      },

      // 速度路线(敏捷型)
      speed: {
        name: '疾风化身',
        description: '追求极致速度与灵巧',
        requirements: {
          level: 20,
          bondLevel: 20,
          behaviorTendency: 'agile',
          minEscapes: 5 // 成功逃脱次数
        },
        evolution: {
          species: '风龙',
          rarity: 'R',
          statBonus: { health: 40, attack: 25, defense: 10, speed: 50, magic: 15 },
          newTraits: ['疾风', '闪避', '风之祝福'],
          element: '风'
        }
      },

      // 智慧路线(魔法型)
      wisdom: {
        name: '智慧觉醒',
        description: '掌握古老龙族的魔法秘密',
        requirements: {
          level: 20,
          bondLevel: 30, // 需要更高羁绊
          behaviorTendency: 'strategic',
          itemsUsed: 10 // 使用道具次数
        },
        evolution: {
          species: '灵龙',
          rarity: 'R',
          statBonus: { health: 45, attack: 20, defense: 20, speed: 15, magic: 50 },
          newTraits: ['龙语魔法', '智慧之眼', '魔力涌动'],
          element: '灵'
        }
      }
    }
  },

  // 烈焰龙二段进化
  烈焰龙: {
    species: '烈焰龙',
    rarity: 'R',
    evolutionLevel: 1,
    branches: {
      power: {
        name: '炎帝之路',
        requirements: {
          level: 40,
          bondLevel: 40,
          defeatedBosses: 3
        },
        evolution: {
          species: '炎龙',
          rarity: 'SR',
          statBonus: { health: 100, attack: 80, defense: 40, speed: 20, magic: 30 },
          newTraits: ['炎帝之怒', '焚天', '不灭之火'],
          element: '火'
        }
      },
      hybrid: {
        name: '暗炎融合',
        requirements: {
          level: 40,
          bondLevel: 35,
          specialItem: '暗之结晶'
        },
        evolution: {
          species: '暗炎龙',
          rarity: 'SR',
          statBonus: { health: 90, attack: 90, defense: 35, speed: 30, magic: 40 },
          newTraits: ['暗炎', '灼烧', '黑暗吞噬'],
          element: '暗火'
        }
      }
    }
  },

  // 炎龙三段进化(终极)
  炎龙: {
    species: '炎龙',
    rarity: 'SR',
    evolutionLevel: 2,
    branches: {
      ultimate: {
        name: '焚天龙皇',
        requirements: {
          level: 60,
          bondLevel: 60,
          legendaryQuest: '火焰试炼',
          defeatedBosses: 10
        },
        evolution: {
          species: '焚天龙皇',
          rarity: 'SSR',
          statBonus: { health: 200, attack: 150, defense: 80, speed: 50, magic: 70 },
          newTraits: ['龙皇之力', '焚天灭世', '炎之领域', '不死炎魂'],
          element: '火',
          unique: true // 唯一形态
        }
      }
    }
  },

  // 灵狐进化路径
  灵狐: {
    species: '灵狐',
    rarity: 'R',
    evolutionLevel: 0,
    branches: {
      // 幻术路线
      illusion: {
        name: '幻术精通',
        requirements: {
          level: 25,
          bondLevel: 30,
          behaviorTendency: 'deceptive'
        },
        evolution: {
          species: '幻狐',
          rarity: 'SR',
          statBonus: { health: 60, attack: 40, defense: 30, speed: 60, magic: 70 },
          newTraits: ['幻象', '分身', '隐匿'],
          element: '幻'
        }
      },

      // 九尾路线(传说)
      ninetails: {
        name: '九尾觉醒',
        requirements: {
          level: 40,
          bondLevel: 50,
          specialEvent: '月圆之夜',
          purityScore: 80 // 纯净度(不作恶)
        },
        evolution: {
          species: '九尾仙狐',
          rarity: 'SSR',
          statBonus: { health: 150, attack: 60, defense: 50, speed: 100, magic: 150 },
          newTraits: ['九尾神力', '预知', '仙术', '长生'],
          element: '仙',
          legendary: true
        }
      }
    }
  },

  // 更多种族...
  凤凰: {
    species: '凤凰',
    rarity: 'SSR',
    evolutionLevel: 0,
    branches: {
      nirvana: {
        name: '涅槃重生',
        requirements: {
          level: 50,
          bondLevel: 60,
          deaths: 1, // 需要经历一次死亡
          specialItem: '不死之羽'
        },
        evolution: {
          species: '涅槃凤凰',
          rarity: 'SSS',
          statBonus: { health: 300, attack: 100, defense: 100, speed: 120, magic: 200 },
          newTraits: ['涅槃', '不死鸟', '火焰重生', '凤凰之怒', '治愈之光'],
          element: '神火',
          legendary: true,
          unique: true
        }
      }
    }
  }
};

/**
 * 进化行为倾向映射
 */
const BEHAVIOR_TENDENCIES = {
  aggressive: {
    name: '攻击型',
    description: '喜欢主动攻击,战斗风格激进',
    actions: ['attack', 'charge', 'battle', 'hunt'],
    counterActions: ['defend', 'flee', 'hide']
  },

  defensive: {
    name: '防御型',
    description: '注重防守,稳健求胜',
    actions: ['defend', 'block', 'fortify', 'heal'],
    counterActions: ['attack', 'charge', 'aggressive_skill']
  },

  agile: {
    name: '敏捷型',
    description: '快速灵活,擅长闪避',
    actions: ['dodge', 'flee', 'quick_attack', 'scout'],
    counterActions: ['tank', 'slow_attack']
  },

  strategic: {
    name: '策略型',
    description: '善用技能和道具,智取',
    actions: ['use_item', 'skill', 'analyze', 'plan'],
    counterActions: ['reckless', 'brute_force']
  },

  balanced: {
    name: '平衡型',
    description: '攻守兼备,全面发展',
    actions: [], // 无特殊偏好
    counterActions: []
  },

  deceptive: {
    name: '欺诈型',
    description: '善用幻术和诡计',
    actions: ['illusion', 'trick', 'ambush', 'sneak'],
    counterActions: ['direct', 'honest']
  },

  supportive: {
    name: '辅助型',
    description: '擅长治疗和增益',
    actions: ['heal', 'buff', 'support', 'protect'],
    counterActions: ['solo', 'selfish']
  }
};

/**
 * 特殊进化条件
 */
const SPECIAL_CONDITIONS = {
  // 时间条件
  月圆之夜: {
    type: 'time',
    check: () => {
      const now = new Date();
      const day = now.getDate();
      return day === 15; // 每月15日
    }
  },

  满月夜: {
    type: 'time',
    check: () => {
      const now = new Date();
      return now.getHours() >= 22 || now.getHours() <= 4; // 晚上10点-凌晨4点
    }
  },

  // 任务条件
  火焰试炼: {
    type: 'quest',
    questId: 'fire_trial',
    description: '完成火焰神殿的终极试炼'
  },

  // 道具条件
  特殊道具: {
    type: 'item',
    items: ['进化石', '龙之心', '凤凰之羽', '九尾灵珠']
  }
};

/**
 * 进化路径系统类
 */
class EvolutionPathSystem {
  constructor() {
    this.paths = EVOLUTION_PATHS;
    this.tendencies = BEHAVIOR_TENDENCIES;
    this.conditions = SPECIAL_CONDITIONS;
  }

  /**
   * 获取宠物可用的进化路径
   */
  getAvailablePaths(pet, userProgress = {}) {
    const speciesPath = this.paths[pet.species];

    if (!speciesPath || !speciesPath.branches) {
      return [];
    }

    const availablePaths = [];

    for (const [pathKey, pathData] of Object.entries(speciesPath.branches)) {
      const meetsRequirements = this.checkRequirements(
        pet,
        pathData.requirements,
        userProgress
      );

      availablePaths.push({
        key: pathKey,
        name: pathData.name,
        description: pathData.description,
        available: meetsRequirements.met,
        requirements: pathData.requirements,
        missing: meetsRequirements.missing,
        evolution: pathData.evolution,
        progress: meetsRequirements.progress
      });
    }

    return availablePaths;
  }

  /**
   * 检查是否满足进化要求
   */
  checkRequirements(pet, requirements, userProgress) {
    const missing = [];
    const progress = {};

    // 检查等级
    if (requirements.level && pet.level < requirements.level) {
      missing.push(`等级需达到${requirements.level}(当前${pet.level})`);
      progress.level = { current: pet.level, required: requirements.level };
    }

    // 检查羁绊
    if (requirements.bondLevel && pet.bond_level < requirements.bondLevel) {
      missing.push(`羁绊需达到${requirements.bondLevel}(当前${pet.bond_level})`);
      progress.bondLevel = { current: pet.bond_level, required: requirements.bondLevel };
    }

    // 检查行为倾向
    if (requirements.behaviorTendency) {
      const currentTendency = this.analyzeBehaviorTendency(pet);
      if (currentTendency !== requirements.behaviorTendency) {
        missing.push(`需要${this.tendencies[requirements.behaviorTendency].name}倾向`);
      }
    }

    // 检查战斗次数
    if (requirements.minBattles && userProgress.battles < requirements.minBattles) {
      missing.push(`需要战斗${requirements.minBattles}次(当前${userProgress.battles || 0}次)`);
      progress.battles = { current: userProgress.battles || 0, required: requirements.minBattles };
    }

    // 检查击败Boss数
    if (requirements.defeatedBosses && userProgress.bossesDefeated < requirements.defeatedBosses) {
      missing.push(`需击败${requirements.defeatedBosses}个Boss(当前${userProgress.bossesDefeated || 0}个)`);
    }

    // 检查特殊道具
    if (requirements.specialItem) {
      const hasItem = userProgress.inventory?.includes(requirements.specialItem);
      if (!hasItem) {
        missing.push(`需要道具:${requirements.specialItem}`);
      }
    }

    // 检查特殊事件
    if (requirements.specialEvent) {
      const eventMet = this.checkSpecialCondition(requirements.specialEvent);
      if (!eventMet) {
        missing.push(`需要触发事件:${requirements.specialEvent}`);
      }
    }

    // 检查传说任务
    if (requirements.legendaryQuest) {
      const questCompleted = userProgress.completedQuests?.includes(requirements.legendaryQuest);
      if (!questCompleted) {
        missing.push(`需完成任务:${requirements.legendaryQuest}`);
      }
    }

    return {
      met: missing.length === 0,
      missing,
      progress
    };
  }

  /**
   * 检查特殊条件
   */
  checkSpecialCondition(conditionName) {
    const condition = this.conditions[conditionName];
    if (!condition) return false;

    if (condition.type === 'time' && condition.check) {
      return condition.check();
    }

    return false;
  }

  /**
   * 分析宠物行为倾向
   */
  analyzeBehaviorTendency(pet) {
    // 从宠物的行为历史中分析
    // 这里简化处理,实际应该从数据库读取行为记录
    const behaviorHistory = pet.behaviorHistory || [];

    if (behaviorHistory.length === 0) {
      return 'balanced';
    }

    // 统计各类行为次数
    const tendencyScores = {};

    for (const tendency in this.tendencies) {
      tendencyScores[tendency] = 0;
    }

    for (const action of behaviorHistory) {
      for (const [tendency, data] of Object.entries(this.tendencies)) {
        if (data.actions.includes(action)) {
          tendencyScores[tendency]++;
        }
        if (data.counterActions.includes(action)) {
          tendencyScores[tendency]--;
        }
      }
    }

    // 返回得分最高的倾向
    let maxTendency = 'balanced';
    let maxScore = 0;

    for (const [tendency, score] of Object.entries(tendencyScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxTendency = tendency;
      }
    }

    return maxTendency;
  }

  /**
   * 执行进化
   */
  async executeEvolution(pet, pathKey, aiStory = null) {
    const speciesPath = this.paths[pet.species];

    if (!speciesPath || !speciesPath.branches[pathKey]) {
      throw new Error('无效的进化路径');
    }

    const evolutionData = speciesPath.branches[pathKey].evolution;

    // 应用进化
    const evolvedPet = {
      ...pet,
      species: evolutionData.species,
      rarity: evolutionData.rarity,
      health: pet.health + evolutionData.statBonus.health,
      attack: pet.attack + evolutionData.statBonus.attack,
      defense: pet.defense + evolutionData.statBonus.defense,
      speed: pet.speed + evolutionData.statBonus.speed,
      magic: pet.magic + evolutionData.statBonus.magic,
      special_traits: JSON.stringify([
        ...JSON.parse(pet.special_traits || '[]'),
        ...evolutionData.newTraits
      ]),
      element_type: evolutionData.element,
      last_evolution: new Date().toISOString(),
      evolution_stage: (pet.evolution_stage || 0) + 1
    };

    // 记录进化历史
    const evolutionRecord = {
      petId: pet.id,
      from: pet.species,
      to: evolutionData.species,
      fromRarity: pet.rarity,
      toRarity: evolutionData.rarity,
      path: pathKey,
      aiStory,
      statsBefore: {
        health: pet.health,
        attack: pet.attack,
        defense: pet.defense,
        speed: pet.speed,
        magic: pet.magic
      },
      statsAfter: {
        health: evolvedPet.health,
        attack: evolvedPet.attack,
        defense: evolvedPet.defense,
        speed: evolvedPet.speed,
        magic: evolvedPet.magic
      }
    };

    return {
      evolvedPet,
      evolutionRecord,
      newTraits: evolutionData.newTraits,
      isLegendary: evolutionData.legendary || false,
      isUnique: evolutionData.unique || false
    };
  }

  /**
   * 获取进化树(可视化用)
   */
  getEvolutionTree(species) {
    const buildTree = (currentSpecies, visited = new Set()) => {
      if (visited.has(currentSpecies)) return null;
      visited.add(currentSpecies);

      const path = this.paths[currentSpecies];
      if (!path) return null;

      const node = {
        species: currentSpecies,
        rarity: path.rarity,
        level: path.evolutionLevel,
        children: []
      };

      if (path.branches) {
        for (const [key, data] of Object.entries(path.branches)) {
          const childNode = buildTree(data.evolution.species, visited);
          if (childNode) {
            childNode.pathKey = key;
            childNode.pathName = data.name;
            childNode.requirements = data.requirements;
            node.children.push(childNode);
          }
        }
      }

      return node;
    };

    return buildTree(species);
  }

  /**
   * 获取所有进化路径统计
   */
  getStatistics() {
    let totalSpecies = 0;
    let totalPaths = 0;
    let legendaryCount = 0;

    for (const [species, data] of Object.entries(this.paths)) {
      totalSpecies++;
      if (data.branches) {
        totalPaths += Object.keys(data.branches).length;

        for (const pathData of Object.values(data.branches)) {
          if (pathData.evolution.legendary) {
            legendaryCount++;
          }
        }
      }
    }

    return {
      totalSpecies,
      totalPaths,
      legendaryCount,
      averagePathsPerSpecies: (totalPaths / totalSpecies).toFixed(2)
    };
  }
}

module.exports = {
  EvolutionPathSystem,
  EVOLUTION_PATHS,
  BEHAVIOR_TENDENCIES,
  SPECIAL_CONDITIONS
};
