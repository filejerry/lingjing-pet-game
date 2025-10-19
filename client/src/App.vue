<template>
  <div id="app" class="min-h-screen bg-black text-white">
    <!-- 场景氛围层 -->
    <div
      class="scene-aura fixed inset-0 pointer-events-none transition-all duration-1000"
      :style="sceneAuraStyle"
    ></div>

    <!-- 主内容区 -->
    <div class="relative z-10">
      <RouterView />
    </div>

    <!-- 全局Toast通知 -->
    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useStoryStore } from '@/stores/story'
import ToastNotification from '@/components/common/ToastNotification.vue'

const storyStore = useStoryStore()

// 场景氛围渐变样式
const sceneAuraStyle = computed(() => {
  const colors = storyStore.sceneColors
  return {
    background: `repeating-linear-gradient(
      -45deg,
      ${colors[0]},
      ${colors[0]} 20px,
      ${colors[1]} 20px,
      ${colors[1]} 40px
    )`
  }
})
</script>

<style>
@import './styles/base.css';
</style>
