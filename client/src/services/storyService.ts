/**
 * 剧情相关API服务
 */

import apiClient from './api'
import type { StoryResponse, StoryContext } from '@/types/story'

export const storyService = {
  /**
   * 获取下一段剧情
   */
  getNextStory(context: StoryContext) {
    return apiClient.post<StoryResponse>('/story/next', context)
  },

  /**
   * 开始冒险
   */
  startAdventure(petId: string, location?: string) {
    return apiClient.post<StoryResponse>('/adventure/start', {
      petId,
      location
    })
  },

  /**
   * 日常互动
   */
  dailyInteraction(petId: string, action: string) {
    return apiClient.post<StoryResponse>('/daily/interact', {
      petId,
      action
    })
  },

  /**
   * 触发战斗
   */
  triggerBattle(petId: string, opponentId?: string) {
    return apiClient.post<StoryResponse>('/battle/trigger', {
      petId,
      opponentId
    })
  },

  /**
   * 执行选择
   */
  makeChoice(choiceId: string, context: any) {
    return apiClient.post<StoryResponse>('/story/choice', {
      choiceId,
      context
    })
  }
}
