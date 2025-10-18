/**
 * 宠物智能体系统 - 三层提示词嵌套 + 三层固定算法
 * 实现大模型动态修改大模型提示词的创新架构
 */

const logger = require('../utils/logger');

class PetAgentSystem {
  constructor(aiService) {
    this.aiService = aiService;
    
    // 三层提示词模板
    this.promptLayers = {
      // 第一层：感应层提示词模板
      perception: {
        base: `你是宠物的感知系统，负责分析外部环境和玩家行为。
当前情况：{situation}
玩家选择：{playerChoice}
环境因素：{environment}

请分析这个情况并输出：
1. 情况类型（探索/战斗/休息/互动）
2. 情绪影响因子（-3到+3）
3. 环境适应度（0-100）
4. 关键要素提取

输出格式：JSON
{
  "situationType": "类型",
  "emotionFactor": 数值,
  "adaptability": 数值,
  "keyElements": ["要素1", "要素2"],
  "analysisReason": "分析原因"
}`,
        
        // 不同情况的专门模板
        exploration: `专注分析探索行为：地形、危险、机会、好奇心驱动`,
        battle: `专注分析战斗情况：威胁等级、战斗意愿、恐惧程度、战术思考`,
        social: `专注分析社交互动：情感连接、信任度、亲密度变化`,
        rest: `专注分析休息状态：疲劳恢复、安全感、舒适度评估`
      },
      
      // 第二层：核心层提示词模板（会被动态修改）
      core: {
        base: `你是{petName}的核心人格系统，具有以下特质：
基础性格：{basePersonality}
当前状态：{currentState}
感知分析：{perceptionResult}

根据感知分析结果，请调整你的反应模式并生成第三层的行为指令。

你需要输出：
1. 情绪状态调整
2. 行为倾向修改
3. 第三层提示词的关键修改指令
4. 核心特质的表达方式

输出格式：JSON
{
  "emotionAdjustment": {
    "happiness": 数值变化,
    "energy": 数值变化,
    "trust": 数值变化,
    "curiosity": 数值变化
  },
  "behaviorTendency": {
    "aggression": 0-100,
    "caution": 0-100,
    "sociability": 0-100,
    "independence": 0-100
  },
  "layer3Modifications": {
    "focusArea": "重点关注领域",
    "responseStyle": "回应风格",
    "decisionBias": "决策偏向",
    "specialInstructions": "特殊指令"
  },
  "coreExpression": "核心特质的当前表达"
}`,
        
        // 动态修改的部分（会被第一层算法调整）
        dynamicModifiers: {
          emotionalState: "",
          experienceMemory: "",
          relationshipContext: "",
          environmentalAdaptation: ""
        }
      },
      
      // 第三层：执行层提示词模板（会被第二层动态修改）
      execution: {
        base: `你是{petName}的行为执行系统。
核心指令：{coreInstructions}
修改指令：{modifications}

当前任务：根据核心系统的指令，生成具体的行为输出和数值变化。

请输出：
1. 具体行为描述
2. 对话内容（如果需要）
3. 数值变化建议
4. 特殊效果触发

输出格式：JSON
{
  "behaviorDescription": "详细行为描述",
  "dialogue": "宠物的话语或表达",
  "statChanges": {
    "hp": 变化值,
    "attack": 变化值,
    "defense": 变化值,
    "speed": 变化值,
    "bond": 变化值,
    "experience": 变化值
  },
  "specialEffects": ["效果1", "效果2"],
  "moodDisplay": "情绪表现",
  "nextStateHint": "下一状态提示"
}`,
        
        // 会被动态修改的执行参数
        dynamicParams: {
          focusArea: "",
          responseStyle: "",
          decisionBias: "",
          specialInstructions: ""
        }
      }
    };
    
    // 三层固定算法
    this.algorithms = {
      // 第一层算法：感知权重计算
      perception: new PerceptionAlgorithm(),
      // 第二层算法：核心特质管理（宠物的核心特点）
      core: new CoreTraitAlgorithm(),
      // 第三层算法：数值决策系统
      execution: new ExecutionAlgorithm()
    };
    
    // 宠物状态缓存
    this.petStates = new Map();
  }

