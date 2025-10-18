# 《灵境斗宠录》AI接入能力梳理

## 概述

本项目已完成完整的AI接入架构，支持文字模型、数值模型和图像模型的分类使用。

## AI模型配置

### 1. 环境变量配置

创建或更新 `.env` 文件：

```bash
# 文字AI模型配置（Kimi - 用于内容生成、故事创作）
AI_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
AI_API_KEY=2ffe7955-a0a1-4238-93cd-d354c2c6d7ec
AI_MODEL_NAME=kimi-k2-250905

# 数值AI模型配置（同一模型，不同prompt策略）
AI_NUMERICAL_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
AI_NUMERICAL_API_KEY=2ffe7955-a0a1-4238-93cd-d354c2c6d7ec
AI_NUMERICAL_MODEL=kimi-k2-250905

# 创意AI模型配置（同一模型，高temperature）
AI_CREATIVE_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
AI_CREATIVE_API_KEY=2ffe7955-a0a1-4238-93cd-d354c2c6d7ec
AI_CREATIVE_MODEL=kimi-k2-250905

# 图像生成模型配置（即梦4.0 - 专门用于宠物外貌生成）
AI_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
AI_IMAGE_API_KEY=1973ac03-1d99-42c1-ba94-7cec42b465a5
AI_IMAGE_MODEL=doubao-seedream-4-0-250828
```

## AI模型分类使用

### 1. 文字模型 (kimi-k2-250905)

**主要用途：**
- 宠物进化描述生成
- 故事情节创作
- 角色对话生成
- 事件描述文本
- 冒险叙事

**API调用示例：**
```javascript
// 生成宠物进化内容
const evolutionContent = await aiService.generateEvolutionContent(prompt, {
  temperature: 0.8,
  maxTokens: 1200
});

// 生成事件描述
const eventDesc = await aiService.generateEventDescription(pet, '冒险', context);
```

### 2. 数值模型 (同一模型，低temperature)

**主要用途：**
- 宠物属性数值计算
- 战斗词条生成
- 平衡性检查
- 精确JSON输出

**API调用示例：**
```javascript
// 生成数值输出
const numericalResult = await aiService.generateNumericalOutput(prompt, {
  temperature: 0.2,
  maxTokens: 800
});
```

### 3. 图像模型 (doubao-seedream-4-0-250828)

**主要用途：**
- 宠物外形生成
- 进化前后对比图
- 场景背景图
- 技能特效图

**API调用示例：**
```javascript
// 生成宠物图像
const imageResult = await aiService.generatePetImage(pet, {
  style: 'fantasy',
  environment: 'natural',
  size: '2K'
});

// 生成进化对比图
const comparisonImage = await aiService.generateEvolutionComparisonImage(
  beforePet, 
  afterPet, 
  options
);
```

## API接口说明

### 图像生成相关接口

#### 1. 生成单个宠物图像
```http
POST /api/pet-images/generate
Content-Type: application/json

{
  "pet": {
    "name": "火龙·烈焰·幼崽",
    "race": "火龙",
    "attribute": "火",
    "specialWord": "幼崽",
    "rarity": "sr"
  },
  "options": {
    "style": "fantasy",
    "environment": "natural",
    "size": "2K"
  }
}
```

#### 2. 批量生成宠物图像
```http
POST /api/pet-images/batch-generate
Content-Type: application/json

{
  "pets": [
    { "name": "火龙·烈焰·幼崽", "race": "火龙", "rarity": "sr" },
    { "name": "冰狐·霜雪·少年", "race": "冰狐", "rarity": "r" }
  ],
  "options": {
    "style": "fantasy",
    "size": "2K"
  }
}
```

#### 3. 生成进化对比图
```http
POST /api/pet-images/evolution-comparison
Content-Type: application/json

{
  "beforePet": {
    "name": "火龙·烈焰·幼崽",
    "race": "火龙",
    "attribute": "火",
    "rarity": "r"
  },
  "afterPet": {
    "name": "火龙·烈焰·成年",
    "race": "火龙",
    "attribute": "火",
    "rarity": "sr"
  }
}
```

