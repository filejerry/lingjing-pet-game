/**
 * 灵境斗宠录 - 剧情数据库
 * 作者：树枝 (微信: wzq8083)
 * 
 * 存储所有剧情内容、对话、世界观设定的数据库
 */

class StoryDatabase {
    constructor() {
        this.mainStorylines = this.initializeMainStorylines();
        this.sideQuests = this.initializeSideQuests();
        this.characterDialogues = this.initializeCharacterDialogues();
        this.worldEvents = this.initializeWorldEvents();
        this.mythologyDatabase = this.initializeMythologyDatabase();
    }

    // 主线剧情
    initializeMainStorylines() {
        return {
            // 第一章：初入灵境
            chapter1: {
                title: '初入灵境',
                description: '年轻的灵师踏入神秘的灵境世界，开始了与神兽伙伴的冒险之旅',
                scenes: {
                    opening: {
                        title: '命运的召唤',
                        content: [
                            '在遥远的东方，有一片被称为"灵境"的神秘大陆。这里是神话与现实交汇的地方，山海经中记载的奇异生物在此繁衍生息。',
                            '传说中，只有拥有特殊天赋的人才能踏入这片土地，他们被称为"灵师"——能够与神兽沟通并建立契约的神秘职业。',
                            '而你，就是这样一个被命运选中的人。当你踏入灵境的那一刻，整个世界都在等待着你的到来...'
                        ],
                        choices: [
                            { id: 'eager', text: '迫不及待地探索这个世界', personality: 'adventurous' },
                            { id: 'cautious', text: '谨慎地观察周围环境', personality: 'careful' },
                            { id: 'mystical', text: '感受这片土地的神秘力量', personality: 'spiritual' }
                        ]
                    },
                    first_encounter: {
                        title: '初次邂逅',
                        content: [
                            '青木灵境的深处，古老的召唤法阵散发着柔和的光芒。这是灵师与神兽建立第一次契约的神圣之地。',
                            '法阵中央，三道不同颜色的光柱冲天而起，每一道都代表着不同的命运轨迹。',
                            '你能感受到，在那光芒之中，有着等待与你相遇的伙伴...'
                        ]
                    }
                }
            },

            // 第二章：成长之路
            chapter2: {
                title: '成长之路',
                description: '与伙伴一起成长，探索更广阔的世界，面对更强大的挑战',
                scenes: {
                    first_evolution: {
                        title: '蜕变的时刻',
                        content: [
                            '经过无数次的冒险和战斗，你和伙伴之间的羁绊越来越深。',
                            '在一个月圆之夜，你的伙伴突然被神秘的光芒包围...',
                            '这是传说中的"灵魂共鸣"现象，只有真正心意相通的灵师和神兽才能触发。'
                        ]
                    },
                    ancient_mystery: {
                        title: '远古之谜',
                        content: [
                            '在探索古老遗迹的过程中，你发现了一些令人震惊的真相。',
                            '原来，现在的世界并不是神兽们的原始家园...',
                            '一个更大的秘密正在等待着你去揭开。'
                        ]
                    }
                }
            },

            // 第三章：真相大白
            chapter3: {
                title: '真相大白',
                description: '揭开世界的终极秘密，面对最终的选择',
                scenes: {
                    truth_revealed: {
                        title: '世界的真相',
                        content: [
                            '在昆仑山的最高峰，你终于见到了传说中的西王母。',
                            '从她口中，你得知了这个世界的真正秘密...',
                            '原来，灵境只是一个巨大的封印，而你的使命，就是决定这个封印的命运。'
                        ]
                    }
                }
            }
        };
    }

    // 支线任务
    initializeSideQuests() {
        return {
            // 青木长老的委托
            elder_quest: {
                title: '森林守护者的委托',
                description: '青木长老请求你帮助调查森林中出现的异常现象',
                stages: [
                    {
                        id: 'investigation',
                        title: '调查异常',
                        content: '最近森林中的小动物们都显得很不安，请你去调查一下原因。',
                        objectives: ['探索森林深处', '与小动物对话', '寻找异常的源头']
                    },
                    {
                        id: 'discovery',
                        title: '发现真相',
                        content: '你发现异常的源头是一株被污染的古树，需要净化它。',
                        objectives: ['收集净化材料', '进行净化仪式']
                    },
                    {
                        id: 'resolution',
                        title: '解决问题',
                        content: '成功净化古树后，森林恢复了平静，青木长老对你表示感谢。',
                        rewards: ['森林守护者称号', '古树之心', '青木长老的信任']
                    }
                ]
            },

            // 龙王的试炼
            dragon_trial: {
                title: '东海龙王的试炼',
                description: '东海龙王要求你证明自己的实力',
                stages: [
                    {
                        id: 'challenge_accepted',
                        title: '接受挑战',
                        content: '龙王设置了三个试炼来考验你的勇气、智慧和仁慈。'
                    },
                    {
                        id: 'trial_of_courage',
                        title: '勇气试炼',
                        content: '面对巨大的海怪，你必须展现出无畏的勇气。'
                    },
                    {
                        id: 'trial_of_wisdom',
                        title: '智慧试炼',
                        content: '解开古老的谜题，证明你的智慧。'
                    },
                    {
                        id: 'trial_of_compassion',
                        title: '仁慈试炼',
                        content: '救助受伤的海洋生物，展现你的仁慈之心。'
                    }
                ]
            }
        };
    }

