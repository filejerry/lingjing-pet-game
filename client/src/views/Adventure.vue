<template>
  <div class="min-h-screen p-6">
    <!-- 返回按钮 -->
    <router-link to="/" class="btn-secondary mb-6 inline-block">
      ← 返回首页
    </router-link>

    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">⚔️ 冒险模式</h1>

      <!-- 剧情显示区 -->
      <div class="card mb-6 min-h-[400px]">
        <div
          id="storyContent"
          class="space-y-4 max-h-[500px] overflow-y-auto p-4"
        >
          <div
            v-for="(line, index) in storyStore.storyLines"
            :key="index"
            class="animate-slide-up"
            :class="line.cssClass"
          >
            <p class="text-lg leading-relaxed">{{ line.text }}</p>
          </div>

          <div v-if="loading" class="text-center text-gray-400">
            <div class="animate-pulse-slow">生成中...</div>
          </div>
        </div>
      </div>

      <!-- 选择按钮区 -->
      <div v-if="storyStore.currentChoices.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="choice in storyStore.currentChoices"
          :key="choice.id"
          @click="makeChoice(choice)"
          class="btn-primary text-left p-4"
        >
          {{ choice.text }}
        </button>
      </div>

      <!-- 快捷操作 -->
      <div v-else class="flex gap-4">
        <button
          @click="startAdventure"
          class="btn-primary"
          :disabled="loading"
        >
          {{ loading ? '生成中...' : '开始新冒险' }}
        </button>
        <button
          @click="clearStory"
          class="btn-secondary"
        >
          清空剧情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStoryStore } from '@/stores/story'
import { usePetStore } from '@/stores/pet'
import { useMCP } from '@/composables/useMCP'
import { storyService } from '@/services/storyService'
import type { StoryChoice } from '@/types/story'

const storyStore = useStoryStore()
const petStore = usePetStore()
const { generateStory } = useMCP()
const loading = ref(false)

onMounted(() => {
  if (!petStore.currentPet) {
    storyStore.addStoryLine('欢迎来到灵境斗宠录!', 'text-xl font-bold')
    storyStore.addStoryLine('请先创建一只宠物开始你的冒险。', 'text-gray-400')
  }
})

async function startAdventure() {
  if (!petStore.currentPet) {
    alert('请先创建宠物')
    return
  }

  loading.value = true
  storyStore.setScene('forest')

  try {
    // 使用MCP生成剧情
    const story = await generateStory({
      type: 'adventure',
      petId: petStore.currentPet.id,
      scene: 'forest',
      action: 'explore'
    })

    storyStore.addStoryLine(story)

    // 模拟选择
    storyStore.setChoices([
      { id: '1', text: '深入森林探索', action: 'explore_deep' },
      { id: '2', text: '返回营地休息', action: 'return_camp' }
    ])
  } catch (error) {
    console.error('冒险开始失败:', error)
    storyStore.addStoryLine('冒险生成失败,请重试。', 'text-red-500')
  } finally {
    loading.value = false
  }
}

async function makeChoice(choice: StoryChoice) {
  loading.value = true
  storyStore.clearChoices()

  try {
    const story = await generateStory({
      type: 'adventure',
      petId: petStore.currentPet!.id,
      action: choice.action
    })

    storyStore.addStoryLine(`你选择了: ${choice.text}`, 'text-yellow-400 font-bold')
    storyStore.addStoryLine(story)
  } catch (error) {
    console.error('选择处理失败:', error)
  } finally {
    loading.value = false
  }
}

function clearStory() {
  storyStore.clearStoryLines()
  storyStore.clearChoices()
}
</script>
