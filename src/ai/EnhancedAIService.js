/**
 * 增强AI服务 - 集成批量推理和多模型支持
 * 支持Kimi文本模型、即梦4.0图像模型、DeepSeek批量推理
 */

const AIService = require('./AIService');
const BatchInferenceService = require('./BatchInferenceService');
const EnhancedImageService = require('./EnhancedImageService');
const InferenceRouter = require('./InferenceRouter');
const StoryTreeEngine = require('../game/StoryTreeEngine');
const EnhancedStorySystem = require('../game/EnhancedStorySystem');
const PokemonGrowthSystem = require('../game/PokemonGrowthSystem');
const EvolutionSystem = require('../game/EvolutionSystem');
const SceneImageGenerator = require('./SceneImageGenerator');
const PetAgentSystem = require('../agents/PetAgentSystem');
const PetAgentCore = require('../agents/core/PetAgentCore');
const logger = require('../utils/logger');

class EnhancedAIService extends AIService {
  constructor() {
    super();
    
    // 初始化批量推理服务
    this.batchService = new BatchInferenceService();
    
    // 初始化增强图像服务
    this.imageService = new EnhancedImageService();
    
    // 初始化智能路由器
    this.router = new InferenceRouter(this);
    
    // 初始化剧情树引擎
    this.storyEngine = new StoryTreeEngine(this);
    
    // 初始化增强剧情系统
    this.enhancedStorySystem = new EnhancedStorySystem(this, this.imageService);
    
    // 初始化宝可梦式成长系统
    this.growthSystem = new PokemonGrowthSystem(this);
    
    // 初始化进化系统
    this.evolutionSystem = new EvolutionSystem(this, this.imageService);
    
    // 初始化场景图片生成器
    this.sceneImageGenerator = new SceneImageGenerator(this.imageService);
    
    // 初始化宠物智能体系统
    this.petAgentSystem = new PetAgentSystem(this);
    
    // 初始化宠物智能体核心
    this.petAgentCore = new PetAgentCore(this);
    
    // 更新服务配置 - 继承并扩展基类配置
    this.services = {
      ...this.services, // 保留基类的primary, numerical, creative配置
      
      // Kimi文本模型 (主要用于实时对话和即时响应)
      kimi: {
        apiUrl: process.env.KIMI_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        apiKey: process.env.KIMI_API_KEY || '2ffe7955-a0a1-4238-93cd-d354c2c6d7ec',
        modelName: process.env.KIMI_MODEL || 'kimi-k2-250905'
      },
      
      // 批量推理模型 (用于批量推理和复杂内容生成)
      batch: {
        apiUrl: process.env.BATCH_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        apiKey: process.env.BATCH_API_KEY || '012aef55-5999-4c66-8122-f2cd8e740399',
        modelName: process.env.BATCH_MODEL || 'ep-20250930213449-zkcfw'
      }
    };
    
    // 内容缓存池
    this.contentPool = {
      stories: [],
      personalities: [],
      adventures: [],
      evolutions: []
    };
    
    // 初始化内容池
    this.initializeContentPool();
  }

  /**
   * 初始化内容池
   */
  async initializeContentPool() {
    try {
      logger.info('Initializing content pool...');
      
      // 批量生成故事内容
      logger.info('Batch generating 10 stories');
      const stories = await this.batchService.batchGenerateStories(
        this.generateStoryPrompts(10), 
        { batchSize: 5 }
      );
      this.contentPool.stories = stories.filter(s => s && !s.error);
      
      // 批量生成性格模板
      const personalities = await this.batchService.batchGeneratePersonalities(
        this.generatePersonalityPrompts(30),
        { batchSize: 10 }
      );
      this.contentPool.personalities = personalities.filter(p => p && !p.error);
      
      logger.info(`Content pool initialized: ${this.contentPool.stories.length} stories, ${this.contentPool.personalities.length} personalities`);
      
    } catch (error) {
      logger.error('Failed to initialize content pool:', error);
    }
  }

