/**
 * 进化触发系统
 * 管理进化的触发条件、时机和流程
 */

const logger = require('../utils/logger');
const { EvolutionPathSystem } = require('./EvolutionPathSystem');

/**
 * 进化触发类型
 */
const TRIGGER_TYPES = {
  LEVEL_UP: 'level_up',           // 等级提升触发
  BOND_INCREASE: 'bond_increase', // 羁绊提升触发
  BATTLE_WIN: 'battle_win',       // 战斗胜利触发
  ITEM_USE: 'item_use',           // 使用道具触发
  SPECIAL_EVENT: 'special_event', // 特殊事件触发
  MANUAL: 'manual',               // 玩家手动触发
  TIME_BASED: 'time_based',       // 时间条件触发
  QUEST_COMPLETE: 'quest_complete' // 任务完成触发
};

/**
 * 进化提示消息模板
 */
const EVOLUTION_HINTS = {
  ready: {
    title: '✨ 进化条件已满足!',
    messages: [
      '{petName}感受到体内涌动着强大的力量...',
      '你能感觉到{petName}正站在进化的边缘...',
      '{petName}的眼中闪烁着前所未有的光芒...',
      '神秘的能量正在{petName}体内汇聚...'
    ]
  },

  nearReady: {
    title: '🌟 即将可以进化',
    messages: [
      '{petName}似乎快要突破某个瓶颈了...',
      '你隐约感觉{petName}正在积蓄力量...',
      '{petName}的气息变得不同寻常...',
      '再多一些历练,{petName}就能进化了...'
    ]
  },

  pathChoice: {
    title: '🔀 进化分歧路口',
    messages: [
      '{petName}站在命运的十字路口,你的选择将决定它的未来...',
      '三条道路在{petName}面前展开,每一条都通向不同的力量...',
      '{petName}的进化方向取决于你的决定...'
    ]
  }
};

/**
 * 进化触发系统类
 */
class EvolutionTriggerSystem {
  constructor(database, aiEngine = null) {
    this.db = database;
    this.ai = aiEngine;
    this.pathSystem = new EvolutionPathSystem();

    // 触发检查间隔(毫秒)
    this.checkInterval = 60000; // 1分钟

    // 进化提示缓存(避免重复提示)
    this.hintCache = new Map();
  }

  /**
   * 检查宠物是否可以进化
   */
  async checkEvolutionEligibility(pet, userProgress = {}) {
    try {
      // 获取可用进化路径
      const availablePaths = this.pathSystem.getAvailablePaths(pet, userProgress);

      // 过滤出满足条件的路径
      const readyPaths = availablePaths.filter(p => p.available);
      const nearReadyPaths = availablePaths.filter(p => {
        if (p.available) return false;

        // 判断是否接近满足(比如等级差距<5级)
        const levelClose = p.missing.some(m => m.includes('等级') && this.isNearRequirement(m, 5));
        const bondClose = p.missing.some(m => m.includes('羁绊') && this.isNearRequirement(m, 10));

        return levelClose || bondClose;
      });

      return {
        canEvolve: readyPaths.length > 0,
        nearEvolution: nearReadyPaths.length > 0,
        readyPaths,
        nearReadyPaths,
        allPaths: availablePaths
      };
    } catch (error) {
      logger.error('检查进化资格失败:', error);
      return {
        canEvolve: false,
        nearEvolution: false,
        readyPaths: [],
        nearReadyPaths: [],
        allPaths: []
      };
    }
  }

  /**
   * 判断是否接近满足要求
   */
  isNearRequirement(missingText, threshold) {
    // 从文本中提取当前值和要求值
    // 例如: "等级需达到20(当前15)" -> 差距5
    const match = missingText.match(/\(当前(\d+)\).*?(\d+)/);
    if (match) {
      const [, current, required] = match;
      return parseInt(required) - parseInt(current) <= threshold;
    }
    return false;
  }

  /**
   * 触发进化检查(在关键事件后调用)
   */
  async triggerEvolutionCheck(pet, triggerType, userProgress = {}, context = {}) {
    try {
      logger.info('触发进化检查', { petId: pet.id, triggerType });

      // 检查进化资格
      const eligibility = await this.checkEvolutionEligibility(pet, userProgress);

      // 如果可以进化
      if (eligibility.canEvolve) {
        await this.notifyEvolutionReady(pet, eligibility.readyPaths, context);
        return {
          eligible: true,
          type: 'ready',
          paths: eligibility.readyPaths
        };
      }

      // 如果接近进化
      if (eligibility.nearEvolution) {
        await this.notifyEvolutionNear(pet, eligibility.nearReadyPaths, context);
        return {
          eligible: false,
          type: 'near',
          paths: eligibility.nearReadyPaths
        };
      }

      return {
        eligible: false,
        type: 'not_ready',
        paths: []
      };
    } catch (error) {
      logger.error('进化检查失败:', error);
      return {
        eligible: false,
        type: 'error',
        error: error.message
      };
    }
  }

