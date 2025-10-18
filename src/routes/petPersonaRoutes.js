/**
 * 宠物人格系统路由
 */

const express = require('express');
const router = express.Router();
const PetPersonaSystem = require('../ai/PetPersonaSystem');
const ImageEvolutionSystem = require('../ai/ImageEvolutionSystem');
const EnhancedDatabase = require('../models/EnhancedDatabase');
const logger = require('../utils/logger');

const personaSystem = new PetPersonaSystem();
const imageEvolution = new ImageEvolutionSystem();
const db = new EnhancedDatabase();

// 初始化数据库连接
db.initialize().catch(err => {
  logger.error('Failed to initialize database in persona routes:', err);
});

/**
 * 生成宠物人格档案
 * POST /api/pet-persona/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { petId, interactionHistory = [], userPreferences = {} } = req.body;

    if (!petId) {
      return res.status(400).json({
        success: false,
        error: 'Pet ID is required'
      });
    }

    // 获取宠物信息
    const pet = await db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }

    // 生成人格档案
    const persona = await personaSystem.generatePersona(pet, interactionHistory, userPreferences);

    // 保存到数据库
    const existingPersona = await db.get('SELECT id FROM pet_personas WHERE pet_id = ?', [petId]);
    
    if (existingPersona) {
      await db.run(
        'UPDATE pet_personas SET profile_data = ?, last_updated = CURRENT_TIMESTAMP WHERE pet_id = ?',
        [JSON.stringify(persona), petId]
      );
    } else {
      await db.run(
        'INSERT INTO pet_personas (pet_id, profile_data) VALUES (?, ?)',
        [petId, JSON.stringify(persona)]
      );
    }

    res.json({
      success: true,
      data: {
        petId,
        persona,
        message: '宠物人格档案生成成功'
      }
    });

  } catch (error) {
    logger.error('Error generating pet persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate pet persona',
      details: error.message
    });
  }
});

/**
 * 获取宠物人格档案
 * GET /api/pet-persona/:petId
 */
router.get('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;

    const personaRecord = await db.get('SELECT * FROM pet_personas WHERE pet_id = ?', [petId]);
    
    if (!personaRecord) {
      return res.status(404).json({
        success: false,
        error: 'Pet persona not found'
      });
    }

    const persona = JSON.parse(personaRecord.profile_data);

    res.json({
      success: true,
      data: {
        petId,
        persona,
        createdAt: personaRecord.created_at,
        lastUpdated: personaRecord.last_updated
      }
    });

  } catch (error) {
    logger.error('Error fetching pet persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pet persona',
      details: error.message
    });
  }
});

/**
 * 更新宠物人格档案
 * PUT /api/pet-persona/:petId
 */
router.put('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const { interactionHistory = [], newTraits = {} } = req.body;

    // 获取现有人格档案
    const existingRecord = await db.get('SELECT * FROM pet_personas WHERE pet_id = ?', [petId]);
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Pet persona not found'
      });
    }

    const currentPersona = JSON.parse(existingRecord.profile_data);

    // 更新人格档案
    const updatedPersona = await personaSystem.updatePersona(currentPersona, interactionHistory, newTraits);

    // 保存更新
    await db.run(
      'UPDATE pet_personas SET profile_data = ?, last_updated = CURRENT_TIMESTAMP WHERE pet_id = ?',
      [JSON.stringify(updatedPersona), petId]
    );

    res.json({
      success: true,
      data: {
        petId,
        persona: updatedPersona,
        message: '宠物人格档案更新成功'
      }
    });

  } catch (error) {
    logger.error('Error updating pet persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pet persona',
      details: error.message
    });
  }
});

/**
 * 生成进化图像
 * POST /api/pet-persona/evolution-image
 */
