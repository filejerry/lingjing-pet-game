/**
 * 易经状态机核心模块
 * 实现"六爻虽三，位有乘承"的动态演化机制
 * 基于三层AI架构的状态管理和反馈核算法
 */

const logger = require('../utils/logger');

class YiJingStateMachine {
    constructor() {
        // 三爻状态寄存器 - 对应三层AI架构
        this.stateRegister = {
            // 初爻：L1层状态（记录层）
            chuYao: { 
                innovation: 0,           // 创新度偏差 [-1, +1]
                position: 'neutral',     // 得位状态：lost/neutral/gained
                movement: 'static',      // 动静状态：static/dynamic
                yaoType: '阴'           // 爻性：阴/阳
            },
            
            // 二爻：L2层状态（进化层）
            erYao: { 
                structure: 0.5,          // 结构性紊乱 [0, 1]
                position: 'balanced',    // 平衡状态：imbalanced/balanced
                movement: 'stable',      // 重构状态：stable/restructuring
                yaoType: '阴'
            },
            
            // 三爻：L3层状态（判断层）
            sanYao: { 
                stability: 0.5,          // 成象稳定性 [0, 1]
                position: 'stable',      // 稳定状态：unstable/stable
                movement: 'steady',      // 波动状态：steady/fluctuating
                yaoType: '阴'
            }
        };
        
        // 历史状态缓存 - 用于计算变化量
        this.lastMetrics = {
            INNOVATION_SCORE: 0.5,
            REPETITION_SCORE: 0.5,
            TONE: 0.5,
            STRUCTURE_SCORE: 0.5,
            CREATIVITY_INDEX: 0.5,
            COHERENCE_LEVEL: 0.5
        };
        
        // 卦象映射表 - 64卦简化版
        this.hexagramMap = {
            '阳阳阳': '乾为天 ☰ - 创造力旺盛，系统运行顺畅',
            '阴阴阴': '坤为地 ☷ - 承载稳定，需要激发活力',
            '阳阴阳': '离为火 ☲ - 智慧闪现，创新与稳定并存',
            '阴阳阴': '坎为水 ☵ - 深度思考，需要突破困境',
            '阳阳阴': '兑为泽 ☱ - 交流顺畅，输出质量良好',
            '阴阴阳': '艮为山 ☶ - 稳重内敛，积蓄力量中',
            '阳阴阴': '震为雷 ☳ - 突破性进展，变化剧烈',
            '阴阳阳': '巽为风 ☴ - 渐进改善，持续优化中'
        };

        // 状态变化阈值配置
        this.thresholds = {
            innovation: { lost: -0.5, gained: 0.5 },
            structure: { imbalanced: 0.7 },
            stability: { unstable: 0.5 },
            movement: { dynamic: 0.2, restructuring: 0.3, fluctuating: 0.4 }
        };

        logger.info('易经状态机初始化完成');
    }

    /**
     * Oracle Core 反馈核算法
     * 解析AI输出，生成反馈向量和状态更新
     */
    oracleCore(aiOutput, layerType = 'L3') {
        try {
            logger.debug(`Oracle Core 处理 ${layerType} 层输出`);
            
            // 解析AI输出中的指标
            const metrics = this.parseMetrics(aiOutput);
            
            // 计算变化量（与上轮对比）
            const delta = this.calculateDelta(metrics);
            
            // 更新历史缓存
            this.updateMetricsCache(metrics);
            
            // 计算阴阳平衡度
            const yinYangBalance = this.calculateYinYangBalance(aiOutput);
            
            // 生成当前卦象
            const hexagram = this.generateHexagram(delta, metrics);
            
            // 更新状态寄存器
            this.updateStateRegister(delta, metrics, layerType);
            
            // 生成反馈向量
            const feedback = {
                // 核心变化指标
                delta_innov: delta.INNOVATION_SCORE || 0,
                delta_repet: delta.REPETITION_SCORE || 0,
                delta_tone: this.getToneDelta(metrics.TONE),
                delta_creativity: delta.CREATIVITY_INDEX || 0,
                
                // 结构性指标
                struct_score: this.calculateStructureScore(aiOutput),
                coherence_level: metrics.COHERENCE_LEVEL || 0.5,
                
                // 平衡性指标
                yin_yang_balance: yinYangBalance,
                
                // 卦象信息
                hexagram: hexagram,
                hexagram_interpretation: this.getHexagramInterpretation(),
                
                // 状态快照
                stateSnapshot: JSON.parse(JSON.stringify(this.stateRegister)),
                
                // 系统建议
                systemAdvice: this.generateSystemAdvice(),
                
                // 时间戳
                timestamp: new Date().toISOString(),
                layer: layerType
            };

            logger.info(`Oracle Core 完成，当前卦象：${hexagram}`);
            return feedback;

        } catch (error) {
            logger.error('Oracle Core 处理错误:', error);
            return this.getDefaultFeedback();
        }
    }

