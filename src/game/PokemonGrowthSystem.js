/**
 * 宝可梦式养成系统
 * 包含等级、经验值、技能学习、进化条件等
 */

const logger = require('../utils/logger');

class PokemonGrowthSystem {
  constructor(aiService) {
    this.aiService = aiService;
    this.levelCurve = this.initializeLevelCurve();
    this.skillTrees = this.initializeSkillTrees();
    this.evolutionChains = this.initializeEvolutionChains();
  }

  /**
   * 初始化等级经验曲线
   */
  initializeLevelCurve() {
    const curve = {};
    for (let level = 1; level <= 100; level++) {
      // 使用类似宝可梦的经验曲线公式
      if (level <= 15) {
        curve[level] = Math.floor(Math.pow(level, 3) * 0.8);
      } else if (level <= 36) {
        curve[level] = Math.floor(Math.pow(level, 3) * 1.2);
      } else {
        curve[level] = Math.floor(Math.pow(level, 3) * 1.6);
      }
    }
    return curve;
  }

  /**
   * 初始化技能树
   */
  initializeSkillTrees() {
    return {
      fire: {
        name: '火系技能树',
        skills: {
          1: { name: '火花', power: 40, description: '喷出小火花攻击对手' },
          5: { name: '火焰', power: 60, description: '释放火焰攻击敌人' },
          10: { name: '火球术', power: 80, description: '凝聚火球进行强力攻击' },
          15: { name: '烈焰冲击', power: 100, description: '全身燃烧冲向敌人' },
          20: { name: '火焰漩涡', power: 120, description: '创造火焰漩涡困住敌人' },
          30: { name: '炼狱烈焰', power: 150, description: '召唤地狱之火焚烧一切' },
          50: { name: '凤凰涅槃', power: 200, description: '终极火系奥义，重生之力' }
        }
      },
      water: {
        name: '水系技能树',
        skills: {
          1: { name: '水枪', power: 40, description: '喷射水流攻击对手' },
          5: { name: '水波', power: 60, description: '发射水波冲击敌人' },
          10: { name: '水炮', power: 80, description: '高压水炮强力攻击' },
          15: { name: '潮汐冲击', power: 100, description: '召唤潮汐之力' },
          20: { name: '暴雨术', power: 120, description: '降下暴雨攻击全场' },
          30: { name: '海啸', power: 150, description: '引发巨大海啸' },
          50: { name: '龙王咆哮', power: 200, description: '水系终极奥义' }
        }
      },
      earth: {
        name: '土系技能树',
        skills: {
          1: { name: '石击', power: 40, description: '投掷石块攻击' },
          5: { name: '岩石爆破', power: 60, description: '引爆岩石碎片' },
          10: { name: '地震', power: 80, description: '震动大地攻击敌人' },
          15: { name: '山崩', power: 100, description: '引发山体崩塌' },
          20: { name: '大地裂缝', power: 120, description: '撕裂大地' },
          30: { name: '泰山压顶', power: 150, description: '巨石从天而降' },
          50: { name: '盘古开天', power: 200, description: '土系终极奥义' }
        }
      },
      wind: {
        name: '风系技能树',
        skills: {
          1: { name: '微风', power: 40, description: '轻柔的风刃攻击' },
          5: { name: '风刃', power: 60, description: '锋利的风之刃' },
          10: { name: '旋风', power: 80, description: '创造小型龙卷风' },
          15: { name: '狂风暴雨', power: 100, description: '召唤狂风' },
          20: { name: '风暴之眼', power: 120, description: '形成强力风暴' },
          30: { name: '九天罡风', power: 150, description: '天界之风降临' },
          50: { name: '风神降世', power: 200, description: '风系终极奥义' }
        }
      }
    };
  }

