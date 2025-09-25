/**
 * 托管奇遇系统 - 参考旅行青蛙的放置玩法
 * 宠物可以自动探险，与其他玩家宠物相遇，获得各种奇遇
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class AdventureSystem {
  constructor(database, aiService) {
    this.db = database;
    this.aiService = aiService;
    this.encounterPool = new Map(); // 在线宠物池
    this.eventTemplates = this.initEventTemplates();
  }

  /**
   * 开始托管冒险
   */
  async startAdventure(petId, duration = 3600000) { // 默认1小时
    const pet = await this.getPetForAdventure(petId);
    if (!pet) throw new Error('Pet not found');

    // 检查是否已在冒险中
    const existingAdventure = await this.db.get(
      'SELECT * FROM adventure_events WHERE pet_id = ? AND is_completed = 0',
      [petId]
    );

    if (existingAdventure) {
      throw new Error('Pet is already on an adventure');
    }

    // 生成冒险事件链
    const eventChain = await this.generateEventChain(pet, duration);
    
    // 保存事件到数据库
    for (const event of eventChain) {
      await this.db.run(
        `INSERT INTO adventure_events (id, pet_id, event_type, event_title, event_description, rewards, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.id, petId, event.type, event.title, event.description, 
         JSON.stringify(event.rewards), event.startTime, event.endTime]
      );
    }

    // 加入相遇池
    this.encounterPool.set(petId, {
      pet: pet,
      adventureEnd: new Date(Date.now() + duration),
      lastEncounterCheck: Date.now()
    });

    logger.info(`Adventure started for pet ${petId}, duration: ${duration}ms`);
    
    return {
      adventureId: eventChain[0].id,
      events: eventChain,
      estimatedReturn: new Date(Date.now() + duration)
    };
  }

  /**
   * 生成事件链
   */
  async generateEventChain(pet, totalDuration) {
    const events = [];
    let currentTime = Date.now();
    const endTime = currentTime + totalDuration;
    
    // 根据总时长决定事件数量
    const eventCount = Math.floor(totalDuration / 1800000) + 1; // 每30分钟至少1个事件
    const eventInterval = totalDuration / eventCount;

    for (let i = 0; i < eventCount; i++) {
      const eventStartTime = currentTime + (i * eventInterval);
      const eventEndTime = Math.min(eventStartTime + eventInterval, endTime);
      
      const event = await this.generateSingleEvent(pet, eventStartTime, eventEndTime);
      events.push(event);
    }

    return events;
  }

  /**
   * 生成单个事件
   */
  async generateSingleEvent(pet, startTime, endTime) {
    const eventId = uuidv4();
    const duration = endTime - startTime;
    
    // 根据宠物特性和随机性选择事件类型
    const eventType = this.selectEventType(pet, duration);
    const template = this.getEventTemplate(eventType);
    
    // 使用AI生成个性化描述
    let description;
    try {
      description = await this.aiService.generateEventDescription(pet, eventType, template.context);
    } catch (error) {
      logger.warn('AI event generation failed, using template');
      description = this.generateTemplateDescription(pet, template);
    }

    // 计算奖励
    const rewards = this.calculateEventRewards(pet, eventType, duration);

    return {
      id: eventId,
      type: eventType,
      title: template.title,
      description: description,
      rewards: rewards,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      rarity: template.rarity
    };
  }

  /**
   * 选择事件类型
   */
  selectEventType(pet, duration) {
    const random = Math.random();
    
    // 根据时长调整稀有事件概率
    const durationBonus = Math.min(duration / 3600000, 2); // 最多2倍加成
    
    if (random < 0.05 * durationBonus) {
      return 'legendary'; // 传说事件
    } else if (random < 0.25 * durationBonus) {
      return 'rare'; // 稀有事件
    } else {
      return 'common'; // 普通事件
    }
  }

  /**
   * 获取事件模板
   */
  getEventTemplate(eventType) {
    const templates = this.eventTemplates[eventType];
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  /**
   * 计算事件奖励
   */
  calculateEventRewards(pet, eventType, duration) {
    const baseRewards = {
      common: { exp: 10, keywords: 1 },
      rare: { exp: 25, keywords: 2, trait_chance: 0.1 },
      legendary: { exp: 50, keywords: 3, trait_chance: 0.3, special_item: true }
    };

    const rewards = { ...baseRewards[eventType] };
    
    // 时长加成
    const durationMultiplier = Math.max(1, duration / 1800000); // 30分钟为基准
    rewards.exp = Math.floor(rewards.exp * durationMultiplier);
    
    return rewards;
  }

  /**
   * 处理宠物相遇
   */
  async processEncounters() {
    const availablePets = Array.from(this.encounterPool.entries());
    
    for (let i = 0; i < availablePets.length - 1; i++) {
      for (let j = i + 1; j < availablePets.length; j++) {
        const [petId1, petData1] = availablePets[i];
        const [petId2, petData2] = availablePets[j];
        
        // 检查相遇冷却时间
        const timeSinceLastCheck = Date.now() - Math.max(petData1.lastEncounterCheck, petData2.lastEncounterCheck);
        if (timeSinceLastCheck < 1800000) continue; // 30分钟冷却
        
        // 相遇概率判定
        if (Math.random() < parseFloat(process.env.ENCOUNTER_PROBABILITY || 0.3)) {
          await this.generateEncounter(petData1.pet, petData2.pet);
          
          // 更新相遇检查时间
          petData1.lastEncounterCheck = Date.now();
          petData2.lastEncounterCheck = Date.now();
        }
      }
    }
  }

  /**
   * 生成宠物相遇事件
   */
  async generateEncounter(pet1, pet2) {
    const encounterId = uuidv4();
    
    // 根据宠物特性决定相遇类型
    const encounterType = this.determineEncounterType(pet1, pet2);
    
    // 生成相遇描述
    let description;
    try {
      description = await this.aiService.generateEncounterDescription(pet1, pet2, encounterType);
    } catch (error) {
      description = this.generateTemplateEncounter(pet1, pet2, encounterType);
    }

    // 计算双方收益
    const rewards = this.calculateEncounterRewards(pet1, pet2, encounterType);

    // 保存相遇记录（匹配表结构：encounter_story + interaction_result）
    await this.db.run(
      `INSERT INTO pet_encounters (id, pet1_id, pet2_id, encounter_type, encounter_story, interaction_result)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [encounterId, pet1.id, pet2.id, encounterType, description, JSON.stringify(rewards)]
    );

    logger.info(`Encounter generated: ${pet1.name} meets ${pet2.name} (${encounterType})`);

    return {
      id: encounterId,
      type: encounterType,
      description: description,
      rewards: rewards
    };
  }

  /**
   * 决定相遇类型
   */
  determineEncounterType(pet1, pet2) {
    const types = ['friendly', 'competitive', 'mysterious', 'collaborative'];
    
    // 根据宠物元素类型影响相遇类型
    if (pet1.element_type === pet2.element_type) {
      return Math.random() < 0.7 ? 'friendly' : 'collaborative';
    } else {
      return types[Math.floor(Math.random() * types.length)];
    }
  }

  /**
   * 计算相遇奖励
   */
  calculateEncounterRewards(pet1, pet2, encounterType) {
    const baseRewards = {
      friendly: { friendship: 1, social_exp: 5 },
      competitive: { battle_exp: 10, rivalry: 1 },
      mysterious: { mystery_points: 3, rare_chance: 0.1 },
      collaborative: { teamwork: 2, shared_knowledge: 1 }
    };

    return {
      [pet1.id]: { ...baseRewards[encounterType] },
      [pet2.id]: { ...baseRewards[encounterType] }
    };
  }

  /**
   * 完成冒险并返回结果
   */
  async completeAdventure(petId) {
    // 获取宠物的所有未完成事件
    const events = await this.db.all(
      'SELECT * FROM adventure_events WHERE pet_id = ? AND is_completed = 0 AND end_time <= datetime("now")',
      [petId]
    );

    if (events.length === 0) {
      return { message: 'No completed adventures found' };
    }

    const results = [];
    let totalRewards = { exp: 0, keywords: [], traits: [] };

    try {
      await this.db.beginTransaction();

      for (const event of events) {
        const rewards = JSON.parse(event.rewards);
        
        // 应用奖励
        await this.applyEventRewards(petId, rewards);
        
        // 标记事件为已完成
        await this.db.run(
          'UPDATE adventure_events SET is_completed = 1, status = "completed" WHERE id = ?',
          [event.id]
        );

        results.push({
          title: event.event_title,
          description: event.event_description,
          rewards: rewards
        });

        // 累计总奖励
        totalRewards.exp += rewards.exp || 0;
        if (rewards.keywords) totalRewards.keywords.push(...rewards.keywords);
      }

      await this.db.commit();

      // 从相遇池中移除
      this.encounterPool.delete(petId);

      logger.info(`Adventure completed for pet ${petId}: ${events.length} events processed`);

      return {
        events: results,
        totalRewards: totalRewards,
        message: `冒险归来！${events.length}个奇遇等待着你查看。`
      };

    } catch (error) {
      await this.db.rollback();
      logger.error(`Failed to complete adventure for pet ${petId}:`, error);
      throw error;
    }
  }

  /**
   * 应用事件奖励
   */
  async applyEventRewards(petId, rewards) {
    // 经验值转换为属性提升
    if (rewards.exp) {
      const statBonus = Math.floor(rewards.exp / 10);
      await this.db.run(
        'UPDATE pets SET hp = hp + ?, attack = attack + ? WHERE id = ?',
        [statBonus, Math.floor(statBonus / 2), petId]
      );
    }

    // 添加关键词到基础提示词
    if (rewards.keywords && rewards.keywords.length > 0) {
      const pet = await this.db.get('SELECT base_prompt FROM pets WHERE id = ?', [petId]);
      const newPrompt = `${pet.base_prompt}\n冒险收获：${rewards.keywords.join('、')}`;
      await this.db.run('UPDATE pets SET base_prompt = ? WHERE id = ?', [newPrompt, petId]);
    }
  }

  /**
   * 获取冒险中的宠物
   */
  async getPetForAdventure(petId) {
    const pet = await this.db.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
    if (!pet) return null;

    const traits = await this.db.all(
      'SELECT * FROM pet_traits WHERE pet_id = ? AND is_active = 1',
      [petId]
    );

    return { ...pet, traits };
  }

  /**
   * 检查冒险状态
   */
  async getAdventureStatus(petId) {
    const activeEvents = await this.db.all(
      'SELECT * FROM adventure_events WHERE pet_id = ? AND is_completed = 0 ORDER BY start_time',
      [petId]
    );

    const completedEvents = await this.db.all(
      'SELECT * FROM adventure_events WHERE pet_id = ? AND is_completed = 1 AND end_time > datetime("now", "-1 day") ORDER BY end_time DESC',
      [petId]
    );

    return {
      isOnAdventure: activeEvents.length > 0,
      activeEvents: activeEvents,
      recentCompletedEvents: completedEvents,
      inEncounterPool: this.encounterPool.has(petId)
    };
  }

  /**
   * 初始化事件模板
   */
  initEventTemplates() {
    return {
      common: [
        {
          title: '森林漫步',
          context: '在茂密的森林中悠闲散步',
          rarity: 'common'
        },
        {
          title: '溪边小憩',
          context: '在清澈的小溪边休息',
          rarity: 'common'
        },
        {
          title: '花田探索',
          context: '在五彩斑斓的花田中探索',
          rarity: 'common'
        }
      ],
      rare: [
        {
          title: '古老遗迹',
          context: '发现了一座被遗忘的古老建筑',
          rarity: 'rare'
        },
        {
          title: '神秘洞穴',
          context: '进入了一个散发着奇异光芒的洞穴',
          rarity: 'rare'
        },
        {
          title: '魔法泉水',
          context: '找到了传说中的魔法泉水',
          rarity: 'rare'
        }
      ],
      legendary: [
        {
          title: '龙族遗迹',
          context: '意外闯入了古龙族的神圣领域',
          rarity: 'legendary'
        },
        {
          title: '时空裂缝',
          context: '遭遇了神秘的时空异象',
          rarity: 'legendary'
        },
        {
          title: '创世之树',
          context: '见证了传说中的世界之树',
          rarity: 'legendary'
        }
      ]
    };
  }

  /**
   * 生成模板描述（AI降级方案）
   */
  generateTemplateDescription(pet, template) {
    const descriptions = [
      `${pet.name}在${template.context}时，感受到了大自然的神奇力量。`,
      `经过一番探索，${pet.name}在${template.context}中有了新的发现。`,
      `${pet.name}静静地享受着${template.context}带来的宁静时光。`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * 生成模板相遇（AI降级方案）
   */
  generateTemplateEncounter(pet1, pet2, encounterType) {
    const templates = {
      friendly: `${pet1.name}和${pet2.name}在探索中偶然相遇，很快就成为了朋友。`,
      competitive: `${pet1.name}和${pet2.name}进行了一场友好的比试，彼此都有所收获。`,
      mysterious: `${pet1.name}和${pet2.name}一起发现了一个神秘的现象。`,
      collaborative: `${pet1.name}和${pet2.name}携手合作，共同解决了一个难题。`
    };
    
    return templates[encounterType] || templates.friendly;
  }

  /**
   * 处理随机相遇 - 定期执行的后台任务
   */
  async processRandomEncounters() {
    try {
      logger.info('Processing random encounters...');
      
      // 获取所有在冒险中的宠物
      const adventuringPets = await this.db.all(`
        SELECT DISTINCT p.* FROM pets p
        INNER JOIN adventure_events ae ON p.id = ae.pet_id
        WHERE ae.status = 'active' AND ae.end_time > datetime('now')
      `);

      if (adventuringPets.length < 2) {
        logger.info('Not enough pets for encounters');
        return;
      }

      // 随机选择两只宠物进行相遇
      for (let i = 0; i < Math.min(3, Math.floor(adventuringPets.length / 2)); i++) {
        const pet1Index = Math.floor(Math.random() * adventuringPets.length);
        let pet2Index = Math.floor(Math.random() * adventuringPets.length);
        
        // 确保不是同一只宠物
        while (pet2Index === pet1Index) {
          pet2Index = Math.floor(Math.random() * adventuringPets.length);
        }

        const pet1 = adventuringPets[pet1Index];
        const pet2 = adventuringPets[pet2Index];

        // 检查是否最近已经相遇过
        const recentEncounter = await this.db.get(`
          SELECT * FROM pet_encounters 
          WHERE (pet1_id = ? AND pet2_id = ?) OR (pet1_id = ? AND pet2_id = ?)
          AND created_at > datetime('now', '-2 hours')
        `, [pet1.id, pet2.id, pet2.id, pet1.id]);

        if (!recentEncounter && Math.random() < 0.3) { // 30% 相遇概率
          await this.generateEncounter(pet1, pet2);
        }
      }

      logger.info('Random encounters processing completed');
    } catch (error) {
      logger.error('Error processing random encounters:', error);
    }
  }
}

module.exports = AdventureSystem;