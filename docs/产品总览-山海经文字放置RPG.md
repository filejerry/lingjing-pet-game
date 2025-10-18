# 产品总览：山海经主题文字放置RPG（灵境斗宠录）

## 愿景
以文字为核心的沉浸式放置养成体验，像与大模型持续对话：对象是宠物与世界。玩家通过日常、奇遇、战斗与进化，解锁庞大的“山海经”架空世界。

## 核心循环
召唤/生成 → 演出（冒险/日常/战斗） → 累积（exp/bond/items） → 进化候选 → 决策 → 新形态/新剧情 → 重复。

## 信息呈现
- 中心：只呈现持续文字演出（逐行出现、自动滚动）。
- 右上角面板：宠物信息、状态、任务、道具；点击展开查看。
- 场景氛围：scene-aura 条纹层，随剧情通过 setSceneVisuals(key) 切换。

## 三层AI + 固定算法
- L1 记录层：行为/事件/战斗日志，时间衰减权重。
- L2 倾向层：进化倾向计算（攻/防/治愈/元素/神性/堕落/速度/智性等），冲突解决与概率控制。
- L3 决策层：合法性校验与固化（稀有度/属性边界/词条约束），固定算法兜底。
- 输出结构统一：{ text, deltas, meta, candidates?, outcome? }

## 提示词模板（文本生成为主）
场景模板（用于演出文本与氛围描述）
角色：你是“山海经灵境”的世界叙事器，渲染文字放置RPG的场景氛围。
输入示例：区域=火山边缘；天气=微风；时间=黄昏；要素=岩浆脉动、红色云纹；情绪=紧张。
输出：
- 场景标题
- 氛围描述（两段）
- 环境线索（3-5条，简短）
- 交互提示词（供续写）

宠物模板（文字形象与数值框架）
角色：你是“山海经灵宠描述器”。
输入示例：物种=时灵；稀有=N；属性=梦境/缚；性格=沉静；场景=火山边缘。
输出：
- 名称与别称
- 简述（2段）
- 关键词条（5-7个）
- 五维属性范围（hp/atk/def/speed/magic）
- 可视化提示词（SD风格短句，供需要时生成图）
- 进化倾向（2-3条）
- 剧情续写提示词
约束：不出现现代物件；符合山海经奇诡美学。

## 场景氛围规范
HTML/JS：提供 setSceneVisuals(key) 切换氛围
映射：
- volcano → ['rgba(255,60,60,0.14)','rgba(255,140,0,0.12)']
- sky     → ['rgba(70,140,255,0.12)','rgba(160,120,255,0.10)']
- forest  → ['rgba(60,200,120,0.10)','rgba(40,120,80,0.12)']
- desert  → ['rgba(240,200,120,0.12)','rgba(200,160,80,0.10)']

调用时机建议：
- startAdventure 开场按地区设定，如森林/火山
- triggerDaily 固定为 camp/forest
- triggerBattle 根据对手或场域设定

## 接口约定（占位→真实化）
- POST /api/adventure/text-event → { text, deltas, meta }
- POST /api/daily/tick → { text, deltas, meta }
- POST /api/battle/match|resolve → { text, deltas, meta }
- POST /api/progress/apply → { eligible, candidates?, deltas, text }
- POST /api/story/next → { text, meta }
- POST /api/story-agent/preview → { story: { text }, meta }
- GET/POST /api/media/pet-image?provider=vim&prompt=... → 图片或失败回退文本

## 前端约定
- 事件委托：在 #storyContent 捕获 <a data-action> 点击，不跳转，仅触发函数。
- 中心只渲染文本（showStoryLines/WithClasses），自动滚动到最新。
- 面板负责信息展示：宠物信息、状态、任务、道具。

## 里程碑
- 迭代02：自动场景氛围切换、提示词接入即梦4.0、输出结构统一
- 迭代03：三层AI倾向/决策与固定算法融合、进化/剧情路线提示词植入
- 迭代04：多宠编队与战斗演出、任务/道具真实化、日志与监控