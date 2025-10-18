/**
 * 山海经世界观系统
 * 构建完整的神话世界架构
 */

class ShanHaiJingWorldView {
  constructor() {
    // 世界树层级结构
    this.worldTreeLevels = {
      天界: {
        level: 9,
        description: '九天之上，神灵居所',
        creatures: ['凤凰', '应龙', '天狗', '朱雀'],
        specialItems: ['⚡天雷珠', '🌟星辰石', '☁️云霞羽'],
        evolutionDirection: '神性觉醒'
      },
      仙境: {
        level: 7,
        description: '仙人修行之地，灵气充沛',
        creatures: ['白泽', '麒麟', '九尾狐', '鲲鹏'],
        specialItems: ['💎仙灵玉', '🌸瑶池花', '🍃长生草'],
        evolutionDirection: '仙灵化'
      },
      人间: {
        level: 5,
        description: '凡人世界，万物生息',
        creatures: ['青龙', '白虎', '朱雀', '玄武'],
        specialItems: ['🗡轩辕剑', '🛡河图洛书', '🏺昆仑镜'],
        evolutionDirection: '灵智开启'
      },
      妖域: {
        level: 3,
        description: '妖魔栖息，诡异莫测',
        creatures: ['饕餮', '穷奇', '梼杌', '混沌'],
        specialItems: ['🔮妖丹', '👹鬼面', '🌙阴月石'],
        evolutionDirection: '妖性觉醒'
      },
      幽冥: {
        level: 1,
        description: '地府深渊，亡魂归处',
        creatures: ['烛龙', '相柳', '九婴', '夔'],
        specialItems: ['💀白骨珠', '🔥幽冥火', '⚰️轮回印'],
        evolutionDirection: '冥界蜕变'
      }
    };

    // 特殊符号标记系统
    this.specialMarkers = {
      // 稀有度标记
      rarity: {
        '传说': '✦',
        '史诗': '◆',
        '稀有': '◇',
        '普通': '○'
      },
      // 属性标记
      elements: {
        '金': '⚡',
        '木': '🌿',
        '水': '💧',
        '火': '🔥',
        '土': '🗿',
        '风': '🌪️',
        '雷': '⚡',
        '冰': '❄️',
        '光': '✨',
        '暗': '🌑'
      },
      // 道具标记
      items: {
        '神器': '⚔️',
        '仙宝': '💎',
        '灵药': '🌸',
        '符咒': '📜',
        '法宝': '🔮',
        '圣物': '🏺'
      },
      // 地域标记
      regions: {
        '昆仑': '🏔️',
        '蓬莱': '🏝️',
        '瑶池': '🌊',
        '不周山': '⛰️',
        '扶桑': '🌳',
        '建木': '🌲'
      }
    };

    // 山海经生物谱系
    this.creatureGenealogy = {
      龙族: {
        祖先: '烛龙',
        分支: ['应龙', '青龙', '黄龙', '白龙', '黑龙'],
        特性: '掌控风雨雷电',
        栖息地: ['东海', '西海', '南海', '北海']
      },
      凤族: {
        祖先: '凤凰',
        分支: ['朱雀', '玄鸟', '鸑鷟', '鹓鶵'],
        特性: '涅槃重生',
        栖息地: ['梧桐', '丹穴', '昆仑']
      },
      麟族: {
        祖先: '麒麟',
        分支: ['白泽', '獬豸', '角端', '甪端'],
        特性: '仁德智慧',
        栖息地: ['仁者之国', '德行之地']
      },
      妖族: {
        祖先: '混沌',
        分支: ['饕餮', '穷奇', '梼杌', '九婴'],
        特性: '凶恶强大',
        栖息地: ['凶地', '恶水', '险山']
      }
    };
  }

  /**
   * 获取世界观契合的进化方向
   */
  getEvolutionDirection(currentLevel, element, personality) {
    const worldLevel = this.getWorldTreeLevel(currentLevel);
    const elementBonus = this.specialMarkers.elements[element] || '';
    
    const directions = {
      天界: ['神性觉醒', '天道感悟', '九天翱翔'],
      仙境: ['仙灵化', '长生不老', '羽化登仙'],
      人间: ['灵智开启', '修行悟道', '通灵化形'],
      妖域: ['妖性觉醒', '凶性大发', '妖王之路'],
      幽冥: ['冥界蜕变', '亡魂超度', '轮回重生']
    };

    return directions[worldLevel] || ['自然成长'];
  }