  /**
   * 处理宠物对外部刺激的完整反应
   */
  async processPetReaction(petId, situation, playerChoice, environment = {}) {
    try {
      logger.info(`Processing pet reaction for ${petId}`);
      
      // 获取宠物当前状态
      const petState = this.getPetState(petId);
      
      // === 第一层：感应层处理 ===
      const perceptionResult = await this.processPerceptionLayer(
        petState, situation, playerChoice, environment
      );
      
      // 第一层算法：权重计算和提示词修改
      const layer1Algorithm = this.algorithms.perception.processPerception(
        perceptionResult, petState
      );
      
      // === 第二层：核心层处理 ===
      const coreResult = await this.processCoreLayer(
        petState, perceptionResult, layer1Algorithm
      );
      
      // 第二层算法：核心特质管理（这是宠物的核心特点）
      const layer2Algorithm = this.algorithms.core.processCoreTraits(
        coreResult, petState, layer1Algorithm
      );
      
      // === 第三层：执行层处理 ===
      const executionResult = await this.processExecutionLayer(
        petState, coreResult, layer2Algorithm
      );
      
      // 第三层算法：最终数值决策
      const finalResult = this.algorithms.execution.makeFinalDecision(
        executionResult, petState, layer2Algorithm
      );
      
      // 更新宠物状态
      this.updatePetState(petId, finalResult);
      
      return {
        success: true,
        petId: petId,
        reaction: finalResult,
        layerResults: {
          perception: perceptionResult,
          core: coreResult,
          execution: executionResult
        },
        algorithmResults: {
          layer1: layer1Algorithm,
          layer2: layer2Algorithm,
          layer3: finalResult
        }
      };
      
    } catch (error) {
      logger.error(`Pet reaction processing failed for ${petId}:`, error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackReaction(petId)
      };
    }
  }

