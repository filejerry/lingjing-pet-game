/**
 * 活动点数系统 - 管理玩家的日常活动点数
 */

class ActivitySystem {
  constructor(database) {
    this.database = database;
    this.maxActivityPoints = 100; // 每日最大活动点数
    this.recoveryRate = 10; // 每次恢复的点数
    this.recoveryInterval = 2 * 60 * 60 * 1000; // 2小时恢复一次 (毫秒)
  }

  /**
   * 获取玩家当前活动点数
   */
  async getActivityPoints(playerId = 'default') {
    try {
      const player = await this.database.db.get(
        'SELECT * FROM player_activity WHERE player_id = ?',
        [playerId]
      );

      if (!player) {
        // 创建新玩家记录
        await this.database.db.run(
          `INSERT INTO player_activity (player_id, activity_points, last_recovery, daily_reset) 
           VALUES (?, ?, datetime('now'), date('now'))`,
          [playerId, this.maxActivityPoints]
        );
        return this.maxActivityPoints;
      }

      // 检查是否需要每日重置
      const today = new Date().toISOString().split('T')[0];
      if (player.daily_reset !== today) {
        await this.database.db.run(
          `UPDATE player_activity 
           SET activity_points = ?, daily_reset = ?, last_recovery = datetime('now')
           WHERE player_id = ?`,
          [this.maxActivityPoints, today, playerId]
        );
        return this.maxActivityPoints;
      }

      // 检查是否需要恢复点数
      const lastRecovery = new Date(player.last_recovery);
      const now = new Date();
      const timeDiff = now - lastRecovery;

      if (timeDiff >= this.recoveryInterval && player.activity_points < this.maxActivityPoints) {
        const recoveryTimes = Math.floor(timeDiff / this.recoveryInterval);
        const newPoints = Math.min(
          this.maxActivityPoints,
          player.activity_points + (recoveryTimes * this.recoveryRate)
        );

        await this.database.db.run(
          `UPDATE player_activity 
           SET activity_points = ?, last_recovery = datetime('now')
           WHERE player_id = ?`,
          [newPoints, playerId]
        );

        return newPoints;
      }

      return player.activity_points;
    } catch (error) {
      console.error('获取活动点数失败:', error);
      return this.maxActivityPoints; // 默认返回满点数
    }
  }

  /**
   * 消耗活动点数
   */
  async consumeActivityPoints(playerId = 'default', amount = 10) {
    try {
      const currentPoints = await this.getActivityPoints(playerId);
      
      if (currentPoints < amount) {
        return {
          success: false,
          message: `活动点数不足！当前：${currentPoints}，需要：${amount}`,
          currentPoints
        };
      }

      const newPoints = currentPoints - amount;
      await this.database.db.run(
        'UPDATE player_activity SET activity_points = ? WHERE player_id = ?',
        [newPoints, playerId]
      );

      return {
        success: true,
        message: `消耗 ${amount} 活动点数`,
        currentPoints: newPoints,
        consumed: amount
      };
    } catch (error) {
      console.error('消耗活动点数失败:', error);
      return {
        success: false,
        message: '系统错误，请稍后重试',
        currentPoints: 0
      };
    }
  }

  /**
   * 获取下次恢复时间
   */
  async getNextRecoveryTime(playerId = 'default') {
    try {
      const player = await this.database.db.get(
        'SELECT last_recovery FROM player_activity WHERE player_id = ?',
        [playerId]
      );

      if (!player) {
        return new Date();
      }

      const lastRecovery = new Date(player.last_recovery);
      const nextRecovery = new Date(lastRecovery.getTime() + this.recoveryInterval);
      
      return nextRecovery;
    } catch (error) {
      console.error('获取恢复时间失败:', error);
      return new Date();
    }
  }

  /**
   * 获取活动点数状态信息
   */
  async getActivityStatus(playerId = 'default') {
    const currentPoints = await this.getActivityPoints(playerId);
    const nextRecovery = await this.getNextRecoveryTime(playerId);
    const now = new Date();
    
    const timeUntilRecovery = Math.max(0, nextRecovery - now);
    const hoursUntilRecovery = Math.floor(timeUntilRecovery / (1000 * 60 * 60));
    const minutesUntilRecovery = Math.floor((timeUntilRecovery % (1000 * 60 * 60)) / (1000 * 60));

    return {
      currentPoints,
      maxPoints: this.maxActivityPoints,
      recoveryRate: this.recoveryRate,
      nextRecoveryIn: {
        hours: hoursUntilRecovery,
        minutes: minutesUntilRecovery,
        total: timeUntilRecovery
      },
      canRecover: currentPoints < this.maxActivityPoints && timeUntilRecovery <= 0
    };
  }
}

module.exports = ActivitySystem;