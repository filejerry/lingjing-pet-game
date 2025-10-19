/**
 * MCP Composable
 * 封装MCP客户端调用逻辑
 */

import { ref } from 'vue'
import { mcpClient } from '@/services/mcp'
import type { StoryContext } from '@/types/story'

export function useMCP() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 生成剧情文本
   */
  async function generateStory(context: StoryContext) {
    loading.value = true
    error.value = null

    try {
      const story = await mcpClient.generateStory({
        type: context.type,
        context
      })

      return story
    } catch (err: any) {
      error.value = err.message || '生成剧情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取进化候选
   */
  async function getEvolutionCandidates(petId: string, behaviors: any[]) {
    loading.value = true
    error.value = null

    try {
      const result = await mcpClient.calculateEvolution({
        petId,
        behaviors
      })

      return result
    } catch (err: any) {
      error.value = err.message || '获取进化候选失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成宠物图片
   */
  async function generatePetImage(prompt: string, style: string = 'shanhaijing') {
    loading.value = true
    error.value = null

    try {
      const imageUrl = await mcpClient.generatePetImage({
        prompt,
        style,
        provider: 'vim'
      })

      return imageUrl
    } catch (err: any) {
      error.value = err.message || '生成图片失败'
      // 图片生成失败不抛出错误
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查MCP连接状态
   */
  function isConnected() {
    return mcpClient.isConnected()
  }

  /**
   * 重新连接MCP
   */
  async function reconnect() {
    loading.value = true
    error.value = null

    try {
      await mcpClient.connect()
    } catch (err: any) {
      error.value = err.message || 'MCP连接失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    generateStory,
    getEvolutionCandidates,
    generatePetImage,
    isConnected,
    reconnect
  }
}
