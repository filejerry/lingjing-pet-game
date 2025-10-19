<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <!-- Logo -->
    <div class="text-center mb-12 animate-fade-in">
      <h1 class="text-6xl font-bold mb-4">🐾 灵境斗宠录</h1>
      <p class="text-xl text-gray-400">AI驱动的文字宠物养成游戏</p>
      <p class="text-sm text-gray-500 mt-2">Vue 3.0 现代化版本</p>
    </div>

    <!-- 主菜单 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
      <router-link
        to="/adventure"
        class="card hover:border-white transition-all transform hover:scale-105"
      >
        <h2 class="text-2xl font-bold mb-2">⚔️ 开始冒险</h2>
        <p class="text-gray-400">探索未知的灵境大陆</p>
      </router-link>

      <router-link
        to="/pets"
        class="card hover:border-white transition-all transform hover:scale-105"
      >
        <h2 class="text-2xl font-bold mb-2">🐉 我的宠物</h2>
        <p class="text-gray-400">查看和管理你的宠物</p>
      </router-link>

      <router-link
        to="/evolution"
        class="card hover:border-white transition-all transform hover:scale-105"
      >
        <h2 class="text-2xl font-bold mb-2">✨ 进化系统</h2>
        <p class="text-gray-400">让宠物进化成更强形态</p>
      </router-link>

      <router-link
        to="/battle"
        class="card hover:border-white transition-all transform hover:scale-105"
      >
        <h2 class="text-2xl font-bold mb-2">⚡ 对战系统</h2>
        <p class="text-gray-400">与其他玩家一决高下</p>
      </router-link>
    </div>

    <!-- MCP状态指示 -->
    <div class="mt-8 flex items-center gap-2 text-sm">
      <div
        class="w-2 h-2 rounded-full"
        :class="mcpConnected ? 'bg-green-500' : 'bg-red-500'"
      ></div>
      <span class="text-gray-400">
        MCP {{ mcpConnected ? '已连接' : '未连接' }}
      </span>
      <button
        v-if="!mcpConnected"
        @click="reconnectMCP"
        class="text-blue-400 hover:text-blue-300 ml-2"
      >
        重新连接
      </button>
    </div>

    <!-- 版本信息 -->
    <div class="mt-4 text-xs text-gray-600">
      版本 {{ version }} | 技术栈: Vue 3 + TypeScript + Vite + MCP
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMCP } from '@/composables/useMCP'

const version = import.meta.env.VITE_APP_VERSION || '3.0.0'
const { isConnected, reconnect } = useMCP()
const mcpConnected = ref(false)

onMounted(async () => {
  mcpConnected.value = isConnected()
})

async function reconnectMCP() {
  try {
    await reconnect()
    mcpConnected.value = true
  } catch (error) {
    console.error('重连失败:', error)
  }
}
</script>
