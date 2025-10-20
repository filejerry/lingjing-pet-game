/**
 * V3 API路由 - 适配Vue3前端
 */

const express = require('express')
const router = express.Router()

// 宠物路由
router.get('/pets', async (req, res) => {
  try {
    // TODO: 从数据库查询宠物列表
    res.json([
      {
        id: 'pet_1',
        name: '时灵',
        species: '梦境守护者',
        rarity: 'SR',
        level: 15,
        exp: 750,
        bond: 65,
        stats: {
          hp: 850,
          attack: 120,
          defense: 90,
          speed: 105,
          magic: 140
        },
        traits: ['梦境亲和', '时间感知', '精神链接'],
        personality: '沉静',
        mood: 'content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/pets/:id', async (req, res) => {
  try {
    const { id } = req.params
    // TODO: 从数据库查询
    res.json({
      id,
      name: '时灵',
      species: '梦境守护者',
      rarity: 'SR',
      level: 15,
      exp: 750,
      bond: 65,
      stats: {
        hp: 850,
        attack: 120,
        defense: 90,
        speed: 105,
        magic: 140
      },
      traits: ['梦境亲和', '时间感知', '精神链接'],
      personality: '沉静',
      mood: 'content',
      description: '栖息于梦境边界的神秘生灵,能够感知时间的流动',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/pets/create', async (req, res) => {
  try {
    const { template } = req.body
    // TODO: 创建宠物
    res.json({
      id: `pet_${Date.now()}`,
      name: template.name || '新生宠物',
      species: template.species || '未知',
      rarity: 'N',
      level: 1,
      exp: 0,
      bond: 0,
      stats: {
        hp: 100,
        attack: 10,
        defense: 10,
        speed: 10,
        magic: 10
      },
      traits: [],
      personality: 'curious',
      mood: 'happy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/pets/:id/evolve', async (req, res) => {
  try {
    const { id } = req.params
    const { evolutionPath } = req.body

    // TODO: 执行进化
    res.json({
      id,
      name: '进化后的宠物',
      species: evolutionPath,
      rarity: 'SR',
      level: 10,
      exp: 0,
      bond: 50,
      stats: {
        hp: 500,
        attack: 80,
        defense: 60,
        speed: 70,
        magic: 90
      },
      traits: ['进化特性1', '进化特性2'],
      personality: 'brave',
      mood: 'excited',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/pets/:id/evolution-candidates', async (req, res) => {
  try {
    const { id } = req.params

    // TODO: 计算进化候选
    res.json({
      eligible: true,
      candidates: [
        {
          path: 'warrior',
          name: '战士形态',
          probability: 0.75,
          requirements: ['攻击倾向 ≥ 40%', '等级 ≥ 10'],
          description: '攻击力大幅提升,成为战场主宰'
        },
        {
          path: 'mage',
          name: '法师形态',
          probability: 0.60,
          requirements: ['元素倾向 ≥ 40%', '等级 ≥ 10'],
          description: '元素魔法造诣大增'
        }
      ],
      currentTendency: {
        attack: 0.5,
        defense: 0.2,
        healing: 0.1,
        element: 0.2
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 剧情路由
router.post('/story/next', async (req, res) => {
  try {
    const { type, context } = req.body

    res.json({
      text: '这是一段AI生成的剧情文本...',
      deltas: {
        exp: 10,
        bond: 5
      },
      meta: {
        scene: context.scene || 'forest',
        task: 'explore'
      },
      choices: [
        { id: '1', text: '继续探索', action: 'continue' },
        { id: '2', text: '返回休息', action: 'return' }
      ]
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/adventure/start', async (req, res) => {
  try {
    const { petId, location } = req.body

    res.json({
      text: '你带着宠物踏入了神秘的森林...',
      deltas: {},
      meta: {
        scene: 'forest'
      },
      choices: [
        { id: '1', text: '深入森林', action: 'explore_deep' },
        { id: '2', text: '沿着小径走', action: 'follow_path' }
      ]
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
