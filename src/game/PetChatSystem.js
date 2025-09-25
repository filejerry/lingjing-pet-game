/**
 * 宠物聊天系统 - 根据宠物等级和特性提供不同的对话能力
 */

class PetChatSystem {
  constructor(database, aiService) {
    this.database = database;
    this.aiService = aiService;
    
    // 定义不同阶段的语言能力
    this.speechLevels = {
      0: { // 幼体期 - 只会语气词
        name: '幼体期',
        vocabulary: ['呜呜', '嗷嗷', '咕咕', '嘤嘤', '哼哼', '嗯嗯', '啊啊', '呀呀'],
        canRespond: false,
        maxLength: 1
      },
      1: { // 觉醒期 - 简单词汇
        name: '觉醒期',
        vocabulary: ['饿了', '开心', '累了', '想玩', '好奇', '害怕', '喜欢', '不要'],
        canRespond: true,
        maxLength: 2
      },
      2: { // 成长期 - 短句表达
        name: '成长期',
        vocabulary: ['我饿了', '我想玩', '这是什么', '好好玩', '我喜欢你', '不要走', '陪我玩'],
        canRespond: true,
        maxLength: 4
      },
      3: { // 智慧期 - 完整对话
        name: '智慧期',
        vocabulary: ['主人，我想和你聊天', '今天的探险真有趣', '我感觉自己变强了', '你觉得我怎么样'],
        canRespond: true,
        maxLength: 10
      },
      4: { // 神话期 - 深度交流
        name: '神话期',
        vocabulary: ['吾已觉醒神话血脉', '此界奥秘，吾略有所悟', '主人，愿与汝共探天地玄机'],
        canRespond: true,
        maxLength: 20,
        useAI: true
      }
    };
  }

  /**
   * 计算宠物的语言等级
   */
  calculateSpeechLevel(pet) {
    let level = 0;
    
    // 基于等级
    if (pet.level >= 20) level = 4;
    else if (pet.level >= 15) level = 3;
    else if (pet.level >= 8) level = 2;
    else if (pet.level >= 3) level = 1;
    else level = 0;
    
    // 稀有度加成
    const rarityBonus = {
      'N': 0,
      'R': 0,
      'SR': 1,
      'SSR': 1,
      'SSS': 2
    };
    
    level = Math.min(4, level + (rarityBonus[pet.rarity] || 0));
    
    // 神话血统加成
    if (pet.mythology_type && level < 4) {
      level = Math.min(4, level + 1);
    }
    
    return level;
  }

  /**
   * 宠物主动说话
   */
  async generatePetSpeech(pet, context = 'idle') {
    const speechLevel = this.calculateSpeechLevel(pet);
    const levelData = this.speechLevels[speechLevel];
    
    if (speechLevel === 0) {
      // 幼体期只会语气词
      const sounds = levelData.vocabulary;
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      return {
        text: randomSound,
        level: speechLevel,
        levelName: levelData.name,
        context: '发出了可爱的声音'
      };
    }
    
    if (speechLevel >= 4 && levelData.useAI && this.aiService) {
      // 神话期使用AI生成对话
      try {
        const response = await this.generateAISpeech(pet, context);
        return {
          text: response,
          level: speechLevel,
          levelName: levelData.name,
          context: '以神话生物的智慧与你交流'
        };
      } catch (error) {
        console.warn('AI对话生成失败，使用预设对话:', error.message);
      }
    }
    
    // 使用预设词汇
    const vocabulary = levelData.vocabulary;
    let speech = '';
    
    if (context === 'after_feed') {
      const feedResponses = this.getFeedResponses(speechLevel);
      speech = feedResponses[Math.floor(Math.random() * feedResponses.length)];
    } else if (context === 'after_explore') {
      const exploreResponses = this.getExploreResponses(speechLevel);
      speech = exploreResponses[Math.floor(Math.random() * exploreResponses.length)];
    } else if (context === 'after_battle') {
      const battleResponses = this.getBattleResponses(speechLevel);
      speech = battleResponses[Math.floor(Math.random() * battleResponses.length)];
    } else {
      // 随机日常对话
      speech = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    }
    
    return {
      text: speech,
      level: speechLevel,
      levelName: levelData.name,
      context: this.getContextDescription(context)
    };
  }

