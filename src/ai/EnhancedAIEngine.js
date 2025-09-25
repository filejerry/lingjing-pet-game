/**
 * 增强版AI引擎 - 集成易经状态机
 * 在原有三层架构基础上添加动态演化机制
 */

const CorrectAIEngine = require('./CorrectAIEngine');
const YiJingStateMachine = require('./YiJingStateMachine');
const logger = require('../utils/logger');

class EnhancedAIEngine extends CorrectAIEngine {
    constructor(aiService, database) {
        super(aiService, database);
        
        // 集成易经状态机
        this.yijingStateMachine = new YiJingStateMachine();
        
        // 扩展边界配置
        this.ENHANCED_BOUNDARIES = {
            ...this.BOUNDARIES,
            YIJING_FEEDBACK_THRESHOLD: 0.3,  // 触发易经反馈的阈值
            STATE_EVOLUTION_INTERVAL: 5,     // 状态演化检查间隔（分钟）
            HEXAGRAM_INFLUENCE_WEIGHT: 0.2   // 卦象对决策的影响权重
        };

        logger.info('Enhanced AI Engine with YiJing State Machine initialized');
    }

    /**
     * 增强版L1记录层 - 集成状态感知
     */
    async processL1Record(petId, userInput, context = {}) {
        try {
            // 调用原有L1处理
            const l1Result = await super.processL1Record(petId, userInput, context);
            
            // 使用易经状态机分析L1输出
            const yijingFeedback = this.yijingStateMachine.oracleCore(
                JSON.stringify(l1Result), 
                'L1'
            );
            
            // 根据卦象调整记录策略
            const enhancedResult = this.applyYiJingEnhancement(l1Result, yijingFeedback, 'L1');
            
            logger.debug(`L1层易经增强完成，当前卦象：${yijingFeedback.hexagram}`);
            
            return {
                ...enhancedResult,
                yijingFeedback: yijingFeedback,
                layer: 'L1_ENHANCED'
            };

        } catch (error) {
            logger.error('Enhanced L1 processing failed:', error);
            return await super.processL1Record(petId, userInput, context);
        }
    }

    /**
     * 增强版L2进化层 - 基于状态机的动态进化
     */
    async processL2Evolution(petId, l1Data, context = {}) {
        try {
            // 获取当前状态机状态
            const currentState = this.yijingStateMachine.getStateStats();
            
            // 根据二爻状态调整进化策略
            const evolutionStrategy = this.determineEvolutionStrategy(currentState);
            
            // 调用原有L2处理，传入增强的上下文
            const enhancedContext = {
                ...context,
                evolutionStrategy,
                yijingState: currentState
            };
            
            const l2Result = await super.processL2Evolution(petId, l1Data, enhancedContext);
            
            // 分析L2输出
            const yijingFeedback = this.yijingStateMachine.oracleCore(
                JSON.stringify(l2Result), 
                'L2'
            );
            
            // 应用易经增强
            const enhancedResult = this.applyYiJingEnhancement(l2Result, yijingFeedback, 'L2');
            
            logger.debug(`L2层易经增强完成，进化策略：${evolutionStrategy.type}`);
            
            return {
                ...enhancedResult,
                yijingFeedback: yijingFeedback,
                evolutionStrategy: evolutionStrategy,
                layer: 'L2_ENHANCED'
            };

        } catch (error) {
            logger.error('Enhanced L2 processing failed:', error);
            return await super.processL2Evolution(petId, l1Data, context);
        }
    }