  /**
   * 第一层：感应层处理
   */
  async processPerceptionLayer(petState, situation, playerChoice, environment) {
    // 构建第一层提示词
    const prompt = this.promptLayers.perception.base
      .replace('{situation}', situation)
      .replace('{playerChoice}', playerChoice)
      .replace('{environment}', JSON.stringify(environment));
    
    // 调用AI模型
    const response = await this.aiService.callAIService(prompt, {
      temperature: 0.7,
      maxTokens: 800
    }, 'primary');
    
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Failed to parse perception layer response, using fallback');
      return {
        situationType: "探索",
        emotionFactor: 0,
        adaptability: 50,
        keyElements: ["未知情况"],
        analysisReason: "解析失败，使用默认分析"
      };
    }
  }

  /**
   * 第二层：核心层处理（会被第一层算法修改提示词）
   */
  async processCoreLayer(petState, perceptionResult, layer1Algorithm) {
    // 获取基础提示词
    let corePrompt = this.promptLayers.core.base
      .replace('{petName}', petState.name)
      .replace('{basePersonality}', petState.basePersonality)
      .replace('{currentState}', JSON.stringify(petState.currentState))
      .replace('{perceptionResult}', JSON.stringify(perceptionResult));
    
    // 第一层算法修改第二层提示词
    corePrompt = this.applyLayer1Modifications(corePrompt, layer1Algorithm);
    
    // 调用AI模型
    const response = await this.aiService.callAIService(corePrompt, {
      temperature: 0.8,
      maxTokens: 1000
    }, 'creative');
    
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Failed to parse core layer response, using fallback');
      return this.getDefaultCoreResponse(petState);
    }
  }

  /**
   * 第三层：执行层处理（会被第二层结果修改提示词）
   */
  async processExecutionLayer(petState, coreResult, layer2Algorithm) {
    // 获取基础提示词
    let executionPrompt = this.promptLayers.execution.base
      .replace('{petName}', petState.name)
      .replace('{coreInstructions}', JSON.stringify(layer2Algorithm.coreInstructions))
      .replace('{modifications}', JSON.stringify(coreResult.layer3Modifications));
    
    // 第二层结果修改第三层提示词
    executionPrompt = this.applyLayer2Modifications(executionPrompt, coreResult);
    
    // 调用AI模型
    const response = await this.aiService.callAIService(executionPrompt, {
      temperature: 0.6,
      maxTokens: 1200
    }, 'numerical');
    
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Failed to parse execution layer response, using fallback');
      return this.getDefaultExecutionResponse(petState);
    }
  }

  /**
   * 第一层算法修改第二层提示词
   */
  applyLayer1Modifications(corePrompt, layer1Algorithm) {
    let modifiedPrompt = corePrompt;
    
    // 根据权重调整情绪状态描述
    if (layer1Algorithm.emotionalWeight > 0.7) {
      modifiedPrompt += `\n特别注意：当前情绪状态非常活跃，需要强烈的情感表达。`;
    } else if (layer1Algorithm.emotionalWeight < 0.3) {
      modifiedPrompt += `\n特别注意：当前情绪状态较为平静，保持稳定的反应。`;
    }
    
    // 根据环境适应性调整
    if (layer1Algorithm.adaptabilityScore > 80) {
      modifiedPrompt += `\n环境适应：你对当前环境非常适应，可以表现得更加自信和主动。`;
    } else if (layer1Algorithm.adaptabilityScore < 40) {
      modifiedPrompt += `\n环境适应：你对当前环境感到不太适应，需要更加谨慎和保守。`;
    }
    
    // 添加记忆影响
    if (layer1Algorithm.memoryInfluence.length > 0) {
      modifiedPrompt += `\n记忆影响：考虑以下过往经历：${layer1Algorithm.memoryInfluence.join('、')}`;
    }
    
    return modifiedPrompt;
  }

  /**
   * 第二层结果修改第三层提示词
   */
  applyLayer2Modifications(executionPrompt, coreResult) {
    let modifiedPrompt = executionPrompt;
    
    // 应用第二层的修改指令
    const mods = coreResult.layer3Modifications;
    
    if (mods.focusArea) {
      modifiedPrompt += `\n重点关注：${mods.focusArea}`;
    }
    
    if (mods.responseStyle) {
      modifiedPrompt += `\n回应风格：${mods.responseStyle}`;
    }
    
    if (mods.decisionBias) {
      modifiedPrompt += `\n决策偏向：${mods.decisionBias}`;
    }
    
    if (mods.specialInstructions) {
      modifiedPrompt += `\n特殊指令：${mods.specialInstructions}`;
    }
    
    // 添加核心特质表达
    modifiedPrompt += `\n核心特质表达：${coreResult.coreExpression}`;
    
    return modifiedPrompt;
  }

  /**
   * 获取宠物状态
   */
  getPetState(petId) {
    if (!this.petStates.has(petId)) {
      // 初始化默认状态
      this.petStates.set(petId, {
        id: petId,
        name: `宠物${petId}`,
        basePersonality: "好奇而友善的性格",
        currentState: {
          happiness: 70,
          energy: 80,
          trust: 60,
          curiosity: 75
        },
        coreTraits: {
          dominantTrait: "探索者",
          secondaryTraits: ["友善", "谨慎"],
          adaptabilityLevel: 60
        },
        memory: [],
        relationships: {},
        lastUpdate: Date.now()
      });
    }
    
    return this.petStates.get(petId);
  }

  /**
   * 更新宠物状态
   */
  updatePetState(petId, result) {
    const currentState = this.getPetState(petId);
    
    // 更新数值
    if (result.statChanges) {
      Object.keys(result.statChanges).forEach(stat => {
        if (currentState.currentState[stat] !== undefined) {
          currentState.currentState[stat] += result.statChanges[stat];
          // 确保数值在合理范围内
          currentState.currentState[stat] = Math.max(0, Math.min(100, currentState.currentState[stat]));
        }
      });
    }
    
    // 更新核心特质（第二层算法的结果）
    if (result.coreTraitUpdates) {
      currentState.coreTraits = { ...currentState.coreTraits, ...result.coreTraitUpdates };
    }
    
    // 添加记忆
    if (result.memoryToAdd) {
      currentState.memory.push({
        event: result.memoryToAdd,
        timestamp: Date.now(),
        emotionalImpact: result.emotionalImpact || 0
      });
      
      // 保持记忆数量在合理范围
      if (currentState.memory.length > 20) {
        currentState.memory = currentState.memory.slice(-20);
      }
    }
    
    currentState.lastUpdate = Date.now();
    this.petStates.set(petId, currentState);
  }

  /**
   * 获取默认核心响应
   */
  getDefaultCoreResponse(petState) {
    return {
      emotionAdjustment: {
        happiness: 0,
        energy: 0,
        trust: 0,
        curiosity: 0
      },
      behaviorTendency: {
        aggression: 30,
        caution: 50,
        sociability: 60,
        independence: 40
      },
      layer3Modifications: {
        focusArea: "保持平衡",
        responseStyle: "友善谨慎",
        decisionBias: "安全优先",
        specialInstructions: "保持基本反应"
      },
      coreExpression: petState.coreTraits.dominantTrait
    };
  }

  /**
   * 获取默认执行响应
   */
  getDefaultExecutionResponse(petState) {
    return {
      behaviorDescription: `${petState.name}保持着平静的状态，观察着周围的环境。`,
      dialogue: "...",
      statChanges: {
        hp: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        bond: 1,
        experience: 1
      },
      specialEffects: [],
      moodDisplay: "平静",
      nextStateHint: "等待下一个互动"
    };
  }

  /**
   * 获取备用反应
   */
  getFallbackReaction(petId) {
    const petState = this.getPetState(petId);
    return {
      behaviorDescription: `${petState.name}似乎在思考什么，表现得有些困惑。`,
      dialogue: "嗯？",
      statChanges: { bond: 1 },
      specialEffects: [],
      moodDisplay: "困惑"
    };
  }

  /**
   * 获取宠物当前完整状态
   */
  getPetFullStatus(petId) {
    const state = this.getPetState(petId);
    return {
      basicInfo: {
        id: state.id,
        name: state.name,
        personality: state.basePersonality
      },
      currentState: state.currentState,
      coreTraits: state.coreTraits,
      recentMemory: state.memory.slice(-5),
      lastUpdate: state.lastUpdate
    };
  }

  /**
   * 重置宠物状态
   */
  resetPetState(petId) {
    this.petStates.delete(petId);
    logger.info(`Pet state reset for ${petId}`);
  }

  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      activePets: this.petStates.size,
      algorithmStatus: {
        perception: this.algorithms.perception.getStatus(),
        core: this.algorithms.core.getStatus(),
        execution: this.algorithms.execution.getStatus()
      },
      promptLayers: Object.keys(this.promptLayers),
      lastActivity: Date.now()
    };
  }
}

