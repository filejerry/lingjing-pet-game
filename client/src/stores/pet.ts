import { defineStore } from 'pinia'
import type { Pet, PetStats, EvolutionCandidate } from '@/types/pet'
import { petService } from '@/services/petService'

export const usePetStore = defineStore('pet', {
  state: () => ({
    currentPet: null as Pet | null,
    petList: [] as Pet[],
    evolutionCandidates: null as EvolutionCandidate | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    hasPet: (state) => state.currentPet !== null,

    petStats: (state): PetStats | null => {
      return state.currentPet?.stats || null
    },

    canEvolve: (state): boolean => {
      if (!state.currentPet) return false
      return state.currentPet.exp >= 100 && state.currentPet.level >= 10
    },

    rarityColor: (state): string => {
      if (!state.currentPet) return '#9CA3AF'
      const colors = {
        N: '#9CA3AF',
        R: '#3B82F6',
        SR: '#8B5CF6',
        SSR: '#EF4444',
        SSS: 'linear-gradient(90deg, #FF0080, #FF8C00, #FFD700)'
      }
      return colors[state.currentPet.rarity]
    }
  },

  actions: {
    async fetchPet(petId: string) {
      this.loading = true
      this.error = null
      try {
        const response = await petService.getPet(petId)
        this.currentPet = response.data
      } catch (error: any) {
        this.error = error.message || '获取宠物信息失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPetList() {
      this.loading = true
      this.error = null
      try {
        const response = await petService.getPetList()
        this.petList = response.data
      } catch (error: any) {
        this.error = error.message || '获取宠物列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createPet(template: any) {
      this.loading = true
      this.error = null
      try {
        const response = await petService.createPet(template)
        this.currentPet = response.data
        this.petList.push(response.data)
        return response.data
      } catch (error: any) {
        this.error = error.message || '创建宠物失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async evolve(evolutionPath: string) {
      if (!this.currentPet) {
        throw new Error('没有选中的宠物')
      }

      this.loading = true
      this.error = null
      try {
        const response = await petService.evolve(this.currentPet.id, evolutionPath)
        this.currentPet = response.data

        // 更新列表中的宠物
        const index = this.petList.findIndex(p => p.id === this.currentPet!.id)
        if (index !== -1) {
          this.petList[index] = response.data
        }

        return response.data
      } catch (error: any) {
        this.error = error.message || '进化失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getEvolutionCandidates(petId: string) {
      this.loading = true
      this.error = null
      try {
        const response = await petService.getEvolutionCandidates(petId)
        this.evolutionCandidates = response.data
        return response.data
      } catch (error: any) {
        this.error = error.message || '获取进化候选失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    updatePetStats(delta: Partial<PetStats>) {
      if (!this.currentPet) return

      Object.keys(delta).forEach(key => {
        const statKey = key as keyof PetStats
        if (this.currentPet!.stats[statKey] !== undefined) {
          this.currentPet!.stats[statKey] += delta[statKey]!
        }
      })
    },

    updatePetExp(expGain: number) {
      if (!this.currentPet) return

      this.currentPet.exp += expGain

      // 检查升级
      const levelUpExp = this.currentPet.level * 100
      if (this.currentPet.exp >= levelUpExp) {
        this.currentPet.level += 1
        this.currentPet.exp -= levelUpExp
      }
    }
  }
})
