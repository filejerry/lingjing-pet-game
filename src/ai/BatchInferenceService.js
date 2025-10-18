/**
 * 火山引擎批量推理服务 - DeepSeek模型
 * 支持高并发批量故事生成和剧情推理
 */

const axios = require('axios');
const logger = require('../utils/logger');

class BatchInferenceService {
  constructor() {
    // 火山引擎配置 - 使用新的批量推理模型
    this.config = {
      apiKey: process.env.ARK_API_KEY || "012aef55-5999-4c66-8122-f2cd8e740399",
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      model: "ep-20250930213449-zkcfw", // 新的批量推理模型
      timeout: 30000, // 30秒超时
      maxConcurrentTasks: 10, // 降低并发数
      defaultTaskNum: 10 // 减少默认任务数
    };
    
    this.requestQueue = [];
    this.isProcessing = false;
    this.workers = [];
    this.completedTasks = [];
    this.failedTasks = [];
  }

  /**
   * 批量生成故事剧情
   */
  async batchGenerateStories(storyPrompts, options = {}) {
    logger.info(`Starting batch story generation for ${storyPrompts.length} prompts`);
    
    const requests = storyPrompts.map(prompt => ({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: "你是《山海经灵境斗宠录》的故事创作大师，专门创作富有想象力的冒险故事和宠物传说。请用中文创作，风格要符合山海经的神话色彩。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options.temperature || 0.8,
      max_tokens: options.maxTokens || 1200,
      stream: false
    }));

    return await this.processBatchRequests(requests);
  }

  /**
   * 批量生成宠物性格分析
   */
  async batchGeneratePersonalities(petData, options = {}) {
    logger.info(`Starting batch personality generation for ${petData.length} pets`);
    
    const requests = petData.map(pet => ({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: "你是《山海经灵境斗宠录》的性格分析专家，专门分析灵宠的性格特征和行为模式。请用中文分析，要符合山海经的神话背景。"
        },
        {
          role: "user",
          content: `分析这只灵宠的性格特征：
名称：${pet.name}
种族：${pet.species || pet.race}
属性：${pet.attribute}
特质：${pet.special || pet.specialWord}
当前状态：HP=${pet.hp}, 攻击=${pet.attack}, 防御=${pet.defense}, 速度=${pet.speed}

请从以下6个维度分析：
1. 勇敢度 (0-100)
2. 智慧度 (0-100) 
3. 亲和度 (0-100)
4. 独立性 (0-100)
5. 神秘感 (0-100)
6. 成长潜力 (0-100)

并生成200字以内的性格描述。`
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 800,
      stream: false
    }));

    return await this.processBatchRequests(requests);
  }