  /**
   * 初始化进化链
   */
  initializeEvolutionChains() {
    return {
      fire_dragon: {
        chain: [
          {
            name: '火苗龙',
            level: 1,
            requirements: { level: 1 },
            stats: { hp: 45, attack: 49, defense: 49, speed: 45, magic: 65 }
          },
          {
            name: '烈焰龙',
            level: 16,
            requirements: { level: 16, bond: 20 },
            stats: { hp: 58, attack: 64, defense: 58, speed: 80, magic: 80 }
          },
          {
            name: '炎帝龙',
            level: 36,
            requirements: { level: 36, bond: 50, fire_mastery: 10 },
            stats: { hp: 78, attack: 84, defense: 78, speed: 100, magic: 109 }
          },
          {
            name: '凤凰神龙',
            level: 60,
            requirements: { level: 60, bond: 80, legendary_item: true },
            stats: { hp: 108, attack: 130, defense: 85, speed: 100, magic: 154 }
          }
        ]
      },
      water_spirit: {
        chain: [
          {
            name: '水滴精灵',
            level: 1,
            requirements: { level: 1 },
            stats: { hp: 44, attack: 48, defense: 65, speed: 43, magic: 50 }
          },
          {
            name: '清泉仙子',
            level: 18,
            requirements: { level: 18, bond: 25 },
            stats: { hp: 59, attack: 63, defense: 80, speed: 58, magic: 65 }
          },
          {
            name: '海神使者',
            level: 38,
            requirements: { level: 38, bond: 55, water_mastery: 12 },
            stats: { hp: 79, attack: 83, defense: 100, speed: 78, magic: 85 }
          },
          {
            name: '龙王化身',
            level: 65,
            requirements: { level: 65, bond: 85, ocean_blessing: true },
            stats: { hp: 109, attack: 105, defense: 120, speed: 78, magic: 130 }
          }
        ]
      }
    };
  }

  /**
   * 计算升级所需经验
   */
  getExpRequiredForLevel(level) {
    return this.levelCurve[level] || 0;
  }

  /**
   * 计算当前等级和经验
   */
  calculateLevelFromExp(totalExp) {
    let level = 1;
    for (let l = 1; l <= 100; l++) {
      if (totalExp >= this.getExpRequiredForLevel(l)) {
        level = l;
      } else {
        break;
      }
    }
    
    const currentLevelExp = this.getExpRequiredForLevel(level);
    const nextLevelExp = this.getExpRequiredForLevel(level + 1);
    const expInCurrentLevel = totalExp - currentLevelExp;
    const expToNextLevel = nextLevelExp - totalExp;
    
    return {
      level,
      totalExp,
      expInCurrentLevel,
      expToNextLevel,
      expRequiredForCurrentLevel: currentLevelExp,
      expRequiredForNextLevel: nextLevelExp
    };
  }

  /**
   * 添加经验值
   */
  addExperience(pet, expGained) {
    const oldLevel = pet.level || 1;
    const oldTotalExp = pet.totalExp || 0;
    const newTotalExp = oldTotalExp + expGained;
    
    const levelInfo = this.calculateLevelFromExp(newTotalExp);
    const newLevel = levelInfo.level;
    
    // 更新宠物数据
    pet.totalExp = newTotalExp;
    pet.level = newLevel;
    pet.expToNextLevel = levelInfo.expToNextLevel;
    
    const result = {
      expGained,
      oldLevel,
      newLevel,
      leveledUp: newLevel > oldLevel,
      levelInfo,
      newSkills: [],
      evolutionAvailable: false
    };
    
    // 检查是否学会新技能
    if (result.leveledUp) {
      result.newSkills = this.checkNewSkills(pet, oldLevel, newLevel);
      result.evolutionAvailable = this.checkEvolutionAvailability(pet);
    }
    
    return result;
  }

  /**
   * 检查新技能
   */
  checkNewSkills(pet, oldLevel, newLevel) {
    const petType = pet.attribute || pet.type || 'fire';
    const skillTree = this.skillTrees[petType.toLowerCase()];
    
    if (!skillTree) return [];
    
    const newSkills = [];
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      if (skillTree.skills[level]) {
        newSkills.push({
          level,
          skill: skillTree.skills[level]
        });
      }
    }
    
