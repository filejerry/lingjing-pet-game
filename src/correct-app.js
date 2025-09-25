/**
 * 修正版应用入口 - 实现正确的三层AI架构
 * 宝可梦风格界面 + 延迟反馈机制 + L1→L3→L2→L3流程
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron');

// 导入修正版组件
const CorrectDatabase = require('./models/CorrectDatabase');
const AIService = require('./ai/AIService');
const CorrectAIEngine = require('./ai/CorrectAIEngine');
const EnhancedAIEngine = require('./ai/EnhancedAIEngine');
const YiJingStateMachine = require('./ai/YiJingStateMachine');
const PetManager = require('./game/PetManager');
const PetPersonalityEngine = require('./game/PetPersonalityEngine');
const BattleSystem = require('./game/BattleSystem');
const AdventureSystem = require('./game/AdventureSystem');
const PetChatSystem = require('./game/PetChatSystem');
const EnhancedPetChatSystem = require('./game/EnhancedPetChatSystem');
const createCorrectPetRoutes = require('./routes/correctPetRoutes');
const createMultiPetRoutes = require('./routes/multiPetRoutes');

const logger = require('./utils/logger');

class CorrectApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3004;
    this.database = null;
    this.aiService = null;
    this.aiEngine = null;
    this.yijingStateMachine = null;
    this.gameServices = {};
  }

  async init() {
    try {
      logger.info('🐉 Initializing Spirit Pet Chronicles - Correct AI Architecture Edition...');

      // 初始化数据库
      this.database = new CorrectDatabase();
      await this.database.init();
      logger.info('Correct database initialized');

      // 初始化AI服务
      this.aiService = new AIService();
      logger.info('AI Service initialized');

      // 初始化增强版AI引擎（集成易经状态机）
      this.aiEngine = new EnhancedAIEngine(this.aiService, this.database);
      logger.info('Enhanced AI Engine with YiJing State Machine initialized');

      // 获取内置的易经状态机引用
      this.yijingStateMachine = this.aiEngine.yijingStateMachine;
      logger.info('YiJing State Machine reference obtained');

      // 初始化游戏系统
      this.gameServices = {
        petManager: new PetManager(this.database),
        personalityEngine: new PetPersonalityEngine(),
        battleSystem: new BattleSystem(this.database, this.aiService),
        adventureSystem: new AdventureSystem(this.database, this.aiService),
        chatSystem: new EnhancedPetChatSystem(this.database, this.aiService, new PetPersonalityEngine())
      };
      logger.info('Game systems initialized');

      // 配置Express
      this.setupExpress();

      // 设置路由
      this.setupRoutes();

      // 设置定时任务
      this.setupCronJobs();

      logger.info('🌟 Correct application initialization completed');

    } catch (error) {
      logger.error('Application initialization failed:', error);
      throw error;
    }
  }

  setupExpress() {
    // 中间件
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 静态文件
    this.app.use(express.static(path.join(__dirname, '../public')));

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // 主页路由 - 多宠物版文字冒险游戏
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/multi-pet-adventure.html'));
    });

    // 宝可梦风格游戏界面
    this.app.get('/pokemon', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/pokemon-style.html'));
    });

    // 易经状态机监控面板
    this.app.get('/yijing', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/yijing-dashboard.html'));
    });

    // 抽卡风格界面（备用）
    this.app.get('/gacha', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/gacha-style.html'));
    });

    // 经典界面（备用）
    this.app.get('/classic', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/enhanced-index.html'));
    });

    // API路由
    this.app.use('/api/pets', createCorrectPetRoutes(
      this.database,
      this.aiEngine,
      this.gameServices.petManager,
      this.gameServices.battleSystem,
      this.gameServices.adventureSystem,
      this.gameServices.chatSystem
    ));
    
    // 多宠物系统路由
    this.app.use('/api/multi-pets', createMultiPetRoutes(
      this.database,
      this.aiEngine,
      this.gameServices.petManager
    ));

    // 系统信息路由
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'Spirit Pet Chronicles - YiJing Enhanced AI Architecture',
        version: '2.1.0',
        architecture: 'L1(Record) → L3(Judge) → L2(Evolve) → L3(Solidify) + YiJing State Machine',
        features: [
          'Delayed feedback mechanism',
          'Pokemon-style interface',
          'Correct three-layer AI flow',
          'YiJing state machine integration',
          'Oracle core feedback algorithm',
          'Six-yao dynamic evolution',
          'Bounded prompt management',
          'Immersive text experience'
        ],
        boundaries: this.aiEngine.BOUNDARIES,
        database: this.database.getStats(),
        yijingState: this.yijingStateMachine.getStateStats()
      });
    });

    // 易经状态机API路由
    this.app.get('/api/yijing/state', (req, res) => {
      res.json(this.yijingStateMachine.getStateStats());
    });

    this.app.post('/api/yijing/oracle', async (req, res) => {
      try {
        const { aiOutput, layerType = 'L3' } = req.body;
        if (!aiOutput) {
          return res.status(400).json({ error: 'AI output is required' });
        }

        const feedback = this.yijingStateMachine.oracleCore(aiOutput, layerType);
        res.json(feedback);
      } catch (error) {
        logger.error('Oracle core processing failed:', error);
        res.status(500).json({ error: 'Oracle processing failed' });
      }
    });

    this.app.post('/api/yijing/reset', (req, res) => {
      this.yijingStateMachine.reset();
      res.json({ message: 'YiJing state machine reset successfully' });
    });

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        ai: this.aiService.getStatus()
      });
    });

    // 世界新闻API
    this.app.get('/api/world-news', (req, res) => {
      const news = this.generateWorldNews();
      res.json({ news });
    });

    // 激活码验证
    this.app.post('/api/activation-code', async (req, res) => {
      try {
        const { code, userId } = req.body;
        
        const activationCode = this.database.get(
          'SELECT * FROM activation_codes WHERE code = ? AND is_used = 0',
          [code]
        );

        if (!activationCode) {
          return res.status(400).json({ error: 'Invalid or used activation code' });
        }

        // 标记为已使用
        this.database.run(
          'UPDATE activation_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
          [userId, code]
        );

        // 添加活动点数
        const currentPoints = this.database.get(
          'SELECT * FROM user_activity_points WHERE user_id = ?',
          [userId]
        );

        if (currentPoints) {
          this.database.run(
            'UPDATE user_activity_points SET current_points = current_points + ? WHERE user_id = ?',
            [activationCode.value, userId]
          );
        } else {
          this.database.run(
            'INSERT INTO user_activity_points (user_id, current_points) VALUES (?, ?)',
            [userId, 100 + activationCode.value]
          );
        }

        res.json({
          message: `激活码验证成功！获得${activationCode.value}活动点数`,
          points: activationCode.value
        });

      } catch (error) {
        logger.error('Activation code verification failed:', error);
        res.status(500).json({ error: 'Verification failed' });
      }
    });

    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // 错误处理
    this.app.use((error, req, res, next) => {
      logger.error('Express error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  setupCronJobs() {
    // 每5分钟检查一次需要处理的L3判断
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Running scheduled L3 judgment check...');
        
        // 获取有未处理行为的宠物
        const petsWithUnprocessedBehaviors = await this.database.all(`
          SELECT DISTINCT pet_id 
          FROM pet_behaviors 
          WHERE processed_by_l3 = 0
        `);

        if (petsWithUnprocessedBehaviors && petsWithUnprocessedBehaviors.length > 0) {
          for (const pet of petsWithUnprocessedBehaviors) {
            await this.aiEngine.triggerL3Judgment(pet.pet_id);
          }
        }

        logger.info(`L3 judgment check completed for ${petsWithUnprocessedBehaviors.length} pets`);
      } catch (error) {
        logger.error('Scheduled L3 judgment failed:', error);
      }
    });

    // 每小时重置AI请求计数
    cron.schedule('0 * * * *', () => {
      this.aiService.resetRequestCount();
      logger.info('AI request count reset');
    });

    // 每天清理过期数据
    cron.schedule('0 2 * * *', () => {
      this.database.cleanup();
      logger.info('Database cleanup completed');
    });

    // 每10分钟处理随机相遇
    cron.schedule('*/10 * * * *', async () => {
      try {
        await this.gameServices.adventureSystem.processRandomEncounters();
      } catch (error) {
        logger.error('Random encounters processing failed:', error);
      }
    });

    logger.info('Cron jobs scheduled');
  }

  generateWorldNews() {
    const newsTemplates = [
      '🌟 传说中的{creature}在玩家"{player}"的培养下觉醒了【{trait}】特质！',
      '⚔️ 激烈的战斗！玩家"{player}"的{creature}击败了来自{location}的强敌！',
      '🎉 恭喜玩家"{player}"成功孵化出{rarity}级神话生物【{creature}】！',
      '🔥 {location}发现了新的神秘遗迹，据说隐藏着上古神兽的秘密...',
      '❄️ {element}系的传承现世！多位玩家的宠物获得了【{trait}】特质！',
      '🌊 深海探险大发现！玩家发现了传说中的{location}入口！'
    ];

    const creatures = ['九尾狐', '凤凰', '真龙', '麒麟', '白虎', '玄武', '朱雀', '青龙'];
    const players = ['神秘训练师', '龙之使者', '星辰法师', '幻境行者', '元素掌控者', '传说猎人'];
    const traits = ['真龙血脉', '凤凰涅槃', '冰封', '烈焰', '雷霆', '治愈', '预知', '隐身'];
    const locations = ['火山口', '龙宫', '天庭', '幽冥界', '星辰海', '混沌虚空'];
    const rarities = ['SSS', 'SSR', 'SR'];
    const elements = ['火', '水', '木', '金', '土', '风', '雷', '冰'];

    const template = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
    
    return template
      .replace('{creature}', creatures[Math.floor(Math.random() * creatures.length)])
      .replace('{player}', players[Math.floor(Math.random() * players.length)])
      .replace('{trait}', traits[Math.floor(Math.random() * traits.length)])
      .replace('{location}', locations[Math.floor(Math.random() * locations.length)])
      .replace('{rarity}', rarities[Math.floor(Math.random() * rarities.length)])
      .replace('{element}', elements[Math.floor(Math.random() * elements.length)]);
  }

  async start() {
    try {
      await this.init();
      
      this.app.listen(this.port, () => {
        logger.info(`🎮 Spirit Pet Chronicles - Correct AI Architecture is running on port ${this.port}`);
        logger.info(`🌐 Pokemon-style Interface: http://localhost:${this.port}`);
        logger.info(`🎨 Classic Interface: http://localhost:${this.port}/classic`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        logger.info(`📖 API info: http://localhost:${this.port}/api/info`);
        logger.info(`🐉 Ready to explore the mythical world with correct AI architecture!`);
      });

    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down application...');
    
    if (this.database) {
      this.database.close();
    }
    
    process.exit(0);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (global.app) {
    await global.app.shutdown();
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  if (global.app) {
    await global.app.shutdown();
  }
});

// 启动应用
if (require.main === module) {
  const app = new CorrectApp();
  global.app = app;
  app.start();
}

module.exports = CorrectApp;