/**
 * 新手引导系统
 * 提供沉浸式的山海经世界入门体验
 */

const ShanHaiJingWorldView = require('./ShanHaiJingWorldView');

class TutorialSystem {
  constructor(database, aiService) {
    this.database = database;
    this.aiService = aiService;
    this.worldView = new ShanHaiJingWorldView();
    
    // 新手引导阶段
    this.tutorialStages = {
      awakening: {
        id: 'awakening',
        title: '🌅混沌初醒',
        description: '意识在古老的世界树下苏醒',
        duration: 3000,
        autoNext: true
      },
      bonding: {
        id: 'bonding',
        title: '🤝灵魂契约',
        description: '与你的第一只灵兽建立羁绊',
        duration: 5000,
        autoNext: false,
        requiresChoice: true
      },
      exploration: {
        id: 'exploration',
        title: '🗺️世界探索',
        description: '了解五界结构和世界树层级',
        duration: 4000,
        autoNext: false,
        requiresChoice: true
      },
      firstEvolution: {
        id: 'firstEvolution',
        title: '✨初次蜕变',
        description: '见证你的伙伴第一次进化',
        duration: 6000,
        autoNext: false,
        requiresChoice: false
      },
      graduation: {
        id: 'graduation',
        title: '🎓引导完成',
        description: '正式开始你的御灵师之路',
        duration: 2000,
        autoNext: true
      }
    };
  }

  /**
   * 开始新手引导
   */
  async startTutorial(userId) {
    const tutorialData = {
      userId,
      currentStage: 'awakening',
      startTime: new Date().toISOString(),
      progress: {},
      choices: {}
    };

    // 保存引导数据
    await this.saveTutorialProgress(tutorialData);

    // 生成开场剧情
    const openingStory = await this.generateOpeningStory();
    
    return {
      stage: 'awakening',
      story: openingStory,
      nextAction: 'auto_continue',
      timeToNext: 3000
    };
  }

  /**
   * 生成开场剧情
   */
  async generateOpeningStory() {
    const prompt = `${this.worldView.getWorldViewPrompts().story}

请生成一个新手引导的开场剧情，描述玩家意识在世界树下苏醒的场景。要求：
1. 使用山海经的古典文风
2. 描述世界树建木的宏伟
3. 营造神秘而庄重的氛围
4. 长度控制在150-200字
5. 为后续与灵兽相遇做铺垫`;

    try {
      const story = await this.aiService.generateContent(prompt, {
        temperature: 0.8,
        maxTokens: 300
      });

      return this.worldView.applySpecialMarkers(story);
    } catch (error) {
      // 备用剧情
      return this.worldView.applySpecialMarkers(`
🌳世界树建木参天而立，其根深扎九幽，其冠直抵九天。混沌初开之际，你的意识如晨曦般缓缓苏醒。

古老的灵气在空中流转，✨星辰之光洒向大地。你感受到一股来自远古的召唤，那是来自🏔️昆仑山巅的神秘力量。

在这片神圣的土地上，无数💎仙灵玉散发着柔和的光芒，🌸瑶池花在微风中轻摆。你知道，一段传奇的旅程即将开始...
      `);
    }
  }

  /**
   * 处理引导阶段推进
   */
  async progressTutorial(userId, choice = null) {
    const tutorialData = await this.getTutorialProgress(userId);
    if (!tutorialData) {
      throw new Error('未找到引导数据');
    }

    const currentStage = this.tutorialStages[tutorialData.currentStage];
    let nextStage = null;

    switch (tutorialData.currentStage) {
      case 'awakening':
        nextStage = 'bonding';
        break;
      case 'bonding':
        if (choice) {
          tutorialData.choices.bonding = choice;
          nextStage = 'exploration';
        }
        break;
      case 'exploration':
        if (choice) {
          tutorialData.choices.exploration = choice;
          nextStage = 'firstEvolution';
        }
        break;
      case 'firstEvolution':
        nextStage = 'graduation';
        break;
      case 'graduation':
        // 引导完成
        await this.completeTutorial(userId);
        return { completed: true };
    }

    if (nextStage) {
      tutorialData.currentStage = nextStage;
      await this.saveTutorialProgress(tutorialData);

      const storyContent = await this.generateStageStory(nextStage, tutorialData.choices);
      
      return {
        stage: nextStage,
        story: storyContent,
        nextAction: this.tutorialStages[nextStage].requiresChoice ? 'wait_choice' : 'auto_continue',
        timeToNext: this.tutorialStages[nextStage].duration,
        choices: this.getStageChoices(nextStage)
      };
    }

    return { waiting: true };
  }