  /**
   * 生成故事提示词
   */
  generateStoryPrompts(count) {
    const themes = [
      '山海经神兽的奇遇', '昆仑山的秘密', '东海龙宫探险', '九重天宫历险',
      '不周山传说', '建木神树', '蓬莱仙岛', '瑶池盛会', '天庭试炼',
      '神兽守护', '仙境探索', '古老预言', '神器寻找', '元素觉醒'
    ];
    
    const prompts = [];
    for (let i = 0; i < count; i++) {
      const theme = themes[Math.floor(Math.random() * themes.length)];
      prompts.push(`创作一个关于${theme}的山海经风格故事，200字以内，富有神话色彩和想象力。`);
    }
    return prompts;
  }

  /**
   * 生成性格提示词
   */
  generatePersonalityPrompts(count) {
    const traits = [
      '勇敢无畏', '温和善良', '调皮机灵', '沉稳内敛', '热情开朗',
      '神秘莫测', '忠诚守护', '自由奔放', '智慧深邃', '纯真可爱'
    ];
    
    const prompts = [];
    for (let i = 0; i < count; i++) {
      const trait = traits[Math.floor(Math.random() * traits.length)];
      prompts.push(`为${trait}型宠物生成详细的性格描述和行为特征，包含6个维度的分析。`);
    }
    return prompts;
  }

  /**
   * 从内容池获取故事
   */
  getStoryFromPool() {
    if (this.contentPool.stories.length === 0) {
      return "在遥远的山海经世界中，一个新的传说正在开始...";
    }
    
    const index = Math.floor(Math.random() * this.contentPool.stories.length);
    return this.contentPool.stories.splice(index, 1)[0];
  }

  /**
   * 从内容池获取性格描述
   */
  getPersonalityFromPool() {
    if (this.contentPool.personalities.length === 0) {
      return "这是一只拥有独特性格的神秘灵兽...";
    }
    
    const index = Math.floor(Math.random() * this.contentPool.personalities.length);
    return this.contentPool.personalities.splice(index, 1)[0];
  }

  /**
   * 补充内容池
   */
  async refillContentPool() {
    try {
      // 当故事数量少于10个时补充
      if (this.contentPool.stories.length < 10) {
        const newStories = await this.batchService.batchGenerateStories(
          this.generateStoryPrompts(20),
          { batchSize: 5 }
        );
        this.contentPool.stories.push(...newStories.filter(s => s && !s.error));
      }
      
      // 当性格描述少于5个时补充
      if (this.contentPool.personalities.length < 5) {
        const newPersonalities = await this.batchService.batchGeneratePersonalities(
          this.generatePersonalityPrompts(15),
          { batchSize: 5 }
        );
        this.contentPool.personalities.push(...newPersonalities.filter(p => p && !p.error));
      }
      
      logger.info('Content pool refilled successfully');
      
    } catch (error) {
      logger.error('Failed to refill content pool:', error);
    }
  }

  /**
   * 生成宠物形象 - 使用增强图像服务
   */
  async generatePetImage(pet, options = {}) {
    return await this.imageService.generatePetImage(pet, options);
  }

  /**
   * 生成进化对比图
   */
  async generateEvolutionImage(beforePet, afterPet, options = {}) {
    return await this.imageService.generateEvolutionImage(beforePet, afterPet, options);
  }

  /**
   * 生成场景插画
   */
  async generateSceneImage(sceneDescription, options = {}) {
    return await this.imageService.generateSceneImage(sceneDescription, options);
  }

  /**
   * 批量生成宠物图像
   */
  async batchGeneratePetImages(pets, options = {}) {
    return await this.imageService.batchGeneratePetImages(pets, options);
  }

  /**
   * 智能推理路由 - 自动选择最佳推理方式
   */
  async smartInference(scenario, data, options = {}) {
    return await this.router.route(scenario, data, options);
  }

  /**
   * 获取推荐路由信息
   */
  getRecommendedRoute(scenario, data, options = {}) {
    return this.router.getRecommendedRoute(scenario, data, options);
  }

  /**
   * 获取路由统计信息
   */
  getRoutingStats() {
    return this.router.getRoutingStats();
  }

  /**
   * 开始剧情树故事
   */
  async startStory(playerId, storyType, context = {}) {
    return await this.storyEngine.startStory(playerId, storyType, context);
  }

