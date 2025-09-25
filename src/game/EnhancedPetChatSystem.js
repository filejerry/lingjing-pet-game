/**
 * 增强版宠物聊天系统 - 集成性格引擎
 * 让宠物根据性格特征进行更真实的互动
 */

const PetChatSystem = require('./PetChatSystem');
const logger = require('../utils/logger');

class EnhancedPetChatSystem extends PetChatSystem {
    constructor(database, aiService, personalityEngine) {
        super(database, aiService);
        this.personalityEngine = personalityEngine;
        
        logger.info('Enhanced Pet Chat System with Personality Engine initialized');
    }

    /**
     * 增强版聊天处理 - 集成性格系统
     */
    async chat(petId, message, userId) {
        try {
            // 获取宠物基础信息
            const pet = await this.database.get(
                'SELECT * FROM pets WHERE id = ? AND user_id = ?',
                [petId, userId]
            );

            if (!pet) {
                throw new Error('Pet not found');
            }

            // 获取或初始化宠物性格
            let petPersonality = await this.getPetPersonality(petId);
            if (!petPersonality) {
                petPersonality = this.personalityEngine.initializePetPersonality(pet);
                await this.savePetPersonality(petId, petPersonality);
            }

            // 获取宠物当前状态
            const petStatus = await this.getPetStatus(petId);

            // 基于互动更新性格
            const interactionType = this.determineInteractionType(message);
            const updatedPersonality = this.personalityEngine.updatePersonalityFromInteraction(
                petPersonality,
                interactionType,
                message,
                { petStatus }
            );

            // 保存更新后的性格
            await this.savePetPersonality(petId, updatedPersonality);

            // 生成基础AI回应
            const baseResponse = await this.generateBaseResponse(pet, message, updatedPersonality);

            // 应用性格化处理
            const personalizedResponse = this.personalityEngine.generatePersonalizedResponse(
                updatedPersonality,
                { message, petStatus },
                baseResponse
            );

            // 记录聊天历史
            await this.saveChatHistory(petId, userId, message, personalizedResponse.response);

            // 更新宠物状态（基于互动类型）
            await this.updatePetStatusFromInteraction(petId, interactionType, updatedPersonality);

            logger.info(`宠物 ${pet.name} 进行了性格化互动，类型：${personalizedResponse.personalityType}`);

            return {
                response: personalizedResponse.response,
                petPersonality: {
                    type: personalizedResponse.personalityType,
                    traits: personalizedResponse.traits,
                    emotionalState: personalizedResponse.emotionalState
                },
                interactionType: interactionType,
                personalityChange: this.getPersonalityChange(petPersonality, updatedPersonality)
            };

        } catch (error) {
            logger.error('Enhanced chat processing failed:', error);
            // 降级到基础聊天系统
            return await super.chat(petId, message, userId);
        }
    }

    /**
     * 获取宠物性格数据
     */
    async getPetPersonality(petId) {
        try {
            const result = await this.database.get(
                'SELECT personality_data FROM pet_personalities WHERE pet_id = ?',
                [petId]
            );
            
            return result ? JSON.parse(result.personality_data) : null;
        } catch (error) {
            logger.error('Failed to get pet personality:', error);
            return null;
        }
    }

    /**
     * 保存宠物性格数据
     */
    async savePetPersonality(petId, personality) {
        try {
            await this.database.run(`
                INSERT OR REPLACE INTO pet_personalities (pet_id, personality_data, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `, [petId, JSON.stringify(personality)]);
        } catch (error) {
            logger.error('Failed to save pet personality:', error);
        }
    }

    /**
     * 获取宠物当前状态
     */
    async getPetStatus(petId) {
        try {
            const status = await this.database.get(
                'SELECT hunger, energy, happiness, health FROM pets WHERE id = ?',
                [petId]
            );
            
            return {
                hunger: status?.hunger || 0.5,
                energy: status?.energy || 0.5,
                happiness: status?.happiness || 0.5,
                health: status?.health || 0.5
            };
        } catch (error) {
            logger.error('Failed to get pet status:', error);
            return { hunger: 0.5, energy: 0.5, happiness: 0.5, health: 0.5 };
        }
    }

    /**
     * 确定互动类型
     */
    determineInteractionType(message) {
        const lowerMessage = message.toLowerCase();
        
        // 喂食相关
        if (lowerMessage.includes('喂') || lowerMessage.includes('吃') || lowerMessage.includes('食物')) {
            return 'feed';
        }
        
        // 游戏相关
        if (lowerMessage.includes('玩') || lowerMessage.includes('游戏') || lowerMessage.includes('陪')) {
            return 'play';
        }
        
        // 抚摸相关
        if (lowerMessage.includes('摸') || lowerMessage.includes('抱') || lowerMessage.includes('亲')) {
            return 'pet';
        }
        
        // 训练相关
        if (lowerMessage.includes('训练') || lowerMessage.includes('学习') || lowerMessage.includes('教')) {
            return 'train';
        }
        
        // 称赞相关
        if (lowerMessage.includes('好') || lowerMessage.includes('棒') || lowerMessage.includes('乖')) {
            return 'praise';
        }
        
        // 批评相关
        if (lowerMessage.includes('坏') || lowerMessage.includes('不好') || lowerMessage.includes('不乖')) {
            return 'scold';
        }
        
        // 默认为普通聊天
        return 'chat';
    }