  /**
   * 宠物回应玩家的话
   */
  async respondToPLayer(pet, playerMessage) {
    const speechLevel = this.calculateSpeechLevel(pet);
    const levelData = this.speechLevels[speechLevel];
    
    if (!levelData.canRespond) {
      // 不能回应，只能发出声音
      const sounds = levelData.vocabulary;
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      return {
        text: randomSound,
        level: speechLevel,
        levelName: levelData.name,
        context: '似乎听不懂你的话，只是发出了声音'
      };
    }
    
    if (speechLevel >= 4 && levelData.useAI && this.aiService) {
      // 神话期使用AI回应
      try {
        const response = await this.generateAIResponse(pet, playerMessage);
        return {
          text: response,
          level: speechLevel,
          levelName: levelData.name,
          context: '认真思考后回应了你'
        };
      } catch (error) {
        console.warn('AI回应生成失败，使用预设回应:', error.message);
      }
    }
    
    // 基于关键词的简单回应
    const response = this.generateKeywordResponse(pet, playerMessage, speechLevel);
    
    return {
      text: response,
      level: speechLevel,
      levelName: levelData.name,
      context: '努力理解你的话并回应'
    };
  }

  /**
   * 使用AI生成神话期对话
   */
  async generateAISpeech(pet, context) {
    const prompt = `你是一只名为"${pet.name}"的神话级灵宠，稀有度为${pet.rarity}，拥有${pet.mythology_type || '神秘'}血脉。
你的属性：生命${pet.hp}，攻击${pet.attack}，防御${pet.defense}，速度${pet.speed}，魔法${pet.magic}。
当前情境：${context}

请以这只神话灵宠的身份，用古雅而智慧的语言说一句话（不超过30字）。要体现出神话生物的威严和智慧。`;

    const response = await this.aiService.generateEvolutionContent(pet, []);
    return response.content || '吾之智慧，非凡俗可及...';
  }

  /**
   * 使用AI生成回应
   */
  async generateAIResponse(pet, playerMessage) {
    const prompt = `你是一只名为"${pet.name}"的神话级灵宠。玩家对你说："${playerMessage}"
请以这只神话灵宠的身份回应（不超过30字），要体现出对主人的关爱和神话生物的智慧。`;

    const response = await this.aiService.generateEvolutionContent(pet, []);
    return response.content || '主人之言，吾深以为然...';
  }

