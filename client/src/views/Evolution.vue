<template>
  <div class="min-h-screen p-6">
    <router-link to="/" class="btn-secondary mb-6 inline-block">
      ← 返回首页
    </router-link>

    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">✨ 进化系统</h1>

      <div v-if="petStore.currentPet" class="space-y-6">
        <!-- 当前宠物信息 -->
        <div class="card">
          <h2 class="text-2xl font-bold mb-4">当前宠物</h2>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <p class="text-xl">{{ petStore.currentPet.name }}</p>
              <p class="text-gray-400">{{ petStore.currentPet.species }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-400">等级 {{ petStore.currentPet.level }}</p>
              <p class="text-sm text-gray-400">经验 {{ petStore.currentPet.exp }}/100</p>
            </div>
          </div>
        </div>

        <!-- 进化候选 -->
        <div class="card">
          <h2 class="text-2xl font-bold mb-4">进化候选</h2>

          <button
            v-if="!evolutionCandidates"
            @click="loadEvolutionCandidates"
            class="btn-primary"
            :disabled="loading"
          >
            {{ loading ? '分析中...' : '分析进化路径' }}
          </button>

          <div v-else-if="evolutionCandidates.eligible" class="space-y-4">
            <div
              v-for="candidate in evolutionCandidates.candidates"
              :key="candidate.path"
              class="border border-gray-700 rounded p-4 hover:border-white transition-all cursor-pointer"
              @click="selectEvolutionPath(candidate.path)"
            >
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">{{ candidate.name }}</h3>
                <span class="text-sm text-gray-400">{{ (candidate.probability * 100).toFixed(1) }}%</span>
              </div>
              <p class="text-gray-400 text-sm mb-2">{{ candidate.description }}</p>
              <div class="flex gap-2 flex-wrap">
                <span
                  v-for="req in candidate.requirements"
                  :key="req"
                  class="text-xs px-2 py-1 bg-gray-800 rounded"
                >
                  {{ req }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-400">
            <p>当前条件不满足进化要求</p>
            <p class="text-sm mt-2">需要: 等级≥10, 经验≥100</p>
          </div>
        </div>
      </div>

      <!-- 无宠物状态 -->
      <div v-else class="card text-center py-12">
        <p class="text-xl text-gray-400">请先选择一只宠物</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePetStore } from '@/stores/pet'
import { useMCP } from '@/composables/useMCP'
import type { EvolutionCandidate } from '@/types/pet'

const petStore = usePetStore()
const { getEvolutionCandidates: mcpGetEvolution } = useMCP()
const loading = ref(false)
const evolutionCandidates = ref<EvolutionCandidate | null>(null)

async function loadEvolutionCandidates() {
  if (!petStore.currentPet) return

  loading.value = true
  try {
    evolutionCandidates.value = await mcpGetEvolution(
      petStore.currentPet.id,
      [] // TODO: 传入实际行为记录
    )
  } catch (error) {
    console.error('加载进化候选失败:', error)
  } finally {
    loading.value = false
  }
}

async function selectEvolutionPath(path: string) {
  if (!confirm(`确定要进化为 ${path} 吗?`)) return

  loading.value = true
  try {
    await petStore.evolve(path)
    alert('进化成功!')
    evolutionCandidates.value = null
  } catch (error) {
    console.error('进化失败:', error)
    alert('进化失败,请重试')
  } finally {
    loading.value = false
  }
}
</script>
