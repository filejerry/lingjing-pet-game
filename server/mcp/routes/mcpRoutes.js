/**
 * MCP路由
 */

import express from 'express'
import { generateStoryTool } from '../tools/generateStory.js'
import { calculateEvolutionTool } from '../tools/calculateEvolution.js'
import { generatePetImageTool } from '../tools/generatePetImage.js'
import { analyzeBehaviorTool } from '../tools/analyzeBehavior.js'

const router = express.Router()

// MCP工具映射
const tools = {
  'generate_story': generateStoryTool,
  'calculate_evolution': calculateEvolutionTool,
  'generate_pet_image': generatePetImageTool,
  'analyze_behavior': analyzeBehaviorTool
}

/**
 * 列出所有可用工具
 */
router.get('/tools', (req, res) => {
  const toolList = Object.keys(tools).map(name => ({
    name,
    description: tools[name].description,
    inputSchema: tools[name].inputSchema
  }))

  res.json({
    tools: toolList
  })
})

/**
 * 调用MCP工具
 */
router.post('/tools/:toolName', async (req, res, next) => {
  const { toolName } = req.params
  const { arguments: args } = req.body

  try {
    // 查找工具
    const tool = tools[toolName]
    if (!tool) {
      return res.status(404).json({
        isError: true,
        content: [{
          type: 'text',
          text: `工具 "${toolName}" 不存在`
        }]
      })
    }

    // 执行工具
    const result = await tool.execute(args)

    // 返回MCP标准响应
    res.json({
      content: result,
      isError: false
    })

  } catch (error) {
    next(error)
  }
})

export default router
