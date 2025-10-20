/**
 * MCP工具: 生成宠物图片
 */

import axios from 'axios'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('GeneratePetImage')

export const generatePetImageTool = {
  name: 'generate_pet_image',
  description: '使用AI生成宠物形象图片',

  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: '图片生成提示词'
      },
      style: {
        type: 'string',
        enum: ['shanhaijing', 'anime', 'realistic'],
        description: '图片风格',
        default: 'shanhaijing'
      },
      provider: {
        type: 'string',
        enum: ['vim', 'dalle', 'sd'],
        description: 'AI图片生成服务提供商',
        default: 'vim'
      }
    },
    required: ['prompt']
  },

  async execute(args) {
    const { prompt, style = 'shanhaijing', provider = 'vim' } = args

    try {
      logger.info(`生成图片: ${prompt}, 风格: ${style}, 提供商: ${provider}`)

      // 构建完整提示词
      const fullPrompt = buildImagePrompt(prompt, style)

      // 调用图片生成服务
      const imageUrl = await generateImage(fullPrompt, provider)

      if (imageUrl) {
        return [{
          type: 'image',
          data: imageUrl,
          mimeType: 'image/png'
        }]
      } else {
        // 如果生成失败,返回占位符
        return [{
          type: 'text',
          text: '图片生成服务暂时不可用'
        }]
      }

    } catch (error) {
      logger.error('图片生成失败:', error)

      // 返回错误信息但不抛出异常
      return [{
        type: 'text',
        text: `图片生成失败: ${error.message}`
      }]
    }
  }
}

/**
 * 构建图片提示词
 */
function buildImagePrompt(basePrompt, style) {
  const stylePrompts = {
    shanhaijing: '山海经风格,中国古典神话美学,水墨渲染,神秘奇幻,high quality,detailed',
    anime: '动漫风格,二次元,可爱,精致,vibrant colors,detailed',
    realistic: '写实风格,3D渲染,高清,photorealistic,detailed textures'
  }

  const styleModifier = stylePrompts[style] || stylePrompts.shanhaijing

  // 添加负面提示词
  const negativePrompt = 'modern objects, low quality, blurry, watermark, text'

  return `${basePrompt}, ${styleModifier}. Negative: ${negativePrompt}`
}

/**
 * 调用图片生成服务
 */
async function generateImage(prompt, provider) {
  switch (provider) {
    case 'vim':
      return await generateWithVim(prompt)
    case 'dalle':
      return await generateWithDALLE(prompt)
    case 'sd':
      return await generateWithStableDiffusion(prompt)
    default:
      throw new Error(`未知的图片生成提供商: ${provider}`)
  }
}

/**
 * 即梦4.0图片生成
 */
async function generateWithVim(prompt) {
  const VIM_API_URL = process.env.VIM_API_URL || ''
  const VIM_API_KEY = process.env.VIM_API_KEY || ''

  if (!VIM_API_KEY) {
    logger.warn('即梦API未配置')
    return null
  }

  try {
    const response = await axios.post(VIM_API_URL, {
      model: 'vim-image-4.0',
      prompt: prompt,
      size: '1024x1024',
      quality: 'hd',
      n: 1
    }, {
      headers: {
        'Authorization': `Bearer ${VIM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 图片生成可能需要更长时间
    })

    // 返回图片URL
    return response.data.data[0].url

  } catch (error) {
    logger.error('即梦图片生成失败:', error.message)
    return null
  }
}

/**
 * DALL-E图片生成
 */
async function generateWithDALLE(prompt) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

  if (!OPENAI_API_KEY) {
    logger.warn('OpenAI API未配置')
    return null
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      quality: 'hd',
      n: 1
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    })

    return response.data.data[0].url

  } catch (error) {
    logger.error('DALL-E图片生成失败:', error.message)
    return null
  }
}

/**
 * Stable Diffusion图片生成
 */
async function generateWithStableDiffusion(prompt) {
  const SD_API_URL = process.env.SD_API_URL || 'http://localhost:7860'

  try {
    const response = await axios.post(`${SD_API_URL}/sdapi/v1/txt2img`, {
      prompt: prompt,
      steps: 30,
      width: 512,
      height: 512,
      cfg_scale: 7,
      sampler_name: 'DPM++ 2M Karras'
    }, {
      timeout: 60000
    })

    // SD返回base64图片
    const base64Image = response.data.images[0]
    return `data:image/png;base64,${base64Image}`

  } catch (error) {
    logger.error('Stable Diffusion图片生成失败:', error.message)
    return null
  }
}
