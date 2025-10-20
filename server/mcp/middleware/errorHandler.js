/**
 * 错误处理中间件
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('ErrorHandler')

export function errorHandler(err, req, res, next) {
  logger.error('请求处理错误:', err)

  // MCP标准错误响应
  res.status(500).json({
    isError: true,
    content: [{
      type: 'text',
      text: `错误: ${err.message || '服务器内部错误'}`
    }]
  })
}
