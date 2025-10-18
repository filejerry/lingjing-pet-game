/**
 * 增强图像生成服务 - 即梦4.0即时推理
 * 支持高质量宠物形象生成和场景渲染
 */

const axios = require('axios');
const logger = require('../utils/logger');

class EnhancedImageService {
  constructor() {
    this.config = {
      apiKey: process.env.AI_IMAGE_API_KEY || "4b24c728-0bd9-4e0c-9a96-670f03a458cb",
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      model: process.env.AI_IMAGE_MODEL || "ep-20250930175835-vxgn4",
      timeout: 60000 // 图像生成需要更长时间
    };
    
    this.imageCache = new Map();
    this.requestCount = 0;
    this.maxRequestsPerHour = 500; // 图像生成限制更严格
  }

  /**
   * 生成宠物形象 - 山海经风格
   */
  async generatePetImage(pet, options = {}) {
    try {
      logger.info(`Generating pet image for ${pet.name || pet.species}`);
      
      // 构建山海经风格的提示词
      const prompt = this.buildShanHaiJingPrompt(pet, options);
      
      const response = await this.callImageAPI(prompt, {
        size: options.size || "2K",
        watermark: options.watermark !== false,
        sequential_image_generation: "disabled",
        response_format: "url",
        stream: false
      });

      const imageUrl = response.data[0].url;
      
      // 缓存结果
      const cacheKey = this.generateCacheKey(pet, options);
      this.imageCache.set(cacheKey, {
        url: imageUrl,
        prompt: prompt,
        createdAt: new Date().toISOString()
      });

      logger.info(`Pet image generated successfully: ${imageUrl}`);
      
      return {
        imageUrl: imageUrl,
        prompt: prompt,
        petName: pet.name || pet.species,
        style: 'shanhaijing',
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Pet image generation failed:`, error);
      throw error;
    }
  }

  /**
   * 构建山海经风格提示词
   */
  buildShanHaiJingPrompt(pet, options = {}) {
    const species = pet.species || pet.race || '神秘灵兽';
    const attribute = pet.attribute || '未知';
    const special = pet.special || pet.specialWord || '';
    const rarity = pet.rarity || 'N';
    
    // 山海经风格基础描述
    let prompt = `山海经神话风格，${species}`;
    
    // 添加属性特效
    const attributeEffects = {
      '火': '烈焰缭绕，火光冲天，熔岩纹理，炽热光芒',
      '冰': '寒霜覆盖，冰晶闪烁，雪花飞舞，冷冽气息',
      '雷': '雷电环绕，电光闪烁，紫色能量，雷鸣之力',
      '风': '风流可视，气旋环绕，青色光芒，轻盈飘逸',
      '土': '岩石纹理，大地之力，棕黄色调，厚重稳固',
      '水': '水流环绕，波光粼粼，蓝色光泽，灵动柔美',
      '光': '圣光普照，金色光环，神圣气息，光芒万丈',
      '暗': '暗影缭绕，紫黑色调，神秘气息，深邃幽暗',
      '木': '藤蔓缠绕，绿叶飞舞，生机盎然，自然之力',
      '金': '金光闪闪，锐利光芒，金属质感，坚硬锋利'
    };
    
    // 根据属性添加特效
    const effectKey = Object.keys(attributeEffects).find(key => attribute.includes(key));
    if (effectKey) {
      prompt += `，${attributeEffects[effectKey]}`;
    }
    
    // 添加特殊词汇
    if (special) {
      prompt += `，${special}特质`;
    }
    
    // 根据稀有度调整画质和特效
    const rarityEffects = {
      'LEGEND': '传说级神兽，天地异象，神光普照，威震山海，史诗级视觉效果，4K超高清',
      'SSS': '上古神兽，神话传说，光芒万丈，威严无比，极致视觉效果，超高清画质',
      'SSR': '稀世神兽，灵光闪烁，气势磅礴，华丽特效，高清画质',
      'SR': '珍稀灵兽，光影交错，优雅姿态，精美特效',
      'R': '灵性生物，微光环绕，灵动可爱',
      'N': '普通灵兽，自然朴素'
    };
    
    prompt += `，${rarityEffects[rarity] || rarityEffects.N}`;
    
    // 添加山海经特色环境
    const environments = [
      '昆仑山巅，云雾缭绕',
      '蓬莱仙岛，仙气飘渺',
      '九重天宫，金光闪闪',
      '东海之滨，波涛汹涌',
      '不周山下，神秘莫测',
      '建木神树，枝叶繁茂'
    ];
    
    const environment = options.environment || environments[Math.floor(Math.random() * environments.length)];
    prompt += `，背景：${environment}`;
    
    // 添加艺术风格
    prompt += '，中国古典神话风格，工笔画技法，色彩绚丽，构图完美，光影效果，质感真实';
    prompt += '，概念艺术，数字绘画，专业级作品，细节丰富，层次分明';
    
    // 添加视觉增强
    prompt += '，强烈视觉冲击力，电影大片质感，动感十足，对比色彩，OC渲染，光线追踪';
    prompt += '，景深效果，超现实主义，细腻色彩层次，艺术幻想感，极致光影效果';
    
    return prompt;
  }

  /**
   * 生成进化对比图
   */
  async generateEvolutionImage(beforePet, afterPet, options = {}) {
    try {
      logger.info(`Generating evolution comparison image`);
      
      const prompt = this.buildEvolutionPrompt(beforePet, afterPet, options);
      
      const response = await this.callImageAPI(prompt, {
        size: options.size || "2K",
        watermark: options.watermark !== false,
        sequential_image_generation: "disabled",
        response_format: "url",
        stream: false
      });

      const imageUrl = response.data[0].url;
      
      logger.info(`Evolution image generated successfully: ${imageUrl}`);
      
      return {
        imageUrl: imageUrl,
        prompt: prompt,
        evolutionType: 'comparison',
        beforePet: beforePet.name || beforePet.species,
        afterPet: afterPet.name || afterPet.species,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Evolution image generation failed:`, error);
      throw error;
    }
  }

