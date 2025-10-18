/**
 * 灵境斗宠录 - AI宠物设定生成器
 * 作者：树枝 (微信: wzq8083)
 * 
 * 核心功能：
 * 1. AI生成完整宠物设定（背景、性格、能力等）
 * 2. 持续升级进化迭代宠物设定
 * 3. 数据库只存储核心数据
 */

class PetLoreGenerator {
    constructor(aiService) {
        this.aiService = aiService;
        
        // 传说宠物预设数据库
        this.legendaryPets = {
            '九尾狐': {
                baseRarity: 'ssr',
                type: 'fox',
                legendaryTraits: ['智慧超群', '魅惑之力', '预知能力'],
                evolutionPath: ['一尾狐', '三尾狐', '六尾狐', '九尾狐', '天狐']
            },
            '青龙': {
                baseRarity: 'ssr',
                type: 'dragon',
                legendaryTraits: ['东方守护', '木之精华', '生命之力'],
                evolutionPath: ['龙蛋', '幼龙', '少年龙', '成年龙', '青龙']
            },
            '朱雀': {
                baseRarity: 'ssr',
                type: 'bird',
                legendaryTraits: ['南方守护', '火之精华', '涅槃重生'],
                evolutionPath: ['火鸟蛋', '雏鸟', '火鸟', '朱雀', '凤凰']
            },
            '白虎': {
                baseRarity: 'ssr',
                type: 'beast',
                legendaryTraits: ['西方守护', '金之精华', '杀伐之力'],
                evolutionPath: ['虎崽', '白虎', '王虎', '圣虎', '神虎']
            },
            '玄武': {
                baseRarity: 'ssr',
                type: 'beast',
                legendaryTraits: ['北方守护', '水之精华', '防御无双'],
                evolutionPath: ['龟蛇', '玄武', '神龟', '圣兽', '天玄武']
            },
            '麒麟': {
                baseRarity: 'ssr',
                type: 'beast',
                legendaryTraits: ['仁德之兽', '祥瑞之力', '治愈能力'],
                evolutionPath: ['麟崽', '少麟', '麒麟', '圣麟', '天麒麟']
            },
            '鲲鹏': {
                baseRarity: 'ssr',
                type: 'beast',
                legendaryTraits: ['海天之主', '变化无穷', '极速飞行'],
                evolutionPath: ['鲲鱼', '大鲲', '鲲鹏', '天鹏', '混沌鹏']
            }
        };
    }

    /**
     * 根据玩家选择生成完整宠物设定
     */
    async generatePetLore(choice, coreData) {
        try {
            // 检查是否为传说宠物
            const isLegendary = this.legendaryPets[coreData.race];
            
            // 构建生成提示词
            const prompt = this.buildLorePrompt(choice, coreData, isLegendary);
            
            // 调用AI生成详细设定
            const loreResponse = await this.aiService.generateResponse(prompt);
            
            // 解析AI响应
            const petLore = this.parseLoreResponse(loreResponse, coreData);
            
            return petLore;
            
        } catch (error) {
            console.error('AI设定生成失败，使用默认设定:', error);
            return this.generateDefaultLore(coreData);
        }
    }

