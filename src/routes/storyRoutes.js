/**
 * 灵境斗宠录 - 剧情系统路由
 * 作者：树枝 (微信: wzq8083)
 */

const express = require('express');
const router = express.Router();

// 这里需要在实际集成时导入剧情系统
// const StoryIntegration = require('../story/StoryIntegration');

// 模拟剧情系统（实际使用时替换为真实的剧情系统）
class MockStorySystem {
    async triggerEvolutionStory(data) {
        return {
            title: `${data.pet.name}的蜕变之路`,
            type: 'evolution',
            rarity: 'epic',
            scenes: [
                {
                    type: 'description',
                    content: `在月圆之夜，${data.pet.name}被神秘的光芒包围。古老的力量在它体内觉醒，这是传说中的进化征兆。`
                },
                {
                    type: 'dialogue',
                    speaker: data.pet.name,
                    content: '主人，我感受到了前所未有的力量在体内涌动...这种感觉让我既兴奋又恐惧。'
                },
                {
                    type: 'mystical_event',
                    content: '突然，古老的符文在空中浮现，那是传说中的"进化之印"，见证着这一神圣时刻。'
                },
                {
                    type: 'choice',
                    prompt: '面对伙伴的进化，你选择...',
                    options: [
                        { id: 'encourage', text: '鼓励它拥抱变化', effect: 'bond+10' },
                        { id: 'caution', text: '提醒它保持冷静', effect: 'wisdom+5' },
                        { id: 'support', text: '默默给予支持', effect: 'trust+8' }
                    ]
                }
            ]
        };
    }

    async triggerBattleStory(data) {
        const isEpicBattle = data.enemy.rarity === 'SSS' || ['饕餮', '穷奇', '梼杌', '混沌'].includes(data.enemy.name);
        
        return {
            title: isEpicBattle ? `传说之战：${data.pet.name} VS ${data.enemy.name}` : `激烈对决`,
            type: isEpicBattle ? 'epic_battle' : 'regular_battle',
            rarity: isEpicBattle ? 'legendary' : 'common',
            scenes: [
                {
                    type: 'atmosphere',
                    content: isEpicBattle 
                        ? `天地为之变色，${data.enemy.name}的出现让整个世界都感到了威胁。这不仅仅是一场战斗，更是正义与邪恶的较量。`
                        : `战斗一触即发，${data.pet.name}与${data.enemy.name}相对而立，空气中弥漫着紧张的气息。`
                },
                {
                    type: 'description',
                    content: data.result === 'victory' 
                        ? `经过激烈的战斗，${data.pet.name}最终获得了胜利。这场胜利不仅证明了它的实力，更加深了你们之间的羁绊。`
                        : `虽然这次败北了，但${data.pet.name}展现出的勇气和坚持让你深受感动。失败也是成长的一部分。`
                }
            ]
        };
    }

    async triggerExplorationStory(data) {
        return {
            title: `${data.location}的秘密`,
            type: 'exploration',
            rarity: 'rare',
            scenes: [
                {
                    type: 'discovery',
                    content: `在${data.location}的深处，你发现了${data.discovery.name}。这个发现让你意识到，这个世界还有许多未知的秘密等待着你去探索。`
                },
                {
                    type: 'description',
                    content: `古老的传说在你脑海中浮现，这个发现可能与上古时期的某个重要事件有关。你决定仔细调查这个神秘的发现。`
                },
                {
                    type: 'choice',
                    prompt: '面对这个神秘的发现，你决定...',
                    options: [
                        { id: 'investigate', text: '深入调查', effect: 'knowledge+15' },
                        { id: 'record', text: '详细记录', effect: 'wisdom+10' },
                        { id: 'share', text: '与伙伴分享', effect: 'bond+12' }
                    ]
                }
            ]
        };
    }

    async triggerCharacterStory(data) {
        return {
            title: `与${data.character.name}的邂逅`,
            type: 'character_encounter',
            rarity: 'epic',
            scenes: [
                {
                    type: 'description',
                    content: `在${data.location}，你遇到了传说中的${data.character.name}。他/她的出现让整个环境都变得不同寻常。`
                },
                {
                    type: 'dialogue',
                    speaker: data.character.name,
                    content: data.character.name === '青木长老' 
                        ? '年轻的灵师，我能感受到你体内蕴含的潜力。真正的力量来自于与伙伴的羁绊，记住这一点。'
                        : data.character.name === '东海龙王'
                        ? '凡人，你竟敢踏入我的领域？不过...你的伙伴倒是有些意思。证明你们的实力，我或许会考虑给予帮助。'
                        : '你的到来，似乎预示着某种变化的开始...'
                },
                {
                    type: 'description',
                    content: `从${data.character.name}的话语中，你感受到了深层的含义。这次邂逅可能会改变你的命运轨迹。`
                }
            ]
        };
    }
}

const mockStorySystem = new MockStorySystem();

