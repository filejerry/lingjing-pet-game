/**
 * 增强宠物管理系统 - 集成稀有度系统和神话元素
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const RaritySystem = require('./RaritySystem');
const mythologyData = require('../data/mythologyData');

class EnhancedPetManager {
  constructor(database, aiEngine) {
    this.db = database;
    this.aiEngine = aiEngine;
    this.raritySystem = new RaritySystem();
  }

  /**
   * 创建新宠物（增强版）
   */
  async createPet(userId, petName) {
    const petId = uuidv4();
    
    // 随机生成初始特性和稀有度
    const initialTraits = this.generateInitialTraits();
    const initialRarity = this.rollInitialRarity();
    
    // 应用稀有度加成
    const baseStats = {
      hp: 50 + Math.floor(Math.random() * 30),
      attack: 15 + Math.floor(Math.random() * 10),
      defense: 12 + Math.floor(Math.random() * 8),
      speed: 8 + Math.floor(Math.random() * 7),
      magic: Math.floor(Math.random() * 10),
      resistance: Math.floor(Math.random() * 10)
    };

    const finalStats = this.raritySystem.applyRarityBonus(baseStats, initialRarity);
    
    // 生成初始描述（不包含神话元素）
    const basePrompt = `一只名叫${petName}的小生物，拥有${initialTraits.personality}的性格和${initialTraits.appearance}的眼神。它刚刚来到灵境世界，对一切都充满好奇。`;

    const pet = {
      id: petId,
      user_id: userId.id || userId,
      name: petName,
      base_prompt: basePrompt,
      hp: finalStats.hp,
      attack: finalStats.attack,
      defense: finalStats.defense,
      speed: finalStats.speed,
      magic: finalStats.magic,
      resistance: finalStats.resistance,
      element_type: initialTraits.element,
      rarity: initialRarity
    };

    try {
      await this.db.run(
        `INSERT INTO pets (id, user_id, name, base_prompt, hp, attack, defense, speed, magic, resistance, element_type, rarity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pet.id, pet.user_id, pet.name, pet.base_prompt, pet.hp, pet.attack, pet.defense, pet.speed, pet.magic, pet.resistance, pet.element_type, pet.rarity]
      );

      logger.info(`Pet created: ${petName} (${initialRarity}) for user ${userId.username || userId}`, { petId });
      return pet;
    } catch (error) {
      logger.error('Failed to create pet:', error);
      throw error;
    }
  }

  /**
   * 生成初始特性
   */
  generateInitialTraits() {
    const personalities = ['温和', '活泼', '冷静', '好奇', '勇敢', '谨慎', '顽皮', '优雅'];
    const appearances = ['明亮', '深邃', '温柔', '锐利', '神秘', '纯真', '威严', '灵动'];
    const elements = ['fire', 'water', 'earth', 'air', 'light', 'dark', 'normal'];

    return {
      personality: personalities[Math.floor(Math.random() * personalities.length)],
      appearance: appearances[Math.floor(Math.random() * appearances.length)],
      element: elements[Math.floor(Math.random() * elements.length)]
    };
  }

  /**
   * 随机初始稀有度
   */
  rollInitialRarity() {
    const rand = Math.random();
    if (rand < 0.001) return 'SSS';  // 0.1%
    if (rand < 0.011) return 'SS';   // 1%
    if (rand < 0.061) return 'S';    // 5%
    if (rand < 0.211) return 'A';    // 15%
    if (rand < 0.511) return 'B';    // 30%
    return 'C';                      // 48.9%
  }

  /**
   * 获取宠物的可见特性（隐藏内部提示词）
   */
  async getPetCharacteristics(petId) {
    const pet = await this.getPetById(petId);
    if (!pet) return null;

    // 从基础提示词中提取关键词，但不直接显示提示词
    const keywords = this.extractKeywordsFromPrompt(pet.base_prompt);
    
    // 计算稀有度
    const rarityResult = this.raritySystem.calculateRarity(keywords, pet.rarity);
    
    // 生成特性描述
    const characteristics = this.generateCharacteristicDescription(keywords, rarityResult);
    
    // 获取稀有度显示信息
    const specialAbilities = rarityResult.matchedTriggers.length > 0 ? 
      this.raritySystem.generateSpecialAbilities(rarityResult.rarity, rarityResult.matchedTriggers) : [];

    const rarityDisplay = this.raritySystem.generateRarityDisplay(
      rarityResult.rarity, 
      specialAbilities
    );

    return {
      id: pet.id,
      name: pet.name,
      rarity: rarityResult.rarity,
      rarityDisplay,
      characteristics,
      stats: {
        hp: pet.hp,
        attack: pet.attack,
        defense: pet.defense,
        speed: pet.speed,
        magic: pet.magic,
        resistance: pet.resistance
      },
      element_type: pet.element_type,
      traits: pet.traits || [],
      specialAbilities,
      // 隐藏提示词，只显示特性
      mysteriousAura: this.generateMysteriousDescription(keywords, rarityResult.rarity)
    };
  }

  /**
   * 生成神秘描述（替代直接显示提示词）
   */
  generateMysteriousDescription(keywords, rarity) {
    const descriptions = [];
    
    if (rarity === 'SSS') {
      descriptions.push('散发着传说级的神秘气息...');
    } else if (rarity === 'SS') {
      descriptions.push('隐约透露出史诗般的威严...');
    } else if (rarity === 'S') {
      descriptions.push('展现出不凡的灵性...');
    }

    if (keywords.includes('火焰')) {
      descriptions.push('周围的空气似乎在微微颤动...');
    }
    if (keywords.includes('神秘')) {
      descriptions.push('眼中闪烁着古老的智慧...');
    }
    if (keywords.includes('强大')) {
      descriptions.push('身体蕴含着巨大的潜能...');
    }

    return descriptions.length > 0 ? descriptions.join(' ') : '一个充满可能性的神秘存在...';
  }

  /**
   * 从提示词中提取关键词
   */
  extractKeywordsFromPrompt(prompt) {
    const keywords = [];
    const keywordPatterns = [
      { pattern: /火焰|灼烧|热量|烈火|焚烧|炽热/g, keyword: '火焰' },
      { pattern: /冰霜|寒冷|冰冻|雪花|严寒|冰晶/g, keyword: '冰霜' },
      { pattern: /雷电|闪电|雷鸣|电击|雷霆|电光/g, keyword: '雷电' },
      { pattern: /大地|岩石|山石|土壤|坚硬|厚重/g, keyword: '大地' },
      { pattern: /神秘|古老|传说|神圣|邪恶|禁忌/g, keyword: '神秘' },
      { pattern: /智慧|聪明|博学|睿智|机智|洞察/g, keyword: '智慧' },
      { pattern: /力量|强大|威猛|凶猛|霸道|无敌/g, keyword: '强大' },
      { pattern: /优雅|美丽|华丽|高贵|典雅|绚烂/g, keyword: '优雅' },
      { pattern: /敏捷|迅速|快速|灵活|轻盈|迅疾/g, keyword: '敏捷' },
      { pattern: /治愈|恢复|生命|活力|再生|复苏/g, keyword: '治愈' },
      { pattern: /龙|凤|麒麟|白泽|九尾|鲲鹏/g, keyword: '神兽' },
      { pattern: /饕餮|穷奇|梼杌|混沌/g, keyword: '凶兽' },
      { pattern: /仙|神|圣|灵|仙人|神仙/g, keyword: '仙灵' },
      { pattern: /魔|妖|鬼|怪|邪魔|妖怪/g, keyword: '邪魔' }
    ];

    keywordPatterns.forEach(({ pattern, keyword }) => {
      if (pattern.test(prompt)) {
        keywords.push(keyword);
      }
    });

    return [...new Set(keywords)]; // 去重
  }

  /**
   * 生成特性描述
   */
  generateCharacteristicDescription(keywords, rarityResult) {
    const characteristics = [];

    // 基于关键词生成特性
    const keywordToCharacteristic = {
      '火焰': { name: '火焰之心', description: '体内燃烧着永不熄灭的火焰', type: 'elemental' },
      '冰霜': { name: '冰霜之魂', description: '拥有冰雪般纯净而冷酷的力量', type: 'elemental' },
      '雷电': { name: '雷霆之力', description: '掌控着雷电的狂暴力量', type: 'elemental' },
      '大地': { name: '大地之护', description: '与大地母亲建立了深厚的联系', type: 'elemental' },
      '神秘': { name: '神秘气质', description: '散发着难以言喻的神秘气息', type: 'mystical' },
      '智慧': { name: '超凡智慧', description: '拥有超越常人的智慧和洞察力', type: 'mental' },
      '强大': { name: '无尽力量', description: '体内蕴含着巨大的潜在力量', type: 'physical' },
      '优雅': { name: '高贵气质', description: '举手投足间透露着高贵的气质', type: 'social' },
      '敏捷': { name: '风之速度', description: '拥有如风般的敏捷身手', type: 'physical' },
      '治愈': { name: '生命之光', description: '散发着治愈一切伤痛的温暖光芒', type: 'support' },
      '神兽': { name: '神兽血脉', description: '体内流淌着古老神兽的血脉', type: 'legendary' },
      '凶兽': { name: '凶兽之力', description: '继承了上古凶兽的可怕力量', type: 'legendary' },
      '仙灵': { name: '仙灵之姿', description: '拥有超脱凡俗的仙灵气质', type: 'divine' },
      '邪魔': { name: '邪魔之影', description: '身上缠绕着邪魔的黑暗力量', type: 'dark' }
    };

    keywords.forEach(keyword => {
      if (keywordToCharacteristic[keyword]) {
        characteristics.push(keywordToCharacteristic[keyword]);
      }
    });

    // 稀有度特殊特性
    if (rarityResult.rarity === 'SSS') {
      characteristics.push({
        name: '传说觉醒',
        description: '已经觉醒了传说级的神话力量',
        type: 'legendary'
      });
    } else if (rarityResult.rarity === 'SS') {
      characteristics.push({
        name: '史诗潜质',
        description: '拥有成长为史诗级存在的巨大潜质',
        type: 'epic'
      });
    } else if (rarityResult.rarity === 'S') {
      characteristics.push({
        name: '稀有天赋',
        description: '天生具备稀有而独特的天赋',
        type: 'rare'
      });
    }

    // 神话生物匹配
    rarityResult.matchedTriggers.forEach(trigger => {
      characteristics.push({
        name: `${trigger.creature}之印`,
        description: `身上显现出${trigger.creature}的神秘印记`,
        type: 'mythical',
        creature: trigger.creature,
        power: trigger.matchCount
      });
    });

    return characteristics;
  }

  /**
   * 应用进化结果（增强版）
   */
  async applyEvolutionWithRarity(pet, evolutionResult) {
    // 提取新的关键词
    const newKeywords = this.extractKeywordsFromPrompt(evolutionResult.updated_prompt || pet.base_prompt);
    
    // 计算新的稀有度
    const rarityResult = this.raritySystem.calculateRarity(newKeywords, pet.rarity);
    
    // 应用稀有度属性加成
    const baseStats = {
      hp: pet.hp + (evolutionResult.attribute_changes?.hp || 0),
      attack: pet.attack + (evolutionResult.attribute_changes?.attack || 0),
      defense: pet.defense + (evolutionResult.attribute_changes?.defense || 0),
      speed: pet.speed + (evolutionResult.attribute_changes?.speed || 0),
      magic: pet.magic + (evolutionResult.attribute_changes?.magic || 0),
      resistance: pet.resistance + (evolutionResult.attribute_changes?.resistance || 0)
    };

    const finalStats = this.raritySystem.applyRarityBonus(baseStats, rarityResult.rarity);
    
    // 检查神话觉醒
    const awakening = this.raritySystem.checkMythicalAwakening(pet, newKeywords);
    
    if (awakening) {
      finalStats.hp += awakening.bonusStats.hp;
      finalStats.attack += awakening.bonusStats.attack;
      finalStats.defense += awakening.bonusStats.defense;
      finalStats.speed += awakening.bonusStats.speed;
      finalStats.magic += awakening.bonusStats.magic;
      finalStats.resistance += awakening.bonusStats.resistance;
    }

    // 更新数据库
    await this.db.run(
      `UPDATE pets SET 
       base_prompt = ?, hp = ?, attack = ?, defense = ?, speed = ?, 
       magic = ?, resistance = ?, rarity = ?
       WHERE id = ?`,
      [
        evolutionResult.updated_prompt || pet.base_prompt,
        finalStats.hp, finalStats.attack, finalStats.defense, finalStats.speed,
        finalStats.magic, finalStats.resistance, rarityResult.rarity,
        pet.id
      ]
    );

    // 添加新特质
    if (evolutionResult.traits && evolutionResult.traits.length > 0) {
      for (const trait of evolutionResult.traits) {
        await this.db.run(
          `INSERT INTO pet_traits (id, pet_id, name, type, effect_value, special_mechanism, description)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), pet.id, trait.name, trait.type, trait.effect_value, 
           trait.special_mechanism, trait.effect_description]
        );
      }
    }

    logger.info(`Pet ${pet.name} evolved to rarity ${rarityResult.rarity}`, {
      petId: pet.id,
      oldRarity: pet.rarity,
      newRarity: rarityResult.rarity,
      awakening: awakening ? awakening.form : null
    });

    return {
      ...pet,
      ...finalStats,
      rarity: rarityResult.rarity,
      rarityUpgraded: rarityResult.upgraded,
      awakening,
      characteristics: this.generateCharacteristicDescription(newKeywords, rarityResult),
      evolutionMessage: this.generateEvolutionMessage(rarityResult, awakening)
    };
  }

  /**
   * 生成进化消息
   */
  generateEvolutionMessage(rarityResult, awakening) {
    let message = '';

    if (rarityResult.upgraded) {
      const config = this.raritySystem.getRarityConfig(rarityResult.rarity);
      message += `🌟 稀有度提升至 ${config.title}级！`;
    }

    if (rarityResult.matchedTriggers.length > 0) {
      const creatures = rarityResult.matchedTriggers.map(t => t.creature).join('、');
      message += ` ✨ 觉醒了${creatures}的力量！`;
    }

    if (awakening) {
      message += ` 🔥 神话觉醒：${awakening.form}！`;
    }

    return message || '宠物获得了新的力量...';
  }

  /**
   * 获取神话食物推荐
   */
  getMythicalFoodRecommendations(pet) {
    const foods = [];
    
    // 根据当前稀有度推荐食物
    if (pet.rarity === 'SSS') {
      foods.push(...mythologyData.mythicalFood.legendary.slice(0, 2));
    } else if (pet.rarity === 'SS') {
      foods.push(...mythologyData.mythicalFood.epic.slice(0, 3));
    } else {
      foods.push(...mythologyData.mythicalFood.rare.slice(0, 4));
    }

    return foods;
  }

  /**
   * 获取神话探索地点推荐
   */
  getMythicalLocationRecommendations(pet) {
    const locations = [];
    
    // 根据稀有度推荐不同的探索地点
    if (pet.rarity === 'SSS') {
      locations.push(...mythologyData.mythicalLocations.chinese.slice(0, 3));
      locations.push(...mythologyData.mythicalLocations.world.slice(0, 2));
    } else if (pet.rarity === 'SS') {
      locations.push(...mythologyData.mythicalLocations.chinese.slice(3, 6));
      locations.push(...mythologyData.mythicalLocations.world.slice(2, 4));
    } else {
      locations.push(...mythologyData.mythicalLocations.chinese.slice(6));
      locations.push(...mythologyData.mythicalLocations.world.slice(4));
    }

    return locations;
  }

  // 继承原有方法
  async getPetById(petId) {
    const pet = await this.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) return null;

    const traits = await this.db.all('SELECT * FROM pet_traits WHERE pet_id = ?', [petId]);
    
    return {
      ...pet,
      traits: traits || []
    };
  }

  async getUserPets(userId) {
    const pets = await this.db.all('SELECT * FROM pets WHERE user_id = ?', [userId]);
    
    const petsWithTraits = await Promise.all(pets.map(async (pet) => {
      const traits = await this.db.all('SELECT * FROM pet_traits WHERE pet_id = ?', [pet.id]);
      return { ...pet, traits: traits || [] };
    }));

    return petsWithTraits;
  }
}

module.exports = EnhancedPetManager;