  /**
   * 基于关键词生成回应
   */
  generateKeywordResponse(pet, playerMessage, speechLevel) {
    const message = playerMessage.toLowerCase();
    
    // 关键词映射
    const keywordResponses = {
      1: { // 觉醒期
        '你好|hi|hello': ['开心', '嗯嗯'],
        '吃|饿|食物': ['饿了', '想吃'],
        '玩|游戏': ['想玩', '好玩'],
        '累|休息': ['累了', '想睡'],
        '喜欢|爱': ['喜欢', '开心'],
        '不|别': ['不要', '嗯嗯']
      },
      2: { // 成长期
        '你好|hi|hello': ['你好呀', '我很开心'],
        '吃|饿|食物': ['我饿了', '想吃好吃的'],
        '玩|游戏': ['我们一起玩', '好好玩'],
        '累|休息': ['我有点累', '想休息一下'],
        '喜欢|爱': ['我喜欢你', '我们是朋友'],
        '不|别': ['不要这样', '我不喜欢'],
        '什么|为什么': ['这是什么', '我不知道']
      },
      3: { // 智慧期
        '你好|hi|hello': ['主人你好，今天过得怎么样？', '很高兴见到你'],
        '吃|饿|食物': ['我想尝试一些新的食物', '刚才的食物很美味'],
        '玩|游戏': ['我们可以一起探索新地方', '和你在一起很开心'],
        '累|休息': ['探险确实有些累，但很充实', '休息一下再继续吧'],
        '喜欢|爱': ['我也很喜欢和你在一起', '你是我最好的朋友'],
        '不|别': ['我理解你的想法', '那我们换个方式吧'],
        '什么|为什么': ['这个问题很有趣', '让我想想该怎么回答']
      }
    };
    
    const responses = keywordResponses[speechLevel];
    if (!responses) {
      return this.speechLevels[speechLevel].vocabulary[0];
    }
    
    // 查找匹配的关键词
    for (const [keywords, responseList] of Object.entries(responses)) {
      const keywordList = keywords.split('|');
      if (keywordList.some(keyword => message.includes(keyword))) {
        return responseList[Math.floor(Math.random() * responseList.length)];
      }
    }
    
    // 没有匹配的关键词，返回默认回应
    const defaultResponses = {
      1: ['嗯嗯', '好奇'],
      2: ['我不太懂', '什么意思'],
      3: ['这个话题很有趣', '我在思考你说的话']
    };
    
    const defaults = defaultResponses[speechLevel] || ['...'];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  /**
   * 获取喂食后的回应
   */
  getFeedResponses(level) {
    const responses = {
      1: ['好吃', '开心', '还要'],
      2: ['很好吃', '我喜欢', '谢谢你'],
      3: ['这个食物很美味', '我感觉更有力量了', '谢谢主人的投喂'],
      4: ['此等灵食，甚合吾意', '感受到了其中蕴含的灵力', '主人用心良苦']
    };
    return responses[level] || responses[0];
  }

  /**
   * 获取探索后的回应
   */
  getExploreResponses(level) {
    const responses = {
      1: ['累了', '好玩', '新奇'],
      2: ['好有趣', '学到了', '想再去'],
      3: ['这次探索很有收获', '发现了很多新东西', '我变得更强了'],
      4: ['此地灵韵深厚，颇有感悟', '天地奥秘，略有所得', '此行不虚']
    };
    return responses[level] || responses[0];
  }

  /**
   * 获取战斗后的回应
   */
  getBattleResponses(level) {
    const responses = {
      1: ['累了', '疼疼', '厉害'],
      2: ['好累啊', '我赢了', '对手很强'],
      3: ['这场战斗让我学到了很多', '我感觉自己变强了', '对手值得尊敬'],
      4: ['战斗乃修行之道', '在战斗中悟得真理', '强者之路，永无止境']
    };
    return responses[level] || responses[0];
  }

  /**
   * 获取情境描述
   */
  getContextDescription(context) {
    const descriptions = {
      'idle': '随意地说着话',
      'after_feed': '满足地表达着感受',
      'after_explore': '兴奋地分享探索心得',
      'after_battle': '回味着刚才的战斗',
      'greeting': '热情地打招呼',
      'farewell': '依依不舍地告别'
    };
    return descriptions[context] || '表达着自己的想法';
  }

  /**
   * 记录聊天历史
   */
  async saveChatHistory(petId, playerMessage, petResponse, speechLevel) {
    try {
      await this.database.run(`
        INSERT INTO chat_history (id, pet_id, player_message, pet_response, speech_level, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `, [
        require('uuid').v4(),
        petId,
        playerMessage,
        petResponse.text,
        speechLevel
      ]);
    } catch (error) {
      console.error('保存聊天记录失败:', error);
    }
  }

  /**
   * 获取聊天历史
   */
  async getChatHistory(petId, limit = 10) {
    try {
      return await this.database.all(`
        SELECT * FROM chat_history 
        WHERE pet_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [petId, limit]);
    } catch (error) {
      console.error('获取聊天记录失败:', error);
      return [];
    }
  }
}

module.exports = PetChatSystem;