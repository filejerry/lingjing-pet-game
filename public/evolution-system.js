/**
 * 灵境斗宠录 - 三层AI进化系统前端集成
 * 作者：树枝 (微信: wzq8083)
 */

// 进化系统核心类
class EvolutionSystemFrontend {
    constructor() {
        this.behaviorHistory = [];
        this.evolutionPredictions = null;
        this.lastAnalysisTime = 0;
    }

    // 记录宠物行为（L1层 - 记录层）
    recordBehavior(behaviorType, context) {
        const behavior = {
            type: behaviorType,
            context: context,
            timestamp: Date.now(),
            petState: this.getCurrentPetSnapshot()
        };

        this.behaviorHistory.push(behavior);
        
        // 保持历史记录在合理范围内
        if (this.behaviorHistory.length > 1000) {
            this.behaviorHistory = this.behaviorHistory.slice(-800);
        }

        // 更新游戏状态
        if (gameState.evolutionData) {
            gameState.evolutionData.behaviorHistory = this.behaviorHistory;
        }

        console.log('🔍 记录行为:', behaviorType, context);
    }

    // 获取当前宠物状态快照
    getCurrentPetSnapshot() {
        if (!gameState.currentPet) return null;
        
        return {
            level: gameState.currentPet.level,
            exp: gameState.currentPet.exp,
            bond: gameState.currentPet.bond,
            mood: gameState.currentPet.mood,
            stats: {
                hp: gameState.currentPet.hp,
                attack: gameState.currentPet.attack,
                defense: gameState.currentPet.defense,
                speed: gameState.currentPet.speed,
                magic: gameState.currentPet.magic
            }
        };
    }

    // L2层 - 进化分析层
    async analyzeEvolutionPotential() {
        if (!gameState.currentPet || this.behaviorHistory.length < 10) {
            return null;
        }

        // 检查冷却时间
        const now = Date.now();
        if (now - this.lastAnalysisTime < EVOLUTION_CONFIG.cooldowns.analysis) {
            return this.evolutionPredictions;
        }

        try {
            // 分析行为模式
            const behaviorPatterns = this.analyzeBehaviorPatterns();
            
            // 计算进化倾向
            const evolutionTendencies = this.calculateEvolutionTendencies(behaviorPatterns);
            
            // 生成进化预测
            const predictions = this.generateEvolutionPredictions(evolutionTendencies);
            
            this.evolutionPredictions = predictions;
            this.lastAnalysisTime = now;
            
            // 更新游戏状态
            if (gameState.evolutionData) {
                gameState.evolutionData.lastAnalysis = predictions;
            }

            console.log('🧠 进化分析完成:', predictions);
            return predictions;

        } catch (error) {
            console.error('进化分析失败:', error);
            return null;
        }
    }

    // 分析行为模式
    analyzeBehaviorPatterns() {
        const patterns = {
            aggressive: 0,
            defensive: 0,
            strategic: 0,
            healing: 0,
            curious: 0,
            cautious: 0,
            reckless: 0,
            helpful: 0,
            leadership: 0,
            cooperation: 0,
            independence: 0,
            moral: 0,
            sacrifice: 0,
            power_seeking: 0,
            knowledge: 0
        };

        // 分析最近的行为记录
        const recentBehaviors = this.behaviorHistory.slice(-100);
        
        recentBehaviors.forEach(behavior => {
            switch (behavior.type) {
                case 'choice':
                    this.analyzeChoiceBehavior(behavior, patterns);
                    break;
                case 'combat':
                    this.analyzeCombatBehavior(behavior, patterns);
                    break;
                case 'interaction':
                    this.analyzeInteractionBehavior(behavior, patterns);
                    break;
                case 'exploration':
                    this.analyzeExplorationBehavior(behavior, patterns);
                    break;
            }
        });

        // 归一化权重
        const total = Object.values(patterns).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(patterns).forEach(key => {
                patterns[key] = patterns[key] / total;
            });
        }

