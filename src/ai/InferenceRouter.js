/**
 * 推理路由器 - 智能选择即时推理或批量推理
 * 根据任务类型、紧急程度、资源消耗自动路由到最合适的AI服务
 */

const logger = require('../utils/logger');

class InferenceRouter {
  constructor(enhancedAIService) {
    this.aiService = enhancedAIService;
    this.routingRules = this.initializeRoutingRules();
    this.performanceMetrics = {
      realtime: { requests: 0, avgResponseTime: 0, errors: 0 },
      batch: { requests: 0, avgResponseTime: 0, errors: 0 },
      image: { requests: 0, avgResponseTime: 0, errors: 0 }
    };
  }

  /**
   * 初始化路由规则
   */
  initializeRoutingRules() {
    return {
      // 即时推理场景 - 需要立即响应的交互
      realtime: {
        // 玩家直接交互
        playerInteraction: {
          priority: 'HIGH',
          maxLatency: 3000, // 3秒内必须响应
          model: 'kimi',
          scenarios: [
            'player_chat',           // 玩家对话
            'pet_interaction',       // 宠物互动
            'quick_question',        // 快速问答
            'battle_reaction',       // 战斗反应
            'immediate_feedback',    // 即时反馈
            'tutorial_guidance',     // 新手指导
            'emergency_help'         // 紧急帮助
          ]
        },
        
        // 游戏状态响应
        gameStateResponse: {
          priority: 'HIGH',
          maxLatency: 2000,
          model: 'kimi',
          scenarios: [
            'pet_status_check',      // 宠物状态查询
            'inventory_query',       // 背包查询
            'achievement_unlock',    // 成就解锁
            'level_up_celebration',  // 升级庆祝
            'error_explanation',     // 错误说明
            'system_notification'    // 系统通知
          ]
        },

        // 图像即时生成
        imageGeneration: {
          priority: 'MEDIUM',
          maxLatency: 30000, // 30秒内生成
          model: 'jimeng',
          scenarios: [
            'pet_avatar_request',    // 玩家主动请求宠物头像
            'evolution_preview',     // 进化预览
            'customization_preview', // 自定义预览
            'battle_scene_capture',  // 战斗场景截图
            'achievement_badge',     // 成就徽章
            'special_moment_capture' // 特殊时刻记录
          ]
        }
      },

      // 批量推理场景 - 可以预生成或延迟处理
      batch: {
        // 内容预生成
        contentPregeneration: {
          priority: 'LOW',
          maxLatency: 300000, // 5分钟内完成
          model: 'deepseek',
          scenarios: [
            'story_pool_refill',     // 故事池补充
            'personality_templates', // 性格模板生成
            'adventure_scenarios',   // 冒险场景预生成
            'evolution_descriptions',// 进化描述预生成
            'dialogue_variations',   // 对话变体生成
            'world_lore_expansion'   // 世界观扩展
          ]
        },

        // 数据分析处理
        dataAnalysis: {
          priority: 'LOW',
          maxLatency: 600000, // 10分钟内完成
          model: 'deepseek',
          scenarios: [
            'player_behavior_analysis', // 玩家行为分析
            'pet_growth_patterns',       // 宠物成长模式
            'game_balance_optimization', // 游戏平衡优化
            'content_popularity_analysis', // 内容受欢迎度分析
            'seasonal_event_planning',   // 季节活动规划
            'meta_game_insights'         // 元游戏洞察
          ]
        },

        // 批量图像生成
        batchImageGeneration: {
          priority: 'LOW',
          maxLatency: 1800000, // 30分钟内完成
          model: 'jimeng',
          scenarios: [
            'pet_species_gallery',    // 宠物种族图鉴
            'evolution_chain_images', // 进化链图像
            'environment_backgrounds',// 环境背景图
            'item_icon_generation',   // 物品图标生成
            'ui_element_creation',    // UI元素创建
            'promotional_materials'   // 宣传素材
          ]
        }
      }
    };
  }

