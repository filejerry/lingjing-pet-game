/**
 * 新手引导路由
 */

const express = require('express');
const TutorialSystem = require('../story/TutorialSystem');
const ShanHaiJingWorldView = require('../story/ShanHaiJingWorldView');

const router = express.Router();

/**
 * 开始新手引导
 */
router.post('/start', async (req, res) => {
  try {
    const { userId = 'default' } = req.body;
    
    const tutorialSystem = new TutorialSystem(req.db, req.aiService);
    const result = await tutorialSystem.startTutorial(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Start tutorial error:', error);
    res.status(500).json({
      success: false,
      error: '开始引导失败',
      message: error.message
    });
  }
});

/**
 * 推进引导进度
 */
router.post('/progress', async (req, res) => {
  try {
    const { userId = 'default', choice } = req.body;
    
    const tutorialSystem = new TutorialSystem(req.db, req.aiService);
    const result = await tutorialSystem.progressTutorial(userId, choice);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Progress tutorial error:', error);
    res.status(500).json({
      success: false,
      error: '推进引导失败',
      message: error.message
    });
  }
});

/**
 * 获取引导状态
 */
router.get('/status/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || 'default';
    
    const tutorialSystem = new TutorialSystem(req.db, req.aiService);
    const progress = await tutorialSystem.getTutorialProgress(userId);
    const needsTutorial = await tutorialSystem.needsTutorial(userId);
    
    res.json({
      success: true,
      data: {
        progress,
        needsTutorial,
        currentStage: progress?.currentStage || null
      }
    });
  } catch (error) {
    console.error('Get tutorial status error:', error);
    res.status(500).json({
      success: false,
      error: '获取引导状态失败',
      message: error.message
    });
  }
});

/**
 * 获取世界观信息
 */
router.get('/worldview', (req, res) => {
  try {
    const worldView = new ShanHaiJingWorldView();
    
    res.json({
      success: true,
      data: {
        worldTreeLevels: worldView.worldTreeLevels,
        specialMarkers: worldView.specialMarkers,
        creatureGenealogy: worldView.creatureGenealogy
      }
    });
  } catch (error) {
    console.error('Get worldview error:', error);
    res.status(500).json({
      success: false,
      error: '获取世界观信息失败',
      message: error.message
    });
  }
});

/**
 * 应用特殊标记到文本
 */
router.post('/apply-markers', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: '缺少文本参数'
      });
    }
    
    const worldView = new ShanHaiJingWorldView();
    const markedText = worldView.applySpecialMarkers(text);
    
    res.json({
      success: true,
      data: {
        originalText: text,
        markedText
      }
    });
  } catch (error) {
    console.error('Apply markers error:', error);
    res.status(500).json({
      success: false,
      error: '应用标记失败',
      message: error.message
    });
  }
});

module.exports = router;