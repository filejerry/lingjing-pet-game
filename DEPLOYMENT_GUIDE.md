# 🚀 灵境斗宠录 - 完整部署指导

## 📋 部署前准备清单

### ✅ 您已经拥有的资源
- [x] Vercel账号
- [x] 域名
- [x] GitHub仓库
- [x] 本地项目代码

### 🛠️ 需要完成的步骤
- [ ] 1. 整理项目文件
- [ ] 2. 推送到GitHub
- [ ] 3. 连接Vercel
- [ ] 4. 配置域名
- [ ] 5. 测试上线

---

## 🔧 第一步：整理项目文件

### 1.1 检查项目结构
确保您的项目目录结构如下：
```
lingjing-pet-game/
├── public/
│   └── index.html          # 主游戏页面
├── src/
│   ├── app.js             # 服务器主文件
│   ├── ai/                # AI引擎
│   ├── game/              # 游戏逻辑
│   ├── models/            # 数据模型
│   └── routes/            # API路由
├── package.json           # 项目配置
├── vercel.json           # Vercel配置
├── .env.example          # 环境变量示例
├── .gitignore            # Git忽略文件
└── README.md             # 项目说明
```

### 1.2 创建环境变量文件
在项目根目录创建 `.env` 文件：
```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env` 文件，填入以下内容：
```env
DATABASE_URL=./data/game.db
JWT_SECRET=lingjing-super-secret-key-2024
NODE_ENV=production
PORT=3000
```

---

## 📤 第二步：推送到GitHub

### 2.1 初始化Git仓库（如果还没有）
```bash
# 在项目根目录执行
git init
git add .
git commit -m "🎮 初始化灵境斗宠录项目"
```

### 2.2 连接到GitHub仓库
```bash
# 替换为您的GitHub用户名和仓库名
git remote add origin https://github.com/YOUR_USERNAME/lingjing-pet-game.git
git branch -M main
git push -u origin main
```

### 2.3 验证推送成功
访问您的GitHub仓库页面，确认所有文件都已上传。

---

## 🌐 第三步：部署到Vercel

### 3.1 登录Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录

### 3.2 导入项目
1. 点击 "New Project"
2. 选择您的GitHub仓库 `lingjing-pet-game`
3. 点击 "Import"

### 3.3 配置项目设置
在部署配置页面：

**Framework Preset**: Other
**Root Directory**: `./` (保持默认)
**Build Command**: `npm run build`
**Output Directory**: `public` 
**Install Command**: `npm install`

### 3.4 配置环境变量
在 "Environment Variables" 部分添加：

| Name | Value |
|------|-------|
| `DATABASE_URL` | `./data/game.db` |
| `JWT_SECRET` | `lingjing-super-secret-key-2024` |
| `NODE_ENV` | `production` |

### 3.5 开始部署
点击 "Deploy" 按钮，等待部署完成（通常需要2-3分钟）。

---

## 🔗 第四步：配置自定义域名

### 4.1 在Vercel中添加域名
1. 进入项目的 "Settings" 页面
2. 点击 "Domains" 选项卡
3. 输入您的域名，例如：`lingjing.yourdomain.com`
4. 点击 "Add"

### 4.2 配置DNS记录
在您的域名管理面板中添加以下记录：

**CNAME记录**:
- Name: `lingjing` (或您想要的子域名)
- Value: `cname.vercel-dns.com`
- TTL: `Auto` 或 `300`

### 4.3 等待DNS生效
DNS记录生效通常需要几分钟到几小时。

---

## 🧪 第五步：测试部署

### 5.1 访问测试
1. 使用Vercel提供的临时域名测试：`https://your-project.vercel.app`
2. 使用您的自定义域名测试：`https://lingjing.yourdomain.com`

### 5.2 功能测试清单
- [ ] 页面正常加载
- [ ] 注册功能正常
- [ ] 登录功能正常
- [ ] 宠物创建功能
- [ ] 游戏选择交互
- [ ] 付费页面显示

### 5.3 常见问题排查

**问题1: 页面显示404**
- 检查 `vercel.json` 配置是否正确
- 确认 `public/index.html` 文件存在

**问题2: API请求失败**
- 检查环境变量是否正确设置
- 查看Vercel的Function日志

**问题3: 域名无法访问**
- 检查DNS记录是否正确
- 等待DNS传播完成

---

## 🎯 第六步：上线后优化

### 6.1 监控设置
1. 在Vercel中查看Analytics
2. 设置错误监控
3. 配置性能监控

### 6.2 SEO优化
- 确认meta标签正确
- 提交到搜索引擎
- 设置Google Analytics

### 6.3 用户反馈收集
- 设置用户反馈渠道
- 监控用户行为数据
- 收集改进建议

---

## 📞 需要帮助？

如果在部署过程中遇到任何问题，请：

1. **检查Vercel部署日志**：在项目页面的 "Functions" 选项卡查看错误信息
2. **查看GitHub Actions**：确认代码推送成功
3. **测试本地环境**：确保本地运行正常
4. **联系支持**：记录具体错误信息

---

## 🎉 部署成功！

恭喜！您的《灵境斗宠录》现在已经成功部署到线上了！

**下一步计划**：
- 📊 监控用户数据
- 💰 优化付费转化
- 🎮 添加更多游戏功能
- 🚀 准备Steam版本开发

---

**记住**：这只是开始！持续优化和更新将让您的游戏越来越成功！ 🎮✨