# AI推理场景分类指南

## 🚀 即时推理场景 (Realtime Inference)

### 使用模型：Kimi (`kimi-k2-250905`)
### 响应时间：< 3秒
### 适用场景：

#### 1. 玩家直接交互
- **player_chat** - 玩家与宠物对话
- **pet_interaction** - 宠物互动响应
- **quick_question** - 快速问答
- **battle_reaction** - 战斗中的即时反应
- **immediate_feedback** - 操作后的即时反馈
- **tutorial_guidance** - 新手教程指导
- **emergency_help** - 紧急帮助请求

#### 2. 游戏状态响应
- **pet_status_check** - 宠物状态查询
- **inventory_query** - 背包物品查询
- **achievement_unlock** - 成就解锁庆祝
- **level_up_celebration** - 升级庆祝动画
- **error_explanation** - 错误信息解释
- **system_notification** - 系统通知响应

#### 3. 图像即时生成
- **pet_avatar_request** - 玩家主动请求宠物头像
- **evolution_preview** - 进化效果预览
- **customization_preview** - 自定义外观预览
- **battle_scene_capture** - 战斗场景截图
- **achievement_badge** - 成就徽章生成
- **special_moment_capture** - 特殊时刻记录

### 使用示例：
```javascript
// 玩家与宠物对话
const response = await aiService.smartInference('player_chat', {
  prompt: "我的宠物今天心情怎么样？",
  context: { petData: currentPet, playerData: currentPlayer },
  petData: currentPet
});

// 即时生成宠物头像
const avatar = await aiService.smartInference('pet_avatar_request', {
  type: 'pet_image',
  petData: currentPet
}, { forceImage: true });
```

---

## 🔄 批量推理场景 (Batch Inference)

### 使用模型：DeepSeek (`ep-bi-20250930180557-kb2f9`)
### 响应时间：30秒 - 30分钟
### 适用场景：

#### 1. 内容预生成
- **story_pool_refill** - 故事池内容补充
- **personality_templates** - 宠物性格模板生成
- **adventure_scenarios** - 冒险场景批量生成
- **evolution_descriptions** - 进化描述预生成
- **dialogue_variations** - 对话变体批量生成
- **world_lore_expansion** - 世界观内容扩展

#### 2. 数据分析处理
- **player_behavior_analysis** - 玩家行为模式分析
- **pet_growth_patterns** - 宠物成长规律分析
- **game_balance_optimization** - 游戏平衡性优化建议
- **content_popularity_analysis** - 内容受欢迎度分析
- **seasonal_event_planning** - 季节性活动规划
- **meta_game_insights** - 元游戏数据洞察

#### 3. 批量图像生成
- **pet_species_gallery** - 宠物种族图鉴批量生成
- **evolution_chain_images** - 完整进化链图像
- **environment_backgrounds** - 环境背景图批量生成
- **item_icon_generation** - 游戏物品图标批量生成
- **ui_element_creation** - UI界面元素批量创建
- **promotional_materials** - 宣传素材批量制作

### 使用示例：
```javascript
// 批量生成故事内容
const stories = await aiService.smartInference('story_pool_refill', {
  prompts: storyPrompts,
  type: 'stories',
  batchSize: 50
});

// 批量生成宠物图鉴
const gallery = await aiService.smartInference('pet_species_gallery', {
  type: 'batch_pets',
  petData: allPetSpecies
}, { forceBatch: true });
```

---

## 🎨 图像专用推理 (Image Inference)

### 使用模型：即梦4.0 (`ep-20250930175835-vxgn4`)
### 响应时间：15-30秒
### 适用场景：

#### 1. 高质量宠物形象
- **pet_portrait** - 宠物肖像画
- **pet_action_pose** - 宠物动作姿态
- **pet_emotion_expression** - 宠物情感表达
- **pet_battle_stance** - 宠物战斗姿态

