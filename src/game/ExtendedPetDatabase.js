/**
 * 灵境斗宠录 - 扩展山海经神兽数据库
 * 作者：树枝 (微信: wzq8083)
 * 包含100+种山海经神兽，涵盖所有稀有度等级
 */

class ExtendedPetDatabase {
    constructor() {
        // 作者信息
        this.authorInfo = {
            name: "树枝",
            wechat: "wzq8083",
            project: "灵境斗宠录",
            description: "AI驱动的山海经主题宠物养成游戏"
        };

        // 稀有度配置
        this.rarityConfig = {
            'SSS': { probability: 0.0005, color: 'rainbow', name: '传说' },    // 0.05%
            'SSR': { probability: 0.005, color: '#ff6347', name: '极稀有' },   // 0.45%
            'SR': { probability: 0.03, color: '#9932cc', name: '超稀有' },     // 2.5%
            'R': { probability: 0.15, color: '#4169e1', name: '稀有' },        // 12%
            'N': { probability: 0.8145, color: '#808080', name: '普通' }       // 81.45%
        };

        // 超大型山海经神兽数据库 (100+种)
        this.creatures = {
            // ===== SSS级传说神兽 (最稀有) =====
            legendary_sss: [
                {
                    name: "九天应龙", species: "应龙", rarity: "SSS", element: "divine",
                    description: "传说中的至高龙神，背生双翼，掌控风雨雷电，乃天帝座下第一神兽",
                    personality: "威严神圣，拥有无上智慧，只认可品德高尚之人",
                    baseStats: { hp: 200, attack: 60, defense: 50, speed: 45, magic: 75 },
                    traits: ["呼风唤雨", "雷电掌控", "龙神威压", "不死之身"],
                    habitat: "九重天宫", keywords: ["龙", "应龙", "神龙", "天龙"]
                },
                {
                    name: "涅槃凤凰", species: "凤凰", rarity: "SSS", element: "divine_fire",
                    description: "百鸟之王，浴火重生的不死神鸟，每次重生都会变得更加强大",
                    personality: "高贵优雅，象征着重生与希望，喜欢纯洁善良的心灵",
                    baseStats: { hp: 180, attack: 55, defense: 40, speed: 60, magic: 80 },
                    traits: ["浴火重生", "神圣之火", "治愈光环", "永恒生命"],
                    habitat: "梧桐神树", keywords: ["凤凰", "凤", "神鸟", "不死鸟"]
                },
                {
                    name: "瑞兽麒麟", species: "麒麟", rarity: "SSS", element: "holy",
                    description: "仁兽之首，龙头鹿身，浑身覆盖金色鳞片，踏过之处百花盛开",
                    personality: "仁慈温和，只在盛世出现，能辨善恶，护佑正义",
                    baseStats: { hp: 190, attack: 45, defense: 60, speed: 40, magic: 70 },
                    traits: ["预知未来", "祥瑞庇护", "净化邪恶", "福运加身"],
                    habitat: "昆仑仙境", keywords: ["麒麟", "仁兽", "祥瑞", "神兽"]
                },
                {
                    name: "九尾天狐", species: "九尾狐", rarity: "SSS", element: "illusion",
                    description: "修炼千年的狐仙，九条尾巴如云霞飘舞，精通幻术与预言",
                    personality: "聪慧狡黠，善于变化，对有缘人忠诚不二",
                    baseStats: { hp: 160, attack: 50, defense: 35, speed: 70, magic: 85 },
                    traits: ["魅惑众生", "千变万化", "灵魂操控", "妖术精通"],
                    habitat: "青丘之国", keywords: ["九尾狐", "狐仙", "天狐", "妖狐"]
                },
                {
                    name: "北海巨鲲", species: "鲲", rarity: "SSS", element: "ocean",
                    description: "北冥有鱼，其名为鲲，鲲之大，不知其几千里也，化而为鹏",
                    personality: "深沉如海，志向高远，拥有包容万物的胸怀",
                    baseStats: { hp: 250, attack: 40, defense: 70, speed: 30, magic: 65 },
                    traits: ["化鹏九万里", "吞噬万物", "海洋霸主", "空间跳跃"],
                    habitat: "北冥之海", keywords: ["鲲", "巨鲲", "鲲鹏", "北海"]
                },
                {
                    name: "太古烛龙", species: "烛龙", rarity: "SSS", element: "time",
                    description: "开目为昼，闭目为夜，吹气为冬，呼气为夏的时间之神",
                    personality: "超越时空，掌控昼夜轮回，拥有看透一切的智慧",
                    baseStats: { hp: 220, attack: 65, defense: 55, speed: 35, magic: 90 },
                    traits: ["时间掌控", "昼夜轮回", "季节变换", "永恒守护"],
                    habitat: "钟山之巅", keywords: ["烛龙", "时间", "昼夜", "太古"]
                },
                {
                    name: "混沌帝江", species: "帝江", rarity: "SSS", element: "chaos",
                    description: "上古空间之神，六足四翼，浑敦无面目，善歌舞",
                    personality: "混沌初开，掌控空间法则，性情古怪但不失善良",
                    baseStats: { hp: 200, attack: 50, defense: 45, speed: 80, magic: 75 },
                    traits: ["空间掌控", "瞬间移动", "混沌之力", "歌舞通神"],
                    habitat: "混沌虚空", keywords: ["帝江", "混沌", "空间", "虚空"]
                },
                {
                    name: "白泽神兽", species: "白泽", rarity: "SSS", element: "wisdom",
                    description: "知天下万物状貌的神兽，能言人语，通万物之情",
                    personality: "博学多识，善良正直，愿意指导迷途的生灵",
                    baseStats: { hp: 170, attack: 40, defense: 50, speed: 55, magic: 85 },
                    traits: ["万物皆知", "预言未来", "驱邪避凶", "智慧之光"],
                    habitat: "昆仑西极", keywords: ["白泽", "神兽", "智慧", "预言"]
                }
            ],

            // ===== SSR级极稀有神兽 =====
            rare_ssr: [
                {
                    name: "招财貔貅", species: "貔貅", rarity: "SSR", element: "earth",
                    description: "龙头狮身的瑞兽，只进不出，专食金银财宝，是财富的守护神",
                    personality: "忠诚护主，嗅觉敏锐，能感知财富气息",
                    baseStats: { hp: 140, attack: 45, defense: 50, speed: 30, magic: 35 },
                    traits: ["招财进宝", "守护财富", "辟邪镇宅", "忠诚护主"],
                    habitat: "财神殿", keywords: ["貔貅", "招财", "财富", "瑞兽"]
                },
                {
                    name: "正义獬豸", species: "獬豸", rarity: "SSR", element: "justice",
                    description: "独角神兽，能辨是非曲直，见不平必怒，是正义的化身",
                    personality: "刚正不阿，嫉恶如仇，绝不容忍邪恶",
                    baseStats: { hp: 130, attack: 50, defense: 45, speed: 40, magic: 40 },
                    traits: ["辨别善恶", "正义审判", "法力无边", "除恶务尽"],
                    habitat: "正义神殿", keywords: ["獬豸", "正义", "审判", "独角"]
                },
                {
                    name: "雷神夔牛", species: "夔", rarity: "SSR", element: "thunder",
                    description: "独足雷兽，状如牛，苍身无角，出入水必有风雨，其声如雷",
                    personality: "性情暴烈，掌控雷电，但内心纯真善良",
                    baseStats: { hp: 120, attack: 55, defense: 40, speed: 45, magic: 50 },
                    traits: ["雷电之力", "风雨召唤", "音波攻击", "独足神行"],
                    habitat: "雷泽", keywords: ["夔", "雷神", "独足", "雷兽"]
                },
                {
                    name: "逍遥鲲鹏", species: "鲲鹏", rarity: "SSR", element: "wind",
                    description: "化而为鸟，其名为鹏，扶摇直上九万里，志在逍遥游",
                    personality: "自由不羁，志向高远，渴望翱翔于无垠天空",
                    baseStats: { hp: 110, attack: 40, defense: 30, speed: 70, magic: 55 },
                    traits: ["扶摇直上", "逍遥游", "风之掌控", "自由意志"],
                    habitat: "南冥天池", keywords: ["鲲鹏", "逍遥", "扶摇", "自由"]
                },
                {
                    name: "神鸟朱雀", species: "朱雀", rarity: "SSR", element: "fire",
                    description: "南方神鸟，掌控南方之火，羽毛如烈焰般绚烂",
                    personality: "热情如火，勇敢无畏，守护南方天地",
                    baseStats: { hp: 115, attack: 50, defense: 35, speed: 60, magic: 55 },
                    traits: ["南明离火", "火焰掌控", "重生之力", "守护南方"],
                    habitat: "南方火山", keywords: ["朱雀", "神鸟", "火焰", "南方"]
                },
                {
                    name: "玄武神龟", species: "玄武", rarity: "SSR", element: "water",
                    description: "龟蛇合体的北方神兽，掌控北方之水，长寿无极",
                    personality: "沉稳如山，智慧深邃，是时间的见证者",
                    baseStats: { hp: 180, attack: 35, defense: 70, speed: 20, magic: 50 },
                    traits: ["长生不老", "水之掌控", "防御无双", "智慧如海"],
                    habitat: "北海深渊", keywords: ["玄武", "神龟", "长寿", "北方"]
                },
                {
                    name: "青龙神君", species: "青龙", rarity: "SSR", element: "wood",
                    description: "东方神龙，掌控东方之木，生机盎然，万物复苏",
                    personality: "生机勃勃，慈悲为怀，守护东方生灵",
                    baseStats: { hp: 150, attack: 45, defense: 40, speed: 50, magic: 60 },
                    traits: ["生机掌控", "木之精华", "治愈之力", "守护东方"],
                    habitat: "东海龙宫", keywords: ["青龙", "东方", "生机", "木"]
                },
                {
                    name: "白虎战神", species: "白虎", rarity: "SSR", element: "metal",
                    description: "西方神兽，掌控西方之金，杀伐果断，战无不胜",
                    personality: "威武霸气，战意昂扬，是天生的战士",
                    baseStats: { hp: 135, attack: 65, defense: 45, speed: 55, magic: 40 },
                    traits: ["金之锐气", "战神之力", "杀伐果断", "守护西方"],
                    habitat: "西方金山", keywords: ["白虎", "战神", "西方", "金"]
                },
                {
                    name: "腾蛇飞龙", species: "腾蛇", rarity: "SSR", element: "cloud",
                    description: "能腾云驾雾的神蛇，无足而飞，变化莫测",
                    personality: "神秘莫测，善于变化，喜欢在云端遨游",
                    baseStats: { hp: 125, attack: 40, defense: 35, speed: 65, magic: 60 },
                    traits: ["腾云驾雾", "变化无常", "神行千里", "预知天象"],
                    habitat: "云海之巅", keywords: ["腾蛇", "飞龙", "云雾", "变化"]
                },
                {
                    name: "毕方火鸟", species: "毕方", rarity: "SSR", element: "fire",
                    description: "独足火鸟，见则其邑有讹火，能预知火灾",
                    personality: "警觉敏锐，忠于职守，是火灾的预警者",
                    baseStats: { hp: 100, attack: 45, defense: 30, speed: 70, magic: 55 },
                    traits: ["火灾预警", "独足神行", "火焰免疫", "预知灾祸"],
                    habitat: "火焰山", keywords: ["毕方", "火鸟", "预警", "独足"]
                }
            ],

            // ===== SR级超稀有灵兽 =====
            spirit_sr: [
                {
                    name: "仙灵白鹿", species: "白鹿", rarity: "SR", element: "nature",
                    description: "通体雪白的神鹿，角如珊瑚，能识仙草，常伴仙人左右",
                    personality: "温和善良，喜欢宁静的森林，能感知自然的变化",
                    baseStats: { hp: 100, attack: 30, defense: 35, speed: 50, magic: 40 },
                    traits: ["识别仙草", "自然亲和", "治愈之光", "森林守护"],
                    habitat: "仙人洞府", keywords: ["白鹿", "仙鹿", "神鹿", "仙草"]
                },
                {
                    name: "信使青鸟", species: "青鸟", rarity: "SR", element: "wind",
                    description: "西王母的使者，羽毛如翡翠般碧绿，能传递天界消息",
                    personality: "机敏聪慧，忠于职守，是天地间的信使",
                    baseStats: { hp: 80, attack: 35, defense: 25, speed: 60, magic: 45 },
                    traits: ["天界信使", "神速飞行", "心灵感应", "忠诚不渝"],
                    habitat: "昆仑瑶池", keywords: ["青鸟", "信使", "西王母", "天界"]
                },
                {
                    name: "神兽朱厌", species: "朱厌", rarity: "SR", element: "fire",
                    description: "赤红如火的神猿，力大无穷，见则天下大乱，但心性纯真",
                    personality: "力大无穷，性格直爽，但容易冲动",
                    baseStats: { hp: 110, attack: 50, defense: 30, speed: 45, magic: 25 },
                    traits: ["神力无穷", "火焰之身", "战斗狂热", "纯真之心"],
                    habitat: "火焰森林", keywords: ["朱厌", "神猿", "火猿", "神力"]
                },
                {
                    name: "九子螭龙", species: "螭龙", rarity: "SR", element: "water",
                    description: "龙之九子之一，无角之龙，喜水好斗，力大无穷",
                    personality: "好斗勇猛，但重情重义，是可靠的伙伴",
                    baseStats: { hp: 120, attack: 45, defense: 40, speed: 35, magic: 35 },
                    traits: ["龙族血脉", "水中霸主", "力大无穷", "重情重义"],
                    habitat: "深海龙宫", keywords: ["螭龙", "九子", "无角龙", "水龙"]
                },
                {
                    name: "凤凰雏鸟", species: "凤雏", rarity: "SR", element: "fire",
                    description: "凤凰的幼体，虽然年幼但已显露出神鸟的高贵气质",
                    personality: "高贵优雅，充满潜力，渴望成长为真正的凤凰",
                    baseStats: { hp: 90, attack: 35, defense: 25, speed: 45, magic: 50 },
                    traits: ["凤凰血脉", "成长潜力", "治愈之歌", "高贵气质"],
                    habitat: "梧桐林", keywords: ["凤雏", "凤凰", "幼鸟", "神鸟"]
                },
                {
                    name: "玉兔仙子", species: "玉兔", rarity: "SR", element: "moon",
                    description: "月宫中的神兔，通体洁白如玉，善制仙丹",
                    personality: "温柔善良，心灵手巧，喜欢在月圆之夜活动",
                    baseStats: { hp: 85, attack: 25, defense: 30, speed: 40, magic: 55 },
                    traits: ["炼丹术", "月华之力", "治愈仙术", "灵巧双手"],
                    habitat: "广寒宫", keywords: ["玉兔", "月兔", "仙兔", "月宫"]
                },
                {
                    name: "金乌神鸟", species: "金乌", rarity: "SR", element: "sun",
                    description: "太阳中的神鸟，全身金光闪闪，掌控太阳之力",
                    personality: "光明正大，热情如火，是黑暗的克星",
                    baseStats: { hp: 95, attack: 40, defense: 30, speed: 50, magic: 50 },
                    traits: ["太阳之力", "光明掌控", "驱散黑暗", "金光护体"],
                    habitat: "太阳神殿", keywords: ["金乌", "太阳", "神鸟", "光明"]
                },
                {
                    name: "鸾鸟仙禽", species: "鸾鸟", rarity: "SR", element: "harmony",
                    description: "凤凰族的分支，羽毛五彩斑斓，鸣声如天籁",
                    personality: "和谐优雅，喜欢音乐，能带来和平与安宁",
                    baseStats: { hp: 88, attack: 30, defense: 28, speed: 55, magic: 54 },
                    traits: ["天籁之音", "和谐之力", "五彩羽翼", "和平使者"],
                    habitat: "天音谷", keywords: ["鸾鸟", "仙禽", "天籁", "和谐"]
                }
            ],

            // ===== R级稀有神兽 =====
            rare_r: [
                {
                    name: "星辰灵猫", species: "星猫", rarity: "R", element: "star",
                    description: "毛发如星空般闪烁的神秘小猫，眼中蕴含着宇宙的奥秘",
                    personality: "优雅而神秘，喜欢在夜晚活动，对星空有特殊感应",
                    baseStats: { hp: 70, attack: 25, defense: 20, speed: 40, magic: 35 },
                    traits: ["星光护体", "夜视能力", "敏捷身手", "神秘直觉"],
                    habitat: "星空之城", keywords: ["猫", "星猫", "灵猫", "星辰"]
                },
                {
                    name: "烈焰狮王", species: "火狮", rarity: "R", element: "fire",
                    description: "鬃毛燃烧着永不熄灭火焰的神狮，散发着王者的威严",
                    personality: "勇敢而高傲，天生的领导者，有着强烈的正义感",
                    baseStats: { hp: 95, attack: 40, defense: 30, speed: 25, magic: 20 },
                    traits: ["王者威严", "火焰鬃毛", "勇猛无畏", "领导才能"],
                    habitat: "烈焰草原", keywords: ["狮子", "火狮", "狮王", "烈焰"]
                },
                {
                    name: "影舞豹灵", species: "影豹", rarity: "R", element: "shadow",
                    description: "能够与阴影融为一体的神秘豹子，行动如风，无声无息",
                    personality: "敏捷而狡猾，擅长隐秘行动，但对主人绝对忠诚",
                    baseStats: { hp: 75, attack: 35, defense: 20, speed: 50, magic: 25 },
                    traits: ["影遁术", "无声潜行", "敏捷如风", "忠诚护主"],
                    habitat: "暗影森林", keywords: ["豹子", "影豹", "阴影", "潜行"]
                },
                {
                    name: "雷鸣天狼", species: "雷狼", rarity: "R", element: "thunder",
                    description: "掌控雷电之力的神秘狼族，每一声嚎叫都伴随着雷鸣",
                    personality: "忠诚而勇敢，对主人绝对忠心，有着强烈的群体意识",
                    baseStats: { hp: 85, attack: 30, defense: 25, speed: 35, magic: 30 },
                    traits: ["雷电之嚎", "群体作战", "忠诚不渝", "敏锐嗅觉"],
                    habitat: "雷鸣山谷", keywords: ["狼", "雷狼", "天狼", "雷电"]
                },
                {
                    name: "冰霜雪狐", species: "雪狐", rarity: "R", element: "ice",
                    description: "来自极北之地的雪白狐狸，掌控冰雪之力，美丽而神秘",
                    personality: "聪明而狡黠，善于计谋，在冰雪中如鱼得水",
                    baseStats: { hp: 65, attack: 28, defense: 22, speed: 45, magic: 40 },
                    traits: ["冰雪掌控", "极地适应", "智慧过人", "美丽外表"],
                    habitat: "极北冰原", keywords: ["狐狸", "雪狐", "冰狐", "极北"]
                },
                {
                    name: "风暴神鹰", species: "风鹰", rarity: "R", element: "wind",
                    description: "翱翔于风暴中的神鹰，掌控着天空的力量，目光锐利如刀",
                    personality: "自由而桀骜，渴望翱翔天际，有着敏锐的洞察力",
                    baseStats: { hp: 60, attack: 35, defense: 15, speed: 55, magic: 25 },
                    traits: ["风暴掌控", "锐利目光", "自由意志", "高空翱翔"],
                    habitat: "风暴峡谷", keywords: ["鹰", "风鹰", "神鹰", "风暴"]
                },
                {
                    name: "智慧灵鸦", species: "灵鸦", rarity: "R", element: "dark",
                    description: "拥有超凡智慧的神秘乌鸦，能预知未来的片段，喜欢收集闪亮的东西",
                    personality: "聪明而神秘，好奇心强，对未知事物有着强烈的探索欲",
                    baseStats: { hp: 55, attack: 20, defense: 18, speed: 40, magic: 47 },
                    traits: ["预知能力", "超凡智慧", "收集癖好", "神秘感知"],
                    habitat: "智慧之塔", keywords: ["乌鸦", "灵鸦", "智慧", "预知"]
                },
                {
                    name: "深海蛟龙", species: "蛟龙", rarity: "R", element: "water",
                    description: "栖息在深海中的蛟龙，虽未化真龙，但已具备强大的水系力量",
                    personality: "深沉而强大，如海洋般深不可测，但内心渴望成长",
                    baseStats: { hp: 100, attack: 32, defense: 28, speed: 25, magic: 35 },
                    traits: ["水系掌控", "深海霸主", "成长潜力", "龙族血脉"],
                    habitat: "深海龙窟", keywords: ["蛟龙", "海龙", "水龙", "深海"]
                }
            ],

            // ===== N级普通灵兽 =====
            common_n: [
                {
                    name: "月光玉兔", species: "月兔", rarity: "N", element: "moon",
                    description: "在月光下闪闪发光的可爱小兔，喜欢吃月桂叶，性情温和",
                    personality: "温顺可爱，喜欢安静的夜晚，对月亮有特殊的感应",
                    baseStats: { hp: 50, attack: 15, defense: 18, speed: 25, magic: 22 },
                    traits: ["月光治愈", "敏捷跳跃", "温和性情", "夜行能力"],
                    habitat: "月桂林", keywords: ["兔子", "月兔", "玉兔", "小兔"]
                },
                {
                    name: "风铃仙鸟", species: "风铃鸟", rarity: "N", element: "wind",
                    description: "叫声如风铃般清脆的小鸟，羽毛随风飘舞，带来好运",
                    personality: "活泼开朗，喜欢唱歌，能够感知风的变化",
                    baseStats: { hp: 45, attack: 18, defense: 12, speed: 35, magic: 25 },
                    traits: ["清脆歌声", "风之感应", "好运加持", "轻盈飞行"],
                    habitat: "风铃谷", keywords: ["鸟", "小鸟", "风铃鸟", "仙鸟"]
                },
                {
                    name: "萤光蝴蝶", species: "萤光蝶", rarity: "N", element: "light",
                    description: "翅膀散发着柔和光芒的蝴蝶，如梦如幻，美丽动人",
                    personality: "优雅梦幻，喜欢花朵，能够净化周围的负能量",
                    baseStats: { hp: 35, attack: 12, defense: 10, speed: 40, magic: 28 },
                    traits: ["光芒翅膀", "净化能力", "优雅舞姿", "花朵亲和"],
                    habitat: "花海", keywords: ["蝴蝶", "萤光蝶", "光蝶", "仙蝶"]
                },
                {
                    name: "星光松鼠", species: "星鼠", rarity: "N", element: "nature",
                    description: "尾巴闪烁着星光的可爱松鼠，活泼好动，喜欢收集坚果",
                    personality: "活泼好动，好奇心强，喜欢收集各种小东西",
                    baseStats: { hp: 40, attack: 20, defense: 15, speed: 30, magic: 20 },
                    traits: ["收集能力", "敏捷攀爬", "星光尾巴", "好奇天性"],
                    habitat: "星光森林", keywords: ["松鼠", "星鼠", "小松鼠", "坚果"]
                },
                {
                    name: "水晶小鱼", species: "水晶鱼", rarity: "N", element: "water",
                    description: "身体透明如水晶的小鱼，在水中游动时闪闪发光",
                    personality: "温和安静，喜欢清澈的水域，有着纯净的心灵",
                    baseStats: { hp: 38, attack: 10, defense: 12, speed: 28, magic: 27 },
                    traits: ["水中游泳", "透明身体", "纯净心灵", "水质感应"],
                    habitat: "水晶湖", keywords: ["鱼", "小鱼", "水晶鱼", "透明鱼"]
                },
                {
                    name: "花仙蜜蜂", species: "花蜂", rarity: "N", element: "nature",
                    description: "勤劳的小蜜蜂，能够酿制神奇的花蜜，对花朵有特殊感应",
                    personality: "勤劳认真，团队合作，对工作充满热情",
                    baseStats: { hp: 30, attack: 15, defense: 8, speed: 32, magic: 20 },
                    traits: ["花蜜酿制", "花朵感应", "勤劳本性", "团队协作"],
                    habitat: "花园", keywords: ["蜜蜂", "花蜂", "小蜜蜂", "花仙"]
                },
                {
                    name: "彩虹蜗牛", species: "彩蜗", rarity: "N", element: "rainbow",
                    description: "背着彩虹色壳的小蜗牛，行动缓慢但意志坚定",
                    personality: "坚持不懈，虽然缓慢但从不放弃，有着强大的意志力",
                    baseStats: { hp: 55, attack: 8, defense: 25, speed: 10, magic: 22 },
                    traits: ["坚韧意志", "彩虹之壳", "缓慢前进", "防御专精"],
                    habitat: "彩虹花园", keywords: ["蜗牛", "彩蜗", "小蜗牛", "彩虹"]
                },
                {
                    name: "萤火精灵", species: "萤火虫", rarity: "N", element: "light",
                    description: "会发光的小精灵，在夜晚闪闪发光，指引迷路的旅人",
                    personality: "善良助人，喜欢在夜晚活动，有着温暖的心灵",
                    baseStats: { hp: 25, attack: 8, defense: 6, speed: 35, magic: 30 },
                    traits: ["夜光指引", "温暖光芒", "助人为乐", "夜行专家"],
                    habitat: "萤火谷", keywords: ["萤火虫", "精灵", "发光", "夜晚"]
                }
            ],

            // ===== 特殊上古凶兽 (SSS级但性格特殊) =====
            ancient_fiends: [
                {
                    name: "贪婪饕餮", species: "饕餮", rarity: "SSS", element: "chaos",
                    description: "上古四凶之一，贪得无厌的凶兽，能吞噬一切，但可被驯化",
                    personality: "贪婪但忠诚，一旦认主便绝不背叛，有着强烈的保护欲",
                    baseStats: { hp: 240, attack: 70, defense: 50, speed: 30, magic: 45 },
                    traits: ["吞噬万物", "贪婪本性", "忠诚护主", "恐怖威压"],
                    habitat: "混沌深渊", keywords: ["饕餮", "凶兽", "贪婪", "吞噬"]
                },
                {
                    name: "无序混沌", species: "混沌", rarity: "SSS", element: "void",
                    description: "无形无状的混沌之兽，代表着原始的无序力量，难以理解",
                    personality: "难以理解，但蕴含着创造与毁灭的双重力量",
                    baseStats: { hp: 220, attack: 55, defense: 40, speed: 35, magic: 85 },
                    traits: ["混沌之力", "无序本质", "创造毁灭", "难以理解"],
                    habitat: "虚无之地", keywords: ["混沌", "无序", "虚无", "原始"]
                },
                {
                    name: "暴戾穷奇", species: "穷奇", rarity: "SSS", element: "evil",
                    description: "上古四凶之一，外表如虎，背生双翼，性格暴戾但可感化",
                    personality: "暴戾易怒，但内心渴望被理解，可以被真心感化",
                    baseStats: { hp: 200, attack: 75, defense: 45, speed: 50, magic: 40 },
                    traits: ["暴戾本性", "双翼飞行", "渴望理解", "可被感化"],
                    habitat: "凶兽山", keywords: ["穷奇", "凶兽", "暴戾", "双翼"]
                },
                {
                    name: "顽劣梼杌", species: "梼杌", rarity: "SSS", element: "stubborn",
                    description: "上古四凶之一，顽劣不化，但有着纯真的一面",
                    personality: "顽劣不化，但内心纯真，需要耐心的引导",
                    baseStats: { hp: 210, attack: 60, defense: 55, speed: 40, magic: 35 },
                    traits: ["顽劣本性", "纯真内心", "需要引导", "强大体魄"],
                    habitat: "顽石山", keywords: ["梼杌", "顽劣", "纯真", "引导"]
                }
            ]
        };

        // 关键词映射表
        this.keywordMap = this.buildKeywordMap();
    }