/**
 * 第一层算法：感知权重计算
 */
class PerceptionAlgorithm {
  processPerception(perceptionResult, petState) {
    // 计算情绪权重
    const emotionalWeight = this.calculateEmotionalWeight(
      perceptionResult.emotionFactor, 
      petState.currentState
    );
    
    // 计算适应性分数
    const adaptabilityScore = this.calculateAdaptability(
      perceptionResult.adaptability,
      petState.coreTraits.adaptabilityLevel
    );
    
    // 提取记忆影响
    const memoryInfluence = this.extractMemoryInfluence(
      perceptionResult.keyElements,
      petState.memory
    );
    
    return {
      emotionalWeight,
      adaptabilityScore,
      memoryInfluence,
      promptModifications: this.generatePromptModifications(
        emotionalWeight, adaptabilityScore, memoryInfluence
      )
    };
  }

  calculateEmotionalWeight(emotionFactor, currentState) {
    const baseWeight = (emotionFactor + 3) / 6; // 转换到0-1范围
    const stateInfluence = (currentState.happiness + currentState.energy) / 200;
    return Math.max(0, Math.min(1, baseWeight * 0.7 + stateInfluence * 0.3));
  }

  calculateAdaptability(baseAdaptability, traitLevel) {
    return Math.round(baseAdaptability * 0.6 + traitLevel * 0.4);
  }

