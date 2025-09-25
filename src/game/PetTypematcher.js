/**
 * 宠物类型智能匹配系统 - 山海经主题扩展版
 * 根据玩家输入的描述，匹配最相近的宠物类型
 */

class PetTypematcher {
  constructor() {
    // 稀有度颜色配置
    this.rarityColors = {
      'N': { color: '#808080', name: '普通', textColor: '#ffffff' },      // 灰色
      'R': { color: '#4169e1', name: '稀有', textColor: '#ffffff' },      // 蓝色
      'SR': { color: '#9932cc', name: '超稀有', textColor: '#ffffff' },   // 紫色
      'SSR': { color: '#ff6347', name: '极稀有', textColor: '#ffffff' },  // 红色
      'SSS': { color: 'linear-gradient(45deg, #ffd700, #ff6347, #9932cc, #4169e1)', name: '传说', textColor: '#ffffff' } // 七彩渐变
    };

    // 预定义的宠物类型库 - 山海经主题扩展
    this.petDatabase = {
=======
      // 山海经神兽 - SSS级传说生物
      shanhaijing_legendary: {
        keywords: ['龙', '凤', '麒麟', '白泽', '九尾', '狐仙', '朱雀', '玄武', '青龙', '白虎', '饕餮', '混沌', '穷奇', '梼杌'],
        types: [
          {
            name: '九天应龙',
            species: '应龙',
            element: 'divine',
            rarity: 'SSS',
            description: '传说中的神龙之王，背生双翼，掌控风雨雷电，乃天帝座下第一神兽',
            personality: '威严神圣，拥有无上智慧，只认可品德高尚之人',
            baseStats: { hp: 200, attack: 50, defense: 45, speed: 40, magic: 60 }
          },
          {
            name: '涅槃凤凰',
            species: '凤凰',
            element: 'fire',
            rarity: 'SSS',
            description: '百鸟之王，浴火重生的不死神鸟，羽毛如烈焰般绚烂夺目',
            personality: '高贵优雅，象征着重生与希望，喜欢纯洁善良的心灵',
            baseStats: { hp: 180, attack: 45, defense: 35, speed: 55, magic: 65 }
          },
          {
            name: '瑞兽麒麟',
            species: '麒麟',
            element: 'holy',
            rarity: 'SSS',
            description: '仁兽之首，龙头鹿身，浑身覆盖金色鳞片，踏过之处百花盛开',
            personality: '仁慈温和，只在盛世出现，能辨善恶，护佑正义',
            baseStats: { hp: 190, attack: 40, defense: 50, speed: 35, magic: 65 }
          },
          {
            name: '九尾天狐',
            species: '九尾狐',
            element: 'illusion',
            rarity: 'SSS',
            description: '修炼千年的狐仙，九条尾巴如云霞飘舞，精通幻术与预言',
            personality: '聪慧狡黠，善于变化，对有缘人忠诚不二',
            baseStats: { hp: 160, attack: 35, defense: 30, speed: 60, magic: 75 }
          }
        ]
      },

      // 山海经异兽 - SSR级稀有生物
      shanhaijing_rare: {
        keywords: ['貔貅', '獬豸', '夔', '鲲鹏', '烛龙', '腾蛇', '毕方', '鸾鸟', '玉兔', '金乌'],
        types: [
          {
            name: '招财貔貅',
            species: '貔貅',
            element: 'earth',
            rarity: 'SSR',
            description: '龙头狮身的瑞兽，只进不出，专食金银财宝，是财富的守护神',
            personality: '忠诚护主，嗅觉敏锐，能感知财富气息',
            baseStats: { hp: 140, attack: 35, defense: 40, speed: 25, magic: 30 }
          },
          {
            name: '正义獬豸',
            species: '獬豸',
            element: 'justice',
            rarity: 'SSR',
            description: '独角神兽，能辨是非曲直，见不平必怒，是正义的化身',
            personality: '刚正不阿，嫉恶如仇，绝不容忍邪恶',
            baseStats: { hp: 130, attack: 40, defense: 35, speed: 30, magic: 35 }
          },
          {
            name: '雷神夔',
            species: '夔',
            element: 'thunder',
            rarity: 'SSR',
            description: '独足雷兽，状如牛，苍身无角，出入水必有风雨，其声如雷',
            personality: '性情暴烈，掌控雷电，但内心纯真',
            baseStats: { hp: 120, attack: 45, defense: 30, speed: 35, magic: 40 }
          },
          {
            name: '逍遥鲲鹏',
            species: '鲲鹏',
            element: 'wind',
            rarity: 'SSR',
            description: '北冥有鱼，其名为鲲，化而为鸟，其名为鹏，扶摇直上九万里',
            personality: '自由不羁，志向高远，渴望翱翔于无垠天空',
            baseStats: { hp: 110, attack: 30, defense: 25, speed: 55, magic: 45 }
          }
        ]
      },

      // 山海经灵兽 - SR级超稀有生物
      shanhaijing_spirit: {
        keywords: ['白鹿', '青鸟', '玄鸟', '朱厌', '狴犴', '椒图', '蒲牢', '睚眦', '赑屃'],
        types: [
          {
            name: '仙灵白鹿',
            species: '白鹿',
            element: 'nature',
            rarity: 'SR',
            description: '通体雪白的神鹿，角如珊瑚，能识仙草，常伴仙人左右',
            personality: '温和善良，喜欢宁静的森林，能感知自然的变化',
            baseStats: { hp: 100, attack: 25, defense: 30, speed: 40, magic: 35 }
          },
          {
            name: '信使青鸟',
            species: '青鸟',
            element: 'wind',
            rarity: 'SR',
            description: '西王母的使者，羽毛如翡翠般碧绿，能传递天界消息',
            personality: '机敏聪慧，忠于职守，是天地间的信使',
            baseStats: { hp: 80, attack: 30, defense: 20, speed: 50, magic: 40 }
          },
          {
            name: '神兽朱厌',
            species: '朱厌',
            element: 'fire',
            rarity: 'SR',
            description: '赤红如火的神猿，力大无穷，见则天下大乱，但心性纯真',
            personality: '力大无穷，性格直爽，但容易冲动',
            baseStats: { hp: 110, attack: 40, defense: 25, speed: 35, magic: 20 }
          }
        ]
      },

      // 传统神兽 - R级稀有生物
      traditional_beasts: {
        keywords: ['猫', '喵', '猫咪', '小猫', '狮子', '老虎', '豹子', '狼', '狗', '狐狸', '鹰', '鹤', '蛇', '龟'],
        types: [
          {
            name: '星辰猫',
            species: '星辰猫',
            element: 'star',
            rarity: 'R',
            description: '毛发如星空般闪烁的神秘小猫，眼中蕴含着宇宙的奥秘',
            personality: '优雅而神秘，喜欢在夜晚活动',
            baseStats: { hp: 60, attack: 15, defense: 12, speed: 18, magic: 20 }
          },
          {
            name: '火焰狮',
            species: '火焰狮',
            element: 'fire',
            rarity: 'R',
            description: '鬃毛燃烧着永不熄灭火焰的幼狮，散发着王者的威严',
            personality: '勇敢而高傲，天生的领导者',
            baseStats: { hp: 80, attack: 25, defense: 18, speed: 15, magic: 12 }
          },
          {
            name: '影子豹',
            species: '影豹',
            element: 'shadow',
            rarity: 'R',
            description: '能够与阴影融为一体的神秘豹子，行动如风',
            personality: '敏捷而狡猾，擅长隐秘行动',
            baseStats: { hp: 55, attack: 22, defense: 10, speed: 28, magic: 15 }
          },
          {
            name: '雷鸣狼',
            species: '雷狼',
            element: 'thunder',
            rarity: 'R',
            description: '掌控雷电之力的神秘狼族，每一声嚎叫都伴随着雷鸣',
            personality: '忠诚而勇敢，对主人绝对忠心',
            baseStats: { hp: 70, attack: 20, defense: 15, speed: 20, magic: 18 }
          }
        ]
      },

      // 普通灵兽 - N级普通生物
      common_spirits: {
        keywords: ['兔子', '松鼠', '小鸟', '蝴蝶', '萤火虫', '小鱼', '青蛙', '蜜蜂', '蚂蚁', '蜗牛'],
        types: [
          {
            name: '月光兔',
            species: '月兔',
            element: 'moon',
            rarity: 'N',
            description: '在月光下闪闪发光的可爱小兔，喜欢吃月桂叶',
            personality: '温顺可爱，喜欢安静的夜晚',
            baseStats: { hp: 40, attack: 8, defense: 10, speed: 15, magic: 12 }
          },
          {
            name: '风铃鸟',
            species: '风铃鸟',
            element: 'wind',
            rarity: 'N',
            description: '叫声如风铃般清脆的小鸟，羽毛随风飘舞',
            personality: '活泼开朗，喜欢唱歌',
            baseStats: { hp: 35, attack: 10, defense: 8, speed: 20, magic: 15 }
          },
          {
            name: '萤光蝶',
            species: '萤光蝶',
            element: 'light',
            rarity: 'N',
            description: '翅膀散发着柔和光芒的蝴蝶，如梦如幻',
            personality: '优雅梦幻，喜欢花朵',
            baseStats: { hp: 30, attack: 6, defense: 6, speed: 25, magic: 18 }
          }
        ]
      },
=======

      // 上古凶兽 - 特殊SSS级（负面传说）
      ancient_fiends: {
        keywords: ['饕餮', '混沌', '穷奇', '梼杌', '魑魅', '魍魉', '夜叉', '罗刹'],
        types: [
          {
            name: '贪婪饕餮',
            species: '饕餮',
            element: 'chaos',
            rarity: 'SSS',
            description: '上古四凶之一，贪得无厌的凶兽，能吞噬一切，但可被驯化',
            personality: '贪婪但忠诚，一旦认主便绝不背叛',
            baseStats: { hp: 220, attack: 55, defense: 40, speed: 25, magic: 40 }
          },
          {
            name: '无序混沌',
            species: '混沌',
            element: 'void',
            rarity: 'SSS',
            description: '无形无状的混沌之兽，代表着原始的无序力量',
            personality: '难以理解，但蕴含着创造与毁灭的双重力量',
            baseStats: { hp: 200, attack: 45, defense: 35, speed: 30, magic: 70 }
          }
        ]
      },
=======
            baseStats: { hp: 70, attack: 20, defense: 15, speed: 20, magic: 18 }
          },
          {
            name: '九尾狐',
            species: '九尾狐',
            element: 'illusion',
            description: '传说中的九尾天狐，拥有迷惑人心的神秘力量',
            personality: '聪明而狡黠，充满智慧',
            baseStats: { hp: 65, attack: 18, defense: 12, speed: 25, magic: 30 }
          },
          {
            name: '冰霜犬',
            species: '冰犬',
            element: 'ice',
            description: '来自极地的冰霜之犬，呼吸间都带着寒冰之气',
            personality: '冷静而可靠，在危险时刻最值得信赖',
            baseStats: { hp: 75, attack: 16, defense: 20, speed: 14, magic: 15 }
          }
        ]
      },

      // 鸟类
      birds: {
        keywords: ['鸟', '鸟儿', '小鸟', '鹰', '鸽子', '乌鸦', '凤凰', '朱雀', '鸡', '鸭', '鹅', '天鹅', '孔雀'],
        types: [
          {
            name: '凤凰雏',
            species: '凤凰',
            element: 'fire',
            description: '传说中凤凰的幼体，拥有浴火重生的神圣力量',
            personality: '高贵而圣洁，天生的治愈者',
            baseStats: { hp: 90, attack: 22, defense: 16, speed: 24, magic: 28 }
          },
          {
            name: '风暴鹰',
            species: '风鹰',
            element: 'wind',
            description: '翱翔于风暴中的神鹰，掌控着天空的力量',
            personality: '自由而桀骜，渴望翱翔天际',
            baseStats: { hp: 50, attack: 24, defense: 8, speed: 32, magic: 16 }
          },
          {
            name: '智慧鸦',
            species: '智鸦',
            element: 'dark',
            description: '拥有超凡智慧的神秘乌鸦，能预知未来的片段',
            personality: '聪明而神秘，喜欢收集闪亮的东西',
            baseStats: { hp: 45, attack: 12, defense: 10, speed: 20, magic: 35 }
          }
        ]
      },

      // 龙类
      dragons: {
        keywords: ['龙', '龙龙', '小龙', '巨龙', '飞龙', '恐龙', '蛟龙', '应龙', '青龙', '黑龙', '红龙', '白龙', '金龙'],
        types: [
          {
            name: '真龙幼体',
            species: '真龙',
            element: 'divine',
            description: '东方神话中真龙的幼体，拥有掌控天地的潜力',
            personality: '威严而仁慈，天生的统治者',
            baseStats: { hp: 120, attack: 30, defense: 25, speed: 18, magic: 35 }
          },
          {
            name: '水晶龙',
            species: '水晶龙',
            element: 'crystal',
            description: '身体由纯净水晶构成的神秘龙族，闪闪发光',
            personality: '纯洁而坚强，内心如水晶般透明',
            baseStats: { hp: 85, attack: 20, defense: 30, speed: 12, magic: 25 }
          },
          {
            name: '暗影龙',
            species: '暗影龙',
            element: 'shadow',
            description: '栖息于阴影中的神秘龙族，掌控着黑暗的力量',
            personality: '神秘而强大，不轻易显露真实力量',
            baseStats: { hp: 95, attack: 28, defense: 20, speed: 22, magic: 30 }
          }
        ]
      },

      // 神话生物
      mythical: {
        keywords: ['麒麟', '独角兽', '天马', '鲲鹏', '白虎', '玄武', '朱雀', '青龙', '貔貅', '饕餮', '梼杌', '混沌'],
        types: [
          {
            name: '麒麟幼崽',
            species: '麒麟',
            element: 'holy',
            description: '仁兽之王麒麟的幼崽，只在盛世出现的祥瑞神兽',
            personality: '仁慈而正义，天生的和平使者',
            baseStats: { hp: 100, attack: 25, defense: 22, speed: 20, magic: 33 }
          },
          {
            name: '独角兽',
            species: '独角兽',
            element: 'light',
            description: '额头长着螺旋独角的圣洁生物，拥有净化一切的力量',
            personality: '纯洁而善良，只亲近心地善良的人',
            baseStats: { hp: 80, attack: 18, defense: 16, speed: 26, magic: 30 }
          },
          {
            name: '天马',
            species: '天马',
            element: 'wind',
            description: '拥有洁白羽翼的神马，能够在云端自由飞翔',
            personality: '自由而高贵，渴望无拘无束的生活',
            baseStats: { hp: 75, attack: 20, defense: 14, speed: 35, magic: 20 }
          }
        ]
      },

      // 可爱小动物
      cute: {
        keywords: ['兔子', '兔兔', '小兔', '仓鼠', '松鼠', '熊猫', '考拉', '海豚', '企鹅', '可爱', '萌', '软萌'],
        types: [
          {
            name: '月兔',
            species: '月兔',
            element: 'moon',
            description: '来自月宫的神秘兔子，毛发在月光下闪闪发光',
            personality: '温柔而梦幻，喜欢在月圆之夜活动',
            baseStats: { hp: 55, attack: 12, defense: 10, speed: 25, magic: 28 }
          },
          {
            name: '星光熊猫',
            species: '星熊猫',
            element: 'star',
            description: '黑白相间的毛发中闪烁着星光的神奇熊猫',
            personality: '憨厚而可爱，总是能带给人快乐',
            baseStats: { hp: 90, attack: 15, defense: 25, speed: 8, magic: 22 }
          },
          {
            name: '彩虹松鼠',
            species: '彩虹松鼠',
            element: 'rainbow',
            description: '尾巴呈现七彩颜色的神奇松鼠，所到之处彩虹相随',
            personality: '活泼而开朗，充满正能量',
            baseStats: { hp: 40, attack: 18, defense: 8, speed: 30, magic: 24 }
          }
        ]
      },

      // 海洋生物
      marine: {
        keywords: ['鱼', '海豚', '鲸鱼', '章鱼', '水母', '海龟', '海马', '鲨鱼', '海洋', '水', '海'],
        types: [
          {
            name: '深海龙',
            species: '海龙',
            element: 'water',
            rarity: 'SR',
            description: '来自深海的神秘龙族，掌控着海洋的无穷力量',
            personality: '深沉而智慧，如海洋般深不可测',
            baseStats: { hp: 95, attack: 22, defense: 20, speed: 16, magic: 27 }
          },
          {
            name: '星海水母',
            species: '星水母',
            element: 'water',
            rarity: 'R',
            description: '透明身体中闪烁着星光的神奇水母，美丽而神秘',
            personality: '优雅而宁静，喜欢在水中翩翩起舞',
            baseStats: { hp: 60, attack: 10, defense: 15, speed: 20, magic: 35 }
          },
          {
            name: '雷鲨',
            species: '雷鲨',
            element: 'thunder',
            rarity: 'SSR',
            description: '身体中蕴含雷电之力的神秘鲨鱼，游动时电光闪烁',
            personality: '凶猛而强大，但对主人绝对忠诚',
            baseStats: { hp: 80, attack: 30, defense: 18, speed: 24, magic: 18 }
          }
        ]
      },

      // 上古凶兽 - 特殊SSS级（负面传说）
      ancient_fiends: {
        keywords: ['饕餮', '混沌', '穷奇', '梼杌', '魑魅', '魍魉', '夜叉', '罗刹'],
        types: [
          {
            name: '贪婪饕餮',
            species: '饕餮',
            element: 'chaos',
            rarity: 'SSS',
            description: '上古四凶之一，贪得无厌的凶兽，能吞噬一切，但可被驯化',
            personality: '贪婪但忠诚，一旦认主便绝不背叛',
            baseStats: { hp: 220, attack: 55, defense: 40, speed: 25, magic: 40 }
          },
          {
            name: '无序混沌',
            species: '混沌',
            element: 'void',
            rarity: 'SSS',
            description: '无形无状的混沌之兽，代表着原始的无序力量',
            personality: '难以理解，但蕴含着创造与毁灭的双重力量',
            baseStats: { hp: 200, attack: 45, defense: 35, speed: 30, magic: 70 }
          }
        ]
      }
    };
  }

  /**
   * 根据用户输入匹配最合适的宠物类型
   */
  matchPetType(userInput) {
    const input = userInput.toLowerCase().trim();
    
    // 计算每个类别的匹配度
    let bestMatch = null;
    let bestScore = 0;
    let matchedCategory = null;

    for (const [category, data] of Object.entries(this.petDatabase)) {
      const score = this.calculateMatchScore(input, data.keywords);
      if (score > bestScore) {
        bestScore = score;
        matchedCategory = category;
      }
    }

    // 如果找到匹配，随机选择该类别中的一个宠物
    if (matchedCategory && bestScore > 0) {
      const categoryData = this.petDatabase[matchedCategory];
      const randomPet = categoryData.types[Math.floor(Math.random() * categoryData.types.length)];
      
      return {
        ...randomPet,
        matchScore: bestScore,
        matchedKeywords: this.getMatchedKeywords(input, categoryData.keywords),
        category: matchedCategory
      };
    }

    // 如果没有找到匹配，返回一个通用的神秘生物
    return this.createMysteriousPet(userInput);
  }

  /**
   * 计算匹配分数
   */
  calculateMatchScore(input, keywords) {
    let score = 0;
    
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        // 完全匹配得分更高
        if (input === keyword) {
          score += 10;
        } else {
          score += keyword.length; // 关键词越长，匹配度越高
        }
      }
    }
    
    return score;
  }

  /**
   * 获取匹配的关键词
   */
  getMatchedKeywords(input, keywords) {
    return keywords.filter(keyword => input.includes(keyword));
  }

  /**
   * 创建神秘宠物（当没有匹配时）
   */
  createMysteriousPet(userInput) {
    const mysteriousTypes = [
      {
        name: '神秘精灵',
        species: '未知精灵',
        element: 'mystery',
        description: `一只神秘的生物，似乎与"${userInput}"有着某种联系，它的真实身份还有待探索`,
        personality: '神秘而好奇，对世界充满探索欲',
        baseStats: { hp: 60, attack: 15, defense: 12, speed: 18, magic: 25 }
      },
      {
        name: '幻想生物',
        species: '幻想种',
        element: 'dream',
        description: `从梦境中诞生的奇妙生物，承载着对"${userInput}"的美好想象`,
        personality: '梦幻而温柔，喜欢创造美好的幻象',
        baseStats: { hp: 55, attack: 12, defense: 15, speed: 20, magic: 28 }
      },
      {
        name: '星辰之子',
        species: '星辰种',
        element: 'cosmic',
        description: `来自遥远星系的神秘生命，似乎在寻找与"${userInput}"相关的某种力量`,
        personality: '智慧而超然，拥有超越常理的思维',
        baseStats: { hp: 70, attack: 18, defense: 10, speed: 22, magic: 30 }
      }
    ];

    const randomMystery = mysteriousTypes[Math.floor(Math.random() * mysteriousTypes.length)];
    
    return {
      ...randomMystery,
      matchScore: 1, // 最低匹配分数
      matchedKeywords: [],
      category: 'mystery',
      userInput: userInput
    };
  }

  /**
   * 获取稀有度颜色信息
   */
  getRarityColor(rarity) {
    return this.rarityColors[rarity] || this.rarityColors['N'];
  }

  /**
   * 获取所有可用的宠物类型（按稀有度排序）
   */
  getAllPetTypes() {
    const allTypes = [];
    
    for (const [category, data] of Object.entries(this.petDatabase)) {
      for (const pet of data.types) {
        allTypes.push({
          ...pet,
          category: category,
          keywords: data.keywords,
          rarity: pet.rarity || 'N'
        });
      }
    }
    
    // 按稀有度排序：SSS > SSR > SR > R > N
    const rarityOrder = { 'SSS': 5, 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };
    return allTypes.sort((a, b) => {
      const rarityA = rarityOrder[a.rarity || 'N'];
      const rarityB = rarityOrder[b.rarity || 'N'];
      return rarityB - rarityA;
    });
  }

  /**
   * 根据稀有度获取宠物类型
   */
  getPetsByRarity(rarity) {
    const allTypes = this.getAllPetTypes();
    return allTypes.filter(pet => (pet.rarity || 'N') === rarity);
  }

  /**
   * 随机获取指定稀有度的宠物
   */
  getRandomPetByRarity(rarity) {
    const pets = this.getPetsByRarity(rarity);
    if (pets.length === 0) return null;
    return pets[Math.floor(Math.random() * pets.length)];
  }

  /**
   * 稀有度抽取概率
   */
  rollRarity() {
    const rand = Math.random();
    if (rand < 0.001) return 'SSS';  // 0.1% 传说
    if (rand < 0.01) return 'SSR';   // 0.9% 极稀有
    if (rand < 0.05) return 'SR';    // 4% 超稀有
    if (rand < 0.20) return 'R';     // 15% 稀有
    return 'N';                      // 80% 普通
  }

  /**
   * 根据元素类型获取宠物
   */
  getPetsByElement(element) {
    const pets = [];
    
    for (const [category, data] of Object.entries(this.petDatabase)) {
      for (const pet of data.types) {
        if (pet.element === element) {
          pets.push({
            ...pet,
            category: category
          });
        }
      }
    }
    
    return pets;
  }

  /**
   * 获取推荐的关键词
   */
  getSuggestedKeywords() {
    const suggestions = [];
    
    for (const [category, data] of Object.entries(this.petDatabase)) {
      suggestions.push({
        category: category,
        keywords: data.keywords.slice(0, 5), // 只取前5个关键词
        description: this.getCategoryDescription(category)
      });
    }
    
    return suggestions;
  }

  /**
   * 获取类别描述
   */
  getCategoryDescription(category) {
    const descriptions = {
      cats: '优雅的猫科生物，敏捷而神秘',
      dogs: '忠诚的犬科伙伴，勇敢而可靠',
      birds: '自由的天空之子，轻盈而高贵',
      dragons: '强大的龙族后裔，威严而智慧',
      mythical: '传说中的神话生物，神圣而稀有',
      cute: '可爱的小动物，温柔而治愈',
      marine: '神秘的海洋生物，深邃而优雅'
    };
    
    return descriptions[category] || '神秘的未知生物';
  }
}

module.exports = PetTypematcher;