  /**
   * 构建进化对比提示词
   */
  buildEvolutionPrompt(beforePet, afterPet, options = {}) {
    const beforeDesc = `${beforePet.species || beforePet.race}，${beforePet.attribute || ''}属性`;
    const afterDesc = `${afterPet.species || afterPet.race}，${afterPet.attribute || ''}属性`;
    
    let prompt = `山海经神话风格，灵兽进化过程，左右对比构图`;
    prompt += `，左侧：${beforeDesc}，右侧：${afterDesc}`;
    prompt += '，中间：进化光效，能量流转，神光闪烁，变化过程';
    prompt += '，进化能量特效，光芒四射，神圣进化，史诗级视觉效果';
    prompt += '，强烈视觉冲击力，电影大片质感，动感十足，对比色彩';
    prompt += '，中国古典神话风格，工笔画技法，色彩绚丽，构图完美';
    prompt += '，概念艺术，数字绘画，专业级作品，4K超高清画质';
    
    return prompt;
  }

  /**
   * 生成场景插画
   */
  async generateSceneImage(sceneDescription, options = {}) {
    try {
      logger.info(`Generating scene image: ${sceneDescription}`);
      
      const prompt = this.buildScenePrompt(sceneDescription, options);
      
      const response = await this.callImageAPI(prompt, {
        size: options.size || "2K",
        watermark: options.watermark !== false,
        sequential_image_generation: "disabled",
        response_format: "url",
        stream: false
      });

      const imageUrl = response.data[0].url;
      
      logger.info(`Scene image generated successfully: ${imageUrl}`);
      
      return {
        imageUrl: imageUrl,
        prompt: prompt,
        sceneType: 'environment',
        description: sceneDescription,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Scene image generation failed:`, error);
      throw error;
    }
  }

  /**
   * 构建场景提示词
   */
  buildScenePrompt(sceneDescription, options = {}) {
    let prompt = `山海经神话风格场景，${sceneDescription}`;
    prompt += '，中国古典神话风格，工笔画技法，色彩绚丽，构图完美';
    prompt += '，神秘氛围，仙气缭绕，光影效果，质感真实';
    prompt += '，概念艺术，数字绘画，专业级作品，细节丰富';
    prompt += '，强烈视觉冲击力，电影大片质感，对比色彩，OC渲染';
    prompt += '，光线追踪，景深效果，超现实主义，艺术幻想感';
    
    return prompt;
  }

  /**
   * 批量生成宠物图像
   */
  async batchGeneratePetImages(pets, options = {}) {
    const results = [];
    const batchSize = 3; // 图像生成并发限制
    
    for (let i = 0; i < pets.length; i += batchSize) {
      const batch = pets.slice(i, i + batchSize);
      const batchPromises = batch.map(pet => 
        this.generatePetImage(pet, options).catch(error => ({
          error: error.message,
          petName: pet.name || pet.species
        }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => 
        r.status === 'fulfilled' ? r.value : r.reason
      ));
      
      // 批次间延迟
      if (i + batchSize < pets.length) {
        await this.delay(3000);
      }
    }
    
    return results;
  }

  /**
   * 调用图像生成API
   */
  async callImageAPI(prompt, options = {}) {
    if (this.requestCount >= this.maxRequestsPerHour) {
      throw new Error('图像生成API调用次数已达上限');
    }

    const requestData = {
      model: this.config.model,
      prompt: prompt,
      sequential_image_generation: options.sequential_image_generation || "disabled",
      response_format: options.response_format || "url",
      size: options.size || "2K",
      stream: options.stream || false,
      watermark: options.watermark !== false
    };

    const response = await axios.post(
      `${this.config.baseUrl}/images/generate`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout,
        proxy: false,
        httpsAgent: new (require('https').Agent)({ keepAlive: true })
      }
    );

    if (!response.data || !response.data.data || !response.data.data[0]) {
      throw new Error('Invalid response format from image generation API');
    }

    this.requestCount++;
    return response.data;
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(pet, options) {
    const petKey = `${pet.name || pet.species}_${pet.attribute || ''}_${pet.rarity || ''}`;
    const optionsKey = JSON.stringify(options);
    return `${petKey}_${optionsKey}`.replace(/\s+/g, '_');
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      service: 'EnhancedImageService',
      model: this.config.model,
      apiUrl: `${this.config.baseUrl}/images/generate`,
      configured: !!(this.config.apiKey && this.config.baseUrl),
      requestCount: this.requestCount,
      remainingRequests: this.maxRequestsPerHour - this.requestCount,
      cacheSize: this.imageCache.size
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.imageCache.clear();
    logger.info('Image cache cleared');
  }

  /**
   * 重置请求计数
   */
  resetRequestCount() {
    this.requestCount = 0;
    logger.info('Image request count reset');
  }
}

module.exports = EnhancedImageService;