    /**
     * 增强版L3判断层 - 卦象指导的智能决策
     */
    async processL3Judgment(petId, l2Data, context = {}) {
        try {
            // 获取当前卦象信息
            const currentState = this.yijingStateMachine.getStateStats();
            const hexagramGuidance = this.getHexagramGuidance(currentState.currentHexagram);
            
            // 调用原有L3处理
            const l3Result = await super.processL3Judgment(petId, l2Data, {
                ...context,
                hexagramGuidance,
                yijingState: currentState
            });
            
            // 分析L3输出并生成最终反馈
            const yijingFeedback = this.yijingStateMachine.oracleCore(
                JSON.stringify(l3Result), 
                'L3'
            );
            
            // 基于三爻状态调整最终输出
            const enhancedResult = this.applyYiJingEnhancement(l3Result, yijingFeedback, 'L3');
            
            // 检查是否需要触发系统级调整
            await this.checkSystemAdjustment(yijingFeedback);
            
            logger.info(`L3层易经增强完成，系统建议：${yijingFeedback.systemAdvice.join('; ')}`);
            
            return {
                ...enhancedResult,
                yijingFeedback: yijingFeedback,
                hexagramGuidance: hexagramGuidance,
                layer: 'L3_ENHANCED'
            };

        } catch (error) {
            logger.error('Enhanced L3 processing failed:', error);
            return await super.processL3Judgment(petId, l2Data, context);
        }
    }

    /**
     * 根据二爻状态确定进化策略
     */
    determineEvolutionStrategy(currentState) {
        const erYao = currentState.stateRegister.erYao;
        
        if (erYao.position === 'imbalanced') {
            return {
                type: 'RESTRUCTURING',
                description: '坤载失衡，启动结构重构',
                parameters: {
                    conservatism: 0.8,  // 保守度提高
                    stability_weight: 0.9,
                    innovation_limit: 0.3
                }
            };
        } else if (erYao.movement === 'restructuring') {
            return {
                type: 'GRADUAL_EVOLUTION',
                description: '渐进式进化，保持稳定性',
                parameters: {
                    conservatism: 0.6,
                    stability_weight: 0.7,
                    innovation_limit: 0.5
                }
            };
        } else {
            return {
                type: 'BALANCED_EVOLUTION',
                description: '平衡进化，正常发展',
                parameters: {
                    conservatism: 0.4,
                    stability_weight: 0.5,
                    innovation_limit: 0.7
                }
            };
        }
    }

    /**
     * 获取卦象指导信息
     */
    getHexagramGuidance(hexagram) {
        const guidanceMap = {
            '乾为天': {
                decision_style: 'ASSERTIVE',
                risk_tolerance: 0.8,
                creativity_boost: 0.9,
                advice: '天行健，君子以自强不息。适合大胆创新和积极行动。'
            },
            '坤为地': {
                decision_style: 'CONSERVATIVE',
                risk_tolerance: 0.2,
                creativity_boost: 0.3,
                advice: '地势坤，君子以厚德载物。适合稳健发展和积累基础。'
            },
            '离为火': {
                decision_style: 'ILLUMINATING',
                risk_tolerance: 0.6,
                creativity_boost: 0.8,
                advice: '明两作，大人以继明照于四方。适合智慧决策和创新突破。'
            },
            '坎为水': {
                decision_style: 'ADAPTIVE',
                risk_tolerance: 0.4,
                creativity_boost: 0.5,
                advice: '水洊至，习坎。适合灵活应对和深度思考。'
            }
        };

        const hexagramKey = hexagram.split(' ')[0]; // 提取卦名
        return guidanceMap[hexagramKey] || {
            decision_style: 'BALANCED',
            risk_tolerance: 0.5,
            creativity_boost: 0.5,
            advice: '保持平衡，稳中求进。'
        };
    }

    /**
     * 应用易经增强
     */
    applyYiJingEnhancement(originalResult, yijingFeedback, layer) {
        const enhancement = {
            // 原始结果
            ...originalResult,
            
            // 易经增强信息
            yijing_enhancement: {
                hexagram: yijingFeedback.hexagram,
                interpretation: yijingFeedback.hexagram_interpretation,
                system_advice: yijingFeedback.systemAdvice,
                balance_score: yijingFeedback.yin_yang_balance,
                layer_specific_guidance: this.getLayerSpecificGuidance(layer, yijingFeedback)
            },
            
            // 调整后的置信度
            confidence: this.adjustConfidenceByYiJing(
                originalResult.confidence || 0.5, 
                yijingFeedback
            ),
            
            // 增强标记
            enhanced_by_yijing: true,
            enhancement_timestamp: new Date().toISOString()
        };

        return enhancement;
    }

