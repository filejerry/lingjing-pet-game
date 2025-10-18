# Supabase 项目设置指南

## 🚀 快速开始

### 第一步:创建 Supabase 项目

1. **访问 Supabase 官网**
   ```
   https://supabase.com
   ```

2. **登录/注册账号**
   - 可以使用 GitHub 账号直接登录
   - 或使用邮箱注册

3. **创建新项目**
   - 点击 "New Project"
   - 填写以下信息:
     ```
     Organization: 选择或创建组织
     Name: lingjing-pet-game
     Database Password: [生成强密码并保存!]
     Region: Northeast Asia (Singapore) [推荐:延迟低]
     Pricing Plan: Free
     ```

4. **等待初始化**
   - 大约需要 2-3 分钟
   - 完成后会进入项目Dashboard

---

### 第二步:获取连接信息

1. **进入项目设置**
   ```
   左侧菜单 → Settings → Database
   ```

2. **复制以下信息**:

   #### Connection String (连接字符串)
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

   #### Connection Info (详细信息)
   ```
   Host: db.xxx.supabase.co
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [你设置的密码]
   ```

3. **获取 API Keys**
   ```
   左侧菜单 → Settings → API
   ```

   复制以下Key:
   - `anon` `public` (客户端使用)
   - `service_role` (服务端使用,保密!)

4. **获取 Project URL**
   ```
   Project URL: https://xxx.supabase.co
   ```

---

### 第三步:配置环境变量

1. **复制配置模板**
   ```bash
   cp .env.example.supabase .env
   ```

2. **填入真实配置**
   ```bash
   # 编辑 .env 文件
   nano .env  # 或使用任何文本编辑器
   ```

3. **替换以下占位符**:
   ```bash
   SUPABASE_URL=https://[你的项目ID].supabase.co
   SUPABASE_ANON_KEY=[从API设置复制anon key]
   SUPABASE_SERVICE_KEY=[从API设置复制service_role key]
   SUPABASE_DB_URL=postgresql://postgres:[数据库密码]@db.[项目ID].supabase.co:5432/postgres
   ```

4. **保存文件**

---

### 第四步:执行数据库Schema

1. **打开 Supabase SQL Editor**
   ```
   左侧菜单 → SQL Editor → New Query
   ```

2. **复制并执行Schema脚本**
   - 打开文件: `scripts/supabase-schema.sql`
   - 全选复制内容
   - 粘贴到 SQL Editor
   - 点击 "RUN" 按钮

3. **验证表创建成功**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

   应该看到以下表:
   ```
   ✅ users
   ✅ pets
   ✅ pet_lore
   ✅ pet_species
   ✅ story_templates
   ✅ pet_traits
   ✅ adventure_events
   ✅ game_config
   ✅ evolution_records
   ✅ ai_cache
   ✅ battle_records
   ```

---

### 第五步:安装依赖包

```bash
# 安装 PostgreSQL 客户端
npm install pg

# 安装其他必要包
npm install dotenv
```

---

### 第六步:测试连接

1. **运行测试脚本**
   ```bash
   node scripts/test-supabase-connection.js
   ```

2. **预期输出**
   ```
   ✅ Supabase连接成功!
   📊 数据库信息:
      - 数据库版本: PostgreSQL 15.x
      - 当前时间: 2025-10-15 20:00:00
      - 表数量: 11
   ```

---

## 📊 Supabase 免费版限制

### 资源限额
```
✅ 数据库存储: 500 MB
✅ 文件存储: 1 GB
✅ 带宽: 5 GB/月
✅ API请求: 50,000次/月
✅ 数据库连接: 60个并发
✅ 实时订阅: 200个并发
```

### 够用吗?
- **初期(0-1000用户)**: 完全够用
- **中期(1000-5000用户)**: 基本够用,需优化查询
- **后期(5000+用户)**: 需升级到Pro($25/月)

### 优化建议
1. 使用 JSONB 索引加速查询
2. 定期清理 `ai_cache` 表
3. 大文本字段考虑分表存储
4. 启用连接池管理

---

## 🔐 安全配置

### 启用 Row Level Security (RLS)

```sql
-- 为所有表启用RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_lore ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_events ENABLE ROW LEVEL SECURITY;

-- 创建访问策略(用户只能访问自己的数据)
CREATE POLICY pets_access_policy ON pets
    FOR ALL
    USING (user_id = auth.uid()::INTEGER);

CREATE POLICY adventure_events_access_policy ON adventure_events
    FOR ALL
    USING (user_id = auth.uid()::INTEGER);
```

### API Key 安全
- ✅ `anon key`: 可以暴露在前端
- ❌ `service_role key`: 绝对不能暴露!仅后端使用
- ✅ 使用 `.gitignore` 保护 `.env` 文件

---

## 🛠️ 常用操作

### 查看数据库大小
```sql
SELECT
    pg_size_pretty(pg_database_size('postgres')) as database_size;
```

### 查看表大小
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 清理过期AI缓存
```sql
-- 手动清理
DELETE FROM ai_cache WHERE expires_at < NOW();

-- 或执行函数
SELECT clean_expired_ai_cache();
```

### 备份数据库
```bash
# 在 Supabase Dashboard
Settings → Database → Database Backups → Create Backup
```

---

## 🔧 故障排除

### 连接失败
```
错误: connection refused
解决: 检查 SUPABASE_DB_URL 是否正确
```

### 认证失败
```
错误: password authentication failed
解决: 确认数据库密码正确,注意URL编码特殊字符
```

### SSL证书问题
```
解决: 在连接字符串末尾添加 ?sslmode=require
完整示例:
postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### API限额超出
```
错误: 429 Too Many Requests
解决:
1. 启用AI缓存减少调用
2. 实现请求限流
3. 升级到付费版
```

---

## 📈 监控与维护

### 实时监控
```
Supabase Dashboard → Reports → 查看:
- API请求统计
- 数据库连接数
- 存储使用情况
- 错误日志
```

### 性能优化
```sql
-- 查看慢查询
SELECT
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 定期维护任务
```bash
# 每周执行一次
1. 清理过期缓存
2. 检查数据库大小
3. 查看错误日志
4. 备份重要数据
```

---

## ✅ 完成检查清单

配置完成后,确认以下项目:

- [ ] Supabase项目已创建
- [ ] 所有表和索引已创建
- [ ] 环境变量已正确配置
- [ ] 连接测试通过
- [ ] 初始数据已插入
- [ ] RLS安全策略已启用(可选)
- [ ] `.env` 已添加到 `.gitignore`
- [ ] 备份了数据库密码和API Keys

---

## 🎉 下一步

配置完成!现在可以:

1. **运行数据迁移**
   ```bash
   npm run migrate:data
   ```

2. **启动应用**
   ```bash
   npm start
   ```

3. **部署到 Vercel**
   - 在 Vercel Dashboard 添加环境变量
   - 重新部署应用

---

**需要帮助?**
- Supabase文档: https://supabase.com/docs
- Discord社区: https://discord.supabase.com
- GitHub Issues: 项目仓库提Issue
