/**
 * 《灵境斗宠录》V3 全栈应用
 * 集成Vue3前端 + MCP服务器 + WebSocket多人对战
 */

require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

// 导入路由
const v3Routes = require('./routes/v3Routes')

// 导入WebSocket
const { setupBattleSocket } = require('./websocket/battleSocket')

// 日志
const logger = require('./utils/logger')

class SpiritPetAppV3 {
  constructor() {
    this.app = express()
    this.port = process.env.PORT || 3000
    this.httpServer = createServer(this.app)
    this.io = null
  }

  /**
   * 初始化应用
   */
  async initialize() {
    try {
      logger.info('🐾 灵境斗宠录 V3.0 启动中...')

      // 1. 配置中间件
      this.setupMiddleware()

      // 2. 配置路由
      this.setupRoutes()

      // 3. 配置WebSocket
      this.setupWebSocket()

      // 4. 启动服务器
      await this.startServer()

      logger.info('✅ 应用启动成功!')

    } catch (error) {
      logger.error('❌ 应用启动失败:', error)
      process.exit(1)
    }
  }

  /**
   * 配置中间件
   */
  setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }))

    // 安全头
    this.app.use(helmet({
      contentSecurityPolicy: false // 开发环境禁用CSP
    }))

    // 解析JSON
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`)
      next()
    })

    // 静态文件 (Vue3构建产物)
    this.app.use('/v3', express.static(path.join(__dirname, '../public/v3')))

    // 旧版静态文件
    this.app.use(express.static(path.join(__dirname, '../public')))
  }

  /**
   * 配置路由
   */
  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Spirit Pet Chronicles V3',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        mcp: process.env.MCP_PORT ? `http://localhost:${process.env.MCP_PORT}` : 'Not configured'
      })
    })

    // V3 API路由
    this.app.use('/api', v3Routes)

    // 默认路由 - 返回Vue3应用
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/index.html'))
    })

    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({
        error: '路由不存在',
        path: req.path
      })
    })

    // 错误处理
    this.app.use((err, req, res, next) => {
      logger.error('请求错误:', err)
      res.status(500).json({
        error: err.message || '服务器内部错误'
      })
    })
  }

  /**
   * 配置WebSocket
   */
  setupWebSocket() {
    this.io = setupBattleSocket(this.httpServer)
    logger.info('🔌 WebSocket服务已启动')
  }

  /**
   * 启动服务器
   */
  async startServer() {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logger.info('🎮 灵境斗宠录 V3.0')
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logger.info(`📡 主应用: http://localhost:${this.port}`)
        logger.info(`🎨 Vue3前端: http://localhost:${this.port}/v3`)
        logger.info(`⚔️  WebSocket: ws://localhost:${this.port}/socket.io`)
        logger.info(`📄 健康检查: http://localhost:${this.port}/health`)
        if (process.env.MCP_PORT) {
          logger.info(`🔌 MCP服务器: http://localhost:${process.env.MCP_PORT}`)
        }
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        resolve()
      })
    })
  }

  /**
   * 优雅关闭
   */
  async shutdown() {
    logger.info('正在关闭服务器...')

    // 关闭HTTP服务器
    this.httpServer.close(() => {
      logger.info('HTTP服务器已关闭')
    })

    // 关闭WebSocket
    if (this.io) {
      this.io.close()
      logger.info('WebSocket服务已关闭')
    }

    process.exit(0)
  }
}

// 创建并启动应用
const app = new SpiritPetAppV3()
app.initialize()

// 优雅退出
process.on('SIGTERM', () => app.shutdown())
process.on('SIGINT', () => app.shutdown())

module.exports = app