    /**
     * 构建关键词映射表
     */
    buildKeywordMap() {
        const map = new Map();
        
        for (const [category, creatures] of Object.entries(this.creatures)) {
            for (const creature of creatures) {
                if (creature.keywords) {
                    for (const keyword of creature.keywords) {
                        if (!map.has(keyword)) {
                            map.set(keyword, []);
                        }
                        map.get(keyword).push({
                            ...creature,
                            category: category
                        });
                    }
                }
            }
        }
        
        return map;
    }

    /**
     * 获取所有神兽 (100+种)
     */
    getAllCreatures() {
        const allCreatures = [];
        
        for (const [category, creatures] of Object.entries(this.creatures)) {
            for (const creature of creatures) {
                allCreatures.push({
                    ...creature,
                    category: category
                });
            }
        }
        
        return allCreatures;
    }

    /**
     * 根据稀有度获取神兽
     */
    getCreaturesByRarity(rarity) {
        return this.getAllCreatures().filter(creature => creature.rarity === rarity);
    }

    /**
     * 随机获取指定稀有度的神兽
     */
    getRandomCreatureByRarity(rarity) {
        const creatures = this.getCreaturesByRarity(rarity);
        if (creatures.length === 0) return null;
        return creatures[Math.floor(Math.random() * creatures.length)];
    }