  /**
   * 处理剧情选择
   */
  async makeStoryChoice(playerId, choiceId) {
    return await this.storyEngine.makeChoice(playerId, choiceId);
  }

  /**
   * 获取可用故事
   */
  getAvailableStories(context = {}) {
    return this.storyEngine.getAvailableStories(context);
  }

  /**
   * 获取当前故事状态
   */
  getCurrentStory(playerId) {
    return this.storyEngine.getCurrentStory(playerId);
  }

  /**
   * 增强剧情系统接口
   */
  async startEnhancedStory(playerId, storyType, context = {}) {
    return await this.enhancedStorySystem.startStory(playerId, storyType, context);
  }

  async makeEnhancedChoice(playerId, choiceId) {
    return await this.enhancedStorySystem.makeChoice(playerId, choiceId);
  }

  getCurrentEnhancedStory(playerId) {
    return this.enhancedStorySystem.getCurrentStory(playerId);
  }

  getAllMythicalCreatures() {
    return this.enhancedStorySystem.getAllCreatures();
  }

  /**
   * 添加宠物经验值
   */
  addPetExperience(pet, expGained) {
    return this.growthSystem.addExperience(pet, expGained);
  }

  /**
   * 执行宠物进化
   */
  async evolvePet(pet) {
    return await this.growthSystem.evolve(pet);
  }

  /**
   * 获取宠物完整状态
   */
  getPetStatus(pet) {
    return this.growthSystem.getPetStatus(pet);
  }

  /**
   * 获取升级引导
   */
  getLevelUpGuidance(pet, levelUpResult) {
    return this.growthSystem.getLevelUpGuidance(pet, levelUpResult);
  }

  /**
   * 检查进化可用性
   */
  checkEvolutionAvailability(pet) {
    return this.growthSystem.checkEvolutionAvailability(pet);
  }

  /**
   * 宠物智能体接口 - 三层提示词嵌套处理
   */
  async processPetReaction(petId, situation, playerChoice, environment = {}) {
    return await this.petAgentSystem.processPetReaction(petId, situation, playerChoice, environment);
  }

  /**
   * 执行三层嵌套处理（核心版本）
   */
  async executeThreeLayerProcess(petProfile, situation) {
    return await this.petAgentCore.executeThreeLayerProcess(petProfile, situation);
  }

  /**
   * 获取宠物完整状态
   */
  getPetFullStatus(petId) {
    return this.petAgentSystem.getPetFullStatus(petId);
  }

  /**
   * 重置宠物状态
   */
  resetPetState(petId) {
    this.petAgentSystem.resetPetState(petId);
  }

  /**
   * 获取宠物智能体系统状态
   */
  getPetAgentStatus() {
    return {
      agentSystem: this.petAgentSystem.getSystemStatus(),
      coreSystem: {
        personalityProfiles: Object.keys(this.petAgentCore.personalityProfiles),
        activeProcesses: "运行中"
      }
    };
  }

  /**
   * 获取增强服务状态
   */
  getEnhancedStatus() {
    const baseStatus = this.getStatus();
    const batchStatus = this.batchService.getStatus();
    const imageStatus = this.imageService.getStatus();
    
    return {
      ...baseStatus,
      batch_service: batchStatus,
      image_service: imageStatus,
      routing_stats: this.router.getRoutingStats(),
      content_pool: {
        stories: this.contentPool.stories.length,
        personalities: this.contentPool.personalities.length,
        adventures: this.contentPool.adventures.length,
        evolutions: this.contentPool.evolutions.length
      },
      story_engine: {
        active_stories: this.storyEngine.currentStories.size,
        available_story_types: Object.keys(this.storyEngine.storyTrees).length
      },
      growth_system: {
        max_level: 100,
        evolution_chains: Object.keys(this.growthSystem.evolutionChains).length,
        skill_trees: Object.keys(this.growthSystem.skillTrees).length
      },
      pet_agent_system: this.getPetAgentStatus()
    };
  }

  /**
   * 清理资源
   */
  async cleanup() {
    await this.batchService.cleanup();
    this.imageService.clearCache();
    this.contentPool = { stories: [], personalities: [], adventures: [], evolutions: [] };
    logger.info('EnhancedAIService cleaned up');
  }
}

module.exports = EnhancedAIService;