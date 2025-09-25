/**
 * 灵境斗宠录 - 神话觉醒版主应用
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// 导入核心模块
const Database = require('./models/Database');
const EnhancedDatabase = require('./models/EnhancedDatabase');
const AIService = require('./ai/AIService');
const AIEngine = require('./ai/AIEngine');
const PetManager = require('./game/PetManager');
const EnhancedPetManager = require('./game/EnhancedPetManager');
const BattleSystem = require('./game/BattleSystem');
const AdventureSystem = require('./game/AdventureSystem');
const ActivitySystem = require('./game/ActivitySystem');
const PetRoutes = require('./routes/petRoutes');
const logger = require('./utils/logger');

class SpiritPetApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.server = null;
  }

  /**
   * 初始化应用
   */
  async initialize() {
    try {
      logger.info('🐉 Initializing Spirit Pet Chronicles - Mythology Awakening Edition...');

      // 1. 初始化增强版数据库
      this.database = new EnhancedDatabase();
      await this.database.initialize();
      logger.info('Enhanced database initialized successfully');

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
      this.activitySystem = new ActivitySystem(this.database);
      logger.info('Game systems initialized');

      // 5. 设置Express中间件
      this.setupMiddleware();

      // 6. 设置路由
      this.setupRoutes();

      // 7. 设置定时任务
      this.setupCronJobs();

      // 8. 设置错误处理
      this.setupErrorHandling();

      logger.info('🌟 Application initialization completed');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  /**
   * 设置Express中间件
   */
  setupMiddleware() {
    // CORS
    this.app.use(cors());

    // JSON解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // 静态文件服务
    this.app.use('/static', express.static('public'));
    this.app.use(express.static('public'));
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
        version: '2.0.0 - 神话觉醒版',
        services: {
          database: !!this.database,
          aiService: this.aiService.getStatus(),
          petManager: !!this.petManager,
          enhancedPetManager: !!this.enhancedPetManager,
          battleSystem: !!this.battleSystem,
          adventureSystem: !!this.adventureSystem
        }
      });
    });

    // API信息
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: '灵境斗宠录 - 神话觉醒版',
        version: '2.0.0',
        description: '探索山海经的神秘世界，培养传说级灵宠',
        features: [
          '🌟 SSS级稀有度系统',
          '🐉 山海经神话生物',
          '✨ 神话觉醒机制',
          '🔮 隐藏式特性系统',
          '🏔️ 神话秘境探索',
          '🎭 三层AI驱动进化',
          '⚔️ 完整战斗系统',
          '🌊 托管奇遇探索'
        ],
        endpoints: {
          pets: '/api/pets',
          characteristics: '/api/pets/:id/characteristics',
          mythology: '/api/pets/:id/mythology-recommendations',
          evolution: '/api/pets/:id/evolve',
          health: '/health'
        }
      });
    });

    // 游戏统计
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.database.getEnhancedStats();
        const aiStatus = this.aiService.getStatus();
        
        res.json({
          success: true,
          data: {
            database: stats,
            ai: aiStatus,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            features: {
              raritySystem: true,
              mythologyIntegration: true,
              enhancedEvolution: true,
              hiddenCharacteristics: true
            }
          }
        });
      } catch (error) {
        logger.error('Get stats error:', error);
        res.status(500).json({ error: '获取统计信息失败' });
      }
    });

    // 增强版宠物路由中间件
    this.app.use('/api/pets', (req, res, next) => {
      req.enhancedPetManager = this.enhancedPetManager;
      req.petManager = this.petManager;
      req.aiEngine = this.aiEngine;
      req.db = this.database.db;
      req.battleSystem = this.battleSystem;
      req.adventureSystem = this.adventureSystem;
      next();
    });

    // 宠物相关路由
    const petRoutes = new PetRoutes(this.petManager, this.battleSystem, this.adventureSystem);
    this.app.use('/api/pets', petRoutes.getRouter());

    // 增强版宠物路由
    const enhancedPetRoutes = require('./routes/enhancedPetRoutes');
    this.app.use('/api/pets', enhancedPetRoutes);

    // 页面路由
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/mobile-index.html'));
    });

    this.app.get('/mobile', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/mobile-index.html'));
    });

    // 英文入口（前端按路径 /en/ 做语言识别）
    this.app.get('/en', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/mobile-index.html'));
    });

    this.app.get('/en/mobile', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/mobile-index.html'));
    });

    this.app.get('/desktop', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/optimized-index.html'));
    });

    this.app.get('/classic', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // 认证与支付占位接口（后续可接入 OAuth/Stripe/Paddle）
    this.app.post('/api/auth/register', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));
    this.app.post('/api/auth/login', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));
    this.app.post('/api/auth/logout', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));
    this.app.post('/api/billing/checkout', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));
    this.app.post('/api/billing/webhook', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

    // 神话数据API
    this.app.get('/api/mythology', (req, res) => {
      const mythologyData = require('./data/mythologyData');
      res.json({
        creatures: {
          legendary: mythologyData.shanhaijing.legendary.length,
          epic: mythologyData.shanhaijing.epic.length,
          rare: mythologyData.shanhaijing.rare.length
        },
        locations: {
          chinese: mythologyData.mythicalLocations.chinese,
          world: mythologyData.mythicalLocations.world
        },
        foods: {
          legendary: mythologyData.mythicalFood.legendary.length,
          epic: mythologyData.mythicalFood.epic.length,
          rare: mythologyData.mythicalFood.rare.length
        },
        raritySystem: mythologyData.rarityConfig
      });
    });

    // ==================== 激活码充值（内存MVP） ====================
    const activationCodes = new Map([
      ['TEST-1111-AAAA', { diamonds: 100, uses: 0, maxUses: 1, note: '初始测试码' }],
      ['TEST-2222-BBBB', { diamonds: 200, uses: 0, maxUses: 5, note: '多次可用测试码' }]
    ]);

    this.app.post('/api/billing/redeem', async (req, res) => {
      try {
        const { userId = 'mobile-user', code } = req.body || {};
        if (!code) return res.status(400).json({ success: false, message: '缺少激活码' });
        const item = activationCodes.get(code);
        if (!item) return res.status(404).json({ success: false, message: '激活码不存在' });
        if (item.uses >= item.maxUses) return res.status(410).json({ success: false, message: '激活码已用尽' });

        item.uses += 1;
        const reward = { diamonds: item.diamonds, surpriseBag: true };
        // TODO: 后续将钱包改为数据库 user_wallet 表
        res.json({ success: true, data: { userId, reward, note: item.note } });
      } catch (e) {
        logger.error('Redeem error:', e);
        res.status(500).json({ success: false, message: '兑换失败' });
      }
    });

    this.app.get('/api/billing/code/check', (req, res) => {
      const { code } = req.query;
      const item = code ? activationCodes.get(code) : null;
      if (!item) return res.json({ exists: false });
      res.json({ exists: true, uses: item.uses, maxUses: item.maxUses, diamonds: item.diamonds });
    });

    // ==================== 匹配对战（快速匹配） ====================
    this.app.post('/api/battle/matchmaking', async (req, res) => {
      try {
        const { userId = 'mobile-user', petId } = req.body || {};
        // 取己方宠物
        let myPet = petId
          ? await this.database.get('SELECT * FROM pets WHERE id = ?', [petId])
          : await this.database.get('SELECT * FROM pets WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [userId]);

        if (!myPet) return res.status(404).json({ success: false, message: '未找到你的宠物' });

        // 随机对手（排除自己）
        let rival = await this.database.get(
          'SELECT * FROM pets WHERE id != ? ORDER BY RANDOM() LIMIT 1',
          [myPet.id]
        );

        let isAI = false;
        if (!rival) {
          // 构造一个AI假想敌（参考宝可梦元素）
          isAI = true;
          rival = {
            id: 'ai-rival',
            name: '试炼石像',
            element: 'rock',
            hp: Math.max(80, myPet.hp - 10),
            attack: Math.max(8, myPet.attack - 2),
            defense: Math.max(8, myPet.defense - 2),
            speed: Math.max(8, myPet.speed - 1),
            rarity: 'R'
          };
        }

        // 简化的战斗计算（不依赖实时AI，纯数值）
        const elemK = (a, b) => {
          // 火>冰>毒>火，增减20%；再加常见系（水>火，草>水，电>水，岩克飞，等：此处先简化）
          const pairs = { fire: 'ice', ice: 'poison', poison: 'fire' };
          if (pairs[a] === b) return 1.2;
          if (pairs[b] === a) return 0.8;
          // 额外常见：water>fire, grass>water, electric>water
          if (a === 'water' && b === 'fire') return 1.2;
          if (a === 'grass' && b === 'water') return 1.2;
          if (a === 'electric' && b === 'water') return 1.2;
          return 1.0;
        };

        function simulate(p1, p2) {
          const log = [];
          const narrOpeners = [
            '两只灵宠对峙，气息在空气中涌动。',
            '风沙渐起，战场在无形中凝固。',
            '一声啼鸣划破长空，决斗开始。'
          ];
          log.push(narrOpeners[Math.floor(Math.random()*narrOpeners.length)]);
          let hp1 = p1.hp, hp2 = p2.hp;
          let turn = 1;
          const first = (p1.speed >= p2.speed) ? 'p1' : 'p2';

          const attackOnce = (attacker, defender, atk, def, elemA, elemD, nameA, nameD) => {
            const crit = Math.random() < 0.05 ? 1.5 : 1.0;
            const base = Math.max(1, atk - Math.floor(def * 0.6));
            const coeff = elemK(elemA || 'neutral', elemD || 'neutral') * crit;
            const dmg = Math.max(1, Math.round(base * coeff));
            log.push(`${nameA} 发动攻击，对 ${nameD} 造成 ${dmg} 点伤害${crit>1?'（暴击）':''}`);
            return dmg;
          };

          while (hp1 > 0 && hp2 > 0 && turn <= 20) {
            log.push(`第 ${turn} 回合：`);
            if (first === 'p1') {
              hp2 -= attackOnce('p1','p2', p1.attack, p2.defense, p1.element, p2.element, p1.name, p2.name);
              if (hp2 <= 0) break;
              hp1 -= attackOnce('p2','p1', p2.attack, p1.defense, p2.element, p1.element, (p2.name||'对手'), p1.name);
            } else {
              hp1 -= attackOnce('p2','p1', p2.attack, p1.defense, p2.element, p1.element, (p2.name||'对手'), p1.name);
              if (hp1 <= 0) break;
              hp2 -= attackOnce('p1','p2', p1.attack, p2.defense, p1.element, p2.element, p1.name, p2.name);
            }
            turn++;
          }

          const finishers = [
            '尘埃落定，胜负已分。',
            '战意退潮，余音未绝。',
            '灵气回拢，万籁俱寂。'
          ];
          log.push(finishers[Math.floor(Math.random()*finishers.length)]);
          const winner = hp1 > hp2 ? 'p1' : 'p2';
          return {
            winner: winner === 'p1' ? myPet.id : (rival.id || 'ai'),
            battle_process: log.join('\
'),
            pet1_final_hp: Math.max(0, hp1),
            pet2_final_hp: Math.max(0, hp2),
            rounds: turn
          };
        }

        const result = simulate(myPet, rival);

        // 结算（接口返回用；数据库仍写入固定经验5，避免迁移）
        const win = result.winner === myPet.id;
        const exp = win ? 15 : 6;
        const gold = win ? 20 : 8;
        const dropTable = [
          { key: 'minor_potion', name: '小型灵药', rate: 0.25 },
          { key: 'shard_fire', name: '火之碎晶', rate: 0.15 },
          { key: 'shard_ice', name: '冰之碎晶', rate: 0.15 },
          { key: 'myst_leaf', name: '迷雾叶片', rate: 0.10 }
        ];
        const drops = dropTable.filter(d => Math.random() < d.rate).map(d => ({ key: d.key, name: d.name, qty: 1 }));
        const rating = win ? (result.rounds <= 6 ? 'S' : result.rounds <= 10 ? 'A' : 'B') : 'C';

        // 写战斗日志（experience_gained 先暂用固定5，保持兼容）
        await this.database.run(
          `INSERT INTO battle_logs (id, pet1_id, pet2_id, battle_type, battle_process, winner_id, rounds, pet1_final_hp, pet2_final_hp, experience_gained)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            myPet.id,
            rival.id || 'ai',
            isAI ? 'ai' : 'pvp',
            result.battle_process,
            result.winner,
            result.rounds,
            result.pet1_final_hp,
            result.pet2_final_hp,
            5
          ]
        );

        res.json({
          success: true,
          data: {
            myPet: { id: myPet.id, name: myPet.name, hp: myPet.hp, element: myPet.element },
            rival: { id: rival.id, name: rival.name, hp: rival.hp, element: rival.element, isAI },
            report: result.battle_process,
            winner: result.winner,
            settlement: { exp, gold, drops, rating, rounds: result.rounds }
          }
        });
      } catch (e) {
        logger.error('Matchmaking error:', e);
        res.status(500).json({ success: false, message: '匹配失败' });
      }
    });

    // ==================== 潜移默化三层进化管线 + 留痕 ====================
    // 二层提示词严格受限；三层词条放宽到上百条
    const BOUNDED = { 
      maxPromptLen: 220,       // L2基础提示词总长上限（更小，防膨胀）
      maxActiveTraits: 120,    // L3活跃词条数量上限（更大，增强策略深度）
      maxKeywords: 30,         // 每次合并时保留的最近关键词数量
      maxTemplateLen: 160      // 进化模板的最大长度（中英混排安全）
    };

    const mergeKeywords = (basePrompt, kwArr = []) => {
      // 规范化、去空
      const add = (kwArr || [])
        .filter(Boolean)
        .map(k => String(k).trim())
        .filter(Boolean);
      
      // 去重（保留最近出现的）
      const seen = new Set();
      const dedup = [];
      for (let i = add.length - 1; i >= 0; i--) {
        const k = add[i];
        if (!seen.has(k)) {
          seen.add(k);
          dedup.push(k);
        }
      }
      dedup.reverse();
      // 仅保留最近若干关键词
      const windowed = dedup.slice(-BOUNDED.maxKeywords);
      
      // 合并为“基础提示词 + #关键词流”
      let merged = (basePrompt || '').trim();
      if (windowed.length) {
        const kwLine = windowed.map(k => `#${k}`).join(' ');
        merged = merged ? `${merged}
${kwLine}` : kwLine;
      }
      
      // 严格裁剪基础提示词长度（L2限制）
      if (merged.length > BOUNDED.maxPromptLen) {
        // 尽量保留末尾（最近）的关键词与文本
        merged = merged.slice(merged.length - BOUNDED.maxPromptLen);
        // 避免开头残缺，尝试从下一行开始
        const cut = merged.indexOf('\
');
        if (cut > 0 && cut < 80) merged = merged.slice(cut + 1);
      }
      return merged;
    };

    // 规则表（示例，后续可扩充为独立JSON）：关键词 → 元素倾向/模板碎片
    const RULES = [
      { keys: ['火','灼烧','熔'], element: 'fire', template: '体内潜藏古火，能以烈焰灼敌' },
      { keys: ['水','潮汐','浪'], element: 'water', template: '与潮汐同频，水幕护体' },
      { keys: ['风','疾','羽'], element: 'wind', template: '化作疾风，先手制敌' },
      { keys: ['冰','霜','寒'], element: 'ice', template: '寒意凝结，霜刃破甲' },
      { keys: ['毒','腐','蛊'], element: 'poison', template: '以微毒侵蚀，使敌战意迟缓' },
      { keys: ['岩','石','岳'], element: 'rock', template: '如山而立，坚甲不破' },
      { keys: ['电','雷','闪'], element: 'electric', template: '雷霆奔袭，电光石火' },
      { keys: ['灵','幻','梦'], element: 'psychic', template: '心灵共鸣，扰乱敌念' }
    ];

    const generateTemplateFromRules = (keywords = []) => {
      const hit = RULES.find(r => r.keys.some(k => keywords.join(',').includes(k)));
      if (!hit) return '天性难测，仍在寻找自我之路';
      return `${hit.template}。`;
    };
    // 对模板进行安全裁剪与去噪，确保L2稳定
    const sanitizeTemplate = (tpl) => {
      if (!tpl) return '';
      let s = String(tpl).replace(/\s+/g, ' ').trim();
      if (s.length > BOUNDED.maxTemplateLen) {
        s = s.slice(0, BOUNDED.maxTemplateLen).trim();
        // 尽量在句号/顿号/空格边界截断
        const idx = Math.max(s.lastIndexOf('。'), s.lastIndexOf('，'), s.lastIndexOf('.'), s.lastIndexOf(' '));
        if (idx > 40) s = s.slice(0, idx + 1);
      }
      return s;
    };

    const pruneTraitsIfNeeded = async (petId) => {
      // 仅保留最近获得的若干条词条，避免无限膨胀
      const traits = await this.database.all(
        'SELECT id FROM pet_traits WHERE pet_id = ? AND is_active = 1 ORDER BY acquisition_time DESC',
        [petId]
      );
      if (traits.length > BOUNDED.maxActiveTraits) {
        const toDisable = traits.slice(BOUNDED.maxActiveTraits);
        for (const t of toDisable) {
          await this.database.run('UPDATE pet_traits SET is_active = 0 WHERE id = ?', [t.id]);
        }
      }
    };

    const silentEvolutionPipeline = async ({ petId, action_type, action_target, keywords = [] }) => {
      // 1) 记录行为
      await this.database.run(
        `INSERT INTO pet_behaviors (id, pet_id, action_type, action_target, keywords_added)
         VALUES (?,?,?,?,?)`,
        [`${Date.now()}-${Math.random().toString(16).slice(2)}`, petId, action_type, action_target, JSON.stringify(keywords)]
      );

      // 2) 获取宠物
      const pet = await this.database.get('SELECT * FROM pets WHERE id = ?', [petId]);
      if (!pet) return;

      // 3) L1：基础提示词修正（潜移默化）
      const updatedPrompt = mergeKeywords(pet.base_prompt, keywords);

      // 4) L2：进化模板（规则为主，AI为辅）
      let evolutionTemplate = generateTemplateFromRules(keywords);
      try {
        // 若有AI服务，可增强模板多样性（可选）
        const recent = await this.database.all(
          'SELECT * FROM pet_behaviors WHERE pet_id = ? ORDER BY timestamp DESC LIMIT 5',
          [petId]
        );
        const aiTpl = await this.aiEngine.generateEvolutionTemplate({ ...pet, base_prompt: updatedPrompt }, recent);
        if (aiTpl && typeof aiTpl === 'string') evolutionTemplate = aiTpl;
      } catch (e) {
        // 降级到规则模板
      }

      // 5) L3：词条与数值固化（并进行有界裁剪）
      // 应用模板裁剪，限制L2体积
      evolutionTemplate = sanitizeTemplate(evolutionTemplate);
      let traitsResult = { traits: [], attribute_changes: {} };
      try {
        traitsResult = await this.aiEngine.generateNumericalTraits(evolutionTemplate, { ...pet, base_prompt: updatedPrompt });
      } catch (e) {
        // 简单降级：给出轻微数值变化
        traitsResult = { traits: [], attribute_changes: { attack: 1 } };
      }

      await this.enhancedPetManager.applyEvolutionWithRarity(
        { ...pet, base_prompt: updatedPrompt },
        {
          updated_prompt: updatedPrompt,
          attribute_changes: traitsResult.attribute_changes,
          traits: traitsResult.traits
        }
      );

      // 6) 裁剪活跃词条
      await pruneTraitsIfNeeded(petId);
    };

    // ==================== 行为接口（潜移默化触发三层） ====================
    this.app.post('/api/pets/feed', async (req, res) => {
      try {
        const { petId, food = 'apple' } = req.body || {};
        if (!petId) return res.status(400).json({ success: false, message: '缺少petId' });

        // 关键词映射（可扩展）
        const kw = {
          apple: ['清甜', '活力'],
          milk: ['温润', '安宁'],
          honey: ['粘稠', '愉悦'],
          carrot: ['健康', '敏捷']
        }[food] || ['饱腹'];

        await silentEvolutionPipeline({ petId, action_type: 'feed', action_target: food, keywords: kw });

        res.json({ success: true, data: { message: '喂食完成', keywords: kw } });
      } catch (e) {
        logger.error('Feed error:', e);
        res.status(500).json({ success: false, message: '喂食失败' });
      }
    });

    this.app.post('/api/pets/explore', async (req, res) => {
      try {
        const { petId, location = 'forest' } = req.body || {};
        if (!petId) return res.status(400).json({ success: false, message: '缺少petId' });

        const kwMap = {
          forest: ['翠绿', '回声', '潜行'],
          mountain: ['巍峨', '坚毅', '稀薄空气'],
          river: ['流动', '清冽', '映光'],
          ruins: ['古老', '铭刻', '秘纹'],
          cave: ['幽暗', '回荡', '矿息'],
          garden: ['芬芳', '轻快', '蝶舞'],
          park: ['悠闲', '愉悦', '人群']
        };
        const kw = kwMap[location] || ['旅行'];

        await silentEvolutionPipeline({ petId, action_type: 'explore', action_target: location, keywords: kw });

        // 简单的文字描述
        const desc = `在 ${location} 的探索里，你的灵宠似乎吸收了${kw.slice(0,2).join('、')}的气息。`;
        res.json({ success: true, data: { description: desc, keywords: kw } });
      } catch (e) {
        logger.error('Explore error:', e);
        res.status(500).json({ success: false, message: '探索失败' });
      }
    });

    this.app.post('/api/pets/chat', async (req, res) => {
      try {
        const { petId, message = '' } = req.body || {};
        if (!petId) return res.status(400).json({ success: false, message: '缺少petId' });

        // 简单情感/意图提取为关键词（可替换为情感分析）
        const kw = [];
        if (message.includes('饿') || message.includes('eat')) kw.push('饥饿');
        if (message.includes('冷') || message.includes('cold')) kw.push('寒意');
        if (message.includes('热') || message.includes('hot')) kw.push('温热');
        if (message.includes('战') || message.includes('fight')) kw.push('斗志');
        if (message.includes('探') || message.includes('explore')) kw.push('好奇');

        await silentEvolutionPipeline({ petId, action_type: 'train', action_target: 'chat', keywords: kw.length?kw:['呢喃'] });

        // 聊天回应（占位：初期语气词 → 成长逐步丰富）
        const reply = kw.length ? '嘤嘤...(我感觉到了你的心意)' : '咕咕~';
        res.json({ success: true, data: { response: reply } });
      } catch (e) {
        logger.error('Chat error:', e);
        res.status(500).json({ success: false, message: '聊天失败' });
      }
    });



    // API根路径
    this.app.get('/api', (req, res) => {
      res.json({
        message: '🐉 欢迎来到《灵境斗宠录》神话觉醒版！',
        description: '探索山海经的神秘世界，培养传说级灵宠',
        version: '2.0.0 - 神话觉醒版',
        newFeatures: [
          '🌟 SSS级稀有度系统 - 培养传说级神兽',
          '🐉 山海经神话生物 - 九尾狐、凤凰、龙等',
          '✨ 神话觉醒机制 - 真龙形态、凤凰涅槃',
          '🔮 隐藏式特性系统 - 不再显示内部提示词',
          '🏔️ 神话秘境探索 - 昆仑山、蓬莱仙岛等'
        ],
        interfaces: {
          enhanced: '/ (推荐)',
          classic: '/classic'
        },
        api: '/api/info'
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
        await this.adventureSystem.processRandomEncounters();
        logger.info('Random encounters processed');
      } catch (error) {
        logger.error('Error processing encounters:', error);
      }
    });

    // 每2小时检查宠物进化机会
    cron.schedule('0 */2 * * *', async () => {
      try {
        // 获取所有活跃宠物
        const activePets = await this.database.all(
          'SELECT * FROM pets WHERE updated_at > datetime("now", "-24 hours")',
          []
        );

        for (const pet of activePets) {
          // 检查是否有足够的行为记录触发自动进化
          const behaviorCount = await this.database.get(
            'SELECT COUNT(*) as count FROM pet_behaviors WHERE pet_id = ? AND timestamp > datetime("now", "-6 hours")',
            [pet.id]
          );

          if (behaviorCount && behaviorCount.count >= 3) {
            try {
              const recentBehaviors = await this.database.all(
                'SELECT * FROM pet_behaviors WHERE pet_id = ? ORDER BY timestamp DESC LIMIT 5',
                [pet.id]
              );

              const evolutionTemplate = await this.aiEngine.generateEvolutionTemplate(pet, recentBehaviors);
              const numericalResult = await this.aiEngine.generateNumericalTraits(evolutionTemplate, pet);
              
              await this.enhancedPetManager.applyEvolutionWithRarity(pet, {
                updated_prompt: pet.base_prompt,
                attribute_changes: numericalResult.attribute_changes,
                traits: numericalResult.traits
              });

              logger.info(`Auto-evolution triggered for pet ${pet.name}`);
            } catch (error) {
              logger.warn(`Auto-evolution failed for pet ${pet.name}:`, error.message);
            }
          }
        }
      } catch (error) {
        logger.error('Error in auto-evolution check:', error);
      }
    });

    logger.info('Cron jobs scheduled');
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: '请访问 /api/info 查看可用的API端点',
        availableInterfaces: {
          enhanced: '/',
          classic: '/classic',
          api: '/api'
        }
      });
    });

    // 全局错误处理
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '服务器内部错误，请稍后重试'
      });
    });

    // 进程错误处理
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, starting graceful shutdown');
      this.gracefulShutdown();
    });
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      this.server = this.app.listen(this.port, () => {
        logger.info(`🎮 Spirit Pet Chronicles - Mythology Awakening Edition is running on port ${this.port}`);
        logger.info(`🌐 Enhanced Interface: http://localhost:${this.port}`);
        logger.info(`🎨 Classic Interface: http://localhost:${this.port}/classic`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        logger.info(`📖 API info: http://localhost:${this.port}/api/info`);
        logger.info(`🐉 Ready to explore the mythical world!`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * 优雅关闭
   */
  async gracefulShutdown() {
    logger.info('Starting graceful shutdown...');

    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    if (this.database) {
      await this.database.close();
      logger.info('Database connection closed');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  }
}

// 启动应用
const app = new SpiritPetApp();
app.initialize().then(() => {
  app.start();
}).catch(error => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

module.exports = SpiritPetApp;