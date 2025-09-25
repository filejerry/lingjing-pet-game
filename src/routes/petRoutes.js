/**
 * 宠物相关API路由
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const EnhancedPetManager = require('../game/EnhancedPetManager');

class PetRoutes {
  constructor(petManager, battleSystem, adventureSystem) {
    this.petManager = petManager;
    this.battleSystem = battleSystem;
    this.adventureSystem = adventureSystem;
    this.setupRoutes();
  }

  setupRoutes() {
    // 创建宠物
    router.post('/create', async (req, res) => {
      try {
        const { userId, petName } = req.body;
        
        if (!userId || !petName) {
          return res.status(400).json({ error: '用户ID和宠物名称不能为空' });
        }

        const pet = await this.petManager.createPet(userId, petName);
        
        res.json({
          success: true,
          message: '宠物创建成功！',
          data: pet
        });
      } catch (error) {
        logger.error('Create pet error:', error);
        res.status(500).json({ error: '创建宠物失败' });
      }
    });

    // 获取宠物详情
    router.get('/:petId', async (req, res) => {
      try {
        const { petId } = req.params;
        const pet = await this.petManager.getPetById(petId);
        
        if (!pet) {
          return res.status(404).json({ error: '宠物不存在' });
        }

        res.json({
          success: true,
          data: pet
        });
      } catch (error) {
        logger.error('Get pet error:', error);
        res.status(500).json({ error: '获取宠物信息失败' });
      }
    });

    // 获取用户的所有宠物
    router.get('/user/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const pets = await this.petManager.getUserPets(userId);
        
        res.json({
          success: true,
          data: pets
        });
      } catch (error) {
        logger.error('Get user pets error:', error);
        res.status(500).json({ error: '获取宠物列表失败' });
      }
    });

    // 执行玩家行为
    router.post('/:petId/action', async (req, res) => {
      try {
        const { petId } = req.params;
        const { actionType, actionTarget } = req.body;
        
        if (!actionType || !actionTarget) {
          return res.status(400).json({ error: '行为类型和目标不能为空' });
        }

        const result = await this.petManager.processPlayerAction(petId, actionType, actionTarget);
        
        res.json({
          success: true,
          message: `${actionType}行为执行成功！`,
          data: result
        });
      } catch (error) {
        logger.error('Process action error:', error);
        res.status(500).json({ error: '执行行为失败' });
      }
    });

    // 手动触发进化检查
    router.post('/:petId/evolve', async (req, res) => {
      try {
        const { petId } = req.params;
        await this.petManager.checkEvolution(petId);
        
        res.json({
          success: true,
          message: '进化检查完成'
        });
      } catch (error) {
        logger.error('Evolution check error:', error);
        res.status(500).json({ error: '进化检查失败' });
      }
    });

    // 发起战斗
    router.post('/:petId/battle/:targetId', async (req, res) => {
      try {
        const { petId, targetId } = req.params;
        const { battleType = 'pve' } = req.body;
        
        const battleResult = await this.battleSystem.initiateBattle(petId, targetId, battleType);
        
        res.json({
          success: true,
          message: '战斗完成！',
          data: battleResult
        });
      } catch (error) {
        logger.error('Battle error:', error);
        res.status(500).json({ error: '战斗失败' });
      }
    });

    // 生成AI对手并战斗
    router.post('/:petId/battle-ai', async (req, res) => {
      try {
        const { petId } = req.params;
        const pet = await this.petManager.getPetById(petId);
        
        if (!pet) {
          return res.status(404).json({ error: '宠物不存在' });
        }

        const petLevel = Math.floor(pet.total_power / 100);
        const aiOpponent = this.battleSystem.generateAIOpponent(petLevel);
        
        // 临时保存AI对手数据用于战斗
        const battleResult = await this.battleSystem.executeBattle(pet, aiOpponent, 'pve');
        
        res.json({
          success: true,
          message: '与AI的战斗完成！',
          data: {
            ...battleResult,
            opponent: aiOpponent
          }
        });
      } catch (error) {
        logger.error('AI battle error:', error);
        res.status(500).json({ error: 'AI战斗失败' });
      }
    });

    // 获取战斗历史
    router.get('/:petId/battles', async (req, res) => {
      try {
        const { petId } = req.params;
        const { limit = 10 } = req.query;
        
        const battles = await this.battleSystem.getBattleHistory(petId, parseInt(limit));
        
        res.json({
          success: true,
          data: battles
        });
      } catch (error) {
        logger.error('Get battle history error:', error);
        res.status(500).json({ error: '获取战斗历史失败' });
      }
    });

    // 开始托管冒险
    router.post('/:petId/adventure/start', async (req, res) => {
      try {
        const { petId } = req.params;
        const { duration = 3600000 } = req.body; // 默认1小时
        
        const adventure = await this.adventureSystem.startAdventure(petId, duration);
        
        res.json({
          success: true,
          message: '冒险开始！宠物已出发探索灵境世界。',
          data: adventure
        });
      } catch (error) {
        logger.error('Start adventure error:', error);
        res.status(500).json({ error: error.message || '开始冒险失败' });
      }
    });

    // 获取冒险状态
    router.get('/:petId/adventure/status', async (req, res) => {
      try {
        const { petId } = req.params;
        const status = await this.adventureSystem.getAdventureStatus(petId);
        
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        logger.error('Get adventure status error:', error);
        res.status(500).json({ error: '获取冒险状态失败' });
      }
    });

    // 完成冒险并获取奖励
    router.post('/:petId/adventure/complete', async (req, res) => {
      try {
        const { petId } = req.params;
        const result = await this.adventureSystem.completeAdventure(petId);
        
        res.json({
          success: true,
          message: result.message,
          data: result
        });
      } catch (error) {
        logger.error('Complete adventure error:', error);
        res.status(500).json({ error: '完成冒险失败' });
      }
    });

    // 宠物重命名
    router.put('/:petId/rename', async (req, res) => {
      try {
        const { petId } = req.params;
        const { newName, userId } = req.body;
        
        if (!newName) {
          return res.status(400).json({ error: '新名称不能为空' });
        }

        const pet = await this.petManager.renamePet(petId, newName, userId);
        
        res.json({
          success: true,
          message: '宠物重命名成功！',
          data: pet
        });
      } catch (error) {
        logger.error('Rename pet error:', error);
        res.status(500).json({ error: '重命名失败' });
      }
    });

    // 删除宠物
    router.delete('/:petId', async (req, res) => {
      try {
        const { petId } = req.params;
        const { userId } = req.body;
        
        await this.petManager.deletePet(petId, userId);
        
        res.json({
          success: true,
          message: '宠物已删除'
        });
      } catch (error) {
        logger.error('Delete pet error:', error);
        res.status(500).json({ error: '删除宠物失败' });
      }
    });
  }

  getRouter() {
    return router;
  }
}

module.exports = PetRoutes;