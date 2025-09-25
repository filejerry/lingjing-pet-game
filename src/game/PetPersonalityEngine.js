/**
 * 宠物性格引擎 - 基于易经思维的动态性格系统
 * 让宠物具备更加灵动和真实的性格表现
 */

const logger = require('../utils/logger');

class PetPersonalityEngine {
    constructor() {
        // 宠物性格的三个核心维度（对应易经三爻思维）
        this.personalityDimensions = {
            // 基础性格（初爻）- 宠物的天性
            nature: {
                energy: 0.5,        // 活跃度 [0-1]
                curiosity: 0.5,     // 好奇心 [0-1]
                independence: 0.5,  // 独立性 [0-1]
                stability: 'balanced' // 稳定状态
            },
            
            // 情感状态（二爻）- 宠物的情绪
            emotion: {
                happiness: 0.5,     // 快乐度 [0-1]
                trust: 0.5,         // 信任度 [0-1]
                excitement: 0.5,    // 兴奋度 [0-1]
                stability: 'balanced'
            },
            
            // 行为表现（三爻）- 宠物的外在行为
            behavior: {
                playfulness: 0.5,   // 玩耍倾向 [0-1]
                obedience: 0.5,     // 服从性 [0-1]
                expressiveness: 0.5, // 表达欲 [0-1]
                stability: 'balanced'
            }
        };

        // 性格类型映射（简化版卦象概念）
        this.personalityTypes = {
            'high-high-high': {
                type: '活力型',
                description: '充满活力，热情开朗，喜欢表现',
                traits: ['精力充沛', '好奇心强', '喜欢互动'],
                responses: ['兴奋地跳跃', '主动寻求关注', '积极探索']
            },
            'high-high-low': {
                type: '内敛型',
                description: '内心丰富但表达含蓄',
                traits: ['敏感细腻', '观察力强', '深度思考'],
                responses: ['静静观察', '轻柔回应', '深情凝视']
            },
            'high-low-high': {
                type: '独立型',
                description: '自主性强，有自己的想法',
                traits: ['独立自主', '有个性', '选择性互动'],
                responses: ['保持距离', '选择性回应', '展示个性']
            },
            'low-high-high': {
                type: '依赖型',
                description: '渴望陪伴，情感丰富',
                traits: ['依恋主人', '情感丰富', '需要关爱'],
                responses: ['寻求安慰', '粘人行为', '情感表达']
            },
            'balanced': {
                type: '平衡型',
                description: '性格均衡，适应性强',
                traits: ['稳定可靠', '适应性强', '温和友善'],
                responses: ['温和回应', '稳定表现', '友善互动']
            }
        };

        // 情绪变化的触发因素
        this.emotionTriggers = {
            positive: ['喂食', '抚摸', '游戏', '称赞', '新玩具'],
            negative: ['忽视', '批评', '孤独', '饥饿', '疲劳'],
            neutral: ['日常互动', '环境变化', '时间流逝']
        };

        logger.info('宠物性格引擎初始化完成');
    }

    /**
     * 初始化宠物性格
     */
    initializePetPersonality(petData) {
        // 基于宠物种类和初始属性生成基础性格
        const basePersonality = this.generateBasePersonality(petData);
        
        // 添加随机变化因子
        const personality = this.addPersonalityVariation(basePersonality);
        
        logger.info(`宠物 ${petData.name} 的性格初始化完成: ${this.getPersonalityType(personality).type}`);
        
        return {
            ...personality,
            lastUpdate: new Date().toISOString(),
            interactionHistory: [],
            personalityEvolution: []
        };
    }

    /**
     * 基于互动更新宠物性格
     */
    updatePersonalityFromInteraction(petPersonality, interactionType, userInput, context = {}) {
        const oldPersonality = JSON.parse(JSON.stringify(petPersonality));
        
        // 分析互动类型对性格的影响
        const impact = this.analyzeInteractionImpact(interactionType, userInput, context);
        
        // 应用性格变化
        const updatedPersonality = this.applyPersonalityChange(petPersonality, impact);
        
        // 记录性格演化
        updatedPersonality.personalityEvolution.push({
            timestamp: new Date().toISOString(),
            trigger: interactionType,
            impact: impact,
            oldType: this.getPersonalityType(oldPersonality).type,
            newType: this.getPersonalityType(updatedPersonality).type
        });

        // 保持历史记录在合理范围内
        if (updatedPersonality.personalityEvolution.length > 50) {
            updatedPersonality.personalityEvolution = updatedPersonality.personalityEvolution.slice(-30);
        }

        logger.debug(`宠物性格更新: ${interactionType} -> ${this.getPersonalityType(updatedPersonality).type}`);
        
        return updatedPersonality;
    }

