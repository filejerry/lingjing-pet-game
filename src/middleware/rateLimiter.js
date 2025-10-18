/**
 * API 限流中间件
 * 防止API滥用和DDoS攻击,保护AI接口不被刷爆
 */

const logger = require('../utils/logger');

class RateLimiter {
  constructor() {
    // 存储请求记录 {ip: {endpoint: {count, resetTime}}}
    this.requests = new Map();

    // 默认配置
    this.config = {
      // 全局限流
      global: {
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
      },

      // AI接口特殊限流(更严格)
      ai: {
        windowMs: 60 * 60 * 1000, // 1小时
        maxRequests: parseInt(process.env.AI_MAX_REQUESTS_PER_HOUR) || 50
      },

      // 登录接口限流(防暴力破解)
      auth: {
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: 5
      },

      // 宠物创建限流
      petCreate: {
        windowMs: 60 * 1000, // 1分钟
        maxRequests: 3
      }
    };

    // 定期清理过期记录
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // 每5分钟清理一次
  }

  /**
   * 获取客户端标识(IP地址)
   */
  getClientId(req) {
    // 优先获取真实IP(考虑代理)
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * 判断端点类型
   */
  getEndpointType(path) {
    if (path.includes('/ai/') || path.includes('/generate') || path.includes('/evolution')) {
      return 'ai';
    }
    if (path.includes('/login') || path.includes('/register') || path.includes('/auth')) {
      return 'auth';
    }
    if (path.includes('/pets/create') || path.includes('/pets/summon')) {
      return 'petCreate';
    }
    return 'global';
  }

  /**
   * 检查是否超过限流
   */
  isRateLimited(clientId, endpoint, type = 'global') {
    const config = this.config[type];
    const now = Date.now();

    // 获取或初始化客户端记录
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, new Map());
    }

    const clientRequests = this.requests.get(clientId);

    // 获取或初始化端点记录
    if (!clientRequests.has(endpoint)) {
      clientRequests.set(endpoint, {
        count: 0,
        resetTime: now + config.windowMs
      });
    }

    const endpointData = clientRequests.get(endpoint);

    // 检查是否需要重置计数器
    if (now > endpointData.resetTime) {
      endpointData.count = 0;
      endpointData.resetTime = now + config.windowMs;
    }

    // 检查是否超过限制
    if (endpointData.count >= config.maxRequests) {
      const resetIn = Math.ceil((endpointData.resetTime - now) / 1000);
      return {
        limited: true,
        resetIn,
        limit: config.maxRequests,
        remaining: 0
      };
    }

    // 增加计数
    endpointData.count++;

    return {
      limited: false,
      resetIn: Math.ceil((endpointData.resetTime - now) / 1000),
      limit: config.maxRequests,
      remaining: config.maxRequests - endpointData.count
    };
  }

  /**
   * 清理过期记录
   */
  cleanup() {
    const now = Date.now();
    let cleanedClients = 0;
    let cleanedEndpoints = 0;

    for (const [clientId, endpoints] of this.requests.entries()) {
      for (const [endpoint, data] of endpoints.entries()) {
        // 清理过期的端点记录
        if (now > data.resetTime + 60000) { // 超过重置时间1分钟
          endpoints.delete(endpoint);
          cleanedEndpoints++;
        }
      }

      // 清理没有端点记录的客户端
      if (endpoints.size === 0) {
        this.requests.delete(clientId);
        cleanedClients++;
      }
    }

    if (cleanedClients > 0 || cleanedEndpoints > 0) {
      logger.debug(`Rate limiter cleanup: ${cleanedClients} clients, ${cleanedEndpoints} endpoints`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    let totalClients = this.requests.size;
    let totalEndpoints = 0;

    for (const endpoints of this.requests.values()) {
      totalEndpoints += endpoints.size;
    }

    return {
      clients: totalClients,
      endpoints: totalEndpoints,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  /**
   * Express中间件
   */
  middleware(options = {}) {
    return (req, res, next) => {
      // 跳过限流的路径(健康检查等)
      const skipPaths = options.skipPaths || ['/health', '/ping', '/favicon.ico'];
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      const clientId = this.getClientId(req);
      const endpoint = req.path;
      const type = options.type || this.getEndpointType(req.path);

      // 检查限流
      const result = this.isRateLimited(clientId, endpoint, type);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetIn);

      if (result.limited) {
        logger.warn('Rate limit exceeded', {
          clientId,
          endpoint,
          type,
          resetIn: result.resetIn
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message: `请求过于频繁,请在 ${result.resetIn} 秒后重试`,
          retryAfter: result.resetIn,
          limit: result.limit
        });
      }

      // 记录高频请求(接近限制的80%)
      if (result.remaining < result.limit * 0.2) {
        logger.warn('High request rate detected', {
          clientId,
          endpoint,
          remaining: result.remaining,
          limit: result.limit
        });
      }

      next();
    };
  }

  /**
   * 特定类型的中间件工厂函数
   */
  static createLimiter(type, customConfig = {}) {
    const limiter = new RateLimiter();

    // 允许自定义配置
    if (customConfig.windowMs || customConfig.maxRequests) {
      limiter.config[type] = {
        windowMs: customConfig.windowMs || limiter.config[type].windowMs,
        maxRequests: customConfig.maxRequests || limiter.config[type].maxRequests
      };
    }

    return limiter.middleware({ type });
  }
}

// 导出单例和工厂函数
const globalLimiter = new RateLimiter();

module.exports = {
  RateLimiter,
  globalLimiter,

  // 快捷中间件
  globalLimit: globalLimiter.middleware(),
  aiLimit: globalLimiter.middleware({ type: 'ai' }),
  authLimit: globalLimiter.middleware({ type: 'auth' }),
  petCreateLimit: globalLimiter.middleware({ type: 'petCreate' }),

  // 自定义限流器
  createCustomLimit: (windowMs, maxRequests) => {
    const limiter = new RateLimiter();
    limiter.config.global = { windowMs, maxRequests };
    return limiter.middleware();
  },

  // 获取统计信息的路由处理器
  statsHandler: (req, res) => {
    const stats = globalLimiter.getStats();
    res.json({
      success: true,
      data: stats
    });
  }
};
