/**
 * 宠物智能体核心模块
 * 专门处理三层嵌套提示词的核心逻辑
 */

const logger = require('../../utils/logger');

class PetAgentCore {
  constructor(aiService) {
    this.aiService = aiService;
    
    // 宠物个性化配置
    this.personalityProfiles = {
      // 探索型宠物
      explorer: {
        baseTraits: {
          curiosity: 85,
          caution: 40,
          sociability: 60,
          independence: 75
        },
        promptModifiers: {
          perception: "特别关注新奇事物和未知领域",
          core: "以探索和发现为核心驱动力",
          execution: "倾向于选择冒险和探索的行为"
        }
      },
      
      // 守护型宠物
      guardian: {
        baseTraits: {
          loyalty: 90,
          protectiveness: 85,
          caution: 70,
          aggression: 60
        },
        promptModifiers: {
          perception: "高度警觉周围的威胁和危险",
          core: "以保护主人和维护安全为首要目标",
          execution: "优先考虑防御和保护性行为"
        }
      },
      
      // 社交型宠物
      social: {
        baseTraits: {
          sociability: 90,
          empathy: 80,
          playfulness: 75,
          cooperation: 85
        },
        promptModifiers: {
          perception: "敏感地察觉他人的情绪和社交信号",
          core: "以建立和维护关系为核心目标",
          execution: "倾向于选择互动和合作的行为"
        }
      },
      
      // 智慧型宠物
      sage: {
        baseTraits: {
          intelligence: 95,
          patience: 80,
          observation: 85,
          wisdom: 90
        },
        promptModifiers: {
          perception: "深度分析情况的本质和潜在含义",
          core: "以理解和智慧为指导原则",
          execution: "倾向于选择深思熟虑的理性行为"
        }
      }
    };
    
    // 动态提示词生成器
    this.promptGenerator = new DynamicPromptGenerator();
    
    // 特质进化追踪器
    this.traitEvolutionTracker = new TraitEvolutionTracker();
  }

  /**
   * 为特定宠物生成个性化的三层提示词
   */
  generatePersonalizedPrompts(petProfile, situation) {
    const personality = this.personalityProfiles[petProfile.type] || this.personalityProfiles.explorer;
    
    return {
      layer1: this.generateLayer1Prompt(petProfile, personality, situation),
      layer2: this.generateLayer2Prompt(petProfile, personality, situation),
      layer3: this.generateLayer3Prompt(petProfile, personality, situation)
    };
  }

  /**
   * 生成第一层感知提示词
   */
  generateLayer1Prompt(petProfile, personality, situation) {
    const basePrompt = `你是${petProfile.name}的感知系统，一只${petProfile.race}属性的${petProfile.type}型宠物。

核心特质：
${Object.entries(personality.baseTraits).map(([trait, value]) => `- ${trait}: ${value}/100`).join('\n')}

个性化感知特点：${personality.promptModifiers.perception}

当前情况分析：
环境：${situation.environment}
玩家行为：${situation.playerAction}
周围因素：${JSON.stringify(situation.context)}

请根据你的个性特质分析这个情况，输出：
1. 情况类型识别
2. 个人情绪反应强度（基于你的特质）
3. 环境适应评估
4. 关键要素提取（符合你的关注点）
5. 对第二层的建议（如何调整核心反应）

输出JSON格式：
{
  "situationType": "类型",
  "emotionalIntensity": 1-10,
  "adaptationLevel": 1-100,
  "keyFocus": ["重点1", "重点2"],
  "layer2Suggestions": {
    "focusAdjustment": "建议调整",
    "emotionalTone": "情绪基调",
    "behaviorHint": "行为提示"
  }
}`;

    return basePrompt;
  }