    /**
     * 生成基础性格
     */
    generateBasePersonality(petData) {
        const personality = JSON.parse(JSON.stringify(this.personalityDimensions));
        
        // 基于宠物种类调整基础性格
        const speciesModifiers = this.getSpeciesPersonalityModifiers(petData.species || '未知');
        
        // 应用种族特性
        Object.keys(personality).forEach(dimension => {
            Object.keys(personality[dimension]).forEach(trait => {
                if (typeof personality[dimension][trait] === 'number' && speciesModifiers[trait]) {
                    personality[dimension][trait] = Math.max(0, Math.min(1, 
                        personality[dimension][trait] + speciesModifiers[trait]
                    ));
                }
            });
        });

        return personality;
    }

    /**
     * 获取种族性格修正值
     */
    getSpeciesPersonalityModifiers(species) {
        const modifiers = {
            '龙': { energy: 0.3, independence: 0.2, expressiveness: 0.2 },
            '凤凰': { curiosity: 0.2, expressiveness: 0.3, happiness: 0.1 },
            '狐狸': { curiosity: 0.3, independence: 0.2, playfulness: 0.1 },
            '狼': { independence: 0.3, trust: -0.1, obedience: -0.1 },
            '猫': { independence: 0.2, curiosity: 0.2, playfulness: 0.1 },
            '狗': { trust: 0.2, obedience: 0.2, happiness: 0.1 },
            '鸟': { energy: 0.2, curiosity: 0.2, expressiveness: 0.2 },
            '兔': { curiosity: 0.1, happiness: 0.1, playfulness: 0.2 }
        };

        return modifiers[species] || {};
    }

    /**
     * 添加性格变化因子
     */
    addPersonalityVariation(basePersonality) {
        const personality = JSON.parse(JSON.stringify(basePersonality));
        
        // 为每个数值属性添加小幅随机变化
        Object.keys(personality).forEach(dimension => {
            Object.keys(personality[dimension]).forEach(trait => {
                if (typeof personality[dimension][trait] === 'number') {
                    const variation = (Math.random() - 0.5) * 0.2; // ±0.1的变化
                    personality[dimension][trait] = Math.max(0, Math.min(1, 
                        personality[dimension][trait] + variation
                    ));
                }
            });
        });

        return personality;
    }

    /**
     * 分析互动对性格的影响
     */
    analyzeInteractionImpact(interactionType, userInput, context) {
        const impact = {
            nature: {},
            emotion: {},
            behavior: {}
        };

        // 基于互动类型确定基础影响
        const baseImpacts = {
            'feed': {
                emotion: { happiness: 0.1, trust: 0.05 },
                behavior: { obedience: 0.02 }
            },
            'play': {
                nature: { energy: 0.05 },
                emotion: { happiness: 0.15, excitement: 0.1 },
                behavior: { playfulness: 0.1, expressiveness: 0.05 }
            },
            'pet': {
                emotion: { happiness: 0.08, trust: 0.1 },
                behavior: { obedience: 0.05 }
            },
            'train': {
                nature: { independence: -0.02 },
                emotion: { trust: 0.03 },
                behavior: { obedience: 0.1 }
            },
            'ignore': {
                emotion: { happiness: -0.05, trust: -0.03 },
                behavior: { expressiveness: -0.02 }
            },
            'scold': {
                emotion: { happiness: -0.1, trust: -0.05 },
                behavior: { obedience: 0.03, expressiveness: -0.05 }
            }
        };

        // 应用基础影响
        const baseImpact = baseImpacts[interactionType] || {};
        Object.keys(baseImpact).forEach(dimension => {
            impact[dimension] = { ...impact[dimension], ...baseImpact[dimension] };
        });

        // 基于用户输入的情感分析调整影响
        const emotionalTone = this.analyzeEmotionalTone(userInput);
        this.adjustImpactByTone(impact, emotionalTone);

        // 基于上下文调整影响
        this.adjustImpactByContext(impact, context);

        return impact;
    }

