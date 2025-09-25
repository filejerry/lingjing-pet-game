/**
 * 宠物管理系统 - 处理宠物的创建、进化、属性管理
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const RaritySystem = require('./RaritySystem');

class PetManager {
  constructor(database, aiEngine) {
    this.db = database;
    this.aiEngine = aiEngine;
    this.raritySystem = new RaritySystem();
  }

  /**
   * 抽卡式创建随机宠物
   */
  async createRandomPet(userId) {
    const cardResult = this.performGachaRoll();
    return await this.createPet(userId, cardResult.name, cardResult);
  }

  /**
   * 创建新宠物
   */
  async createPet(userId, petName, gachaData = null) {
    const petId = uuidv4();
    
    // 使用抽卡数据或随机生成初始特性
    const initialTraits = gachaData || this.generateInitialTraits();
    const basePrompt = gachaData ? 
      `${gachaData.description}。这只名叫${petName}的${gachaData.species}刚刚从神秘的灵境中觉醒。` :
      `一只名叫${petName}的小生物，${initialTraits.description}。它刚刚来到灵境世界，对一切都充满好奇。`;
    
    const pet = {
      id: petId,
      user_id: userId,
      name: petName,
      base_prompt: basePrompt,
      hp: initialTraits.hp,
      attack: initialTraits.attack,
      defense: initialTraits.defense,
      speed: initialTraits.speed,
      magic: initialTraits.magic,
      element: initialTraits.element,
      rarity: gachaData ? gachaData.rarity : 'N',
      level: 1,
      experience: 0
    };

    try {
      await this.db.run(
        `INSERT INTO pets (id, user_id, name, base_prompt, hp, attack, defense, speed, magic, element, rarity, level, experience)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pet.id, pet.user_id, pet.name, pet.base_prompt, pet.hp, pet.attack, pet.defense, pet.speed, pet.magic, pet.element, pet.rarity, pet.level, pet.experience]
      );

      logger.info(`Pet created: ${petName} for user ${userId}`);
      return await this.getPetById(petId);
    } catch (error) {
      logger.error('Failed to create pet:', error);
      throw error;
    }
  }

  /**
   * 获取宠物详细信息
   */
  async getPetById(petId) {
    const pet = await this.db.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
    if (!pet) return null;

    // 获取宠物的词条
    const traits = await this.db.all(
      'SELECT * FROM pet_traits WHERE pet_id = ? AND is_active = 1 ORDER BY acquisition_time DESC',
      [petId]
    );

    // 获取最近的行为记录
    const recentBehaviors = await this.db.all(
      'SELECT * FROM pet_behaviors WHERE pet_id = ? ORDER BY timestamp DESC LIMIT 10',
      [petId]
    );

    return {
      ...pet,
      traits: traits,
      recent_behaviors: recentBehaviors,
      total_power: this.calculateTotalPower(pet, traits)
    };
  }

  /**
   * 处理玩家行为
   */
  async processPlayerAction(petId, actionType, actionTarget) {
    const pet = await this.getPetById(petId);
    if (!pet) throw new Error('Pet not found');

    // 使用AI引擎处理行为
    const result = await this.aiEngine.processPlayerAction(pet, actionType, actionTarget);

    try {
      await this.db.beginTransaction();

      // 更新宠物的基础提示词
      await this.db.run(
        'UPDATE pets SET base_prompt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [result.updatedPrompt, petId]
      );

      // 记录行为
      await this.db.run(
        `INSERT INTO pet_behaviors (id, pet_id, action_type, action_target, keywords_added, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [result.behaviorRecord.id, petId, actionType, actionTarget, JSON.stringify(result.keywords), new Date().toISOString()]
      );

      await this.db.commit();

      logger.info(`Action processed: ${actionType}(${actionTarget}) for pet ${petId}`);
      
      // 检查是否触发进化
      await this.checkEvolution(petId);

      return result;
    } catch (error) {
      await this.db.rollback();
      logger.error('Failed to process player action:', error);
      throw error;
    }
  }

  /**
   * 检查并处理宠物进化
   */
  async checkEvolution(petId) {
    const pet = await this.getPetById(petId);
    if (!pet) return;

    // 检查是否满足进化条件
    const timeSinceLastEvolution = Date.now() - new Date(pet.updated_at).getTime();
    const evolutionInterval = parseInt(process.env.EVOLUTION_CHECK_INTERVAL) || 3600000; // 1小时

    if (timeSinceLastEvolution < evolutionInterval) {
      return; // 还未到进化时间
    }

    // 检查是否有足够的行为积累
    const recentBehaviors = await this.db.all(
      'SELECT * FROM pet_behaviors WHERE pet_id = ? AND timestamp > datetime("now", "-1 day") ORDER BY timestamp DESC',
      [petId]
    );

    if (recentBehaviors.length < 3) {
      return; // 行为不够，不进化
    }

    try {
      await this.triggerEvolution(pet, recentBehaviors);
    } catch (error) {
      logger.error(`Evolution failed for pet ${petId}:`, error);
    }
  }

  /**
   * 触发宠物进化
   */
  async triggerEvolution(pet, recentBehaviors) {
    logger.info(`Triggering evolution for pet ${pet.id}`);

    // 使用AI引擎生成进化模板
    const evolutionTemplate = await this.aiEngine.generateEvolutionTemplate(pet, recentBehaviors);
    
    // 固化词条
    const newTraits = await this.aiEngine.solidifyTraits(evolutionTemplate, pet);

    try {
      await this.db.beginTransaction();

      // 应用属性变化
      if (evolutionTemplate.attribute_changes) {
        const changes = evolutionTemplate.attribute_changes;
        await this.db.run(
          `UPDATE pets SET 
           hp = hp + ?, attack = attack + ?, defense = defense + ?, 
           speed = speed + ?, magic = magic + ?, resistance = resistance + ?,
           last_evolution = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [changes.hp || 0, changes.attack || 0, changes.defense || 0, 
           changes.speed || 0, changes.magic || 0, changes.resistance || 0, pet.id]
        );
      }

      // 添加新词条
      for (const trait of newTraits) {
        await this.db.run(
          `INSERT INTO pet_traits (id, pet_id, trait_name, trait_type, effect_value, effect_description, special_mechanism, is_negative)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [trait.id, pet.id, trait.name, trait.type, trait.effect_value, 
           trait.effect_description || '', trait.special_mechanism, trait.is_negative || false]
        );
      }

      await this.db.commit();

      logger.info(`Evolution completed for pet ${pet.id}: ${newTraits.length} new traits added`);
      
      // 返回进化结果供前端显示
      return {
        description: evolutionTemplate.evolution_description,
        newTraits: newTraits,
        attributeChanges: evolutionTemplate.attribute_changes
      };
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * 获取用户的所有宠物
   */
  async getUserPets(userId) {
    const pets = await this.db.all(
      'SELECT * FROM pets WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
      [userId]
    );

    // 为每个宠物获取词条信息
    for (const pet of pets) {
      const traits = await this.db.all(
        'SELECT * FROM pet_traits WHERE pet_id = ? AND is_active = 1',
        [pet.id]
      );
      pet.traits = traits;
      pet.total_power = this.calculateTotalPower(pet, traits);
    }

    return pets;
  }

  /**
   * 计算宠物总战力
   */
  calculateTotalPower(pet, traits = []) {
    let basePower = pet.hp + pet.attack + pet.defense + pet.speed + (pet.magic || 0);
    
    // 计算词条加成
    let traitBonus = 0;
    traits.forEach(trait => {
      if (trait.is_active) {
        const multiplier = trait.is_negative ? -0.5 : 1;
        traitBonus += trait.effect_value * multiplier;
      }
    });

    return Math.floor(basePower + traitBonus);
  }

  /**
   * 生成初始宠物特性
   */
  generateInitialTraits() {
    const traitTemplates = [
      {
        description: '拥有温和的性格和好奇的眼神',
        hp: 80, attack: 15, defense: 12, speed: 8, magic: 5,
        element: 'neutral'
      },
      {
        description: '身上散发着微弱的火焰气息',
        hp: 70, attack: 20, defense: 10, speed: 12, magic: 8,
        element: 'fire'
      },
      {
        description: '周围总是环绕着清凉的水汽',
        hp: 90, attack: 12, defense: 15, speed: 6, magic: 10,
        element: 'water'
      },
      {
        description: '脚步轻盈，仿佛与风为伴',
        hp: 60, attack: 18, defense: 8, speed: 18, magic: 6,
        element: 'air'
      },
      {
        description: '身体坚实，与大地有着深深的联系',
        hp: 100, attack: 16, defense: 20, speed: 4, magic: 4,
        element: 'earth'
      }
    ];

    const randomIndex = Math.floor(Math.random() * traitTemplates.length);
    return traitTemplates[randomIndex];
  }

  /**
   * 宠物重命名
   */
  async renamePet(petId, newName, userId) {
    const pet = await this.db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (!pet) throw new Error('Pet not found or not owned by user');

    await this.db.run('UPDATE pets SET name = ? WHERE id = ?', [newName, petId]);
    logger.info(`Pet ${petId} renamed to ${newName}`);
    
    return await this.getPetById(petId);
  }

  /**
   * 删除宠物（软删除）
   */
  async deletePet(petId, userId) {
    const pet = await this.db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (!pet) throw new Error('Pet not found or not owned by user');

    await this.db.run('UPDATE pets SET is_active = 0 WHERE id = ?', [petId]);
    logger.info(`Pet ${petId} deleted by user ${userId}`);
    
    return true;
  }

  /**
   * 执行抽卡 - 文字描述的抽卡体验
   */
  performGachaRoll() {
    const rarityRoll = Math.random();
    let rarity, rarityName, rarityColor;
    
    // 稀有度概率：N(70%) > R(20%) > SR(7%) > SSR(2.5%) > SSS(0.5%)
    if (rarityRoll < 0.005) {
      rarity = 'SSS';
      rarityName = '传说';
      rarityColor = '#ff6b9d';
    } else if (rarityRoll < 0.03) {
      rarity = 'SSR';
      rarityName = '史诗';
      rarityColor = '#ffd93d';
    } else if (rarityRoll < 0.1) {
      rarity = 'SR';
      rarityName = '稀有';
      rarityColor = '#6bcf7f';
    } else if (rarityRoll < 0.3) {
      rarity = 'R';
      rarityName = '优秀';
      rarityColor = '#4d9de0';
    } else {
      rarity = 'N';
      rarityName = '普通';
      rarityColor = '#95a5a6';
    }

    // 根据稀有度选择生物
    const creatures = this.getCreaturesByRarity(rarity);
    const selectedCreature = creatures[Math.floor(Math.random() * creatures.length)];
    
    // 生成属性
    const baseStats = this.getBaseStatsByRarity(rarity);
    const variance = 0.2; // 20%浮动
    
    return {
      name: selectedCreature.name,
      species: selectedCreature.species,
      description: selectedCreature.description,
      rarity: rarity,
      rarityName: rarityName,
      rarityColor: rarityColor,
      element: selectedCreature.element,
      hp: Math.floor(baseStats.hp * (1 + (Math.random() - 0.5) * variance)),
      attack: Math.floor(baseStats.attack * (1 + (Math.random() - 0.5) * variance)),
      defense: Math.floor(baseStats.defense * (1 + (Math.random() - 0.5) * variance)),
      speed: Math.floor(baseStats.speed * (1 + (Math.random() - 0.5) * variance)),
      magic: Math.floor(baseStats.magic * (1 + (Math.random() - 0.5) * variance)),
      cardText: this.generateCardText(selectedCreature, rarity, rarityName)
    };
  }

  /**
   * 根据稀有度获取生物列表
   */
  getCreaturesByRarity(rarity) {
    const creatures = {
      'N': [
        { name: '小灵虫', species: '灵虫', element: 'neutral', description: '一只普通的小灵虫，但眼中闪烁着不凡的光芒' },
        { name: '青草精', species: '草精', element: 'wood', description: '从嫩绿草叶中诞生的小精灵，散发着自然的气息' },
        { name: '水滴宝', species: '水精', element: 'water', description: '由纯净水滴凝聚而成的小生命，晶莹剔透' },
        { name: '火花鼠', species: '火鼠', element: 'fire', description: '尾巴上燃烧着微弱火焰的小老鼠，温暖可爱' }
      ],
      'R': [
        { name: '风刃狼', species: '风狼', element: 'wind', description: '掌控微风的幼狼，每一次奔跑都带起阵阵清风' },
        { name: '岩石龟', species: '岩龟', element: 'earth', description: '背负着坚硬岩石的小龟，防御力惊人' },
        { name: '雷鸣鸟', species: '雷鸟', element: 'thunder', description: '翅膀间闪烁着电光的小鸟，飞行时伴随雷鸣' },
        { name: '冰晶狐', species: '冰狐', element: 'ice', description: '毛发如冰晶般闪亮的小狐狸，所到之处寒气逼人' }
      ],
      'SR': [
        { name: '烈焰狮', species: '火狮', element: 'fire', description: '鬃毛燃烧着烈火的幼狮，王者气质初现' },
        { name: '深海龙', species: '水龙', element: 'water', description: '来自深海的幼龙，掌控着海洋的力量' },
        { name: '森林王', species: '木王', element: 'wood', description: '森林守护者的后裔，能与万物沟通' },
        { name: '雷霆虎', species: '雷虎', element: 'thunder', description: '身披雷电的幼虎，每一声咆哮都震撼天地' }
      ],
      'SSR': [
        { name: '凤凰雏', species: '凤凰', element: 'fire', description: '传说中凤凰的幼体，浴火重生的力量在体内沉睡' },
        { name: '青龙子', species: '青龙', element: 'wood', description: '东方青龙的后裔，掌控着生命与自然的奥秘' },
        { name: '白虎崽', species: '白虎', element: 'metal', description: '西方白虎的幼崽，锋利的爪牙蕴含着肃杀之气' },
        { name: '玄武苗', species: '玄武', element: 'water', description: '北方玄武的幼体，龟蛇合一的神秘力量觉醒中' }
      ],
      'SSS': [
        { name: '九尾狐', species: '九尾狐', element: 'illusion', description: '传说中的九尾天狐，拥有颠倒众生的魅惑之力' },
        { name: '真龙', species: '真龙', element: 'divine', description: '东方神话中的至高存在，掌控着天地万物的真龙' },
        { name: '鲲鹏', species: '鲲鹏', element: 'wind', description: '北冥有鱼，其名为鲲，化而为鸟，其名为鹏' },
        { name: '麒麟', species: '麒麟', element: 'holy', description: '仁兽之王，只在盛世出现的祥瑞神兽' }
      ]
    };
    
    return creatures[rarity] || creatures['N'];
  }

  /**
   * 根据稀有度获取基础属性
   */
  getBaseStatsByRarity(rarity) {
    const baseStats = {
      'N': { hp: 40, attack: 8, defense: 6, speed: 10, magic: 5 },
      'R': { hp: 60, attack: 12, defense: 10, speed: 15, magic: 8 },
      'SR': { hp: 80, attack: 18, defense: 15, speed: 20, magic: 12 },
      'SSR': { hp: 120, attack: 25, defense: 20, speed: 30, magic: 18 },
      'SSS': { hp: 200, attack: 40, defense: 35, speed: 45, magic: 30 }
    };
    
    return baseStats[rarity] || baseStats['N'];
  }

  /**
   * 生成抽卡文本描述
   */
  generateCardText(creature, rarity, rarityName) {
    const sparkles = {
      'N': '✨',
      'R': '🌟',
      'SR': '💫',
      'SSR': '⭐',
      'SSS': '🌠'
    };
    
    const cardTexts = [
      `${sparkles[rarity]} 神秘的光芒闪烁，一只${rarityName}品质的${creature.species}出现了！`,
      `${sparkles[rarity]} 灵境的深处传来呼唤，${creature.name}回应了你的召唤！`,
      `${sparkles[rarity]} 命运的丝线交织，为你带来了这只${rarityName}的${creature.species}！`,
      `${sparkles[rarity]} 古老的契约生效，${creature.name}愿意成为你的伙伴！`
    ];
    
    return cardTexts[Math.floor(Math.random() * cardTexts.length)];
  }
}

module.exports = PetManager;