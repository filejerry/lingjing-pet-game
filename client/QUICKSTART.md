# 🚀 快速开始指南

## 第一步: 安装环境

### 1. 安装Node.js

访问 https://nodejs.org/ 下载并安装Node.js 18+

验证安装:
```bash
node -v  # 应显示 v18.x.x 或更高
npm -v   # 应显示 9.x.x 或更高
```

### 2. 安装pnpm (推荐)

```bash
npm install -g pnpm
```

验证安装:
```bash
pnpm -v  # 应显示 8.x.x 或更高
```

## 第二步: 启动项目

### 1. 克隆项目

```bash
cd I:\chognwu\client
```

### 2. 安装依赖

```bash
pnpm install
```

等待依赖安装完成...

### 3. 配置环境变量

创建 `.env.local` 文件:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MCP_SERVER_URL=http://localhost:3001/mcp
VITE_WS_URL=ws://localhost:3000
```

### 4. 启动开发服务器

```bash
pnpm dev
```

看到以下输出表示启动成功:

```
  VITE v5.1.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 5. 访问应用

打开浏览器访问: http://localhost:5173

## 第三步: 启动后端服务

Vue3前端需要后端API支持。

### 1. 启动Node.js后端

```bash
cd I:\chognwu
npm run dev
```

后端应运行在 http://localhost:3000

### 2. 启动MCP服务器 (可选)

如果需要AI功能,启动MCP服务器:

```bash
cd I:\chognwu
# TODO: MCP服务器启动命令
```

MCP服务器应运行在 http://localhost:3001

## 第四步: 测试功能

### 1. 首页

访问 http://localhost:5173

应该看到:
- 🐾 灵境斗宠录 标题
- 四个功能卡片: 冒险/宠物/进化/对战
- MCP连接状态指示器

### 2. 测试MCP连接

查看浏览器控制台(F12),应该看到:

```
✅ MCP客户端连接成功
🐾 灵境斗宠录 v3.0.0 已启动
```

如果显示"MCP未连接",点击"重新连接"按钮。

### 3. 测试导航

点击"开始冒险"进入冒险模式。

## 常见问题

### Q: pnpm安装依赖失败?

**A**: 尝试使用npm:
```bash
npm install
npm run dev
```

### Q: 端口5173已被占用?

**A**: 修改 `vite.config.ts`:
```typescript
server: {
  port: 5174  // 改为其他端口
}
```

### Q: MCP连接失败?

**A**: 检查:
1. MCP服务器是否启动
2. `.env.local` 中MCP_SERVER_URL是否正确
3. 网络防火墙设置

### Q: API请求失败?

**A**: 检查:
1. 后端服务是否启动 (http://localhost:3000)
2. Vite代理配置是否正确
3. 浏览器控制台查看错误详情

## 开发工作流

### 1. 开发新功能

```bash
# 创建新分支
git checkout -b feature/my-feature

# 开发...

# 提交代码
git add .
git commit -m "feat: 添加新功能"
```

### 2. 代码检查

```bash
# ESLint检查
pnpm lint

# TypeScript类型检查
pnpm build  # 会自动执行 vue-tsc
```

### 3. 生产构建

```bash
pnpm build
```

构建产物在 `../public/v3` 目录。

## 下一步

- 📖 阅读 [完整文档](../docs/迭代03-前端现代化架构方案.md)
- 🎨 自定义TailwindCSS主题
- 🔌 深入学习MCP协议集成
- 🧪 编写单元测试

## 获取帮助

- GitHub Issues: [提交问题](https://github.com/your-repo/issues)
- 技术文档: `docs/`目录
- Vue 3文档: https://cn.vuejs.org/

---

祝你开发愉快! 🎉
