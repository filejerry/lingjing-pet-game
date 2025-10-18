/**
 * JWT认证中间件
 * 支持Token刷新、黑名单、多设备登录管理
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Token黑名单(生产环境应使用Redis)
const tokenBlacklist = new Set();

// 刷新Token存储(用户ID -> refreshToken映射)
const refreshTokens = new Map();

class AuthManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshTokenExpiresIn = '30d';

    // 警告:生产环境必须设置强密钥
    if (this.jwtSecret === 'your-secret-key-change-this') {
      logger.warn('⚠️  警告: 使用默认JWT密钥,生产环境请修改!');
    }

    // 定期清理过期Token
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000); // 每小时
  }

  /**
   * 生成访问Token
   */
  generateAccessToken(userId, username, additionalData = {}) {
    const payload = {
      userId,
      username,
      type: 'access',
      ...additionalData
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'lingjing-pet-game',
      audience: 'user'
    });
  }

  /**
   * 生成刷新Token
   */
  generateRefreshToken(userId, username) {
    const payload = {
      userId,
      username,
      type: 'refresh'
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiresIn,
      issuer: 'lingjing-pet-game',
      audience: 'user'
    });

    // 存储刷新Token(一个用户只保留最新的)
    refreshTokens.set(userId, token);

    return token;
  }

  /**
   * 生成Token对(访问Token + 刷新Token)
   */
  generateTokenPair(userId, username, additionalData = {}) {
    return {
      accessToken: this.generateAccessToken(userId, username, additionalData),
      refreshToken: this.generateRefreshToken(userId, username),
      expiresIn: this.parseExpiresIn(this.jwtExpiresIn)
    };
  }

  /**
   * 验证Token
   */
  verifyToken(token) {
    try {
      // 检查黑名单
      if (tokenBlacklist.has(token)) {
        return {
          valid: false,
          error: 'Token已失效'
        };
      }

      // 验证签名和过期时间
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'lingjing-pet-game',
        audience: 'user'
      });

      return {
        valid: true,
        payload: decoded
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Token已过期',
          expired: true
        };
      }

      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Token无效'
        };
      }

      logger.error('Token验证失败:', error);
      return {
        valid: false,
        error: '验证失败'
      };
    }
  }

  /**
   * 刷新访问Token
   */
  refreshAccessToken(refreshToken) {
    try {
      // 验证刷新Token
      const decoded = jwt.verify(refreshToken, this.jwtSecret);

      if (decoded.type !== 'refresh') {
        return {
          success: false,
          error: '无效的刷新Token'
        };
      }

      // 检查刷新Token是否还在存储中
      const storedToken = refreshTokens.get(decoded.userId);
      if (storedToken !== refreshToken) {
        return {
          success: false,
          error: '刷新Token已失效'
        };
      }

      // 生成新的访问Token
      const newAccessToken = this.generateAccessToken(decoded.userId, decoded.username);

      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: this.parseExpiresIn(this.jwtExpiresIn)
      };
    } catch (error) {
      logger.error('刷新Token失败:', error);
      return {
        success: false,
        error: 'Token刷新失败'
      };
    }
  }

  /**
   * 撤销Token(加入黑名单)
   */
  revokeToken(token) {
    tokenBlacklist.add(token);
    logger.info('Token已撤销');
  }

  /**
   * 撤销用户所有Token(登出所有设备)
   */
  revokeUserTokens(userId) {
    refreshTokens.delete(userId);
    logger.info(`用户 ${userId} 的所有Token已撤销`);
  }

  /**
   * 清理过期Token
   */
  cleanupExpiredTokens() {
    let cleaned = 0;

    // 清理黑名单中的过期Token
    for (const token of tokenBlacklist) {
      try {
        jwt.verify(token, this.jwtSecret);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          tokenBlacklist.delete(token);
          cleaned++;
        }
      }
    }

    // 清理过期的刷新Token
    for (const [userId, token] of refreshTokens.entries()) {
      try {
        jwt.verify(token, this.jwtSecret);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          refreshTokens.delete(userId);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      logger.debug(`清理了 ${cleaned} 个过期Token`);
    }
  }

  /**
   * 解析过期时间字符串为秒数
   */
  parseExpiresIn(expiresIn) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // 默认7天

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      blacklistedTokens: tokenBlacklist.size,
      activeRefreshTokens: refreshTokens.size
    };
  }

  /**
   * Express认证中间件
   */
  authenticate(options = {}) {
    return async (req, res, next) => {
      try {
        // 从请求头获取Token
        const authHeader = req.headers.authorization;

        if (!authHeader) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: '缺少认证Token'
          });
        }

        // 解析Bearer Token
        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Token格式错误'
          });
        }

        // 验证Token
        const result = this.verifyToken(token);

        if (!result.valid) {
          // Token过期,提示刷新
          if (result.expired) {
            return res.status(401).json({
              success: false,
              error: 'TokenExpired',
              message: 'Token已过期,请使用刷新Token获取新Token',
              shouldRefresh: true
            });
          }

          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: result.error
          });
        }

        // 检查Token类型
        if (result.payload.type !== 'access') {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: '请使用访问Token'
          });
        }

        // 附加用户信息到请求对象
        req.user = {
          userId: result.payload.userId,
          username: result.payload.username,
          ...result.payload
        };

        req.token = token;

        next();
      } catch (error) {
        logger.error('认证中间件错误:', error);
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: '认证过程出错'
        });
      }
    };
  }

  /**
   * 可选认证中间件(Token无效也不拦截,但会附加用户信息)
   */
  optionalAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;

        if (authHeader) {
          const [bearer, token] = authHeader.split(' ');

          if (bearer === 'Bearer' && token) {
            const result = this.verifyToken(token);

            if (result.valid) {
              req.user = {
                userId: result.payload.userId,
                username: result.payload.username,
                ...result.payload
              };
              req.token = token;
            }
          }
        }

        next();
      } catch (error) {
        logger.error('可选认证错误:', error);
        next();
      }
    };
  }

  /**
   * 权限检查中间件工厂
   */
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: '需要登录'
        });
      }

      const userRole = req.user.role || 'user';

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '权限不足'
        });
      }

      next();
    };
  }
}

