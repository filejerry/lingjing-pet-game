<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div
          class="card flex items-start gap-3 animate-slide-up"
          :class="typeClass"
        >
          <div class="flex-shrink-0 mt-0.5">
            <component :is="iconComponent" class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <p class="font-medium">{{ message }}</p>
          </div>
          <button
            @click="close"
            class="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000
})

const visible = ref(false)
let timer: number | null = null

const typeClass = computed(() => {
  const classes = {
    success: 'border-green-500 bg-green-900/20',
    error: 'border-red-500 bg-red-900/20',
    warning: 'border-yellow-500 bg-yellow-900/20',
    info: 'border-blue-500 bg-blue-900/20'
  }
  return classes[props.type]
})

const iconComponent = computed(() => {
  // 这里简化为字符串,实际可以用图标组件
  return 'div'
})

function show() {
  visible.value = true
  if (props.duration > 0) {
    timer = window.setTimeout(() => {
      close()
    }, props.duration)
  }
}

function close() {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

watch(() => props.message, (newMsg) => {
  if (newMsg) {
    show()
  }
})

defineExpose({ show, close })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