    /**
     * 生成基础AI回应
     */
    async generateBaseResponse(pet, message, personality) {
        try {
            // 构建包含性格信息的提示
            const personalityType = this.personalityEngine.getPersonalityType(personality);
            
            const prompt = `你是一只名叫${pet.name}的${pet.species}，具有以下性格特征：
性格类型：${personalityType.type}
性格描述：${personalityType.description}
主要特质：${personalityType.traits.join('、')}

当前情感状态：${this.personalityEngine.getEmotionalState(personality)}

主人对你说："${message}"

请以这只宠物的身份，根据其性格特征进行回应。回应要体现出宠物的个性，保持简洁自然。`;

            const response = await this.aiService.generateResponse(prompt, {
                maxTokens: 200,
                temperature: 0.8
            });

            return response || `*${pet.name}看着你，似乎在思考如何回应*`;

        } catch (error) {
            logger.error('Failed to generate base response:', error);
            return `*${pet.name}友好地看着你*`;
        }
    }

    /**
     * 基于互动更新宠物状态
     */
    async updatePetStatusFromInteraction(petId, interactionType, personality) {
        try {
            const statusChanges = this.getStatusChangesFromInteraction(interactionType, personality);
            
            if (Object.keys(statusChanges).length > 0) {
                const updateFields = Object.keys(statusChanges).map(field => `${field} = ${field} + ?`).join(', ');
                const values = Object.values(statusChanges);
                values.push(petId);
                
                await this.database.run(`
                    UPDATE pets 
                    SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, values);
            }
        } catch (error) {
            logger.error('Failed to update pet status:', error);
        }
    }

    /**
     * 获取互动对状态的影响
     */
    getStatusChangesFromInteraction(interactionType, personality) {
        const changes = {};
        
        // 基础状态变化
        const baseChanges = {
            'feed': { hunger: 0.2, happiness: 0.1 },
            'play': { energy: -0.1, happiness: 0.15 },
            'pet': { happiness: 0.1 },
            'train': { energy: -0.05 },
            'praise': { happiness: 0.1 },
            'scold': { happiness: -0.05 },
            'chat': { happiness: 0.02 }
        };

        const baseChange = baseChanges[interactionType] || {};
        
        // 基于性格调整变化幅度
        Object.keys(baseChange).forEach(status => {
            let multiplier = 1.0;
            
            // 根据性格特征调整
            if (status === 'happiness') {
                if (personality.emotion.happiness > 0.7) {
                    multiplier = 1.2; // 快乐的宠物更容易变得更快乐
                } else if (personality.emotion.happiness < 0.3) {
                    multiplier = 0.8; // 不快乐的宠物变化较小
                }
            }
            
            changes[status] = baseChange[status] * multiplier;
        });

        // 确保状态值在合理范围内
        Object.keys(changes).forEach(status => {
            changes[status] = Math.max(-0.3, Math.min(0.3, changes[status]));
        });

        return changes;
    }

    /**
     * 获取性格变化信息
     */
    getPersonalityChange(oldPersonality, newPersonality) {
        const changes = {};
        
        ['nature', 'emotion', 'behavior'].forEach(dimension => {
            changes[dimension] = {};
            Object.keys(oldPersonality[dimension]).forEach(trait => {
                if (typeof oldPersonality[dimension][trait] === 'number') {
                    const oldValue = oldPersonality[dimension][trait];
                    const newValue = newPersonality[dimension][trait];
                    const change = newValue - oldValue;
                    
                    if (Math.abs(change) > 0.01) { // 只记录显著变化
                        changes[dimension][trait] = {
                            old: Math.round(oldValue * 100),
                            new: Math.round(newValue * 100),
                            change: Math.round(change * 100)
                        };
                    }
                }
            });
            
            // 如果该维度没有变化，删除空对象
            if (Object.keys(changes[dimension]).length === 0) {
                delete changes[dimension];
            }
        });

        return changes;
    }

    /**
     * 获取宠物性格统计
     */
    async getPetPersonalityStats(petId) {
        try {
            const personality = await this.getPetPersonality(petId);
            if (!personality) {
                return null;
            }

            return this.personalityEngine.getPersonalityStats(personality);
        } catch (error) {
            logger.error('Failed to get personality stats:', error);
            return null;
        }
    }

    /**
     * 重置宠物性格
     */
    async resetPetPersonality(petId) {
        try {
            const pet = await this.database.get('SELECT * FROM pets WHERE id = ?', [petId]);
            if (!pet) {
                throw new Error('Pet not found');
            }

            const newPersonality = this.personalityEngine.initializePetPersonality(pet);
            await this.savePetPersonality(petId, newPersonality);

            logger.info(`宠物 ${pet.name} 的性格已重置`);
            return newPersonality;
        } catch (error) {
            logger.error('Failed to reset pet personality:', error);
            throw error;
        }
    }
}

module.exports = EnhancedPetChatSystem;