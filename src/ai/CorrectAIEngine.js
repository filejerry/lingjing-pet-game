/**
 * 修正版三层AI引擎 - 正确的L1→L3→L2→L3流程
 * L1: 行为记录层 (简单记录，不做判断)
 * L3: 智能体判断层 (大脑，负责判断是否触发L2变更)
 * L2: 提示词进化层 (灵魂，负责进化描述生成)
 * L3: 词缀固化层 (实装，将L2结果转为游戏数值)
 */

const logger = require('../utils/logger');

class CorrectAIEngine {
  constructor(aiService, database) {
    this.aiService = aiService;
    this.db = database;
    
    // 三层架构的边界限制
    this.BOUNDARIES = {
      // L1层限制 - 只记录，不判断
      maxBehaviorRecords: 50,
      behaviorRetentionDays: 7,
      
      // L2层限制 - 提示词长度严格控制
      maxL2PromptLength: 220,
      maxL2Keywords: 15,
      l2TriggerThreshold: 10, // L3判断积累到10次才可能触发L2
      
      // L3层限制 - 词缀数量可以很多
      maxL3Traits: 120,
      maxL3ActiveTraits: 30,
      l3ProcessingCooldown: 300000 // 5分钟冷却
    };
    
    // L3智能体的判断算法配置
    this.L3_JUDGMENT_CONFIG = {
      // 行为权重表
      behaviorWeights: {
        'feed': { base: 1, multiplier: 1.2 },
        'explore': { base: 2, multiplier: 1.5 },
        'battle': { base: 3, multiplier: 2.0 },
        'chat': { base: 0.5, multiplier: 1.0 }
      },
      
      // 触发L2的条件算法
      l2TriggerConditions: {
        minAccumulatedWeight: 15,
        minUniqueActions: 3,
        minTimeSinceLastL2: 1800000, // 30分钟
        rarityMultiplier: { 'N': 1.0, 'R': 1.2, 'SR': 1.5, 'SSR': 2.0, 'SSS': 3.0 }
      }
    };
  }

  /**
   * L1层：行为记录 (只记录，不做任何判断)
   */
  async recordBehavior(petId, action, target, context = {}) {
    try {
      const behaviorId = require('uuid').v4();
      const timestamp = new Date().toISOString();
      
      // 纯粹的行为记录，不做任何逻辑判断
      await this.db.run(`
        INSERT INTO pet_behaviors (id, pet_id, action_type, target, context, timestamp, processed_by_l3)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `, [behaviorId, petId, action, target, JSON.stringify(context), timestamp]);
      
      logger.info(`L1 Behavior Recorded: ${petId} -> ${action}(${target})`);
      
      // 清理过期记录
      await this.cleanupOldBehaviors(petId);
      
      // 异步触发L3判断 (不等待结果)
      setImmediate(() => this.triggerL3Judgment(petId));
      
      return {
        behaviorId,
        message: `行为已记录：${action}(${target})`,
        immediate: false // 明确告知用户没有立即效果
      };
      
    } catch (error) {
      logger.error('L1 Behavior Recording failed:', error);
      throw error;
    }
  }

