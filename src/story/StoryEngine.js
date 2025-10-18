/**
 * 灵境斗宠录 - 剧情引擎系统
 * 作者：树枝 (微信: wzq8083)
 * 
 * 基于山海经世界观的动态剧情生成系统
 * 支持长篇小说式的文字演出和分支剧情
 */

class StoryEngine {
    constructor() {
        this.currentChapter = 1;
        this.storyProgress = {
            mainQuest: 0,
            sideQuests: [],
            unlockedRegions: ['初始森林'],
            discoveredLore: [],
            characterRelationships: new Map()
        };
        
        // 剧情触发器
        this.storyTriggers = new Map();
        this.initializeStoryTriggers();
        
        // 世界观设定
        this.worldLore = this.initializeWorldLore();
        
        // 角色库
        this.characters = this.initializeCharacters();
        
        // 剧情模板库
        this.storyTemplates = this.initializeStoryTemplates();
    }

    // 初始化剧情触发器
    initializeStoryTriggers() {
        this.storyTriggers.set('pet_evolution', this.handleEvolutionStory.bind(this));
        this.storyTriggers.set('combat_victory', this.handleCombatStory.bind(this));
        this.storyTriggers.set('region_discovery', this.handleDiscoveryStory.bind(this));
        this.storyTriggers.set('character_encounter', this.handleCharacterStory.bind(this));
        this.storyTriggers.set('artifact_found', this.handleArtifactStory.bind(this));
        this.storyTriggers.set('mystery_event', this.handleMysteryStory.bind(this));
        this.storyTriggers.set('seasonal_event', this.handleSeasonalStory.bind(this));
    }

    // 初始化世界观设定
    initializeWorldLore() {
        return {
            // 主要地区
            regions: {
                '初始森林': {
                    name: '青木灵境',
                    description: '古老的森林，生长着通灵的古树，是新手灵师的起点',
                    atmosphere: '神秘而宁静',
                    creatures: ['木精', '花仙', '树妖'],
                    secrets: ['古树之心', '精灵遗迹']
                },
                '东海之滨': {
                    name: '扶桑海域',
                    description: '传说中扶桑神树所在的海域，鲲鹏翱翔于此',
                    atmosphere: '壮阔而危险',
                    creatures: ['鲲', '鹏', '龙王', '海妖'],
                    secrets: ['扶桑神树', '龙宫秘境']
                },
                '昆仑仙山': {
                    name: '昆仑圣域',
                    description: '众神居住的圣山，西王母的瑶池就在山巅',
                    atmosphere: '神圣而庄严',
                    creatures: ['凤凰', '麒麟', '白虎', '玄武'],
                    secrets: ['瑶池仙境', '不死药园']
                },
                '九幽冥界': {
                    name: '幽冥深渊',
                    description: '死者灵魂归宿之地，充满着未知的恐怖',
                    atmosphere: '阴森而恐怖',
                    creatures: ['鬼车', '穷奇', '梼杌', '饕餮'],
                    secrets: ['黄泉之路', '忘川彼岸']
                }
            },

            // 古老传说
            legends: {
                '创世神话': {
                    title: '盘古开天，女娲造人',
                    content: '远古时代，盘古开天辟地，女娲炼石补天造人。天地初分，万物有灵，灵师一族应运而生...',
                    significance: '解释世界起源和灵师职业的由来'
                },
                '神兽之战': {
                    title: '四凶与四灵的千年之战',
                    content: '上古时期，代表邪恶的四凶（饕餮、穷奇、梼杌、混沌）与代表正义的四灵（青龙、白虎、朱雀、玄武）展开了持续千年的大战...',
                    significance: '影响现在的善恶对立格局'
                },
                '灵师起源': {
                    title: '第一位灵师的诞生',
                    content: '在神兽大战的废墟中，一个普通人类偶然获得了与神兽沟通的能力，成为了第一位灵师...',
                    significance: '灵师职业的起源故事'
                }
            },

            // 神秘力量
            mysticalForces: {
                '五行之力': ['金', '木', '水', '火', '土'],
                '阴阳二气': ['阴', '阳'],
                '天地灵气': '维持世界运转的根本力量',
                '因果法则': '支配命运和轮回的神秘法则'
            }
        };
    }

