/**
 * 灵境斗宠录 - 进化系统集成
 * 作者：树枝 (微信: wzq8083)
 * 
 * 将进化系统集成到现有游戏中的接口层
 */

const EvolutionManager = require('./EvolutionManager');

class EvolutionIntegration {
    constructor() {
        this.evolutionManager = new EvolutionManager();
        this.initialized = false;
    }

    /**
     * 初始化进化系统集成
     */
    async initialize() {
        if (this.initialized) return;

        try {
            await this.evolutionManager.initialize();
            this.initialized = true;
            console.log('🔗 进化系统集成初始化完成');
        } catch (error) {
            console.error('进化系统集成初始化失败:', error);
            throw error;
        }
    }

    /**
     * 游戏行为钩子 - 战斗相关
     */
    onBattleAction(petId, actionType, actionData, context) {
        if (!this.initialized) return;

        const behaviorData = {
            actionType: 'battle',
            subType: actionType,
            data: {
                ...actionData,
                battleType: context.battleType || 'normal',
                opponent: context.opponent,
                result: actionData.result,
                damage: actionData.damage,
                strategy: actionData.strategy
            }
        };

        return this.evolutionManager.recordPetBehavior(petId, 'battle_action', behaviorData, context);
    }

    /**
     * 游戏行为钩子 - 探索相关
     */
    onExplorationAction(petId, actionType, actionData, context) {
        if (!this.initialized) return;

        const behaviorData = {
            actionType: 'exploration',
            subType: actionType,
            data: {
                ...actionData,
                location: context.location,
                discovery: actionData.discovery,
                risk: actionData.risk,
                outcome: actionData.outcome
            }
        };

        return this.evolutionManager.recordPetBehavior(petId, 'exploration_action', behaviorData, context);
    }

    /**
     * 游戏行为钩子 - 社交相关
     */
    onSocialAction(petId, actionType, actionData, context) {
        if (!this.initialized) return;

        const behaviorData = {
            actionType: 'social',
            subType: actionType,
            data: {
                ...actionData,
                interactionType: actionData.interactionType,
                target: actionData.target,
                sentiment: actionData.sentiment,
                outcome: actionData.outcome
            }
        };

        return this.evolutionManager.recordPetBehavior(petId, 'social_action', behaviorData, context);
    }

    /**
     * 游戏行为钩子 - 特殊事件
     */
    onSpecialEvent(petId, eventType, eventData, context) {
        if (!this.initialized) return;

        const behaviorData = {
            actionType: 'special_event',
            subType: eventType,
            data: {
                ...eventData,
                eventId: eventData.eventId,
                choices: eventData.choices,
                selectedChoice: eventData.selectedChoice,
                consequences: eventData.consequences
            }
        };

        return this.evolutionManager.recordPetBehavior(petId, 'special_event', behaviorData, context);
    }

    /**
     * 游戏行为钩子 - 等级提升
     */
    onLevelUp(petId, levelData, context) {
        if (!this.initialized) return;

        const behaviorData = {
            actionType: 'progression',
            subType: 'level_up',
            data: {
                previousLevel: levelData.previousLevel,
                newLevel: levelData.newLevel,
                expGained: levelData.expGained,
                statsIncrease: levelData.statsIncrease,
                newAbilities: levelData.newAbilities
            }
        };

        // 等级提升是重要事件，立即触发分析
        const recordResult = this.evolutionManager.recordPetBehavior(petId, 'level_up', behaviorData, context);
        
        // 异步触发进化分析
        setTimeout(() => {
            this.evolutionManager.triggerEvolutionAnalysis(petId, 'level_up_triggered');
        }, 2000);

        return recordResult;
    }

    /**
     * 游戏行为钩子 - 羁绊变化
     */
    onBondChange(petId, bondData, context) {
        if (!this.initialized) return;

        const behaviorData = {
            actionType: 'bond',
            subType: bondData.change > 0 ? 'bond_increase' : 'bond_decrease',
            data: {
                previousBond: bondData.previousBond,
                newBond: bondData.newBond,
                change: bondData.change,
                reason: bondData.reason,
                milestone: bondData.milestone
            }
        };

        const recordResult = this.evolutionManager.recordPetBehavior(petId, 'bond_change', behaviorData, context);

        // 羁绊里程碑触发分析
        if (bondData.milestone) {
            setTimeout(() => {
                this.evolutionManager.triggerEvolutionAnalysis(petId, 'bond_milestone');
            }, 1000);
        }

        return recordResult;
    }