  /**
   * L3层：智能体判断 (大脑，决定是否触发L2)
   */
  async triggerL3Judgment(petId) {
    try {
      // 检查冷却时间
      const lastL3Process = await this.db.get(`
        SELECT MAX(timestamp) as last_process 
        FROM pet_l3_judgments 
        WHERE pet_id = ?
      `, [petId]);
      
      if (lastL3Process && lastL3Process.last_process) {
        const timeSince = Date.now() - new Date(lastL3Process.last_process).getTime();
        if (timeSince < this.BOUNDARIES.l3ProcessingCooldown) {
          logger.info(`L3 Judgment skipped for ${petId}: cooling down`);
          return;
        }
      }
      
      // 获取未处理的行为记录
      const unprocessedBehaviors = await this.db.all(`
        SELECT * FROM pet_behaviors 
        WHERE pet_id = ? AND processed_by_l3 = 0 
        ORDER BY timestamp ASC
      `, [petId]);
      
      if (unprocessedBehaviors.length === 0) {
        return; // 没有新行为需要判断
      }
      
      // L3智能体算法：计算行为权重
      const judgmentResult = await this.performL3Judgment(petId, unprocessedBehaviors);
      
      // 记录L3判断结果
      await this.db.run(`
        INSERT INTO pet_l3_judgments (id, pet_id, behavior_count, accumulated_weight, should_trigger_l2, judgment_data, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        require('uuid').v4(),
        petId,
        unprocessedBehaviors.length,
        judgmentResult.accumulatedWeight,
        judgmentResult.shouldTriggerL2 ? 1 : 0,
        JSON.stringify(judgmentResult),
        new Date().toISOString()
      ]);
      
      // 标记行为为已处理
      const behaviorIds = unprocessedBehaviors.map(b => b.id);
      await this.db.run(`
        UPDATE pet_behaviors 
        SET processed_by_l3 = 1 
        WHERE id IN (${behaviorIds.map(() => '?').join(',')})
      `, behaviorIds);
      
      logger.info(`L3 Judgment completed for ${petId}: weight=${judgmentResult.accumulatedWeight}, trigger=${judgmentResult.shouldTriggerL2}`);
      
      // 如果L3判断应该触发L2，则启动L2进化
      if (judgmentResult.shouldTriggerL2) {
        await this.triggerL2Evolution(petId, judgmentResult);
      }
      
    } catch (error) {
      logger.error('L3 Judgment failed:', error);
    }
  }

  /**
   * L3智能体的核心判断算法
   */
  async performL3Judgment(petId, behaviors) {
    // 获取宠物当前状态
    const pet = await this.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) throw new Error('Pet not found');
    
    // 计算行为权重
    let accumulatedWeight = 0;
    const actionCounts = {};
    const uniqueTargets = new Set();
    
    for (const behavior of behaviors) {
      const config = this.L3_JUDGMENT_CONFIG.behaviorWeights[behavior.action_type] || { base: 1, multiplier: 1 };
      const weight = config.base * config.multiplier;
      
      accumulatedWeight += weight;
      actionCounts[behavior.action_type] = (actionCounts[behavior.action_type] || 0) + 1;
      uniqueTargets.add(behavior.target);
    }
    
    // 稀有度加成
    const rarityMultiplier = this.L3_JUDGMENT_CONFIG.l2TriggerConditions.rarityMultiplier[pet.rarity] || 1.0;
    accumulatedWeight *= rarityMultiplier;
    
    // 判断是否应该触发L2
    const conditions = this.L3_JUDGMENT_CONFIG.l2TriggerConditions;
    const shouldTriggerL2 = (
      accumulatedWeight >= conditions.minAccumulatedWeight &&
      Object.keys(actionCounts).length >= conditions.minUniqueActions &&
      await this.checkL2Cooldown(petId, conditions.minTimeSinceLastL2)
    );
    
    return {
      accumulatedWeight,
      actionCounts,
      uniqueTargets: Array.from(uniqueTargets),
      shouldTriggerL2,
      rarityMultiplier,
      behaviorSummary: this.generateBehaviorSummary(behaviors)
    };
  }

  /**
   * L2层：提示词进化 (灵魂，生成进化描述)
   */
  async triggerL2Evolution(petId, judgmentResult) {
    try {
      const pet = await this.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
      if (!pet) throw new Error('Pet not found');
      
      // 检查L2提示词长度限制
      if (pet.base_prompt.length >= this.BOUNDARIES.maxL2PromptLength) {
        logger.warn(`L2 Evolution skipped for ${petId}: prompt too long (${pet.base_prompt.length})`);
        return;
      }
      
      // 构建L2进化提示词
      const l2Prompt = this.buildL2EvolutionPrompt(pet, judgmentResult);
      
      // 调用AI生成进化内容
      const evolutionContent = await this.aiService.generateEvolutionContent(l2Prompt, {
        temperature: 0.8,
        maxTokens: 800
      });
      
      // 解析AI返回的进化内容
      const parsedEvolution = this.parseEvolutionContent(evolutionContent);
      
      // 更新宠物的L2提示词 (严格控制长度)
      const newPrompt = this.updateL2Prompt(pet.base_prompt, parsedEvolution, this.BOUNDARIES.maxL2PromptLength);
      
      await this.db.run(`
        UPDATE pets 
        SET base_prompt = ?, last_l2_evolution = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [newPrompt, petId]);
      
      // 记录L2进化历史
      await this.db.run(`
        INSERT INTO pet_l2_evolutions (id, pet_id, old_prompt, new_prompt, evolution_content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        require('uuid').v4(),
        petId,
        pet.base_prompt,
        newPrompt,
        JSON.stringify(parsedEvolution),
        new Date().toISOString()
      ]);
      
      logger.info(`L2 Evolution completed for ${petId}: prompt updated`);
      
      // 触发L3词缀固化
      await this.triggerL3Solidification(petId, parsedEvolution);
      
    } catch (error) {
      logger.error('L2 Evolution failed:', error);
    }
  }

  /**
   * L3层：词缀固化 (实装，将L2结果转为游戏数值)
   */
  async triggerL3Solidification(petId, evolutionData) {
    try {
      // 构建L3固化提示词
      const l3Prompt = this.buildL3SolidificationPrompt(evolutionData);
      
      // 调用AI生成数值化结果
      const numericalResult = await this.aiService.generateNumericalOutput(l3Prompt, {
        temperature: 0.2,
        maxTokens: 600
      });
      
      // 解析数值结果
      const parsedTraits = this.parseNumericalResult(numericalResult);
      
      // 检查L3词缀数量限制
      const currentTraits = await this.db.all(`
        SELECT COUNT(*) as count FROM pet_traits WHERE pet_id = ? AND is_active = 1
      `, [petId]);
      
      if (currentTraits[0].count >= this.BOUNDARIES.maxL3ActiveTraits) {
        // 需要淘汰一些旧词缀
        await this.pruneOldTraits(petId, this.BOUNDARIES.maxL3ActiveTraits - parsedTraits.length);
      }
      
      // 固化新词缀
      for (const trait of parsedTraits) {
        await this.db.run(`
          INSERT INTO pet_traits (id, pet_id, trait_name, trait_type, effect_description, numerical_effect, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        `, [
          require('uuid').v4(),
          petId,
          trait.name,
          trait.type,
          trait.description,
          JSON.stringify(trait.numericalEffect),
          new Date().toISOString()
        ]);
      }
      
      // 应用数值变化到宠物属性
      await this.applyNumericalChanges(petId, parsedTraits);
      
      logger.info(`L3 Solidification completed for ${petId}: ${parsedTraits.length} traits added`);
      
    } catch (error) {
      logger.error('L3 Solidification failed:', error);
    }
  }

  /**
   * 构建L2进化提示词
   */
  buildL2EvolutionPrompt(pet, judgmentResult) {
    return `作为《灵境斗宠录》的进化设计师，请为以下宠物设计进化方向：

宠物信息：
- 名称：${pet.name}
- 当前特性：${pet.base_prompt}
- 稀有度：${pet.rarity}
- 当前属性：HP=${pet.hp}, 攻击=${pet.attack}, 防御=${pet.defense}, 速度=${pet.speed}

最近行为分析：
- 累积权重：${judgmentResult.accumulatedWeight}
- 行为统计：${JSON.stringify(judgmentResult.actionCounts)}
- 涉及目标：${judgmentResult.uniqueTargets.join(', ')}
- 行为摘要：${judgmentResult.behaviorSummary}

请生成进化描述，要求：
1. 基于行为模式设计合理的进化方向
2. 保持与现有特性的连贯性
3. 描述要生动有趣，符合东方幻想世界观
4. 控制在100字以内

输出格式：
{
  "evolution_description": "进化描述文本",
  "new_keywords": ["关键词1", "关键词2"],
  "evolution_direction": "进化方向概述"
}`;
  }

  /**
   * 构建L3固化提示词
   */
  buildL3SolidificationPrompt(evolutionData) {
    return `作为《灵境斗宠录》的数值智能体，请将以下进化描述转换为具体的游戏词缀：

进化内容：${JSON.stringify(evolutionData)}

请生成1-3个游戏词缀，每个词缀包含：
1. 词缀名称（简洁有力）
2. 词缀类型（passive/active/trigger）
3. 效果描述（玩家可见）
4. 数值效果（属性加成、特殊效果等）

输出格式（严格JSON）：
[
  {
    "name": "词缀名称",
    "type": "passive",
    "description": "效果描述",
    "numericalEffect": {
      "hp": 0,
      "attack": 0,
      "defense": 0,
      "speed": 0,
      "special": "特殊效果描述"
    }
  }
]`;
  }

  // 辅助方法
  async cleanupOldBehaviors(petId) {
    const cutoffDate = new Date(Date.now() - this.BOUNDARIES.behaviorRetentionDays * 24 * 60 * 60 * 1000);
    await this.db.run(`
      DELETE FROM pet_behaviors 
      WHERE pet_id = ? AND timestamp < ?
    `, [petId, cutoffDate.toISOString()]);
  }

  async checkL2Cooldown(petId, minTime) {
    const lastL2 = await this.db.get(`
      SELECT MAX(timestamp) as last_evolution 
      FROM pet_l2_evolutions 
      WHERE pet_id = ?
    `, [petId]);
    
    if (!lastL2 || !lastL2.last_evolution) return true;
    
    const timeSince = Date.now() - new Date(lastL2.last_evolution).getTime();
    return timeSince >= minTime;
  }

  generateBehaviorSummary(behaviors) {
    const actionTypes = [...new Set(behaviors.map(b => b.action_type))];
    const targets = [...new Set(behaviors.map(b => b.target))];
    return `执行了${actionTypes.join('、')}等行为，涉及${targets.join('、')}`;
  }

  parseEvolutionContent(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      logger.warn('Failed to parse evolution content, using fallback');
      return {
        evolution_description: "在神秘力量的引导下发生了微妙的变化",
        new_keywords: ["成长"],
        evolution_direction: "稳定发展"
      };
    }
  }

  parseNumericalResult(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      logger.warn('Failed to parse numerical result, using fallback');
      return [{
        name: "稳定成长",
        type: "passive",
        description: "获得了稳定的成长",
        numericalEffect: { hp: 5, attack: 2, defense: 2, speed: 1 }
      }];
    }
  }

  updateL2Prompt(currentPrompt, evolutionData, maxLength) {
    const newKeywords = evolutionData.new_keywords || [];
    const addition = `\n进化：${evolutionData.evolution_description}`;
    
    let newPrompt = currentPrompt + addition;
    
    // 如果超长，需要压缩
    if (newPrompt.length > maxLength) {
      // 保留最重要的部分，移除最老的进化记录
      const lines = newPrompt.split('\n');
      const corePrompt = lines[0]; // 保留核心描述
      const recentEvolutions = lines.slice(-3); // 保留最近3次进化
      
      newPrompt = [corePrompt, ...recentEvolutions].join('\n');
      
      // 如果还是太长，进一步压缩
      if (newPrompt.length > maxLength) {
        newPrompt = newPrompt.substring(0, maxLength - 10) + '...';
      }
    }
    
    return newPrompt;
  }

  async pruneOldTraits(petId, keepCount) {
    // 保留最新的keepCount个词缀，淘汰其他的
    await this.db.run(`
      UPDATE pet_traits 
      SET is_active = 0 
      WHERE pet_id = ? AND is_active = 1 
      AND id NOT IN (
        SELECT id FROM pet_traits 
        WHERE pet_id = ? AND is_active = 1 
        ORDER BY created_at DESC 
        LIMIT ?
      )
    `, [petId, petId, keepCount]);
  }

  async applyNumericalChanges(petId, traits) {
    let totalHp = 0, totalAttack = 0, totalDefense = 0, totalSpeed = 0;
    
    for (const trait of traits) {
      const effect = trait.numericalEffect || {};
      totalHp += effect.hp || 0;
      totalAttack += effect.attack || 0;
      totalDefense += effect.defense || 0;
      totalSpeed += effect.speed || 0;
    }
    
    if (totalHp || totalAttack || totalDefense || totalSpeed) {
      await this.db.run(`
        UPDATE pets 
        SET hp = hp + ?, attack = attack + ?, defense = defense + ?, speed = speed + ?
        WHERE id = ?
      `, [totalHp, totalAttack, totalDefense, totalSpeed, petId]);
    }
  }
}

module.exports = CorrectAIEngine;