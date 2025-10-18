# AI人格系统集成文档

## 概述

本文档描述了《灵境斗宠录》中AI人格系统的完整集成方案，包括文字模型、图像模型和多模态功能的区分使用。

## AI模型分类与用途

### 1. 文字模型 - Kimi (kimi-k2-250905)
**API配置:**
```bash
export ARK_API_KEY="2ffe7955-a0a1-4238-93cd-d354c2c6d7ec"
```

**接入方式:**
```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 2ffe7955-a0a1-4238-93cd-d354c2c6d7ec" \
  -d '{
    "model": "kimi-k2-250905",
    "messages": [
      {"role": "system","content": "你是人工智能助手."},
      {"role": "user","content": "你好"}
    ]  
  }'
```

**主要用途:**
- 宠物人格档案生成
- 对话内容生成
- 故事情节创作
- 行为特征描述
- 数值计算与分析

### 2. 图像模型 - 即梦4.0 (doubao-seedream-4-0-250828)
**API配置:**
```bash
export SEEDREAM_API_KEY="1973ac03-1d99-42c1-ba94-7cec42b465a5"
```

**接入方式:**
```bash
curl https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1973ac03-1d99-42c1-ba94-7cec42b465a5" \
  -d '{
    "model": "doubao-seedream-4-0-250828",
    "prompt": "宠物外形描述",
    "size": "1024x1024"
  }'
```

**专用场景:**
- **仅用于宠物外形生成**
- 进化后形象展示
- 抽卡变体生成
- 美术资源创作

### 3. 多模态应用策略
- **文字优先**: 所有逻辑、对话、数值处理使用Kimi模型
- **图像辅助**: 仅在视觉展示需求时使用即梦4.0
- **成本控制**: 图像生成设置使用限制和付费机制

## 核心系统架构

### 1. 人格档案系统 (PetPersonaSystem)

**六维人格框架:**
```javascript
{
  coreIdentity: {        // 宠物核心标识
    name: "宠物名称",
    species: "物种类型", 
    essence: "本质特征",
    mythology: "神话背景"
  },
  behavioralTraits: {    // 行为特征
    personality: "性格类型",
    habits: "行为习惯",
    preferences: "偏好倾向",
    reactions: "反应模式"
  },
  relationshipDynamics: { // 关系动力
    bondLevel: "亲密度等级",
    trustPattern: "信任模式",
    communicationStyle: "沟通风格",
    loyaltyType: "忠诚类型"
  },
  backgroundContext: {    // 背景脉络
    origin: "出身来源",
    experiences: "经历背景",
    environment: "环境适应",
    culturalInfluence: "文化影响"
  },
  spiritualSpace: {       // 灵性空间
    innerWorld: "内心世界",
    emotionalDepth: "情感深度",
    spiritualConnection: "灵性连接",
    growthPotential: "成长潜力"
  },
  usageGuide: {          // 使用指南
    interactionTips: "互动建议",
    growthDirection: "成长方向",
    specialAbilities: "特殊能力",
    careInstructions: "照料指导"
  }
}
```

### 2. 图像进化系统 (ImageEvolutionSystem)

**核心特性:**
- **幼年期限制**: 5级以下不显示图像，展示黑暗效果
- **进化触发**: 达到进化条件后随机生成形象
- **抽卡机制**: 不满意可付费重新生成变体
- **免费额度**: 普通用户80次免费更换机会

**实现逻辑:**
```javascript
// 检查显示条件
if (pet.level < 5) {
  return { showImage: false, darknessPeriod: true };
}

// 生成进化图像
const imageResult = await generateEvolutionImage(pet, evolutionStage, persona);

// 抽卡变体生成
const variations = await generateCardDrawVariations(pet, persona, count);
```

## 数据库结构

### 新增表结构

```sql
-- 宠物人格档案表
CREATE TABLE pet_personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id TEXT NOT NULL UNIQUE,
  profile_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets (id)
);

-- 图像重新生成记录表
CREATE TABLE pet_image_regenerations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id TEXT NOT NULL,
  variation_count INTEGER DEFAULT 1,
  is_paid INTEGER DEFAULT 0,
  cost INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets (id)
);
```

## API接口设计

### 人格系统接口

#### 1. 生成人格档案
```
POST /api/pet-persona/generate
{
  "petId": "pet_123",
  "interactionHistory": [...],
  "userPreferences": {...}
}
```

#### 2. 获取人格档案
```
GET /api/pet-persona/:petId
```

#### 3. 更新人格档案
```
PUT /api/pet-persona/:petId
{
  "interactionHistory": [...],
  "newTraits": {...}
}
```

### 图像系统接口

#### 1. 生成进化图像
```
POST /api/pet-persona/evolution-image
{
  "petId": "pet_123",
  "evolutionStage": 2,
  "regenerate": false
}
```

#### 2. 抽卡重新生成
```
POST /api/pet-persona/card-draw
{
  "petId": "pet_123",
  "paymentMethod": "free" // 或 "paid"
}
```

#### 3. 获取重新生成统计
```
GET /api/pet-persona/regeneration-stats/:petId
```

## 使用限制与付费机制

### 免费用户限制
- 每个宠物80次免费图像重新生成
- 超出后需要付费或等待重置

### 付费机制
- 付费抽卡: 10积分/次
- 批量生成: 支持一次生成多个变体
- VIP用户: 更高的免费额度

### 成本控制
- 图像生成API调用监控
- 用户使用频率限制
- 缓存机制减少重复生成

## 环境配置

### 环境变量设置
```bash
# Kimi文字模型
ARK_API_KEY="2ffe7955-a0a1-4238-93cd-d354c2c6d7ec"
ARK_API_URL="https://ark.cn-beijing.volces.com/api/v3/chat/completions"

# 即梦4.0图像模型
SEEDREAM_API_KEY="1973ac03-1d99-42c1-ba94-7cec42b465a5"
SEEDREAM_API_URL="https://ark.cn-beijing.volces.com/api/v3/images/generations"

# 模型配置
KIMI_MODEL="kimi-k2-250905"
SEEDREAM_MODEL="doubao-seedream-4-0-250828"
```

## 集成测试

### 测试用例
1. **人格生成测试**: 验证六维人格框架完整性
2. **图像生成测试**: 验证即梦4.0接口调用
3. **幼年期限制测试**: 验证5级以下不显示图像
4. **抽卡机制测试**: 验证付费和免费额度控制
5. **数据库集成测试**: 验证人格和图像数据存储

### 性能监控
- API调用频率监控
- 图像生成成功率统计
- 用户使用行为分析
- 成本控制效果评估

## 未来扩展

### 计划功能
1. **个性化推荐**: 基于人格档案推荐互动方式
2. **社交功能**: 宠物间人格匹配与互动
3. **进化预测**: 基于人格特征预测进化方向
4. **多模态交互**: 结合文字和图像的深度交互

### 技术优化
1. **缓存策略**: 减少重复的AI调用
2. **批处理**: 优化大量请求的处理效率
3. **负载均衡**: 分散AI服务压力
4. **错误恢复**: 增强系统稳定性

---

*文档版本: v1.0*  
*最后更新: 2025/9/30*