// 创建单例
const authManager = new AuthManager();

// 路由处理器
const authHandlers = {
  /**
   * 刷新Token路由处理器
   */
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: '缺少刷新Token'
        });
      }

      const result = authManager.refreshAccessToken(refreshToken);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: result.error
        });
      }

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });
    } catch (error) {
      logger.error('刷新Token失败:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: '刷新失败'
      });
    }
  },

  /**
   * 登出路由处理器
   */
  logout: async (req, res) => {
    try {
      const token = req.token;
      const userId = req.user?.userId;

      if (token) {
        authManager.revokeToken(token);
      }

      if (userId) {
        authManager.revokeUserTokens(userId);
      }

      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      logger.error('登出失败:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: '登出失败'
      });
    }
  },

  /**
   * 统计信息路由处理器
   */
  stats: async (req, res) => {
    const stats = authManager.getStats();
    res.json({
      success: true,
      data: stats
    });
  }
};

module.exports = {
  AuthManager,
  authManager,

  // 中间件
  authenticate: authManager.authenticate.bind(authManager),
  optionalAuth: authManager.optionalAuth.bind(authManager),
  requireRole: authManager.requireRole.bind(authManager),

  // 工具函数
  generateTokenPair: authManager.generateTokenPair.bind(authManager),
  verifyToken: authManager.verifyToken.bind(authManager),
  revokeToken: authManager.revokeToken.bind(authManager),
  revokeUserTokens: authManager.revokeUserTokens.bind(authManager),

  // 路由处理器
  authHandlers
};