    // 角色对话库
    initializeCharacterDialogues() {
        return {
            '青木长老': {
                greetings: [
                    '年轻的灵师，欢迎来到青木灵境。',
                    '孩子，我能感受到你内心的纯净。',
                    '又见面了，你和你的伙伴都成长了不少。'
                ],
                advice: [
                    '真正的力量来自于内心的平静。',
                    '与伙伴的羁绊比任何技能都重要。',
                    '倾听自然的声音，它会指引你前进的方向。'
                ],
                lore: [
                    '这片森林已经存在了数千年，见证了无数灵师的成长。',
                    '传说中，第一位灵师就是在这里获得了神兽的认可。',
                    '森林中的每一棵树都有自己的故事，如果你仔细倾听...'
                ],
                farewell: [
                    '愿森林的祝福与你同在。',
                    '记住，无论走到哪里，这里永远是你的家。',
                    '期待你下次的到来，孩子。'
                ]
            },

            '东海龙王': {
                greetings: [
                    '凡人，你竟敢踏入我的领域？',
                    '哼，又一个不知天高地厚的灵师。',
                    '你回来了？看来上次的教训还不够深刻。'
                ],
                challenges: [
                    '想要得到我的认可？先证明你的实力！',
                    '龙族从不与弱者为伍。',
                    '让我看看你和你的伙伴有什么本事。'
                ],
                approval: [
                    '不错，你们确实有些实力。',
                    '龙族向来敬重强者，你们赢得了我的认可。',
                    '或许...你们确实与众不同。'
                ],
                lore: [
                    '在远古时代，龙族统治着整个海洋。',
                    '我见证了这个世界的兴衰变迁。',
                    '海底深处隐藏着许多不为人知的秘密。'
                ]
            },

            '昆仑仙子': {
                greetings: [
                    '凡人，你是如何来到这里的？',
                    '能够踏上昆仑山的人，必定有着特殊的命运。',
                    '你身上有着不同寻常的气息。'
                ],
                mystical: [
                    '仙界的奥秘不是凡人能够理解的。',
                    '命运的轮回，早已注定。',
                    '你的到来，或许预示着某种变化。'
                ],
                guidance: [
                    '修炼之路漫长而艰辛，不可急于求成。',
                    '真正的仙道，在于超脱世俗的束缚。',
                    '内心的纯净比任何法术都重要。'
                ]
            }
        };
    }

    // 世界事件
    initializeWorldEvents() {
        return {
            // 季节性事件
            seasonal: {
                spring_awakening: {
                    title: '万物复苏',
                    description: '春天到来，所有生物都充满了活力',
                    effects: ['所有宠物经验获得+20%', '治愈系技能效果+30%'],
                    duration: '7天',
                    rarity: 'common'
                },
                summer_solstice: {
                    title: '夏至大典',
                    description: '一年中阳气最盛的日子，火系神兽格外活跃',
                    effects: ['火系宠物攻击力+25%', '进化成功率+15%'],
                    duration: '3天',
                    rarity: 'uncommon'
                },
                autumn_harvest: {
                    title: '秋收时节',
                    description: '收获的季节，所有资源都更加丰富',
                    effects: ['资源获得量+50%', '稀有材料出现率+20%'],
                    duration: '5天',
                    rarity: 'common'
                },
                winter_meditation: {
                    title: '冬日静修',
                    description: '万物沉寂的季节，最适合内心的修炼',
                    effects: ['冥想效果+40%', '羁绊值增长+30%'],
                    duration: '10天',
                    rarity: 'common'
                }
            },

            // 特殊事件
            special: {
                blood_moon: {
                    title: '血月降临',
                    description: '不祥的血月出现在天空，邪恶的力量开始苏醒',
                    effects: ['暗系宠物能力+50%', '邪恶生物出现率+100%'],
                    duration: '1天',
                    rarity: 'rare',
                    warning: '危险事件，建议谨慎行动'
                },
                aurora_borealis: {
                    title: '极光现象',
                    description: '美丽的极光照亮夜空，带来神秘的力量',
                    effects: ['所有宠物魔法力+30%', '稀有进化路径解锁'],
                    duration: '2天',
                    rarity: 'very_rare'
                },
                ancient_awakening: {
                    title: '远古苏醒',
                    description: '沉睡的远古神兽开始苏醒，世界将发生巨大变化',
                    effects: ['传说级神兽出现', '世界格局改变'],
                    duration: '永久',
                    rarity: 'legendary',
                    impact: 'world_changing'
                }
            }
        };
    }

