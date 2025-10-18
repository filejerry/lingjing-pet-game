/**
 * 批量推理路由 - 火山引擎DeepSeek模型
 * 支持故事、性格、冒险、进化的批量生成
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

module.exports = (enhancedAIService) => {
  
  /**
   * 批量生成故事内容
   */
  router.post('/stories', async (req, res) => {
    try {
      const { prompts, options = {} } = req.body;
      
      if (!prompts || !Array.isArray(prompts)) {
        return res.status(400).json({
          success: false,
          error: '需要提供故事提示词数组'
        });
      }

      logger.info(`Batch generating ${prompts.length} stories`);
      
      const results = await enhancedAIService.batchGenerateStories(prompts, {
        temperature: options.temperature || 0.8,
        maxTokens: options.maxTokens || 800
      });

      res.json({
        success: true,
        data: results,
        message: `成功生成 ${results.successCount} 个故事，失败 ${results.failureCount} 个`
      });

    } catch (error) {
      logger.error('Batch story generation failed:', error);
      res.status(500).json({
        success: false,
        error: '批量故事生成失败',
        details: error.message
      });
    }
  });

  /**
   * 批量生成宠物性格分析
   */
  router.post('/personalities', async (req, res) => {
    try {
      const { pets, options = {} } = req.body;
      
      if (!pets || !Array.isArray(pets)) {
        return res.status(400).json({
          success: false,
          error: '需要提供宠物数据数组'
        });
      }

      logger.info(`Batch generating personalities for ${pets.length} pets`);
      
      const results = await enhancedAIService.batchGeneratePersonalities(pets, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 600
      });

      res.json({
        success: true,
        data: results,
        message: `成功生成 ${results.successCount} 个性格分析，失败 ${results.failureCount} 个`
      });

    } catch (error) {
      logger.error('Batch personality generation failed:', error);
      res.status(500).json({
        success: false,
        error: '批量性格分析失败',
        details: error.message
      });
    }
  });

  /**
   * 批量生成冒险事件
   */
  router.post('/adventures', async (req, res) => {
    try {
      const { contexts, options = {} } = req.body;
      
      if (!contexts || !Array.isArray(contexts)) {
        return res.status(400).json({
          success: false,
          error: '需要提供冒险上下文数组'
        });
      }

      logger.info(`Batch generating adventures for ${contexts.length} contexts`);
      
      const results = await enhancedAIService.batchGenerateAdventures(contexts, {
        temperature: options.temperature || 0.9,
        maxTokens: options.maxTokens || 1000
      });

      res.json({
        success: true,
        data: results,
        message: `成功生成 ${results.successCount} 个冒险事件，失败 ${results.failureCount} 个`
      });

    } catch (error) {
      logger.error('Batch adventure generation failed:', error);
      res.status(500).json({
        success: false,
        error: '批量冒险事件生成失败',
        details: error.message
      });
    }
  });

  /**
   * 批量生成进化描述
   */
  router.post('/evolutions', async (req, res) => {
    try {
      const { evolutionData, options = {} } = req.body;
      
      if (!evolutionData || !Array.isArray(evolutionData)) {
        return res.status(400).json({
          success: false,
          error: '需要提供进化数据数组'
        });
      }

      logger.info(`Batch generating evolutions for ${evolutionData.length} pets`);
      
      const results = await enhancedAIService.batchService.batchGenerateEvolutions(evolutionData, {
        temperature: options.temperature || 0.8,
        maxTokens: options.maxTokens || 800
      });

      res.json({
        success: true,
        data: results,
        message: `成功生成 ${results.successCount} 个进化描述，失败 ${results.failureCount} 个`
      });

    } catch (error) {
      logger.error('Batch evolution generation failed:', error);
      res.status(500).json({
        success: false,
        error: '批量进化描述生成失败',
        details: error.message
      });
    }
  });

  /**
   * 预生成内容池
   */
  router.post('/pregenerate', async (req, res) => {
    try {
      const { type, count = 50, options = {} } = req.body;
      
      let results;
      
      switch (type) {
        case 'stories':
          results = await enhancedAIService.batchGenerateStories(count, options);
          break;
        case 'adventures':
          const contexts = enhancedAIService.generateAdventureContexts(count);
          results = await enhancedAIService.batchGenerateAdventures(contexts, options);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: '不支持的预生成类型，支持: stories, adventures'
          });
      }

      res.json({
        success: true,
        data: results,
        message: `成功预生成 ${results.successCount} 个${type}内容`
      });

    } catch (error) {
      logger.error('Pregeneration failed:', error);
      res.status(500).json({
        success: false,
        error: '预生成失败',
        details: error.message
      });
    }
  });

  /**
   * 获取内容池状态
   */
  router.get('/pool-status', (req, res) => {
    try {
      const status = enhancedAIService.getEnhancedStatus();
      
      res.json({
        success: true,
        data: {
          contentPool: status.content_pool,
          batchService: status.batch_service,
          models: status.models
        }
      });

    } catch (error) {
      logger.error('Get pool status failed:', error);
      res.status(500).json({
        success: false,
        error: '获取内容池状态失败',
        details: error.message
      });
    }
  });

  /**
   * 清理内容池
   */
  router.post('/clear-pool', async (req, res) => {
    try {
      await enhancedAIService.cleanup();
      
      res.json({
        success: true,
        message: '内容池已清理'
      });

    } catch (error) {
      logger.error('Clear pool failed:', error);
      res.status(500).json({
        success: false,
        error: '清理内容池失败',
        details: error.message
      });
    }
  });

  /**
   * 测试批量推理性能
   */
  router.post('/performance-test', async (req, res) => {
    try {
      const { taskCount = 10, concurrency = 5 } = req.body;
      
      const startTime = Date.now();
      
      // 生成测试提示词
      const testPrompts = [];
      for (let i = 0; i < taskCount; i++) {
        testPrompts.push(`测试故事 ${i + 1}：在神秘的山海世界中，一只灵宠开始了它的冒险...`);
      }
      
      // 执行批量推理
      const results = await enhancedAIService.batchService.batchGenerateStories(testPrompts, {
        temperature: 0.7,
        maxTokens: 400
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      res.json({
        success: true,
        data: {
          taskCount: taskCount,
          successCount: results.successCount,
          failureCount: results.failureCount,
          totalDuration: duration,
          averageTime: duration / taskCount,
          throughput: (taskCount / duration) * 1000 // 每秒任务数
        },
        message: `性能测试完成：${taskCount}个任务，耗时${duration}ms`
      });

    } catch (error) {
      logger.error('Performance test failed:', error);
      res.status(500).json({
        success: false,
        error: '性能测试失败',
        details: error.message
      });
    }
  });

  return router;
};