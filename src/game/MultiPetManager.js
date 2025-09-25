/**
 * 多宠物管理系统
 * 支持玩家拥有最多5个宠物，第一个宠物10级后可解锁第二个
 */

class MultiPetManager {
  constructor(database) {
    this.db = database;
    this.MAX_PETS = 5;
    this.UNLOCK_LEVEL = 10;
  }

  /**
   * 检查玩家是否可以获得新宠物
   */
  async canGetNewPet(userId) {
    try {
      // 获取玩家当前宠物数量
      const petCount = await this.db.get(
        'SELECT COUNT(*) as count FROM pets WHERE user_id = ?',
        [userId]
      );

      if (petCount.count >= this.MAX_PETS) {
        return { canGet: false, reason: '已达到最大宠物数量限制(5个)' };
      }

      if (petCount.count === 0) {
        return { canGet: true, reason: '第一个宠物' };
      }

      // 检查是否有宠物达到解锁等级
      const highLevelPet = await this.db.get(
        'SELECT * FROM pets WHERE user_id = ? AND level >= ? LIMIT 1',
        [userId, this.UNLOCK_LEVEL]
      );

      if (!highLevelPet) {
        return { 
          canGet: false, 
          reason: `需要有宠物达到${this.UNLOCK_LEVEL}级才能获得新宠物` 
        };
      }

      return { canGet: true, reason: `${highLevelPet.name}已达到${this.UNLOCK_LEVEL}级，可以获得新伙伴` };
    } catch (error) {
      console.error('检查新宠物权限失败:', error);
      return { canGet: false, reason: '系统错误' };
    }
  }

  /**
   * 获取玩家所有宠物
   */
  async getUserPets(userId) {
    try {
      const pets = await this.db.all(
        'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at ASC',
        [userId]
      );
      return pets;
    } catch (error) {
      console.error('获取用户宠物失败:', error);
      return [];
    }
  }

  /**
   * 获取玩家主要宠物（第一个或最高等级的）
   */
  async getMainPet(userId) {
    try {
      const mainPet = await this.db.get(
        'SELECT * FROM pets WHERE user_id = ? ORDER BY level DESC, created_at ASC LIMIT 1',
        [userId]
      );
      return mainPet;
    } catch (error) {
      console.error('获取主要宠物失败:', error);
      return null;
    }
  }

  /**
   * 切换当前活跃宠物
   */
  async switchActivePet(userId, petId) {
    try {
      // 先将所有宠物设为非活跃
      await this.db.run(
        'UPDATE pets SET is_active = 0 WHERE user_id = ?',
        [userId]
      );

      // 设置指定宠物为活跃
      await this.db.run(
        'UPDATE pets SET is_active = 1 WHERE id = ? AND user_id = ?',
        [petId, userId]
      );

      return true;
    } catch (error) {
      console.error('切换活跃宠物失败:', error);
      return false;
    }
  }

  /**
   * 获取当前活跃宠物
   */
  async getActivePet(userId) {
    try {
      let activePet = await this.db.get(
        'SELECT * FROM pets WHERE user_id = ? AND is_active = 1 LIMIT 1',
        [userId]
      );

      // 如果没有活跃宠物，设置第一个为活跃
      if (!activePet) {
        const firstPet = await this.db.get(
          'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at ASC LIMIT 1',
          [userId]
        );

        if (firstPet) {
          await this.switchActivePet(userId, firstPet.id);
          activePet = firstPet;
          activePet.is_active = 1;
        }
      }

      return activePet;
    } catch (error) {
      console.error('获取活跃宠物失败:', error);
      return null;
    }
  }

