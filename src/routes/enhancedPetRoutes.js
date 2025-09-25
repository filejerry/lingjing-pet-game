/**
 * 增强版宠物路由 - 支持稀有度系统和神话元素
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const PetChatSystem = require('../game/PetChatSystem');
const { v4: uuidv4 } = require('uuid');

// 获取所有宠物
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'player1';
    const pets = await req.petManager.getUserPets(userId);
    res.json(pets);
  } catch (error) {
    logger.error('Error getting pets:', error);
    res.status(500).json({ error: 'Failed to get pets' });
  }
});

// 创建新宠物
router.post('/', async (req, res) => {
  try {
    const { userId, petName } = req.body;
    
    if (!petName) {
      return res.status(400).json({ error: 'Pet name is required' });
    }

    const pet = await req.petManager.createPet(userId || 'player1', petName);
    logger.info(`Pet created: ${petName} for user ${userId}`);
    res.status(201).json(pet);
  } catch (error) {
    logger.error('Error creating pet:', error);
    res.status(500).json({ error: 'Failed to create pet' });
  }
});

// 获取宠物详情
router.get('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const pet = await req.petManager.getPetById(petId);
    
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(pet);
  } catch (error) {
    logger.error('Error getting pet:', error);
    res.status(500).json({ error: 'Failed to get pet' });
  }
});

// 获取宠物特性（增强版，隐藏提示词）
router.get('/:petId/characteristics', async (req, res) => {
  try {
    const { petId } = req.params;
    
    // 尝试使用增强版宠物管理器
    let characteristics;
    if (req.enhancedPetManager && typeof req.enhancedPetManager.getPetCharacteristics === 'function') {
      characteristics = await req.enhancedPetManager.getPetCharacteristics(petId);
    } else {
      // 降级到普通宠物管理器
      const pet = await req.petManager.getPetById(petId);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }
      
      // 简化的特性生成
      characteristics = {
        id: pet.id,
        name: pet.name,
        rarity: pet.rarity || 'C',
        stats: {
          hp: pet.hp,
          attack: pet.attack,
          defense: pet.defense,
          speed: pet.speed,
          magic: pet.magic || 0,
          resistance: pet.resistance || 0
        },
        characteristics: [{
          name: '普通生物',
          description: '这是一个普通的生物，还没有显现出特殊的特性',
          type: 'normal'
        }],
        specialAbilities: [],
        mysteriousAura: '散发着淡淡的神秘气息...'
      };
    }
    
    if (!characteristics) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(characteristics);
  } catch (error) {
    logger.error('Error getting pet characteristics:', error);
    res.status(500).json({ error: 'Failed to get pet characteristics' });
  }
});

// 获取活动点数状态
router.get('/activity-status', async (req, res) => {
  try {
    const activitySystem = new (require('../game/ActivitySystem'))(req.db);
    const status = await activitySystem.getActivityStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取活动状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取活动状态失败'
    });
  }
});

// 获取最近活动记录
router.get('/recent-activities', async (req, res) => {
  try {
    const activities = await req.db.all(`
      SELECT 
        action_type,
        action_target,
        activity_cost,
        timestamp,
        'behavior' as type
      FROM pet_behaviors 
      WHERE timestamp > datetime('now', '-24 hours')
      
      UNION ALL
      
      SELECT 
        adventure_type as action_type,
        location as action_target,
        activity_cost,
        created_at as timestamp,
        'adventure' as type
      FROM adventure_logs 
      WHERE created_at > datetime('now', '-24 hours')
      
      ORDER BY timestamp DESC 
      LIMIT 10
    `);

    const formattedActivities = activities.map(activity => ({
      description: formatActivityDescription(activity),
      timestamp: activity.timestamp,
      type: activity.type
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('获取活动记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取活动记录失败'
    });
  }
});

// 格式化活动描述
function formatActivityDescription(activity) {
  switch (activity.action_type) {
    case 'feed':
      return `喂食了 ${activity.action_target}，消耗 ${activity.activity_cost} 活动点数`;
    case 'explore':
      return `探索了 ${activity.action_target}，消耗 ${activity.activity_cost} 活动点数`;
    case 'exploration':
      return `在 ${activity.action_target} 进行了探险，消耗 ${activity.activity_cost} 活动点数`;
    case 'battle':
      return `与 ${activity.action_target} 进行了战斗，消耗 ${activity.activity_cost} 活动点数`;
    default:
      return `进行了 ${activity.action_type} 活动，消耗 ${activity.activity_cost} 活动点数`;
  }
}

// 获取神话推荐
router.get('/:petId/mythology-recommendations', async (req, res) => {
  try {
    const { petId } = req.params;
    
    if (req.enhancedPetManager && typeof req.enhancedPetManager.getMythicalFoodRecommendations === 'function') {
      const pet = await req.enhancedPetManager.getPetById(petId);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }
      
      const foodRecommendations = req.enhancedPetManager.getMythicalFoodRecommendations(pet);
      const locationRecommendations = req.enhancedPetManager.getMythicalLocationRecommendations(pet);
      
      res.json({
        foods: foodRecommendations,
        locations: locationRecommendations
      });
    } else {
      // 默认推荐
      res.json({
        foods: [
          { name: '灵芝', effects: ['生命力'], rarity: 'S' },
          { name: '朱果', effects: ['火焰亲和'], rarity: 'A' }
        ],
        locations: ['昆仑山', '蓬莱仙岛', '瑶池']
      });
    }
  } catch (error) {
    logger.error('Error getting mythology recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// 宠物行为（喂食、探索等）
router.post('/action', async (req, res) => {
  try {
    const { petId, action, target } = req.body;
    
    if (!petId || !action || !target) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const pet = await req.petManager.getPetById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // 处理行为
    const actionResult = await req.aiEngine.processPlayerAction(pet, action, target);
    
    // 检查是否需要进化
    const shouldEvolve = Math.random() < 0.3; // 30%概率触发进化检查
    
    if (shouldEvolve) {
      try {
        // 获取最近的行为记录
        const recentBehaviors = await req.db.all(
          'SELECT * FROM pet_behaviors WHERE pet_id = ? ORDER BY created_at DESC LIMIT 5',
          [petId]
        );
        
        // 生成进化模板
        const evolutionTemplate = await req.aiEngine.generateEvolutionTemplate(pet, recentBehaviors);
        
        // 生成数值词条
        const numericalResult = await req.aiEngine.generateNumericalTraits(evolutionTemplate, pet);
        
        // 应用进化（使用增强版如果可用）
        let evolutionResult;
        if (req.enhancedPetManager && typeof req.enhancedPetManager.applyEvolutionWithRarity === 'function') {
          evolutionResult = await req.enhancedPetManager.applyEvolutionWithRarity(pet, {
            updated_prompt: actionResult.updatedPrompt,
            attribute_changes: numericalResult.attribute_changes,
            traits: numericalResult.traits
          });
        } else {
          evolutionResult = await req.petManager.applyEvolution(pet, numericalResult);
        }
        
        res.json({
          success: true,
          message: `${pet.name}进行了${action}行为，并且发生了进化！`,
          actionResult,
          evolutionResult,
          evolved: true
        });
      } catch (evolutionError) {
        logger.warn('Evolution failed, but action succeeded:', evolutionError);
        res.json({
          success: true,
          message: `${pet.name}进行了${action}行为`,
          actionResult,
          evolved: false
        });
      }
    } else {
      res.json({
        success: true,
        message: `${pet.name}进行了${action}行为`,
        actionResult,
        evolved: false
      });
    }

  } catch (error) {
    logger.error('Error processing pet action:', error);
    res.status(500).json({ error: 'Failed to process action' });
  }
});

// 手动触发进化
router.post('/:petId/evolve', async (req, res) => {
  try {
    const { petId } = req.params;
    
    const pet = await req.petManager.getPetById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // 获取最近的行为记录
    const recentBehaviors = await req.db.all(
      'SELECT * FROM pet_behaviors WHERE pet_id = ? ORDER BY created_at DESC LIMIT 10',
      [petId]
    );

    if (recentBehaviors.length === 0) {
      return res.status(400).json({ error: 'Pet needs more experiences before evolution' });
    }

    // 生成进化
    const evolutionTemplate = await req.aiEngine.generateEvolutionTemplate(pet, recentBehaviors);
    const numericalResult = await req.aiEngine.generateNumericalTraits(evolutionTemplate, pet);
    
    // 应用进化
    let evolutionResult;
    if (req.enhancedPetManager && typeof req.enhancedPetManager.applyEvolutionWithRarity === 'function') {
      evolutionResult = await req.enhancedPetManager.applyEvolutionWithRarity(pet, {
        updated_prompt: pet.base_prompt, // 保持当前提示词
        attribute_changes: numericalResult.attribute_changes,
        traits: numericalResult.traits
      });
    } else {
      evolutionResult = await req.petManager.applyEvolution(pet, numericalResult);
    }

    res.json({
      success: true,
      message: `${pet.name}完成了进化！`,
      evolutionResult
    });

  } catch (error) {
    logger.error('Error evolving pet:', error);
    res.status(500).json({ error: 'Failed to evolve pet' });
  }
});

// 获取宠物进化历史
router.get('/:petId/evolution-history', async (req, res) => {
  try {
    const { petId } = req.params;
    
    const behaviors = await req.db.all(
      'SELECT * FROM pet_behaviors WHERE pet_id = ? ORDER BY created_at DESC',
      [petId]
    );
    
    const traits = await req.db.all(
      'SELECT * FROM pet_traits WHERE pet_id = ? ORDER BY created_at DESC',
      [petId]
    );

    res.json({
      behaviors,
      traits,
      evolutionCount: traits.length
    });

  } catch (error) {
    logger.error('Error getting evolution history:', error);
    res.status(500).json({ error: 'Failed to get evolution history' });
  }
});

// 宠物聊天 - 玩家发送消息
router.post('/:petId/chat', async (req, res) => {
  try {
    const { petId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '消息不能为空'
      });
    }
    
    // 获取宠物信息
    const pet = await req.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在'
      });
    }
    
    // 初始化聊天系统
    const chatSystem = new PetChatSystem(req.db, req.aiEngine?.aiService);
    
    // 生成宠物回应
    const response = await chatSystem.respondToPLayer(pet, message.trim());
    
    // 保存聊天记录
    await chatSystem.saveChatHistory(petId, message.trim(), response, response.level);
    
    res.json({
      success: true,
      data: {
        playerMessage: message.trim(),
        petResponse: response,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: '聊天失败，请稍后重试'
    });
  }
});

// 宠物主动说话
router.get('/:petId/speak', async (req, res) => {
  try {
    const { petId } = req.params;
    const { context = 'idle' } = req.query;
    
    // 获取宠物信息
    const pet = await req.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在'
      });
    }
    
    // 初始化聊天系统
    const chatSystem = new PetChatSystem(req.db, req.aiEngine?.aiService);
    
    // 生成宠物主动发言
    const speech = await chatSystem.generatePetSpeech(pet, context);
    
    res.json({
      success: true,
      data: {
        petSpeech: speech,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Pet speech error:', error);
    res.status(500).json({
      success: false,
      message: '获取宠物发言失败'
    });
  }
});

// 获取聊天历史
router.get('/:petId/chat-history', async (req, res) => {
  try {
    const { petId } = req.params;
    const { limit = 20 } = req.query;
    
    // 获取宠物信息
    const pet = await req.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在'
      });
    }
    
    // 初始化聊天系统
    const chatSystem = new PetChatSystem(req.db, req.aiEngine?.aiService);
    
    // 获取聊天历史
    const history = await chatSystem.getChatHistory(petId, parseInt(limit));
    
    // 计算当前语言等级
    const currentSpeechLevel = chatSystem.calculateSpeechLevel(pet);
    const levelData = chatSystem.speechLevels[currentSpeechLevel];
    
    res.json({
      success: true,
      data: {
        chatHistory: history.reverse(), // 按时间正序排列
        currentSpeechLevel: {
          level: currentSpeechLevel,
          name: levelData.name,
          canRespond: levelData.canRespond,
          maxLength: levelData.maxLength
        },
        petInfo: {
          name: pet.name,
          level: pet.level,
          rarity: pet.rarity,
          mythology_type: pet.mythology_type
        }
      }
    });
    
  } catch (error) {
    logger.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: '获取聊天历史失败'
    });
  }
});

// 获取宠物语言能力信息
router.get('/:petId/speech-info', async (req, res) => {
  try {
    const { petId } = req.params;
    
    // 获取宠物信息
    const pet = await req.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在'
      });
    }
    
    // 初始化聊天系统
    const chatSystem = new PetChatSystem(req.db, req.aiEngine?.aiService);
    
    // 计算语言等级
    const speechLevel = chatSystem.calculateSpeechLevel(pet);
    const levelData = chatSystem.speechLevels[speechLevel];
    
    // 计算升级条件
    const nextLevel = Math.min(4, speechLevel + 1);
    const nextLevelData = chatSystem.speechLevels[nextLevel];
    
    let upgradeCondition = '';
    if (speechLevel < 4) {
      if (speechLevel === 0) {
        upgradeCondition = '达到3级可学会简单词汇';
      } else if (speechLevel === 1) {
        upgradeCondition = '达到8级可学会短句表达';
      } else if (speechLevel === 2) {
        upgradeCondition = '达到15级可进行完整对话';
      } else if (speechLevel === 3) {
        upgradeCondition = '达到20级或获得神话血脉可获得深度交流能力';
      }
    } else {
      upgradeCondition = '已达到最高语言等级';
    }
    
    res.json({
      success: true,
      data: {
        currentLevel: {
          level: speechLevel,
          name: levelData.name,
          canRespond: levelData.canRespond,
          maxLength: levelData.maxLength,
          vocabulary: levelData.vocabulary.slice(0, 3) // 只显示部分词汇作为示例
        },
        nextLevel: speechLevel < 4 ? {
          level: nextLevel,
          name: nextLevelData.name,
          upgradeCondition
        } : null,
        petStats: {
          name: pet.name,
          level: pet.level,
          rarity: pet.rarity,
          mythology_type: pet.mythology_type
        }
      }
    });
    
  } catch (error) {
    logger.error('Get speech info error:', error);
    res.status(500).json({
      success: false,
      message: '获取语言能力信息失败'
    });
  }
});

module.exports = router;