  /**
   * 批量生成冒险事件
   */
  async batchGenerateAdventures(adventureContexts, options = {}) {
    logger.info(`Starting batch adventure generation for ${adventureContexts.length} contexts`);
    
    const requests = adventureContexts.map(context => ({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: "你是《山海经灵境斗宠录》的冒险事件设计师，专门创作神秘而有趣的冒险事件。要符合山海经的神话世界观，包含神兽、仙境、法宝等元素。"
        },
        {
          role: "user",
          content: `设计一个冒险事件：
背景：${context.background}
地点：${context.location}
参与者：${context.participants}
难度等级：${context.difficulty}

请生成：
1. 事件标题
2. 事件描述 (150-200字)
3. 三个选择选项
4. 每个选项的可能结果
5. 奖励内容

要求：富有想象力，符合山海经神话色彩。`
        }
      ],
      temperature: options.temperature || 0.9,
      max_tokens: options.maxTokens || 1500,
      stream: false
    }));

    return await this.processBatchRequests(requests);
  }

  /**
   * 批量生成进化描述
   */
  async batchGenerateEvolutions(evolutionData, options = {}) {
    logger.info(`Starting batch evolution generation for ${evolutionData.length} evolutions`);
    
    const requests = evolutionData.map(data => ({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: "你是《山海经灵境斗宠录》的进化设计师，专门设计灵宠的进化过程和新形态。要符合山海经的神话传说，体现生物的神奇变化。"
        },
        {
          role: "user",
          content: `设计灵宠进化：
原形态：${data.beforeForm}
进化条件：${data.conditions}
进化方向：${data.direction}
稀有度：${data.rarity}

请生成：
1. 进化过程描述 (100-150字)
2. 新形态名称
3. 外观变化描述
4. 新获得的能力
5. 属性提升建议

要求：符合山海经神话色彩，体现神奇的变化过程。`
        }
      ],
      temperature: options.temperature || 0.8,
      max_tokens: options.maxTokens || 1000,
      stream: false
    }));

    return await this.processBatchRequests(requests);
  }

  /**
   * 核心批量处理方法
   */
  async processBatchRequests(requests) {
    const startTime = Date.now();
    
    try {
      // 创建请求队列
      const requestQueue = [...requests];
      const results = [];
      const maxConcurrent = Math.min(this.config.maxConcurrentTasks, requests.length);
      
      // 创建工作器
      const workers = [];
      for (let i = 0; i < maxConcurrent; i++) {
        workers.push(this.createWorker(i, requestQueue, results));
      }
      
      // 等待所有工作器完成
      await Promise.all(workers);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.info(`Batch processing completed: ${results.length} tasks in ${duration}ms`);
      
      return {
        results: results,
        totalTasks: requests.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        duration: duration,
        averageTime: duration / requests.length
      };
      
    } catch (error) {
      logger.error('Batch processing failed:', error);
      throw error;
    }
  }

  /**
   * 创建工作器
   */
  async createWorker(workerId, requestQueue, results) {
    logger.info(`Worker ${workerId} starting`);
    
    while (requestQueue.length > 0) {
      const request = requestQueue.shift();
      if (!request) break;
      
      try {
        const response = await this.callDeepSeekAPI(request);
        results.push({
          success: true,
          data: response,
          workerId: workerId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error(`Worker ${workerId} failed:`, error);
        results.push({
          success: false,
          error: error.message,
          workerId: workerId,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    logger.info(`Worker ${workerId} completed`);
  }

  /**
   * 调用DeepSeek API
   */
  async callDeepSeekAPI(request) {
    try {
      const response = await axios.post(this.config.baseUrl, request, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000, // 单个请求30秒超时
        proxy: false,
        httpsAgent: new (require('https').Agent)({ keepAlive: true })
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response format from DeepSeek API');
      }

      const content = response.data.choices[0].message.content;
      
      return {
        content: content,
        model: request.model,
        usage: response.data.usage || {},
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('Network error: No response received');
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  /**
   * 预生成故事内容池
   */
  async preGenerateStoryPool(count = 100) {
    logger.info(`Pre-generating story pool with ${count} stories`);
    
    const storyPrompts = this.generateStoryPrompts(count);
    const results = await this.batchGenerateStories(storyPrompts, {
      temperature: 0.9,
      maxTokens: 800
    });
    
    // 存储到缓存或数据库
    const stories = results.results
      .filter(r => r.success)
      .map(r => ({
        id: this.generateId(),
        content: r.data.content,
        type: 'adventure',
        createdAt: new Date().toISOString(),
        used: false
      }));
    
    logger.info(`Generated ${stories.length} stories for pool`);
    return stories;
  }

  /**
   * 生成故事提示词
   */
  generateStoryPrompts(count) {
    const templates = [
      "在{location}，一只{creature}发现了{item}，这引发了一场意想不到的冒险...",
      "当{weather}降临{location}时，{creature}必须做出重要的选择...",
      "古老的传说提到，在{location}深处隐藏着{secret}...",
      "一位神秘的{character}出现在{location}，带来了关于{prophecy}的消息...",
      "在{festival}期间，{location}发生了奇怪的现象..."
    ];
    
    const variables = {
      location: ['昆仑山', '蓬莱仙岛', '九重天', '幽冥界', '东海龙宫', '西王母瑶池', '不周山', '建木神树'],
      creature: ['青龙', '白虎', '朱雀', '玄武', '麒麟', '凤凰', '饕餮', '梼杌', '穷奇', '混沌'],
      item: ['神器', '仙丹', '灵石', '古卷', '法宝', '圣水', '神果', '宝珠'],
      weather: ['神雷', '仙雾', '灵雨', '圣光', '暗云', '星辰雨'],
      secret: ['远古封印', '神兽巢穴', '仙人洞府', '时空裂缝', '生命之源'],
      character: ['仙人', '神使', '古灵', '龙王', '山神', '河伯'],
      prophecy: ['天命', '劫数', '转世', '觉醒', '归来'],
      festival: ['蟠桃会', '龙王祭', '星辰节', '丰收庆典', '祈福大典']
    };
    
    const prompts = [];
    for (let i = 0; i < count; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      let prompt = template;
      
      // 替换变量
      Object.keys(variables).forEach(key => {
        const values = variables[key];
        const value = values[Math.floor(Math.random() * values.length)];
        prompt = prompt.replace(`{${key}}`, value);
      });
      
      prompts.push(prompt);
    }
    
    return prompts;
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      service: 'BatchInferenceService',
      model: this.config.model,
      apiUrl: this.config.baseUrl,
      configured: !!(this.config.apiKey && this.config.baseUrl),
      maxConcurrent: this.config.maxConcurrentTasks,
      queueSize: this.requestQueue.length,
      isProcessing: this.isProcessing,
      completedTasks: this.completedTasks.length,
      failedTasks: this.failedTasks.length
    };
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 清理资源
   */
  async cleanup() {
    this.isProcessing = false;
    this.requestQueue = [];
    this.workers = [];
    logger.info('BatchInferenceService cleaned up');
  }
}

module.exports = BatchInferenceService;