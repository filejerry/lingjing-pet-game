/**
 * 修正版宠物路由 - 实现正确的三层AI架构
 * 所有交互都通过L1记录 → L3判断 → L2进化 → L3固化的流程
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const PetTypematcher = require('../game/PetTypematcher');
const MultiPetManager = require('../game/MultiPetManager');

function createCorrectPetRoutes(database, aiEngine, petManager, battleSystem, adventureSystem, chatSystem) {
  const router = express.Router();
  const petMatcher = new PetTypematcher();

  /**
   * 智能创建宠物 - 根据玩家描述匹配
   */
  router.post('/create', async (req, res) => {
    try {
      const { userId, petType, petName } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // 检查用户是否已有宠物
      const existingPets = await database.all(
        'SELECT * FROM pets WHERE user_id = ? AND is_active = 1',
        [userId]
      );

      if (existingPets.length > 0) {
        return res.json({
          message: '你已经有宠物了！',
          pet: existingPets[0]
        });
      }

      let matchedPet;
      let creationMessage;

      if (petType && petType.trim()) {
        // 根据用户输入匹配宠物类型
        matchedPet = petMatcher.matchPetType(petType);
        creationMessage = `根据你的描述"${petType}"，为你匹配了${matchedPet.name}！`;
        
        if (matchedPet.matchScore === 1) {
          creationMessage += ' 这是一只神秘的生物，它的能力还有待探索...';
        } else {
          creationMessage += ` 匹配关键词：${matchedPet.matchedKeywords.join('、')}`;
        }
      } else {
        // 随机创建
        const allTypes = petMatcher.getAllPetTypes();
        matchedPet = allTypes[Math.floor(Math.random() * allTypes.length)];
        creationMessage = `神秘的力量为你带来了${matchedPet.name}！`;
      }

      // 创建宠物数据
      const petId = uuidv4();
      const finalName = petName && petName.trim() ? petName.trim() : matchedPet.name;
      
      const pet = {
        id: petId,
        user_id: userId,
        name: finalName,
        base_prompt: `${matchedPet.description}。这只名叫${finalName}的${matchedPet.species}刚刚与你建立了契约。`,
        hp: matchedPet.baseStats.hp,
        attack: matchedPet.baseStats.attack,
        defense: matchedPet.baseStats.defense,
        speed: matchedPet.baseStats.speed,
        magic: matchedPet.baseStats.magic,
        element_type: matchedPet.element,
        pet_type: matchedPet.species,
        appearance: matchedPet.description,
        personality: matchedPet.personality,
        rarity: 'R' // 默认稀有度
      };

      // 保存到数据库
      await database.run(
        `INSERT INTO pets (id, user_id, name, base_prompt, hp, attack, defense, speed, magic, element_type, pet_type, appearance, personality, rarity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pet.id, pet.user_id, pet.name, pet.base_prompt, pet.hp, pet.attack, pet.defense, pet.speed, 
         pet.magic, pet.element_type, pet.pet_type, pet.appearance, pet.personality, pet.rarity]
      );

      // L1记录：孵化行为
      await aiEngine.recordBehavior(pet.id, 'hatch', 'soul_contract', {
        userId: userId,
        userInput: petType || 'random',
        matchedType: matchedPet.species,
        matchScore: matchedPet.matchScore,
        timestamp: new Date().toISOString()
      });

      logger.info(`New pet created: ${pet.name} (${pet.id}) for user ${userId}, type: ${petType || 'random'}`);
      
      res.json({
        message: creationMessage,
        pet: pet,
        matchInfo: {
          userInput: petType,
          matchedType: matchedPet.species,
          matchScore: matchedPet.matchScore,
          matchedKeywords: matchedPet.matchedKeywords || []
        }
      });

    } catch (error) {
      logger.error('Pet creation failed:', error);
      res.status(500).json({ error: 'Failed to create pet' });
    }
  });

  /**
   * 获取宠物类型建议
   */
  router.get('/suggestions', (req, res) => {
    try {
      const suggestions = petMatcher.getSuggestedKeywords();
      res.json({
        suggestions: suggestions,
        examples: [
          '我想要一只可爱的小猫咪',
          '给我一条威武的龙',
          '我喜欢神秘的狐狸',
          '想要一只会飞的鸟',
          '海洋里的生物',
          '传说中的神兽'
        ]
      });
    } catch (error) {
      logger.error('Get suggestions failed:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  });

  /**
   * 宠物行为接口 - 统一的L1入口
   */
  router.post('/:petId/action', async (req, res) => {
    try {
      const { petId } = req.params;
      const { action, target, context = {} } = req.body;

      if (!action || !target) {
        return res.status(400).json({ error: 'Action and target are required' });
      }

      // 验证宠物存在
      const pet = await database.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }

      // 所有行为都通过L1记录，不立即生效
      const result = await aiEngine.recordBehavior(petId, action, target, {
        ...context,
        userAction: true,
        timestamp: new Date().toISOString()
      });

      // 返回延迟反馈信息
      res.json({
        message: result.message,
        immediate: false,
        explanation: '你的行为已被记录，宠物可能会在稍后发生变化...',
        petId: petId,
        action: action,
        target: target
      });

    } catch (error) {
      logger.error('Pet action failed:', error);
      res.status(500).json({ error: 'Action failed' });
    }
  });

  /**
   * 宠物对话 - 也通过L1记录
   */
  router.post('/:petId/chat', async (req, res) => {
    try {
      const { petId } = req.params;
      const { message } = req.body;

      const pet = await database.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }

      // L1记录对话行为
      await aiEngine.recordBehavior(petId, 'chat', 'conversation', {
        userMessage: message,
        timestamp: new Date().toISOString()
      });

      // 生成宠物回复（基于当前状态，不依赖AI）
      const reply = await chatSystem.generateResponse(pet, message);

      res.json({
        reply: reply,
        petName: pet.name,
        chatLevel: chatSystem.getChatLevel(pet)
      });

    } catch (error) {
      logger.error('Pet chat failed:', error);
      res.status(500).json({ error: 'Chat failed' });
    }
  });

  /**
   * 获取宠物详细状态
   */
  router.get('/:petId', async (req, res) => {
    try {
      const { petId } = req.params;
      
      const pet = await database.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }

      // 获取活跃词缀
      const traits = await database.all(
        'SELECT * FROM pet_traits WHERE pet_id = ? AND is_active = 1 ORDER BY created_at DESC',
        [petId]
      );

      // 获取最近行为记录
      const recentBehaviors = await database.all(`
        SELECT * FROM pet_behaviors 
        WHERE pet_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 10
      `, [petId]);

      // 获取L3判断历史
      const recentJudgments = await database.all(`
        SELECT * FROM pet_l3_judgments 
        WHERE pet_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 5
      `, [petId]);

      res.json({
        pet: pet,
        traits: traits,
        recentBehaviors: recentBehaviors,
        recentJudgments: recentJudgments,
        stats: {
          totalTraits: traits.length,
          totalBehaviors: recentBehaviors.length,
          lastActivity: recentBehaviors[0]?.timestamp || null
        }
      });

    } catch (error) {
      logger.error('Get pet status failed:', error);
      res.status(500).json({ error: 'Failed to get pet status' });
    }
  });

  /**
   * 获取用户的所有宠物
   */
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const pets = await database.all(
        'SELECT * FROM pets WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
        [userId]
      );

      res.json(pets);

    } catch (error) {
      logger.error('Get user pets failed:', error);
      res.status(500).json({ error: 'Failed to get pets' });
    }
  });

  /**
   * 战斗系统 - 也记录为行为
   */
  router.post('/:petId/battle-ai', async (req, res) => {
    try {
      const { petId } = req.params;
      
      const pet = await database.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }

      // L1记录战斗行为
      await aiEngine.recordBehavior(petId, 'battle', 'ai_opponent', {
        battleType: 'ai',
        timestamp: new Date().toISOString()
      });

      // 执行战斗
      const battleResult = await battleSystem.battleWithAI(petId);

      res.json(battleResult);

    } catch (error) {
      logger.error('Battle failed:', error);
      res.status(500).json({ error: 'Battle failed' });
    }
  });

  /**
   * 冒险系统
   */
  router.post('/:petId/adventure/start', async (req, res) => {
    try {
      const { petId } = req.params;
      const { duration = 3600000 } = req.body; // 默认1小时

      const pet = await database.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }

      // L1记录冒险行为
      await aiEngine.recordBehavior(petId, 'adventure', 'exploration', {
        duration: duration,
        timestamp: new Date().toISOString()
      });

      // 开始冒险
      const adventureResult = await adventureSystem.startAdventure(petId, duration);

      res.json(adventureResult);

    } catch (error) {
      logger.error('Adventure start failed:', error);
      res.status(500).json({ error: 'Adventure start failed' });
    }
  });

  /**
   * 手动触发L3判断 (调试用)
   */
  router.post('/:petId/trigger-l3', async (req, res) => {
    try {
      const { petId } = req.params;
      
      await aiEngine.triggerL3Judgment(petId);
      
      res.json({ message: 'L3 judgment triggered' });

    } catch (error) {
      logger.error('Manual L3 trigger failed:', error);
      res.status(500).json({ error: 'L3 trigger failed' });
    }
  });

  /**
   * 获取AI引擎状态 (调试用)
   */
  router.get('/:petId/ai-status', async (req, res) => {
    try {
      const { petId } = req.params;
      
      // 获取各层数据
      const behaviors = await database.all(`
        SELECT COUNT(*) as count, processed_by_l3 
        FROM pet_behaviors 
        WHERE pet_id = ? 
        GROUP BY processed_by_l3
      `, [petId]);

      const l3Judgments = await database.all(`
        SELECT * FROM pet_l3_judgments 
        WHERE pet_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 3
      `, [petId]);

      const l2Evolutions = await database.all(`
        SELECT * FROM pet_l2_evolutions 
        WHERE pet_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 3
      `, [petId]);

      res.json({
        behaviors: behaviors,
        l3Judgments: l3Judgments,
        l2Evolutions: l2Evolutions,
        boundaries: aiEngine.BOUNDARIES
      });

    } catch (error) {
      logger.error('Get AI status failed:', error);
      res.status(500).json({ error: 'Failed to get AI status' });
    }
  });

  return router;
}

module.exports = createCorrectPetRoutes;