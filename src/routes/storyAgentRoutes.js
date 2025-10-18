// storyAgentRoutes.js - 进化叙事Agent API（自检与预览）
const express = require('express');
const StoryAgent = require('../agents/story/StoryAgent');
const EvolutionAgent = require('../agents/pet/EvolutionAgent');

const router = express.Router();
const storyAgent = new StoryAgent();
const evoAgent = new EvolutionAgent();

// GET /api/story-agent/self-check
router.get('/self-check', async (_req, res) => {
  try {
    const report = await storyAgent.selfCheck();
    res.json({ ok: true, report });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'SelfCheckError' });
  }
});

// POST /api/story-agent/preview
// body: { petCoreData, context }，可选自动调用进化Agent取最高候选，作为叙事输入
router.post('/preview', async (req, res) => {
  try {
    const { petCoreData, context } = req.body || {};
    if (!petCoreData?.species) return res.status(400).json({ ok: false, error: 'Missing petCoreData.species' });

    // 自动获取一个进化候选（最高分），实现“随进化的剧情片段”
    const evo = await evoAgent.previewEvolution(petCoreData, context || {});
    const candidate = (evo.candidates && evo.candidates[0]) || null;

    const result = await storyAgent.previewEvolutionStory(petCoreData, context || {}, candidate);
    res.json({ ok: true, evoCandidate: candidate, story: result });
  } catch (err) {
    console.error('StoryAgent preview error:', err);
    res.status(500).json({ ok: false, error: 'InternalServerError' });
  }
});

module.exports = router;