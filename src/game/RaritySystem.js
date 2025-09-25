/**
 * 稀有度系统 - 处理宠物稀有度判定和特殊能力
 */

const mythologyData = require('../data/mythologyData');
const logger = require('../utils/logger');

class RaritySystem {
  constructor() {
    this.rarityConfig = mythologyData.rarityConfig;
    this.evolutionTriggers = mythologyData.evolutionTriggers;
  }

  /**
   * 根据关键词判定宠物稀有度
   */
  calculateRarity(keywords, currentRarity = 'C') {
    let rarityScore = 0;
    let matchedTriggers = [];

    // 检查传说级触发条件
    for (const [creature, triggers] of Object.entries(this.evolutionTriggers.legendary)) {
      const matchCount = triggers.filter(trigger => 
        keywords.some(keyword => keyword.includes(trigger) || trigger.includes(keyword))
      ).length;
      
      if (matchCount >= 3) { // 需要匹配3个以上关键词
        rarityScore += 1000;
        matchedTriggers.push({ creature, type: 'legendary', matchCount });
      }
    }

    // 检查史诗级触发条件
    for (const [creature, triggers] of Object.entries(this.evolutionTriggers.epic)) {
      const matchCount = triggers.filter(trigger => 
        keywords.some(keyword => keyword.includes(trigger) || trigger.includes(keyword))
      ).length;
      
      if (matchCount >= 2) { // 需要匹配2个以上关键词
        rarityScore += 100;
        matchedTriggers.push({ creature, type: 'epic', matchCount });
      }
    }

    // 基础稀有度计算
    const specialKeywords = ['神秘', '古老', '强大', '稀有', '传说', '神圣', '邪恶', '混沌'];
    const specialCount = keywords.filter(k => specialKeywords.includes(k)).length;
    rarityScore += specialCount * 10;

    // 确定最终稀有度
    let newRarity = currentRarity;
    if (rarityScore >= 1000) {
      newRarity = 'SSS';
    } else if (rarityScore >= 100) {
      newRarity = 'SS';
    } else if (rarityScore >= 50) {
      newRarity = 'S';
    } else if (rarityScore >= 20) {
      newRarity = 'A';
    } else if (rarityScore >= 10) {
      newRarity = 'B';
    }

    // 不能降级，只能升级
    if (this.compareRarity(newRarity, currentRarity) > 0) {
      return {
        rarity: newRarity,
        rarityScore,
        matchedTriggers,
        upgraded: true
      };
    }

    return {
      rarity: currentRarity,
      rarityScore,
      matchedTriggers,
      upgraded: false
    };
  }

  /**
   * 比较稀有度等级
   */
  compareRarity(rarity1, rarity2) {
    const levels = { 'C': 0, 'B': 1, 'A': 2, 'S': 3, 'SS': 4, 'SSS': 5 };
    return levels[rarity1] - levels[rarity2];
  }

  /**
   * 获取稀有度配置
   */
  getRarityConfig(rarity) {
    return this.rarityConfig[rarity] || this.rarityConfig['C'];
  }

  /**
   * 生成稀有度特殊能力
   */
  generateSpecialAbilities(rarity, matchedTriggers) {
    const config = this.getRarityConfig(rarity);
    const abilities = [];

    // 基础稀有度能力
    if (config.specialAbilities.length > 0) {
      const randomAbility = config.specialAbilities[
        Math.floor(Math.random() * config.specialAbilities.length)
      ];
      abilities.push({
        name: randomAbility,
        type: 'rarity_bonus',
        description: `${config.title}级宠物的特殊能力`
      });
    }

    // 神话生物特殊能力
    matchedTriggers.forEach(trigger => {
      if (trigger.type === 'legendary') {
        abilities.push({
          name: `${trigger.creature}之力`,
          type: 'mythical',
          description: `觉醒了${trigger.creature}的部分力量`,
          power: trigger.matchCount * 20
        });
      } else if (trigger.type === 'epic') {
        abilities.push({
          name: `${trigger.creature}血脉`,
          type: 'bloodline',
          description: `继承了${trigger.creature}的血脉`,
          power: trigger.matchCount * 10
        });
      }
    });

    return abilities;
  }

  /**
   * 应用稀有度属性加成
   */
  applyRarityBonus(baseStats, rarity) {
    const config = this.getRarityConfig(rarity);
    const multiplier = config.baseStatMultiplier;

    return {
      hp: Math.floor(baseStats.hp * multiplier),
      attack: Math.floor(baseStats.attack * multiplier),
      defense: Math.floor(baseStats.defense * multiplier),
      speed: Math.floor(baseStats.speed * multiplier),
      magic: Math.floor((baseStats.magic || 0) * multiplier),
      resistance: Math.floor((baseStats.resistance || 0) * multiplier)
    };
  }

  /**
   * 生成稀有度显示信息
   */
  generateRarityDisplay(rarity, specialAbilities) {
    const config = this.getRarityConfig(rarity);
    
    return {
      rarity,
      title: config.title,
      color: config.color,
      glow: config.glow,
      specialAbilities: specialAbilities.map(ability => ({
        name: ability.name,
        description: ability.description,
        type: ability.type,
        power: ability.power || 0
      }))
    };
  }

  /**
   * 检查是否触发神话觉醒
   */
  checkMythicalAwakening(pet, keywords) {
    // SSS级宠物有机会觉醒神话形态
    if (pet.rarity === 'SSS') {
      const awakeningKeywords = ['觉醒', '神话', '传说', '真名', '本源'];
      const hasAwakeningTrigger = keywords.some(k => awakeningKeywords.includes(k));
      
      if (hasAwakeningTrigger && Math.random() < 0.1) { // 10%概率
        return this.generateMythicalAwakening(pet);
      }
    }
    
    return null;
  }

  /**
   * 生成神话觉醒
   */
  generateMythicalAwakening(pet) {
    const awakeningForms = [
      '真龙形态', '凤凰涅槃', '麒麟降世', '九尾觉醒', '鲲鹏展翅',
      '白泽显圣', '饕餮吞天', '穷奇降世', '混沌初开', '朱雀焚天'
    ];

    const form = awakeningForms[Math.floor(Math.random() * awakeningForms.length)];
    
    return {
      form,
      description: `${pet.name}觉醒了${form}，获得了前所未有的力量！`,
      bonusStats: {
        hp: 100,
        attack: 50,
        defense: 50,
        speed: 30,
        magic: 80,
        resistance: 60
      },
      specialSkills: [
        '神话领域：展开专属领域，压制敌人',
        '时空操控：操控时间和空间的力量',
        '元素主宰：完全掌控对应元素',
        '不死不灭：拥有强大的再生能力'
      ]
    };
  }

  /**
   * 获取随机神话食物
   */
  getRandomMythicalFood(targetRarity = null) {
    const foods = mythologyData.mythicalFood;
    let availableFoods = [];

    if (targetRarity === 'SSS') {
      availableFoods = foods.legendary;
    } else if (targetRarity === 'SS') {
      availableFoods = [...foods.epic, ...foods.legendary];
    } else {
      availableFoods = [...foods.rare, ...foods.epic, ...foods.legendary];
    }

    return availableFoods[Math.floor(Math.random() * availableFoods.length)];
  }

  /**
   * 获取随机神话地点
   */
  getRandomMythicalLocation() {
    const locations = [
      ...mythologyData.mythicalLocations.chinese,
      ...mythologyData.mythicalLocations.world
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }
}

module.exports = RaritySystem;