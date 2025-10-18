/**
 * 推理路由测试接口
 * 用于测试和验证智能推理路由功能
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

module.exports = (aiService) => {
  /**
   * 测试智能路由 - 自动选择推理方式
   */
  router.post('/smart-inference', async (req, res) => {
    try {
      const { scenario, data, options = {} } = req.body;
      
      if (!scenario || !data) {
        return res.status(400).json({
          error: 'Missing required fields: scenario, data'
        });
      }

      const result = await aiService.smartInference(scenario, data, options);
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Smart inference test failed:', error);
      res.status(500).json({
        error: 'Smart inference failed',
        message: error.message
      });
    }
  });

  /**
   * 获取路由建议
   */
  router.post('/route-recommendation', async (req, res) => {
    try {
      const { scenario, data, options = {} } = req.body;
      
      if (!scenario || !data) {
        return res.status(400).json({
          error: 'Missing required fields: scenario, data'
        });
      }

      const recommendation = aiService.getRecommendedRoute(scenario, data, options);
      
      res.json({
        success: true,
        recommendation,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Route recommendation failed:', error);
      res.status(500).json({
        error: 'Route recommendation failed',
        message: error.message
      });
    }
  });

  /**
   * 获取路由统计信息
   */
  router.get('/routing-stats', async (req, res) => {
    try {
      const stats = aiService.getRoutingStats();
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get routing stats failed:', error);
      res.status(500).json({
        error: 'Get routing stats failed',
        message: error.message
      });
    }
  });

  /**
   * 测试即时推理场景
   */
  router.post('/test-realtime', async (req, res) => {
    try {
      const testScenarios = [
        {
          scenario: 'player_chat',
          data: {
            prompt: "我的宠物今天心情怎么样？",
            context: { time: new Date().toISOString() },
            petData: { name: "小火龙", species: "火龙", mood: "开心" }
          }
        },
        {
          scenario: 'pet_status_check',
          data: {
            prompt: "检查宠物当前状态",
            petData: { name: "小火龙", level: 15, health: 85, energy: 70 }
          }
        },
        {
          scenario: 'tutorial_guidance',
          data: {
            prompt: "新手玩家需要进化指导",
            context: { playerLevel: 1, currentStep: "evolution" }
          }
        }
      ];

      const results = [];
      for (const test of testScenarios) {
        try {
          const result = await aiService.smartInference(
            test.scenario, 
            test.data, 
            { forceRealtime: true }
          );
          results.push({
            scenario: test.scenario,
            success: true,
            result: result,
            responseTime: result.routeInfo?.responseTime
          });
        } catch (error) {
          results.push({
            scenario: test.scenario,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        testType: 'realtime',
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Realtime inference test failed:', error);
      res.status(500).json({
        error: 'Realtime inference test failed',
        message: error.message
      });
    }
  });

  /**
   * 测试批量推理场景
   */
  router.post('/test-batch', async (req, res) => {
    try {
      const testScenarios = [
        {
          scenario: 'story_pool_refill',
          data: {
            prompts: [
              "生成一个关于火龙冒险的故事",
              "生成一个关于水龙探索的故事",
              "生成一个关于风龙飞行的故事"
            ],
            type: 'stories',
            batchSize: 3
          }
        },
        {
          scenario: 'personality_templates',
          data: {
            prompts: [
              "生成勇敢型宠物性格模板",
              "生成温和型宠物性格模板",
              "生成调皮型宠物性格模板"
            ],
            type: 'personalities',
            batchSize: 3
          }
        }
      ];

      const results = [];
      for (const test of testScenarios) {
        try {
          const result = await aiService.smartInference(
            test.scenario, 
            test.data, 
            { forceBatch: true }
          );
          results.push({
            scenario: test.scenario,
            success: true,
            result: result,
            responseTime: result.routeInfo?.responseTime
          });
        } catch (error) {
          results.push({
            scenario: test.scenario,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        testType: 'batch',
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Batch inference test failed:', error);
      res.status(500).json({
        error: 'Batch inference test failed',
        message: error.message
      });
    }
  });

  /**
   * 测试图像推理场景
   */
  router.post('/test-image', async (req, res) => {
    try {
      const testScenarios = [
        {
          scenario: 'pet_avatar_request',
          data: {
            type: 'pet_image',
            petData: {
              name: "小火龙",
              species: "火龙",
              attribute: "火",
              rarity: "SR",
              special: "烈焰"
            }
          }
        },
        {
          scenario: 'shanhaijing_landscapes',
          data: {
            type: 'scene_image',
            sceneDescription: "昆仑山巅，云雾缭绕，神兽栖息的仙境"
          }
        }
      ];

      const results = [];
      for (const test of testScenarios) {
        try {
          const result = await aiService.smartInference(
            test.scenario, 
            test.data, 
            { forceImage: true }
          );
          results.push({
            scenario: test.scenario,
            success: true,
            result: result,
            responseTime: result.routeInfo?.responseTime
          });
        } catch (error) {
          results.push({
            scenario: test.scenario,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        testType: 'image',
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Image inference test failed:', error);
      res.status(500).json({
        error: 'Image inference test failed',
        message: error.message
      });
    }
  });

  /**
   * 性能压力测试
   */
  router.post('/performance-test', async (req, res) => {
    try {
      const { concurrency = 10, iterations = 5 } = req.body;
      
      const testPromises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < concurrency; i++) {
        for (let j = 0; j < iterations; j++) {
          testPromises.push(
            aiService.smartInference('player_chat', {
              prompt: `测试消息 ${i}-${j}`,
              context: { testId: `${i}-${j}` },
              petData: { name: `测试宠物${i}`, level: j + 1 }
            })
          );
        }
      }
      
      const results = await Promise.allSettled(testPromises);
      const endTime = Date.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;
      const avgTime = totalTime / results.length;
      
      res.json({
        success: true,
        performanceTest: {
          concurrency,
          iterations,
          totalRequests: results.length,
          successful,
          failed,
          totalTime,
          averageTime: avgTime,
          requestsPerSecond: (results.length / totalTime) * 1000
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Performance test failed:', error);
      res.status(500).json({
        error: 'Performance test failed',
        message: error.message
      });
    }
  });

  return router;
};