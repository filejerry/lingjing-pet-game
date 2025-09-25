/**
 * 战斗系统 - 处理宠物间的战斗逻辑
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class BattleSystem {
  constructor(database) {
    this.db = database;
    this.elementAdvantages = this.initElementAdvantages();
  }

  /**
   * 发起战斗
   */
  async initiateBattle(attackerId, defenderId, battleType = 'pve') {
    const attacker = await this.getPetForBattle(attackerId);
    const defender = await this.getPetForBattle(defenderId);

    if (!attacker || !defender) {
      throw new Error('One or both pets not found');
    }

    logger.info(`Battle initiated: ${attacker.name} vs ${defender.name}`);

    const battleResult = await this.executeBattle(attacker, defender, battleType);
    
    // 保存战斗记录
    await this.saveBattleRecord(attacker, defender, battleResult, battleType);

    return battleResult;
  }

  /**
   * 执行战斗逻辑
   */
  async executeBattle(attacker, defender, battleType) {
    const battleLog = [];
    let round = 1;
    const maxRounds = 20; // 防止无限战斗

    // 初始化战斗状态
    const attackerState = this.initBattleState(attacker);
    const defenderState = this.initBattleState(defender);

    battleLog.push(`战斗开始！${attacker.name} VS ${defender.name}`);
    battleLog.push(`${attacker.name}: HP=${attackerState.currentHp}/${attackerState.maxHp}`);
    battleLog.push(`${defender.name}: HP=${defenderState.currentHp}/${defenderState.maxHp}`);

    while (round <= maxRounds && attackerState.currentHp > 0 && defenderState.currentHp > 0) {
      battleLog.push(`\n--- 第${round}回合 ---`);

      // 决定行动顺序（速度高的先攻）
      const firstActor = attackerState.speed >= defenderState.speed ? 
        { actor: attackerState, target: defenderState, name: attacker.name, targetName: defender.name } :
        { actor: defenderState, target: attackerState, name: defender.name, targetName: attacker.name };
      
      const secondActor = firstActor.actor === attackerState ?
        { actor: defenderState, target: attackerState, name: defender.name, targetName: attacker.name } :
        { actor: attackerState, target: defenderState, name: attacker.name, targetName: defender.name };

      // 第一个行动者攻击
      if (firstActor.actor.currentHp > 0) {
        const damage1 = this.calculateDamage(firstActor.actor, firstActor.target);
        firstActor.target.currentHp = Math.max(0, firstActor.target.currentHp - damage1);
        battleLog.push(`${firstActor.name} 攻击 ${firstActor.targetName}，造成 ${damage1} 点伤害！`);
        
        if (firstActor.target.currentHp <= 0) {
          battleLog.push(`${firstActor.targetName} 被击败了！`);
          break;
        }
      }

      // 第二个行动者攻击
      if (secondActor.actor.currentHp > 0) {
        const damage2 = this.calculateDamage(secondActor.actor, secondActor.target);
        secondActor.target.currentHp = Math.max(0, secondActor.target.currentHp - damage2);
        battleLog.push(`${secondActor.name} 攻击 ${secondActor.targetName}，造成 ${damage2} 点伤害！`);
        
        if (secondActor.target.currentHp <= 0) {
          battleLog.push(`${secondActor.targetName} 被击败了！`);
          break;
        }
      }

      // 应用回合结束效果（毒、再生等）
      this.applyEndOfTurnEffects(attackerState, defenderState, battleLog);

      round++;
    }

    // 判定胜负
    let winner = null;
    if (attackerState.currentHp > 0 && defenderState.currentHp <= 0) {
      winner = attacker;
      battleLog.push(`\n🎉 ${attacker.name} 获得了胜利！`);
    } else if (defenderState.currentHp > 0 && attackerState.currentHp <= 0) {
      winner = defender;
      battleLog.push(`\n🎉 ${defender.name} 获得了胜利！`);
    } else {
      battleLog.push(`\n⚖️ 战斗以平局结束！`);
    }

    return {
      winner: winner,
      battleLog: battleLog,
      rounds: round - 1,
      finalState: {
        attacker: attackerState,
        defender: defenderState
      }
    };
  }

  /**
   * 计算伤害
   */
  calculateDamage(attacker, defender) {
    // 基础物理伤害
    let physicalDamage = Math.max(1, attacker.attack - defender.defense);
    
    // 基础魔法伤害
    let magicalDamage = Math.max(1, attacker.magic - defender.resistance);
    
    // 选择较高的伤害类型
    let baseDamage = Math.max(physicalDamage, magicalDamage);
    
    // 元素克制加成
    const elementBonus = this.getElementAdvantage(attacker.element, defender.element);
    baseDamage = Math.floor(baseDamage * elementBonus);
    
    // 应用特殊词条效果
    baseDamage = this.applyTraitEffects(attacker, defender, baseDamage);
    
    // 暴击判定
    if (Math.random() < 0.05) { // 5%暴击率
      baseDamage = Math.floor(baseDamage * 1.5);
    }
    
    // 随机波动 (90%-110%)
    baseDamage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
    
    return Math.max(1, baseDamage);
  }

  /**
   * 应用词条效果
   */
  applyTraitEffects(attacker, defender, baseDamage) {
    let finalDamage = baseDamage;
    
    // 攻击方词条效果
    attacker.traits.forEach(trait => {
      if (!trait.is_active) return;
      
      switch (trait.special_mechanism) {
        case 'vampire':
          // 吸血效果在伤害计算后处理
          break;
        case 'berserk':
          if (attacker.currentHp < attacker.maxHp * 0.3) {
            finalDamage = Math.floor(finalDamage * 1.5);
          }
          break;
        case 'armor_penetration':
          finalDamage += Math.floor(defender.defense * 0.3);
          break;
      }
      
      if (trait.type === 'attack' && !trait.is_negative) {
        finalDamage += trait.effect_value;
      }
    });
    
    // 防御方词条效果
    defender.traits.forEach(trait => {
      if (!trait.is_active) return;
      
      switch (trait.special_mechanism) {
        case 'magic_immunity':
          if (attacker.magic > attacker.attack) {
            finalDamage = Math.floor(finalDamage * 0.5);
          }
          break;
        case 'thorns':
          // 反伤效果
          attacker.currentHp -= Math.floor(finalDamage * 0.2);
          break;
      }
      
      if (trait.type === 'defense' && !trait.is_negative) {
        finalDamage = Math.max(1, finalDamage - trait.effect_value);
      }
    });
    
    return finalDamage;
  }

  /**
   * 获取元素克制优势
   */
  getElementAdvantage(attackerElement, defenderElement) {
    if (!attackerElement || !defenderElement || attackerElement === defenderElement) {
      return 1.0;
    }
    
    const advantages = this.elementAdvantages[attackerElement];
    if (advantages && advantages.includes(defenderElement)) {
      return 1.2; // 20%克制加成
    }
    
    // 检查是否被克制
    for (const [element, advantageList] of Object.entries(this.elementAdvantages)) {
      if (advantageList.includes(attackerElement) && element === defenderElement) {
        return 0.8; // 20%克制减成
      }
    }
    
    return 1.0;
  }

  /**
   * 初始化战斗状态
   */
  initBattleState(pet) {
    return {
      maxHp: pet.hp,
      currentHp: pet.hp,
      attack: pet.attack,
      defense: pet.defense,
      speed: pet.speed,
      magic: pet.magic,
      resistance: pet.resistance,
      element: pet.element_type,
      traits: pet.traits || [],
      statusEffects: []
    };
  }

  /**
   * 应用回合结束效果
   */
  applyEndOfTurnEffects(attackerState, defenderState, battleLog) {
    // 处理吸血效果
    [attackerState, defenderState].forEach((state, index) => {
      const petName = index === 0 ? '攻击方' : '防御方';
      
      state.traits.forEach(trait => {
        if (trait.special_mechanism === 'regeneration' && trait.is_active) {
          const healAmount = Math.floor(state.maxHp * 0.05);
          state.currentHp = Math.min(state.maxHp, state.currentHp + healAmount);
          battleLog.push(`${petName} 的再生能力恢复了 ${healAmount} 点生命值`);
        }
      });
    });
  }

  /**
   * 获取用于战斗的宠物数据
   */
  async getPetForBattle(petId) {
    const pet = await this.db.get('SELECT * FROM pets WHERE id = ? AND is_active = 1', [petId]);
    if (!pet) return null;

    const traits = await this.db.all(
      'SELECT * FROM pet_traits WHERE pet_id = ? AND is_active = 1',
      [petId]
    );

    return { ...pet, traits };
  }

  /**
   * 保存战斗记录
   */
  async saveBattleRecord(attacker, defender, battleResult, battleType) {
    const recordId = uuidv4();
    
    await this.db.run(
      `INSERT INTO battle_records (id, attacker_id, defender_id, battle_log, winner_id, battle_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        attacker.id,
        defender.id,
        JSON.stringify(battleResult.battleLog),
        battleResult.winner ? battleResult.winner.id : null,
        battleType
      ]
    );

    logger.info(`Battle record saved: ${recordId}`);
  }

  /**
   * 获取战斗历史
   */
  async getBattleHistory(petId, limit = 10) {
    const battles = await this.db.all(
      `SELECT br.*, 
              p1.name as attacker_name, 
              p2.name as defender_name,
              pw.name as winner_name
       FROM battle_records br
       LEFT JOIN pets p1 ON br.attacker_id = p1.id
       LEFT JOIN pets p2 ON br.defender_id = p2.id  
       LEFT JOIN pets pw ON br.winner_id = pw.id
       WHERE br.attacker_id = ? OR br.defender_id = ?
       ORDER BY br.timestamp DESC
       LIMIT ?`,
      [petId, petId, limit]
    );

    return battles.map(battle => ({
      ...battle,
      battle_log: JSON.parse(battle.battle_log)
    }));
  }

  /**
   * 初始化元素克制关系
   */
  initElementAdvantages() {
    return {
      fire: ['nature', 'ice'],
      water: ['fire', 'earth'],
      earth: ['air', 'water'],
      air: ['earth', 'fire'],
      light: ['dark'],
      dark: ['light'],
      nature: ['earth', 'air'],
      ice: ['nature', 'air'],
      chaos: [] // 混沌不克制任何元素，但也不被克制
    };
  }

  /**
   * 生成AI对手
   */
  generateAIOpponent(playerPetLevel) {
    const aiPetId = uuidv4();
    const levelVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const aiLevel = Math.max(1, playerPetLevel + levelVariation);
    
    const baseStats = {
      hp: 80 + (aiLevel * 10),
      attack: 15 + (aiLevel * 3),
      defense: 12 + (aiLevel * 2),
      speed: 10 + (aiLevel * 2),
      magic: 8 + (aiLevel * 2),
      resistance: 10 + (aiLevel * 2)
    };

    const elements = ['fire', 'water', 'earth', 'air', 'light', 'dark', 'nature', 'ice'];
    const randomElement = elements[Math.floor(Math.random() * elements.length)];

    return {
      id: aiPetId,
      name: `野生的${randomElement}系生物`,
      element_type: randomElement,
      traits: [],
      ...baseStats
    };
  }
}

module.exports = BattleSystem;