#### 2. 进化可视化
- **evolution_comparison** - 进化前后对比
- **evolution_process** - 进化过程动画帧
- **evolution_celebration** - 进化庆祝场景

#### 3. 场景环境
- **shanhaijing_landscapes** - 山海经风景
- **mystical_environments** - 神秘环境背景
- **battle_arenas** - 战斗竞技场
- **peaceful_habitats** - 宠物栖息地

### 使用示例：
```javascript
// 生成进化对比图
const evolutionImage = await aiService.smartInference('evolution_comparison', {
  type: 'evolution_image',
  petData: { before: currentPet, after: evolvedPet }
});

// 生成山海经场景
const landscape = await aiService.smartInference('shanhaijing_landscapes', {
  type: 'scene_image',
  sceneDescription: "昆仑山巅，云雾缭绕，神兽栖息"
});
```

---

## 🤖 智能路由使用

### 自动路由
系统会根据场景名称自动选择最合适的推理方式：

```javascript
// 系统自动判断使用即时推理
const chatResponse = await aiService.smartInference('player_chat', data);

// 系统自动判断使用批量推理
const batchStories = await aiService.smartInference('story_pool_refill', data);

// 系统自动判断使用图像推理
const petImage = await aiService.smartInference('pet_avatar_request', data);
```

### 强制指定路由
```javascript
// 强制使用即时推理
const response = await aiService.smartInference('custom_scenario', data, { 
  forceRealtime: true 
});

// 强制使用批量推理
const batchResult = await aiService.smartInference('custom_scenario', data, { 
  forceBatch: true 
});

// 强制使用图像推理
const imageResult = await aiService.smartInference('custom_scenario', data, { 
  forceImage: true 
});
```

### 获取路由建议
```javascript
// 获取推荐的路由方式
const recommendation = aiService.getRecommendedRoute('player_chat', data);
console.log(recommendation);
// {
//   route: { type: 'realtime', model: 'kimi', priority: 'HIGH' },
//   estimatedTime: 2000,
//   estimatedCost: 0.01,
//   recommendation: ['当前路由配置最优']
// }
```

---

## 📊 性能监控

### 获取路由统计
```javascript
const stats = aiService.getRoutingStats();
console.log(stats);
// {
//   routingRules: ['realtime', 'batch'],
//   performanceMetrics: {
//     realtime: { requests: 150, avgResponseTime: 1800, errors: 2 },
//     batch: { requests: 25, avgResponseTime: 45000, errors: 0 },
//     image: { requests: 30, avgResponseTime: 22000, errors: 1 }
//   },
//   totalRequests: 205,
//   totalErrors: 3,
//   averageResponseTimes: {
//     realtime: 1800,
//     batch: 45000,
//     image: 22000
//   }
// }
```

---

## 💡 最佳实践

### 1. 场景命名规范
- 使用下划线分隔的英文名称
- 包含明确的动作或目标
- 避免模糊或通用的名称

### 2. 数据结构规范
```javascript
// 即时推理数据结构
{
  prompt: "用户输入或系统提示",
  context: { /* 上下文信息 */ },
  petData: { /* 宠物数据 */ }
}

// 批量推理数据结构
{
  prompts: ["提示1", "提示2", ...],
  type: "stories|personalities|adventures|evolutions",
  batchSize: 50
}

// 图像推理数据结构
{
  type: "pet_image|evolution_image|scene_image|batch_pets",
  petData: { /* 宠物数据或宠物数组 */ },
  sceneDescription: "场景描述"
}
```

### 3. 错误处理
```javascript
try {
  const result = await aiService.smartInference(scenario, data, options);
  // 处理成功结果
} catch (error) {
  // 处理错误，可能需要降级到其他推理方式
  console.error('推理失败:', error);
}
```

### 4. 成本优化
- 优先使用批量推理处理非紧急任务
- 合理设置批量大小，避免单次请求过大
- 使用缓存减少重复的图像生成请求
- 定期清理过期的预生成内容