    // 初始化角色库
    initializeCharacters() {
        return {
            // 主要NPC
            '青木长老': {
                name: '青木长老',
                title: '森林守护者',
                personality: '慈祥而智慧，对年轻灵师充满关爱',
                background: '守护青木灵境数百年的古老精灵，见证了无数灵师的成长',
                relationships: new Map(),
                dialogueStyle: '温和而富有哲理',
                secrets: ['森林的真正秘密', '古代灵师的传承']
            },
            '东海龙王': {
                name: '敖广',
                title: '东海龙王',
                personality: '威严而公正，但有时脾气暴躁',
                background: '统治东海数千年的龙族之王，掌控着海域的风雨雷电',
                relationships: new Map(),
                dialogueStyle: '威严而古典',
                secrets: ['龙族的衰落原因', '海底龙宫的宝藏']
            },
            '昆仑仙子': {
                name: '瑶姬',
                title: '昆仑仙子',
                personality: '高贵而神秘，对凡人保持距离',
                background: '西王母座下的仙子，掌管着昆仑山的仙药园',
                relationships: new Map(),
                dialogueStyle: '优雅而超脱',
                secrets: ['不死药的真相', '仙界的秘密']
            },
            '幽冥使者': {
                name: '判官',
                title: '生死判官',
                personality: '冷酷而公正，严格执行冥界法则',
                background: '掌管生死簿的冥界官员，决定着灵魂的归宿',
                relationships: new Map(),
                dialogueStyle: '严肃而神秘',
                secrets: ['生死轮回的真相', '冥界的禁忌']
            },
            // 神秘商人
            '云游商人': {
                name: '云中子',
                title: '神秘商人',
                personality: '狡黠而神秘，总是带着奇怪的宝物',
                background: '游走于各个世界的神秘商人，拥有许多不可思议的宝物',
                relationships: new Map(),
                dialogueStyle: '幽默而神秘',
                secrets: ['宝物的真正来源', '其他世界的存在']
            }
        };
    }

    // 初始化剧情模板
    initializeStoryTemplates() {
        return {
            // 进化剧情模板
            evolution: {
                'power_evolution': {
                    title: '力量的觉醒',
                    scenes: [
                        {
                            type: 'description',
                            content: '天空中突然乌云密布，雷声阵阵。你的{petName}感受到了体内力量的躁动，双眼开始闪烁着危险的红光。'
                        },
                        {
                            type: 'dialogue',
                            speaker: 'pet',
                            content: '主人...我感受到了前所未有的力量在体内涌动，这种感觉...让我既兴奋又恐惧。'
                        },
                        {
                            type: 'description',
                            content: '古老的传说在你脑海中浮现：当神兽觉醒力量时，天地都会为之震动。看来你的伙伴正在经历着传说中的"力量觉醒"。'
                        },
                        {
                            type: 'choice',
                            prompt: '面对伙伴的力量觉醒，你选择...',
                            options: [
                                { id: 'guide', text: '引导它控制力量', effect: 'bond+10' },
                                { id: 'embrace', text: '拥抱这股力量', effect: 'power+15' },
                                { id: 'caution', text: '保持谨慎观察', effect: 'wisdom+5' }
                            ]
                        }
                    ]
                },
                'wisdom_evolution': {
                    title: '智慧的启迪',
                    scenes: [
                        {
                            type: 'description',
                            content: '月圆之夜，银辉洒向大地。你的{petName}静静地坐在月光下，眼中闪烁着深邃的光芒，仿佛在思考着宇宙的奥秘。'
                        },
                        {
                            type: 'dialogue',
                            speaker: 'pet',
                            content: '主人，我突然明白了许多以前不懂的道理。这个世界...比我们想象的更加复杂和美妙。'
                        },
                        {
                            type: 'mystical_event',
                            content: '突然，古老的符文在{petName}周围浮现，那是传说中的"智慧之印"，只有真正开启智慧的生灵才能看见。'
                        }
                    ]
                }
            },

            // 战斗剧情模板
            combat: {
                'boss_encounter': {
                    title: '传说中的对手',
                    scenes: [
                        {
                            type: 'atmosphere',
                            content: '空气中弥漫着危险的气息，连风都停止了流动。在你面前，一个传说中的存在缓缓现身...'
                        },
                        {
                            type: 'boss_introduction',
                            content: '这是{bossName}，{bossDescription}。它的存在本身就是对这个世界秩序的挑战。'
                        },
                        {
                            type: 'pre_battle_dialogue',
                            speaker: 'boss',
                            content: '又一个不知天高地厚的灵师...你的伙伴虽然有些实力，但在我面前，不过是蝼蚁罢了。'
                        }
                    ]
                }
            },

            // 探索剧情模板
            exploration: {
                'ancient_ruins': {
                    title: '远古遗迹的秘密',
                    scenes: [
                        {
                            type: 'discovery',
                            content: '在茂密的丛林深处，你发现了一座被藤蔓覆盖的古老建筑。石壁上刻着你从未见过的古老文字。'
                        },
                        {
                            type: 'lore_revelation',
                            content: '根据古籍记载，这里曾经是上古灵师的修炼圣地。传说中，第一位灵师就是在这里获得了与神兽沟通的能力。'
                        },
                        {
                            type: 'mystery_deepens',
                            content: '但是，这座遗迹的存在本身就是一个谜团。按照历史记录，它应该在千年前的大战中被完全摧毁才对...'
                        }
                    ]
                }
            }
        };
    }