router.post('/evolution-image', async (req, res) => {
  try {
    const { petId, evolutionStage, regenerate = false } = req.body;

    if (!petId) {
      return res.status(400).json({
        success: false,
        error: 'Pet ID is required'
      });
    }

    // 获取宠物信息
    const pet = await db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }

    // 检查是否已过幼年期
    if (pet.level < 5) {
      return res.json({
        success: true,
        data: {
          petId,
          showImage: false,
          message: '宠物仍在幼年期，暂不显示形象',
          darknessPeriod: true
        }
      });
    }

    // 获取人格档案
    const personaRecord = await db.get('SELECT * FROM pet_personas WHERE pet_id = ?', [petId]);
    let persona = null;
    if (personaRecord) {
      persona = JSON.parse(personaRecord.profile_data);
    }

    // 生成进化图像
    const imageResult = await imageEvolution.generateEvolutionImage(pet, evolutionStage, persona);

    // 如果是重新生成，记录消费
    if (regenerate) {
      await db.run(
        'INSERT INTO pet_image_regenerations (pet_id, variation_count, is_paid, cost) VALUES (?, ?, ?, ?)',
        [petId, 1, 0, 0] // 暂时设为免费
      );
    }

    // 保存图像记录
    await db.run(
      'INSERT INTO pet_images (pet_id, image_url, prompt, generation_type) VALUES (?, ?, ?, ?)',
      [petId, imageResult.imageUrl, imageResult.prompt, 'evolution']
    );

    res.json({
      success: true,
      data: {
        petId,
        showImage: true,
        imageUrl: imageResult.imageUrl,
        prompt: imageResult.prompt,
        evolutionStage,
        message: '进化图像生成成功'
      }
    });

  } catch (error) {
    logger.error('Error generating evolution image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate evolution image',
      details: error.message
    });
  }
});

/**
 * 抽卡重新生成图像
 * POST /api/pet-persona/card-draw
 */
router.post('/card-draw', async (req, res) => {
  try {
    const { petId, paymentMethod = 'free' } = req.body;

    if (!petId) {
      return res.status(400).json({
        success: false,
        error: 'Pet ID is required'
      });
    }

    // 检查免费次数
    const freeUsage = await db.get(
      'SELECT COUNT(*) as count FROM pet_image_regenerations WHERE pet_id = ? AND is_paid = 0',
      [petId]
    );

    const freeCount = freeUsage ? freeUsage.count : 0;
    const maxFreeCount = 80;

    if (paymentMethod === 'free' && freeCount >= maxFreeCount) {
      return res.status(400).json({
        success: false,
        error: 'Free regeneration limit exceeded',
        freeUsed: freeCount,
        maxFree: maxFreeCount
      });
    }

    // 获取宠物和人格信息
    const pet = await db.get('SELECT * FROM pets WHERE id = ?', [petId]);
    const personaRecord = await db.get('SELECT * FROM pet_personas WHERE pet_id = ?', [petId]);
    
    let persona = null;
    if (personaRecord) {
      persona = JSON.parse(personaRecord.profile_data);
    }

    // 生成多个变体供选择
    const variations = await imageEvolution.generateCardDrawVariations(pet, persona);

    // 记录消费
    const isPaid = paymentMethod !== 'free';
    const cost = isPaid ? 10 : 0; // 付费抽卡10积分

    await db.run(
      'INSERT INTO pet_image_regenerations (pet_id, variation_count, is_paid, cost) VALUES (?, ?, ?, ?)',
      [petId, variations.length, isPaid ? 1 : 0, cost]
    );

    res.json({
      success: true,
      data: {
        petId,
        variations,
        paymentMethod,
        cost,
        freeUsed: paymentMethod === 'free' ? freeCount + 1 : freeCount,
        maxFree: maxFreeCount,
        message: '抽卡变体生成成功'
      }
    });

  } catch (error) {
    logger.error('Error generating card draw variations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate card draw variations',
      details: error.message
    });
  }
});

/**
 * 获取图像重新生成统计
 * GET /api/pet-persona/regeneration-stats/:petId
 */
router.get('/regeneration-stats/:petId', async (req, res) => {
  try {
    const { petId } = req.params;

    const stats = await db.all(
      'SELECT * FROM pet_image_regenerations WHERE pet_id = ? ORDER BY created_at DESC',
      [petId]
    );

    const freeCount = stats.filter(s => s.is_paid === 0).length;
    const paidCount = stats.filter(s => s.is_paid === 1).length;
    const totalCost = stats.reduce((sum, s) => sum + s.cost, 0);

    res.json({
      success: true,
      data: {
        petId,
        freeUsed: freeCount,
        maxFree: 80,
        paidCount,
        totalCost,
        history: stats
      }
    });

  } catch (error) {
    logger.error('Error fetching regeneration stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regeneration stats',
      details: error.message
    });
  }
});

module.exports = router;