  /**
   * 通知玩家宠物可以进化
   */
  async notifyEvolutionReady(pet, readyPaths, context = {}) {
    const cacheKey = `${pet.id}_ready`;

    // 避免重复通知(1小时内)
    if (this.hintCache.has(cacheKey)) {
      const lastNotify = this.hintCache.get(cacheKey);
      if (Date.now() - lastNotify < 3600000) {
        return;
      }
    }

    this.hintCache.set(cacheKey, Date.now());

    // 生成提示消息
    const hint = this.generateEvolutionHint('ready', pet, readyPaths);

    logger.info('宠物进化就绪', {
      petId: pet.id,
      petName: pet.name,
      pathCount: readyPaths.length
    });

    // 这里可以通过WebSocket或其他方式实时通知用户
    // 暂时记录日志
    return hint;
  }

  /**
   * 通知玩家宠物接近进化
   */
  async notifyEvolutionNear(pet, nearPaths, context = {}) {
    const cacheKey = `${pet.id}_near`;

    // 避免频繁通知(6小时内)
    if (this.hintCache.has(cacheKey)) {
      const lastNotify = this.hintCache.get(cacheKey);
      if (Date.now() - lastNotify < 21600000) {
        return;
      }
    }

    this.hintCache.set(cacheKey, Date.now());

    const hint = this.generateEvolutionHint('nearReady', pet, nearPaths);

    logger.info('宠物接近进化', {
      petId: pet.id,
      petName: pet.name,
      pathCount: nearPaths.length
    });

    return hint;
  }

  /**
   * 生成进化提示
   */
  generateEvolutionHint(type, pet, paths) {
    const template = EVOLUTION_HINTS[type];
    if (!template) return null;

    // 随机选择消息
    const message = template.messages[Math.floor(Math.random() * template.messages.length)]
      .replace('{petName}', pet.name || pet.species);

    return {
      title: template.title,
      message,
      petId: pet.id,
      petName: pet.name || pet.species,
      paths: paths.map(p => ({
        key: p.key,
        name: p.name,
        description: p.description,
        missing: p.missing
      }))
    };
  }

  /**
   * 执行进化流程
   */
  async executeEvolution(petId, pathKey, userId, options = {}) {
    try {
      logger.info('开始进化流程', { petId, pathKey, userId });

      // 1. 获取宠物数据
      const pet = await this.db.get('SELECT * FROM pets WHERE id = ?', [petId]);

      if (!pet) {
        throw new Error('宠物不存在');
      }

      if (pet.user_id !== userId) {
        throw new Error('无权操作此宠物');
      }

      // 2. 获取用户进度
      const userProgress = await this.getUserProgress(userId);

      // 3. 验证进化条件
      const eligibility = await this.checkEvolutionEligibility(pet, userProgress);
      const selectedPath = eligibility.readyPaths.find(p => p.key === pathKey);

      if (!selectedPath) {
        throw new Error('进化条件不满足或路径无效');
      }

      // 4. 生成AI进化故事(如果启用)
      let aiStory = null;
      if (this.ai && options.generateStory !== false) {
        aiStory = await this.generateEvolutionStory(pet, selectedPath);
      }

      // 5. 执行进化
      const result = await this.pathSystem.executeEvolution(pet, pathKey, aiStory);

      // 6. 更新数据库
      await this.saveEvolutionResult(result);

      // 7. 消耗道具(如果需要)
      if (selectedPath.requirements.specialItem) {
        await this.consumeEvolutionItem(userId, selectedPath.requirements.specialItem);
      }

      logger.info('进化完成', {
        petId,
        from: pet.species,
        to: result.evolvedPet.species,
        isLegendary: result.isLegendary
      });

      return {
        success: true,
        evolution: result,
        story: aiStory
      };
    } catch (error) {
      logger.error('进化执行失败:', error);
      throw error;
    }
  }

