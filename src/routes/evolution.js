/**
 * 进化系统路由
 * 处理宠物进化相关的API请求
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// 全局AI服务实例（将在app.js中设置）
let aiService = null;

// 设置AI服务实例
function setAIService(service) {
  aiService = service;
}

/**
 * 检查进化条件
 * POST /api/evolution/check
 */
router.post('/check', async (req, res) => {
  try {
    const { pet, playerStats } = req.body;
    
    if (!pet) {
      return res.status(400).json({
        success: false,
        message: '缺少宠物信息'
      });
    }

    if (!aiService?.evolutionSystem) {
      return res.status(500).json({
        success: false,
        message: '进化系统未初始化'
      });
    }

    const result = await aiService.evolutionSystem.checkEvolution(pet, playerStats || {});
    
    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    logger.error('Evolution check failed:', error);
    res.status(500).json({
      success: false,
      message: '进化检查失败',
      error: error.message
    });
  }
});

/**
 * 执行进化
 * POST /api/evolution/evolve
 */
router.post('/evolve', async (req, res) => {
  try {
    const { pet, playerStats } = req.body;
    
    if (!pet) {
      return res.status(400).json({
        success: false,
        message: '缺少宠物信息'
      });
    }

    if (!aiService?.evolutionSystem) {
      return res.status(500).json({
        success: false,
        message: '进化系统未初始化'
      });
    }

    // 先检查是否可以进化
    const checkResult = await aiService.evolutionSystem.checkEvolution(pet, playerStats || {});
    
    if (!checkResult.canEvolve) {
      return res.json({
        success: false,
        message: '进化条件不满足',
        reason: checkResult.reason || '未知原因',
        conditions: checkResult.conditions
      });
    }

    // 执行进化
    const evolutionResult = await aiService.evolutionSystem.executeEvolution(pet, playerStats || {});
    
    res.json({
      success: true,
      result: evolutionResult
    });

  } catch (error) {
    logger.error('Evolution execution failed:', error);
    res.status(500).json({
      success: false,
      message: '进化执行失败',
      error: error.message
    });
  }
});

/**
 * 获取进化指导
 * POST /api/evolution/guidance
 */
router.post('/guidance', async (req, res) => {
  try {
    const { pet, playerStats } = req.body;
    
    if (!pet) {
      return res.status(400).json({
        success: false,
        message: '缺少宠物信息'
      });
    }

    if (!aiService?.evolutionSystem) {
      return res.status(500).json({
        success: false,
        message: '进化系统未初始化'
      });
    }

    const guidance = await aiService.evolutionSystem.getEvolutionGuidance(pet, playerStats || {});
    
    res.json({
      success: true,
      guidance: guidance
    });

  } catch (error) {
    logger.error('Evolution guidance failed:', error);
    res.status(500).json({
      success: false,
      message: '获取进化指导失败',
      error: error.message
    });
  }
});

/**
 * 获取进化历史
 * GET /api/evolution/history/:petId
 */
router.get('/history/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    
    // 这里可以从数据库获取进化历史
    // 暂时返回模拟数据
    const history = [
      {
        from: '小龙',
        to: '青龙',
        stage: '成长期',
        timestamp: '2025-09-30T10:00:00Z',
        conditions: ['经验值达标', '羁绊值充足']
      }
    ];
    
    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    logger.error('Get evolution history failed:', error);
    res.status(500).json({
      success: false,
      message: '获取进化历史失败',
      error: error.message
    });
  }
});

/**
 * 获取进化预览
 * POST /api/evolution/preview
 */
router.post('/preview', async (req, res) => {
  try {
    const { pet } = req.body;
    
    if (!pet) {
      return res.status(400).json({
        success: false,
        message: '缺少宠物信息'
      });
    }

    if (!aiService?.evolutionSystem) {
      return res.status(500).json({
        success: false,
        message: '进化系统未初始化'
      });
    }

    const currentStage = aiService.evolutionSystem.getCurrentStage(pet.level || 0);
    const nextStage = aiService.evolutionSystem.getNextStage(currentStage);
    
    if (!nextStage) {
      return res.json({
        success: true,
        preview: {
          message: '已达到最高进化阶段',
          currentStage: currentStage.name,
          maxLevel: true
        }
      });
    }

    // 生成可能的进化形态预览
    const petType = aiService.evolutionSystem.determinePetType(pet);
    const evolutionChain = aiService.evolutionSystem.evolutionChains[petType] || 
                          aiService.evolutionSystem.evolutionChains.dragon;
    
    const stageKey = aiService.evolutionSystem.getStageKey(nextStage.name);
    const possibleForms = evolutionChain[stageKey] || ['神秘形态'];

    res.json({
      success: true,
      preview: {
        currentStage: currentStage.name,
        nextStage: nextStage.name,
        possibleForms: possibleForms,
        requirements: nextStage.evolutionThreshold,
        difficulty: nextStage.difficulty
      }
    });

  } catch (error) {
    logger.error('Evolution preview failed:', error);
    res.status(500).json({
      success: false,
      message: '获取进化预览失败',
      error: error.message
    });
  }
});

/**
 * 生成进化场景图片
 * POST /api/evolution/scene-image
 */
router.post('/scene-image', async (req, res) => {
  try {
    const { evolutionData } = req.body;
    
    if (!evolutionData) {
      return res.status(400).json({
        success: false,
        message: '缺少进化数据'
      });
    }

    if (!aiService?.imageService) {
      return res.status(500).json({
        success: false,
        message: '图像服务未初始化'
      });
    }

    // 使用场景图片生成器
    const sceneGenerator = aiService.sceneImageGenerator;
    if (!sceneGenerator) {
      return res.status(500).json({
        success: false,
        message: '场景图片生成器未初始化'
      });
    }

    const imageResult = await sceneGenerator.generateEvolutionSceneImage(evolutionData);
    
    res.json({
      success: imageResult.success,
      image: imageResult.success ? {
        url: imageResult.imageUrl,
        prompt: imageResult.prompt,
        type: imageResult.type,
        stage: imageResult.stage
      } : null,
      error: imageResult.error
    });

  } catch (error) {
    logger.error('Evolution scene image generation failed:', error);
    res.status(500).json({
      success: false,
      message: '进化场景图片生成失败',
      error: error.message
    });
  }
});

module.exports = { router, setAIService };