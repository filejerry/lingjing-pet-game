/**
 * MCP Server - 灵境斗宠录
 * 提供AI驱动的游戏功能接口
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createLogger } from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import mcpRoutes from './routes/mcpRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.MCP_PORT || 3001
const logger = createLogger('MCP-Server')

// 中间件
app.use(cors())
app.use(express.json())

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MCP Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// MCP路由
app.use('/mcp', mcpRoutes)

// 错误处理
app.use(errorHandler)

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 MCP服务器启动成功`)
  logger.info(`📡 监听端口: ${PORT}`)
  logger.info(`🔗 健康检查: http://localhost:${PORT}/health`)
  logger.info(`🔌 MCP接口: http://localhost:${PORT}/mcp`)
})

// 优雅退出
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号,正在关闭服务器...')
  process.exit(0)
})