  /**
   * 生成第二层核心提示词（会被第一层动态修改）
   */
  generateLayer2Prompt(petProfile, personality, situation) {
    const basePrompt = `你是${petProfile.name}的核心人格系统。

基础设定：
- 种族：${petProfile.race}
- 类型：${petProfile.type}
- 核心特质：${personality.promptModifiers.core}
- 当前等级：${petProfile.level || 1}
- 进化阶段：${petProfile.evolutionStage || '幼年期'}

个性化核心特点：
${Object.entries(personality.baseTraits).map(([trait, value]) => 
  `- ${trait}: ${this.getTraitDescription(trait, value)}`
).join('\n')}

[第一层感知结果将在这里插入]

根据感知层的分析，请调整你的核心反应模式：

1. 情绪状态调整（基于你的个性）
2. 行为倾向修正（符合你的特质）
3. 对第三层的具体指令（如何表现）
4. 核心特质的当前表达方式

输出JSON格式：
{
  "emotionalState": {
    "primary": "主要情绪",
    "intensity": 1-10,
    "stability": 1-10
  },
  "behaviorAdjustment": {
    "aggression": 1-100,
    "caution": 1-100,
    "sociability": 1-100,
    "curiosity": 1-100
  },
  "layer3Instructions": {
    "actionStyle": "行为风格",
    "responsePattern": "回应模式",
    "priorityFocus": "优先关注",
    "specialBehavior": "特殊行为指令"
  },
  "traitExpression": "当前特质表达描述"
}`;

    return basePrompt;
  }

  /**
   * 生成第三层执行提示词（会被第二层动态修改）
   */
  generateLayer3Prompt(petProfile, personality, situation) {
    const basePrompt = `你是${petProfile.name}的行为执行系统。

执行参数：
- 宠物名称：${petProfile.name}
- 当前状态：${JSON.stringify(petProfile.currentStats)}
- 个性化执行特点：${personality.promptModifiers.execution}

[第二层核心指令将在这里插入]

根据核心系统的指令，生成具体的行为输出：

1. 详细行为描述（体现个性特点）
2. 对话内容（符合性格）
3. 数值变化建议（基于行为逻辑）
4. 特殊效果触发（如果有）
5. 情绪表现描述
6. 下一状态预测

输出JSON格式：
{
  "behavior": {
    "description": "详细行为描述",
    "dialogue": "宠物的话语或表达",
    "bodyLanguage": "肢体语言描述"
  },
  "statChanges": {
    "hp": 变化值,
    "attack": 变化值,
    "defense": 变化值,
    "speed": 变化值,
    "bond": 变化值,
    "experience": 变化值
  },
  "effects": {
    "immediate": ["立即效果"],
    "delayed": ["延迟效果"],
    "environmental": ["环境影响"]
  },
  "emotionalDisplay": {
    "mood": "情绪状态",
    "expression": "表情描述",
    "energy": "活力表现"
  },
  "nextState": {
    "prediction": "下一状态预测",
    "readiness": "准备度1-100"
  }
}`;

    return basePrompt;
  }