    return newSkills;
  }

  /**
   * 检查进化可用性
   */
  checkEvolutionAvailability(pet) {
    const evolutionChain = this.getEvolutionChain(pet);
    if (!evolutionChain) return false;
    
    const currentStage = this.getCurrentEvolutionStage(pet, evolutionChain);
    const nextStage = evolutionChain.chain[currentStage + 1];
    
    if (!nextStage) return false;
    
    return this.meetsEvolutionRequirements(pet, nextStage.requirements);
  }

  /**
   * 获取进化链
   */
  getEvolutionChain(pet) {
    // 根据宠物种族或类型确定进化链
    const petSpecies = pet.species || pet.race || '';
    
    for (const [chainName, chain] of Object.entries(this.evolutionChains)) {
      if (petSpecies.includes('火') || petSpecies.includes('龙')) {
        return this.evolutionChains.fire_dragon;
      } else if (petSpecies.includes('水') || petSpecies.includes('海')) {
        return this.evolutionChains.water_spirit;
      }
    }
    
    return this.evolutionChains.fire_dragon; // 默认
  }

  /**
   * 获取当前进化阶段
   */
  getCurrentEvolutionStage(pet, evolutionChain) {
    const petLevel = pet.level || 1;
    let stage = 0;
    
    for (let i = 0; i < evolutionChain.chain.length; i++) {
      if (petLevel >= evolutionChain.chain[i].level) {
        stage = i;
      }
    }
    
    return stage;
  }

  /**
   * 检查进化要求
   */
  meetsEvolutionRequirements(pet, requirements) {
    for (const [req, value] of Object.entries(requirements)) {
      switch (req) {
        case 'level':
          if ((pet.level || 1) < value) return false;
          break;
        case 'bond':
          if ((pet.bond || 0) < value) return false;
          break;
        case 'fire_mastery':
        case 'water_mastery':
          if ((pet[req] || 0) < value) return false;
          break;
        case 'legendary_item':
        case 'ocean_blessing':
          if (!pet[req]) return false;
          break;
      }
    }
    return true;
  }

  /**
   * 执行进化
   */
  async evolve(pet) {
    try {
      const evolutionChain = this.getEvolutionChain(pet);
      if (!evolutionChain) {
        throw new Error('No evolution chain found for this pet');
      }
      
      const currentStage = this.getCurrentEvolutionStage(pet, evolutionChain);
      const nextStage = evolutionChain.chain[currentStage + 1];
      
      if (!nextStage) {
        throw new Error('Pet is already at maximum evolution stage');
      }
      
      if (!this.meetsEvolutionRequirements(pet, nextStage.requirements)) {
        throw new Error('Evolution requirements not met');
      }
      
      // 保存进化前的状态
      const beforeEvolution = {
        name: pet.name || pet.species,
        level: pet.level,
        stats: { ...pet.stats }
      };
      
      // 应用进化
      pet.species = nextStage.name;
      pet.evolutionStage = currentStage + 1;
      
      // 更新属性
      for (const [stat, value] of Object.entries(nextStage.stats)) {
        pet.stats = pet.stats || {};
        pet.stats[stat] = value;
      }
      
      // 生成进化描述
      const evolutionDescription = await this.generateEvolutionDescription(beforeEvolution, pet);
      
      return {
        success: true,
        beforeEvolution,
        afterEvolution: {
          name: pet.species,
          level: pet.level,
          stats: { ...pet.stats }
        },
        description: evolutionDescription,
        newAbilities: this.getEvolutionAbilities(nextStage)
      };
      
    } catch (error) {
      logger.error('Evolution failed:', error);
      throw error;
    }
  }

  /**
   * 生成进化描述
   */
  async generateEvolutionDescription(before, after) {
    try {
      if (this.aiService) {
        const result = await this.aiService.smartInference('evolution_description', {
          prompt: `生成宠物进化的精彩描述，从${before.name}进化为${after.species}，要有仪式感和震撼感，200字以内。`,
          context: { before, after }
        }, { forceRealtime: true });
        
        if (result && !result.error) {
          return result.content || this.getDefaultEvolutionDescription(before, after);
        }
      }
      
      return this.getDefaultEvolutionDescription(before, after);
      
    } catch (error) {
      logger.error('Failed to generate evolution description:', error);
      return this.getDefaultEvolutionDescription(before, after);
    }
  }

  /**
   * 获取默认进化描述
   */
  getDefaultEvolutionDescription(before, after) {
    return `在耀眼的光芒中，${before.name}开始了神圣的蜕变！身体被神秘的能量包围，力量在不断增强。当光芒散去，一只全新的${after.species}出现在你面前，散发着强大的气息！`;
  }

  /**
   * 获取进化新能力
   */
  getEvolutionAbilities(evolutionStage) {
    return [
      `获得新技能：${evolutionStage.name}专属技能`,
      '全属性大幅提升',
      '解锁新的技能树分支',
      '外观发生显著变化'
    ];
  }

  /**
   * 获取升级引导信息
   */
  getLevelUpGuidance(pet, levelUpResult) {
    const guidance = {
      congratulations: `🎉 恭喜！${pet.name || pet.species}升级到了${levelUpResult.newLevel}级！`,
      improvements: [],
      nextGoals: [],
      tips: []
    };
    
    // 属性提升信息
    guidance.improvements.push(`💪 战斗力显著提升！`);
    
    // 新技能信息
    if (levelUpResult.newSkills.length > 0) {
      levelUpResult.newSkills.forEach(skillInfo => {
        guidance.improvements.push(`✨ 学会了新技能：${skillInfo.skill.name}`);
      });
    }
    
    // 下一个目标
    if (levelUpResult.evolutionAvailable) {
      guidance.nextGoals.push(`🔥 可以进化了！点击进化按钮查看详情`);
    } else {
      const nextEvolutionLevel = this.getNextEvolutionLevel(pet);
      if (nextEvolutionLevel) {
        guidance.nextGoals.push(`🎯 距离下次进化还需${nextEvolutionLevel - pet.level}级`);
      }
    }
    
    // 建议和提示
    if (pet.level % 5 === 0) {
      guidance.tips.push(`💡 每5级是一个重要节点，考虑进行特训！`);
    }
    
    if (pet.level >= 10 && pet.level < 20) {
      guidance.tips.push(`🏃 现在可以参加更高难度的冒险了！`);
    }
    
    return guidance;
  }

  /**
   * 获取下次进化等级
   */
  getNextEvolutionLevel(pet) {
    const evolutionChain = this.getEvolutionChain(pet);
    if (!evolutionChain) return null;
    
    const currentStage = this.getCurrentEvolutionStage(pet, evolutionChain);
    const nextStage = evolutionChain.chain[currentStage + 1];
    
    return nextStage ? nextStage.level : null;
  }

  /**
   * 获取宠物完整状态
   */
  getPetStatus(pet) {
    const levelInfo = this.calculateLevelFromExp(pet.totalExp || 0);
    const evolutionChain = this.getEvolutionChain(pet);
    const currentStage = this.getCurrentEvolutionStage(pet, evolutionChain);
    const nextStage = evolutionChain ? evolutionChain.chain[currentStage + 1] : null;
    
    return {
      basic: {
        name: pet.name || pet.species,
        level: pet.level || 1,
        species: pet.species,
        type: pet.attribute || pet.type
      },
      experience: levelInfo,
      evolution: {
        currentStage,
        nextStage: nextStage ? nextStage.name : null,
        canEvolve: nextStage ? this.meetsEvolutionRequirements(pet, nextStage.requirements) : false,
        requirements: nextStage ? nextStage.requirements : null
      },
      skills: this.getAvailableSkills(pet),
      stats: pet.stats || {},
      bond: pet.bond || 0
    };
  }

  /**
   * 获取可用技能
   */
  getAvailableSkills(pet) {
    const petType = pet.attribute || pet.type || 'fire';
    const skillTree = this.skillTrees[petType.toLowerCase()];
    
    if (!skillTree) return [];
    
    const availableSkills = [];
    const petLevel = pet.level || 1;
    
    for (const [level, skill] of Object.entries(skillTree.skills)) {
      if (petLevel >= parseInt(level)) {
        availableSkills.push({
          level: parseInt(level),
          ...skill
        });
      }
    }
    
    return availableSkills;
  }
}

module.exports = PokemonGrowthSystem;