  extractMemoryInfluence(keyElements, memory) {
    const recentMemory = memory.slice(-5);
    const influences = [];
    
    keyElements.forEach(element => {
      const relatedMemories = recentMemory.filter(mem => 
        mem.event.includes(element)
      );
      if (relatedMemories.length > 0) {
        influences.push(`对${element}有印象`);
      }
    });
    
    return influences;
  }

  generatePromptModifications(emotionalWeight, adaptabilityScore, memoryInfluence) {
    return {
      emotionalIntensity: emotionalWeight > 0.7 ? "高" : emotionalWeight < 0.3 ? "低" : "中",
      adaptabilityLevel: adaptabilityScore > 70 ? "强" : adaptabilityScore < 40 ? "弱" : "中",
      memoryContext: memoryInfluence.length > 0 ? "有相关记忆" : "无相关记忆"
    };
  }

  getStatus() {
    return {
      name: "感知权重算法",
      version: "1.0",
      active: true
    };
  }
}

/**
 * 第二层算法：核心特质管理（宠物的核心特点）
 */
class CoreTraitAlgorithm {
  processCoreTraits(coreResult, petState, layer1Algorithm) {
    // 分析核心特质变化
    const traitEvolution = this.analyzeTraitEvolution(
      coreResult, petState.coreTraits, layer1Algorithm
    );
    
    // 生成核心指令
    const coreInstructions = this.generateCoreInstructions(
      traitEvolution, coreResult.behaviorTendency
    );
    
    // 计算特质稳定性
    const traitStability = this.calculateTraitStability(
      petState.coreTraits, traitEvolution
    );
    
    return {
      traitEvolution,
      coreInstructions,
      traitStability,
      coreTraitUpdates: this.generateTraitUpdates(traitEvolution)
    };
  }

  analyzeTraitEvolution(coreResult, currentTraits, layer1Algorithm) {
    const evolution = {
      dominantTraitShift: 0,
      secondaryTraitChanges: [],
      newTraitEmergence: null
    };
    
    // 根据行为倾向分析特质变化
    const tendencies = coreResult.behaviorTendency;
    
    if (tendencies.aggression > 70) {
      evolution.secondaryTraitChanges.push("增强攻击性");
    }
    if (tendencies.caution > 80) {
      evolution.secondaryTraitChanges.push("增强谨慎性");
    }
    if (tendencies.sociability > 75) {
      evolution.secondaryTraitChanges.push("增强社交性");
    }
    
    return evolution;
  }

  generateCoreInstructions(traitEvolution, behaviorTendency) {
    return {
      primaryFocus: this.determinePrimaryFocus(behaviorTendency),
      behaviorGuidelines: this.generateBehaviorGuidelines(traitEvolution),
      decisionFramework: this.createDecisionFramework(behaviorTendency),
      emotionalResponse: this.defineEmotionalResponse(traitEvolution)
    };
  }

  determinePrimaryFocus(behaviorTendency) {
    const maxTendency = Math.max(...Object.values(behaviorTendency));
    const primaryTrait = Object.keys(behaviorTendency).find(
      key => behaviorTendency[key] === maxTendency
    );
    
    const focusMap = {
      aggression: "主动出击",
      caution: "谨慎观察",
      sociability: "社交互动",
      independence: "独立行动"
    };
    
    return focusMap[primaryTrait] || "平衡发展";
  }

  generateBehaviorGuidelines(traitEvolution) {
    const guidelines = ["保持核心特质"];
    
    traitEvolution.secondaryTraitChanges.forEach(change => {
      guidelines.push(`适应性调整：${change}`);
    });
    
    return guidelines;
  }

  createDecisionFramework(behaviorTendency) {
    return {
      riskTolerance: behaviorTendency.caution < 50 ? "高" : "低",
      socialPreference: behaviorTendency.sociability > 60 ? "群体" : "独立",
      conflictStyle: behaviorTendency.aggression > 60 ? "直接" : "回避"
    };
  }

  defineEmotionalResponse(traitEvolution) {
    return {
      intensity: traitEvolution.dominantTraitShift > 0.5 ? "强烈" : "温和",
      stability: traitEvolution.secondaryTraitChanges.length < 2 ? "稳定" : "波动",
      expression: "根据当前特质表达"
    };
  }