  /**
   * 生成AI进化故事
   */
  async generateEvolutionStory(pet, path) {
    if (!this.ai) return null;

    try {
      const prompt = `
你是一个富有想象力的故事讲述者,请为宠物进化创作一段史诗级的故事。

宠物信息:
- 名字: ${pet.name || pet.species}
- 当前种族: ${pet.species}
- 稀有度: ${pet.rarity}
- 等级: ${pet.level}

进化路径:
- 路径名称: ${path.name}
- 路径描述: ${path.description}
- 进化后种族: ${path.evolution.species}
- 新稀有度: ${path.evolution.rarity}
- 获得特性: ${path.evolution.newTraits.join(', ')}

要求:
1. 描述进化前的征兆和氛围(100-150字)
2. 描绘进化过程的震撼场景(150-200字)
3. 展现进化后的全新力量(100-150字)
4. 语言要有画面感和史诗感
5. 突出新获得的特性
6. 总字数控制在400-500字

请创作一段精彩的进化故事:
`;

      const response = await this.ai.generate(prompt, {
        maxTokens: 800,
        temperature: 0.8
      });

      return response.text;
    } catch (error) {
      logger.error('AI故事生成失败:', error);
      return null;
    }
  }

  /**
   * 保存进化结果到数据库
   */
  async saveEvolutionResult(result) {
    const { evolvedPet, evolutionRecord } = result;

    // 开始事务
    await this.db.run('BEGIN TRANSACTION');

    try {
      // 更新宠物数据
      await this.db.run(`
        UPDATE pets SET
          species = ?,
          rarity = ?,
          health = ?,
          attack = ?,
          defense = ?,
          speed = ?,
          magic = ?,
          special_traits = ?,
          element_type = ?,
          last_evolution = ?,
          evolution_stage = ?
        WHERE id = ?
      `, [
        evolvedPet.species,
        evolvedPet.rarity,
        evolvedPet.health,
        evolvedPet.attack,
        evolvedPet.defense,
        evolvedPet.speed,
        evolvedPet.magic,
        evolvedPet.special_traits,
        evolvedPet.element_type,
        evolvedPet.last_evolution,
        evolvedPet.evolution_stage,
        evolvedPet.id
      ]);

      // 插入进化记录
      await this.db.run(`
        INSERT INTO evolution_records (
          pet_id, from_species, to_species, from_rarity, to_rarity,
          evolution_path, ai_story, stats_before, stats_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        evolutionRecord.petId,
        evolutionRecord.from,
        evolutionRecord.to,
        evolutionRecord.fromRarity,
        evolutionRecord.toRarity,
        evolutionRecord.path,
        evolutionRecord.aiStory,
        JSON.stringify(evolutionRecord.statsBefore),
        JSON.stringify(evolutionRecord.statsAfter)
      ]);

      await this.db.run('COMMIT');
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * 获取用户游戏进度
   */
  async getUserProgress(userId) {
    // 查询用户的游戏统计数据
    const battles = await this.db.get(`
      SELECT COUNT(*) as count FROM battle_records WHERE user_id = ?
    `, [userId]);

    const bossesDefeated = await this.db.get(`
      SELECT COUNT(*) as count FROM battle_records
      WHERE user_id = ? AND opponent_type = 'boss' AND result = 'win'
    `, [userId]);

    const completedQuests = await this.db.query(`
      SELECT event_type FROM adventure_events
      WHERE user_id = ? AND completed = TRUE
    `, [userId]);

    // 简化的背包系统(实际应该有专门的inventory表)
    const inventory = ['进化石', '龙之心']; // 示例

    return {
      battles: battles?.count || 0,
      bossesDefeated: bossesDefeated?.count || 0,
      completedQuests: completedQuests?.map(q => q.event_type) || [],
      inventory
    };
  }

  /**
   * 消耗进化道具
   */
  async consumeEvolutionItem(userId, itemName) {
    // 这里应该从用户背包中移除道具
    // 暂时只记录日志
    logger.info('消耗进化道具', { userId, itemName });
  }

  /**
   * 获取进化历史记录
   */
  async getEvolutionHistory(petId, limit = 10) {
    return await this.db.query(`
      SELECT * FROM evolution_records
      WHERE pet_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [petId, limit]);
  }

  /**
   * 获取全服进化统计
   */
  async getEvolutionStatistics() {
    const total = await this.db.get(`
      SELECT COUNT(*) as count FROM evolution_records
    `);

    const byRarity = await this.db.query(`
      SELECT to_rarity, COUNT(*) as count
      FROM evolution_records
      GROUP BY to_rarity
      ORDER BY count DESC
    `);

    const recentEvolutions = await this.db.query(`
      SELECT er.*, p.name as pet_name
      FROM evolution_records er
      JOIN pets p ON er.pet_id = p.id
      ORDER BY er.created_at DESC
      LIMIT 20
    `);

    return {
      totalEvolutions: total?.count || 0,
      byRarity,
      recentEvolutions
    };
  }
}

module.exports = {
  EvolutionTriggerSystem,
  TRIGGER_TYPES,
  EVOLUTION_HINTS
};
