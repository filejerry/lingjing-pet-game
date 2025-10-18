// agentsRoutes.js - Agents自检与协调API
const express = require('express');
const AgentManager = require('../agents/core/AgentManager');
const AgentCoordinator = require('../agents/core/AgentCoordinator');
const EvolutionAgent = require('../agents/pet/EvolutionAgent');

const router = express.Router();

// 初始化管理器与关键Agent
const manager = new AgentManager();
const evolutionAgent = new EvolutionAgent();
manager.register('EvolutionAgent', evolutionAgent);

// GET /api/agents/status - 列表与健康检查
router.get('/status', async (_req, res) => {
  try {
    const list = manager.list();
    const health = await manager.healthCheckAll();
    res.json({ ok: true, agents: list, health });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'StatusError' });
  }
});

// POST /api/agents/coordinate - 简版协调测试
// body: { event: { type: 'evolution' | 'story' | 'battle' | 'generic', payload: {} } }
router.post('/coordinate', async (req, res) => {
  try {
    const { event } = req.body || {};
    const coordinator = new AgentCoordinator(manager);
    const result = await coordinator.coordinate(event || { type: 'generic' });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'CoordinateError' });
  }
});

module.exports = router;