    /**
     * 获取层级特定的指导
     */
    getLayerSpecificGuidance(layer, yijingFeedback) {
        const guidance = {
            L1: {
                focus: '记录质量和输入多样性',
                adjustment: yijingFeedback.delta_innov > 0 ? '增加创新记录' : '保持稳定记录'
            },
            L2: {
                focus: '进化策略和结构优化',
                adjustment: yijingFeedback.struct_score > 0.7 ? '加速进化' : '稳定进化'
            },
            L3: {
                focus: '判断准确性和输出稳定性',
                adjustment: yijingFeedback.yin_yang_balance > 0.6 ? '平衡输出' : '调整判断阈值'
            }
        };

        return guidance[layer] || guidance.L3;
    }

    /**
     * 基于易经反馈调整置信度
     */
    adjustConfidenceByYiJing(originalConfidence, yijingFeedback) {
        let adjustment = 0;
        
        // 基于阴阳平衡调整
        if (yijingFeedback.yin_yang_balance > 0.7) {
            adjustment += 0.1; // 平衡度高，增加置信度
        } else if (yijingFeedback.yin_yang_balance < 0.3) {
            adjustment -= 0.1; // 平衡度低，降低置信度
        }
        
        // 基于结构完整性调整
        if (yijingFeedback.struct_score > 0.8) {
            adjustment += 0.05;
        } else if (yijingFeedback.struct_score < 0.3) {
            adjustment -= 0.05;
        }
        
        return Math.max(0, Math.min(1, originalConfidence + adjustment));
    }

    /**
     * 检查是否需要系统级调整
     */
    async checkSystemAdjustment(yijingFeedback) {
        const { stateSnapshot } = yijingFeedback;
        
        // 检查是否所有层都处于不良状态
        const allLayersUnhealthy = 
            stateSnapshot.chuYao.position === 'lost' &&
            stateSnapshot.erYao.position === 'imbalanced' &&
            stateSnapshot.sanYao.position === 'unstable';
            
        if (allLayersUnhealthy) {
            logger.warn('系统三层均处于不良状态，触发系统级调整');
            await this.triggerSystemRecalibration();
        }
        
        // 检查是否需要重置状态机
        const systemHealth = this.yijingStateMachine.calculateSystemHealth();
        if (systemHealth.score < 30) {
            logger.warn(`系统健康度过低(${systemHealth.score})，建议重置状态机`);
        }
    }

    /**
     * 触发系统重新校准
     */
    async triggerSystemRecalibration() {
        try {
            logger.info('开始系统重新校准...');
            
            // 重置状态机
            this.yijingStateMachine.reset();
            
            // 清理缓存
            if (this.cache) {
                this.cache.clear();
            }
            
            // 记录校准事件
            await this.database.run(`
                INSERT INTO system_events (event_type, description, timestamp)
                VALUES (?, ?, ?)
            `, ['SYSTEM_RECALIBRATION', 'YiJing state machine triggered system recalibration', new Date().toISOString()]);
            
            logger.info('系统重新校准完成');
            
        } catch (error) {
            logger.error('系统重新校准失败:', error);
        }
    }

    /**
     * 获取增强版系统状态
     */
    getEnhancedSystemStatus() {
        const baseStatus = super.getSystemStatus ? super.getSystemStatus() : {};
        const yijingStats = this.yijingStateMachine.getStateStats();
        
        return {
            ...baseStatus,
            yijing_state_machine: {
                current_hexagram: yijingStats.currentHexagram,
                system_health: yijingStats.systemHealth,
                state_register: yijingStats.stateRegister,
                last_metrics: yijingStats.lastMetrics
            },
            enhanced_features: {
                oracle_core_active: true,
                dynamic_evolution: true,
                hexagram_guidance: true,
                system_recalibration: true
            }
        };
    }

    /**
     * 手动触发Oracle Core分析
     */
    async analyzeWithOracleCore(input, layerType = 'L3') {
        return this.yijingStateMachine.oracleCore(input, layerType);
    }
}

module.exports = EnhancedAIEngine;