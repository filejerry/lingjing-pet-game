<template>
  <div class="min-h-screen p-6">
    <router-link to="/" class="btn-secondary mb-6 inline-block">
      ← 返回首页
    </router-link>

    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">🐉 我的宠物</h1>

      <!-- 宠物列表 -->
      <div v-if="petStore.petList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="pet in petStore.petList"
          :key="pet.id"
          class="card hover:border-white transition-all cursor-pointer"
          @click="selectPet(pet.id)"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-2xl font-bold" :style="{ color: getRarityColor(pet.rarity) }">
                {{ pet.name }}
              </h3>
              <p class="text-sm text-gray-400">{{ pet.species }}</p>
            </div>
            <span class="px-2 py-1 rounded text-xs font-bold" :style="{ backgroundColor: getRarityColor(pet.rarity) }">
              {{ pet.rarity }}
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">等级</span>
              <span>Lv.{{ pet.level }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">经验</span>
              <span>{{ pet.exp }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">羁绊</span>
              <span>{{ pet.bond }}</span>
            </div>
          </div>

          <!-- 属性条 -->
          <div class="mt-4 space-y-1">
            <div class="flex items-center gap-2 text-xs">
              <span class="w-12">HP</span>
              <div class="flex-1 bg-gray-700 rounded h-2">
                <div class="bg-red-500 h-full rounded" :style="{ width: `${(pet.stats.hp / 1000) * 100}%` }"></div>
              </div>
              <span>{{ pet.stats.hp }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="w-12">ATK</span>
              <div class="flex-1 bg-gray-700 rounded h-2">
                <div class="bg-orange-500 h-full rounded" :style="{ width: `${(pet.stats.attack / 500) * 100}%` }"></div>
              </div>
              <span>{{ pet.stats.attack }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="card text-center py-12">
        <p class="text-xl text-gray-400 mb-4">你还没有宠物</p>
        <button class="btn-primary" @click="createFirstPet">
          创建第一只宠物
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePetStore } from '@/stores/pet'
import type { Rarity } from '@/types/pet'

const router = useRouter()
const petStore = usePetStore()

onMounted(async () => {
  try {
    await petStore.fetchPetList()
  } catch (error) {
    console.error('获取宠物列表失败:', error)
  }
})

function getRarityColor(rarity: Rarity): string {
  const colors = {
    N: '#9CA3AF',
    R: '#3B82F6',
    SR: '#8B5CF6',
    SSR: '#EF4444',
    SSS: '#FFD700'
  }
  return colors[rarity]
}

async function selectPet(petId: string) {
  try {
    await petStore.fetchPet(petId)
    router.push('/adventure')
  } catch (error) {
    console.error('选择宠物失败:', error)
  }
}

function createFirstPet() {
  // TODO: 跳转到宠物创建页面
  alert('宠物创建功能待实现')
}
</script>
