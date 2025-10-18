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
const EnhancedAIService = require('./ai/EnhancedAIService');
const AIEngine = require('./ai/AIEngine');
const PetManager = require('./game/PetManager');
const EnhancedPetManager = require('./game/EnhancedPetManager');
const BattleSystem = require('./game/BattleSystem');
const AdventureSystem = require('./game/AdventureSystem');
const PetRoutes = require('./routes/petRoutes');
const storyRoutes = require('./routes/storyRoutes');

const logger = require('./utils/logger');

class SpiritPetApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 14000;
    
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

      // 2. 初始化增强AI服务
      this.aiService = new EnhancedAIService();
      logger.info('Enhanced AI Service initialized');

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

      // 7. 设置剧情系统
      this.setupStorySystem();

      // 8. 设置定时任务
      this.setupCronJobs();

      // 9. 设置错误处理
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
    // 安全中间件 - 允许内联脚本
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
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

    // 全局心跳（前置，确保优先于任何路由与404）
    this.app.get('/api/heartbeat', (req, res) => {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        aiService: this.aiService ? this.aiService.getStatus() : { configured: false }
      });
    });
    this.app.get('/heartbeat', (req, res) => {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        aiService: this.aiService ? this.aiService.getStatus() : { configured: false }
      });
    });

    // 静态文件服务 - 设置正确的MIME类型
    this.app.use('/static', express.static('public'));
    this.app.use(express.static('public', {
      index: false, // 禁止自动返回 index.html，让根路径由路由控制
      setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    }));
  }

  /**
   * 设置剧情系统
   */
  setupStorySystem() {
    // 剧情系统将在后续版本中完全集成
    // 目前提供基础的剧情路由支持
    logger.info('Story system routes configured');
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

    // 心跳别名（非 /api 前缀）
    this.app.get('/heartbeat', (req, res) => {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        aiService: this.aiService.getStatus()
      });
    });

    // 心跳检查
    this.app.get('/api/heartbeat', (req, res) => {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        aiService: this.aiService.getStatus()
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
    
    // 宠物生成路由
    const petGeneratorRoutes = require('./routes/petGeneratorRoutes');
    // 进化预览路由
    const evolutionRoutes = require('./routes/evolutionRoutes');
    
    // 添加增强版中间件
    this.app.use('/api/pets', (req, res, next) => {
      req.enhancedPetManager = this.enhancedPetManager;
      req.petManager = this.petManager;
      req.aiEngine = this.aiEngine;
      req.db = this.database.db;
      next();
    });
    
    this.app.use('/api/pets', enhancedPetRoutes);
    this.app.use('/api/pets', petGeneratorRoutes);
    this.app.use('/api/evolution', evolutionRoutes);

    // 剧情系统路由
    this.app.use('/api/story', storyRoutes);
    
    // DeepSeek文本模型路由
    this.app.use('/api/deepseek', require('./routes/deepseekRoutes'));

    // 宠物图像生成路由（即梦4.0）
    const petImageRoutes = require('./routes/petImageRoutes');
    this.app.use('/api/pet-images', petImageRoutes(this.database, this.aiService));

    // 宠物人格系统路由
    const petPersonaRoutes = require('./routes/petPersonaRoutes');
    this.app.use('/api/pet-persona', petPersonaRoutes);

    // 新手引导系统路由
    const tutorialRoutes = require('./routes/tutorialRoutes');
    this.app.use('/api/tutorial', (req, res, next) => {
      req.db = this.database;
      req.aiService = this.aiService;
      next();
    }, tutorialRoutes);

    // 批量推理路由
    const batchInferenceRoutes = require('./routes/batchInferenceRoutes');
    this.app.use('/api/batch', batchInferenceRoutes(this.aiService));
    
    // 推理路由测试
    const inferenceTestRoutes = require('./routes/inferenceTestRoutes');
    this.app.use('/api/inference-test', inferenceTestRoutes(this.aiService));
    
    // 剧情树和成长系统路由
    const storyGrowthRoutes = require('./routes/storyGrowthRoutes');
    this.app.use('/api/story-growth', storyGrowthRoutes(this.aiService));

    // 进化系统路由
    const { router: evolutionRouter, setAIService: setEvolutionAIService } = require('./routes/evolution');
    setEvolutionAIService(this.aiService);
    this.app.use('/api/evolution', evolutionRouter);

    // 成长与进化闭环：应用增量并返回进化候选
    this.app.all('/api/progress/apply', async (req, res) => {
      try {
        const pet = req.body?.pet || {};
        const delta = req.body?.delta || { exp: 0, bond: 0 };
        // 基础数值
        const level0 = Number(pet.level || 1);
        const bond0 = Number(pet.bond || 0);
        const exp = Number(delta.exp || 0);
        const bondPlus = Number(delta.bond || 0);
        // 简化的等级增长：每10点经验+1级（占位规则）
        const level = level0 + Math.floor(exp / 10);
        const bond = bond0 + bondPlus;

        // 进化门槛（与你的设计一致）
        const normalEligible = (level >= 15) || (bond >= 60);
        const rareEligible = (level >= 22) && (bond >= 75);
        const eligible = normalEligible || rareEligible;

        let candidates = [];
        if (eligible) {
          // 调用 EvolutionAgent 计算候选
          const EvolutionAgent = require('./agents/pet/EvolutionAgent');
          const evo = new EvolutionAgent();
          // 将现有属性映射到 EvolutionAgent 期望格式
          const core = {
            species: pet.species || '未知灵体',
            rarity: pet.rarity || 'N',
            level,
            specialTraits: pet.specialTraits || [],
            baseStats: pet.baseStats || {
              health: Number(pet.attributes?.hp || 100),
              attack: Number(pet.attributes?.attack || 20),
              defense: Number(pet.attributes?.defense || 15),
              speed: Number(pet.attributes?.speed || 10),
              magic: Number(pet.attributes?.magic || 12),
            }
          };
          const ctx = { playerBond: bond, environment: '秘境' };
          const preview = await evo.previewEvolution(core, ctx);
          candidates = (preview?.candidates || []).map(c => ({
            to: c.effects?.target || c.tpl?.to || '未知形态',
            rarityShift: c.effects?.toRarity || c.tpl?.rarityShift || core.rarity,
            tags: c.tpl?.tags || [],
            score: c.score
          }));
        }

        res.json({ ok: true, newState: { level, bond }, eligible, candidates });
      } catch (err) {
        logger.error('progress/apply error:', err);
        res.status(200).json({ ok: true, newState: {}, eligible: false, candidates: [] });
      }
    });

    // 固定算法提示词增强接口
    const { buildHints } = require('./ai/FixedAlgorithmEngine');
    this.app.post('/api/algorithms/hints', (req, res) => {
      try {
        const cur = req.body?.current || {};
        const last = req.body?.last || {};
        const result = buildHints(cur, last);
        res.json({ ok: true, ...result });
      } catch (err) {
        logger.error('algorithms/hints error:', err);
        res.status(200).json({
          ok: true,
          tags: [],
          deltas: {},
          suggestions: ['【占位】建议根据速度/魔力/防御等变化，输出相应方向的能力。'],
          promptAugmentations: {
            evolution: '【占位】请在进化候选中考虑敏捷/防御/魔力方向。',
            story: '【占位】请在演出文本中以隐喻呈现上述方向。',
            numerical: '【占位】请进行小幅稳健的数值固化与特性条目选择。',
          },
        });
      }
    });

    // 文字放置：冒险事件（返回一段文本，沿用逐行演出）
    this.app.post('/api/adventure/text-event', async (req, res) => {
      try {
        const pet = req.body?.pet || { name: '无名', base_prompt: '神秘伙伴', hp: 100, attack: 20 };
        const ctx = req.body?.context || '在静谧的林间小道上，微风拂面。';
        const text = await this.aiService.generateEventDescription(pet, '冒险', ctx);
        res.json({ ok: true, event: text });
      } catch (err) {
        logger.error('adventure text-event error:', err);
        res.status(200).json({ ok: true, event: '【本地占位】你在林间漫步，偶遇一块泛着微光的石头，触摸之时感到一丝温暖。' });
      }
    });
    // 方法兼容：允许 GET/POST/OPTIONS 命中同一逻辑，避免 404
    this.app.all('/api/adventure/text-event', async (req, res) => {
      try {
        const pet = (req.body?.pet) || { name: '无名', base_prompt: '神秘伙伴', hp: 100, attack: 20 };
        const ctx = (req.body?.context) || '在静谧的林间小道上，微风拂面。';
        const text = await this.aiService.generateEventDescription(pet, '冒险', ctx);
        res.json({ ok: true, event: text });
      } catch (err) {
        logger.error('adventure text-event (all) error:', err);
        res.status(200).json({ ok: true, event: '【本地占位】你在林间漫步，偶遇一块泛着微光的石头，触摸之时感到一丝温暖。' });
      }
    });

    // 文字放置：日常互动（返回一段文本）
    this.app.post('/api/daily/tick', async (req, res) => {
      try {
        const pet = req.body?.pet || { name: '无名', base_prompt: '神秘伙伴', hp: 100, attack: 20 };
        const ctx = req.body?.context || '清晨的露水沾在草叶上。';
        const prompt = `为宠物生成一次日常互动的简短文字描述（50-100字），积极治愈：
宠物：${pet.name} - ${pet.base_prompt}
情境：${ctx}
要求：温暖，简单，中文。`;
        const text = await this.aiService.generateContent(prompt, { temperature: 0.7, maxTokens: 200 });
        res.json({ ok: true, event: text });
      } catch (err) {
        logger.error('daily tick error:', err);
        res.status(200).json({ ok: true, event: '【本地占位】你帮伙伴梳理毛发，它满足地眯起了眼睛，心情似乎更好了。' });
      }
    });
    // 方法兼容：允许 GET/POST/OPTIONS 命中同一逻辑
    this.app.all('/api/daily/tick', async (req, res) => {
      try {
        const pet = (req.body?.pet) || { name: '无名', base_prompt: '神秘伙伴', hp: 100, attack: 20 };
        const ctx = (req.body?.context) || '清晨的露水沾在草叶上。';
        const prompt = `为宠物生成一次日常互动的简短文字描述（50-100字），积极治愈：
宠物：${pet.name} - ${pet.base_prompt}
情境：${ctx}
要求：温暖，简单，中文。`;
        const text = await this.aiService.generateContent(prompt, { temperature: 0.7, maxTokens: 200 });
        res.json({ ok: true, event: text });
      } catch (err) {
        logger.error('daily tick (all) error:', err);
        res.status(200).json({ ok: true, event: '【本地占位】你帮伙伴梳理毛发，它满足地眯起了眼睛，心情似乎更好了。' });
      }
    });

    // 文字战斗：匹配与开场叙事
    this.app.all('/api/battle/match', async (req, res) => {
      try {
        const pet = req.body?.pet || { name: '无名', rarity: 'N', base_prompt: '神秘伙伴', hp: 100, attack: 20, defense: 15, speed: 10, magic: 12 };
        // 简化匹配（同稀有度优先）
        const opponent = { name: '边境守望者', rarity: pet.rarity, base_prompt: '护境·稳固', hp: 102, attack: 18, defense: 18, speed: 11, magic: 10 };
        const text = await this.aiService.generateContent(
          `为一次文字战斗生成开场叙事，4句中文，分句结尾用句号：
我方：${pet.name}（${pet.base_prompt}）
对手：${opponent.name}（${opponent.base_prompt}）
要求：沉浸、紧张，避免数值露出，强调意象与动作。`,
          { temperature: 0.7, maxTokens: 220 }
        );
        res.json({ ok: true, opponent, intro: text });
      } catch (err) {
        logger.error('battle match error:', err);
        res.status(200).json({
          ok: true,
          opponent: { name: '游侠影', rarity: 'R', base_prompt: '敏捷·试探' },
          intro: '风压在狭路中回旋。你与对手对望片刻，足尖轻点，影子先行。钢与意志交错，空气被划出一道锋线。'
        });
      }
    });

    // 文字战斗：回合演出与结果
    this.app.all('/api/battle/resolve', async (req, res) => {
      try {
        const pet = req.body?.pet || { name: '无名', rarity: 'N', base_prompt: '神秘伙伴' };
        const opponent = req.body?.opponent || { name: '边境守望者', rarity: pet.rarity, base_prompt: '护境·稳固' };
        const styleHint = `若敏捷倾向则写先手与连击；若魔力倾向则写灵纹与法阵；若防御倾向则写护盾与格挡；若高风险倾向则写暴击与背水。`;
        const text = await this.aiService.generateContent(
          `为一次文字战斗生成3-5个回合的中文演出描述，每回合1句，分句结尾用句号：
我方：${pet.name}（${pet.base_prompt}）
对手：${opponent.name}（${opponent.base_prompt}）
风格：紧凑、具意象、不露数值。${styleHint}
最后一句给出胜负或势均力敌的判断。`,
          { temperature: 0.75, maxTokens: 360 }
        );
        // 简单结果判定（占位）
        const outcome = /胜|制胜|赢|取胜/.test(text) ? 'win' : (/负|败|不敌/.test(text) ? 'lose' : 'draw');
        res.json({ ok: true, rounds: text, outcome });
      } catch (err) {
        logger.error('battle resolve error:', err);
        res.status(200).json({
          ok: true,
          rounds: '你先手探步，影与风一起刺向前方。对手抬臂格挡，钢声沉稳。你再度加速，以连击逼压空间。双方各退半步，势均力敌。',
          outcome: 'draw'
        });
      }
    });

    // StoryAgent 路由（进化叙事预览）
    const storyAgentRoutes = require('./routes/storyAgentRoutes');
    this.app.use('/api/story-agent', storyAgentRoutes);

    // 媒体服务：宠物形象占位生成（未来可接入即梦4.0）
    this.app.post('/api/media/pet-image', (req, res) => {
      try {
        const pet = req.body?.pet || {};
        const name = String(pet.displayName || pet.name || '灵宠').slice(0, 8);
        const rarity = pet.rarity || 'N';
        const colorMap = { SSS:'#ffd700', SSR:'#ff4444', SR:'#8a2be2', R:'#4169e1', N:'#808080' };
        const stroke = colorMap[rarity] || '#666666';
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1f1f2e"/>
      <stop offset="100%" stop-color="#0d0d15"/>
    </radialGradient>
  </defs>
  <circle cx="150" cy="150" r="120" fill="url(#g)" stroke="${stroke}" stroke-width="6"/>
  <text x="150" y="165" font-size="28" fill="#e0e0e0" text-anchor="middle" font-family="Microsoft YaHei, sans-serif">${name}</text>
</svg>`;
        const base64 = Buffer.from(svg).toString('base64');
        return res.json({ ok: true, url: `data:image/svg+xml;base64,${base64}` });
      } catch (err) {
        logger.error('pet-image error:', err);
        return res.status(200).json({ ok: true, url: '' });
      }
    });

    // Agents自检与协调路由
    const agentsRoutes = require('./routes/agentsRoutes');
    this.app.use('/api/agents', agentsRoutes);

    // 本机简易注册/登录占位（内存存储，仅用于本地测试）
    const authUsers = new Map();     // username -> { password, createdAt }
    const authTokens = new Map();    // token -> username

    this.app.post('/api/auth/register', (req, res) => {
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ success: false, message: '缺少用户名或密码' });
      if (authUsers.has(username)) return res.status(409).json({ success: false, message: '用户已存在' });
      authUsers.set(username, { password, createdAt: new Date().toISOString() });
      return res.json({ success: true, message: '注册成功' });
    });

    this.app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ success: false, message: '缺少用户名或密码' });
      const user = authUsers.get(username);
      if (!user || user.password !== password) return res.status(401).json({ success: false, message: '用户名或密码错误' });
      const token = 'local-' + Date.now() + '-' + Math.random().toString(16).slice(2);
      authTokens.set(token, username);
      return res.json({ success: true, token, user: { username } });
    });

    this.app.post('/api/auth/logout', (req, res) => {
      const { token } = req.body || {};
      if (!token) return res.status(400).json({ success: false, message: '缺少token' });
      authTokens.delete(token);
      return res.json({ success: true, message: '已退出登录' });
    });

    // 根路径 - 重定向到逐行显示冒险界面
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/local-game.html'));
    });

    // 增强版界面
    this.app.get('/enhanced', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/enhanced-index.html'));
    });

    // 冒险模式界面
    this.app.get('/adventure', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/adventure-mode.html'));
    });

    // 原版界面
    this.app.get('/classic', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // 轻量体验版
    this.app.get('/experience', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/experience.html'));
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
      logger.info(`🎭 Adventure event: POST http://localhost:${this.port}/api/adventure/text-event`);
      logger.info(`🕓 Daily tick: POST http://localhost:${this.port}/api/daily/tick`);
      logger.info(`⚙️ Algorithm hints: POST http://localhost:${this.port}/api/algorithms/hints`);
      logger.info(`🪴 Progress apply: POST http://localhost:${this.port}/api/progress/apply`);
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