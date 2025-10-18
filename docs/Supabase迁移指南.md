# Supabase 数据库迁移指南

## 📋 迁移概述

### 目标
将《灵境斗宠录》从 SQLite 迁移到 Supabase PostgreSQL,解决 Vercel 部署时的数据持久化问题。

### 迁移时间表
- **Day 1**: 创建 Supabase 项目 + Schema 设计
- **Day 2**: 编写迁移脚本 + 数据库连接层
- **Day 3**: 数据迁移 + 测试验证

---

## 🔧 准备工作

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息:
   - **Name**: lingjing-pet-game
   - **Database Password**: 生成强密码(保存好!)
   - **Region**: Northeast Asia (Singapore) 或 Southeast Asia
   - **Pricing Plan**: Free (包含 500MB 数据库)

5. 等待项目初始化(约2分钟)

### 2. 获取连接信息

项目创建后,进入 `Settings` → `Database`:
- **Host**: `db.xxx.supabase.co`
- **Database name**: `postgres`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: [你创建项目时设置的密码]

**Connection String 格式**:
```
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### 3. 安装依赖

```bash
npm install pg dotenv
```

---

## 🗄️ 数据库架构对比

### SQLite → PostgreSQL 类型映射

| SQLite 类型 | PostgreSQL 类型 | 说明 |
|------------|----------------|------|
| INTEGER PRIMARY KEY AUTOINCREMENT | SERIAL PRIMARY KEY | 自增主键 |
| INTEGER | INTEGER | 整数 |
| TEXT | TEXT / VARCHAR | 文本 |
| REAL | REAL / NUMERIC | 浮点数 |
| DATETIME | TIMESTAMP | 时间戳 |
| BOOLEAN | BOOLEAN | 布尔值 |

### 关键差异

1. **自增主键**
   - SQLite: `INTEGER PRIMARY KEY AUTOINCREMENT`
   - PostgreSQL: `SERIAL PRIMARY KEY` 或 `BIGSERIAL`

2. **时间戳**
   - SQLite: `DATETIME DEFAULT CURRENT_TIMESTAMP`
   - PostgreSQL: `TIMESTAMP DEFAULT NOW()`

3. **JSON 存储**
   - SQLite: 存为 TEXT
   - PostgreSQL: 使用 JSONB 类型(性能更好,支持索引)

---

## 📊 数据表迁移方案

### 核心表结构(PostgreSQL 版本)

#### 1. users (用户表)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    game_progress JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### 2. pets (宠物基础信息表)
```sql
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL,
    rarity VARCHAR(10) NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    health INTEGER DEFAULT 100,
    attack INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 10,
    speed INTEGER DEFAULT 10,
    special_traits JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    last_interaction TIMESTAMP DEFAULT NOW(),
    evolution_stage INTEGER DEFAULT 0,
    custom_name VARCHAR(255)
);

CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_rarity ON pets(rarity);
CREATE INDEX idx_pets_species ON pets(species);
```

#### 3. pet_lore (宠物背景故事表)
```sql
CREATE TABLE pet_lore (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER UNIQUE REFERENCES pets(id) ON DELETE CASCADE,
    background_story TEXT,
    detailed_description TEXT,
    personality_traits TEXT,
    special_abilities TEXT,
    origin_story TEXT,
    evolution_history TEXT,
    ai_prompt_settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pet_lore_pet_id ON pet_lore(pet_id);
```

#### 4. pet_species (宠物种族模板表)
```sql
CREATE TABLE pet_species (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    base_rarity VARCHAR(10) NOT NULL,
    base_stats JSONB NOT NULL,
    evolution_paths JSONB DEFAULT '[]',
    special_traits JSONB DEFAULT '[]',
    lore_template TEXT,
    is_legendary BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_pet_species_category ON pet_species(category);
CREATE INDEX idx_pet_species_rarity ON pet_species(base_rarity);
```

#### 5. story_templates (剧情模板库表)
```sql
CREATE TABLE story_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_story_templates_category ON story_templates(category);
```

#### 6. pet_traits (宠物词条表)
```sql
CREATE TABLE pet_traits (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    trait_name VARCHAR(100) NOT NULL,
    trait_value TEXT,
    trait_type VARCHAR(50) NOT NULL,
    acquired_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pet_traits_pet_id ON pet_traits(pet_id);
CREATE INDEX idx_pet_traits_type ON pet_traits(trait_type);
```

#### 7. adventure_events (冒险事件表)
```sql
CREATE TABLE adventure_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    choices_made JSONB DEFAULT '[]',
    outcomes JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adventure_events_user_id ON adventure_events(user_id);
CREATE INDEX idx_adventure_events_type ON adventure_events(event_type);
CREATE INDEX idx_adventure_events_created ON adventure_events(created_at DESC);
```

#### 8. game_config (游戏配置表)
```sql
CREATE TABLE game_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_game_config_key ON game_config(config_key);
```

#### 9. evolution_records (进化记录表 - 新增)
```sql
CREATE TABLE evolution_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    from_species VARCHAR(100) NOT NULL,
    to_species VARCHAR(100) NOT NULL,
    from_rarity VARCHAR(10) NOT NULL,
    to_rarity VARCHAR(10) NOT NULL,
    evolution_path VARCHAR(50),
    trigger_reason TEXT,
    ai_story TEXT,
    stats_before JSONB,
    stats_after JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evolution_records_pet_id ON evolution_records(pet_id);
CREATE INDEX idx_evolution_records_created ON evolution_records(created_at DESC);
```

#### 10. ai_cache (AI响应缓存表 - 新增)
```sql
CREATE TABLE ai_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    prompt_hash VARCHAR(64) NOT NULL,
    response_data JSONB NOT NULL,
    model_name VARCHAR(50),
    token_usage INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    hit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
```

---

## 🔄 迁移流程

### 阶段一: Schema 创建

1. 在 Supabase SQL Editor 中执行所有 CREATE TABLE 语句
2. 验证表结构:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

### 阶段二: 数据迁移

使用迁移工具 `scripts/migrate-to-supabase.js`:
1. 读取 SQLite 数据
2. 转换数据格式(JSON字段特殊处理)
3. 批量插入 PostgreSQL
4. 验证数据完整性

### 阶段三: 代码适配

1. 创建新的数据库连接层 `src/models/SupabaseDatabase.js`
2. 替换 `Database.js` 的引用
3. 测试所有 API 接口
4. 性能对比测试

---

## ⚙️ 环境变量配置

### .env.example (更新)
```bash
# Database Configuration
DATABASE_TYPE=supabase  # 或 sqlite
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Legacy SQLite (保留用于本地开发)
SQLITE_DB_PATH=./data/game.db

# AI Service
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com

# Server
PORT=14000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_here
```

---

## 🧪 测试清单

### 功能测试
- [ ] 用户注册/登录
- [ ] 宠物创建/查询/更新/删除
- [ ] 宠物进化记录
- [ ] 剧情系统
- [ ] AI 调用缓存

### 性能测试
- [ ] 并发读取测试(100 QPS)
- [ ] 并发写入测试(50 QPS)
- [ ] 大数据量查询(10000+ pets)
- [ ] JOIN 查询性能

### 兼容性测试
- [ ] 本地开发环境(SQLite)
- [ ] 生产环境(Supabase)
- [ ] Vercel 部署验证

---

## 🚨 回滚方案

### 如果迁移失败

1. **保留 SQLite 代码**
   - 不删除 `src/models/Database.js`
   - 通过环境变量 `DATABASE_TYPE` 切换

2. **数据备份**
   ```bash
   # 迁移前备份
   cp data/game.db data/backup/game_pre_migration.db

   # 迁移后验证
   # 如果失败,恢复备份
   cp data/backup/game_pre_migration.db data/game.db
   ```

3. **双写方案**
   - 过渡期同时写入 SQLite 和 Supabase
   - 验证数据一致性后完全切换

---

## 📌 注意事项

### Supabase 免费版限制
- **数据库大小**: 500MB
- **带宽**: 5GB/月
- **API 请求**: 50,000/月
- **存储**: 1GB

### 优化建议
1. 使用 JSONB 索引加速查询
2. 定期清理过期 AI 缓存
3. 大字段(如 story)考虑分表存储
4. 使用连接池管理数据库连接

---

## 📞 支持

如遇到问题:
1. 查看 Supabase 文档: https://supabase.com/docs
2. 检查日志: `logs/migration.log`
3. Supabase Dashboard 查看实时数据库状态

---

**下一步**: 创建 Supabase 项目后,运行 `npm run migrate:supabase` 开始迁移
