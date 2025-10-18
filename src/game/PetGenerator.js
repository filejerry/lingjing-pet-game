/**
 * 灵境斗宠录 - 宠物生成系统
 * 作者：树枝 (微信: wzq8083)
 */

class PetGenerator {
    constructor() {
        this.races = [
            // 龙族
            { name: '火龙', type: 'dragon', baseRarity: 'sr' },
            { name: '冰龙', type: 'dragon', baseRarity: 'sr' },
            { name: '雷龙', type: 'dragon', baseRarity: 'sr' },
            { name: '青龙', type: 'dragon', baseRarity: 'ssr' },
            { name: '黑龙', type: 'dragon', baseRarity: 'ssr' },
            { name: '金龙', type: 'dragon', baseRarity: 'ssr' },
            
            // 鸟族
            { name: '雷鸟', type: 'bird', baseRarity: 'r' },
            { name: '冰鸟', type: 'bird', baseRarity: 'r' },
            { name: '火鸟', type: 'bird', baseRarity: 'sr' },
            { name: '朱雀', type: 'bird', baseRarity: 'ssr' },
            { name: '凤凰', type: 'bird', baseRarity: 'ssr' },
            { name: '鲲鹏', type: 'bird', baseRarity: 'ssr' },
            
            // 狐族
            { name: '白狐', type: 'fox', baseRarity: 'r' },
            { name: '银狐', type: 'fox', baseRarity: 'sr' },
            { name: '九尾狐', type: 'fox', baseRarity: 'ssr' },
            
            // 狼族
            { name: '风狼', type: 'wolf', baseRarity: 'r' },
            { name: '雪狼', type: 'wolf', baseRarity: 'r' },
            { name: '星辰狼', type: 'wolf', baseRarity: 'sr' },
            { name: '天狼', type: 'wolf', baseRarity: 'ssr' },
            
            // 蜥蜴族
            { name: '岩蜥', type: 'lizard', baseRarity: 'n' },
            { name: '毒蜥', type: 'lizard', baseRarity: 'r' },
            { name: '巨蜥', type: 'lizard', baseRarity: 'sr' },
            
            // 精灵族
            { name: '花精', type: 'fairy', baseRarity: 'n' },
            { name: '水精', type: 'fairy', baseRarity: 'r' },
            { name: '光精', type: 'fairy', baseRarity: 'sr' },
            
            // 其他神兽
            { name: '麒麟', type: 'beast', baseRarity: 'ssr' },
            { name: '白虎', type: 'beast', baseRarity: 'ssr' },
            { name: '玄武', type: 'beast', baseRarity: 'ssr' },
            { name: '鲲', type: 'beast', baseRarity: 'ssr' }
        ];

        this.attributes = [
            // 元素属性
            '火', '冰', '雷', '风', '土', '水', '光', '暗',
            // 特殊属性
            '圣', '邪', '混沌', '秩序', '虚无', '创世'
        ];

        this.specialWords = [
            // 普通词汇
            '幼崽', '少年', '成年', '长老',
            '守护', '流浪', '野生', '驯养',
            
            // 稀有词汇 (影响稀有度)
            '王者', '霸主', '传说', '神话',
            '绝迹', '远古', '禁忌', '封印',
            '觉醒', '进化', '变异', '异界',
            
            // SSR专属词汇
            '神', '圣', '魔', '仙',
            '帝', '皇', '尊', '主',
            '创世', '毁灭', '永恒', '无限'
        ];

        this.rarityWeights = {
            'n': 60,    // 60%
            'r': 25,    // 25%
            'sr': 14,   // 14%
            'ssr': 1    // 1%
        };
    }

    /**
     * 根据玩家选择生成宠物
     */
    generatePetByChoice(choice) {
        let preferredTypes = [];
        let preferredAttributes = [];
        
        switch (choice) {
            case 'sense_east':
                preferredTypes = ['bird', 'fairy', 'dragon'];
                preferredAttributes = ['光', '火', '圣'];
                break;
            case 'sense_north':
                preferredTypes = ['fox', 'wolf', 'beast'];
                preferredAttributes = ['暗', '冰', '混沌'];
                break;
            case 'sense_west':
                preferredTypes = ['dragon', 'lizard', 'beast'];
                preferredAttributes = ['雷', '风', '邪'];
                break;
        }

        // 决定稀有度
        const rarity = this.rollRarity();
        
        // 根据偏好和稀有度选择种族
        const race = this.selectRace(preferredTypes, rarity);
        
        // 生成属性和特殊词
        const attribute = this.selectAttribute(preferredAttributes);
        const specialWord = this.selectSpecialWord(rarity);
        
        // 生成完整名称
        const name = this.generateName(race, attribute, specialWord);
        
        // 生成基础属性
        const stats = this.generateStats(race, rarity);
        
        return {
            id: this.generateId(),
            name: name,
            race: race.name,
            type: race.type,
            rarity: rarity,
            attribute: attribute,
            specialWord: specialWord,
            stats: stats,
            level: 1,
            experience: 0,
            evolutionPotential: this.calculateEvolutionPotential(rarity),
            createdAt: new Date().toISOString()
        };
    }

