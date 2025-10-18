/**
 * 灵境斗宠录 - 剧情系统集成
 * 作者：树枝 (微信: wzq8083)
 * 
 * 将剧情系统与游戏核心系统集成
 */

const StoryEngine = require('./StoryEngine');
const StoryDatabase = require('./StoryDatabase');

class StoryIntegration {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.storyEngine = new StoryEngine();
        this.storyDatabase = new StoryDatabase();
        
        // 剧情触发监听器
        this.setupStoryTriggers();
        
        // 当前活跃的剧情
        this.activeStories = new Map();
        
        // 剧情历史
        this.storyHistory = [];
    }

    // 设置剧情触发器
    setupStoryTriggers() {
        // 监听宠物进化事件
        this.gameEngine.on('pet_evolution', (data) => {
            this.triggerEvolutionStory(data);
        });

        // 监听战斗结束事件
        this.gameEngine.on('battle_end', (data) => {
            this.triggerBattleStory(data);
        });

        // 监听地区探索事件
        this.gameEngine.on('region_discovered', (data) => {
            this.triggerExplorationStory(data);
        });

        // 监听角色遭遇事件
        this.gameEngine.on('character_encounter', (data) => {
            this.triggerCharacterStory(data);
        });

        // 监听特殊事件
        this.gameEngine.on('special_event', (data) => {
            this.triggerSpecialStory(data);
        });

        // 监听时间变化（季节、时间等）
        this.gameEngine.on('time_change', (data) => {
            this.checkTimeBasedStories(data);
        });
    }

    // 触发进化剧情
    async triggerEvolutionStory(data) {
        const { pet, evolutionType, newForm, player } = data;
        
        console.log(`🎭 触发进化剧情: ${pet.name} -> ${newForm}`);
        
        try {
            // 生成进化剧情
            const story = await this.storyEngine.triggerStory('pet_evolution', {
                pet: pet,
                evolutionType: evolutionType,
                newForm: newForm,
                player: player
            });

            if (story) {
                // 添加世界观背景
                story.mythology = this.storyDatabase.getMythologyBackground(evolutionType);
                
                // 检查是否触发特殊剧情
                if (this.isLegendaryEvolution(evolutionType)) {
                    story.specialEffects = this.generateLegendaryEvolutionEffects(pet, newForm);
                }

                // 保存并激活剧情
                this.activateStory('evolution', story, data);
                
                return story;
            }
        } catch (error) {
            console.error('进化剧情触发失败:', error);
        }

        return null;
    }

    // 触发战斗剧情
    async triggerBattleStory(data) {
        const { player, pet, enemy, result, battleData } = data;
        
        console.log(`🎭 触发战斗剧情: ${pet.name} vs ${enemy.name}`);
        
        try {
            const story = await this.storyEngine.triggerStory('combat_victory', {
                pet: pet,
                enemy: enemy,
                battleResult: result,
                battleData: battleData,
                player: player
            });

            if (story) {
                // 添加敌人背景故事
                story.enemyLore = this.storyDatabase.getMythologyBackground(enemy.name);
                
                // 检查是否为重要战斗
                if (this.isSignificantBattle(enemy)) {
                    story.worldImpact = this.calculateWorldImpact(enemy, result);
                    
                    // 触发后续事件
                    this.scheduleFollowUpEvents(enemy, result);
                }

                this.activateStory('battle', story, data);
                return story;
            }
        } catch (error) {
            console.error('战斗剧情触发失败:', error);
        }

        return null;
    }

    // 触发探索剧情
    async triggerExplorationStory(data) {
        const { player, location, discovery } = data;
        
        console.log(`🎭 触发探索剧情: 发现 ${discovery.name} 在 ${location}`);
        
        try {
            const story = await this.storyEngine.triggerStory('region_discovery', {
                location: location,
                discovery: discovery,
                player: player
            });

            if (story) {
                // 添加地区相关的神话背景
                story.locationLore = this.storyDatabase.getMythologyBackground(location);
                
                // 检查是否解锁新的剧情线
                const unlockedStories = this.checkUnlockedStorylines(location, discovery);
                if (unlockedStories.length > 0) {
                    story.unlockedStorylines = unlockedStories;
                }

                this.activateStory('exploration', story, data);
                return story;
            }
        } catch (error) {
            console.error('探索剧情触发失败:', error);
        }

        return null;
    }

    // 触发角色剧情
    async triggerCharacterStory(data) {
        const { player, character, meetingType, location } = data;
        
        console.log(`🎭 触发角色剧情: 遇到 ${character.name}`);
        
        try {
            const story = await this.storyEngine.triggerStory('character_encounter', {
                character: character.name,
                meetingType: meetingType,
                location: location,
                player: player
            });

            if (story) {
                // 添加角色对话
                story.dialogue = this.generateCharacterDialogue(character, meetingType, player);
                
                // 检查角色任务
                const availableQuests = this.checkCharacterQuests(character, player);
                if (availableQuests.length > 0) {
                    story.availableQuests = availableQuests;
                }

                this.activateStory('character', story, data);
                return story;
            }
        } catch (error) {
            console.error('角色剧情触发失败:', error);
        }

        return null;
    }

    // 生成角色对话
    generateCharacterDialogue(character, meetingType, player) {
        const dialogue = {
            greeting: this.storyDatabase.getCharacterDialogue(character.name, 'greetings', {
                meetingType: meetingType,
                playerLevel: player.level,
                relationship: this.getCharacterRelationship(character.name, player.id)
            }),
            main: [],
            farewell: this.storyDatabase.getCharacterDialogue(character.name, 'farewell')
        };

        // 根据情况添加不同类型的对话
        if (meetingType === 'first_meeting') {
            dialogue.main.push(this.storyDatabase.getCharacterDialogue(character.name, 'lore'));
        } else if (meetingType === 'seeking_help') {
            dialogue.main.push(this.storyDatabase.getCharacterDialogue(character.name, 'advice'));
        }

        return dialogue;
    }

    // 检查解锁的剧情线
    checkUnlockedStorylines(location, discovery) {
        const unlockedStories = [];
        
        // 根据发现的内容检查是否解锁新剧情
        if (discovery.type === 'ancient_ruins') {
            unlockedStories.push({
                id: 'ancient_mystery',
                title: '远古之谜',
                description: '古老遗迹中隐藏的秘密'
            });
        }

        if (discovery.type === 'legendary_creature') {
            unlockedStories.push({
                id: 'legendary_encounter',
                title: '传说邂逅',
                description: '与传说生物的特殊遭遇'
            });
        }

        return unlockedStories;
    }

    // 检查角色任务
    checkCharacterQuests(character, player) {
        const quests = [];
        
        // 根据角色和玩家状态检查可用任务
        const characterQuests = this.storyDatabase.getStoryContent('side', 'elder_quest');
        if (character.name === '青木长老' && player.level >= 5) {
            quests.push(characterQuests);
        }

        const dragonTrial = this.storyDatabase.getStoryContent('side', 'dragon_trial');
        if (character.name === '东海龙王' && player.level >= 15) {
            quests.push(dragonTrial);
        }

        return quests;
    }

    // 激活剧情
    activateStory(type, story, context) {
        const storyId = `${type}_${Date.now()}`;
        
        const activeStory = {
            id: storyId,
            type: type,
            story: story,
            context: context,
            startTime: Date.now(),
            status: 'active'
        };

        this.activeStories.set(storyId, activeStory);
        this.storyHistory.push(activeStory);

        // 通知游戏引擎
        this.gameEngine.emit('story_activated', activeStory);

        console.log(`📖 激活剧情: ${story.title} (ID: ${storyId})`);
    }

    // 检查基于时间的剧情
    checkTimeBasedStories(timeData) {
        const { season, timeOfDay, specialDate } = timeData;
        
        // 检查季节性事件
        if (season) {
            const seasonalEvent = this.storyDatabase.getWorldEvent(season);
            if (seasonalEvent && this.shouldTriggerSeasonalEvent(seasonalEvent)) {
                this.triggerSeasonalStory(seasonalEvent, season);
            }
        }

        // 检查特殊日期事件
        if (specialDate) {
            this.checkSpecialDateEvents(specialDate);
        }
    }

    // 触发季节性剧情
    async triggerSeasonalStory(event, season) {
        console.log(`🎭 触发季节性剧情: ${event.title}`);
        
        try {
            const story = await this.storyEngine.triggerStory('seasonal_event', {
                season: season,
                event: event
            });

            if (story) {
                story.effects = event.effects;
                story.duration = event.duration;
                
                this.activateStory('seasonal', story, { season, event });
            }
        } catch (error) {
            console.error('季节性剧情触发失败:', error);
        }
    }

    // 判断是否应该触发季节性事件
    shouldTriggerSeasonalEvent(event) {
        // 简单的概率检查，可以根据需要添加更复杂的逻辑
        const probability = {
            'common': 0.3,
            'uncommon': 0.15,
            'rare': 0.05,
            'very_rare': 0.01,
            'legendary': 0.001
        };

        return Math.random() < (probability[event.rarity] || 0.1);
    }

    // 判断是否为传说级进化
    isLegendaryEvolution(evolutionType) {
        const legendaryTypes = ['divine', 'chaos', 'primordial', 'celestial'];
        return legendaryTypes.some(type => evolutionType.includes(type));
    }

    // 生成传说级进化效果
    generateLegendaryEvolutionEffects(pet, newForm) {
        return {
            worldAnnouncement: `传说中的${newForm}在世间现身！`,
            specialAbilities: [`${newForm}的专属技能已解锁`],
            worldImpact: '世界的平衡发生了微妙的变化',
            rarity: 'legendary'
        };
    }

    // 判断是否为重要战斗
    isSignificantBattle(enemy) {
        const significantEnemies = ['饕餮', '穷奇', '梼杌', '混沌', '九头鸟', '相柳'];
        return significantEnemies.includes(enemy.name) || enemy.rarity === 'SSS';
    }

    // 计算世界影响
    calculateWorldImpact(enemy, result) {
        if (result === 'victory') {
            return {
                description: `${enemy.name}的败北让世界变得更加安全`,
                effects: ['邪恶力量减弱', '正义力量增强'],
                magnitude: 'significant'
            };
        } else {
            return {
                description: `${enemy.name}的胜利让黑暗力量更加强大`,
                effects: ['邪恶力量增强', '世界秩序受到威胁'],
                magnitude: 'concerning'
            };
        }
    }

    // 安排后续事件
    scheduleFollowUpEvents(enemy, result) {
        // 根据战斗结果安排后续事件
        setTimeout(() => {
            if (result === 'victory') {
                this.gameEngine.emit('world_balance_shift', { 
                    direction: 'good', 
                    cause: `${enemy.name}的败北` 
                });
            } else {
                this.gameEngine.emit('world_balance_shift', { 
                    direction: 'evil', 
                    cause: `${enemy.name}的胜利` 
                });
            }
        }, 5000); // 5秒后触发
    }

    // 获取角色关系
    getCharacterRelationship(characterName, playerId) {
        // 从数据库或缓存中获取角色关系
        // 这里简化处理
        return 'neutral';
    }

    // 获取活跃剧情
    getActiveStories() {
        return Array.from(this.activeStories.values());
    }

    // 获取剧情历史
    getStoryHistory() {
        return this.storyHistory;
    }

    // 完成剧情
    completeStory(storyId, outcome) {
        const story = this.activeStories.get(storyId);
        if (story) {
            story.status = 'completed';
            story.outcome = outcome;
            story.endTime = Date.now();
            
            this.activeStories.delete(storyId);
            
            // 通知游戏引擎
            this.gameEngine.emit('story_completed', story);
            
            console.log(`✅ 完成剧情: ${story.story.title}`);
        }
    }

    // 获取剧情状态
    getStoryStatus() {
        return {
            active: this.activeStories.size,
            completed: this.storyHistory.filter(s => s.status === 'completed').length,
            total: this.storyHistory.length,
            storyProgress: this.storyEngine.getStoryStatus()
        };
    }
}

module.exports = StoryIntegration;