  /**
   * 获取特质描述
   */
  getTraitDescription(trait, value) {
    const descriptions = {
      curiosity: value > 80 ? "极度好奇" : value > 60 ? "较为好奇" : value > 40 ? "一般好奇" : "不太好奇",
      caution: value > 80 ? "极度谨慎" : value > 60 ? "比较谨慎" : value > 40 ? "适度谨慎" : "不太谨慎",
      sociability: value > 80 ? "非常社交" : value > 60 ? "喜欢社交" : value > 40 ? "一般社交" : "不爱社交",
      independence: value > 80 ? "高度独立" : value > 60 ? "比较独立" : value > 40 ? "适度独立" : "依赖性强",
      loyalty: value > 80 ? "绝对忠诚" : value > 60 ? "非常忠诚" : value > 40 ? "比较忠诚" : "一般忠诚",
      protectiveness: value > 80 ? "强烈保护欲" : value > 60 ? "有保护欲" : value > 40 ? "一般保护欲" : "保护欲较弱",
      aggression: value > 80 ? "高攻击性" : value > 60 ? "有攻击性" : value > 40 ? "温和攻击性" : "非攻击性",
      empathy: value > 80 ? "高度共情" : value > 60 ? "善于共情" : value > 40 ? "一般共情" : "共情能力弱",
      playfulness: value > 80 ? "极度爱玩" : value > 60 ? "喜欢玩耍" : value > 40 ? "偶尔玩耍" : "不爱玩耍",
      cooperation: value > 80 ? "高度合作" : value > 60 ? "善于合作" : value > 40 ? "一般合作" : "不善合作",
      intelligence: value > 80 ? "极高智慧" : value > 60 ? "聪明智慧" : value > 40 ? "一般智慧" : "智慧一般",
      patience: value > 80 ? "极度耐心" : value > 60 ? "很有耐心" : value > 40 ? "一般耐心" : "缺乏耐心",
      observation: value > 80 ? "敏锐观察" : value > 60 ? "善于观察" : value > 40 ? "一般观察" : "观察力弱",
      wisdom: value > 80 ? "大智若愚" : value > 60 ? "颇有智慧" : value > 40 ? "一般智慧" : "智慧有限"
    };
    
    return descriptions[trait] || `${trait}: ${value}`;
  }

  /**
   * 执行三层嵌套处理
   */
  async executeThreeLayerProcess(petProfile, situation) {
    try {
      // 生成个性化提示词
      const prompts = this.generatePersonalizedPrompts(petProfile, situation);
      
      // 第一层：感知处理
      const layer1Result = await this.processLayer1(prompts.layer1, petProfile);
      
      // 第一层算法修改第二层提示词
      const modifiedLayer2Prompt = this.applyLayer1Modifications(
        prompts.layer2, layer1Result, petProfile
      );
      
      // 第二层：核心处理
      const layer2Result = await this.processLayer2(modifiedLayer2Prompt, petProfile);
      
      // 第二层结果修改第三层提示词
      const modifiedLayer3Prompt = this.applyLayer2Modifications(
        prompts.layer3, layer2Result, petProfile
      );
      
      // 第三层：执行处理
      const layer3Result = await this.processLayer3(modifiedLayer3Prompt, petProfile);
      
      // 更新特质进化
      this.traitEvolutionTracker.updateEvolution(petProfile.id, {
        layer1Result,
        layer2Result,
        layer3Result
      });
      
      return {
        success: true,
        petId: petProfile.id,
        results: {
          perception: layer1Result,
          core: layer2Result,
          execution: layer3Result
        },
        traitEvolution: this.traitEvolutionTracker.getEvolution(petProfile.id)
      };
      
    } catch (error) {
      logger.error(`Three-layer process failed for pet ${petProfile.id}:`, error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackResponse(petProfile)
      };
    }
  }

