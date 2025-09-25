/**
 * 《灵境斗宠录》主应用程序
 * AI驱动的文字宠物养成游戏
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const path = require('path');

// 导入核心模块
const Database = require('./models/Database');
const AIService = require('./ai/AIService');
const AIEngine = require('./ai/AIEngine');
const PetManager = require('./game/PetManager');
const EnhancedPetManager = require('./game/EnhancedPetManager');
const BattleSystem = require('./game/BattleSystem');
const AdventureSystem = require('./game/AdventureSystem');
const PetRoutes = require('./routes/petRoutes');

const logger = require('./utils/logger');

class SpiritPetApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    // 核心系统实例
    this.database = null;
    this.aiService = null;
    this.aiEngine = null;
    this.petManager = null;
    this.battleSystem = null;
    this.adventureSystem = null;
  }

  /**
   * 初始化应用程序
   */
  async initialize() {
    try {
      logger.info('Initializing Spirit Pet Chronicles...');

      // 1. 初始化数据库
      this.database = new Database();
      await this.database.initialize();
      logger.info('Database initialized successfully');

      // 2. 初始化AI服务
      this.aiService = new AIService();
      logger.info('AI Service initialized');

      // 3. 初始化AI引擎
      this.aiEngine = new AIEngine(this.aiService);
      logger.info('AI Engine initialized');

      // 4. 初始化游戏系统
      this.petManager = new PetManager(this.database, this.aiEngine);
      this.enhancedPetManager = new EnhancedPetManager(this.database, this.aiEngine);
      this.battleSystem = new BattleSystem(this.database);
      this.adventureSystem = new AdventureSystem(this.database, this.aiService);
      logger.info('Game systems initialized');

      // 5. 设置Express中间件
      this.setupMiddleware();

      // 6. 设置路由
      this.setupRoutes();

      // 7. 设置定时任务
      this.setupCronJobs();

      // 8. 设置错误处理
      this.setupErrorHandling();

      logger.info('Application initialization completed');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  /**
   * 设置Express中间件
   */
  setupMiddleware() {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS配置
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // 请求解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // 静态文件服务（如果需要）
    this.app.use('/static', express.static('public'));
  }

  /**
   * 设置API路由
   */
  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: !!this.database,
          aiService: this.aiService.getStatus(),
          petManager: !!this.petManager,
          battleSystem: !!this.battleSystem,
          adventureSystem: !!this.adventureSystem
        }
      });
    });

    // API信息
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: '灵境斗宠录 API',
        version: '1.0.0',
        description: 'AI驱动的文字宠物养成游戏',
        endpoints: {
          pets: '/api/pets',
          health: '/health',
          stats: '/api/stats'
        },
        features: [
          '三层AI驱动进化系统',
          '托管奇遇探索',
          '宠物间异步相遇',
          '完整战斗系统',
          '纯文字驱动体验'
        ]
      });
    });

    // 游戏统计
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.database.getStats();
        const aiStatus = this.aiService.getStatus();
        
        res.json({
          success: true,
          data: {
            database: stats,
            ai: aiStatus,
            uptime: process.uptime(),
            memory: process.memoryUsage()
          }
        });
      } catch (error) {
        logger.error('Get stats error:', error);
        res.status(500).json({ error: '获取统计信息失败' });
      }
    });

    // 宠物相关路由
    const petRoutes = new PetRoutes(this.petManager, this.battleSystem, this.adventureSystem);
    this.app.use('/api/pets', petRoutes.getRouter());

    // 增强版宠物路由（支持稀有度系统）
    const enhancedPetRoutes = require('./routes/enhancedPetRoutes');
    
    // 添加增强版中间件
    this.app.use('/api/pets', (req, res, next) => {
      req.enhancedPetManager = this.enhancedPetManager;
      req.petManager = this.petManager;
      req.aiEngine = this.aiEngine;
      req.db = this.database.db;
      next();
    });
    
    this.app.use('/api/pets', enhancedPetRoutes);

    // 根路径 - 重定向到增强版界面
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/enhanced-index.html'));
    });

    // 原版界面
    this.app.get('/classic', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // API根路径
    this.app.get('/api', (req, res) => {
      res.json({
        message: '欢迎来到《灵境斗宠录》神话觉醒版！',
        description: '探索山海经的神秘世界，培养传说级灵宠',
        version: '2.0.0 - 神话觉醒版',
        features: [
          '🌟 SSS级稀有度系统',
          '🐉 山海经神话生物',
          '✨ 神话觉醒机制',
          '🔮 隐藏式特性系统',
          '🏔️ 神话秘境探索'
        ],
        endpoints: {
          pets: '/api/pets',
          characteristics: '/api/pets/:id/characteristics',
          mythology: '/api/pets/:id/mythology-recommendations',
          health: '/health'
        }
      });
    });
  }

  /**
   * 设置定时任务
   */
  setupCronJobs() {
    // 每小时重置AI请求计数
    cron.schedule('0 * * * *', () => {
      this.aiService.resetRequestCount();
      logger.info('AI request count reset');
    });

    // 每30分钟处理宠物相遇
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.adventureSystem.processEncounters();
        logger.info('Pet encounters processed');
      } catch (error) {
        logger.error('Failed to process encounters:', error);
      }
    });

    // 每6小时清理AI缓存
    cron.schedule('0 */6 * * *', () => {
      this.aiService.clearCache();
      logger.info('AI cache cleared');
    });

    // 每天凌晨2点进行数据库维护
    cron.schedule('0 2 * * *', async () => {
      try {
        // 这里可以添加数据库清理逻辑
        logger.info('Daily maintenance completed');
      } catch (error) {
        logger.error('Daily maintenance failed:', error);
      }
    });

    logger.info('Cron jobs scheduled');
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'API端点不存在',
        path: req.path,
        method: req.method
      });
    });

    // 全局错误处理
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      
      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 
          '服务器内部错误' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });

    // 进程异常处理
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.gracefulShutdown();
    });
  }

  /**
   * 启动服务器
   */
  async start() {
    await this.initialize();
    
    this.server = this.app.listen(this.port, () => {
      logger.info(`🎮 Spirit Pet Chronicles is running on port ${this.port}`);
      logger.info(`🌐 API available at: http://localhost:${this.port}`);
      logger.info(`📊 Health check: http://localhost:${this.port}/health`);
      logger.info(`📖 API info: http://localhost:${this.port}/api/info`);
    });

    return this.server;
  }

  /**
   * 优雅关闭
   */
  async gracefulShutdown() {
    logger.info('Starting graceful shutdown...');

    // 关闭HTTP服务器
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // 关闭数据库连接
    if (this.database) {
      await this.database.close();
      logger.info('Database connection closed');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  }
}

// 如果直接运行此文件，启动应用
if (require.main === module) {
  const app = new SpiritPetApp();
  app.start().catch(error => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = SpiritPetApp;