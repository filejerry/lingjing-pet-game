/**
 * 灵境斗宠录 - AI宠物匹配引擎
 * 作者：树枝 (微信: wzq8083)
 * 
 * 核心功能：
 * 1. 通过AI提示词智能匹配宠物
 * 2. 确保每个宠物独一无二
 * 3. 维护玩家数据档案库
 */

class PetMatchingEngine {
    constructor(aiService, database) {
        this.aiService = aiService;
        this.database = database;
        this.usedPetIds = new Set(); // 已使用的宠物ID集合
        
        // 初始化大型宠物数据库
        this.initializePetDatabase();
    }

    /**
     * 初始化大型宠物数据库
     */
    initializePetDatabase() {
        this.petDatabase = {
            // 龙族 (Dragon)
            dragons: [
                { race: '火龙', attributes: ['火', '烈', '炎', '焚'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '冰龙', attributes: ['冰', '霜', '雪', '寒'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '雷龙', attributes: ['雷', '电', '闪', '震'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '风龙', attributes: ['风', '岚', '飓', '旋'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '土龙', attributes: ['土', '岩', '石', '山'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '水龙', attributes: ['水', '海', '潮', '波'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '光龙', attributes: ['光', '圣', '辉', '耀'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '暗龙', attributes: ['暗', '影', '夜', '魔'], specialWords: ['幼崽', '少年', '成年', '长老', '王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印'] },
                { race: '青龙', attributes: ['青', '木', '生', '春'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '黑龙', attributes: ['黑', '深', '渊', '噬'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '金龙', attributes: ['金', '贵', '尊', '皇'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '银龙', attributes: ['银', '月', '星', '辰'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] }
            ],

            // 鸟族 (Bird)
            birds: [
                { race: '火鸟', attributes: ['火', '烈', '炎', '焚'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '冰鸟', attributes: ['冰', '霜', '雪', '寒'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '雷鸟', attributes: ['雷', '电', '闪', '震'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '风鸟', attributes: ['风', '岚', '飓', '旋'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '朱雀', attributes: ['朱', '红', '火', '凤'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '凤凰', attributes: ['凤', '凰', '涅', '槃'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '鲲鹏', attributes: ['鲲', '鹏', '海', '天'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '金乌', attributes: ['金', '乌', '日', '阳'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] }
            ],

            // 狐族 (Fox)
            foxes: [
                { race: '白狐', attributes: ['白', '雪', '纯', '洁'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '红狐', attributes: ['红', '火', '烈', '炎'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '银狐', attributes: ['银', '月', '星', '辰'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养', '王者', '霸主'] },
                { race: '金狐', attributes: ['金', '贵', '尊', '皇'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养', '王者', '霸主'] },
                { race: '九尾狐', attributes: ['九', '尾', '魅', '惑'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '天狐', attributes: ['天', '仙', '灵', '妖'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] }
            ],

            // 狼族 (Wolf)
            wolves: [
                { race: '灰狼', attributes: ['灰', '野', '荒', '原'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '白狼', attributes: ['白', '雪', '冰', '霜'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '黑狼', attributes: ['黑', '夜', '暗', '影'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '风狼', attributes: ['风', '速', '疾', '快'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '火狼', attributes: ['火', '烈', '炎', '焚'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '星辰狼', attributes: ['星', '辰', '夜', '空'], specialWords: ['王者', '霸主', '传说', '神话', '觉醒', '进化', '变异', '异界'] },
                { race: '天狼', attributes: ['天', '狼', '月', '啸'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] }
            ],

            // 蜥蜴族 (Lizard)
            lizards: [
                { race: '岩蜥', attributes: ['岩', '石', '土', '山'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '沙蜥', attributes: ['沙', '漠', '干', '燥'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '毒蜥', attributes: ['毒', '腐', '蚀', '死'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '水蜥', attributes: ['水', '湿', '潮', '润'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '巨蜥', attributes: ['巨', '大', '强', '壮'], specialWords: ['王者', '霸主', '传说', '神话', '觉醒', '进化', '变异', '异界'] },
                { race: '变色蜥', attributes: ['变', '色', '隐', '形'], specialWords: ['王者', '霸主', '传说', '神话', '觉醒', '进化', '变异', '异界'] }
            ],

            // 精灵族 (Fairy)
            fairies: [
                { race: '花精', attributes: ['花', '香', '美', '丽'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '水精', attributes: ['水', '清', '纯', '净'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '风精', attributes: ['风', '轻', '飘', '逸'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养'] },
                { race: '光精', attributes: ['光', '亮', '辉', '耀'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养', '王者', '霸主'] },
                { race: '暗精', attributes: ['暗', '影', '夜', '魔'], specialWords: ['幼崽', '少年', '成年', '长老', '守护', '流浪', '野生', '驯养', '王者', '霸主'] },
                { race: '自然精', attributes: ['自', '然', '生', '命'], specialWords: ['王者', '霸主', '传说', '神话', '觉醒', '进化', '变异', '异界'] }
            ],

            // 神兽族 (Beast)
            beasts: [
                { race: '麒麟', attributes: ['麒', '麟', '仁', '德'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '白虎', attributes: ['白', '虎', '威', '猛'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '玄武', attributes: ['玄', '武', '守', '护'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '鲲', attributes: ['鲲', '海', '深', '渊'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '貔貅', attributes: ['貔', '貅', '财', '富'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '饕餮', attributes: ['饕', '餮', '吞', '噬'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '梼杌', attributes: ['梼', '杌', '凶', '恶'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] },
                { race: '混沌', attributes: ['混', '沌', '无', '序'], specialWords: ['王者', '霸主', '传说', '神话', '绝迹', '远古', '禁忌', '封印', '神', '圣', '帝', '皇'] }
            ]
        };
    }

    /**
     * 根据玩家选择智能匹配宠物
     */
    async matchPetByChoice(choice, playerId) {
        try {
            // 构建AI提示词
            const prompt = this.buildMatchingPrompt(choice);
            
            // 调用AI服务获取匹配建议
            const aiResponse = await this.aiService.generateResponse(prompt);
            
            // 解析AI响应并生成宠物核心数据
            const coreData = await this.generateUniquePetCore(aiResponse, choice, playerId);
            
            // 保存核心数据到玩家档案库
            await this.savePetCoreToDatabase(coreData, playerId);
            
            return coreData;
            
        } catch (error) {
            console.error('AI匹配失败，使用备用算法:', error);
            // 如果AI失败，使用固定算法
            return await this.fallbackMatching(choice, playerId);
        }
    }

    /**
     * 构建AI匹配提示词
     */
    buildMatchingPrompt(choice) {
        const choiceDescriptions = {
            'sense_east': '东方温暖光芒 - 生机勃勃、光明、治愈、成长',
            'sense_north': '北方神秘月光 - 神秘、智慧、魔法、古老',
            'sense_west': '西方雷电之力 - 狂野、力量、速度、战斗'
        };

        return `
你是《灵境斗宠录》的宠物匹配AI。玩家选择了"${choiceDescriptions[choice]}"。

请根据以下规则为玩家匹配一只独一无二的宠物：

1. 宠物命名格式：种族*属性*特殊词
2. 稀有度概率：SSR(1%), SR(14%), R(25%), N(60%)
3. 种族类型：龙族、鸟族、狐族、狼族、蜥蜴族、精灵族、神兽族
4. 属性要符合玩家选择的倾向
5. 特殊词要体现宠物的独特性

可选种族库：
- 龙族：火龙、冰龙、雷龙、风龙、土龙、水龙、光龙、暗龙、青龙、黑龙、金龙、银龙
- 鸟族：火鸟、冰鸟、雷鸟、风鸟、朱雀、凤凰、鲲鹏、金乌
- 狐族：白狐、红狐、银狐、金狐、九尾狐、天狐
- 狼族：灰狼、白狼、黑狼、风狼、火狼、星辰狼、天狼
- 蜥蜴族：岩蜥、沙蜥、毒蜥、水蜥、巨蜥、变色蜥
- 精灵族：花精、水精、风精、光精、暗精、自然精
- 神兽族：麒麟、白虎、玄武、鲲、貔貅、饕餮、梼杌、混沌

请返回JSON格式：
{
    "race": "种族名",
    "attribute": "属性",
    "specialWord": "特殊词",
    "rarity": "稀有度(n/r/sr/ssr)",
    "type": "种族类型",
    "reasoning": "匹配理由"
}
        `;
    }

    /**
     * 生成独一无二的宠物核心数据
     */
    async generateUniquePetCore(aiResponse, choice, playerId) {
        let petData;
        
        try {
            // 尝试解析AI响应
            petData = JSON.parse(aiResponse);
        } catch (error) {
            // 如果解析失败，使用固定算法
            petData = this.fallbackPetGeneration(choice);
        }

        // 生成唯一ID和名称
        const uniqueId = this.generateUniqueId(playerId);
        const petName = `${petData.race}*${petData.attribute}*${petData.specialWord}`;
        
        // 确保宠物名称唯一性
        const finalName = await this.ensureUniqueName(petName, playerId);
        
        // 生成宠物核心数据（只存储基础信息）
        const coreData = {
            id: uniqueId,
            name: finalName,
            race: petData.race,
            type: petData.type,
            rarity: petData.rarity,
            attribute: petData.attribute,
            specialWord: petData.specialWord,
            stats: this.generateStats(petData.race, petData.rarity),
            level: 1,
            experience: 0,
            evolutionPotential: this.calculateEvolutionPotential(petData.rarity),
            playerId: playerId,
            createdAt: new Date().toISOString(),
            uniqueTraits: this.generateUniqueTraits(),
            // 不存储详细设定，由AI实时生成
            choice: choice // 保存选择用于后续设定生成
        };

        return coreData;
    }

    /**
     * 确保宠物名称唯一性
     */
    async ensureUniqueName(baseName, playerId) {
        let finalName = baseName;
        let counter = 1;
        
        // 检查数据库中是否已存在相同名称
        while (await this.isPetNameExists(finalName)) {
            finalName = `${baseName}·${counter}`;
            counter++;
        }
        
        return finalName;
    }

    /**
     * 检查宠物名称是否已存在
     */
    async isPetNameExists(name) {
        try {
            if (!this.database || !this.database.db) return false;
            
            const stmt = this.database.db.prepare('SELECT COUNT(*) as count FROM pets WHERE name = ?');
            const result = stmt.get(name);
            return result.count > 0;
        } catch (error) {
            console.error('检查宠物名称失败:', error);
            return false;
        }
    }

    /**
     * 生成唯一ID
     */
    generateUniqueId(playerId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${playerId}_${timestamp}_${random}`;
    }

    /**
     * 生成独特特征
     */
    generateUniqueTraits() {
        const traits = [
            '拥有异色瞳孔', '身上有神秘印记', '会发出微光',
            '能感知情绪', '喜欢收集闪亮物品', '害怕雷声',
            '只在月圆之夜活跃', '能预知天气变化', '喜欢在水边嬉戏',
            '对音乐有特殊反应', '能看见灵体', '喜欢模仿主人动作'
        ];
        
        const selectedTraits = [];
        const traitCount = Math.floor(Math.random() * 3) + 1; // 1-3个特征
        
        for (let i = 0; i < traitCount; i++) {
            const trait = traits[Math.floor(Math.random() * traits.length)];
            if (!selectedTraits.includes(trait)) {
                selectedTraits.push(trait);
            }
        }
        
        return selectedTraits;
    }

    /**
     * 保存宠物核心数据到数据库
     */
    async savePetCoreToDatabase(coreData, playerId) {
        try {
            if (!this.database || !this.database.db) {
                console.warn('数据库不可用，无法保存宠物');
                return;
            }

            const stmt = this.database.db.prepare(`
                INSERT INTO pets (
                    id, name, race, type, rarity, attribute, special_word, 
                    stats, level, experience, evolution_potential, player_id,
                    created_at, unique_traits, choice
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                coreData.id, coreData.name, coreData.race, coreData.type, coreData.rarity,
                coreData.attribute, coreData.specialWord, JSON.stringify(coreData.stats),
                coreData.level, coreData.experience, coreData.evolutionPotential,
                coreData.playerId, coreData.createdAt, JSON.stringify(coreData.uniqueTraits),
                coreData.choice
            );
            
            // 记录已使用的宠物ID
            this.usedPetIds.add(coreData.id);
            
        } catch (error) {
            console.error('保存宠物核心数据失败:', error);
        }
    }

    /**
     * 备用匹配算法（当AI失败时使用）
     */
    async fallbackMatching(choice, playerId) {
        const petData = this.fallbackPetGeneration(choice);
        return await this.generateUniquePetCore(JSON.stringify(petData), choice, playerId);
    }

    /**
     * 备用宠物生成
     */
    fallbackPetGeneration(choice) {
        // 根据选择确定偏好
        let preferredTypes = [];
        let preferredAttributes = [];
        
        switch (choice) {
            case 'sense_east':
                preferredTypes = ['birds', 'fairies', 'dragons'];
                preferredAttributes = ['光', '火', '圣', '生'];
                break;
            case 'sense_north':
                preferredTypes = ['foxes', 'wolves', 'beasts'];
                preferredAttributes = ['暗', '冰', '月', '夜'];
                break;
            case 'sense_west':
                preferredTypes = ['dragons', 'lizards', 'beasts'];
                preferredAttributes = ['雷', '风', '电', '震'];
                break;
        }

        // 随机选择类型
        const typeKey = preferredTypes[Math.floor(Math.random() * preferredTypes.length)];
        const typeData = this.petDatabase[typeKey];
        const raceData = typeData[Math.floor(Math.random() * typeData.length)];
        
        // 选择属性和特殊词
        const attribute = preferredAttributes[Math.floor(Math.random() * preferredAttributes.length)] || 
                         raceData.attributes[Math.floor(Math.random() * raceData.attributes.length)];
        const specialWord = raceData.specialWords[Math.floor(Math.random() * raceData.specialWords.length)];
        
        // 决定稀有度
        const rarity = this.rollRarity();
        
        return {
            race: raceData.race,
            attribute: attribute,
            specialWord: specialWord,
            rarity: rarity,
            type: typeKey.slice(0, -1), // 去掉复数s
            reasoning: '通过固定算法匹配生成'
        };
    }

    /**
     * 稀有度抽取
     */
    rollRarity() {
        const random = Math.random() * 100;
        if (random <= 1) return 'ssr';      // 1%
        if (random <= 15) return 'sr';      // 14%
        if (random <= 40) return 'r';       // 25%
        return 'n';                         // 60%
    }

    /**
     * 生成属性
     */
    generateStats(race, rarity) {
        const baseStats = { hp: 100, attack: 20, defense: 15, speed: 10, magic: 10 };
        const rarityMultiplier = { 'n': 1.0, 'r': 1.2, 'sr': 1.5, 'ssr': 2.0 }[rarity];
        
        // 种族加成
        const raceBonus = this.getRaceBonus(race);
        
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
    getRaceBonus(race) {
        const bonuses = {
            // 龙族
            '火龙': { hp: 50, attack: 30, defense: 20, magic: 25 },
            '冰龙': { hp: 50, attack: 25, defense: 30, magic: 25 },
            '雷龙': { hp: 45, attack: 35, defense: 15, magic: 30 },
            '青龙': { hp: 60, attack: 40, defense: 35, magic: 35 },
            
            // 鸟族
            '火鸟': { speed: 25, attack: 20, magic: 20 },
            '朱雀': { speed: 30, attack: 35, magic: 40 },
            '凤凰': { speed: 35, attack: 30, magic: 45 },
            
            // 狐族
            '白狐': { magic: 25, speed: 15 },
            '九尾狐': { magic: 40, speed: 25, attack: 20 },
            
            // 其他种族...
        };
        
        return bonuses[race] || { hp: 20, attack: 15, defense: 10, speed: 10, magic: 15 };
    }

    /**
     * 计算进化潜力
     */
    calculateEvolutionPotential(rarity) {
        const basePotential = { 'n': 3, 'r': 5, 'sr': 7, 'ssr': 10 }[rarity];
        return basePotential + Math.floor(Math.random() * 3);
    }

    /**
     * 获取玩家的所有宠物
     */
    async getPlayerPets(playerId) {
        try {
            if (!this.database || !this.database.db) return [];
            
            const stmt = this.database.db.prepare('SELECT * FROM pets WHERE player_id = ? ORDER BY created_at DESC');
            const pets = stmt.all(playerId);
            
            // 解析JSON字段
            pets.forEach(pet => {
                pet.stats = JSON.parse(pet.stats);
                pet.uniqueTraits = JSON.parse(pet.uniqueTraits);
            });
            
            return pets;
        } catch (error) {
            console.error('获取玩家宠物失败:', error);
            return [];
        }
    }
}

module.exports = PetMatchingEngine;