    /**
     * 构建设定生成提示词
     */
    buildLorePrompt(choice, coreData, isLegendary) {
        const choiceContext = {
            'sense_east': '东方温暖光芒的感应，象征着希望、成长和生命力',
            'sense_north': '北方神秘月光的指引，象征着智慧、魔法和古老秘密',
            'sense_west': '西方雷电之力的震撼，象征着力量、速度和战斗意志'
        };

        let basePrompt = `
你是《灵境斗宠录》的世界观设定师。请为以下宠物生成详细的设定：

宠物基础信息：
- 名称：${coreData.name}
- 种族：${coreData.race}
- 属性：${coreData.attribute}
- 特殊词：${coreData.specialWord}
- 稀有度：${coreData.rarity.toUpperCase()}
- 玩家选择背景：${choiceContext[choice] || '未知感应'}

请生成以下内容（JSON格式）：
{
    "appearance": "外观描述（详细的外貌特征）",
    "personality": "性格特点（3-5个关键词及解释）",
    "abilities": "能力描述（具体的技能和特长）",
    "backstory": "背景故事（简短但引人入胜的来历）",
    "habitat": "栖息环境（喜欢的生活环境）",
    "behavior": "行为习性（日常行为和特殊习惯）",
    "growth_potential": "成长潜力（未来可能的发展方向）",
    "unique_features": "独特特征（与众不同的地方）"
}
        `;

        // 如果是传说宠物，添加特殊提示
        if (isLegendary) {
            const legendaryInfo = this.legendaryPets[coreData.race];
            basePrompt += `

特别注意：这是传说级宠物"${coreData.race}"，请结合以下传说特质：
- 传说特质：${legendaryInfo.legendaryTraits.join('、')}
- 进化路径：${legendaryInfo.evolutionPath.join(' → ')}
- 请让设定体现出传说级的威严和神秘感
            `;
        }

        basePrompt += `

设定要求：
1. 符合山海经和中国神话背景
2. 体现宠物的稀有度等级
3. 与玩家的选择背景呼应
4. 富有想象力但保持逻辑性
5. 为后续进化留下伏笔
        `;

        return basePrompt;
    }

    /**
     * 解析AI响应
     */
    parseLoreResponse(response, coreData) {
        try {
            const loreData = JSON.parse(response);
            
            return {
                petId: coreData.id,
                petName: coreData.name,
                appearance: loreData.appearance || '神秘的外观，难以用言语描述',
                personality: loreData.personality || '性格神秘莫测',
                abilities: loreData.abilities || '拥有未知的神秘力量',
                backstory: loreData.backstory || '来历不明的神秘生物',
                habitat: loreData.habitat || '栖息在神秘的灵境深处',
                behavior: loreData.behavior || '行为难以预测',
                growthPotential: loreData.growth_potential || '拥有无限的成长可能',
                uniqueFeatures: loreData.unique_features || '独一无二的存在',
                generatedAt: new Date().toISOString(),
                version: 1 // 设定版本，用于追踪进化迭代
            };
            
        } catch (error) {
            console.error('解析AI响应失败:', error);
            return this.generateDefaultLore(coreData);
        }
    }

    /**
     * 生成默认设定（AI失败时的备用）
     */
    generateDefaultLore(coreData) {
        const defaultLores = {
            'dragon': {
                appearance: '威严的龙族，鳞片闪闪发光，眼中蕴含着古老的智慧',
                personality: '高傲而威严，但对认可的伙伴忠诚不二',
                abilities: '强大的元素操控能力和飞行技巧',
                backstory: '来自远古龙族的后裔，血脉中流淌着神龙的力量',
                habitat: '喜欢栖息在高山云雾之中',
                behavior: '白天喜欢晒太阳，夜晚会发出低沉的龙吟',
                growthPotential: '有可能觉醒更强大的龙族血脉',
                uniqueFeatures: '鳞片会根据情绪变化颜色'
            },
            'fox': {
                appearance: '优雅的狐族，毛发如丝绸般柔顺，尾巴蓬松美丽',
                personality: '聪明狡黠，善于观察，偶尔会恶作剧',
                abilities: '幻术和魅惑能力，以及敏锐的直觉',
                backstory: '狐族中的智者后代，天生具有预知能力',
                habitat: '喜欢在花丛和竹林中穿梭',
                behavior: '喜欢收集闪亮的小物件，对月亮有特殊感应',
                growthPotential: '可能会长出更多尾巴，获得更强法力',
                uniqueFeatures: '眼睛在月光下会发出银色光芒'
            }
        };

        const typeDefault = defaultLores[coreData.type] || defaultLores['dragon'];
        
        return {
            petId: coreData.id,
            petName: coreData.name,
            ...typeDefault,
            generatedAt: new Date().toISOString(),
            version: 1
        };
    }

