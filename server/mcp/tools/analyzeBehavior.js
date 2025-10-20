/**
 * MCP工具: 分析宠物行为
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('AnalyzeBehavior')

export const analyzeBehaviorTool = {
  name: 'analyze_behavior',
  description: '分析宠物行为模式,提供养成建议',

  inputSchema: {
    type: 'object',
    properties: {
      petId: {
        type: 'string',
        description: '宠物ID'
      },
      behaviors: {
        type: 'array',
        description: '行为记录'
      },
      timeRange: {
        type: 'number',
        description: '分析时间范围(天)',
        default: 30
      }
    },
    required: ['petId', 'behaviors']
  },

  async execute(args) {
    const { petId, behaviors, timeRange = 30 } = args

    try {
      logger.info(`分析宠物 ${petId} 最近${timeRange}天的行为`)

      // 过滤时间范围内的行为
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      const recentBehaviors = behaviors.filter(b =>
        new Date(b.timestamp) >= cutoffDate
      )

      // 统计行为类型
      const behaviorStats = analyzeBehaviorStatistics(recentBehaviors)

      // 生成建议
      const suggestions = generateSuggestions(behaviorStats)

      // 预测进化倾向
      const evolutionTrend = predictEvolutionTrend(behaviorStats)

      const result = {
        petId,
        timeRange,
        totalBehaviors: recentBehaviors.length,
        statistics: behaviorStats,
        suggestions,
        evolutionTrend,
        analyzedAt: new Date().toISOString()
      }

      return [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]

    } catch (error) {
      logger.error('行为分析失败:', error)
      throw error
    }
  }
}

/**
 * 统计行为类型
 */
function analyzeBehaviorStatistics(behaviors) {
  const stats = {
    battle: 0,
    exploration: 0,
    training: 0,
    rest: 0,
    social: 0,
    feeding: 0,
    other: 0
  }

  const detailedStats = {}

  behaviors.forEach(behavior => {
    const { type } = behavior

    // 分类统计
    if (type.includes('battle')) {
      stats.battle++
    } else if (type.includes('explore')) {
      stats.exploration++
    } else if (type.includes('train')) {
      stats.training++
    } else if (type.includes('rest') || type.includes('sleep')) {
      stats.rest++
    } else if (type.includes('chat') || type.includes('play')) {
      stats.social++
    } else if (type.includes('feed')) {
      stats.feeding++
    } else {
      stats.other++
    }

    // 详细统计
    detailedStats[type] = (detailedStats[type] || 0) + 1
  })

  return {
    summary: stats,
    detailed: detailedStats
  }
}

/**
 * 生成养成建议
 */
function generateSuggestions(stats) {
  const suggestions = []
  const total = Object.values(stats.summary).reduce((sum, val) => sum + val, 0)

  if (total === 0) {
    return ['开始与宠物互动吧!']
  }

  // 计算各类行为占比
  const battleRatio = stats.summary.battle / total
  const explorationRatio = stats.summary.exploration / total
  const trainingRatio = stats.summary.training / total
  const restRatio = stats.summary.rest / total
  const socialRatio = stats.summary.social / total

  // 战斗过多
  if (battleRatio > 0.5) {
    suggestions.push('⚠️ 战斗频率过高,建议增加休息和社交互动,避免宠物疲劳')
  }

  // 缺乏训练
  if (trainingRatio < 0.1) {
    suggestions.push('💪 训练不足,定期训练可以提升宠物属性和技能熟练度')
  }

  // 缺乏探索
  if (explorationRatio < 0.1) {
    suggestions.push('🗺️ 可以多带宠物探索,发现新区域和稀有资源')
  }

  // 休息不足
  if (restRatio < 0.1) {
    suggestions.push('😴 注意让宠物适当休息,充足休息有助于经验吸收')
  }

  // 社交互动少
  if (socialRatio < 0.15) {
    suggestions.push('💖 增加与宠物的互动,可以提升羁绊值')
  }

  // 均衡发展
  if (suggestions.length === 0) {
    suggestions.push('✨ 养成很均衡!继续保持这样的节奏')
  }

  return suggestions
}

/**
 * 预测进化倾向
 */
function predictEvolutionTrend(stats) {
  const total = Object.values(stats.summary).reduce((sum, val) => sum + val, 0)

  if (total < 10) {
    return {
      trend: 'unknown',
      confidence: 0,
      description: '行为记录不足,无法预测'
    }
  }

  const battleRatio = stats.summary.battle / total
  const explorationRatio = stats.summary.exploration / total
  const trainingRatio = stats.summary.training / total
  const socialRatio = stats.summary.social / total

  // 判断倾向
  let trend = 'balanced'
  let confidence = 0
  let description = ''

  if (battleRatio > 0.4) {
    trend = 'warrior'
    confidence = battleRatio
    description = '战士型发展,攻击力将大幅提升'
  } else if (explorationRatio > 0.4) {
    trend = 'explorer'
    confidence = explorationRatio
    description = '探险者型发展,速度和感知将增强'
  } else if (trainingRatio > 0.4) {
    trend = 'specialist'
    confidence = trainingRatio
    description = '专精型发展,技能威力将提升'
  } else if (socialRatio > 0.4) {
    trend = 'companion'
    confidence = socialRatio
    description = '伙伴型发展,羁绊和辅助能力增强'
  } else {
    trend = 'balanced'
    confidence = 0.5
    description = '均衡型发展,全面成长'
  }

  return {
    trend,
    confidence: Math.round(confidence * 100),
    description
  }
}