  /**
   * 宠物升级检查
   */
  async checkLevelUp(petId) {
    try {
      const pet = await this.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
      if (!pet) return null;

      const maxExp = this.calculateMaxExperience(pet.level);
      
      if (pet.experience >= maxExp) {
        // 升级
        const newLevel = pet.level + 1;
        const newMaxExp = this.calculateMaxExperience(newLevel);
        const remainingExp = pet.experience - maxExp;

        await this.db.run(
          `UPDATE pets SET 
           level = ?, 
           experience = ?,
           hp = hp + ?,
           attack = attack + ?,
           defense = defense + ?,
           speed = speed + ?,
           magic = magic + ?
           WHERE id = ?`,
          [
            newLevel,
            remainingExp,
            Math.floor(Math.random() * 5) + 3, // HP +3-7
            Math.floor(Math.random() * 3) + 1, // 攻击 +1-3
            Math.floor(Math.random() * 3) + 1, // 防御 +1-3
            Math.floor(Math.random() * 2) + 1, // 速度 +1-2
            Math.floor(Math.random() * 3) + 1, // 魔力 +1-3
            petId
          ]
        );

        const updatedPet = await this.db.get('SELECT * FROM pets WHERE id = ?', [petId]);
        
        return {
          leveledUp: true,
          oldLevel: pet.level,
          newLevel: newLevel,
          pet: updatedPet,
          canUnlockNewPet: newLevel === this.UNLOCK_LEVEL
        };
      }

      return { leveledUp: false, pet };
    } catch (error) {
      console.error('检查升级失败:', error);
      return null;
    }
  }

  /**
   * 计算等级所需经验值
   */
  calculateMaxExperience(level) {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  /**
   * 给宠物增加经验
   */
  async addExperience(petId, expAmount) {
    try {
      await this.db.run(
        'UPDATE pets SET experience = experience + ? WHERE id = ?',
        [expAmount, petId]
      );

      return await this.checkLevelUp(petId);
    } catch (error) {
      console.error('增加经验失败:', error);
      return null;
    }
  }

  /**
   * 获取宠物队伍状态
   */
  async getTeamStatus(userId) {
    try {
      const pets = await this.getUserPets(userId);
      const activePet = await this.getActivePet(userId);
      const canGetNew = await this.canGetNewPet(userId);

      return {
        pets,
        activePet,
        petCount: pets.length,
        maxPets: this.MAX_PETS,
        canGetNewPet: canGetNew.canGet,
        unlockReason: canGetNew.reason
      };
    } catch (error) {
      console.error('获取队伍状态失败:', error);
      return null;
    }
  }

  /**
   * 宠物重命名
   */
  async renamePet(petId, newName, userId) {
    try {
      const result = await this.db.run(
        'UPDATE pets SET name = ? WHERE id = ? AND user_id = ?',
        [newName, petId, userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('重命名宠物失败:', error);
      return false;
    }
  }

  /**
   * 释放宠物（删除）
   */
  async releasePet(petId, userId) {
    try {
      // 不能释放唯一的宠物
      const petCount = await this.db.get(
        'SELECT COUNT(*) as count FROM pets WHERE user_id = ?',
        [userId]
      );

      if (petCount.count <= 1) {
        return { success: false, reason: '不能释放唯一的宠物' };
      }

      // 检查是否是活跃宠物
      const pet = await this.db.get(
        'SELECT * FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );

      if (!pet) {
        return { success: false, reason: '宠物不存在' };
      }

      // 删除宠物
      await this.db.run('DELETE FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);

      // 如果释放的是活跃宠物，设置新的活跃宠物
      if (pet.is_active) {
        const newActivePet = await this.db.get(
          'SELECT * FROM pets WHERE user_id = ? ORDER BY level DESC, created_at ASC LIMIT 1',
          [userId]
        );

        if (newActivePet) {
          await this.switchActivePet(userId, newActivePet.id);
        }
      }

      return { success: true, reason: `${pet.name}已被释放` };
    } catch (error) {
      console.error('释放宠物失败:', error);
      return { success: false, reason: '系统错误' };
    }
  }
}

module.exports = MultiPetManager;