#### 4. 测试图像生成
```http
POST /api/pet-images/test
```

#### 5. 获取服务状态
```http
GET /api/pet-images/status
```

## 系统架构

### 1. 三层AI驱动引擎

- **L1层（记录层）**：行为解析与提示词修正
- **L2层（进化层）**：AI创意进化内容生成
- **L3层（判断层）**：数值智能体与词条固化

### 2. 增强版AI引擎

- 集成易经状态机
- 动态演化机制
- 卦象指导决策

### 3. 服务分层

```
AIService (统一接口)
├── Primary Service (主要文字生成)
├── Numerical Service (数值计算)
├── Creative Service (创意内容)
└── Image Service (图像生成)
```

## 使用示例

### 1. 启动服务

```bash
# 设置环境变量
export AI_API_KEY="2ffe7955-a0a1-4238-93cd-d354c2c6d7ec"
export AI_IMAGE_API_KEY="1973ac03-1d99-42c1-ba94-7cec42b465a5"

# 启动服务
npm run dev
```

### 2. 测试文字生成

```bash
curl -X POST http://localhost:3000/api/adventure/text-event \
  -H "Content-Type: application/json" \
  -d '{
    "pet": {
      "name": "小火龙",
      "base_prompt": "活泼的火系宠物",
      "hp": 100,
      "attack": 20
    },
    "context": "在神秘的森林中探索"
  }'
```

### 3. 测试图像生成

```bash
curl -X POST http://localhost:3000/api/pet-images/test \
  -H "Content-Type: application/json"
```

### 4. 生成宠物图像

```bash
curl -X POST http://localhost:3000/api/pet-images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "pet": {
      "name": "火龙·烈焰·幼崽",
      "race": "火龙",
      "attribute": "火",
      "specialWord": "幼崽",
      "rarity": "sr"
    },
    "options": {
      "style": "fantasy",
      "environment": "elemental",
      "size": "2K"
    }
  }'
```

## 数据库支持

新增了以下数据表：

### pet_images 表
```sql
CREATE TABLE pet_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style TEXT DEFAULT 'fantasy',
  environment TEXT DEFAULT 'natural',
  size TEXT DEFAULT '2K',
  generation_type TEXT DEFAULT 'single',
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets (id)
);
```

### system_events 表
```sql
CREATE TABLE system_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 错误处理与降级

### 1. AI服务降级
- 当AI API调用失败时，自动使用预设模板
- 支持缓存机制，减少重复调用
- API调用限制保护

### 2. 图像生成降级
- 当图像生成失败时，返回SVG占位图
- 支持批量生成的部分成功处理

### 3. 监控与日志
- 完整的请求日志记录
- 错误统计和分析
- 服务状态监控

## 性能优化

### 1. 并发控制
- 图像生成限制并发数（3个）
- 批次间延迟控制
- 请求超时设置

### 2. 缓存策略
- 内存缓存AI响应
- 图像URL缓存
- 定期缓存清理

### 3. 资源管理
- 连接池复用
- 内存使用监控
- 优雅关闭机制

## 扩展计划

### 1. 多模态支持
- 图文结合生成
- 语音合成集成
- 视频生成支持

### 2. 模型优化
- 专用模型微调
- 提示词工程优化
- 生成质量评估

### 3. 用户体验
- 实时生成进度
- 批量操作界面
- 历史记录管理

---

## 快速开始

1. 复制 `.env.example` 到 `.env`
2. 配置API密钥
3. 运行 `npm run dev`
4. 访问 `http://localhost:3000/api/pet-images/status` 检查服务状态
5. 使用 `http://localhost:3000/api/pet-images/test` 测试图像生成

现在你的《灵境斗宠录》已经具备完整的AI接入能力，支持文字、数值和图像的全方位AI驱动体验！