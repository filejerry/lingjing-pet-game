/**
 * 三层AI驱动引擎 - 游戏的核心大脑
 * 第一层：行为解析与提示词修正模块
 * 第二层：进化提示词生成模块  
 * 第三层：数值智能体与词条固化模块
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class AIEngine {
  constructor(aiService) {
    this.aiService = aiService;
    this.keywordWeights = this.initKeywordWeights();
    this.traitThresholds = this.initTraitThresholds();
    this.specialMechanisms = this.initSpecialMechanisms();
  }

  /**
   * 第一层：行为解析与提示词修正
   * 将玩家的离散行为转化为结构化数据，直接修改宠物的基础提示词
   */
  async processPlayerAction(pet, actionType, actionTarget) {
    logger.info(`Processing action: ${actionType} - ${actionTarget} for pet ${pet.id}`);
    
    // 1. 解析行为获取关键词
    const keywords = this.extractKeywords(actionType, actionTarget);
    
    // 2. 更新基础提示词
    const updatedPrompt = this.updateBasePrompt(pet.base_prompt, keywords);
    
    // 3. 记录行为历史
    const behaviorRecord = {
      id: uuidv4(),
      pet_id: pet.id,
      action_type: actionType,
      action_target: actionTarget,
      keywords_added: keywords,
      timestamp: new Date().toISOString()
    };

    return {
      updatedPrompt,
      keywords,
      behaviorRecord
    };
  }

  /**
   * 第二层：进化提示词生成
   * 通过AI大模型创作富有想象力的进化提示词模板
   */
  async generateEvolutionTemplate(pet, recentBehaviors) {
    logger.info(`Generating evolution template for pet ${pet.id}`);
    
    // 构建AI提示词
    const aiPrompt = this.buildEvolutionPrompt(pet, recentBehaviors);
    
    try {
      // 使用创意AI服务生成进化模板
      const evolutionTemplate = await this.aiService.generateEvolutionContent(aiPrompt);
      
      // 解析AI返回的结构化数据
      const parsedTemplate = this.parseEvolutionTemplate(evolutionTemplate);
      
      return parsedTemplate;
    } catch (error) {
      logger.error(`AI generation failed for pet ${pet.id}:`, error);
      // 降级到预设模板
      return this.getFallbackTemplate(pet);
    }
  }

  /**
   * 第三层：数值智能体与词条固化
   * 严格解析进化模板，生成结构化的战斗词条和属性数值
   */
  async solidifyTraits(evolutionTemplate, pet) {
    logger.info(`Solidifying traits for pet ${pet.id}`);
    
    // 1. 尝试使用数值AI进行精确解析
    try {
      const numericalPrompt = this.buildNumericalPrompt(evolutionTemplate, pet);
      const numericalResult = await this.aiService.generateNumericalOutput(numericalPrompt);
      const parsedResult = JSON.parse(numericalResult);
      
      if (parsedResult.traits && Array.isArray(parsedResult.traits)) {
        const validatedTraits = parsedResult.traits
          .map(trait => this.validateAndNormalizeTrait(trait, pet))
          .filter(trait => trait !== null);
        
        return this.applyBalanceCheck(validatedTraits, pet);
      }
    } catch (error) {
      logger.warn(`Numerical AI failed, falling back to algorithmic approach: ${error.message}`);
    }
    
    // 2. 降级到算法解析
    const traitCandidates = this.extractTraitCandidates(evolutionTemplate);
    const newTraits = [];
    
    for (const candidate of traitCandidates) {
      const trait = await this.generateTrait(candidate, pet);
      if (trait && this.validateTrait(trait, pet)) {
        newTraits.push(trait);
      }
    }
    
    // 3. 平衡性检查
    const balancedTraits = this.applyBalanceCheck(newTraits, pet);
    
    return balancedTraits;
  }

  /**
   * 关键词提取逻辑
   */
  extractKeywords(actionType, actionTarget) {
    const keywordMap = {
      feed: {
        '熔岩果': ['火焰', '灼烧', '热量'],
        '冰晶花': ['冰霜', '寒冷', '纯净'],
        '古老蘑菇': ['神秘', '古老', '自然'],
        '星辰露': ['光明', '神圣', '星空']
      },
      explore: {
        '火山口': ['火焰', '危险', '勇敢'],
        '古代遗迹': ['古老', '神秘', '历史'],
        '幽暗森林': ['暗影', '自然', '隐秘'],
        '水晶洞穴': ['水晶', '光明', '纯净']
      },
      train: {
        '力量训练': ['力量', '坚韧', '肌肉'],
        '敏捷训练': ['敏捷', '速度', '灵活'],
        '魔法修炼': ['魔法', '智慧', '奥秘'],
        '防御训练': ['防御', '坚固', '保护']
      }
    };

    return keywordMap[actionType]?.[actionTarget] || ['未知'];
  }

  /**
   * 更新基础提示词
   */
  updateBasePrompt(currentPrompt, keywords) {
    const keywordString = keywords.join('、');
    return `${currentPrompt}\n新获得特质：${keywordString}`;
  }

  /**
   * 构建进化AI提示词
   */
  buildEvolutionPrompt(pet, recentBehaviors) {
    const behaviorSummary = recentBehaviors
      .map(b => `${b.action_type}(${b.action_target})`)
      .join(', ');

    return `你是一个宠物进化设计师。根据宠物的当前状态和最近行为，设计一个平衡的进化方向。

宠物当前状态：${pet.base_prompt}
最近行为：${behaviorSummary}
当前属性：HP=${pet.hp}, 攻击=${pet.attack}, 防御=${pet.defense}, 速度=${pet.speed}

请生成进化描述，严格按照以下JSON格式返回：
{
  "evolution_description": "富有想象力的进化描述",
  "new_traits": [
    {
      "name": "词条名称",
      "type": "attack/defense/special/passive",
      "effect_description": "效果描述",
      "special_mechanism": "特殊机制名称(如果有)",
      "is_negative": false
    }
  ],
  "attribute_changes": {
    "hp": 0,
    "attack": 0,
    "defense": 0,
    "speed": 0
  }
}

注意：
1. 如果行为过于极端，可以设计负面特性，但要有正面补偿
2. 特殊机制包括：magic_immunity, vampire, thorns, berserk等
3. 属性变化应该合理，单次进化不超过±20点`;
  }

  /**
   * 构建数值AI提示词（第三层专用）
   */
  buildNumericalPrompt(evolutionTemplate, pet) {
    return `你是数值智能体，负责将进化描述转换为精确的游戏数值。

进化模板：${JSON.stringify(evolutionTemplate)}
宠物当前等级：${Math.floor((pet.hp + pet.attack + pet.defense + pet.speed) / 40)}
宠物现有词条数：${pet.traits ? pet.traits.length : 0}

请严格按照以下JSON格式输出，不要添加任何其他文字：
{
  "traits": [
    {
      "name": "词条名称",
      "type": "attack/defense/special/passive",
      "effect_value": 数值(整数),
      "special_mechanism": "机制名称或null",
      "is_negative": false,
      "rarity": "common/rare/legendary"
    }
  ],
  "attribute_changes": {
    "hp": 整数,
    "attack": 整数,
    "defense": 整数,
    "speed": 整数,
    "magic": 整数,
    "resistance": 整数
  }
}

数值规则：
1. effect_value范围：5-30
2. 负面词条effect_value可以更高，但必须有补偿
3. 稀有度影响数值：common(0.8x), rare(1.0x), legendary(1.5x)
4. 属性变化总和不超过30点`;
  }

  /**
   * 解析AI生成的进化模板
   */
  parseEvolutionTemplate(template) {
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(template);
      return parsed;
    } catch (error) {
      logger.warn('Failed to parse AI template as JSON, using fallback parser');
      // 降级解析逻辑
      return this.parseTemplateWithRegex(template);
    }
  }

  /**
   * 使用正则表达式解析模板（降级方案）
   */
  parseTemplateWithRegex(template) {
    // 简单的降级解析逻辑
    return {
      evolution_description: "宠物在神秘力量的影响下发生了微妙的变化",
      new_traits: [{
        name: "神秘之力",
        type: "passive",
        effect_description: "获得了未知的神秘能力",
        special_mechanism: null,
        is_negative: false
      }],
      attribute_changes: {
        hp: Math.floor(Math.random() * 10) + 1,
        attack: Math.floor(Math.random() * 5) + 1,
        defense: Math.floor(Math.random() * 5) + 1,
        speed: Math.floor(Math.random() * 3) + 1
      }
    };
  }

  /**
   * 生成具体词条
   */
  async generateTrait(candidate, pet) {
    const trait = {
      id: uuidv4(),
      pet_id: pet.id,
      name: candidate.name,
      type: candidate.type,
      effect_value: this.calculateEffectValue(candidate, pet),
      special_mechanism: candidate.special_mechanism || null,
      is_negative: candidate.is_negative || false,
      acquisition_time: new Date().toISOString(),
      is_active: true
    };

    return trait;
  }

  /**
   * 计算词条效果数值
   */
  calculateEffectValue(candidate, pet) {
    const baseValue = {
      attack: 15,
      defense: 12,
      special: 20,
      passive: 10
    }[candidate.type] || 10;

    // 根据宠物当前实力调整
    const petLevel = Math.floor((pet.hp + pet.attack + pet.defense + pet.speed) / 40);
    const levelMultiplier = 1 + (petLevel * 0.1);

    return Math.floor(baseValue * levelMultiplier);
  }

  /**
   * 词条验证
   */
  validateTrait(trait, pet) {
    // 检查是否超出限制
    const existingTraits = pet.traits || [];
    const sameTypeCount = existingTraits.filter(t => t.type === trait.type).length;
    
    const limits = {
      attack: 5,
      defense: 5,
      special: 3,
      passive: 8
    };

    return sameTypeCount < limits[trait.type];
  }

  /**
   * 平衡性检查
   */
  applyBalanceCheck(newTraits, pet) {
    // 计算正负面价值
    let positiveValue = 0;
    let negativeValue = 0;

    newTraits.forEach(trait => {
      const value = trait.effect_value * (trait.special_mechanism ? 1.5 : 1);
      if (trait.is_negative) {
        negativeValue += value;
      } else {
        positiveValue += value;
      }
    });

    // 如果负面过多，添加补偿
    if (negativeValue > positiveValue * 1.2) {
      const compensation = this.generateCompensationTrait(negativeValue - positiveValue);
      newTraits.push(compensation);
    }

    return newTraits;
  }

  /**
   * 初始化关键词权重
   */
  initKeywordWeights() {
    return {
      '火焰': { weight: 1, category: 'element', max_stack: 5 },
      '冰霜': { weight: 1, category: 'element', max_stack: 5 },
      '神秘': { weight: 2, category: 'mystical', max_stack: 3 },
      '古老': { weight: 3, category: 'temporal', max_stack: 2 },
      '危险': { weight: 2, category: 'risk', max_stack: 4 },
      '纯净': { weight: 1, category: 'purity', max_stack: 3 }
    };
  }

  /**
   * 初始化词条阈值
   */
  initTraitThresholds() {
    return {
      'fire_mastery': { 
        required: {'火焰': 3, '灼烧': 2}, 
        rarity: 'rare',
        effect: 'fire_damage_boost'
      },
      'ancient_wisdom': { 
        required: {'古老': 2, '神秘': 2}, 
        rarity: 'legendary',
        effect: 'magic_immunity'
      }
    };
  }

  /**
   * 初始化特殊机制
   */
  initSpecialMechanisms() {
    return {
      magic_immunity: '魔法免疫',
      vampire: '吸血',
      thorns: '反伤',
      berserk: '狂暴',
      regeneration: '再生',
      phase: '相位',
      time_skip: '时间跳跃'
    };
  }

  /**
   * 降级模板
   */
  getFallbackTemplate(pet) {
    return {
      evolution_description: "宠物在神秘力量的影响下发生了微妙的变化",
      new_traits: [{
        name: "基础强化",
        type: "passive",
        effect_description: "基础属性得到了小幅提升",
        is_negative: false
      }],
      attribute_changes: {
        hp: 5,
        attack: 3,
        defense: 3,
        speed: 2
      }
    };
  }

  /**
   * 验证和规范化词条（数值AI输出）
   */
  validateAndNormalizeTrait(traitData, pet) {
    try {
      // 基础验证
      if (!traitData.name || !traitData.type || typeof traitData.effect_value !== 'number') {
        return null;
      }

      // 类型验证
      const validTypes = ['attack', 'defense', 'special', 'passive'];
      if (!validTypes.includes(traitData.type)) {
        return null;
      }

      // 数值范围验证
      const effectValue = Math.max(1, Math.min(50, Math.floor(traitData.effect_value)));
      
      // 稀有度验证
      const validRarities = ['common', 'rare', 'legendary'];
      const rarity = validRarities.includes(traitData.rarity) ? traitData.rarity : 'common';

      return {
        id: uuidv4(),
        pet_id: pet.id,
        name: traitData.name,
        type: traitData.type,
        effect_value: effectValue,
        effect_description: traitData.effect_description || `${traitData.name}的效果`,
        special_mechanism: traitData.special_mechanism || null,
        is_negative: traitData.is_negative || false,
        rarity: rarity,
        acquisition_time: new Date().toISOString(),
        is_active: true
      };
    } catch (error) {
      logger.warn(`Failed to validate trait: ${error.message}`);
      return null;
    }
  }

  /**
   * 提取词条候选（算法降级方案）
   */
  extractTraitCandidates(evolutionTemplate) {
    const candidates = [];
    
    if (evolutionTemplate.new_traits && Array.isArray(evolutionTemplate.new_traits)) {
      evolutionTemplate.new_traits.forEach(trait => {
        candidates.push({
          name: trait.name || "未知词条",
          type: trait.type || "passive",
          effect_description: trait.effect_description || "",
          special_mechanism: trait.special_mechanism || null,
          is_negative: trait.is_negative || false
        });
      });
    }
    
    return candidates;
  }

  /**
   * 生成补偿词条
   */
  generateCompensationTrait(compensationValue) {
    return {
      id: uuidv4(),
      name: "命运补偿",
      type: "passive",
      effect_value: Math.floor(compensationValue * 0.8),
      special_mechanism: null,
      is_negative: false,
      description: "命运的平衡让你获得了意外的补偿"
    };
  }

  /**
   * 生成数值词条（测试接口）
   * 这是solidifyTraits的简化版本，专门用于测试
   */
  async generateNumericalTraits(evolutionTemplate, pet) {
    try {
      logger.info(`Generating numerical traits for pet ${pet.id}`);
      
      const prompt = this.buildNumericalPrompt(evolutionTemplate, pet);
      const response = await this.aiService.generateNumericalOutput(prompt);
      
      // 尝试解析JSON响应
      let numericalData;
      try {
        numericalData = JSON.parse(response);
      } catch (parseError) {
        logger.warn('Failed to parse AI numerical response, using algorithm fallback');
        return this.generateAlgorithmicTraits(evolutionTemplate, pet);
      }
      
      // 验证和规范化词条
      const validatedTraits = [];
      if (numericalData.traits && Array.isArray(numericalData.traits)) {
        for (const traitData of numericalData.traits) {
          const validatedTrait = this.validateAndNormalizeTrait(traitData, pet);
          if (validatedTrait) {
            validatedTraits.push(validatedTrait);
          }
        }
      }
      
      return {
        traits: validatedTraits,
        attribute_changes: numericalData.attribute_changes || {},
        generation_method: 'ai_numerical'
      };
      
    } catch (error) {
      logger.error(`Numerical AI generation failed for pet ${pet.id}:`, error);
      return this.generateAlgorithmicTraits(evolutionTemplate, pet);
    }
  }

  /**
   * 算法降级方案：基于关键词生成词条
   */
  generateAlgorithmicTraits(evolutionTemplate, pet) {
    const traits = [];
    const attributeChanges = { hp: 0, attack: 0, defense: 0, speed: 0, magic: 0, resistance: 0 };
    
    // 基于进化描述生成基础词条
    if (evolutionTemplate.new_traits && Array.isArray(evolutionTemplate.new_traits)) {
      evolutionTemplate.new_traits.forEach(traitTemplate => {
        const trait = {
          id: uuidv4(),
          pet_id: pet.id,
          name: traitTemplate.name || "神秘强化",
          type: traitTemplate.type || "passive",
          effect_value: this.calculateTraitValue(traitTemplate, pet),
          effect_description: traitTemplate.effect_description || "获得了神秘的力量",
          special_mechanism: traitTemplate.special_mechanism || null,
          is_negative: traitTemplate.is_negative || false,
          rarity: this.determineRarity(traitTemplate),
          acquisition_time: new Date().toISOString(),
          is_active: true
        };
        traits.push(trait);
      });
    }
    
    // 基于词条生成属性变化
    if (evolutionTemplate.attribute_changes) {
      Object.assign(attributeChanges, evolutionTemplate.attribute_changes);
    } else {
      // 默认小幅提升
      attributeChanges.hp = Math.floor(Math.random() * 10) + 5;
      attributeChanges.attack = Math.floor(Math.random() * 6) + 2;
      attributeChanges.defense = Math.floor(Math.random() * 6) + 2;
      attributeChanges.speed = Math.floor(Math.random() * 4) + 1;
    }
    
    return {
      traits: traits,
      attribute_changes: attributeChanges,
      generation_method: 'algorithmic_fallback'
    };
  }

  /**
   * 计算词条数值
   */
  calculateTraitValue(traitTemplate, pet) {
    const baseValue = 10;
    const rarityMultiplier = traitTemplate.rarity === 'legendary' ? 2.0 : 
                           traitTemplate.rarity === 'rare' ? 1.5 : 1.0;
    const negativeMultiplier = traitTemplate.is_negative ? 1.5 : 1.0;
    
    return Math.floor(baseValue * rarityMultiplier * negativeMultiplier);
  }

  /**
   * 确定词条稀有度
   */
  determineRarity(traitTemplate) {
    if (traitTemplate.special_mechanism) return 'legendary';
    if (traitTemplate.is_negative) return 'rare';
    return Math.random() < 0.1 ? 'rare' : 'common';
  }
}

module.exports = AIEngine;