    /**
     * 分析用户输入的情感倾向
     */
    analyzeEmotionalTone(userInput) {
        if (!userInput) return 'neutral';

        const positiveWords = ['好', '棒', '乖', '可爱', '喜欢', '爱', '开心', '高兴'];
        const negativeWords = ['坏', '不好', '讨厌', '生气', '难过', '失望'];
        
        const positiveCount = positiveWords.filter(word => userInput.includes(word)).length;
        const negativeCount = negativeWords.filter(word => userInput.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    /**
     * 基于情感倾向调整影响
     */
    adjustImpactByTone(impact, tone) {
        const multipliers = {
            'positive': 1.2,
            'negative': 0.8,
            'neutral': 1.0
        };

        const multiplier = multipliers[tone];
        
        Object.keys(impact).forEach(dimension => {
            Object.keys(impact[dimension]).forEach(trait => {
                impact[dimension][trait] *= multiplier;
            });
        });
    }

    /**
     * 基于上下文调整影响
     */
    adjustImpactByContext(impact, context) {
        // 基于时间调整（早晨更活跃，晚上更平静）
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 10) {
            // 早晨时间，增加活跃度影响
            if (impact.nature.energy) impact.nature.energy *= 1.2;
        } else if (hour >= 20 || hour <= 5) {
            // 夜晚时间，降低活跃度影响
            if (impact.nature.energy) impact.nature.energy *= 0.8;
        }

        // 基于宠物当前状态调整
        if (context.petStatus) {
            if (context.petStatus.hunger < 0.3) {
                // 饥饿时，降低正面情绪影响
                Object.keys(impact.emotion).forEach(trait => {
                    if (impact.emotion[trait] > 0) {
                        impact.emotion[trait] *= 0.7;
                    }
                });
            }
            
            if (context.petStatus.energy < 0.3) {
                // 疲劳时，降低活跃度相关影响
                if (impact.nature.energy) impact.nature.energy *= 0.5;
                if (impact.behavior.playfulness) impact.behavior.playfulness *= 0.5;
            }
        }
    }

    /**
     * 应用性格变化
     */
    applyPersonalityChange(personality, impact) {
        const newPersonality = JSON.parse(JSON.stringify(personality));
        
        Object.keys(impact).forEach(dimension => {
            Object.keys(impact[dimension]).forEach(trait => {
                if (typeof newPersonality[dimension][trait] === 'number') {
                    newPersonality[dimension][trait] = Math.max(0, Math.min(1,
                        newPersonality[dimension][trait] + impact[dimension][trait]
                    ));
                }
            });
        });

        // 更新稳定性状态
        this.updateStabilityStates(newPersonality);
        
        newPersonality.lastUpdate = new Date().toISOString();
        
        return newPersonality;
    }

    /**
     * 更新稳定性状态
     */
    updateStabilityStates(personality) {
        Object.keys(personality).forEach(dimension => {
            if (personality[dimension].stability !== undefined) {
                const values = Object.keys(personality[dimension])
                    .filter(key => typeof personality[dimension][key] === 'number')
                    .map(key => personality[dimension][key]);
                
                const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
                
                if (variance < 0.05) {
                    personality[dimension].stability = 'stable';
                } else if (variance > 0.15) {
                    personality[dimension].stability = 'volatile';
                } else {
                    personality[dimension].stability = 'balanced';
                }
            }
        });
    }

    /**
     * 获取当前性格类型
     */
    getPersonalityType(personality) {
        const natureLevel = this.getDimensionLevel(personality.nature);
        const emotionLevel = this.getDimensionLevel(personality.emotion);
        const behaviorLevel = this.getDimensionLevel(personality.behavior);
        
        const typeKey = `${natureLevel}-${emotionLevel}-${behaviorLevel}`;
        
        return this.personalityTypes[typeKey] || this.personalityTypes['balanced'];
    }

    /**
     * 获取维度等级
     */
    getDimensionLevel(dimension) {
        const values = Object.keys(dimension)
            .filter(key => typeof dimension[key] === 'number')
            .map(key => dimension[key]);
        
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        if (avg > 0.7) return 'high';
        if (avg < 0.3) return 'low';
        return 'balanced';
    }

    /**
     * 生成性格化的回应
     */
    generatePersonalizedResponse(personality, context, baseResponse) {
        const personalityType = this.getPersonalityType(personality);
        
        // 基于性格类型调整回应风格
        let response = baseResponse;
        
        // 添加性格化的行为描述
        const behaviorDescription = this.generateBehaviorDescription(personality, context);
        if (behaviorDescription) {
            response += `\n\n${behaviorDescription}`;
        }

        // 添加情感表达
        const emotionalExpression = this.generateEmotionalExpression(personality);
        if (emotionalExpression) {
            response += `\n${emotionalExpression}`;
        }

        return {
            response: response,
            personalityType: personalityType.type,
            traits: personalityType.traits,
            emotionalState: this.getEmotionalState(personality)
        };
    }

    /**
     * 生成行为描述
     */
    generateBehaviorDescription(personality, context) {
        const behaviors = [];
        
        // 基于性格特征生成行为
        if (personality.behavior.playfulness > 0.7) {
            behaviors.push('兴奋地摇着尾巴');
        } else if (personality.behavior.playfulness < 0.3) {
            behaviors.push('安静地待在一旁');
        }

        if (personality.emotion.happiness > 0.8) {
            behaviors.push('眼中闪烁着快乐的光芒');
        } else if (personality.emotion.happiness < 0.3) {
            behaviors.push('显得有些无精打采');
        }

        if (personality.nature.curiosity > 0.7) {
            behaviors.push('好奇地观察着周围');
        }

        if (personality.emotion.trust > 0.8) {
            behaviors.push('亲昵地靠近你');
        } else if (personality.emotion.trust < 0.4) {
            behaviors.push('保持着一定的距离');
        }

        return behaviors.length > 0 ? `*${behaviors.join('，')}*` : '';
    }

    /**
     * 生成情感表达
     */
    generateEmotionalExpression(personality) {
        const expressions = [];
        
        const emotionalState = this.getEmotionalState(personality);
        
        switch (emotionalState) {
            case 'joyful':
                expressions.push('😊 看起来很开心的样子');
                break;
            case 'excited':
                expressions.push('✨ 显得特别兴奋');
                break;
            case 'calm':
                expressions.push('😌 表现得很平静');
                break;
            case 'curious':
                expressions.push('🤔 对一切都很好奇');
                break;
            case 'affectionate':
                expressions.push('💕 流露出依恋的神情');
                break;
            case 'independent':
                expressions.push('😎 保持着独立的姿态');
                break;
        }

        return expressions.length > 0 ? expressions[0] : '';
    }

    /**
     * 获取情感状态
     */
    getEmotionalState(personality) {
        const { nature, emotion, behavior } = personality;
        
        if (emotion.happiness > 0.8 && behavior.expressiveness > 0.7) {
            return 'joyful';
        } else if (emotion.excitement > 0.7 && nature.energy > 0.7) {
            return 'excited';
        } else if (nature.curiosity > 0.7) {
            return 'curious';
        } else if (emotion.trust > 0.8 && behavior.obedience > 0.6) {
            return 'affectionate';
        } else if (nature.independence > 0.7) {
            return 'independent';
        } else {
            return 'calm';
        }
    }

    /**
     * 获取性格统计信息
     */
    getPersonalityStats(personality) {
        const personalityType = this.getPersonalityType(personality);
        
        return {
            type: personalityType.type,
            description: personalityType.description,
            traits: personalityType.traits,
            dimensions: {
                nature: this.getDimensionSummary(personality.nature),
                emotion: this.getDimensionSummary(personality.emotion),
                behavior: this.getDimensionSummary(personality.behavior)
            },
            emotionalState: this.getEmotionalState(personality),
            stability: {
                nature: personality.nature.stability,
                emotion: personality.emotion.stability,
                behavior: personality.behavior.stability
            },
            lastUpdate: personality.lastUpdate
        };
    }

    /**
     * 获取维度摘要
     */
    getDimensionSummary(dimension) {
        const values = {};
        Object.keys(dimension).forEach(key => {
            if (typeof dimension[key] === 'number') {
                values[key] = Math.round(dimension[key] * 100);
            }
        });
        return values;
    }
}

module.exports = PetPersonalityEngine;