        return patterns;
    }

    // 分析选择行为
    analyzeChoiceBehavior(behavior, patterns) {
        const choice = behavior.context.choiceId;
        
        // 根据选择类型增加对应的行为权重
        if (choice.includes('aggressive') || choice.includes('attack')) {
            patterns.aggressive += 1;
        }
        if (choice.includes('defensive') || choice.includes('protect')) {
            patterns.defensive += 1;
        }
        if (choice.includes('strategic') || choice.includes('plan')) {
            patterns.strategic += 1;
        }
        if (choice.includes('heal') || choice.includes('help')) {
            patterns.healing += 1;
            patterns.helpful += 1;
        }
        if (choice.includes('explore') || choice.includes('investigate')) {
            patterns.curious += 1;
        }
        if (choice.includes('safe') || choice.includes('careful')) {
            patterns.cautious += 1;
        }
        if (choice.includes('risk') || choice.includes('danger')) {
            patterns.reckless += 1;
        }
    }

    // 分析战斗行为
    analyzeCombatBehavior(behavior, patterns) {
        const action = behavior.context.action;
        
        if (action === 'attack') patterns.aggressive += 1;
        if (action === 'defend') patterns.defensive += 1;
        if (action === 'heal') patterns.healing += 1;
        if (action === 'strategy') patterns.strategic += 1;
    }

    // 分析交互行为
    analyzeInteractionBehavior(behavior, patterns) {
        const interaction = behavior.context.type;
        
        if (interaction === 'help_others') {
            patterns.helpful += 1;
            patterns.moral += 1;
        }
        if (interaction === 'leadership') {
            patterns.leadership += 1;
        }
        if (interaction === 'cooperation') {
            patterns.cooperation += 1;
        }
    }

    // 分析探索行为
    analyzeExplorationBehavior(behavior, patterns) {
        const exploration = behavior.context.type;
        
        if (exploration === 'knowledge_seeking') {
            patterns.knowledge += 1;
            patterns.curious += 1;
        }
        if (exploration === 'power_seeking') {
            patterns.power_seeking += 1;
        }
    }

    // 计算进化倾向
    calculateEvolutionTendencies(behaviorPatterns) {
        const tendencies = {
            power: 0,
            wisdom: 0,
            balance: 0,
            healing: 0,
            fire: 0,
            divine: 0,
            chaos: 0,
            justice: 0,
            prophecy: 0,
            fortune: 0
        };

        // 根据行为权重配置计算进化倾向
        Object.keys(behaviorPatterns).forEach(behavior => {
            const weight = behaviorPatterns[behavior];
            const config = EVOLUTION_CONFIG.behaviorWeights[behavior];
            
            if (config) {
                Object.keys(config).forEach(tendency => {
                    tendencies[tendency] += weight * config[tendency];
                });
            }
        });

        return tendencies;
    }

    // 生成进化预测
    generateEvolutionPredictions(tendencies) {
        const predictions = [];
        
        // 获取当前宠物信息
        const pet = gameState.currentPet;
        if (!pet) return predictions;

        // 基于倾向生成可能的进化路径
        const sortedTendencies = Object.entries(tendencies)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3); // 取前3个最强倾向

        sortedTendencies.forEach(([tendency, strength], index) => {
            const evolutionPath = this.generateEvolutionPath(pet, tendency, strength);
            if (evolutionPath) {
                evolutionPath.probability = Math.max(0.1, strength * (1 - index * 0.2));
                predictions.push(evolutionPath);
            }
        });

        return predictions;
    }

    // 生成进化路径
    generateEvolutionPath(pet, tendency, strength) {
        const evolutionPaths = {
            power: {
                name: '力量进化',
                description: '向着更强大的战斗形态进化',
                nextForm: this.getPowerEvolution(pet.species),
                statBonus: { attack: 15, hp: 10, defense: 5 },
                newTraits: ['霸者威压', '力量爆发']
            },
            wisdom: {
                name: '智慧进化',
                description: '获得更高的智慧和魔法能力',
                nextForm: this.getWisdomEvolution(pet.species),
                statBonus: { magic: 20, speed: 10 },
                newTraits: ['智者洞察', '魔法精通']
            },
            balance: {
                name: '平衡进化',
                description: '各项能力均衡发展',
                nextForm: this.getBalanceEvolution(pet.species),
                statBonus: { hp: 8, attack: 8, defense: 8, speed: 8, magic: 8 },
                newTraits: ['完美平衡', '适应能力']
            },
            healing: {
                name: '治愈进化',
                description: '专精于治疗和支援能力',
                nextForm: this.getHealingEvolution(pet.species),
                statBonus: { magic: 15, hp: 15, defense: 10 },
                newTraits: ['生命之光', '治愈精通']
            },
            fire: {
                name: '烈焰进化',
                description: '掌控火焰的力量',
                nextForm: this.getFireEvolution(pet.species),
                statBonus: { attack: 18, magic: 12 },
                newTraits: ['烈焰掌控', '火焰免疫']
            },
            divine: {
                name: '神圣进化',
                description: '获得神圣的力量和庇护',
                nextForm: this.getDivineEvolution(pet.species),
                statBonus: { magic: 15, defense: 15, hp: 10 },
                newTraits: ['神圣庇护', '光明之力']
            }
        };

        return evolutionPaths[tendency] || null;
    }

    // 获取不同类型的进化形态
    getPowerEvolution(species) {
        const powerEvolutions = {
            '幼龙': '战龙',
            '凤凰雏鸟': '战凤',
            '麒麟幼崽': '战麒麟'
        };
        return powerEvolutions[species] || `强化${species}`;
    }

    getWisdomEvolution(species) {
        const wisdomEvolutions = {
            '幼龙': '智慧龙',
            '凤凰雏鸟': '智慧凤凰',
            '麒麟幼崽': '智慧麒麟'
        };
        return wisdomEvolutions[species] || `智慧${species}`;
    }

    getBalanceEvolution(species) {
        const balanceEvolutions = {
            '幼龙': '均衡龙',
            '凤凰雏鸟': '均衡凤凰',
            '麒麟幼崽': '均衡麒麟'
        };
        return balanceEvolutions[species] || `均衡${species}`;
    }

    getHealingEvolution(species) {
        const healingEvolutions = {
            '幼龙': '治愈龙',
            '凤凰雏鸟': '治愈凤凰',
            '麒麟幼崽': '治愈麒麟'
        };
        return healingEvolutions[species] || `治愈${species}`;
    }

    getFireEvolution(species) {
        const fireEvolutions = {
            '幼龙': '烈焰龙',
            '凤凰雏鸟': '烈焰凤凰',
            '麒麟幼崽': '烈焰麒麟'
        };
        return fireEvolutions[species] || `烈焰${species}`;
    }

    getDivineEvolution(species) {
        const divineEvolutions = {
            '幼龙': '神圣龙',
            '凤凰雏鸟': '神圣凤凰',
            '麒麟幼崽': '神圣麒麟'
        };
        return divineEvolutions[species] || `神圣${species}`;
    }

    // L3层 - 判断层：检查是否可以进化
    canEvolve() {
        const pet = gameState.currentPet;
        if (!pet) return false;

        // 检查基础条件
        const stage1 = EVOLUTION_CONFIG.evolutionThresholds.stage1;
        if (pet.level >= stage1.level && 
            pet.exp >= stage1.experience && 
            pet.bond >= stage1.bond) {
            return true;
        }

        return false;
    }

    // 执行进化
    async executeEvolution(evolutionPath) {
        if (!this.canEvolve() || !evolutionPath) {
            return false;
        }

        const pet = gameState.currentPet;
        
        try {
            // 应用进化效果
            pet.species = evolutionPath.nextForm;
            pet.name = evolutionPath.nextForm;
            
            // 应用属性加成
            Object.keys(evolutionPath.statBonus).forEach(stat => {
                pet[stat] = (pet[stat] || 0) + evolutionPath.statBonus[stat];
            });
            
            // 添加新特性
            if (evolutionPath.newTraits) {
                pet.traits = [...(pet.traits || []), ...evolutionPath.newTraits];
            }
            
            // 提升稀有度
            const rarityUpgrade = { 'N': 'R', 'R': 'SR', 'SR': 'SSR', 'SSR': 'SSS' };
            if (rarityUpgrade[pet.rarity]) {
                pet.rarity = rarityUpgrade[pet.rarity];
            }
            
            // 重置进化相关数据
            this.evolutionPredictions = null;
            this.lastAnalysisTime = 0;
            
            // 设置进化冷却
            if (gameState.evolutionData) {
                gameState.evolutionData.evolutionCooldown = Date.now() + EVOLUTION_CONFIG.cooldowns.evolution;
            }
            
            console.log('🌟 进化成功:', pet.name);
            return true;
            
        } catch (error) {
            console.error('进化执行失败:', error);
            return false;
        }
    }

    // 获取进化状态信息
    getEvolutionStatus() {
        const pet = gameState.currentPet;
        if (!pet) return { status: '无宠物', canEvolve: false };

        const canEvolve = this.canEvolve();
        const predictions = this.evolutionPredictions;
        
        let status = '未达到进化条件';
        if (canEvolve) {
            status = '可以进化';
        }
        
        // 检查冷却时间
        const cooldownEnd = gameState.evolutionData?.evolutionCooldown || 0;
        if (Date.now() < cooldownEnd) {
            const remainingTime = Math.ceil((cooldownEnd - Date.now()) / 60000);
            status = `进化冷却中 (${remainingTime}分钟)`;
        }

        return {
            status: status,
            canEvolve: canEvolve && Date.now() >= cooldownEnd,
            prediction: predictions,
            nextThreshold: this.getNextEvolutionThreshold()
        };
    }

    // 获取下一个进化阈值
    getNextEvolutionThreshold() {
        const pet = gameState.currentPet;
        if (!pet) return null;

        const thresholds = EVOLUTION_CONFIG.evolutionThresholds;
        
        if (pet.level < thresholds.stage1.level) {
            return { stage: 1, ...thresholds.stage1 };
        } else if (pet.level < thresholds.stage2.level) {
            return { stage: 2, ...thresholds.stage2 };
        } else if (pet.level < thresholds.stage3.level) {
            return { stage: 3, ...thresholds.stage3 };
        }
        
        return null;
    }
}

// 全局进化系统实例
const evolutionSystem = new EvolutionSystemFrontend();

// 导出给全局使用
window.evolutionSystem = evolutionSystem;