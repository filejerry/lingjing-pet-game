/**
 * 多宠物系统路由
 * 支持玩家拥有最多5个宠物，升级解锁新宠物
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const MultiPetManager = require('../game/MultiPetManager');
const PetTypematcher = require('../game/PetTypematcher');

function createMultiPetRoutes(database, aiEngine, gameManager) {
  const router = express.Router();
  const multiPetManager = new MultiPetManager(database);
  const petMatcher = new PetTypematcher();

  /**
   * 获取玩家宠物队伍状态
   */
  router.get('/team/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const teamStatus = await multiPetManager.getTeamStatus(userId);
      
      if (!teamStatus) {
        return res.status(500).json({ error: '获取队伍状态失败' });
      }

      res.json({
        success: true,
        team: teamStatus
      });
    } catch (error) {
      logger.error('获取队伍状态失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  /**
   * 检查是否可以获得新宠物
   */
  router.get('/can-get-new/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await multiPetManager.canGetNewPet(userId);
      
      res.json({
        success: true,
        canGet: result.canGet,
        reason: result.reason
      });
    } catch (error) {
      logger.error('检查新宠物权限失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  /**
   * 创建新宠物（多宠物版本）
   */
  router.post('/create-new', async (req, res) => {
    try {
      const { userId, petType, petName } = req.body;

      if (!userId || !petType) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      // 检查是否可以获得新宠物
      const canGet = await multiPetManager.canGetNewPet(userId);
      if (!canGet.canGet) {
        return res.status(403).json({ 
          error: '无法获得新宠物', 
          reason: canGet.reason 
        });
      }

      // 使用智能匹配系统
      const matchResult = petMatcher.matchPetType(petType);
      const petId = uuidv4();
      const finalName = petName || matchResult.suggestedName;

      // 创建宠物
      await database.run(
        `INSERT INTO pets (
          id, user_id, name, base_prompt, hp, attack, defense, speed, magic,
          level, experience, max_experience, is_active, element_type, pet_type, 
          appearance, personality, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          petId,
          userId,
          finalName,
          matchResult.basePrompt,
          matchResult.stats.hp,
          matchResult.stats.attack,
          matchResult.stats.defense,
          matchResult.stats.speed,
          matchResult.stats.magic,
          1, // level
          0, // experience
          100, // max_experience
          0, // is_active (新宠物默认不激活)
          matchResult.element,
          matchResult.type,
          matchResult.appearance,
          matchResult.personality
        ]
      );

      // 获取创建的宠物
      const newPet = await database.get('SELECT * FROM pets WHERE id = ?', [petId]);

      // 记录L1行为
      await database.run(
        `INSERT INTO pet_behaviors (
          id, pet_id, behavior_type, behavior_data, context, 
          weight, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          petId,
          'creation',
          JSON.stringify({ 
            petType, 
            matchedType: matchResult.type,
            matchScore: matchResult.matchScore 
          }),
          JSON.stringify({ 
            userAction: 'create_new_pet',
            isMultiPet: true,
            petCount: (await multiPetManager.getUserPets(userId)).length
          }),
          1.0
        ]
      );

      logger.info(`新宠物创建成功: ${finalName} (${petId}) for user ${userId}`);

      res.json({
        success: true,
        message: `${finalName}加入了你的队伍！`,
        pet: newPet,
        matchInfo: {
          originalInput: petType,
          matchedType: matchResult.type,
          matchScore: matchResult.matchScore,
          keywords: matchResult.keywords
        }
      });

    } catch (error) {
      logger.error('创建新宠物失败:', error);
      res.status(500).json({ error: '创建宠物失败' });
    }
  });

  /**
   * 切换活跃宠物
   */
  router.post('/switch-active', async (req, res) => {
    try {
      const { userId, petId } = req.body;

      if (!userId || !petId) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      const success = await multiPetManager.switchActivePet(userId, petId);
      
      if (success) {
        const activePet = await multiPetManager.getActivePet(userId);
        
        // 记录L1行为
        await database.run(
          `INSERT INTO pet_behaviors (
            id, pet_id, behavior_type, behavior_data, context, 
            weight, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            uuidv4(),
            petId,
            'switch_active',
            JSON.stringify({ newActivePet: petId }),
            JSON.stringify({ userAction: 'switch_active_pet' }),
            0.5
          ]
        );

        res.json({
          success: true,
          message: `${activePet.name}现在是你的主要伙伴`,
          activePet
        });
      } else {
        res.status(500).json({ error: '切换失败' });
      }
    } catch (error) {
      logger.error('切换活跃宠物失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  /**
   * 宠物升级（增加经验）
   */
  router.post('/add-experience', async (req, res) => {
    try {
      const { petId, expAmount } = req.body;

      if (!petId || !expAmount) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      const result = await multiPetManager.addExperience(petId, expAmount);
      
      if (!result) {
        return res.status(500).json({ error: '增加经验失败' });
      }

      let response = {
        success: true,
        pet: result.pet,
        experienceGained: expAmount
      };

      if (result.leveledUp) {
        response.levelUp = {
          oldLevel: result.oldLevel,
          newLevel: result.newLevel,
          message: `${result.pet.name}升级了！等级：${result.oldLevel} → ${result.newLevel}`
        };

        if (result.canUnlockNewPet) {
          response.unlockNewPet = {
            message: `${result.pet.name}达到了${result.newLevel}级！现在可以获得新的伙伴了！`,
            canGetNew: true
          };
        }

        // 记录升级行为
        await database.run(
          `INSERT INTO pet_behaviors (
            id, pet_id, behavior_type, behavior_data, context, 
            weight, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            uuidv4(),
            petId,
            'level_up',
            JSON.stringify({ 
              oldLevel: result.oldLevel, 
              newLevel: result.newLevel,
              canUnlockNewPet: result.canUnlockNewPet
            }),
            JSON.stringify({ 
              userAction: 'level_up',
              experienceGained: expAmount
            }),
            2.0 // 升级是重要事件
          ]
        );
      }

      res.json(response);
    } catch (error) {
      logger.error('增加经验失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  /**
   * 重命名宠物
   */
  router.post('/rename', async (req, res) => {
    try {
      const { petId, newName, userId } = req.body;

      if (!petId || !newName || !userId) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      const success = await multiPetManager.renamePet(petId, newName, userId);
      
      if (success) {
        // 记录L1行为
        await database.run(
          `INSERT INTO pet_behaviors (
            id, pet_id, behavior_type, behavior_data, context, 
            weight, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            uuidv4(),
            petId,
            'rename',
            JSON.stringify({ newName }),
            JSON.stringify({ userAction: 'rename_pet' }),
            0.3
          ]
        );

        res.json({
          success: true,
          message: `宠物已重命名为：${newName}`
        });
      } else {
        res.status(500).json({ error: '重命名失败' });
      }
    } catch (error) {
      logger.error('重命名宠物失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  /**
   * 释放宠物
   */
  router.post('/release', async (req, res) => {
    try {
      const { petId, userId } = req.body;

      if (!petId || !userId) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      const result = await multiPetManager.releasePet(petId, userId);
      
      if (result.success) {
        // 记录L1行为
        await database.run(
          `INSERT INTO pet_behaviors (
            id, pet_id, behavior_type, behavior_data, context, 
            weight, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            uuidv4(),
            petId,
            'release',
            JSON.stringify({ reason: 'user_release' }),
            JSON.stringify({ userAction: 'release_pet' }),
            1.5
          ]
        );

        res.json({
          success: true,
          message: result.reason
        });
      } else {
        res.status(400).json({ 
          error: result.reason 
        });
      }
    } catch (error) {
      logger.error('释放宠物失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  /**
   * 获取宠物详细信息
   */
  router.get('/detail/:petId', async (req, res) => {
    try {
      const { petId } = req.params;
      
      const pet = await database.get('SELECT * FROM pets WHERE id = ?', [petId]);
      
      if (!pet) {
        return res.status(404).json({ error: '宠物不存在' });
      }

      // 计算升级所需经验
      const maxExp = multiPetManager.calculateMaxExperience(pet.level);
      const nextLevelExp = multiPetManager.calculateMaxExperience(pet.level + 1);
      
      res.json({
        success: true,
        pet: {
          ...pet,
          maxExperience: maxExp,
          nextLevelExperience: nextLevelExp,
          experienceProgress: (pet.experience / maxExp * 100).toFixed(1)
        }
      });
    } catch (error) {
      logger.error('获取宠物详情失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  return router;
}

module.exports = createMultiPetRoutes;