    // 神话数据库
    initializeMythologyDatabase() {
        return {
            // 创世神话
            creation_myths: {
                pangu: {
                    title: '盘古开天',
                    content: '混沌初开，盘古以身化天地，其血化江河，其骨化山脉，其气化风云...',
                    significance: '解释世界的起源',
                    related_creatures: ['盘古', '混沌']
                },
                nuwa: {
                    title: '女娲造人',
                    content: '女娲用黄土造人，赋予了人类灵魂和智慧，使人类成为万物之灵...',
                    significance: '解释人类的起源和灵师天赋的来源',
                    related_creatures: ['女娲', '人类']
                }
            },

            // 神兽传说
            divine_beasts: {
                four_symbols: {
                    title: '四象神兽',
                    content: '青龙、白虎、朱雀、玄武，分别守护着东西南北四个方向...',
                    members: ['青龙', '白虎', '朱雀', '玄武'],
                    powers: ['掌控四季', '维护天地秩序', '守护世界平衡']
                },
                four_evils: {
                    title: '上古四凶',
                    content: '饕餮、穷奇、梼杌、混沌，代表着世间最邪恶的力量...',
                    members: ['饕餮', '穷奇', '梼杌', '混沌'],
                    powers: ['吞噬一切', '制造混乱', '传播邪恶', '毁灭秩序']
                }
            },

            // 地理传说
            sacred_places: {
                kunlun: {
                    title: '昆仑仙山',
                    description: '众神居住的圣山，西王母的瑶池就在山巅',
                    legends: ['西王母的不死药', '昆仑镜的传说', '仙人的修炼之地'],
                    guardians: ['西王母', '昆仑神兽']
                },
                penglai: {
                    title: '蓬莱仙岛',
                    description: '海上的仙山，传说中仙人居住的地方',
                    legends: ['不老不死的仙药', '仙人的宫殿', '通往仙界的门户'],
                    guardians: ['海龙王', '仙鹤']
                }
            }
        };
    }

    // 获取剧情内容
    getStoryContent(category, id) {
        switch (category) {
            case 'main':
                return this.mainStorylines[id];
            case 'side':
                return this.sideQuests[id];
            case 'dialogue':
                return this.characterDialogues[id];
            case 'event':
                return this.worldEvents[id];
            case 'mythology':
                return this.mythologyDatabase[id];
            default:
                return null;
        }
    }

    // 获取角色对话
    getCharacterDialogue(character, type, context = {}) {
        const dialogues = this.characterDialogues[character];
        if (!dialogues || !dialogues[type]) {
            return '...（沉默不语）';
        }

        const options = dialogues[type];
        if (Array.isArray(options)) {
            // 根据上下文选择合适的对话
            return this.selectContextualDialogue(options, context);
        }

        return options;
    }

    // 根据上下文选择对话
    selectContextualDialogue(options, context) {
        // 简单的随机选择，可以根据需要添加更复杂的逻辑
        const randomIndex = Math.floor(Math.random() * options.length);
        return options[randomIndex];
    }

    // 获取世界事件
    getWorldEvent(season, rarity = 'common') {
        const seasonalEvents = this.worldEvents.seasonal;
        const specialEvents = this.worldEvents.special;

        // 根据稀有度和季节选择事件
        const availableEvents = [];

        // 添加季节性事件
        Object.values(seasonalEvents).forEach(event => {
            if (event.rarity === rarity) {
                availableEvents.push(event);
            }
        });

        // 根据稀有度添加特殊事件
        if (rarity !== 'common') {
            Object.values(specialEvents).forEach(event => {
                if (event.rarity === rarity) {
                    availableEvents.push(event);
                }
            });
        }

        if (availableEvents.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * availableEvents.length);
        return availableEvents[randomIndex];
    }

    // 获取神话背景
    getMythologyBackground(topic) {
        const results = [];

        // 搜索所有神话类别
        Object.values(this.mythologyDatabase).forEach(category => {
            Object.values(category).forEach(myth => {
                if (myth.title.includes(topic) || 
                    myth.content.includes(topic) ||
                    (myth.related_creatures && myth.related_creatures.includes(topic))) {
                    results.push(myth);
                }
            });
        });

        return results;
    }
}

module.exports = StoryDatabase;