  /**
   * 生成阶段剧情
   */
  async generateStageStory(stage, previousChoices) {
    const stagePrompts = {
      bonding: `请生成灵魂契约阶段的剧情。玩家遇到了第一只灵兽，描述这个神圣的契约仪式。要求体现山海经风格，包含特殊符号标记。`,
      
      exploration: `请生成世界探索阶段的剧情。介绍世界树的五界结构：天界、仙境、人间、妖域、幽冥。要求使用古典文风，包含地域标记。`,
      
      firstEvolution: `请生成第一次进化的剧情。描述灵兽在世界树力量下的蜕变过程。要求充满神话色彩，体现进化的神圣性。`,
      
      graduation: `请生成引导完成的剧情。祝贺玩家正式成为御灵师，开启真正的冒险。要求庄重而鼓舞人心。`
    };

    const prompt = `${this.worldView.getWorldViewPrompts().story}

${stagePrompts[stage]}

长度控制在120-180字，使用特殊符号标记重要元素。`;

    try {
      const story = await this.aiService.generateContent(prompt, {
        temperature: 0.7,
        maxTokens: 250
      });

      return this.worldView.applySpecialMarkers(story);
    } catch (error) {
      return this.getBackupStory(stage);
    }
  }

  /**
   * 获取阶段选择项
   */
  getStageChoices(stage) {
    const choices = {
      bonding: [
        { id: 'gentle', text: '轻抚它的头部', effect: '增加亲密度' },
        { id: 'observe', text: '仔细观察它的特征', effect: '了解属性' }
      ],
      exploration: [
        { id: 'ascend', text: '向上探索仙境', effect: '倾向光明进化' },
        { id: 'descend', text: '向下探索妖域', effect: '倾向黑暗进化' }
      ]
    };

    return choices[stage] || [];
  }

  /**
   * 获取备用剧情
   */
  getBackupStory(stage) {
    const backupStories = {
      bonding: `金光闪烁间，一只幼小的灵兽出现在你面前。它的眼中闪烁着✨星辰般的光芒，身上散发着来自🏔️昆仑山的神圣气息。

这是命运的安排，也是🌳世界树的指引。你伸出手，感受到一股温暖的力量在你们之间流转。

"契约已成。"古老的声音在心中响起，你与这只灵兽建立了永恒的羁绊。`,

      exploration: `🌳世界树建木高耸入云，其五界分明：

✨天界九重，神灵居所，🔥天雷珠闪烁其间
💎仙境七层，仙人修行，🌸瑶池花香飘四方  
🗿人间五界，万物生息，⚔️神器传说流传
🌑妖域三重，妖魔栖息，👹鬼面森然可怖
💀幽冥一层，亡魂归处，⚰️轮回印记深深

你的旅程将在这五界中展开，每一层都有无尽的奥秘等待探索。`,

      firstEvolution: `🌳世界树的力量汇聚，你的灵兽伙伴被柔和的光芒包围。

古老的符文在空中浮现，✨星辰之力注入它的身体。你看到它的形态在光芒中缓缓改变，更加优雅，更加强大。

"这是成长的印记。"🏔️昆仑山传来的声音说道，"每一次蜕变，都是向更高层次的跃升。"

进化完成，你的伙伴获得了新的力量和智慧。`,

      graduation: `🎓引导之路已经走完，真正的冒险即将开始。

🌳世界树的枝叶轻摆，仿佛在为你送行。你已经掌握了基本的御灵技巧，了解了五界的奥秘。

前方的路充满未知，但你不再孤单。与你的灵兽伙伴一起，去探索这个充满神话色彩的世界吧！

愿🏔️昆仑山的智慧指引你的道路，愿✨星辰之光照亮你的前程。`
    };

    return this.worldView.applySpecialMarkers(backupStories[stage] || '引导继续中...');
  }

  /**
   * 保存引导进度
   */
  async saveTutorialProgress(tutorialData) {
    const query = `
      INSERT OR REPLACE INTO tutorial_progress 
      (user_id, current_stage, start_time, progress_data, choices_data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.database.run(query, [
      tutorialData.userId,
      tutorialData.currentStage,
      tutorialData.startTime,
      JSON.stringify(tutorialData.progress),
      JSON.stringify(tutorialData.choices),
      new Date().toISOString()
    ]);
  }

  /**
   * 获取引导进度
   */
  async getTutorialProgress(userId) {
    const query = `SELECT * FROM tutorial_progress WHERE user_id = ?`;
    const row = await this.database.get(query, [userId]);
    
    if (!row) return null;

    return {
      userId: row.user_id,
      currentStage: row.current_stage,
      startTime: row.start_time,
      progress: JSON.parse(row.progress_data || '{}'),
      choices: JSON.parse(row.choices_data || '{}')
    };
  }

  /**
   * 完成引导
   */
  async completeTutorial(userId) {
    const query = `UPDATE tutorial_progress SET completed = 1, completed_at = ? WHERE user_id = ?`;
    await this.database.run(query, [new Date().toISOString(), userId]);
  }

  /**
   * 检查是否需要引导
   */
  async needsTutorial(userId) {
    const progress = await this.getTutorialProgress(userId);
    return !progress || !progress.completed;
  }
}

module.exports = TutorialSystem;