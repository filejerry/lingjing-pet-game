/**
 * 宠物图像进化系统
 * 管理宠物形象展示、进化图片生成和抽卡迭代机制
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ImageEvolutionSystem {
  constructor(aiService, database) {
    this.aiService = aiService;
    this.database = database;
    
    // 图像展示规则
    this.imageRules = {
      // 幼年期前不显示图像，用黑暗占位
      showImageMinLevel: 5,
      
      // 免费重新生成次数
      freeRegenerationLimit: 80,
      
      // 付费重新生成价格（虚拟货币）
      paidRegenerationCost: 100,
      
      // 进化触发图像生成
      evolutionTriggerLevels: [5, 15, 25, 40, 60, 80]
    };

    // 固定提示词模板
    this.basePromptTemplates = {
      // 基础风格提示词
      baseStyle: "奇幻艺术风格，高质量数字绘画，专业级插画，色彩丰富，光影效果真实",
      
      // 质量提升词
      qualityEnhancers: "精美细节，构图完美，质感真实，艺术感强烈，视觉冲击力",
      
      // 环境背景
      environments: {
        natural: "自然环境背景，森林草原，阳光透过树叶",
        mystical: "神秘环境背景，魔法光芒，古老遗迹",
        elemental: "元素环境背景，对应属性的自然场景",
        evolution: "进化光效背景，能量涌动，神圣光芒"
      }
    };
  }

  /**
   * 检查是否应该显示宠物图像
   */
  shouldShowImage(pet) {
    const level = pet.level || 1;
    return level >= this.imageRules.showImageMinLevel;
  }

  /**
   * 获取宠物当前显示状态
   */
  async getPetDisplayStatus(petId) {
    try {
      const pet = await this.database.get('SELECT * FROM pets WHERE id = ?', [petId]);
      if (!pet) {
        throw new Error('Pet not found');
      }

      const shouldShow = this.shouldShowImage(pet);
      
      if (!shouldShow) {
        return {
          showImage: false,
          displayType: 'darkness',
          message: '你的宠物还在成长中，请耐心等待它的真容显现...',
          darknessSvg: this.generateDarknessSvg(pet.name)
        };
      }

      // 获取最新的图像记录
      const latestImage = await this.database.get(`
        SELECT * FROM pet_images 
        WHERE pet_id = ? 
        ORDER BY generated_at DESC 
        LIMIT 1
      `, [petId]);

      return {
        showImage: true,
        displayType: 'image',
        imageData: latestImage,
        canRegenerate: await this.canRegenerateImage(petId)
      };

    } catch (error) {
      logger.error(`Failed to get pet display status for ${petId}:`, error);
      return {
        showImage: false,
        displayType: 'error',
        message: '获取宠物状态失败'
      };
    }
  }

  /**
   * 生成黑暗占位图
   */
  generateDarknessSvg(petName = '神秘宠物') {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="darkness" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1a1a2e" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#16213e" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0f0f23" stop-opacity="1"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- 黑暗背景 -->
  <rect width="400" height="400" fill="url(#darkness)"/>
  
  <!-- 神秘光点 -->
  <circle cx="200" cy="180" r="2" fill="#4a90e2" opacity="0.6" filter="url(#glow)">
    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="220" cy="200" r="1.5" fill="#7b68ee" opacity="0.5" filter="url(#glow)">
    <animate attributeName="opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="180" cy="210" r="1" fill="#9370db" opacity="0.4" filter="url(#glow)">
    <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  
  <!-- 神秘轮廓暗示 -->
  <ellipse cx="200" cy="250" rx="40" ry="20" fill="none" stroke="#2c3e50" stroke-width="1" opacity="0.3">
    <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite"/>
  </ellipse>
  
  <!-- 文字提示 -->
  <text x="200" y="320" font-family="Microsoft YaHei, sans-serif" font-size="16" 
        fill="#6c7b7f" text-anchor="middle" opacity="0.8">
    ${petName}
  </text>
  <text x="200" y="340" font-family="Microsoft YaHei, sans-serif" font-size="12" 
        fill="#4a5568" text-anchor="middle" opacity="0.6">
    成长中...
  </text>
</svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * 检查是否可以重新生成图像
   */
  async canRegenerateImage(petId) {
    try {
      // 获取重新生成记录
      const regenCount = await this.database.get(`
        SELECT COUNT(*) as count FROM pet_image_regenerations 
        WHERE pet_id = ? AND created_at > datetime('now', '-30 days')
      `, [petId]);

      const usedCount = regenCount?.count || 0;
      const remainingFree = Math.max(0, this.imageRules.freeRegenerationLimit - usedCount);

      return {
        canRegenerate: true,
        remainingFree: remainingFree,
        needsPaid: remainingFree === 0,
        paidCost: this.imageRules.paidRegenerationCost
      };

    } catch (error) {
      logger.error(`Failed to check regeneration status for pet ${petId}:`, error);
      return {
        canRegenerate: false,
        remainingFree: 0,
        needsPaid: true,
        paidCost: this.imageRules.paidRegenerationCost
      };
    }
  }

  /**
   * 触发进化图像生成
   */
  async triggerEvolutionImage(petId, evolutionData) {
    try {
      logger.info(`Triggering evolution image generation for pet: ${petId}`);

      const pet = await this.database.get('SELECT * FROM pets WHERE id = ?', [petId]);
      if (!pet) {
        throw new Error('Pet not found');
      }

      // 检查是否达到显示图像的等级
      if (!this.shouldShowImage(pet)) {
        logger.info(`Pet ${petId} level ${pet.level} not ready for image display`);
        return {
          success: false,
          reason: 'level_too_low',
          message: '宠物等级不足，暂不显示图像'
        };
      }

      // 构建进化图像提示词
      const evolutionPrompt = await this.buildEvolutionImagePrompt(pet, evolutionData);
      
      // 生成图像
      const imageResult = await this.aiService.generatePetImage(pet, {
        style: 'fantasy',
        environment: 'evolution',
        size: '2K',
        evolutionPrompt: evolutionPrompt
      });

      // 保存图像记录
      await this.database.run(`
        INSERT INTO pet_images (
          pet_id, image_url, prompt, style, environment, size, 
          generation_type, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        petId,
        imageResult.imageUrl,
        evolutionPrompt,
        'fantasy',
        'evolution',
        '2K',
        'evolution',
        new Date().toISOString()
      ]);

      // 记录进化事件
      await this.database.run(`
        INSERT INTO system_events (
          event_type, description, details
        ) VALUES (?, ?, ?)
      `, [
        'EVOLUTION_IMAGE_GENERATED',
        `Pet ${pet.name} evolution image generated`,
        JSON.stringify({ petId, evolutionData, imageUrl: imageResult.imageUrl })
      ]);

      return {
        success: true,
        imageResult: imageResult,
        message: '进化图像生成成功！'
      };

    } catch (error) {
      logger.error(`Failed to trigger evolution image for pet ${petId}:`, error);
      return {
        success: false,
        reason: 'generation_failed',
        message: '图像生成失败，请稍后重试'
      };
    }
  }

  /**
   * 构建进化图像提示词
   */
  async buildEvolutionImagePrompt(pet, evolutionData) {
    // 获取宠物的人格档案（如果有）
    let personaContext = '';
    try {
      const persona = await this.database.get(`
        SELECT profile_data FROM pet_personas WHERE pet_id = ?
      `, [pet.id]);
      
      if (persona) {
        const profile = JSON.parse(persona.profile_data);
        personaContext = `人格特征：${profile.behaviorTraits?.uniqueIdentifier || ''}，${profile.coreIdentity?.emotionalMode || ''}`;
      }
    } catch (error) {
      logger.warn('Failed to get persona context for image generation');
    }

    // 获取互动历史影响的提示词增强
    const interactionEnhancements = await this.getInteractionBasedEnhancements(pet.id);

    // 构建完整提示词
    let prompt = `${pet.race || '神秘生物'}，${pet.attribute || '中性'}属性`;
    
    if (pet.specialWord) {
      prompt += `，${pet.specialWord}特质`;
    }

    // 添加进化相关描述
    if (evolutionData) {
      prompt += `，正在进化为${evolutionData.targetForm || '更强形态'}`;
      if (evolutionData.newAbilities) {
        prompt += `，获得${evolutionData.newAbilities.join('、')}能力`;
      }
    }

    // 添加人格特征
    if (personaContext) {
      prompt += `，${personaContext}`;
    }

    // 添加互动增强
    if (interactionEnhancements) {
      prompt += `，${interactionEnhancements}`;
    }

    // 添加基础风格和质量词
    prompt += `，${this.basePromptTemplates.baseStyle}`;
    prompt += `，${this.basePromptTemplates.environments.evolution}`;
    prompt += `，${this.basePromptTemplates.qualityEnhancers}`;

    // 添加进化特效
    prompt += '，进化光效环绕，能量粒子飞舞，神圣进化光芒，史诗级视觉效果';

    return prompt;
  }

  /**
   * 获取基于互动的提示词增强
   */
  async getInteractionBasedEnhancements(petId) {
    try {
      // 获取最近的互动记录
      const recentInteractions = await this.database.all(`
        SELECT action_type, action_target FROM pet_behaviors 
        WHERE pet_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 10
      `, [petId]);

      if (recentInteractions.length === 0) {
        return '';
      }

      // 分析互动模式
      const interactionTypes = {};
      recentInteractions.forEach(interaction => {
        const type = interaction.action_type;
        interactionTypes[type] = (interactionTypes[type] || 0) + 1;
      });

      // 生成增强描述
      const enhancements = [];
      
      if (interactionTypes.feed > 3) {
        enhancements.push('营养充足，体态健康');
      }
      if (interactionTypes.train > 3) {
        enhancements.push('训练有素，肌肉发达');
      }
      if (interactionTypes.explore > 3) {
        enhancements.push('经验丰富，眼神睿智');
      }
      if (interactionTypes.adventure > 2) {
        enhancements.push('冒险精神，姿态勇敢');
      }

      return enhancements.join('，');

    } catch (error) {
      logger.warn('Failed to get interaction enhancements:', error);
      return '';
    }
  }

  /**
   * 重新生成宠物图像（抽卡机制）
   */
  async regeneratePetImage(petId, options = {}) {
    try {
      logger.info(`Regenerating image for pet: ${petId}`);

      // 检查重新生成权限
      const regenStatus = await this.canRegenerateImage(petId);
      if (!regenStatus.canRegenerate) {
        return {
          success: false,
          reason: 'no_permission',
          message: '无法重新生成图像'
        };
      }

      // 检查是否需要付费
      if (regenStatus.needsPaid && !options.isPaid) {
        return {
          success: false,
          reason: 'payment_required',
          message: `需要支付 ${regenStatus.paidCost} 虚拟币来重新生成`,
          cost: regenStatus.paidCost
        };
      }

      const pet = await this.database.get('SELECT * FROM pets WHERE id = ?', [petId]);
      if (!pet) {
        throw new Error('Pet not found');
      }

      // 生成新的图像变体
      const variations = await this.generateImageVariations(pet, options.variationCount || 3);

      // 记录重新生成
      await this.database.run(`
        INSERT INTO pet_image_regenerations (
          pet_id, variation_count, is_paid, cost, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        petId,
        variations.length,
        options.isPaid ? 1 : 0,
        options.isPaid ? regenStatus.paidCost : 0,
        new Date().toISOString()
      ]);

      return {
        success: true,
        variations: variations,
        message: '图像变体生成成功！请选择你喜欢的版本'
      };

    } catch (error) {
      logger.error(`Failed to regenerate image for pet ${petId}:`, error);
      return {
        success: false,
        reason: 'generation_failed',
        message: '重新生成失败，请稍后重试'
      };
    }
  }

  /**
   * 生成图像变体
   */
  async generateImageVariations(pet, count = 3) {
    const variations = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // 为每个变体添加不同的风格调整
        const styleVariations = [
          { style: 'fantasy', environment: 'natural', mood: '温和' },
          { style: 'fantasy', environment: 'mystical', mood: '神秘' },
          { style: 'fantasy', environment: 'elemental', mood: '强烈' }
        ];
        
        const variation = styleVariations[i % styleVariations.length];
        
        const imageResult = await this.aiService.generatePetImage(pet, {
          ...variation,
          size: '2K',
          seed: Date.now() + i // 确保每次生成不同
        });

        variations.push({
          id: uuidv4(),
          imageUrl: imageResult.imageUrl,
          style: variation.style,
          environment: variation.environment,
          mood: variation.mood,
          prompt: imageResult.prompt
        });

        // 变体间延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.warn(`Failed to generate variation ${i + 1}:`, error);
      }
    }

    return variations;
  }

  /**
   * 选择并应用图像变体
   */
  async selectImageVariation(petId, variationId, variations) {
    try {
      const selectedVariation = variations.find(v => v.id === variationId);
      if (!selectedVariation) {
        throw new Error('Variation not found');
      }

      // 保存选中的图像
      await this.database.run(`
        INSERT INTO pet_images (
          pet_id, image_url, prompt, style, environment, size,
          generation_type, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        petId,
        selectedVariation.imageUrl,
        selectedVariation.prompt,
        selectedVariation.style,
        selectedVariation.environment,
        '2K',
        'regeneration',
        new Date().toISOString()
      ]);

      return {
        success: true,
        selectedImage: selectedVariation,
        message: '图像选择成功！'
      };

    } catch (error) {
      logger.error(`Failed to select image variation for pet ${petId}:`, error);
      return {
        success: false,
        message: '图像选择失败'
      };
    }
  }

  /**
   * 获取宠物图像历史
   */
  async getPetImageHistory(petId, limit = 10) {
    try {
      const images = await this.database.all(`
        SELECT * FROM pet_images 
        WHERE pet_id = ? 
        ORDER BY generated_at DESC 
        LIMIT ?
      `, [petId, limit]);

      return {
        success: true,
        images: images,
        count: images.length
      };

    } catch (error) {
      logger.error(`Failed to get image history for pet ${petId}:`, error);
      return {
        success: false,
        images: [],
        count: 0
      };
    }
  }
}

module.exports = ImageEvolutionSystem;