    /**
     * 稀有度抽取
     */
    rollRarity() {
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            cumulative += weight;
            if (random <= cumulative) {
                return rarity;
            }
        }
        
        return 'n'; // 默认普通
    }

    /**
     * 选择种族
     */
    selectRace(preferredTypes, targetRarity) {
        // 先筛选符合偏好的种族
        let candidates = this.races.filter(race => 
            preferredTypes.includes(race.type)
        );
        
        // 如果没有符合偏好的，使用全部种族
        if (candidates.length === 0) {
            candidates = this.races;
        }
        
        // 根据目标稀有度调整选择
        const suitableRaces = candidates.filter(race => {
            if (targetRarity === 'ssr') return race.baseRarity === 'ssr';
            if (targetRarity === 'sr') return ['sr', 'ssr'].includes(race.baseRarity);
            return true; // n和r可以选择任何种族
        });
        
        const finalCandidates = suitableRaces.length > 0 ? suitableRaces : candidates;
        return finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
    }

    /**
     * 选择属性
     */
    selectAttribute(preferredAttributes) {
        if (preferredAttributes.length > 0 && Math.random() < 0.7) {
            return preferredAttributes[Math.floor(Math.random() * preferredAttributes.length)];
        }
        return this.attributes[Math.floor(Math.random() * this.attributes.length)];
    }

    /**
     * 选择特殊词汇
     */
    selectSpecialWord(rarity) {
        let wordPool = [];
        
        switch (rarity) {
            case 'ssr':
                wordPool = this.specialWords.slice(-12); // SSR专属词汇
                break;
            case 'sr':
                wordPool = this.specialWords.slice(8, -12); // 稀有词汇
                break;
            case 'r':
                wordPool = this.specialWords.slice(4, -16); // 普通+部分稀有
                break;
            default:
                wordPool = this.specialWords.slice(0, 8); // 普通词汇
        }
        
        return wordPool[Math.floor(Math.random() * wordPool.length)];
    }

    /**
     * 生成宠物名称
     */
    generateName(race, attribute, specialWord) {
        return `${race.name}*${attribute}*${specialWord}`;
    }

    /**
     * 生成基础属性
     */
    generateStats(race, rarity) {
        const baseStats = {
            hp: 100,
            attack: 20,
            defense: 15,
            speed: 10,
            magic: 10
        };

        // 种族加成
        const raceBonus = this.getRaceBonus(race.type);
        
        // 稀有度加成
        const rarityMultiplier = {
            'n': 1.0,
            'r': 1.2,
            'sr': 1.5,
            'ssr': 2.0
        }[rarity];

        const finalStats = {};
        for (const [stat, value] of Object.entries(baseStats)) {
            const bonus = raceBonus[stat] || 0;
            finalStats[stat] = Math.floor((value + bonus) * rarityMultiplier);
        }

        return finalStats;
    }

    /**
     * 获取种族属性加成
     */
    getRaceBonus(type) {
        const bonuses = {
            'dragon': { hp: 50, attack: 30, defense: 20, magic: 25 },
            'bird': { speed: 25, attack: 15, magic: 20 },
            'fox': { magic: 30, speed: 15, attack: 10 },
            'wolf': { attack: 25, speed: 20, hp: 20 },
            'lizard': { defense: 30, hp: 25, attack: 10 },
            'fairy': { magic: 35, speed: 10, defense: -5 },
            'beast': { hp: 40, attack: 35, defense: 25, magic: 20 }
        };
        
        return bonuses[type] || {};
    }

    /**
     * 计算进化潜力
     */
    calculateEvolutionPotential(rarity) {
        const basePotential = {
            'n': 3,
            'r': 5,
            'sr': 7,
            'ssr': 10
        }[rarity];
        
        return basePotential + Math.floor(Math.random() * 3);
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'pet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取宠物描述
     */
    getPetDescription(pet) {
        const descriptions = {
            'dragon': '威严的龙族，拥有强大的力量和古老的智慧',
            'bird': '自由的鸟族，掌控天空与风的力量',
            'fox': '狡黠的狐族，精通幻术与魅惑之道',
            'wolf': '忠诚的狼族，团结协作的天生猎手',
            'lizard': '坚韧的蜥蜴族，拥有强大的防御能力',
            'fairy': '纯洁的精灵族，与自然和谐共存',
            'beast': '传说的神兽，拥有超越常理的神秘力量'
        };
        
        return descriptions[pet.type] || '神秘的生物，拥有未知的能力';
    }
}

module.exports = PetGenerator;