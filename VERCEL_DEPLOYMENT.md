# 🚀 Vercel 部署指南 - 灵境斗宠录

## ✅ 代码准备完成

### 已完成的工作
- ✅ WebSocket对战系统增强（数据库集成）
- ✅ Vue3前端构建完成（输出到 `public/v3`）
- ✅ Vercel配置文件已更新
- ✅ 代码已推送到 GitHub
- ✅ 前端依赖已安装

### 构建产物
```
public/v3/
├── index.html (0.61 KB)
├── assets/
│   ├── index-C125uxOh.css (13.63 KB)
│   ├── vue-vendor-BrcR7j7v.js (99.95 KB)
│   ├── ui-vendor-B9ygI19o.js (36.33 KB)
│   └── ... (其他chunk文件)
└── 总大小: ~175 KB (gzipped: ~60 KB)
```

---

## 📝 Vercel部署步骤

### 第一步：登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 授权 Vercel 访问你的 GitHub 仓库

### 第二步：导入项目

1. 点击 **"Add New..."** → **"Project"**
2. 在仓库列表中找到 `lingjing-pet-game`
3. 点击 **"Import"**

### 第三步：配置项目

#### 基础配置
```
Framework Preset: Other
Root Directory: ./
Build Command: npm run vercel-build
Output Directory: public
Install Command: npm install
```

#### 环境变量配置

在 **"Environment Variables"** 部分添加以下变量：

**必填变量：**
```
NODE_ENV=production
DATABASE_PATH=./data/pets.db
PORT=3000
```

**AI服务配置（可选）：**
```
# Kimi文本模型
KIMI_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
KIMI_API_KEY=你的API密钥
KIMI_MODEL=kimi-k2-250905

# DeepSeek模型
DEEPSEEK_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
DEEPSEEK_API_KEY=你的API密钥
DEEPSEEK_MODEL=你的模型ID

# 即梦4.0图像模型
AI_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generate
AI_IMAGE_API_KEY=你的API密钥
AI_IMAGE_MODEL=你的模型ID
```

**其他配置：**
```
LOG_LEVEL=info
ALLOWED_ORIGINS=https://你的域名.vercel.app
AI_MAX_REQUESTS_PER_HOUR=1000
AI_CACHE_TTL=3600
AI_TIMEOUT=30000
```

### 第四步：部署

1. 检查所有配置无误
2. 点击 **"Deploy"** 按钮
3. 等待部署完成（通常需要2-5分钟）

---

## 🔗 路由配置说明

Vercel已配置以下路由：

```json
{
  "routes": [
    // API路由 → Express后端
    { "src": "/api/(.*)", "dest": "/src/app.js" },

    // WebSocket路由 → Socket.IO
    { "src": "/socket.io/(.*)", "dest": "/src/app.js" },

    // 健康检查
    { "src": "/health", "dest": "/src/app.js" },

    // Vue3前端（新版）
    { "src": "/v3/(.*)", "dest": "/public/v3/$1" },

    // 默认路由 → Vue3应用
    { "src": "/", "dest": "/public/v3/index.html" },

    // 其他静态文件
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

---

## 🧪 部署后测试

### 1. 基础功能测试

访问你的Vercel域名（例如：`https://lingjing-pet-game.vercel.app`）

#### 前端测试
- ✅ 页面正常加载
- ✅ Vue3应用渲染正常
- ✅ 路由切换正常（Home/Adventure/Pets/Evolution/Battle/Settings）
- ✅ MCP状态显示

#### API测试
```bash
# 健康检查
curl https://你的域名.vercel.app/health

# 宠物列表（需要认证）
curl https://你的域名.vercel.app/api/pets
```

#### WebSocket测试
在浏览器控制台：
```javascript
// 连接WebSocket
const socket = io('https://你的域名.vercel.app')

socket.on('connect', () => {
  console.log('WebSocket连接成功')
})
```

---

## 🐛 常见问题排查

### 问题1：页面404错误

**原因**：路由配置不正确或构建产物缺失

**解决**：
1. 检查 `public/v3` 目录是否存在
2. 验证 `vercel.json` 配置
3. 重新部署

### 问题2：API请求失败

**原因**：环境变量未配置或后端启动失败

**解决**：
1. 在 Vercel 控制台检查环境变量
2. 查看 Function Logs
3. 确认 `src/app.js` 正确启动

### 问题3：WebSocket连接失败

**原因**：CORS配置或WebSocket路由问题

**解决**：
1. 检查 `ALLOWED_ORIGINS` 环境变量
2. 确认 `socket.io` 路由配置
3. 在 `src/app.js` 中检查 CORS 设置

### 问题4：数据库错误

**原因**：Vercel Serverless环境不支持持久化SQLite

**解决**：
需要迁移到云数据库（推荐 Supabase）：
```bash
# 参考迁移脚本
npm run migrate:supabase
```

---

## 📊 性能优化建议

### 1. 启用边缘缓存
在 `vercel.json` 中添加：
```json
{
  "headers": [
    {
      "source": "/v3/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. 压缩优化
- ✅ 已启用 Gzip/Brotli 压缩
- ✅ 代码分割已配置（vue-vendor, ui-vendor）
- ✅ Source map 已生成（便于调试）

### 3. 数据库迁移
强烈建议迁移到 Supabase PostgreSQL：
- 更好的性能
- 数据持久化
- 免费额度充足

---

## 🎯 下一步建议

### 短期（1周内）
1. ✅ **完成Vercel部署**
2. 📝 测试所有功能点
3. 🗄️ 迁移到Supabase数据库
4. 🔐 配置自定义域名
5. 📈 设置分析监控

### 中期（1个月内）
1. 🤖 接入真实AI服务（即梦4.0）
2. 🎨 完善UI/UX
3. 🧪 添加单元测试
4. 📱 移动端适配优化
5. 🚀 性能优化

### 长期（3个月）
1. 💰 实现付费订阅系统
2. 🎮 完善多人对战系统
3. 📊 数据分析和用户行为追踪
4. 🌍 CDN加速配置
5. 🖥️ Tauri桌面版开发

---

## 📞 需要帮助？

### Vercel文档
- [Vercel部署指南](https://vercel.com/docs/deployments/overview)
- [环境变量配置](https://vercel.com/docs/environment-variables)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

### 项目文档
- `README.md` - 项目说明
- `DEPLOYMENT_GUIDE.md` - 完整部署指导
- `docs/全栈开发完成总结.md` - 技术架构详解

### 日志调试
1. Vercel控制台 → 项目 → Functions
2. 查看实时日志输出
3. 检查错误信息

---

## 🎉 部署检查清单

部署前确认：
- ✅ 代码已推送到 GitHub
- ✅ 前端已构建（`public/v3` 存在）
- ✅ `vercel.json` 配置正确
- ✅ 环境变量准备完成

部署后验证：
- ✅ 页面可以访问
- ✅ API接口正常
- ✅ WebSocket连接成功
- ✅ 日志无错误

---

**准备就绪！** 🎊

你的项目已经完全准备好部署到 Vercel。按照上述步骤操作，几分钟内即可上线！

**GitHub仓库**: https://github.com/filejerry/lingjing-pet-game
**最后推送**: 2025-11-20

祝部署顺利！🚀
