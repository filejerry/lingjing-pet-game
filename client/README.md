# 灵境斗宠录 - Vue 3 现代化前端

基于Vue 3 + TypeScript + Vite构建的现代化前端应用,集成MCP协议实现AI驱动的游戏体验。

## ✨ 技术栈

- **前端框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 5.0+
- **开发语言**: TypeScript 5.0+
- **UI框架**: TailwindCSS 3.4+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.0+
- **HTTP客户端**: Axios 1.6+
- **MCP集成**: @modelcontextprotocol/sdk

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐使用pnpm,也可用npm/yarn)

### 安装依赖

```bash
# 使用pnpm (推荐)
pnpm install

# 或使用npm
npm install
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:5173 查看应用

### 生产构建

```bash
pnpm build
```

构建产物将输出到 `../public/v3` 目录

### 预览生产构建

```bash
pnpm preview
```

## 📁 项目结构

```
client/
├── src/
│   ├── main.ts              # 应用入口
│   ├── App.vue              # 根组件
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia状态管理
│   │   ├── pet.ts          # 宠物状态
│   │   └── story.ts        # 剧情状态
│   ├── services/           # API服务层
│   │   ├── api.ts          # Axios配置
│   │   ├── mcp.ts          # MCP客户端 ⭐
│   │   ├── petService.ts   # 宠物API
│   │   └── storyService.ts # 剧情API
│   ├── composables/        # 组合式函数
│   │   └── useMCP.ts       # MCP调用封装 ⭐
│   ├── components/         # Vue组件
│   ├── views/              # 页面视图
│   ├── types/              # TypeScript类型
│   │   ├── pet.ts
│   │   ├── story.ts
│   │   └── mcp.ts          # MCP类型定义 ⭐
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🔌 MCP协议集成

### MCP客户端使用示例

```typescript
import { mcpClient } from '@/services/mcp'

// 生成剧情
const story = await mcpClient.generateStory({
  type: 'adventure',
  context: {
    petId: 'pet_123',
    scene: 'forest',
    action: 'explore'
  }
})

// 计算进化路径
const evolution = await mcpClient.calculateEvolution({
  petId: 'pet_123',
  behaviors: [...]
})

// 生成宠物图片
const imageUrl = await mcpClient.generatePetImage({
  prompt: '赤焰兽,山海经风格',
  style: 'shanhaijing',
  provider: 'vim'
})
```

### 在组件中使用MCP

```vue
<script setup lang="ts">
import { useMCP } from '@/composables/useMCP'

const { loading, error, generateStory } = useMCP()

async function startAdventure() {
  const story = await generateStory({
    type: 'adventure',
    petId: currentPet.id
  })
  // 处理返回的剧情...
}
</script>
```

## 🎨 核心特性

### 1. Composition API

使用Vue 3的Composition API,代码更模块化:

```typescript
// composables/usePet.ts
export function usePet() {
  const petStore = usePetStore()
  const currentPet = computed(() => petStore.currentPet)

  async function evolve(path: string) {
    await petStore.evolve(path)
  }

  return { currentPet, evolve }
}
```

### 2. TypeScript类型安全

全量TypeScript类型定义:

```typescript
interface Pet {
  id: string
  name: string
  rarity: 'N' | 'R' | 'SR' | 'SSR' | 'SSS'
  stats: PetStats
  // ...
}
```

### 3. Pinia状态管理

响应式状态管理:

```typescript
const petStore = usePetStore()
await petStore.fetchPet('pet_123')
console.log(petStore.currentPet)
```

### 4. 场景氛围系统

动态场景氛围切换:

```typescript
const storyStore = useStoryStore()
storyStore.setScene('volcano') // 火山场景
storyStore.setScene('forest')  // 森林场景
```

## 🔧 配置

### 环境变量

创建 `.env.local` 文件配置:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MCP_SERVER_URL=http://localhost:3001/mcp
VITE_WS_URL=ws://localhost:3000
```

### Vite代理配置

`vite.config.ts` 中已配置API代理:

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000',
    '/mcp': 'http://localhost:3001'
  }
}
```

## 🧪 测试

```bash
# 单元测试
pnpm test

# E2E测试
pnpm test:e2e
```

## 📝 代码规范

```bash
# ESLint检查
pnpm lint

# Prettier格式化
pnpm format
```

## 🐛 调试

### Vue DevTools

安装Vue DevTools浏览器扩展:
- [Chrome扩展](https://chrome.google.com/webstore/detail/vuejs-devtools/)
- [Firefox扩展](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

### MCP调试

MCP客户端在控制台输出详细日志:

```javascript
console.log('✅ MCP客户端连接成功')
console.log('📤 API请求: POST /api/pets')
```

## 📚 学习资源

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vite 官方文档](https://cn.vitejs.dev/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)
- [MCP协议规范](https://spec.modelcontextprotocol.io/)
- [TailwindCSS 文档](https://tailwindcss.com/docs)

## 🤝 贡献指南

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 开源协议

MIT License

---

**技术支持**: 查看 [完整技术文档](../docs/迭代03-前端现代化架构方案.md)