// 进化剧情接口
router.post('/evolution', async (req, res) => {
    try {
        const { pet, evolutionType, newForm, player } = req.body;
        
        console.log('🎭 请求进化剧情:', { pet: pet?.name, evolutionType });
        
        const storyData = await mockStorySystem.triggerEvolutionStory({
            pet,
            evolutionType,
            newForm,
            player
        });
        
        res.json(storyData);
    } catch (error) {
        console.error('进化剧情生成失败:', error);
        res.status(500).json({ error: '剧情生成失败' });
    }
});

// 战斗剧情接口
router.post('/battle', async (req, res) => {
    try {
        const { pet, enemy, result, battleData, player } = req.body;
        
        console.log('🎭 请求战斗剧情:', { pet: pet?.name, enemy: enemy?.name, result });
        
        const storyData = await mockStorySystem.triggerBattleStory({
            pet,
            enemy,
            result,
            battleData,
            player
        });
        
        res.json(storyData);
    } catch (error) {
        console.error('战斗剧情生成失败:', error);
        res.status(500).json({ error: '剧情生成失败' });
    }
});

// 探索剧情接口
router.post('/exploration', async (req, res) => {
    try {
        const { location, discovery, player } = req.body;
        
        console.log('🎭 请求探索剧情:', { location, discovery: discovery?.name });
        
        const storyData = await mockStorySystem.triggerExplorationStory({
            location,
            discovery,
            player
        });
        
        res.json(storyData);
    } catch (error) {
        console.error('探索剧情生成失败:', error);
        res.status(500).json({ error: '剧情生成失败' });
    }
});

// 角色剧情接口
router.post('/character', async (req, res) => {
    try {
        const { character, meetingType, location, player } = req.body;
        
        console.log('🎭 请求角色剧情:', { character: character?.name, meetingType, location });
        
        const storyData = await mockStorySystem.triggerCharacterStory({
            character,
            meetingType,
            location,
            player
        });
        
        res.json(storyData);
    } catch (error) {
        console.error('角色剧情生成失败:', error);
        res.status(500).json({ error: '剧情生成失败' });
    }
});

// 获取剧情状态
router.get('/status', async (req, res) => {
    try {
        // 这里应该从实际的剧情系统获取状态
        const status = {
            activeStories: 0,
            completedStories: 5,
            totalStories: 5,
            currentChapter: 1,
            unlockedRegions: ['青木灵境', '东海之滨'],
            knownCharacters: ['青木长老'],
            discoveredLore: ['森林的秘密', '古老的召唤法阵']
        };
        
        res.json(status);
    } catch (error) {
        console.error('获取剧情状态失败:', error);
        res.status(500).json({ error: '获取状态失败' });
    }
});

// 获取剧情历史
router.get('/history', async (req, res) => {
    try {
        // 这里应该从实际的剧情系统获取历史
        const history = [
            {
                id: 'story_1',
                title: '初入灵境',
                type: 'main',
                completedAt: new Date().toISOString(),
                choices: ['选择了谨慎探索']
            },
            {
                id: 'story_2',
                title: '第一次召唤',
                type: 'evolution',
                completedAt: new Date().toISOString(),
                choices: ['选择了鼓励伙伴']
            }
        ];
        
        res.json(history);
    } catch (error) {
        console.error('获取剧情历史失败:', error);
        res.status(500).json({ error: '获取历史失败' });
    }
});

// 测试剧情接口
router.post('/test', async (req, res) => {
    try {
        const { type = 'evolution' } = req.body;
        
        let testStory;
        
        switch (type) {
            case 'evolution':
                testStory = await mockStorySystem.triggerEvolutionStory({
                    pet: { name: '小火龙', species: '火龙' },
                    evolutionType: 'power_evolution',
                    newForm: '烈焰龙',
                    player: { name: '测试玩家' }
                });
                break;
                
            case 'battle':
                testStory = await mockStorySystem.triggerBattleStory({
                    pet: { name: '小火龙', species: '火龙' },
                    enemy: { name: '饕餮', rarity: 'SSS' },
                    result: 'victory',
                    player: { name: '测试玩家' }
                });
                break;
                
            case 'exploration':
                testStory = await mockStorySystem.triggerExplorationStory({
                    location: '神秘森林',
                    discovery: { name: '古老遗迹', type: 'ancient_ruins' },
                    player: { name: '测试玩家' }
                });
                break;
                
            case 'character':
                testStory = await mockStorySystem.triggerCharacterStory({
                    character: { name: '青木长老' },
                    meetingType: 'first_meeting',
                    location: '青木灵境',
                    player: { name: '测试玩家' }
                });
                break;
                
            default:
                return res.status(400).json({ error: '未知的剧情类型' });
        }
        
        res.json(testStory);
    } catch (error) {
        console.error('测试剧情生成失败:', error);
        res.status(500).json({ error: '测试失败' });
    }
});

module.exports = router;