    // 触发剧情
    async triggerStory(triggerType, context) {
        console.log(`🎭 触发剧情: ${triggerType}`, context);
        
        const handler = this.storyTriggers.get(triggerType);
        if (handler) {
            return await handler(context);
        } else {
            console.warn(`未知的剧情触发器: ${triggerType}`);
            return null;
        }
    }

    // 处理进化剧情
    async handleEvolutionStory(context) {
        const { pet, evolutionType, newForm } = context;
        
        // 根据进化类型选择剧情模板
        let templateKey = 'power_evolution';
        if (evolutionType.includes('wisdom')) templateKey = 'wisdom_evolution';
        if (evolutionType.includes('balance')) templateKey = 'balance_evolution';
        if (evolutionType.includes('healing')) templateKey = 'healing_evolution';
        
        const template = this.storyTemplates.evolution[templateKey];
        if (!template) {
            return this.generateGenericEvolutionStory(context);
        }

        // 生成个性化剧情
        const story = this.processStoryTemplate(template, {
            petName: pet.name,
            petSpecies: pet.species,
            newForm: newForm,
            evolutionType: evolutionType
        });

        // 添加世界观背景
        story.worldContext = this.getRelevantLore(evolutionType);
        
        // 更新剧情进度
        this.updateStoryProgress('evolution', { pet: pet.name, type: evolutionType });

        return story;
    }

    // 处理战斗剧情
    async handleCombatStory(context) {
        const { enemy, battleResult, pet } = context;
        
        // 判断是否为重要战斗
        if (this.isSignificantBattle(enemy)) {
            return this.generateEpicBattleStory(context);
        } else {
            return this.generateRegularBattleStory(context);
        }
    }

    // 处理发现剧情
    async handleDiscoveryStory(context) {
        const { location, discovery } = context;
        
        const story = {
            title: `${location}的秘密`,
            type: 'discovery',
            scenes: []
        };

        // 根据发现类型生成不同剧情
        if (discovery.type === 'ancient_ruins') {
            story.scenes = this.generateRuinsDiscoveryScenes(context);
        } else if (discovery.type === 'mystical_creature') {
            story.scenes = this.generateCreatureEncounterScenes(context);
        } else if (discovery.type === 'artifact') {
            story.scenes = this.generateArtifactDiscoveryScenes(context);
        }

        // 添加地区相关的世界观
        story.worldContext = this.worldLore.regions[location];
        
        return story;
    }

    // 处理角色遭遇剧情
    async handleCharacterStory(context) {
        const { character, meetingType, location } = context;
        
        const npc = this.characters[character];
        if (!npc) {
            return this.generateGenericCharacterStory(context);
        }

        const story = {
            title: `与${npc.name}的邂逅`,
            type: 'character_encounter',
            character: npc,
            scenes: []
        };

        // 根据角色和地点生成对话
        story.scenes = this.generateCharacterScenes(npc, location, meetingType);
        
        // 更新角色关系
        this.updateCharacterRelationship(character, 'met');

        return story;
    }

