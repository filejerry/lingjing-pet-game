/**
 * 宠物进化系统路由
 */

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { validateId } = require('../middleware/validator');
const { aiLimit } = require('../middleware/rateLimiter');
const { catchAsync, NotFoundError, ValidationError } = require('../middleware/errorHandler');

const { EvolutionTriggerSystem } = require('../game/EvolutionTriggerSystem');
const { EvolutionPathSystem } = require('../game/EvolutionPathSystem');

// 初始化系统(需要在app.js中传入database和aiEngine)
let evolutionTrigger;
let pathSystem;

const initializeSystems = (database, aiEngine) => {
  evolutionTrigger = new EvolutionTriggerSystem(database, aiEngine);
  pathSystem = new EvolutionPathSystem();
};

/**
 * GET /api/evolution/paths/:petId
 * 获取宠物可用的进化路径
 */
router.get('/paths/:petId', authenticate(), catchAsync(async (req, res) => {
  const { petId } = req.params;
  const userId = req.user.userId;

  // 获取宠物
  const pet = await req.app.locals.database.get(
    'SELECT * FROM pets WHERE id = ? AND user_id = ?',
    [petId, userId]
  );

  if (!pet) {
    throw new NotFoundError('宠物');
  }

  // 获取用户进度
  const userProgress = await evolutionTrigger.getUserProgress(userId);

  // 获取可用路径
  const eligibility = await evolutionTrigger.checkEvolutionEligibility(pet, userProgress);

  res.json({
    success: true,
    data: {
      petId: pet.id,
      petName: pet.name || pet.species,
      currentSpecies: pet.species,
      currentRarity: pet.rarity,
      level: pet.level,
      bondLevel: pet.bond_level,
      canEvolve: eligibility.canEvolve,
      nearEvolution: eligibility.nearEvolution,
      readyPaths: eligibility.readyPaths,
      nearReadyPaths: eligibility.nearReadyPaths,
      allPaths: eligibility.allPaths
    }
  });
}));

/**
 * POST /api/evolution/execute
 * 执行进化
 */
router.post('/execute', authenticate(), aiLimit, catchAsync(async (req, res) => {
  const { petId, pathKey, generateStory = true } = req.body;
  const userId = req.user.userId;

  if (!petId || !pathKey) {
    throw new ValidationError('缺少必要参数: petId 和 pathKey');
  }

  // 执行进化
  const result = await evolutionTrigger.executeEvolution(petId, pathKey, userId, {
    generateStory
  });

  res.json({
    success: true,
    message: '进化成功!',
    data: {
      pet: result.evolution.evolvedPet,
      evolutionRecord: result.evolution.evolutionRecord,
      newTraits: result.evolution.newTraits,
      story: result.story,
      isLegendary: result.evolution.isLegendary,
      isUnique: result.evolution.isUnique
    }
  });
}));

/**
 * GET /api/evolution/check/:petId
 * 检查进化资格(触发检查)
 */
router.get('/check/:petId', authenticate(), catchAsync(async (req, res) => {
  const { petId } = req.params;
  const userId = req.user.userId;

  const pet = await req.app.locals.database.get(
    'SELECT * FROM pets WHERE id = ? AND user_id = ?',
    [petId, userId]
  );

  if (!pet) {
    throw new NotFoundError('宠物');
  }

  const userProgress = await evolutionTrigger.getUserProgress(userId);

  const result = await evolutionTrigger.triggerEvolutionCheck(
    pet,
    'manual',
    userProgress
  );

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/evolution/history/:petId
 * 获取宠物进化历史
 */
router.get('/history/:petId', authenticate(), catchAsync(async (req, res) => {
  const { petId } = req.params;
  const { limit = 10 } = req.query;

  const history = await evolutionTrigger.getEvolutionHistory(petId, parseInt(limit));

  res.json({
    success: true,
    data: history
  });
}));

/**
 * GET /api/evolution/tree/:species
 * 获取种族进化树
 */
router.get('/tree/:species', catchAsync(async (req, res) => {
  const { species } = req.params;

  const tree = pathSystem.getEvolutionTree(species);

  if (!tree) {
    throw new NotFoundError('该种族的进化树');
  }

  res.json({
    success: true,
    data: tree
  });
}));

/**
 * GET /api/evolution/statistics
 * 获取全服进化统计
 */
router.get('/statistics', catchAsync(async (req, res) => {
  const stats = await evolutionTrigger.getEvolutionStatistics();
  const systemStats = pathSystem.getStatistics();

  res.json({
    success: true,
    data: {
      ...stats,
      systemStats
    }
  });
}));

module.exports = {
  router,
  initializeSystems
};