  /**
   * 获取当前所在世界树层级
   */
  getWorldTreeLevel(level) {
    if (level >= 80) return '天界';
    if (level >= 60) return '仙境';
    if (level >= 40) return '人间';
    if (level >= 20) return '妖域';
    return '幽冥';
  }

  /**
   * 生成山海经风格的描述
   */
  generateShanHaiJingDescription(creature, action, location) {
    const templates = [
      `${location}有兽焉，其状如${creature.baseForm}，${creature.specialFeature}，名曰${creature.name}。`,
      `东方有神兽，名${creature.name}，居于${location}，${action}时${creature.ability}。`,
      `《山海经》载：${location}之中，有灵兽${creature.name}，${creature.description}。`,
      `昔者，${creature.name}栖于${location}，${action}之际，${creature.manifestation}。`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 应用特殊标记到文本
   */
  applySpecialMarkers(text) {
    let markedText = text;

    // 应用稀有度标记
    Object.entries(this.specialMarkers.rarity).forEach(([rarity, marker]) => {
      const regex = new RegExp(`(${rarity})`, 'g');
      markedText = markedText.replace(regex, `${marker}$1${marker}`);
    });

    // 应用属性标记
    Object.entries(this.specialMarkers.elements).forEach(([element, marker]) => {
      const regex = new RegExp(`(${element}属性|${element}系|${element}灵)`, 'g');
      markedText = markedText.replace(regex, `${marker}$1`);
    });

    // 应用道具标记
    Object.entries(this.specialMarkers.items).forEach(([item, marker]) => {
      const regex = new RegExp(`(${item})`, 'g');
      markedText = markedText.replace(regex, `${marker}$1`);
    });

    // 应用地域标记
    Object.entries(this.specialMarkers.regions).forEach(([region, marker]) => {
      const regex = new RegExp(`(${region})`, 'g');
      markedText = markedText.replace(regex, `${marker}$1`);
    });

    return markedText;
  }

  /**
   * 生成新手引导剧情
   */
  generateTutorialStory() {
    return {
      title: '🌳世界树初醒',
      chapters: [
        {
          title: '混沌初开',
          content: `天地玄黄，宇宙洪荒。在那遥远的上古时代，🌳世界树建木撑起九天，连接五界。你的意识在混沌中苏醒，感受到一股古老而神秘的力量在召唤...`,
          choices: ['感受这股力量', '探索周围环境']
        },
        {
          title: '灵魂契约',
          content: `一道金光闪过，你发现自己与一只幼小的灵兽建立了深深的羁绊。这是来自🏔️昆仑山的神秘生灵，它的眼中闪烁着智慧的光芒。`,
          choices: ['与它对话', '观察它的特征']
        },
        {
          title: '世界树的指引',
          content: `🌳世界树的枝叶轻摆，传来古老的声音："年轻的御灵师，你的旅程即将开始。从幽冥到天界，五个世界等待着你和你的伙伴去探索..."`,
          choices: ['接受指引', '询问更多']
        }
      ]
    };
  }

  /**
   * 获取世界观提示词模板
   */
  getWorldViewPrompts() {
    return {
      evolution: `请基于《山海经》世界观生成进化描述。要求：
1. 使用古典文言文风格
2. 融入世界树层级概念
3. 体现神话生物特征
4. 包含特殊符号标记
5. 契合五行属性设定`,

      story: `请生成山海经风格的剧情文本。要求：
1. 采用"东方有兽焉"的经典句式
2. 融入昆仑、蓬莱等神话地名
3. 体现灵兽的神异特征
4. 使用特殊符号标记重要元素
5. 保持神秘而庄重的氛围`,

      dialogue: `请生成符合山海经世界观的对话。要求：
1. 体现古代神话色彩
2. 使用雅致的古典用词
3. 融入五行、阴阳等概念
4. 体现灵兽的智慧和灵性
5. 保持世界观的一致性`
    };
  }
}

module.exports = ShanHaiJingWorldView;