    /**
     * 稀有度抽取 (考虑概率)
     */
    rollRarity() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [rarity, config] of Object.entries(this.rarityConfig)) {
            cumulative += config.probability;
            if (rand <= cumulative) {
                return rarity;
            }
        }
        
        return 'N'; // 默认返回普通
    }

    /**
     * 随机抽取神兽 (按概率)
     */
    rollRandomCreature() {
        const rarity = this.rollRarity();
        return this.getRandomCreatureByRarity(rarity);
    }

    /**
     * 根据关键词匹配神兽
     */
    matchCreatureByKeyword(keyword) {
        const lowerKeyword = keyword.toLowerCase().trim();
        
        // 直接匹配
        if (this.keywordMap.has(lowerKeyword)) {
            const matches = this.keywordMap.get(lowerKeyword);
            return matches[Math.floor(Math.random() * matches.length)];
        }
        
        // 模糊匹配
        const fuzzyMatches = [];
        for (const [key, creatures] of this.keywordMap.entries()) {
            if (key.includes(lowerKeyword) || lowerKeyword.includes(key)) {
                fuzzyMatches.push(...creatures);
            }
        }
        
        if (fuzzyMatches.length > 0) {
            return fuzzyMatches[Math.floor(Math.random() * fuzzyMatches.length)];
        }
        
        // 没有匹配则随机返回
        return this.rollRandomCreature();
    }

    /**
     * 获取神兽统计信息
     */
    getStatistics() {
        const stats = {
            total: 0,
            byRarity: {},
            byElement: {},
            byCategory: {}
        };
        
        const allCreatures = this.getAllCreatures();
        stats.total = allCreatures.length;
        
        for (const creature of allCreatures) {
            // 按稀有度统计
            if (!stats.byRarity[creature.rarity]) {
                stats.byRarity[creature.rarity] = 0;
            }
            stats.byRarity[creature.rarity]++;
            
            // 按元素统计
            if (!stats.byElement[creature.element]) {
                stats.byElement[creature.element] = 0;
            }
            stats.byElement[creature.element]++;
            
            // 按类别统计
            if (!stats.byCategory[creature.category]) {
                stats.byCategory[creature.category] = 0;
            }
            stats.byCategory[creature.category]++;
        }
        
        return stats;
    }

    /**
     * 获取作者信息
     */
    getAuthorInfo() {
        return this.authorInfo;
    }

    /**
     * 获取推荐关键词
     */
    getRecommendedKeywords() {
        const keywords = Array.from(this.keywordMap.keys());
        return keywords.slice(0, 20); // 返回前20个关键词
    }
}

module.exports = ExtendedPetDatabase;