    /**
     * 解析AI输出中的指标数据
     */
    parseMetrics(output) {
        const metrics = {};
        
        // 定义解析模式
        const patterns = {
            INNOVATION_SCORE: /(?:INNOVATION_SCORE|创新度|创新指数)[:：]\s*([\d\.]+)/i,
            REPETITION_SCORE: /(?:REPETITION_SCORE|重复度|重复指数)[:：]\s*([\d\.]+)/i,
            TONE: /(?:TONE|情感|语调)[:：]\s*(\w+)/i,
            STRUCTURE_SCORE: /(?:STRUCTURE_SCORE|结构度|结构完整性)[:：]\s*([\d\.]+)/i,
            CREATIVITY_INDEX: /(?:CREATIVITY_INDEX|创造力|创造指数)[:：]\s*([\d\.]+)/i,
            COHERENCE_LEVEL: /(?:COHERENCE_LEVEL|连贯性|逻辑性)[:：]\s*([\d\.]+)/i
        };

        // 解析数值指标
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = output.match(pattern);
            if (match) {
                if (key === 'TONE') {
                    metrics[key] = this.parseTone(match[1]);
                } else {
                    metrics[key] = Math.max(0, Math.min(1, parseFloat(match[1])));
                }
            }
        }

        // 智能推断缺失指标
        this.inferMissingMetrics(metrics, output);

