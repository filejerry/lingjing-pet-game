/**
 * 剧情树和成长系统路由
 * 处理影游式剧情分支和宝可梦式养成
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

module.exports = (aiService) => {
  /**
   * 获取可用故事列表
   */
  router.get('/stories/available', async (req, res) => {
    try {
      const { level = 1, bond = 0 } = req.query;
      const context = { level: parseInt(level), bond: parseInt(bond) };
      
      const availableStories = aiService.getAvailableStories(context);
      
      res.json({
        success: true,
        stories: availableStories,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get available stories failed:', error);
      res.status(500).json({
        error: 'Failed to get available stories',
        message: error.message
      });
    }
  });

  /**
   * 开始新故事
   */
  router.post('/stories/start', async (req, res) => {
    try {
      const { playerId, storyType, context = {} } = req.body;
      
      if (!playerId || !storyType) {
        return res.status(400).json({
          error: 'Missing required fields: playerId, storyType'
        });
      }

      const result = await aiService.startStory(playerId, storyType, context);
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Start story failed:', error);
      res.status(500).json({
        error: 'Failed to start story',
        message: error.message
      });
    }
  });

  /**
   * 做出剧情选择
   */
  router.post('/stories/choice', async (req, res) => {
    try {
      const { playerId, choiceId } = req.body;
      
      if (!playerId || !choiceId) {
        return res.status(400).json({
          error: 'Missing required fields: playerId, choiceId'
        });
      }

      const result = await aiService.makeStoryChoice(playerId, choiceId);
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Make story choice failed:', error);
      res.status(500).json({
        error: 'Failed to make story choice',
        message: error.message
      });
    }
  });

  /**
   * 获取当前故事状态
   */
  router.get('/stories/current/:playerId', async (req, res) => {
    try {
      const { playerId } = req.params;
      
      const currentStory = aiService.getCurrentStory(playerId);
      
      res.json({
        success: true,
        currentStory,
        hasActiveStory: !!currentStory,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get current story failed:', error);
      res.status(500).json({
        error: 'Failed to get current story',
        message: error.message
      });
    }
  });

  /**
   * 添加宠物经验值
   */
  router.post('/growth/add-exp', async (req, res) => {
    try {
      const { pet, expGained } = req.body;
      
      if (!pet || expGained === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: pet, expGained'
        });
      }

      const result = aiService.addPetExperience(pet, expGained);
      
      // 如果升级了，生成升级引导
      let guidance = null;
      if (result.leveledUp) {
        guidance = aiService.getLevelUpGuidance(pet, result);
      }
      
      res.json({
        success: true,
        result,
        guidance,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Add pet experience failed:', error);
      res.status(500).json({
        error: 'Failed to add pet experience',
        message: error.message
      });
    }
  });

  /**
   * 执行宠物进化
   */
  router.post('/growth/evolve', async (req, res) => {
    try {
      const { pet } = req.body;
      
      if (!pet) {
        return res.status(400).json({
          error: 'Missing required field: pet'
        });
      }

      const result = await aiService.evolvePet(pet);
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Pet evolution failed:', error);
      res.status(500).json({
        error: 'Failed to evolve pet',
        message: error.message
      });
    }
  });

  /**
   * 获取宠物完整状态
   */
  router.post('/growth/status', async (req, res) => {
    try {
      const { pet } = req.body;
      
      if (!pet) {
        return res.status(400).json({
          error: 'Missing required field: pet'
        });
      }

      const status = aiService.getPetStatus(pet);
      
      res.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get pet status failed:', error);
      res.status(500).json({
        error: 'Failed to get pet status',
        message: error.message
      });
    }
  });

  /**
   * 检查进化可用性
   */
  router.post('/growth/check-evolution', async (req, res) => {
    try {
      const { pet } = req.body;
      
      if (!pet) {
        return res.status(400).json({
          error: 'Missing required field: pet'
        });
      }

      const canEvolve = aiService.checkEvolutionAvailability(pet);
      
      res.json({
        success: true,
        canEvolve,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Check evolution availability failed:', error);
      res.status(500).json({
        error: 'Failed to check evolution availability',
        message: error.message
      });
    }
  });

  /**
   * 获取技能树信息
   */
  router.get('/growth/skill-tree/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const { level = 1 } = req.query;
      
      const skillTree = aiService.growthSystem.skillTrees[type.toLowerCase()];
      
      if (!skillTree) {
        return res.status(404).json({
          error: 'Skill tree not found',
          availableTypes: Object.keys(aiService.growthSystem.skillTrees)
        });
      }

      // 过滤出当前等级可用的技能
      const availableSkills = {};
      const petLevel = parseInt(level);
      
      for (const [skillLevel, skill] of Object.entries(skillTree.skills)) {
        if (petLevel >= parseInt(skillLevel)) {
          availableSkills[skillLevel] = { ...skill, unlocked: true };
        } else {
          availableSkills[skillLevel] = { ...skill, unlocked: false };
        }
      }
      
      res.json({
        success: true,
        skillTree: {
          name: skillTree.name,
          type,
          skills: availableSkills
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get skill tree failed:', error);
      res.status(500).json({
        error: 'Failed to get skill tree',
        message: error.message
      });
    }
  });

  /**
   * 获取进化链信息
   */
  router.get('/growth/evolution-chain/:type', async (req, res) => {
    try {
      const { type } = req.params;
      
      const evolutionChain = aiService.growthSystem.evolutionChains[type];
      
      if (!evolutionChain) {
        return res.status(404).json({
          error: 'Evolution chain not found',
          availableTypes: Object.keys(aiService.growthSystem.evolutionChains)
        });
      }
      
      res.json({
        success: true,
        evolutionChain,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get evolution chain failed:', error);
      res.status(500).json({
        error: 'Failed to get evolution chain',
        message: error.message
      });
    }
  });

  /**
   * 模拟战斗获得经验
   */
  router.post('/growth/battle-exp', async (req, res) => {
    try {
      const { pet, battleResult = 'win' } = req.body;
      
      if (!pet) {
        return res.status(400).json({
          error: 'Missing required field: pet'
        });
      }

      // 根据战斗结果计算经验值
      const expMultiplier = {
        'win': 1.0,
        'draw': 0.7,
        'lose': 0.3
      };
      
      const baseExp = 15 + (pet.level || 1) * 2;
      const expGained = Math.floor(baseExp * (expMultiplier[battleResult] || 0.5));
      
      const result = aiService.addPetExperience(pet, expGained);
      
      // 生成战斗结果描述
      const battleDescription = await aiService.smartInference('battle_result', {
        prompt: `生成战斗结果描述，宠物${pet.name || pet.species}在战斗中${battleResult === 'win' ? '获胜' : battleResult === 'draw' ? '平局' : '失败'}，获得了${expGained}点经验值。`,
        context: { pet, battleResult, expGained }
      }, { forceRealtime: true });
      
      let guidance = null;
      if (result.leveledUp) {
        guidance = aiService.getLevelUpGuidance(pet, result);
      }
      
      res.json({
        success: true,
        result,
        guidance,
        battleDescription: battleDescription.content || `战斗结束！获得了${expGained}点经验值。`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Battle experience calculation failed:', error);
      res.status(500).json({
        error: 'Failed to calculate battle experience',
        message: error.message
      });
    }
  });

  return router;
};