  /**
   * 智能路由 - 根据场景自动选择推理方式
   */
  async route(scenario, data, options = {}) {
    const startTime = Date.now();
    
    try {
      // 1. 确定路由类型
      const routeInfo = this.determineRoute(scenario, options);
      
      // 2. 检查资源可用性
      const resourceCheck = await this.checkResourceAvailability(routeInfo);
      
      // 3. 执行推理
      const result = await this.executeInference(routeInfo, data, options);
      
      // 4. 记录性能指标
      const responseTime = Date.now() - startTime;
      this.updateMetrics(routeInfo.type, responseTime, true);
      
      logger.info(`Inference routed successfully: ${scenario} -> ${routeInfo.type} (${responseTime}ms)`);
      
      return {
        ...result,
        routeInfo: {
          scenario,
          type: routeInfo.type,
          model: routeInfo.model,
          responseTime,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const routeType = this.determineRoute(scenario, options).type;
      this.updateMetrics(routeType, responseTime, false);
      
      logger.error(`Inference routing failed: ${scenario}`, error);
      throw error;
    }
  }

  /**
   * 确定路由类型和模型
   */
  determineRoute(scenario, options = {}) {
    // 强制指定路由类型
    if (options.forceRealtime) {
      return { type: 'realtime', model: 'kimi', priority: 'HIGH' };
    }
    if (options.forceBatch) {
      return { type: 'batch', model: 'deepseek', priority: 'LOW' };
    }
    if (options.forceImage) {
      return { type: 'image', model: 'jimeng', priority: 'MEDIUM' };
    }

    // 根据场景自动判断
    for (const [routeType, categories] of Object.entries(this.routingRules)) {
      for (const [category, config] of Object.entries(categories)) {
        if (config.scenarios.includes(scenario)) {
          return {
            type: routeType,
            model: config.model,
            priority: config.priority,
            maxLatency: config.maxLatency,
            category
          };
        }
      }
    }

    // 默认路由 - 根据关键词判断
    if (this.isImageRelated(scenario)) {
      return { type: 'image', model: 'jimeng', priority: 'MEDIUM' };
    }
    
    if (this.isUrgent(scenario, options)) {
      return { type: 'realtime', model: 'kimi', priority: 'HIGH' };
    }
    
    return { type: 'batch', model: 'deepseek', priority: 'LOW' };
  }

  /**
   * 检查资源可用性
   */
  async checkResourceAvailability(routeInfo) {
    const status = this.aiService.getEnhancedStatus();
    
    switch (routeInfo.type) {
      case 'realtime':
        if (status.text_service?.requestCount >= status.text_service?.maxRequestsPerHour * 0.9) {
          logger.warn('Realtime service near rate limit, considering fallback');
          return { available: false, reason: 'rate_limit_approaching' };
        }
        break;
        
      case 'batch':
        if (status.batch_service?.activeWorkers >= status.batch_service?.maxWorkers * 0.8) {
          logger.warn('Batch service heavily loaded, may experience delays');
          return { available: true, reason: 'high_load' };
        }
        break;
        
      case 'image':
        if (status.image_service?.requestCount >= status.image_service?.maxRequestsPerHour * 0.9) {
          logger.warn('Image service near rate limit');
          return { available: false, reason: 'rate_limit_approaching' };
        }
        break;
    }
    
    return { available: true };
  }

  /**
   * 执行推理
   */
  async executeInference(routeInfo, data, options) {
    switch (routeInfo.type) {
      case 'realtime':
        return await this.executeRealtimeInference(data, options);
        
      case 'batch':
        return await this.executeBatchInference(data, options);
        
      case 'image':
        return await this.executeImageInference(data, options);
        
      default:
        throw new Error(`Unknown route type: ${routeInfo.type}`);
    }
  }

  /**
   * 执行即时推理
   */
  async executeRealtimeInference(data, options) {
    const { prompt, context, petData } = data;
    
    // 使用Kimi模型进行即时响应
    return await this.aiService.generateContent(prompt, {
      model: 'kimi',
      maxTokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      context: context,
      petData: petData,
      priority: 'high'
    });
  }

  /**
   * 执行批量推理
   */
  async executeBatchInference(data, options) {
    const { prompts, type, batchSize } = data;
    
    // 使用DeepSeek模型进行批量处理
    switch (type) {
      case 'stories':
        return await this.aiService.batchService.batchGenerateStories(prompts, options);
      case 'personalities':
        return await this.aiService.batchService.batchGeneratePersonalities(prompts, options);
      case 'adventures':
        return await this.aiService.batchService.batchGenerateAdventures(prompts, options);
      case 'evolutions':
        return await this.aiService.batchService.batchGenerateEvolutions(prompts, options);
      default:
        return await this.aiService.batchService.batchGenerate(prompts, options);
    }
  }

  /**
   * 执行图像推理
   */
  async executeImageInference(data, options) {
    const { type, petData, sceneDescription } = data;
    
    // 使用即梦4.0模型进行图像生成
    switch (type) {
      case 'pet_image':
        return await this.aiService.imageService.generatePetImage(petData, options);
      case 'evolution_image':
        return await this.aiService.imageService.generateEvolutionImage(
          petData.before, petData.after, options
        );
      case 'scene_image':
        return await this.aiService.imageService.generateSceneImage(sceneDescription, options);
      case 'batch_pets':
        return await this.aiService.imageService.batchGeneratePetImages(petData, options);
      default:
        throw new Error(`Unknown image generation type: ${type}`);
    }
  }

  /**
   * 判断是否为图像相关场景
   */
  isImageRelated(scenario) {
    const imageKeywords = [
      'image', 'picture', 'avatar', 'visual', 'appearance', 
      'evolution_preview', 'scene', 'background', 'icon'
    ];
    return imageKeywords.some(keyword => scenario.includes(keyword));
  }

  /**
   * 判断是否为紧急场景
   */
  isUrgent(scenario, options) {
    const urgentKeywords = [
      'chat', 'interaction', 'immediate', 'urgent', 'real_time',
      'player', 'battle', 'tutorial', 'help', 'error'
    ];
    
    return options.urgent || 
           options.realtime || 
           urgentKeywords.some(keyword => scenario.includes(keyword));
  }

  /**
   * 更新性能指标
   */
  updateMetrics(type, responseTime, success) {
    const metrics = this.performanceMetrics[type];
    if (!metrics) return;

    metrics.requests++;
    if (success) {
      metrics.avgResponseTime = (metrics.avgResponseTime + responseTime) / 2;
    } else {
      metrics.errors++;
    }
  }

  /**
   * 获取路由统计信息
   */
  getRoutingStats() {
    return {
      routingRules: Object.keys(this.routingRules),
      performanceMetrics: this.performanceMetrics,
      totalRequests: Object.values(this.performanceMetrics)
        .reduce((sum, metrics) => sum + metrics.requests, 0),
      totalErrors: Object.values(this.performanceMetrics)
        .reduce((sum, metrics) => sum + metrics.errors, 0),
      averageResponseTimes: Object.fromEntries(
        Object.entries(this.performanceMetrics)
          .map(([type, metrics]) => [type, metrics.avgResponseTime])
      )
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    Object.values(this.performanceMetrics).forEach(metrics => {
      metrics.requests = 0;
      metrics.avgResponseTime = 0;
      metrics.errors = 0;
    });
    logger.info('Routing statistics reset');
  }

  /**
   * 获取推荐路由
   */
  getRecommendedRoute(scenario, data, options = {}) {
    const routeInfo = this.determineRoute(scenario, options);
    const estimatedTime = this.estimateResponseTime(routeInfo);
    const cost = this.estimateCost(routeInfo, data);
    
    return {
      route: routeInfo,
      estimatedTime,
      estimatedCost: cost,
      recommendation: this.generateRecommendation(routeInfo, estimatedTime, cost)
    };
  }

  /**
   * 估算响应时间
   */
  estimateResponseTime(routeInfo) {
    const baseTime = {
      realtime: 2000,  // 2秒
      batch: 30000,    // 30秒
      image: 25000     // 25秒
    };
    
    const currentMetrics = this.performanceMetrics[routeInfo.type];
    if (currentMetrics && currentMetrics.avgResponseTime > 0) {
      return Math.max(baseTime[routeInfo.type], currentMetrics.avgResponseTime);
    }
    
    return baseTime[routeInfo.type];
  }

  /**
   * 估算成本
   */
  estimateCost(routeInfo, data) {
    const baseCost = {
      realtime: 0.01,  // 每次0.01元
      batch: 0.005,    // 每次0.005元
      image: 0.1       // 每次0.1元
    };
    
    let multiplier = 1;
    if (data.prompts && Array.isArray(data.prompts)) {
      multiplier = data.prompts.length;
    }
    
    return baseCost[routeInfo.type] * multiplier;
  }

  /**
   * 生成推荐建议
   */
  generateRecommendation(routeInfo, estimatedTime, cost) {
    const recommendations = [];
    
    if (routeInfo.type === 'realtime' && estimatedTime > 5000) {
      recommendations.push('考虑使用批量推理以降低延迟');
    }
    
    if (routeInfo.type === 'batch' && cost > 1) {
      recommendations.push('成本较高，建议优化提示词或减少批量大小');
    }
    
    if (routeInfo.type === 'image' && estimatedTime > 60000) {
      recommendations.push('图像生成时间较长，建议使用预生成策略');
    }
    
    return recommendations.length > 0 ? recommendations : ['当前路由配置最优'];
  }
}

module.exports = InferenceRouter;