/**
 * AI服务接口 - 统一管理所有AI API调用
 * 支持多种AI服务提供商，具备降级和缓存机制
 */

const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    // 支持多个AI服务配置
    this.services = {
      // 主服务（用于内容生成）
      primary: {
        apiUrl: process.env.AI_API_URL,
        apiKey: process.env.AI_API_KEY,
        modelName: process.env.AI_MODEL_NAME
      },
      // 数值服务（用于精确输出，可选）
      numerical: {
        apiUrl: process.env.AI_NUMERICAL_API_URL || process.env.AI_API_URL,
        apiKey: process.env.AI_NUMERICAL_API_KEY || process.env.AI_API_KEY,
        modelName: process.env.AI_NUMERICAL_MODEL || process.env.AI_MODEL_NAME
      },
      // 创意服务（用于故事生成，可选）
      creative: {
        apiUrl: process.env.AI_CREATIVE_API_URL || process.env.AI_API_URL,
        apiKey: process.env.AI_CREATIVE_API_KEY || process.env.AI_API_KEY,
        modelName: process.env.AI_CREATIVE_MODEL || process.env.AI_MODEL_NAME
      }
    };
    
    this.cache = new Map(); // 简单内存缓存
    this.requestCount = 0;
    this.maxRequestsPerHour = 1000; // API调用限制
  }

  /**
   * 生成内容的主要接口
   */
  async generateContent(prompt, options = {}) {
    return await this.callAIService(prompt, options, 'primary');
  }

  /**
   * 第二层：生成进化内容（创意导向）
   */
  async generateEvolutionContent(prompt, options = {}) {
    return await this.callAIService(prompt, { 
      ...options, 
      temperature: 0.8,
      maxTokens: 1200 
    }, 'creative');
  }

  /**
   * 第三层：生成数值输出（精确导向）
   */
  async generateNumericalOutput(prompt, options = {}) {
    return await this.callAIService(prompt, { 
      ...options, 
      temperature: 0.2,
      maxTokens: 800 
    }, 'numerical');
  }

  /**
   * 统一的AI服务调用方法
   */
  async callAIService(prompt, options = {}, serviceType = 'primary') {
    // 检查缓存
    const cacheKey = this.generateCacheKey(prompt, options, serviceType);
    if (this.cache.has(cacheKey)) {
      logger.info(`Using cached AI response for ${serviceType}`);
      return this.cache.get(cacheKey);
    }

    // 检查API调用限制
    if (this.requestCount >= this.maxRequestsPerHour) {
      logger.warn('API rate limit reached, using fallback');
      return this.getFallbackResponse(prompt, serviceType);
    }

    try {
      const response = await this.callAIAPI(prompt, options, serviceType);
      
      // 缓存结果
      this.cache.set(cacheKey, response);
      this.requestCount++;
      
      logger.info(`AI content generated successfully using ${serviceType} service`);
      return response;
    } catch (error) {
      logger.error(`AI API call failed for ${serviceType}:`, error);
      return this.getFallbackResponse(prompt, serviceType);
    }
  }

  /**
   * 调用AI API的核心方法 - 适配DeepSeek API
   */
  async callAIAPI(prompt, options, serviceType = 'primary') {
    const service = this.services[serviceType];
    
    if (!service.apiUrl || !service.apiKey) {
      throw new Error(`AI service '${serviceType}' not configured`);
    }

    const systemPrompts = {
      primary: "你是《灵境斗宠录》的AI进化设计师，专门负责根据宠物的行为和特性设计合理的进化方向。请用中文回答。",
      numerical: "你是《灵境斗宠录》的数值智能体，专门负责将进化描述转换为精确的游戏数值和词条。必须严格按照JSON格式输出，不要添加任何其他文字。",
      creative: "你是《灵境斗宠录》的故事创作师，专门负责生成生动有趣的冒险故事和宠物相遇描述。请用中文创作。"
    };

    const requestData = {
      model: service.modelName,
      messages: [
        {
          role: "system",
          content: systemPrompts[serviceType] || systemPrompts.primary
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: options.temperature || (serviceType === 'numerical' ? 0.3 : 0.7),
      max_tokens: options.maxTokens || 1000,
      stream: false
    };

    logger.info(`Calling DeepSeek API for ${serviceType} service`);
    
    const response = await axios.post(service.apiUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const content = response.data.choices[0].message.content;
    logger.info(`DeepSeek API response received for ${serviceType}, length: ${content.length}`);
    
    return content;
  }

  /**
   * 批量生成内容（成本优化）
   */
  async batchGenerate(prompts, options = {}) {
    const results = [];
    
    // 将prompts分批处理，每批5个
    const batchSize = 5;
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchPromises = batch.map(prompt => 
        this.generateContent(prompt, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => 
        r.status === 'fulfilled' ? r.value : this.getFallbackResponse('')
      ));
      
      // 批次间延迟，避免API限制
      if (i + batchSize < prompts.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  /**
   * 生成事件描述（用于托管奇遇）
   */
  async generateEventDescription(pet, eventType, context) {
    const prompt = `为宠物生成${eventType}事件描述：

宠物信息：
- 名称：${pet.name}
- 特性：${pet.base_prompt}
- 当前状态：HP=${pet.hp}, 攻击=${pet.attack}

事件背景：${context}

请生成一个50-100字的有趣事件描述，包含：
1. 事件经过
2. 宠物的反应
3. 可能的收获

格式：纯文字描述，生动有趣。`;

    return await this.generateContent(prompt, { temperature: 0.8 });
  }

  /**
   * 生成宠物相遇描述
   */
  async generateEncounterDescription(pet1, pet2, encounterType) {
    const prompt = `生成两只宠物的相遇描述：

宠物A：${pet1.name} - ${pet1.base_prompt}
宠物B：${pet2.name} - ${pet2.base_prompt}
相遇类型：${encounterType}

请生成一个温馨有趣的相遇故事，80-150字，包含：
1. 相遇的场景
2. 双方的互动
3. 各自的收获

要求：积极正面，符合游戏世界观。`;

    return await this.generateContent(prompt, { temperature: 0.9 });
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(prompt, options, serviceType = 'primary') {
    const optionsStr = JSON.stringify(options);
    return `${serviceType}_${prompt.substring(0, 100)}_${optionsStr}`.replace(/\s+/g, '_');
  }

  /**
   * 降级响应
   */
  getFallbackResponse(prompt, serviceType = 'primary') {
    const fallbackTemplates = {
      primary: [
        {
          evolution_description: "在神秘力量的引导下，宠物发生了微妙而深刻的变化。",
          new_traits: [{
            name: "神秘强化",
            type: "passive",
            effect_description: "获得了来自未知力量的祝福",
            is_negative: false
          }],
          attribute_changes: { hp: 5, attack: 3, defense: 3, speed: 2 }
        }
      ],
      creative: [
        "在一片宁静的森林中，宠物遇到了一只友善的小动物，它们一起分享了美好的时光。",
        "宠物在探索中发现了一处隐秘的花园，那里的花朵散发着淡淡的魔法光芒。",
        "经过一番冒险，宠物在古老的石碑前感受到了来自远古的智慧。"
      ],
      numerical: [
        {
          evolution_description: "基础能力得到了稳定的提升",
          new_traits: [{
            name: "稳定成长",
            type: "passive",
            effect_description: "全属性小幅提升",
            is_negative: false
          }],
          attribute_changes: { hp: 5, attack: 3, defense: 3, speed: 2 }
        }
      ]
    };

    const templates = fallbackTemplates[serviceType] || fallbackTemplates.primary;
    const randomIndex = Math.floor(Math.random() * templates.length);
    const result = templates[randomIndex];
    
    return typeof result === 'string' ? result : JSON.stringify(result);
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    logger.info('AI service cache cleared');
  }

  /**
   * 重置请求计数（每小时调用）
   */
  resetRequestCount() {
    this.requestCount = 0;
    logger.info('AI service request count reset');
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      configured: !!(this.apiUrl && this.apiKey),
      cacheSize: this.cache.size,
      requestCount: this.requestCount,
      remainingRequests: this.maxRequestsPerHour - this.requestCount
    };
  }
}

module.exports = AIService;