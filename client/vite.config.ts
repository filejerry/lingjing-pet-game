import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 代理API请求到后端
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // 代理MCP请求
      '/mcp': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // WebSocket代理
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: '../public/v3',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['axios', 'socket.io-client']
        }
      }
    }
  }
})
