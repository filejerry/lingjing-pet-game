/**
 * MCP工具: 计算进化路径
 */

import { createLogger } from '../utils/logger.js'
import axios from 'axios'

const logger = createLogger('CalculateEvolution')

export const calculateEvolutionTool = {
  name: 'calculate_evolution',
  description: '根据宠物行为记录计算进化路径和倾向',

  inputSchema: {
    type: 'object',
    properties: {
      petId: {
        type: 'string',
        description: '宠物ID'
      },
      behaviors: {
        type: 'array',
        description: '行为记录数组'
      }
    },
    required: ['petId', 'behaviors']
  },

  async execute(args) {
    const { petId, behaviors } = args

    try {
      logger.info(`计算宠物 ${petId} 的进化路径`)

      // 分析行为倾向
      const tendency = analyzeBehaviorTendency(behaviors)

      // 计算进化候选
      const candidates = calculateEvolutionCandidates(tendency)

      // 判断是否满足进化条件
      const eligible = checkEvolutionEligibility(petId, behaviors)

      const result = {
        eligible,
        candidates,
        currentTendency: tendency,
        timestamp: new Date().toISOString()
      }

      return [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]

    } catch (error) {
      logger.error('进化计算失败:', error)
      throw error
    }
  }
}

/**
 * 分析行为倾向
 */
function analyzeBehaviorTendency(behaviors) {
  const tendency = {
    attack: 0,      // 攻击倾向
    defense: 0,     // 防御倾向
    healing: 0,     // 治愈倾向
    element: 0,     // 元素倾向
    divine: 0,      // 神性倾向
    dark: 0,        // 堕落倾向
    speed: 0,       // 速度倾向
    wisdom: 0       // 智性倾向
  }

  // 如果没有行为记录,返回默认倾向
  if (!behaviors || behaviors.length === 0) {
    return tendency
  }

  // 分析每个行为
  behaviors.forEach(behavior => {
    const { type, value, timestamp } = behavior

    // 时间衰减因子 (越近的行为权重越高)
    const age = Date.now() - new Date(timestamp).getTime()
    const daysPassed = age / (1000 * 60 * 60 * 24)
    const decayFactor = Math.exp(-daysPassed / 30) // 30天半衰期

    // 根据行为类型累加倾向
    switch (type) {
      case 'battle_win':
        tendency.attack += value * decayFactor * 2
        break
      case 'battle_lose':
        tendency.defense += value * decayFactor
        break
      case 'heal':
        tendency.healing += value * decayFactor * 3
        break
      case 'skill_use':
        tendency.element += value * decayFactor
        break
      case 'meditation':
        tendency.wisdom += value * decayFactor * 2
        break
      case 'explore':
        tendency.speed += value * decayFactor
        break
      case 'sacrifice':
        tendency.dark += value * decayFactor * 2
        break
      case 'pray':
        tendency.divine += value * decayFactor * 2
        break
    }
  })

  // 归一化
  const total = Object.values(tendency).reduce((sum, val) => sum + val, 0)
  if (total > 0) {
    Object.keys(tendency).forEach(key => {
      tendency[key] = tendency[key] / total
    })
  }

  return tendency
}

/**
 * 计算进化候选
 */
function calculateEvolutionCandidates(tendency) {
  const candidates = []

  // 定义进化路径规则
  const evolutionPaths = [
    {
      path: 'warrior',
      name: '战士形态',
      description: '攻击力大幅提升,成为战场主宰',
      requiredTendency: { attack: 0.4 },
      requirements: ['攻击倾向 ≥ 40%', '等级 ≥ 10']
    },
    {
      path: 'guardian',
      name: '守护者形态',
      description: '防御力极大增强,保护队友',
      requiredTendency: { defense: 0.4 },
      requirements: ['防御倾向 ≥ 40%', '等级 ≥ 10']
    },
    {
      path: 'healer',
      name: '治愈者形态',
      description: '获得强大治愈能力',
      requiredTendency: { healing: 0.5 },
      requirements: ['治愈倾向 ≥ 50%', '等级 ≥ 10']
    },
    {
      path: 'mage',
      name: '法师形态',
      description: '元素魔法造诣大增',
      requiredTendency: { element: 0.4 },
      requirements: ['元素倾向 ≥ 40%', '等级 ≥ 10']
    },
    {
      path: 'sage',
      name: '贤者形态',
      description: '智慧与魔力融合',
      requiredTendency: { wisdom: 0.5 },
      requirements: ['智性倾向 ≥ 50%', '等级 ≥ 12']
    },
    {
      path: 'assassin',
      name: '刺客形态',
      description: '速度与暴击的完美结合',
      requiredTendency: { speed: 0.4, attack: 0.2 },
      requirements: ['速度倾向 ≥ 40%', '攻击倾向 ≥ 20%']
    },
    {
      path: 'divine_beast',
      name: '神兽形态',
      description: '获得神性祝福,稀有度提升',
      requiredTendency: { divine: 0.6 },
      requirements: ['神性倾向 ≥ 60%', '羁绊 ≥ 80']
    },
    {
      path: 'shadow_beast',
      name: '暗影兽形态',
      description: '堕入黑暗,获得禁忌力量',
      requiredTendency: { dark: 0.6 },
      requirements: ['堕落倾向 ≥ 60%', '特殊事件触发']
    }
  ]

  // 计算每个路径的匹配度
  evolutionPaths.forEach(path => {
    let probability = 0
    let matchCount = 0

    // 检查倾向是否满足
    Object.keys(path.requiredTendency).forEach(tendencyKey => {
      const required = path.requiredTendency[tendencyKey]
      const actual = tendency[tendencyKey] || 0

      if (actual >= required) {
        matchCount++
        probability += actual
      }
    })

    // 只有满足条件的路径才加入候选
    if (matchCount === Object.keys(path.requiredTendency).length) {
      candidates.push({
        path: path.path,
        name: path.name,
        description: path.description,
        probability: Math.min(probability / Object.keys(path.requiredTendency).length, 1),
        requirements: path.requirements
      })
    }
  })

  // 按概率排序
  candidates.sort((a, b) => b.probability - a.probability)

  // 最多返回3个候选
  return candidates.slice(0, 3)
}

/**
 * 检查进化资格
 */
function checkEvolutionEligibility(petId, behaviors) {
  // TODO: 从数据库查询宠物信息
  // 这里简化处理,假设满足条件

  // 检查条件:
  // 1. 等级 >= 10
  // 2. 经验 >= 100
  // 3. 至少有10条行为记录

  const hasEnoughBehaviors = behaviors && behaviors.length >= 10

  return hasEnoughBehaviors
}
