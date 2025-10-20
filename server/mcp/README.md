# MCP服务器 - 灵境斗宠录

MCP (Model Context Protocol) 服务器,为前端提供AI驱动的游戏功能。

## 功能特性

### 🤖 AI工具

1. **generate_story** - 生成剧情文本
   - 支持冒险、日常、战斗、进化等场景
   - 自动降级到本地模板
   - 可配置多种AI提供商

2. **calculate_evolution** - 计算进化路径
   - 基于行为记录分析倾向
   - 时间衰减算法
   - 多路径进化候选

3. **generate_pet_image** - 生成宠物图片
   - 支持即梦4.0、DALL-E、Stable Diffusion
   - 山海经、动漫、写实风格
   - 失败自动降级

4. **analyze_behavior** - 行为分析
   - 统计行为模式
   - 生成养成建议
   - 预测进化趋势

## 快速开始

### 1. 安装依赖

```bash
cd server/mcp
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入API密钥
```

### 3. 启动服务器

```bash
npm start

# 或开发模式
npm run dev
```

### 4. 测试接口

```bash
# 健康检查
curl http://localhost:3001/health

# 列出所有工具
curl http://localhost:3001/mcp/tools

# 调用工具
curl -X POST http://localhost:3001/mcp/tools/generate_story \
  -H "Content-Type: application/json" \
  -d '{
    "arguments": {
      "type": "adventure",
      "context": {
        "scene": "forest",
        "petId": "pet_123"
      }
    }
  }'
```

## API文档

### GET /health

健康检查接口

**响应:**
```json
{
  "status": "healthy",
  "service": "MCP Server",
  "version": "1.0.0",
  "timestamp": "2025-10-19T..."
}
```

### GET /mcp/tools

获取所有可用工具列表

**响应:**
```json
{
  "tools": [
    {
      "name": "generate_story",
      "description": "使用AI生成游戏剧情文本",
      "inputSchema": { ... }
    }
  ]
}
```

### POST /mcp/tools/:toolName

调用MCP工具

**请求体:**
```json
{
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

**响应 (成功):**
```json
{
  "isError": false,
  "content": [
    {
      "type": "text",
      "text": "生成的内容..."
    }
  ]
}
```

**响应 (失败):**
```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "错误信息"
    }
  ]
}
```

## 工具详细说明

### generate_story

生成游戏剧情文本

**参数:**
- `type`: 剧情类型 (adventure | daily | battle | evolution)
- `context`: 剧情上下文对象

**示例:**
```javascript
{
  "type": "adventure",
  "context": {
    "scene": "forest",
    "petId": "pet_123",
    "action": "explore"
  }
}
```

### calculate_evolution

计算进化路径和倾向

**参数:**
- `petId`: 宠物ID
- `behaviors`: 行为记录数组

**示例:**
```javascript
{
  "petId": "pet_123",
  "behaviors": [
    {
      "type": "battle_win",
      "value": 10,
      "timestamp": "2025-10-19T..."
    }
  ]
}
```

**返回:**
```json
{
  "eligible": true,
  "candidates": [
    {
      "path": "warrior",
      "name": "战士形态",
      "probability": 0.85,
      "requirements": ["攻击倾向 ≥ 40%"]
    }
  ],
  "currentTendency": {
    "attack": 0.6,
    "defense": 0.2,
    ...
  }
}
```

### generate_pet_image

生成宠物形象图片

**参数:**
- `prompt`: 图片描述
- `style`: 风格 (shanhaijing | anime | realistic)
- `provider`: 提供商 (vim | dalle | sd)

**示例:**
```javascript
{
  "prompt": "赤焰兽,火属性神兽",
  "style": "shanhaijing",
  "provider": "vim"
}
```

### analyze_behavior

分析宠物行为模式

**参数:**
- `petId`: 宠物ID
- `behaviors`: 行为记录
- `timeRange`: 时间范围(天,默认30)

**返回:**
```json
{
  "statistics": {
    "summary": {
      "battle": 20,
      "exploration": 15,
      ...
    }
  },
  "suggestions": [
    "⚠️ 战斗频率过高,建议增加休息"
  ],
  "evolutionTrend": {
    "trend": "warrior",
    "confidence": 85,
    "description": "战士型发展"
  }
}
```

## 配置说明

### AI API配置

#### 即梦4.0 (推荐)

```env
VIM_API_URL=https://api.vim.com/v1
VIM_API_KEY=your_key_here
```

#### OpenAI DALL-E

```env
OPENAI_API_KEY=sk-...
```

#### Stable Diffusion (本地)

```env
SD_API_URL=http://localhost:7860
```

## 降级策略

所有AI工具都实现了降级策略:

1. **剧情生成**: AI失败 → 本地模板
2. **图片生成**: API失败 → 返回null (前端显示占位符)
3. **进化计算**: 使用固定算法 (不依赖AI)
4. **行为分析**: 本地统计算法

## 日志

日志文件位置:
- `logs/mcp-combined.log` - 所有日志
- `logs/mcp-error.log` - 错误日志

日志级别: `error | warn | info | debug`

## 开发

### 添加新工具

1. 在 `tools/` 创建新文件
2. 导出工具对象:

```javascript
export const myTool = {
  name: 'my_tool',
  description: '工具描述',
  inputSchema: { ... },
  async execute(args) {
    // 实现逻辑
    return [{ type: 'text', text: '结果' }]
  }
}
```

3. 在 `routes/mcpRoutes.js` 注册工具

### 测试

```bash
# 单元测试 (待实现)
npm test

# 手动测试
npm run dev
# 使用curl或Postman测试接口
```

## 性能优化

- 使用缓存减少AI API调用
- 限流防止滥用
- 异步处理长时间任务
- 日志轮转避免磁盘占满

## 安全性

- 验证所有输入参数
- API密钥环境变量管理
- 错误信息不暴露敏感信息
- CORS配置限制来源

## 故障排查

### 工具调用失败

1. 检查日志: `logs/mcp-error.log`
2. 验证API密钥配置
3. 测试网络连接
4. 查看降级是否生效

### 图片生成超时

- 增加timeout配置
- 检查AI服务状态
- 使用本地SD服务

## 后续计划

- [ ] 添加缓存层 (Redis)
- [ ] 实现工具批量调用
- [ ] 支持流式响应
- [ ] 添加监控和告警
- [ ] 完善单元测试

---

**版本**: 1.0.0
**维护者**: 灵境斗宠录开发团队
