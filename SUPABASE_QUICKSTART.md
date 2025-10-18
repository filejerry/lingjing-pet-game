# 🚀 Supabase 快速开始指南

## 第一周 Day 1 完成!

你现在已经拥有完整的 Supabase 迁移工具包,包括:

✅ 数据库Schema脚本
✅ 配置文件模板
✅ 数据库连接层
✅ 连接测试工具
✅ 数据迁移工具

---

## 📝 完整操作步骤

### Step 1: 创建 Supabase 项目 (5分钟)

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写信息:
   ```
   Name: lingjing-pet-game
   Database Password: [生成并保存强密码]
   Region: Northeast Asia (Singapore)
   Plan: Free
   ```
5. 等待2-3分钟完成初始化

### Step 2: 执行数据库Schema (3分钟)

1. 进入 Supabase Dashboard
2. 左侧菜单 → SQL Editor → New Query
3. 复制 `scripts/supabase-schema.sql` 的全部内容
4. 粘贴并点击 "RUN"
5. 看到成功提示: "灵境斗宠录数据库Schema创建完成!"

### Step 3: 配置环境变量 (2分钟)

1. 复制配置模板:
   ```bash
   cp .env.example.supabase .env
   ```

2. 获取连接信息:
   - Supabase Dashboard → Settings → Database
   - 复制 Connection String

3. 获取API Keys:
   - Settings → API
   - 复制 anon key 和 service_role key

4. 编辑 `.env` 文件,填入:
   ```bash
   DATABASE_TYPE=supabase
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_SERVICE_KEY=eyJhbG...
   SUPABASE_DB_URL=postgresql://postgres:[密码]@db.xxx.supabase.co:5432/postgres
   ```

### Step 4: 安装依赖 (1分钟)

```bash
npm install
```

这会安装新增的 `pg` 包(PostgreSQL客户端)

### Step 5: 测试连接 (1分钟)

```bash
npm run test:supabase
```

预期输出:
```
✅ 所有测试通过! Supabase连接配置正确
```

### Step 6: 迁移现有数据 (可选,如果有数据)

```bash
npm run migrate:supabase
```

这会将 SQLite 中的数据迁移到 Supabase

### Step 7: 启动应用 (完成!)

```bash
npm start
```

访问: http://localhost:14000

---

## 🎯 验证清单

完成后请确认:

- [ ] Supabase项目已创建
- [ ] Schema已成功执行(11个表)
- [ ] `.env` 文件已正确配置
- [ ] `npm run test:supabase` 测试通过
- [ ] 应用能正常启动
- [ ] 能创建宠物并保存到数据库

---

## 📊 数据库信息

### 已创建的表(11个)

| 表名 | 说明 | 行数估计 |
|-----|------|---------|
| users | 用户信息 | 0-1000 |
| pets | 宠物基础信息 | 0-10000 |
| pet_lore | 宠物背景故事 | 同pets |
| pet_species | 宠物种族模板 | 100+ |
| story_templates | 剧情模板 | 50+ |
| pet_traits | 宠物词条 | 0-50000 |
| adventure_events | 冒险事件 | 0-100000 |
| game_config | 游戏配置 | 10-50 |
| evolution_records | 进化记录 | 0-10000 |
| ai_cache | AI响应缓存 | 0-10000 |
| battle_records | 战斗记录 | 0-100000 |

### 初始配置

已自动插入以下配置:
```
game_version = 1.0.0
text_speed_default = 1.5
max_pets_per_user = 50
evolution_min_level = 20
ai_cache_expire_hours = 168
gacha_ssr_rate = 0.01
gacha_sss_rate = 0.001
```

### 初始宠物种族

已插入示例种族:
- 幼龙 (N)
- 灵狐 (R)
- 九尾狐 (SSR)
- 应龙 (SSR)
- 凤凰 (SSR)

---

## 🛠️ 常用命令

```bash
# 测试Supabase连接
npm run test:supabase

# 迁移SQLite数据到Supabase
npm run migrate:supabase

# 启动开发服务器
npm run dev

# 启动生产服务器
npm start
```

---

## 🔧 故障排除

### 连接失败

**问题**: `connection refused`

**解决**:
1. 检查 `SUPABASE_DB_URL` 是否正确
2. 确认项目已完成初始化
3. 检查网络连接

### 认证失败

**问题**: `password authentication failed`

**解决**:
1. 确认密码正确
2. URL中特殊字符需要编码
3. 示例: `p@ss` → `p%40ss`

### 表不存在

**问题**: `relation "xxx" does not exist`

**解决**:
1. 确认已执行 `supabase-schema.sql`
2. 在 SQL Editor 中运行:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

### API限额超出

**问题**: `429 Too Many Requests`

**解决**:
1. 启用AI缓存减少调用
2. 实现请求限流
3. 检查是否有死循环调用
4. 考虑升级到付费版

---

## 📈 性能优化建议

### 1. 使用连接池
已配置连接池:
- 最小连接: 2
- 最大连接: 10
- 超时: 30秒

### 2. 启用查询缓存
AI响应自动缓存7天,可修改:
```sql
UPDATE game_config
SET config_value = '336'  -- 14天
WHERE config_key = 'ai_cache_expire_hours';
```

### 3. 定期清理
设置定时任务清理过期缓存:
```javascript
// 在 app.js 中添加
cron.schedule('0 3 * * *', async () => {
  await database.cleanExpiredAICache();
});
```

### 4. 索引优化
Schema已包含必要索引,无需额外操作

---

## 🚀 部署到 Vercel

### 1. 推送到GitHub

```bash
git add .
git commit -m "feat: 迁移到Supabase数据库"
git push origin main
```

### 2. 连接Vercel

1. 访问 https://vercel.com
2. Import GitHub项目
3. 配置环境变量(复制 `.env` 内容)
4. Deploy!

### 3. 验证部署

访问分配的域名: `https://your-app.vercel.app`

---

## 📚 相关文档

- 📖 详细迁移指南: `docs/Supabase迁移指南.md`
- 🔧 项目设置指南: `scripts/supabase-setup.md`
- 📊 数据库Schema: `scripts/supabase-schema.sql`
- 🧪 测试脚本: `scripts/test-supabase-connection.js`
- 🔄 迁移工具: `scripts/migrate-to-supabase.js`

---

## 🎉 下一步

Supabase迁移完成后,继续 **第一周 Day 2-3**:

- [ ] 安全性加固 (API限流、输入验证)
- [ ] 代码整理 (删除冗余文件)
- [ ] 添加单元测试

完整计划见项目根目录的 **1个月打磨计划**

---

## 💬 需要帮助?

- Supabase文档: https://supabase.com/docs
- PostgreSQL文档: https://www.postgresql.org/docs/
- 项目Issues: GitHub仓库提Issue

---

**祝开发顺利! 🚀**