        return metrics;
    }

    /**
     * 智能推断缺失的指标
     */
    inferMissingMetrics(metrics, output) {
        // 基于文本长度和复杂度推断创新度
        if (!metrics.INNOVATION_SCORE) {
            const uniqueWords = new Set(output.toLowerCase().match(/\w+/g) || []).size;
            const totalWords = (output.match(/\w+/g) || []).length;
            metrics.INNOVATION_SCORE = Math.min(1, uniqueWords / Math.max(totalWords, 1) * 2);
        }

        // 基于重复模式推断重复度
        if (!metrics.REPETITION_SCORE) {
            const sentences = output.split(/[。！？.!?]/).filter(s => s.trim());
            const uniqueSentences = new Set(sentences.map(s => s.trim())).size;
            metrics.REPETITION_SCORE = 1 - (uniqueSentences / Math.max(sentences.length, 1));
        }

        // 基于情感词汇推断语调
        if (!metrics.TONE) {
            const positiveWords = (output.match(/[好棒优秀精彩美妙]/g) || []).length;
            const negativeWords = (output.match(/[坏差错误失败糟糕]/g) || []).length;
            if (positiveWords > negativeWords) {
                metrics.TONE = 0.8;
            } else if (negativeWords > positiveWords) {
                metrics.TONE = 0.2;
            } else {
                metrics.TONE = 0.5;
            }
        }
    }

    /**
     * 计算变化量
     */
    calculateDelta(metrics) {
        const delta = {};
        for (const [key, value] of Object.entries(metrics)) {
            delta[key] = value - (this.lastMetrics[key] || 0.5);
        }
        return delta;
    }

    /**
     * 更新指标缓存
     */
    updateMetricsCache(metrics) {
        this.lastMetrics = { ...this.lastMetrics, ...metrics };
    }

    /**
     * 解析情感倾向
     */
    parseTone(tone) {
        const toneMap = { 
            '积极': 0.8, '正面': 0.8, '乐观': 0.8, '开心': 0.9,
            '中性': 0.5, '平静': 0.5, '普通': 0.5,
            '消极': 0.2, '负面': 0.2, '悲观': 0.2, '沮丧': 0.1
        };
        return toneMap[tone] || 0.5;
    }

    /**
     * 获取情感变化量
     */
    getToneDelta(currentTone) {
        const current = typeof currentTone === 'string' ? this.parseTone(currentTone) : currentTone;
        return current > 0.6 ? 1 : current < 0.4 ? -1 : 0;
    }

    /**
     * 计算阴阳平衡度
     */
    calculateYinYangBalance(output) {
        // 统计阴阳特征词汇
        const yinWords = (output.match(/[静柔慢缓温和平稳内敛]/g) || []).length;
        const yangWords = (output.match(/[动刚快急热烈激进外向]/g) || []).length;
        
        if (yinWords + yangWords === 0) return 0.5;
        return Math.min(yinWords, yangWords) / Math.max(yinWords, yangWords, 1);
    }

    /**
     * 计算结构完整性得分
     */
    calculateStructureScore(output) {
        let score = 0;
        
        // 检查是否包含模块标识
        if (output.includes('MODULES:') || output.includes('模块:')) score += 0.3;
        
        // 检查是否有清晰的段落结构
        const paragraphs = output.split('\n').filter(p => p.trim());
        if (paragraphs.length >= 3) score += 0.3;
        
        // 检查是否有逻辑连接词
        const connectors = (output.match(/[因此所以但是然而不过而且并且]/g) || []).length;
        score += Math.min(0.4, connectors * 0.1);
        
        return Math.min(1, score);
    }

    /**
     * 生成卦象
     */
    generateHexagram(delta, metrics) {
        const yaos = [];
        
        // 初爻：基于创新度变化
        const innovationYao = delta.INNOVATION_SCORE > 0 ? '阳' : '阴';
        yaos.push(innovationYao);
        this.stateRegister.chuYao.yaoType = innovationYao;
        
        // 二爻：基于结构稳定性（低重复度为阳）
        const structureYao = (metrics.REPETITION_SCORE || 0.5) < 0.3 ? '阳' : '阴';
        yaos.push(structureYao);
        this.stateRegister.erYao.yaoType = structureYao;
        
        // 三爻：基于情感倾向
        const stabilityYao = (metrics.TONE || 0.5) > 0.6 ? '阳' : '阴';
        yaos.push(stabilityYao);
        this.stateRegister.sanYao.yaoType = stabilityYao;
        
        const yaoPattern = yaos.join('');
        return this.hexagramMap[yaoPattern] || `自定义卦象(${yaoPattern}) - 系统处于特殊状态`;
    }

    /**
     * 更新状态寄存器
     */
    updateStateRegister(delta, metrics, layerType) {
        // 初爻状态更新（L1层 - 记录层）
        const innovDelta = delta.INNOVATION_SCORE || 0;
        this.stateRegister.chuYao.innovation = Math.max(-1, Math.min(1, innovDelta));
        this.stateRegister.chuYao.position = innovDelta < this.thresholds.innovation.lost ? 'lost' : 
                                           innovDelta > this.thresholds.innovation.gained ? 'gained' : 'neutral';
        this.stateRegister.chuYao.movement = Math.abs(innovDelta) > this.thresholds.movement.dynamic ? 'dynamic' : 'static';

        // 二爻状态更新（L2层 - 进化层）
        const structuralDisorder = 1 - (metrics.STRUCTURE_SCORE || 0.5);
        this.stateRegister.erYao.structure = structuralDisorder;
        this.stateRegister.erYao.position = structuralDisorder > this.thresholds.structure.imbalanced ? 'imbalanced' : 'balanced';
        this.stateRegister.erYao.movement = Math.abs(delta.STRUCTURE_SCORE || 0) > this.thresholds.movement.restructuring ? 'restructuring' : 'stable';

        // 三爻状态更新（L3层 - 判断层）
        const stability = 1 - Math.abs(delta.TONE || 0);
        this.stateRegister.sanYao.stability = stability;
        this.stateRegister.sanYao.position = stability < this.thresholds.stability.unstable ? 'unstable' : 'stable';
        this.stateRegister.sanYao.movement = Math.abs(delta.TONE || 0) > this.thresholds.movement.fluctuating ? 'fluctuating' : 'steady';

        logger.debug(`状态寄存器已更新 - ${layerType}层触发`);
    }

    /**
     * 获取当前卦象解读
     */
    getHexagramInterpretation() {
        const { chuYao, erYao, sanYao } = this.stateRegister;
        
        let interpretation = "🔮 系统状态解读：\n";
        
        // 初爻解读（L1层）
        if (chuYao.position === 'lost') {
            interpretation += "• 初爻（记录层）：潜龙失位，创新能力待激发，建议增加输入多样性\n";
        } else if (chuYao.position === 'gained') {
            interpretation += "• 初爻（记录层）：龙德正中，创新势头良好，记录质量优秀\n";
        } else {
            interpretation += "• 初爻（记录层）：龙潜勿用，创新处于平衡态，稳定记录中\n";
        }

        // 二爻解读（L2层）
        if (erYao.position === 'imbalanced') {
            interpretation += "• 二爻（进化层）：坤载失衡，结构需要重构，建议优化进化算法\n";
        } else {
            interpretation += "• 二爻（进化层）：厚德载物，结构稳定有序，进化机制运行良好\n";
        }

        // 三爻解读（L3层）
        if (sanYao.position === 'unstable') {
            interpretation += "• 三爻（判断层）：坎险未济，输出稳定性待提升，建议调整判断阈值\n";
        } else {
            interpretation += "• 三爻（判断层）：既济定位，系统输出稳定，判断机制可靠\n";
        }

        return interpretation;
    }

    /**
     * 生成系统建议
     */
    generateSystemAdvice() {
        const { chuYao, erYao, sanYao } = this.stateRegister;
        const advice = [];

        // 基于初爻状态给出建议
        if (chuYao.position === 'lost') {
            advice.push("🔄 建议增加L1层输入的多样性和创新性");
        }
        if (chuYao.movement === 'dynamic') {
            advice.push("⚡ L1层变化剧烈，注意保持记录的连续性");
        }

        // 基于二爻状态给出建议
        if (erYao.position === 'imbalanced') {
            advice.push("🔧 L2层结构失衡，建议重新校准进化参数");
        }
        if (erYao.movement === 'restructuring') {
            advice.push("🏗️ L2层正在重构，暂时降低进化频率");
        }

        // 基于三爻状态给出建议
        if (sanYao.position === 'unstable') {
            advice.push("🎯 L3层判断不稳定，建议调整决策阈值");
        }
        if (sanYao.movement === 'fluctuating') {
            advice.push("📊 L3层输出波动，增加判断的一致性检查");
        }

        // 综合建议
        const yaoTypes = [chuYao.yaoType, erYao.yaoType, sanYao.yaoType];
        const yangCount = yaoTypes.filter(t => t === '阳').length;
        
        if (yangCount === 3) {
            advice.push("🌟 系统处于高活跃状态，适合进行创新性任务");
        } else if (yangCount === 0) {
            advice.push("🌙 系统处于内敛状态，适合进行稳定性优化");
        } else {
            advice.push("⚖️ 系统阴阳平衡，适合进行常规任务处理");
        }

        return advice.length > 0 ? advice : ["✅ 系统运行正常，继续保持当前状态"];
    }

    /**
     * 获取默认反馈
     */
    getDefaultFeedback() {
        return {
            delta_innov: 0,
            delta_repet: 0,
            delta_tone: 0,
            delta_creativity: 0,
            struct_score: 0.5,
            coherence_level: 0.5,
            yin_yang_balance: 0.5,
            hexagram: '坤为地 ☷ - 系统处于基础状态',
            hexagram_interpretation: "系统处于默认状态，等待激活",
            stateSnapshot: this.stateRegister,
            systemAdvice: ["系统初始化中，请稍候"],
            timestamp: new Date().toISOString(),
            layer: 'DEFAULT'
        };
    }

    /**
     * 获取状态统计信息
     */
    getStateStats() {
        return {
            currentHexagram: this.generateHexagram({}, this.lastMetrics),
            stateRegister: this.stateRegister,
            lastMetrics: this.lastMetrics,
            systemHealth: this.calculateSystemHealth(),
            uptime: process.uptime()
        };
    }

    /**
     * 计算系统健康度
     */
    calculateSystemHealth() {
        const { chuYao, erYao, sanYao } = this.stateRegister;
        
        let healthScore = 0;
        
        // 各层健康度评估
        healthScore += chuYao.position !== 'lost' ? 0.33 : 0;
        healthScore += erYao.position !== 'imbalanced' ? 0.33 : 0;
        healthScore += sanYao.position !== 'unstable' ? 0.34 : 0;
        
        return {
            score: Math.round(healthScore * 100),
            status: healthScore > 0.8 ? 'excellent' : 
                   healthScore > 0.6 ? 'good' : 
                   healthScore > 0.4 ? 'fair' : 'poor'
        };
    }

    /**
     * 重置状态机
     */
    reset() {
        this.stateRegister = {
            chuYao: { innovation: 0, position: 'neutral', movement: 'static', yaoType: '阴' },
            erYao: { structure: 0.5, position: 'balanced', movement: 'stable', yaoType: '阴' },
            sanYao: { stability: 0.5, position: 'stable', movement: 'steady', yaoType: '阴' }
        };
        
        this.lastMetrics = {
            INNOVATION_SCORE: 0.5,
            REPETITION_SCORE: 0.5,
            TONE: 0.5,
            STRUCTURE_SCORE: 0.5,
            CREATIVITY_INDEX: 0.5,
            COHERENCE_LEVEL: 0.5
        };
        
        logger.info('易经状态机已重置');
    }
}

module.exports = YiJingStateMachine;