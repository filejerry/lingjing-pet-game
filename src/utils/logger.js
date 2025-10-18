/**
 * 增强的日志系统
 * 支持日志分级、轮转、结构化日志
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 创建日志目录
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'lingjing-pet-game' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat
    }),

    // 错误日志(单独文件)
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 7,
      tailable: true
    }),

    // 警告日志
    new winston.transports.File({
      filename: path.join(logDir, 'warn.log'),
      level: 'warn',
      maxsize: 10485760,
      maxFiles: 5
    }),

    // 综合日志
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 7
    }),

    // 安全日志(单独追踪安全相关事件)
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'info',
      maxsize: 10485760,
      maxFiles: 30 // 保留更久
    })
  ]
});

// 生产环境禁用console输出
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_CONSOLE_LOG === 'true') {
  logger.remove(logger.transports.find(t => t instanceof winston.transports.Console));
}

// 扩展方法:安全日志
logger.security = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'security' });
};

// 扩展方法:性能日志
logger.performance = (message, duration, meta = {}) => {
  logger.info(message, { ...meta, duration, category: 'performance' });
};

// 扩展方法:审计日志
logger.audit = (action, userId, meta = {}) => {
  logger.info(`Audit: ${action}`, { ...meta, userId, category: 'audit' });
};

module.exports = logger;