  /**
   * 处理第一层
   */
  async processLayer1(prompt, petProfile) {
    const response = await this.aiService.callAIService(prompt, {
      temperature: 0.7,
      maxTokens: 800
    }, 'primary');
    
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Layer 1 parsing failed, using fallback');
      return this.getLayer1Fallback(petProfile);
    }
  }

  /**
   * 处理第二层
   */
  async processLayer2(prompt, petProfile) {
    const response = await this.aiService.callAIService(prompt, {
      temperature: 0.8,
      maxTokens: 1000
    }, 'creative');
    
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Layer 2 parsing failed, using fallback');
      return this.getLayer2Fallback(petProfile);
    }
  }

  /**
   * 处理第三层
   */
  async processLayer3(prompt, petProfile) {
    const response = await this.aiService.callAIService(prompt, {
      temperature: 0.6,
      maxTokens: 1200
    }, 'numerical');
    
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Layer 3 parsing failed, using fallback');
      return this.getLayer3Fallback(petProfile);
    }
  }

  /**
   * 应用第一层修改到第二层
   */
  applyLayer1Modifications(layer2Prompt, layer1Result, petProfile) {
    let modifiedPrompt = layer2Prompt;
    
    // 插入第一层感知结果
    const perceptionInsert = `
第一层感知分析结果：
- 情况类型：${layer1Result.situationType}
- 情绪强度：${layer1Result.emotionalIntensity}/10
- 适应水平：${layer1Result.adaptationLevel}/100
- 关键关注：${layer1Result.keyFocus?.join('、') || '无特殊关注'}

第一层建议：
- 焦点调整：${layer1Result.layer2Suggestions?.focusAdjustment || '保持当前'}
- 情绪基调：${layer1Result.layer2Suggestions?.emotionalTone || '平稳'}
- 行为提示：${layer1Result.layer2Suggestions?.behaviorHint || '正常反应'}
`;
    
    modifiedPrompt = modifiedPrompt.replace(
      '[第一层感知结果将在这里插入]',
      perceptionInsert
    );
    
    return modifiedPrompt;
  }

  /**
   * 应用第二层修改到第三层
   */
  applyLayer2Modifications(layer3Prompt, layer2Result, petProfile) {
    let modifiedPrompt = layer3Prompt;
    
    // 插入第二层核心指令
    const coreInsert = `
第二层核心指令：
情绪状态：${layer2Result.emotionalState?.primary || '平静'} (强度: ${layer2Result.emotionalState?.intensity || 5}/10)

行为调整参数：
- 攻击性：${layer2Result.behaviorAdjustment?.aggression || 50}/100
- 谨慎性：${layer2Result.behaviorAdjustment?.caution || 50}/100
- 社交性：${layer2Result.behaviorAdjustment?.sociability || 50}/100
- 好奇心：${layer2Result.behaviorAdjustment?.curiosity || 50}/100

执行指令：
- 行为风格：${layer2Result.layer3Instructions?.actionStyle || '自然'}
- 回应模式：${layer2Result.layer3Instructions?.responsePattern || '正常'}
- 优先关注：${layer2Result.layer3Instructions?.priorityFocus || '平衡'}
- 特殊行为：${layer2Result.layer3Instructions?.specialBehavior || '无'}

特质表达：${layer2Result.traitExpression || '保持基本特质'}
`;
    
    modifiedPrompt = modifiedPrompt.replace(
      '[第二层核心指令将在这里插入]',
      coreInsert
    );
    
    return modifiedPrompt;
  }

  /**
   * 获取各层备用响应
   */
  getLayer1Fallback(petProfile) {
    return {
      situationType: "日常互动",
      emotionalIntensity: 5,
      adaptationLevel: 60,
      keyFocus: ["观察", "适应"],
      layer2Suggestions: {
        focusAdjustment: "保持平衡",
        emotionalTone: "平和",
        behaviorHint: "正常反应"
      }
    };
  }

  getLayer2Fallback(petProfile) {
    return {
      emotionalState: {
        primary: "平静",
        intensity: 5,
        stability: 7
      },
      behaviorAdjustment: {
        aggression: 30,
        caution: 60,
        sociability: 50,
        curiosity: 40
      },
      layer3Instructions: {
        actionStyle: "温和",
        responsePattern: "友善",
        priorityFocus: "安全",
        specialBehavior: "无"
      },
      traitExpression: "表现出基本的友善特质"
    };
  }

  getLayer3Fallback(petProfile) {
    return {
      behavior: {
        description: `${petProfile.name}保持着平静的状态，友善地看着周围。`,
        dialogue: "...",
        bodyLanguage: "放松的姿态"
      },
      statChanges: {
        hp: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        bond: 1,
        experience: 1
      },
      effects: {
        immediate: [],
        delayed: [],
        environmental: []
      },
      emotionalDisplay: {
        mood: "平静",
        expression: "温和",
        energy: "稳定"
      },
      nextState: {
        prediction: "继续观察",
        readiness: 70
      }
    };
  }

  generateFallbackResponse(petProfile) {
    return {
      behavior: `${petProfile.name}似乎在思考什么...`,
      dialogue: "嗯？",
      statChanges: { bond: 1 },
      mood: "困惑"
    };
  }
}

