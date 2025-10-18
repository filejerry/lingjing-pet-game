/**
 * 灵境斗宠录 - 进化管理器
 * 作者：树枝 (微信: wzq8083)
 * 
 * 整合三层AI进化系统的管理器
 * 负责协调L1记录、L2分析、L3判断的整个进化流程
 */

const EvolutionSystem = require('./EvolutionSystem');
const AIService = require('../ai/AIService');

class EvolutionManager {
    constructor() {
        this.evolutionSystem = new EvolutionSystem();
        this.aiService = new AIService();
        this.evolutionQueue = new Map(); // 进化队列
        this.behaviorBuffer = new Map(); // 行为缓冲区
        this.evolutionCooldowns = new Map(); // 进化冷却时间
    }

    /**
     * 初始化进化管理器
     */
    async initialize() {
        console.log('🧬 初始化进化管理器...');
        
        // 启动定期分析任务
        this.startPeriodicAnalysis();
        
        // 启动进化检查任务
        this.startEvolutionChecks();
        
        console.log('✅ 进化管理器初始化完成');
    }

    /**
     * 记录宠物行为（L1层接口）
     */
    recordPetBehavior(petId, actionType, actionData, context = {}) {
        try {
            // 构建行为记录
            const behaviorRecord = {
                petId,
                actionType,
                actionData,
                context: {
                    ...context,
                    timestamp: Date.now(),
                    sessionId: context.sessionId || this.generateSessionId(),
                    location: context.location || 'unknown',
                    weather: context.weather || 'normal',
                    mood: context.mood || 'neutral'
                }
            };

            // L1记录层处理
            this.evolutionSystem.recordBehavior(petId, actionType, behaviorRecord);

            // 添加到行为缓冲区
            if (!this.behaviorBuffer.has(petId)) {
                this.behaviorBuffer.set(petId, []);
            }
            this.behaviorBuffer.get(petId).push(behaviorRecord);

            // 限制缓冲区大小
            const buffer = this.behaviorBuffer.get(petId);
            if (buffer.length > 100) {
                buffer.splice(0, buffer.length - 100);
            }

            // 检查是否触发即时分析
            this.checkImmediateAnalysis(petId, behaviorRecord);

            return {
                success: true,
                recordId: this.generateRecordId(behaviorRecord),
                message: '行为记录成功'
            };

        } catch (error) {
            console.error('记录宠物行为失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 检查是否需要即时分析
     */
    checkImmediateAnalysis(petId, behaviorRecord) {
        const triggerActions = [
            'level_up',
            'major_battle_victory',
            'significant_choice',
            'bond_milestone',
            'rare_event_participation'
        ];

        if (triggerActions.includes(behaviorRecord.actionType)) {
            // 延迟执行分析，避免阻塞
            setTimeout(() => {
                this.triggerEvolutionAnalysis(petId, 'immediate');
            }, 1000);
        }
    }

    /**
     * 触发进化分析（L2层接口）
     */
    async triggerEvolutionAnalysis(petId, analysisType = 'standard') {
        try {
            // 检查冷却时间
            if (this.isInCooldown(petId, 'analysis')) {
                return {
                    success: false,
                    reason: 'analysis_cooldown',
                    message: '分析冷却中，请稍后再试'
                };
            }

            // 设置分析冷却
            this.setCooldown(petId, 'analysis', 300000); // 5分钟冷却

            console.log(`🔍 开始对宠物 ${petId} 进行${analysisType}分析...`);

            // L2进化层分析
            const analysisResult = await this.evolutionSystem.analyzeEvolutionPotential(petId);

            // 增强分析结果
            const enhancedResult = await this.enhanceAnalysisWithAI(analysisResult);

            // 检查是否有可用的进化选项
            if (enhancedResult.availableEvolutions.length > 0) {
                console.log(`🌟 发现 ${enhancedResult.availableEvolutions.length} 个可能的进化路径`);
                
                // 添加到进化队列
                this.addToEvolutionQueue(petId, enhancedResult);
                
                // 如果是高概率进化，立即处理
                const highProbEvolution = enhancedResult.availableEvolutions.find(evo => evo.probability > 0.8);
                if (highProbEvolution) {
                    return await this.processEvolution(petId);
                }
            }

            return {
                success: true,
                analysisResult: enhancedResult,
                message: '分析完成'
            };

        } catch (error) {
            console.error('进化分析失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 使用AI增强分析结果
     */
    async enhanceAnalysisWithAI(analysisResult) {
        try {
            const aiPrompt = this.buildAnalysisPrompt(analysisResult);
            const aiResponse = await this.aiService.generateResponse(aiPrompt);
            
            // 解析AI响应并整合到分析结果中
            const aiInsights = this.parseAIAnalysis(aiResponse);
            
            return {
                ...analysisResult,
                aiInsights,
                enhancedProbabilities: this.adjustProbabilitiesWithAI(
                    analysisResult.availableEvolutions, 
                    aiInsights
                )
            };
        } catch (error) {
            console.warn('AI增强分析失败，使用基础分析结果:', error);
            return analysisResult;
        }
    }

    /**
     * 构建AI分析提示词
     */
    buildAnalysisPrompt(analysisResult) {
        return `
作为灵境世界的进化专家，请分析以下宠物的进化潜力：

宠物ID: ${analysisResult.petId}
当前阶段: ${analysisResult.currentStage}

行为模式分析:
${JSON.stringify(analysisResult.behaviorPatterns, null, 2)}

可用进化路径:
${analysisResult.availableEvolutions.map(evo => 
    `- ${evo.pathName}: ${evo.evolutionData.name} (概率: ${(evo.probability * 100).toFixed(1)}%)`
).join('\n')}

请提供以下分析：
1. 最符合宠物性格的进化路径推荐
2. 各路径的优缺点分析
3. 进化时机建议
4. 特殊条件或隐藏路径的可能性
5. 对概率的调整建议

请以JSON格式回复，包含recommendation, pathAnalysis, timing, specialPaths, probabilityAdjustments字段。
        `;
    }

    /**
     * 解析AI分析结果
     */
    parseAIAnalysis(aiResponse) {
        try {
            return JSON.parse(aiResponse);
        } catch (error) {
            console.warn('AI响应解析失败，使用默认分析');
            return {
                recommendation: 'balance',
                pathAnalysis: {},
                timing: 'appropriate',
                specialPaths: [],
                probabilityAdjustments: {}
            };
        }
    }

    /**
     * 处理进化（L3层接口）
     */
    async processEvolution(petId) {
        try {
            // 检查进化冷却
            if (this.isInCooldown(petId, 'evolution')) {
                return {
                    success: false,
                    reason: 'evolution_cooldown',
                    message: '进化冷却中'
                };
            }

            // 从队列中获取分析结果
            const queuedAnalysis = this.evolutionQueue.get(petId);
            if (!queuedAnalysis) {
                return {
                    success: false,
                    reason: 'no_analysis_available',
                    message: '没有可用的进化分析结果'
                };
            }

            console.log(`🚀 开始处理宠物 ${petId} 的进化...`);

            // L3判断层决策
            const evolutionResult = await this.evolutionSystem.determineEvolution(petId, queuedAnalysis);

            if (evolutionResult.success) {
                // 设置进化冷却
                this.setCooldown(petId, 'evolution', 3600000); // 1小时冷却

                // 清除队列中的分析结果
                this.evolutionQueue.delete(petId);

                // 生成进化故事
                const evolutionStory = await this.generateEvolutionStory(evolutionResult);

                console.log(`✨ 宠物 ${petId} 进化成功: ${evolutionResult.previousForm} → ${evolutionResult.newForm}`);

                return {
                    ...evolutionResult,
                    story: evolutionStory,
                    timestamp: Date.now()
                };
            } else {
                console.log(`❌ 宠物 ${petId} 进化失败: ${evolutionResult.reason}`);
                return evolutionResult;
            }

        } catch (error) {
            console.error('处理进化失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成进化故事
     */
    async generateEvolutionStory(evolutionResult) {
        try {
            const storyPrompt = `
宠物进化事件描述：

原形态: ${evolutionResult.previousForm}
新形态: ${evolutionResult.newForm}
进化路径: ${evolutionResult.evolutionPath}
稀有度提升: ${evolutionResult.rarityUpgrade ? '是' : '否'}

请生成一个生动的进化故事描述（200-300字），包括：
1. 进化过程的详细描述
2. 光效和视觉变化
3. 宠物的情感变化
4. 新能力的觉醒
5. 与主人的互动

要求文字优美，富有画面感，体现进化的神奇和震撼。
            `;

            const storyResponse = await this.aiService.generateResponse(storyPrompt);
            return storyResponse || evolutionResult.message;

        } catch (error) {
            console.warn('生成进化故事失败，使用默认描述:', error);
            return evolutionResult.message;
        }
    }

    /**
     * 获取宠物进化状态
     */
    getEvolutionStatus(petId) {
        return {
            inQueue: this.evolutionQueue.has(petId),
            queueData: this.evolutionQueue.get(petId),
            analysisCooldown: this.getCooldownRemaining(petId, 'analysis'),
            evolutionCooldown: this.getCooldownRemaining(petId, 'evolution'),
            recentBehaviors: this.behaviorBuffer.get(petId)?.slice(-10) || []
        };
    }

    /**
     * 强制触发进化分析（管理员功能）
     */
    async forceEvolutionAnalysis(petId) {
        // 清除冷却时间
        this.clearCooldown(petId, 'analysis');
        this.clearCooldown(petId, 'evolution');
        
        return await this.triggerEvolutionAnalysis(petId, 'forced');
    }

    /**
     * 启动定期分析任务
     */
    startPeriodicAnalysis() {
        setInterval(async () => {
            try {
                // 获取所有活跃宠物
                const activePets = await this.getActivePets();
                
                for (const petId of activePets) {
                    // 检查是否需要定期分析
                    if (this.shouldPerformPeriodicAnalysis(petId)) {
                        await this.triggerEvolutionAnalysis(petId, 'periodic');
                    }
                }
            } catch (error) {
                console.error('定期分析任务失败:', error);
            }
        }, 600000); // 每10分钟执行一次
    }

    /**
     * 启动进化检查任务
     */
    startEvolutionChecks() {
        setInterval(async () => {
            try {
                // 处理队列中的进化
                for (const [petId, analysisData] of this.evolutionQueue.entries()) {
                    // 检查分析数据是否过期（1小时）
                    if (Date.now() - analysisData.analysisTimestamp > 3600000) {
                        this.evolutionQueue.delete(petId);
                        continue;
                    }

                    // 检查是否满足自动进化条件
                    const highProbEvolution = analysisData.availableEvolutions.find(evo => evo.probability > 0.9);
                    if (highProbEvolution && !this.isInCooldown(petId, 'evolution')) {
                        await this.processEvolution(petId);
                    }
                }
            } catch (error) {
                console.error('进化检查任务失败:', error);
            }
        }, 300000); // 每5分钟执行一次
    }

    // 辅助方法
    addToEvolutionQueue(petId, analysisResult) {
        this.evolutionQueue.set(petId, {
            ...analysisResult,
            queueTimestamp: Date.now()
        });
    }

    isInCooldown(petId, type) {
        const cooldownKey = `${petId}_${type}`;
        const cooldownEnd = this.evolutionCooldowns.get(cooldownKey);
        return cooldownEnd && Date.now() < cooldownEnd;
    }

    setCooldown(petId, type, duration) {
        const cooldownKey = `${petId}_${type}`;
        this.evolutionCooldowns.set(cooldownKey, Date.now() + duration);
    }

    clearCooldown(petId, type) {
        const cooldownKey = `${petId}_${type}`;
        this.evolutionCooldowns.delete(cooldownKey);
    }

    getCooldownRemaining(petId, type) {
        const cooldownKey = `${petId}_${type}`;
        const cooldownEnd = this.evolutionCooldowns.get(cooldownKey);
        return cooldownEnd ? Math.max(0, cooldownEnd - Date.now()) : 0;
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateRecordId(record) {
        return `${record.petId}_${record.timestamp}_${Math.random().toString(36).substr(2, 5)}`;
    }

    shouldPerformPeriodicAnalysis(petId) {
        // 检查最近是否有足够的行为记录
        const behaviors = this.behaviorBuffer.get(petId) || [];
        const recentBehaviors = behaviors.filter(b => Date.now() - b.context.timestamp < 3600000); // 1小时内
        
        return recentBehaviors.length >= 5 && !this.isInCooldown(petId, 'analysis');
    }

    async getActivePets() {
        // 实现获取活跃宠物列表的逻辑
        // 这里需要根据实际的数据库结构来实现
        return [];
    }

    adjustProbabilitiesWithAI(evolutions, aiInsights) {
        // 根据AI建议调整进化概率
        return evolutions.map(evo => {
            const adjustment = aiInsights.probabilityAdjustments?.[evo.pathName] || 1.0;
            return {
                ...evo,
                probability: Math.max(0.01, Math.min(0.95, evo.probability * adjustment)),
                aiRecommended: aiInsights.recommendation === evo.pathName
            };
        });
    }
}

module.exports = EvolutionManager;