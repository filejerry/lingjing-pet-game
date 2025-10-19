/**
 * MCP (Model Context Protocol) 客户端服务
 * 负责与MCP服务器通信,调用AI推理工具
 */

import type {
  MCPConfig,
  MCPToolRequest,
  MCPToolResponse,
  GenerateStoryParams,
  CalculateEvolutionParams,
  GeneratePetImageParams
} from '@/types/mcp'

export class MCPClient {
  private config: MCPConfig
  private connected: boolean = false

  constructor(config: MCPConfig) {
    this.config = {
      timeout: 30000,
      retryCount: 3,
      ...config
    }
  }

  /**
   * 连接到MCP服务器
   */
  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        this.connected = true
        console.log('✅ MCP客户端连接成功')
      } else {
        throw new Error('MCP服务器健康检查失败')
      }
    } catch (error) {
      console.error('❌ MCP连接失败:', error)
      this.connected = false
      throw error
    }
  }

  /**
   * 调用MCP工具
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResponse> {
    if (!this.connected) {
      console.warn('⚠️  MCP未连接,尝试重连...')
      await this.connect()
    }

    const request: MCPToolRequest = {
      name: toolName,
      arguments: args
    }

    try {
      const response = await this.fetchWithRetry(
        `${this.config.serverUrl}/tools/${toolName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        }
      )

      if (!response.ok) {
        throw new Error(`MCP工具调用失败: ${response.statusText}`)
      }

      const data = await response.json()
      return data as MCPToolResponse
    } catch (error) {
      console.error(`❌ MCP工具 "${toolName}" 调用失败:`, error)
      throw error
    }
  }

  /**
   * 生成剧情文本
   */
  async generateStory(params: GenerateStoryParams): Promise<string> {
    try {
      const response = await this.callTool('generate_story', params)

      if (response.isError) {
        throw new Error('AI生成剧情失败')
      }

      // 提取文本内容
      const textContent = response.content.find(c => c.type === 'text')
      return textContent?.text || ''
    } catch (error) {
      console.error('剧情生成失败,使用降级模板:', error)
      return this.getFallbackStory(params.type)
    }
  }

  /**
   * 计算进化路径
   */
  async calculateEvolution(params: CalculateEvolutionParams): Promise<any> {
    const response = await this.callTool('calculate_evolution', params)

    if (response.isError) {
      throw new Error('进化计算失败')
    }

    const textContent = response.content.find(c => c.type === 'text')
    return textContent?.text ? JSON.parse(textContent.text) : null
  }

  /**
   * 生成宠物图片
   */
  async generatePetImage(params: GeneratePetImageParams): Promise<string | null> {
    try {
      const response = await this.callTool('generate_pet_image', params)

      if (response.isError) {
        return null
      }

      // 提取图片数据 (URL或Base64)
      const imageContent = response.content.find(c => c.type === 'image' || c.type === 'text')
      return imageContent?.data || imageContent?.text || null
    } catch (error) {
      console.error('图片生成失败:', error)
      return null
    }
  }

  /**
   * 带重试的fetch请求
   */
  private async fetchWithRetry(url: string, options: RequestInit, retries = this.config.retryCount!): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeout)
      return response
    } catch (error) {
      if (retries > 0) {
        console.log(`⚠️  请求失败,重试中... (剩余${retries}次)`)
        await this.delay(1000)
        return this.fetchWithRetry(url, options, retries - 1)
      }
      throw error
    }
  }

  /**
   * 降级模板
   */
  private getFallbackStory(type: string): string {
    const templates: Record<string, string> = {
      adventure: '你的宠物在未知的领域开始了一段冒险,前方充满了神秘与未知...',
      daily: '平静的一天,你与宠物度过了愉快的时光,羁绊悄然增长。',
      battle: '战斗的号角已经吹响!你的宠物蓄势待发,准备迎接挑战!',
      evolution: '一股神秘的能量包围着宠物,它的身体开始发生奇妙的变化...'
    }
    return templates[type] || '故事继续展开...'
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.connected = false
    console.log('MCP客户端已断开连接')
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected
  }
}

// 创建单例实例
export const mcpClient = new MCPClient({
  serverUrl: import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001/mcp'
})

// 自动连接
mcpClient.connect().catch(error => {
  console.error('MCP自动连接失败:', error)
})
