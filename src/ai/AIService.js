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
        apiUrl: process.env.AI_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        apiKey: process.env.AI_API_KEY || '2ffe7955-a0a1-4238-93cd-d354c2c6d7ec',
        modelName: process.env.AI_MODEL_NAME || 'kimi-k2-250905'
      },
      // 数值服务（用于精确输出，可选）
      numerical: {
        apiUrl: process.env.AI_NUMERICAL_API_URL || process.env.AI_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        apiKey: process.env.AI_NUMERICAL_API_KEY || process.env.AI_API_KEY || '2ffe7955-a0a1-4238-93cd-d354c2c6d7ec',
        modelName: process.env.AI_NUMERICAL_MODEL || process.env.AI_MODEL_NAME || 'kimi-k2-250905'
      },
      // 创意服务（用于故事生成，可选）
      creative: {
        apiUrl: process.env.AI_CREATIVE_API_URL || process.env.AI_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        apiKey: process.env.AI_CREATIVE_API_KEY || process.env.AI_API_KEY || '2ffe7955-a0a1-4238-93cd-d354c2c6d7ec',
        modelName: process.env.AI_CREATIVE_MODEL || process.env.AI_MODEL_NAME || 'kimi-k2-250905'
      },
      // 图像生成服务（即梦4.0）
      image: {
        apiUrl: process.env.AI_IMAGE_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/images/generate',
        apiKey: process.env.AI_IMAGE_API_KEY || '4b24c728-0bd9-4e0c-9a96-670f03a458cb',
        modelName: process.env.AI_IMAGE_MODEL || 'ep-20250930175835-vxgn4'
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
      timeout: 15000,
      proxy: false,
      httpsAgent: new (require('https').Agent)({ keepAlive: true })
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
   * 生成宠物外貌图像（使用即梦4.0）
   */
  async generatePetImage(pet, options = {}) {
    const service = this.services.image;
    
    if (!service.apiUrl || !service.apiKey) {
      throw new Error('Image generation service not configured');
    }

    // 构建宠物外貌描述prompt
    const imagePrompt = this.buildPetImagePrompt(pet, options);
    
    try {
      logger.info(`Generating pet image for ${pet.name || pet.race}`);
      
      const requestData = {
        model: service.modelName,
        prompt: imagePrompt,
        sequential_image_generation: "disabled",
        response_format: "url",
        size: options.size || "2K",
        stream: false,
        watermark: options.watermark !== false // 默认开启水印
      };

      const response = await axios.post(service.apiUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${service.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000, // 图像生成需要更长时间
        proxy: false,
        httpsAgent: new (require('https').Agent)({ keepAlive: true })
      });

      if (!response.data || !response.data.data || !response.data.data[0]) {
        throw new Error('Invalid response format from image generation API');
      }

      const imageUrl = response.data.data[0].url;
      logger.info(`Pet image generated successfully: ${imageUrl}`);
      
      return {
        imageUrl: imageUrl,
        prompt: imagePrompt,
        petName: pet.name || pet.race,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Image generation failed for pet ${pet.name || pet.race}:`, error);
      throw error;
    }
  }

  /**
   * 构建宠物图像生成prompt
   */
  buildPetImagePrompt(pet, options = {}) {
    const style = options.style || 'fantasy';
    const environment = options.environment || 'natural';
    
    // 基础宠物信息
    const race = pet.race || '神秘生物';
    const attribute = pet.attribute || '未知';
    const specialWord = pet.specialWord || '';
    const rarity = pet.rarity || 'common';
    
    // 根据稀有度调整画面质量描述
    const qualityMap = {
      'ssr': '传说级画质，史诗级视觉效果，神话般的光影，极致细节，4K超高清',
      'sr': '稀有级画质，精美视觉效果，华丽光影，丰富细节，高清画质',
      'r': '优质画质，良好视觉效果，自然光影，清晰细节',
      'n': '标准画质，基础视觉效果，柔和光影'
    };
    
    // 根据属性调整色彩和特效
    const attributeEffects = {
      '火': '火焰特效，暖色调，橙红光芒，燃烧粒子效果',
      '冰': '冰霜特效，冷色调，蓝白光芒，冰晶粒子效果',
      '雷': '雷电特效，紫蓝色调，电光闪烁，能量粒子效果',
      '风': '风流特效，青绿色调，气流可视化，羽毛飘散效果',
      '土': '大地特效，棕黄色调，岩石纹理，尘土飞扬效果',
      '水': '水流特效，蓝色调，水珠反射，波纹涟漪效果',
      '光': '圣光特效，金白色调，神圣光环，光粒子效果',
      '暗': '暗影特效，深紫黑色调，阴影缭绕，暗能量效果'
    };
    
    // 根据种族调整外形特征
    const raceFeatures = {
      '龙': '威严的龙族特征，鳞片闪烁，强壮体型，锐利爪牙',
      '狐': '优雅的狐族特征，毛发柔顺，灵动眼神，多条尾巴',
      '狼': '野性的狼族特征，肌肉发达，锐利眼神，厚实毛发',
      '鸟': '华美的鸟族特征，羽毛绚丽，展翅姿态，锐利鸟喙',
      '蜥': '神秘的蜥蜴特征，鳞片纹理，敏捷体型，变色能力',
      '精': '空灵的精灵特征，半透明身体，发光效果，轻盈姿态'
    };
    
    // 构建完整prompt
    let prompt = `${race}，${attribute}属性`;
    
    if (specialWord) {
      prompt += `，${specialWord}特质`;
    }
    
    // 添加种族特征
    const raceKey = Object.keys(raceFeatures).find(key => race.includes(key));
    if (raceKey) {
      prompt += `，${raceFeatures[raceKey]}`;
    }
    
    // 添加属性特效
    const effectKey = Object.keys(attributeEffects).find(key => attribute.includes(key));
    if (effectKey) {
      prompt += `，${attributeEffects[effectKey]}`;
    }
    
    // 添加环境和风格
    const environmentDesc = {
      'natural': '自然环境背景，森林或草原',
      'mystical': '神秘环境背景，魔法阵或古遗迹',
      'elemental': '元素环境背景，对应属性的自然场景',
      'battle': '战斗环境背景，竞技场或战场'
    };
    
    prompt += `，${environmentDesc[environment] || environmentDesc.natural}`;
    
    // 添加画质要求
    prompt += `，${qualityMap[rarity] || qualityMap.n}`;
    
    // 添加艺术风格
    const styleDesc = {
      'fantasy': '奇幻艺术风格，魔法世界观',
      'anime': '动漫艺术风格，日式美术',
      'realistic': '写实艺术风格，真实质感',
      'cartoon': '卡通艺术风格，可爱风格'
    };
    
    prompt += `，${styleDesc[style] || styleDesc.fantasy}`;
    
    // 添加通用质量提升词
    prompt += '，精美插画，概念艺术，数字绘画，专业级作品，色彩丰富，构图完美，光影效果，质感真实';
    
    return prompt;
  }

  /**
   * 批量生成宠物图像
   */
  async batchGeneratePetImages(pets, options = {}) {
    const results = [];
    const batchSize = 3; // 图像生成并发数限制
    
    for (let i = 0; i < pets.length; i += batchSize) {
      const batch = pets.slice(i, i + batchSize);
      const batchPromises = batch.map(pet => 
        this.generatePetImage(pet, options).catch(error => ({
          error: error.message,
          petName: pet.name || pet.race
        }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => 
        r.status === 'fulfilled' ? r.value : r.reason
      ));
      
      // 批次间延迟，避免API限制
      if (i + batchSize < pets.length) {
        await this.delay(2000); // 图像生成需要更长延迟
      }
    }
    
    return results;
  }

  /**
   * 生成宠物进化前后对比图
   */
  async generateEvolutionComparisonImage(beforePet, afterPet, options = {}) {
    // 构建进化对比的特殊prompt
    const comparisonPrompt = this.buildEvolutionComparisonPrompt(beforePet, afterPet, options);
    
    const service = this.services.image;
    
    try {
      const requestData = {
        model: service.modelName,
        prompt: comparisonPrompt,
        sequential_image_generation: "disabled",
        response_format: "url",
        size: options.size || "2K",
        stream: false,
        watermark: options.watermark !== false
      };

      const response = await axios.post(service.apiUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${service.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        proxy: false,
        httpsAgent: new (require('https').Agent)({ keepAlive: true })
      });

      if (!response.data || !response.data.data || !response.data.data[0]) {
        throw new Error('Invalid response format from image generation API');
      }

      return {
        imageUrl: response.data.data[0].url,
        prompt: comparisonPrompt,
        evolutionType: 'comparison',
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Evolution comparison image generation failed:', error);
      throw error;
    }
  }

  /**
   * 构建进化对比图prompt
   */
  buildEvolutionComparisonPrompt(beforePet, afterPet, options = {}) {
    const beforeDesc = `进化前：${beforePet.race}，${beforePet.attribute || ''}属性，${beforePet.specialWord || ''}`;
    const afterDesc = `进化后：${afterPet.race}，${afterPet.attribute || ''}属性，${afterPet.specialWord || ''}`;
    
    return `${beforeDesc} 到 ${afterDesc} 的进化过程，左右对比构图，进化光效，变化过程，奇幻艺术风格，高质量插画，专业级作品，进化能量特效，光芒四射，神圣进化，史诗级视觉效果`;
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
    const primary = this.services?.primary || {};
    const image = this.services?.image || {};
    return {
      text_service: {
        configured: !!(primary.apiUrl && primary.apiKey),
        model: primary.modelName,
        api_url: primary.apiUrl
      },
      image_service: {
        configured: !!(image.apiUrl && image.apiKey),
        model: image.modelName,
        api_url: image.apiUrl
      },
      cache: {
        size: this.cache.size,
        requestCount: this.requestCount,
        remainingRequests: this.maxRequestsPerHour - this.requestCount
      }
    };
  }
}

module.exports = AIService;