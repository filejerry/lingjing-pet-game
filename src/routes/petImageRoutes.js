/**
 * 宠物图像生成路由
 * 使用即梦4.0生成宠物外貌图像
 */

const express = require('express');
const logger = require('../utils/logger');

function createPetImageRoutes(database, aiService) {
  const router = express.Router();

  /**
   * 生成单个宠物图像
   * POST /api/pet-images/generate
   */
  router.post('/generate', async (req, res) => {
    try {
      const { pet, options = {} } = req.body;
      
      if (!pet) {
        return res.status(400).json({ 
          error: 'Missing pet data',
          message: '请提供宠物信息' 
        });
      }

      // 检查AI服务是否可用
      const status = aiService.getStatus();
      if (!status.image_service.configured) {
        return res.status(503).json({ 
          error: 'Image service not configured',
          message: '图像生成服务未配置' 
        });
      }

      logger.info(`Generating image for pet: ${pet.name || pet.race}`);
      
      // 生成宠物图像
      const imageResult = await aiService.generatePetImage(pet, options);
      
      // 保存图像记录到数据库（可选）
      if (database && pet.id) {
        try {
          await database.run(`
            INSERT INTO pet_images (
              pet_id, image_url, prompt, style, generated_at
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            pet.id,
            imageResult.imageUrl,
            imageResult.prompt,
            options.style || 'fantasy',
            imageResult.generatedAt
          ]);
        } catch (dbError) {
          logger.warn('Failed to save image record to database:', dbError);
          // 不影响主要功能，继续返回结果
        }
      }

      res.json({
        success: true,
        data: imageResult,
        message: '宠物图像生成成功'
      });

    } catch (error) {
      logger.error('Pet image generation failed:', error);
      res.status(500).json({ 
        error: 'Image generation failed',
        message: error.message || '图像生成失败'
      });
    }
  });

  /**
   * 批量生成宠物图像
   * POST /api/pet-images/batch-generate
   */
  router.post('/batch-generate', async (req, res) => {
    try {
      const { pets, options = {} } = req.body;
      
      if (!pets || !Array.isArray(pets) || pets.length === 0) {
        return res.status(400).json({ 
          error: 'Missing pets data',
          message: '请提供宠物列表' 
        });
      }

      if (pets.length > 10) {
        return res.status(400).json({ 
          error: 'Too many pets',
          message: '单次最多生成10个宠物图像' 
        });
      }

      logger.info(`Batch generating images for ${pets.length} pets`);
      
      // 批量生成图像
      const results = await aiService.batchGeneratePetImages(pets, options);
      
      // 统计成功和失败数量
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;

      res.json({
        success: true,
        data: {
          results: results,
          summary: {
            total: pets.length,
            successful: successful,
            failed: failed
          }
        },
        message: `批量生成完成：成功${successful}个，失败${failed}个`
      });

    } catch (error) {
      logger.error('Batch pet image generation failed:', error);
      res.status(500).json({ 
        error: 'Batch generation failed',
        message: error.message || '批量图像生成失败'
      });
    }
  });

  /**
   * 生成宠物进化对比图
   * POST /api/pet-images/evolution-comparison
   */
  router.post('/evolution-comparison', async (req, res) => {
    try {
      const { beforePet, afterPet, options = {} } = req.body;
      
      if (!beforePet || !afterPet) {
        return res.status(400).json({ 
          error: 'Missing pet data',
          message: '请提供进化前后的宠物信息' 
        });
      }

      logger.info(`Generating evolution comparison: ${beforePet.name || beforePet.race} -> ${afterPet.name || afterPet.race}`);
      
      // 生成进化对比图
      const imageResult = await aiService.generateEvolutionComparisonImage(beforePet, afterPet, options);
      
      res.json({
        success: true,
        data: imageResult,
        message: '进化对比图生成成功'
      });

    } catch (error) {
      logger.error('Evolution comparison image generation failed:', error);
      res.status(500).json({ 
        error: 'Evolution comparison generation failed',
        message: error.message || '进化对比图生成失败'
      });
    }
  });

  /**
   * 获取宠物的历史图像记录
   * GET /api/pet-images/history/:petId
   */
  router.get('/history/:petId', async (req, res) => {
    try {
      const { petId } = req.params;
      
      if (!database) {
        return res.status(503).json({ 
          error: 'Database not available',
          message: '数据库服务不可用' 
        });
      }

      const images = await database.all(`
        SELECT * FROM pet_images 
        WHERE pet_id = ? 
        ORDER BY generated_at DESC
      `, [petId]);

      res.json({
        success: true,
        data: {
          petId: petId,
          images: images,
          count: images.length
        },
        message: '获取图像历史成功'
      });

    } catch (error) {
      logger.error('Failed to get pet image history:', error);
      res.status(500).json({ 
        error: 'Failed to get image history',
        message: error.message || '获取图像历史失败'
      });
    }
  });

  /**
   * 测试图像生成服务状态
   * GET /api/pet-images/status
   */
  router.get('/status', async (req, res) => {
    try {
      const status = aiService.getStatus();
      
      res.json({
        success: true,
        data: {
          image_service: status.image_service,
          cache: status.cache,
          test_available: status.image_service.configured
        },
        message: '图像服务状态获取成功'
      });

    } catch (error) {
      logger.error('Failed to get image service status:', error);
      res.status(500).json({ 
        error: 'Failed to get status',
        message: error.message || '获取服务状态失败'
      });
    }
  });

  /**
   * 测试生成示例宠物图像
   * POST /api/pet-images/test
   */
  router.post('/test', async (req, res) => {
    try {
      // 创建测试宠物数据
      const testPet = {
        name: '测试火龙',
        race: '火龙',
        attribute: '火',
        specialWord: '幼崽',
        rarity: 'sr'
      };

      const options = {
        style: 'fantasy',
        environment: 'natural',
        size: '2K'
      };

      logger.info('Testing image generation with sample pet');
      
      const imageResult = await aiService.generatePetImage(testPet, options);
      
      res.json({
        success: true,
        data: {
          ...imageResult,
          testPet: testPet,
          testOptions: options
        },
        message: '测试图像生成成功'
      });

    } catch (error) {
      logger.error('Test image generation failed:', error);
      res.status(500).json({ 
        error: 'Test generation failed',
        message: error.message || '测试图像生成失败'
      });
    }
  });

  return router;
}

module.exports = createPetImageRoutes;