/**
 * 动态提示词生成器
 */
class DynamicPromptGenerator {
  constructor() {
    this.templates = new Map();
    this.modificationHistory = new Map();
  }

  generateDynamicPrompt(baseTemplate, modifications, context) {
    let prompt = baseTemplate;
    
    // 应用动态修改
    modifications.forEach(mod => {
      prompt = this.applyModification(prompt, mod, context);
    });
    
    return prompt;
  }

  applyModification(prompt, modification, context) {
    // 实现具体的提示词修改逻辑
    switch (modification.type) {
      case 'emotional_emphasis':
        return this.addEmotionalEmphasis(prompt, modification.value);
      case 'behavior_focus':
        return this.addBehaviorFocus(prompt, modification.value);
      case 'context_injection':
        return this.injectContext(prompt, modification.value, context);
      default:
        return prompt;
    }
  }

  addEmotionalEmphasis(prompt, emotion) {
    return prompt + `\n特别注意：当前情绪状态偏向${emotion}，请在回应中体现这种情绪。`;
  }

  addBehaviorFocus(prompt, behavior) {
    return prompt + `\n行为重点：优先考虑${behavior}相关的行为选择。`;
  }

  injectContext(prompt, contextInfo, fullContext) {
    return prompt + `\n上下文信息：${contextInfo}`;
  }
}

/**
 * 特质进化追踪器
 */
class TraitEvolutionTracker {
  constructor() {
    this.evolutionHistory = new Map();
    this.traitTrends = new Map();
  }

  updateEvolution(petId, layerResults) {
    if (!this.evolutionHistory.has(petId)) {
      this.evolutionHistory.set(petId, []);
    }
    
    const history = this.evolutionHistory.get(petId);
    history.push({
      timestamp: Date.now(),
      results: layerResults
    });
    
    // 保持历史记录在合理范围内
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    // 分析趋势
    this.analyzeTrends(petId, history);
  }

  analyzeTrends(petId, history) {
    if (history.length < 5) return;
    
    const recent = history.slice(-5);
    const trends = {
      emotionalStability: this.calculateEmotionalTrend(recent),
      behaviorConsistency: this.calculateBehaviorTrend(recent),
      adaptabilityGrowth: this.calculateAdaptabilityTrend(recent)
    };
    
    this.traitTrends.set(petId, trends);
  }

  calculateEmotionalTrend(recentHistory) {
    // 计算情绪稳定性趋势
    const emotions = recentHistory.map(h => h.results.perception.emotionalIntensity);
    const variance = this.calculateVariance(emotions);
    return variance < 2 ? "稳定" : variance < 4 ? "波动" : "不稳定";
  }

  calculateBehaviorTrend(recentHistory) {
    // 计算行为一致性趋势
    const behaviors = recentHistory.map(h => h.results.core.behaviorAdjustment);
    // 简化的一致性计算
    return "一致"; // 实际实现会更复杂
  }

  calculateAdaptabilityTrend(recentHistory) {
    // 计算适应性成长趋势
    const adaptability = recentHistory.map(h => h.results.perception.adaptationLevel);
    const trend = adaptability[adaptability.length - 1] - adaptability[0];
    return trend > 5 ? "提升" : trend < -5 ? "下降" : "稳定";
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length);
  }

  getEvolution(petId) {
    return {
      history: this.evolutionHistory.get(petId) || [],
      trends: this.traitTrends.get(petId) || {},
      summary: this.generateEvolutionSummary(petId)
    };
  }

  generateEvolutionSummary(petId) {
    const trends = this.traitTrends.get(petId);
    if (!trends) return "数据不足";
    
    return `情绪${trends.emotionalStability}，行为${trends.behaviorConsistency}，适应性${trends.adaptabilityGrowth}`;
  }
}

module.exports = PetAgentCore;