    // 生成史诗战斗剧情
    generateEpicBattleStory(context) {
        const { enemy, pet, battleResult } = context;
        
        return {
            title: `传说之战：${pet.name} VS ${enemy.name}`,
            type: 'epic_battle',
            scenes: [
                {
                    type: 'pre_battle',
                    content: `天地为之变色，${enemy.name}的出现让整个世界都感到了威胁。这不仅仅是一场战斗，更是正义与邪恶的较量。`
                },
                {
                    type: 'battle_climax',
                    content: `${pet.name}爆发出前所未有的力量，与${enemy.name}展开了惊天动地的决战。每一次碰撞都让大地震颤，每一道光芒都划破长空。`
                },
                {
                    type: 'battle_result',
                    content: battleResult === 'victory' 
                        ? `经过激烈的战斗，${pet.name}终于战胜了${enemy.name}。这场胜利将被载入史册，成为传说。`
                        : `虽然败北，但${pet.name}展现出的勇气和决心，让${enemy.name}也为之动容。这场战斗让你的伙伴获得了宝贵的经验。`
                },
                {
                    type: 'aftermath',
                    content: `战斗结束后，你感受到了世界的某种变化。这场战斗的影响将会持续很久...`
                }
            ],
            rewards: battleResult === 'victory' ? ['传说战士称号', '神秘宝物', '大量经验'] : ['战斗经验', '意志力提升'],
            worldImpact: `${enemy.name}的${battleResult === 'victory' ? '败北' : '胜利'}改变了世界的平衡`
        };
    }

    // 生成遗迹发现场景
    generateRuinsDiscoveryScenes(context) {
        const { location, discovery } = context;
        
        return [
            {
                type: 'discovery',
                content: `在${location}的深处，你发现了一座被时间遗忘的古老遗迹。石壁上的古老符文散发着微弱的光芒，仿佛在诉说着远古的秘密。`
            },
            {
                type: 'investigation',
                content: `仔细观察这些符文，你发现它们记录的是上古时期灵师与神兽共同生活的历史。这些记录与现在流传的传说有着微妙的差异...`
            },
            {
                type: 'revelation',
                content: `突然，你意识到这座遗迹可能隐藏着改变世界的秘密。但同时，你也感受到了某种危险的气息...`
            },
            {
                type: 'choice',
                prompt: '面对这个发现，你决定...',
                options: [
                    { id: 'investigate', text: '深入调查遗迹', risk: 'high', reward: 'ancient_knowledge' },
                    { id: 'report', text: '向长老报告发现', risk: 'low', reward: 'reputation' },
                    { id: 'seal', text: '封印遗迹保护秘密', risk: 'medium', reward: 'mysterious_power' }
                ]
            }
        ];
    }

    // 生成角色场景
    generateCharacterScenes(npc, location, meetingType) {
        const scenes = [
            {
                type: 'character_introduction',
                content: `在${location}，你遇到了${npc.name}。${npc.background}`
            },
            {
                type: 'dialogue',
                speaker: npc.name,
                content: this.generateCharacterDialogue(npc, location, meetingType),
                style: npc.dialogueStyle
            }
        ];

        // 根据角色添加特殊场景
        if (npc.secrets && npc.secrets.length > 0) {
            scenes.push({
                type: 'hint',
                content: `从${npc.name}的话语中，你感觉到他/她似乎知道一些不为人知的秘密...`
            });
        }

        return scenes;
    }

    // 生成角色对话
    generateCharacterDialogue(npc, location, meetingType) {
        const dialogues = {
            '青木长老': {
                'first_meeting': '年轻的灵师，欢迎来到青木灵境。我能感受到你体内蕴含的潜力，但记住，真正的力量来自于与伙伴的羁绊。',
                'return_visit': '又见面了，孩子。我看到你和你的伙伴都成长了不少。这片森林因为你们的存在而更加生机勃勃。',
                'seeking_advice': '遇到困难了吗？不要着急，每一个困难都是成长的机会。听听你内心的声音，答案就在那里。'
            },
            '东海龙王': {
                'first_meeting': '凡人，你竟敢踏入我的领域？不过...你的伙伴倒是有些意思。证明你们的实力，我或许会考虑给予你们帮助。',
                'return_visit': '哦？是你啊。看来你们在我的考验中表现不错。龙族向来敬重强者，你们已经赢得了我的认可。',
                'seeking_help': '需要我的帮助？龙族的帮助可不是免费的。不过，看在你们实力的份上，我可以给你们一个机会...'
            }
        };

        return dialogues[npc.name]?.[meetingType] || `${npc.name}看着你，似乎在思考着什么...`;
    }

