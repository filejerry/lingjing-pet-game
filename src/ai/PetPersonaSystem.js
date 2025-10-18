/**
 * 立体宠物人格构建系统 (PERSONA)
 * 基于六维人格模型构建深度宠物角色
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PetPersonaSystem {
  constructor(aiService, database) {
    this.aiService = aiService;
    this.database = database;
    
    // 人格构建模板
    this.personaTemplate = this.initPersonaTemplate();
    
    // 进化阶段定义
    this.evolutionStages = {
      'egg': { name: '蛋期', showImage: false, minLevel: 0 },
      'infant': { name: '幼体期', showImage: false, minLevel: 1 },
      'juvenile': { name: '幼年期', showImage: true, minLevel: 5 },
      'adolescent': { name: '少年期', showImage: true, minLevel: 15 },
      'adult': { name: '成年期', showImage: true, minLevel: 25 },
      'elder': { name: '长老期', showImage: true, minLevel: 40 },
      'legendary': { name: '传说期', showImage: true, minLevel: 60 }
    };
  }

  /**
   * 初始化人格构建模板
   */
  initPersonaTemplate() {
    return {
      // 1. 宠物核心标识
      coreIdentity: {
        emotionalMode: {
          description: "宠物的情绪特点和表达方式",
          examples: [
            "胆小且敏感，通过尾巴颤抖来表达恐惧",
            "活泼好动，兴奋时会发出清脆的鸣叫",
            "沉稳内敛，只有在信任的人面前才会放松警惕",
            "好奇心强，总是用鼻子嗅探新事物"
          ]
        },
        valueCore: {
          description: "宠物的信念体系和行为准则",
          examples: [
            "崇尚自然法则，只攻击比自己更强大的生物",
            "保护弱小，绝不伤害无辜",
            "追求完美，对不完整的事物有强迫症",
            "重视友谊，会为朋友牺牲自己"
          ]
        }
      },

      // 2. 行为特征
      behaviorTraits: {
        dailyMode: {
          description: "习惯行为和生活方式",
          examples: [
            "每天都会用露水清洗身体，喜欢在阳光下小憩",
            "夜行性，白天躲在阴暗处休息",
            "喜欢收集闪亮的小物件，藏在秘密地点",
            "定时巡视领地，标记自己的气味"
          ]
        },
        socialStyle: {
          description: "互动方式和关系偏好",
          examples: [
            "对同类保持距离，但会主动帮助弱小生物",
            "群居性强，喜欢与其他宠物一起行动",
            "独来独往，只信任一个主人",
            "社交达人，能与任何生物建立友好关系"
          ]
        },
        uniqueIdentifier: {
          description: "个性化行为和口头禅",
          examples: [
            "高兴时会发出像铃铛一样的清脆叫声",
            "思考时会用爪子挠头",
            "紧张时会不停地转圈",
            "撒娇时会用头蹭主人的手"
          ]
        }
      },

      // 3. 关系动力
      relationshipDynamics: {
        intimacyBuilding: {
          description: "与主人建立深度连接的方式",
          examples: [
            "通过分享收集到的稀有果实来表达信任",
            "会模仿主人的行为习惯",
            "在主人睡觉时守护在身边",
            "用特殊的叫声只对主人表达情感"
          ]
        },
        conflictResponse: {
          description: "处理矛盾的策略",
          examples: [
            "面对挑衅会选择退让，除非主人受到威胁",
            "用沉默来表达不满",
            "会离家出走一段时间来抗议",
            "通过破坏物品来发泄情绪"
          ]
        },
        influenceMethod: {
          description: "影响主人的技巧",
          examples: [
            "会通过特定的叫声和动作引导主人去特定地点探索",
            "用眼神和肢体语言暗示主人的决策",
            "故意表现出某种情绪来获得关注",
            "通过展示特殊能力来证明自己的价值"
          ]
        }
      },

      // 4. 背景脉络
      backgroundContext: {
        formativeExperience: {
          description: "宠物关键事件和环境",
          examples: [
            "出生在一片被污染的森林，为了生存学会了净化能力",
            "幼时被遗弃，因此对信任格外珍惜",
            "曾经历过一场大战，身上留有战斗的印记",
            "在古老遗迹中孵化，继承了远古的记忆"
          ]
        },
        specialAbilities: {
          description: "宠物的基础战斗技能和知识",
          examples: [
            "拥有超强的嗅觉，可以提前感知到危险",
            "能够与植物沟通，获取环境信息",
            "具有治愈能力，可以恢复伤势",
            "掌握隐身术，能在危险时消失"
          ]
        },
        socialNetwork: {
          description: "重要关系和归属",
          examples: [
            "与一群夜行生物结成了盟友，会定期与它们分享情报",
            "是某个古老种族的最后传人",
            "与森林中的精灵王有血缘关系",
            "曾是某位传说英雄的伙伴"
          ]
        }
      },

      // 5. 灵性空间
      spiritualSpace: {
        hiddenAspects: {
          description: "未被揭示的部分",
          examples: [
            "它的体内隐藏着一段远古的记忆，只有在极度危险时才会觉醒",
            "拥有预知未来的能力，但自己并不知道",
            "是某个封印的守护者，身负重要使命",
            "体内流淌着神兽的血脉，等待觉醒"
          ]
        },
        developmentPotential: {
          description: "未来变化的可能",
          examples: [
            "随着等级提升，可能会从一个胆小的生物进化为勇敢的守护者",
            "有可能觉醒多重人格，每个人格都有不同的能力",
            "可能会恢复失去的记忆，发现自己的真实身份",
            "有潜力成为连接不同世界的桥梁"
          ]
        },
        interactionEasterEggs: {
          description: "深入了解后的发现",
          examples: [
            "当玩家收集到特定物品时，它会展现出罕见的'舞蹈'",
            "在特定的时间和地点会显现出真实形态",
            "对某些古老的咒语有特殊反应",
            "能够感应到其他维度的存在"
          ]
        }
      },

      // 6. 使用指南
      usageGuide: {
        cultivationAdvice: {
          description: "有效养成的方式",
          examples: [
            "多带它去有水源的地方，会增加其治愈能力",
            "经常与它对话，能提升心灵感应能力",
            "让它接触不同的元素，有助于能力觉醒",
            "给它充足的休息时间，有利于潜能开发"
          ]
        },
        triggerPoints: {
          description: "激活特定反应的方法",
          examples: [
            "通过'喂食'动作并输入[食物名称]，可以触发其对特定属性的偏好",
            "在满月之夜进行互动，能激发隐藏能力",
            "使用特定的手势和咒语，可以唤醒沉睡的记忆",
            "在危险时刻呼唤它的真名，会激发保护本能"
          ]
        },
        evolutionPath: {
          description: "角色成长的方向",
          examples: [
            "其成长分为'治愈型'、'防御型'和'隐藏型'三种，取决于玩家的养成方式",
            "可以向'元素掌控者'、'心灵导师'或'战斗专家'方向发展",
            "根据互动频率和方式，会解锁不同的进化分支",
            "特殊事件可能触发稀有的变异进化路径"
          ]
        }
      }
    };
  }

  /**
   * 为宠物生成完整的人格档案
   */
  async generatePersonaProfile(pet, interactionHistory = []) {
    try {
      logger.info(`Generating persona profile for pet: ${pet.name}`);

      // 构建AI提示词
      const prompt = this.buildPersonaPrompt(pet, interactionHistory);
      
      // 调用AI生成人格档案
      const personaContent = await this.aiService.generateContent(prompt, {
        temperature: 0.8,
        maxTokens: 2000
      });

      // 解析并结构化人格档案
      const personaProfile = await this.parsePersonaProfile(personaContent, pet);
      
      // 保存到数据库
      await this.savePersonaProfile(pet.id, personaProfile);
      
      return personaProfile;

    } catch (error) {
      logger.error(`Failed to generate persona profile for pet ${pet.id}:`, error);
      return this.generateFallbackPersona(pet);
    }
  }

  /**
   * 构建人格生成提示词
   */
  buildPersonaPrompt(pet, interactionHistory) {
    const historyContext = interactionHistory.length > 0 
      ? `互动历史：${interactionHistory.slice(-5).map(h => h.action).join(', ')}`
      : '暂无互动历史';

    return `你是《灵境斗宠录》的宠物人格设计师。请为以下宠物创建一个立体的人格档案：

宠物信息：
- 名称：${pet.name}
- 种族：${pet.race || '未知'}
- 属性：${pet.attribute || '中性'}
- 稀有度：${pet.rarity || 'N'}
- 等级：${pet.level || 1}
- 特殊词：${pet.specialWord || '无'}
${historyContext}

请按照以下六个维度创建人格档案，每个维度都要具体生动：

1. 核心标识
- 情感模式：描述它的情绪特点和表达方式
- 价值核心：它的信念体系和行为准则

2. 行为特征  
- 日常模式：习惯行为和生活方式
- 社交风格：互动方式和关系偏好
- 独特标识：个性化行为和口头禅

3. 关系动力
- 亲密建立：与主人建立深度连接的方式
- 冲突应对：处理矛盾的策略
- 影响方式：影响主人的技巧

4. 背景脉络
- 形成经历：关键事件和环境
- 能力特长：基础战斗技能和知识
- 社会网络：重要关系和归属

5. 灵性空间
- 隐藏层面：未被揭示的部分
- 发展潜能：未来变化的可能
- 互动彩蛋：深入了解后的发现

6. 使用指南
- 养成建议：有效养成的方式
- 触发要点：激活特定反应的方法
- 进化路径：角色成长的方向

要求：
- 每个维度都要结合宠物的种族和属性特点
- 描述要生动具体，避免抽象概念
- 体现宠物的独特性和成长潜力
- 用中文回答，语言优美有感染力

请以JSON格式返回，结构清晰易于解析。`;
  }

  /**
   * 解析人格档案
   */
  async parsePersonaProfile(content, pet) {
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(content);
      return this.validatePersonaProfile(parsed, pet);
    } catch (error) {
      logger.warn('Failed to parse persona profile as JSON, using text analysis');
      return this.extractPersonaFromText(content, pet);
    }
  }

  /**
   * 验证和规范化人格档案
   */
  validatePersonaProfile(profile, pet) {
    const validated = {
      petId: pet.id,
      coreIdentity: {
        emotionalMode: profile.coreIdentity?.emotionalMode || "情绪稳定，通过肢体语言表达感受",
        valueCore: profile.coreIdentity?.valueCore || "重视忠诚，保护重要的人和事物"
      },
      behaviorTraits: {
        dailyMode: profile.behaviorTraits?.dailyMode || "规律作息，喜欢在固定时间进行活动",
        socialStyle: profile.behaviorTraits?.socialStyle || "友善但谨慎，需要时间建立信任",
        uniqueIdentifier: profile.behaviorTraits?.uniqueIdentifier || "有独特的叫声和动作习惯"
      },
      relationshipDynamics: {
        intimacyBuilding: profile.relationshipDynamics?.intimacyBuilding || "通过陪伴和互动建立深度连接",
        conflictResponse: profile.relationshipDynamics?.conflictResponse || "倾向于回避冲突，寻求和平解决",
        influenceMethod: profile.relationshipDynamics?.influenceMethod || "用眼神和行为暗示主人"
      },
      backgroundContext: {
        formativeExperience: profile.backgroundContext?.formativeExperience || "在自然环境中成长，具有野性直觉",
        specialAbilities: profile.backgroundContext?.specialAbilities || "拥有敏锐的感知能力",
        socialNetwork: profile.backgroundContext?.socialNetwork || "与同族保持联系，偶尔独行"
      },
      spiritualSpace: {
        hiddenAspects: profile.spiritualSpace?.hiddenAspects || "内心深处隐藏着未知的潜能",
        developmentPotential: profile.spiritualSpace?.developmentPotential || "随着成长可能觉醒特殊能力",
        interactionEasterEggs: profile.spiritualSpace?.interactionEasterEggs || "在特定条件下会展现惊喜行为"
      },
      usageGuide: {
        cultivationAdvice: profile.usageGuide?.cultivationAdvice || "给予充分的关爱和耐心培养",
        triggerPoints: profile.usageGuide?.triggerPoints || "通过特定的互动方式激发潜能",
        evolutionPath: profile.usageGuide?.evolutionPath || "可向多个方向发展，取决于培养方式"
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    return validated;
  }

  /**
   * 从文本中提取人格信息（降级方案）
   */
  extractPersonaFromText(content, pet) {
    // 简化的文本解析逻辑
    return {
      petId: pet.id,
      coreIdentity: {
        emotionalMode: "根据种族特性表达情感",
        valueCore: "遵循自然法则和忠诚原则"
      },
      behaviorTraits: {
        dailyMode: "适应环境的生活习惯",
        socialStyle: "谨慎而友善的社交方式",
        uniqueIdentifier: "独特的个性化表现"
      },
      relationshipDynamics: {
        intimacyBuilding: "通过互动建立信任",
        conflictResponse: "智慧地处理冲突",
        influenceMethod: "用行为影响主人"
      },
      backgroundContext: {
        formativeExperience: "在特定环境中成长",
        specialAbilities: "拥有种族天赋能力",
        socialNetwork: "与同类和其他生物的关系"
      },
      spiritualSpace: {
        hiddenAspects: "隐藏的神秘面向",
        developmentPotential: "未来发展的可能性",
        interactionEasterEggs: "深度互动的惊喜"
      },
      usageGuide: {
        cultivationAdvice: "适合的培养方式",
        triggerPoints: "激发特殊反应的方法",
        evolutionPath: "多样化的成长路径"
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 保存人格档案到数据库
   */
  async savePersonaProfile(petId, profile) {
    try {
      await this.database.run(`
        INSERT OR REPLACE INTO pet_personas (
          pet_id, profile_data, created_at, last_updated
        ) VALUES (?, ?, ?, ?)
      `, [
        petId,
        JSON.stringify(profile),
        profile.createdAt,
        profile.lastUpdated
      ]);
      
      logger.info(`Persona profile saved for pet: ${petId}`);
    } catch (error) {
      logger.error(`Failed to save persona profile for pet ${petId}:`, error);
    }
  }

  /**
   * 获取宠物人格档案
   */
  async getPersonaProfile(petId) {
    try {
      const result = await this.database.get(`
        SELECT profile_data FROM pet_personas WHERE pet_id = ?
      `, [petId]);
      
      if (result) {
        return JSON.parse(result.profile_data);
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to get persona profile for pet ${petId}:`, error);
      return null;
    }
  }

  /**
   * 更新人格档案（基于新的互动）
   */
  async updatePersonaProfile(petId, newInteraction) {
    try {
      const existingProfile = await this.getPersonaProfile(petId);
      if (!existingProfile) {
        logger.warn(`No existing persona profile found for pet ${petId}`);
        return null;
      }

      // 基于新互动调整人格档案
      const updatedProfile = await this.adjustPersonaBasedOnInteraction(
        existingProfile, 
        newInteraction
      );

      await this.savePersonaProfile(petId, updatedProfile);
      return updatedProfile;

    } catch (error) {
      logger.error(`Failed to update persona profile for pet ${petId}:`, error);
      return null;
    }
  }

  /**
   * 基于互动调整人格档案
   */
  async adjustPersonaBasedOnInteraction(profile, interaction) {
    // 这里可以实现基于互动历史的人格微调逻辑
    // 目前返回原档案，后续可以扩展
    profile.lastUpdated = new Date().toISOString();
    return profile;
  }

  /**
   * 检查是否应该显示宠物图像
   */
  shouldShowPetImage(pet) {
    const level = pet.level || 1;
    const stage = this.getCurrentEvolutionStage(level);
    return this.evolutionStages[stage]?.showImage || false;
  }

  /**
   * 获取当前进化阶段
   */
  getCurrentEvolutionStage(level) {
    const stages = Object.keys(this.evolutionStages);
    let currentStage = 'egg';
    
    for (const stage of stages) {
      if (level >= this.evolutionStages[stage].minLevel) {
        currentStage = stage;
      }
    }
    
    return currentStage;
  }

  /**
   * 生成降级人格档案
   */
  generateFallbackPersona(pet) {
    return {
      petId: pet.id,
      coreIdentity: {
        emotionalMode: "性格温和，情感表达直接",
        valueCore: "重视友谊，保护弱小"
      },
      behaviorTraits: {
        dailyMode: "喜欢在阳光下休息，定时进食",
        socialStyle: "友善但需要时间建立信任",
        uniqueIdentifier: "高兴时会摇尾巴"
      },
      relationshipDynamics: {
        intimacyBuilding: "通过陪伴和游戏建立感情",
        conflictResponse: "倾向于回避冲突",
        influenceMethod: "用可爱的表情获得关注"
      },
      backgroundContext: {
        formativeExperience: "在安全的环境中成长",
        specialAbilities: "拥有基础的感知能力",
        socialNetwork: "与其他宠物关系良好"
      },
      spiritualSpace: {
        hiddenAspects: "内心深处有未知的潜能",
        developmentPotential: "可能觉醒特殊能力",
        interactionEasterEggs: "在特定时刻会有惊喜表现"
      },
      usageGuide: {
        cultivationAdvice: "给予充分的关爱和训练",
        triggerPoints: "通过互动激发潜能",
        evolutionPath: "可向多个方向发展"
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = PetPersonaSystem;