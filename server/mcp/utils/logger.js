/**
 * 日志工具
 */

import winston from 'winston'

export function createLogger(moduleName) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `[${timestamp}] [${moduleName}] ${level.toUpperCase()}: ${message}`
        if (stack) {
          log += `\n${stack}`
        }
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`
        }
        return log
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) =>
            `[${timestamp}] [${moduleName}] ${level}: ${message}`
          )
        )
      }),
      new winston.transports.File({
        filename: 'logs/mcp-error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'logs/mcp-combined.log'
      })
    ]
  })
}