    // 处理剧情模板
    processStoryTemplate(template, variables) {
        const processedStory = {
            title: this.replaceVariables(template.title, variables),
            type: template.type || 'generic',
            scenes: []
        };

        template.scenes.forEach(scene => {
            const processedScene = { ...scene };
            if (scene.content) {
                processedScene.content = this.replaceVariables(scene.content, variables);
            }
            processedStory.scenes.push(processedScene);
        });

        return processedStory;
    }

    // 替换变量
    replaceVariables(text, variables) {
        let result = text;
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            result = result.replace(regex, variables[key]);
        });
        return result;
    }

    // 获取相关世界观
    getRelevantLore(topic) {
        // 根据主题返回相关的世界观信息
        const relevantLore = {};
        
        Object.keys(this.worldLore.legends).forEach(key => {
            const legend = this.worldLore.legends[key];
            if (legend.content.toLowerCase().includes(topic.toLowerCase())) {
                relevantLore[key] = legend;
            }
        });

        return relevantLore;
    }

    // 更新剧情进度
    updateStoryProgress(eventType, data) {
        switch (eventType) {
            case 'evolution':
                this.storyProgress.discoveredLore.push(`${data.pet}的${data.type}进化`);
                break;
            case 'character_met':
                if (!this.storyProgress.characterRelationships.has(data.character)) {
                    this.storyProgress.characterRelationships.set(data.character, 'acquaintance');
                }
                break;
            case 'region_unlocked':
                if (!this.storyProgress.unlockedRegions.includes(data.region)) {
                    this.storyProgress.unlockedRegions.push(data.region);
                }
                break;
        }
    }

    // 更新角色关系
    updateCharacterRelationship(character, relationship) {
        this.storyProgress.characterRelationships.set(character, relationship);
    }

    // 判断是否为重要战斗
    isSignificantBattle(enemy) {
        const significantEnemies = ['饕餮', '穷奇', '梼杌', '混沌', '九头鸟', '相柳'];
        return significantEnemies.includes(enemy.name) || enemy.rarity === 'SSS';
    }

    // 生成通用进化剧情
    generateGenericEvolutionStory(context) {
        return {
            title: '神秘的蜕变',
            type: 'evolution',
            scenes: [
                {
                    type: 'description',
                    content: `${context.pet.name}被一道神秘的光芒包围，开始了不可思议的蜕变过程...`
                }
            ]
        };
    }

    // 获取当前剧情状态
    getStoryStatus() {
        return {
            chapter: this.currentChapter,
            progress: this.storyProgress,
            availableRegions: this.storyProgress.unlockedRegions,
            knownCharacters: Array.from(this.storyProgress.characterRelationships.keys()),
            discoveredLore: this.storyProgress.discoveredLore
        };
    }

    // 生成季节性事件剧情
    async handleSeasonalStory(context) {
        const { season, event } = context;
        
        const seasonalStories = {
            'spring': {
                title: '春回大地',
                content: '万物复苏的季节到了，你的伙伴似乎也感受到了生命力的涌动...'
            },
            'summer': {
                title: '夏日炎炎',
                content: '烈日当空，但这正是火系神兽最活跃的时候...'
            },
            'autumn': {
                title: '秋风萧瑟',
                content: '落叶纷飞，古老的传说在秋风中回响...'
            },
            'winter': {
                title: '冬雪纷飞',
                content: '雪花飘洒，世界陷入了宁静，但在这宁静之下，隐藏着什么秘密呢？'
            }
        };

        return seasonalStories[season] || seasonalStories['spring'];
    }
}

module.exports = StoryEngine;