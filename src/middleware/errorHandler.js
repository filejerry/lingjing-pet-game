/**
 * 统一错误处理中间件
 * 捕获并格式化所有错误响应
 */

const logger = require('../utils/logger');

/**
 * 错误类型定义
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // 标记为可预期的业务错误
    Error.captureStackTrace(this, this.constructor);
  }
}

// 预定义错误类
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('请求过于频繁', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

class DatabaseError extends AppError {
  constructor(message = '数据库操作失败', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

class AIServiceError extends AppError {
  constructor(message = 'AI服务异常', details = null) {
    super(message, 503, 'AI_SERVICE_ERROR', details);
  }
}

/**
 * 错误处理器类
 */
class ErrorHandler {
  /**
   * 判断是否为可信错误(可以向客户端暴露详情)
   */
  static isTrustedError(error) {
    return error instanceof AppError && error.isOperational;
  }

  /**
   * 格式化错误响应
   */
  static formatErrorResponse(error, includeStack = false) {
    const response = {
      success: false,
      error: error.errorCode || 'INTERNAL_ERROR',
      message: error.message || '服务器内部错误'
    };

    // 添加详细信息
    if (error.details) {
      response.details = error.details;
    }

    // 开发环境包含堆栈信息
    if (includeStack && error.stack) {
      response.stack = error.stack.split('\n').slice(0, 5); // 只返回前5行
    }

    return response;
  }

  /**
   * 记录错误日志
   */
  static logError(error, req = null) {
    const errorInfo = {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      stack: error.stack
    };

    // 添加请求信息
    if (req) {
      errorInfo.request = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.userId
      };
    }

    // 根据错误严重程度选择日志级别
    if (error.statusCode >= 500) {
      logger.error('服务器错误:', errorInfo);
    } else if (error.statusCode >= 400) {
      logger.warn('客户端错误:', errorInfo);
    } else {
      logger.info('错误:', errorInfo);
    }
  }

  /**
   * 处理特定类型的错误
   */
  static handleSpecificError(error) {
    // 数据库错误
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
      return new ConflictError('数据已存在或违反唯一约束');
    }

    if (error.code === 'SQLITE_ERROR' || error.code === '42P01') {
      return new DatabaseError('数据库查询错误', { code: error.code });
    }

    // JWT错误
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Token无效');
    }

    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token已过期');
    }

    // 验证错误
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, error.details);
    }

    // Axios网络错误
    if (error.isAxiosError) {
      if (error.response) {
        return new AIServiceError(`AI服务返回错误: ${error.response.status}`, {
          status: error.response.status,
          data: error.response.data
        });
      }
      return new AIServiceError('AI服务连接失败');
    }

    return null;
  }

  /**
   * Express错误处理中间件
   */
  static middleware() {
    return (err, req, res, next) => {
      // 如果响应已发送,交给Express默认处理
      if (res.headersSent) {
        return next(err);
      }

      try {
        // 处理特定类型错误
        let error = this.handleSpecificError(err) || err;

        // 如果不是AppError,包装为通用错误
        if (!(error instanceof AppError)) {
          error = new AppError(
            process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message,
            500,
            'INTERNAL_ERROR'
          );
        }

        // 记录错误
        this.logError(error, req);

        // 发送错误响应
        const includeStack = process.env.NODE_ENV !== 'production';
        const response = this.formatErrorResponse(error, includeStack);

        res.status(error.statusCode).json(response);
      } catch (handlerError) {
        // 错误处理器本身出错
        logger.error('错误处理器异常:', handlerError);
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        });
      }
    };
  }

  /**
   * 404处理中间件
   */
  static notFoundHandler() {
    return (req, res, next) => {
      const error = new NotFoundError(`路由 ${req.path}`);
      next(error);
    };
  }

  /**
   * 异步路由包装器(捕获Promise rejection)
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 未捕获异常处理
   */
  static setupGlobalHandlers() {
    // 未捕获的Promise rejection
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', {
        reason,
        promise
      });

      // 生产环境可选择退出进程
      if (process.env.EXIT_ON_UNHANDLED_REJECTION === 'true') {
        process.exit(1);
      }
    });

    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);

      // 严重错误,退出进程
      process.exit(1);
    });

    // 进程退出前清理
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      // 这里可以添加清理逻辑(关闭数据库连接等)
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      process.exit(0);
    });
  }
}

/**
 * 辅助函数:包装异步函数
 */
const catchAsync = ErrorHandler.asyncHandler;

/**
 * 辅助函数:快速抛出错误
 */
const throwError = (message, statusCode = 500, errorCode = 'ERROR') => {
  throw new AppError(message, statusCode, errorCode);
};

module.exports = {
  // 错误类
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  AIServiceError,

  // 错误处理器
  ErrorHandler,

  // 中间件
  errorHandler: ErrorHandler.middleware(),
  notFoundHandler: ErrorHandler.notFoundHandler(),

  // 工具函数
  catchAsync,
  throwError,
  isTrustedError: ErrorHandler.isTrustedError,
  setupGlobalHandlers: ErrorHandler.setupGlobalHandlers
};