    /**
     * 手动触发进化分析
     */
    async triggerEvolutionAnalysis(petId) {
        if (!this.initialized) {
            throw new Error('进化系统未初始化');
        }

        return await this.evolutionManager.triggerEvolutionAnalysis(petId, 'manual');
    }

    /**
     * 处理进化
     */
    async processEvolution(petId) {
        if (!this.initialized) {
            throw new Error('进化系统未初始化');
        }

        return await this.evolutionManager.processEvolution(petId);
    }

    /**
     * 获取进化状态
     */
    getEvolutionStatus(petId) {
        if (!this.initialized) {
            return { error: '进化系统未初始化' };
        }

        return this.evolutionManager.getEvolutionStatus(petId);
    }

    /**
     * 获取进化预测
     */
    async getEvolutionPrediction(petId) {
        if (!this.initialized) {
            throw new Error('进化系统未初始化');
        }

        const status = this.evolutionManager.getEvolutionStatus(petId);
        
        if (!status.queueData) {
            // 如果没有队列数据，触发分析
            const analysisResult = await this.evolutionManager.triggerEvolutionAnalysis(petId, 'prediction');
            return analysisResult.analysisResult || null;
        }

        return status.queueData;
    }

    /**
     * 管理员功能 - 强制进化
     */
    async forceEvolution(petId, evolutionPath = null) {
        if (!this.initialized) {
            throw new Error('进化系统未初始化');
        }

        // 强制分析
        await this.evolutionManager.forceEvolutionAnalysis(petId);
        
        // 如果指定了进化路径，修改队列数据
        if (evolutionPath) {
            const status = this.evolutionManager.getEvolutionStatus(petId);
            if (status.queueData) {
                // 找到指定路径并设置为最高概率
                const targetEvolution = status.queueData.availableEvolutions.find(
                    evo => evo.pathName === evolutionPath
                );
                if (targetEvolution) {
                    targetEvolution.probability = 0.99;
                    status.queueData.availableEvolutions.sort((a, b) => b.probability - a.probability);
                }
            }
        }

        return await this.evolutionManager.processEvolution(petId);
    }

    /**
     * 获取进化树信息
     */
    getEvolutionTree(petType) {
        return this.evolutionManager.evolutionSystem.evolutionTrees[petType] || null;
    }

    /**
     * 获取所有可能的进化路径
     */
    getAllEvolutionPaths() {
        return this.evolutionManager.evolutionSystem.evolutionTrees;
    }

    /**
     * 创建进化事件监听器
     */
    createEvolutionEventListener() {
        return {
            // 战斗事件
            onBattle: (petId, battleData, context) => this.onBattleAction(petId, 'battle', battleData, context),
            onVictory: (petId, victoryData, context) => this.onBattleAction(petId, 'victory', victoryData, context),
            onDefeat: (petId, defeatData, context) => this.onBattleAction(petId, 'defeat', defeatData, context),
            
            // 探索事件
            onExplore: (petId, exploreData, context) => this.onExplorationAction(petId, 'explore', exploreData, context),
            onDiscover: (petId, discoveryData, context) => this.onExplorationAction(petId, 'discover', discoveryData, context),
            onRisk: (petId, riskData, context) => this.onExplorationAction(petId, 'risk', riskData, context),
            
            // 社交事件
            onChat: (petId, chatData, context) => this.onSocialAction(petId, 'chat', chatData, context),
            onHelp: (petId, helpData, context) => this.onSocialAction(petId, 'help', helpData, context),
            onLeadership: (petId, leaderData, context) => this.onSocialAction(petId, 'leadership', leaderData, context),
            
            // 特殊事件
            onChoice: (petId, choiceData, context) => this.onSpecialEvent(petId, 'choice', choiceData, context),
            onMoral: (petId, moralData, context) => this.onSpecialEvent(petId, 'moral', moralData, context),
            onSacrifice: (petId, sacrificeData, context) => this.onSpecialEvent(petId, 'sacrifice', sacrificeData, context),
            
            // 成长事件
            onLevelUp: (petId, levelData, context) => this.onLevelUp(petId, levelData, context),
            onBondChange: (petId, bondData, context) => this.onBondChange(petId, bondData, context),
            
            // 进化事件
            onEvolutionTrigger: (petId) => this.triggerEvolutionAnalysis(petId),
            onEvolutionProcess: (petId) => this.processEvolution(petId)
        };
    }
}

// 创建全局实例
const evolutionIntegration = new EvolutionIntegration();

module.exports = evolutionIntegration;