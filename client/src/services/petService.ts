/**
 * 宠物相关API服务
 */

import apiClient from './api'
import type { Pet, EvolutionCandidate } from '@/types/pet'

export const petService = {
  /**
   * 获取宠物详情
   */
  getPet(petId: string) {
    return apiClient.get<Pet>(`/pets/${petId}`)
  },

  /**
   * 获取宠物列表
   */
  getPetList() {
    return apiClient.get<Pet[]>('/pets')
  },

  /**
   * 创建宠物
   */
  createPet(template: any) {
    return apiClient.post<Pet>('/pets/create', template)
  },

  /**
   * 宠物进化
   */
  evolve(petId: string, evolutionPath: string) {
    return apiClient.post<Pet>(`/pets/${petId}/evolve`, { evolutionPath })
  },

  /**
   * 获取进化候选
   */
  getEvolutionCandidates(petId: string) {
    return apiClient.get<EvolutionCandidate>(`/pets/${petId}/evolution-candidates`)
  },

  /**
   * 喂食宠物
   */
  feedPet(petId: string, foodId: string) {
    return apiClient.post(`/pets/${petId}/feed`, { foodId })
  },

  /**
   * 与宠物聊天
   */
  chatWithPet(petId: string, message: string) {
    return apiClient.post<{ reply: string }>(`/pets/${petId}/chat`, { message })
  },

  /**
   * 更新宠物属性
   */
  updatePetStats(petId: string, stats: any) {
    return apiClient.patch(`/pets/${petId}/stats`, stats)
  }
}