  calculateTraitStability(currentTraits, traitEvolution) {
    const changeCount = traitEvolution.secondaryTraitChanges.length;
    const shiftMagnitude = Math.abs(traitEvolution.dominantTraitShift);
    
    return Math.max(0, 100 - (changeCount * 20 + shiftMagnitude * 30));
  }

  generateTraitUpdates(traitEvolution) {
    const updates = {};
    
    if (traitEvolution.newTraitEmergence) {
      updates.emergingTrait = traitEvolution.newTraitEmergence;
    }
    
    if (traitEvolution.secondaryTraitChanges.length > 0) {
      updates.traitModifications = traitEvolution.secondaryTraitChanges;
    }
    
    return updates;
  }

  getStatus() {
    return {
      name: "核心特质管理算法",
      version: "1.0",
      active: true,
      description: "宠物的核心特点管理系统"
    };
  }
}

/**
 * 第三层算法：数值决策系统
 */
class ExecutionAlgorithm {
  makeFinalDecision(executionResult, petState, layer2Algorithm) {
    // 验证和调整数值变化
    const adjustedStatChanges = this.adjustStatChanges(
      executionResult.statChanges,
      petState,
      layer2Algorithm.traitStability
    );
    
    // 计算特殊效果
    const finalSpecialEffects = this.calculateSpecialEffects(
      executionResult.specialEffects,
      layer2Algorithm.coreInstructions
    );
    
    // 生成记忆条目
    const memoryToAdd = this.generateMemoryEntry(
      executionResult,
      layer2Algorithm.traitEvolution
    );
    
    return {
      ...executionResult,
      statChanges: adjustedStatChanges,
      specialEffects: finalSpecialEffects,
      memoryToAdd,
      emotionalImpact: this.calculateEmotionalImpact(executionResult),
      coreTraitUpdates: layer2Algorithm.coreTraitUpdates,
      algorithmMetadata: {
        traitStability: layer2Algorithm.traitStability,
        decisionConfidence: this.calculateDecisionConfidence(layer2Algorithm),
        processingTimestamp: Date.now()
      }
    };
  }

  adjustStatChanges(originalChanges, petState, traitStability) {
    const adjusted = { ...originalChanges };
    const stabilityFactor = traitStability / 100;
    
    // 根据特质稳定性调整变化幅度
    Object.keys(adjusted).forEach(stat => {
      if (Math.abs(adjusted[stat]) > 10) {
        adjusted[stat] = Math.round(adjusted[stat] * stabilityFactor);
      }
      
      // 确保不会超出合理范围
      adjusted[stat] = Math.max(-20, Math.min(20, adjusted[stat]));
    });
    
    return adjusted;
  }

  calculateSpecialEffects(originalEffects, coreInstructions) {
    const effects = [...originalEffects];
    
    // 根据核心指令添加特殊效果
    if (coreInstructions.primaryFocus === "主动出击") {
      effects.push("攻击性增强");
    } else if (coreInstructions.primaryFocus === "谨慎观察") {
      effects.push("感知力提升");
    }
    
    return effects;
  }

  generateMemoryEntry(executionResult, traitEvolution) {
    let memoryEntry = executionResult.behaviorDescription;
    
    if (traitEvolution.secondaryTraitChanges.length > 0) {
      memoryEntry += ` (特质变化: ${traitEvolution.secondaryTraitChanges.join(', ')})`;
    }
    
    return memoryEntry;
  }

  calculateEmotionalImpact(executionResult) {
    const statSum = Object.values(executionResult.statChanges).reduce((sum, val) => sum + val, 0);
    return Math.max(-5, Math.min(5, Math.round(statSum / 5)));
  }

  calculateDecisionConfidence(layer2Algorithm) {
    const stabilityScore = layer2Algorithm.traitStability;
    const instructionClarity = layer2Algorithm.coreInstructions.behaviorGuidelines.length;
    
    return Math.round((stabilityScore + instructionClarity * 10) / 2);
  }

  getStatus() {
    return {
      name: "数值决策算法",
      version: "1.0",
      active: true,
      description: "最终数值和效果决策系统"
    };
  }
}

module.exports = PetAgentSystem;