    /**
     * 进化迭代宠物设定
     */
    async evolvePetLore(petData, evolutionTrigger, behaviorHistory) {
        try {
            const evolutionPrompt = this.buildEvolutionPrompt(petData, evolutionTrigger, behaviorHistory);
            const evolutionResponse = await this.aiService.generateResponse(evolutionPrompt);
            const newLore = this.parseEvolutionResponse(evolutionResponse, petData);
            
            return newLore;
            
        } catch (error) {
            console.error('进化设定生成失败:', error);
            return this.generateEvolutionDefault(petData);
        }
    }

    /**
     * 构建进化设定提示词
     */
    buildEvolutionPrompt(petData, evolutionTrigger, behaviorHistory) {
        return `
你是《灵境斗宠录》的进化设定师。宠物即将进化，请更新其设定：

当前宠物信息：
- 名称：${petData.name}
- 当前等级：${petData.level}
- 进化触发：${evolutionTrigger}
- 行为历史：${behaviorHistory.slice(-5).join('、')}

当前设定（需要进化更新）：
- 外观：${petData.currentLore?.appearance || '未知'}
- 性格：${petData.currentLore?.personality || '未知'}
- 能力：${petData.currentLore?.abilities || '未知'}

请生成进化后的新设定（JSON格式）：
{
    "appearance_changes": "外观的变化描述",
    "new_abilities": "获得的新能力",
    "personality_evolution": "性格的成长变化",
    "power_enhancement": "力量的提升描述",
    "evolution_story": "进化过程的故事描述"
}

要求：
1. 体现宠物的成长和变化
2. 与行为历史相呼应
3. 保持设定的连贯性
4. 为下次进化留下伏笔
        `;
    }

    /**
     * 解析进化响应
     */
    parseEvolutionResponse(response, petData) {
        try {
            const evolutionData = JSON.parse(response);
            
            return {
                ...petData.currentLore,
                appearance: petData.currentLore.appearance + ' ' + evolutionData.appearance_changes,
                abilities: petData.currentLore.abilities + ' ' + evolutionData.new_abilities,
                personality: evolutionData.personality_evolution,
                evolutionStory: evolutionData.evolution_story,
                powerLevel: (petData.currentLore.powerLevel || 1) + 1,
                version: (petData.currentLore.version || 1) + 1,
                lastEvolution: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('解析进化响应失败:', error);
            return this.generateEvolutionDefault(petData);
        }
    }

    /**
     * 生成默认进化设定
     */
    generateEvolutionDefault(petData) {
        return {
            ...petData.currentLore,
            appearance: petData.currentLore.appearance + ' 经过进化，变得更加强大威武',
            abilities: petData.currentLore.abilities + ' 获得了新的神秘力量',
            personality: '性格变得更加成熟稳重',
            evolutionStory: '在主人的陪伴下，完成了一次重要的成长蜕变',
            powerLevel: (petData.currentLore.powerLevel || 1) + 1,
            version: (petData.currentLore.version || 1) + 1,
            lastEvolution: new Date().toISOString()
        };
    }

    /**
     * 获取宠物完整设定（核心数据 + AI生成设定）
     */
    async getCompletePetInfo(coreData, choice = null) {
        // 如果已有设定缓存，直接返回
        if (coreData.cachedLore && this.isLoreValid(coreData.cachedLore)) {
            return {
                core: coreData,
                lore: coreData.cachedLore
            };
        }

        // 生成新的设定
        const lore = await this.generatePetLore(choice || 'sense_east', coreData);
        
        return {
            core: coreData,
            lore: lore
        };
    }

    /**
     * 检查设定是否有效
     */
    isLoreValid(lore) {
        if (!lore || !lore.generatedAt) return false;
        
        // 设定有效期为24小时（可配置）
        const maxAge = 24 * 60 * 60 * 1000;
        const age = Date.now() - new Date(lore.generatedAt).getTime();
        
        return age < maxAge;
    }

    /**
     * 检查是否为传说宠物
     */
    isLegendaryPet(race) {
        return this.legendaryPets.hasOwnProperty(race);
    }

    /**
     * 获取传说宠物信息
     */
    getLegendaryInfo(race) {
        return this.legendaryPets[race] || null;
    }
}

module.exports = PetLoreGenerator;