// evolutionRoutes.js - 进化预览API
const express = require('express');
const EvolutionAgent = require('../agents/pet/EvolutionAgent');
const router = express.Router();

const evoAgent = new EvolutionAgent();

// POST /api/evolution/preview
// body: { petCoreData: { species, rarity, level, baseStats, specialTraits }, context: { environment, playerBond } }
router.post('/preview', async (req, res) => {
  try {
    const { petCoreData, context } = req.body || {};
    if (!petCoreData || !petCoreData.species) {
      return res.status(400).json({ ok: false, error: 'Missing petCoreData.species' });
    }
    const result = await evoAgent.previewEvolution(petCoreData, context || {});
    return res.json(result);
  } catch (err) {
    console.error('Evolution preview error:', err);
    return res.status(500).json({ ok: false, error: 'InternalServerError' });
  }
});

// GET /api/evolution/self-check
router.get('/self-check', async (_req, res) => {
  try {
    const report = await evoAgent.selfCheck();
    res.json({ ok: true, report });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'SelfCheckError' });
  }
});

module.exports = router;