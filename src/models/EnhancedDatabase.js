/**
 * 增强版数据库 - 支持活动点数系统和详细日志
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

class EnhancedDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/enhanced_spirit_pets.db');
  }

  /**
   * 初始化数据库连接和表结构
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Database connection failed:', err);
          reject(err);
        } else {
          logger.info('Enhanced database connected successfully');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * 创建所有必要的表
   */
  async createTables() {
    const tables = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 宠物表
      `CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        species TEXT DEFAULT 'unknown',
        rarity TEXT DEFAULT 'N' CHECK (rarity IN ('N', 'R', 'SR', 'SSR', 'SSS')),
        base_prompt TEXT NOT NULL,
        hp INTEGER DEFAULT 100,
        attack INTEGER DEFAULT 10,
        defense INTEGER DEFAULT 10,
        speed INTEGER DEFAULT 10,
        magic INTEGER DEFAULT 0,
        element TEXT DEFAULT 'neutral',
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        mythology_type TEXT,
        awakening_stage INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // 宠物特质表
      `CREATE TABLE IF NOT EXISTS pet_traits (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        trait_name TEXT NOT NULL,
        trait_type TEXT NOT NULL CHECK (trait_type IN ('attack', 'defense', 'speed', 'magic', 'special')),
        effect_value INTEGER NOT NULL,
        effect_description TEXT,
        special_mechanism TEXT,
        is_negative BOOLEAN DEFAULT 0,
        rarity_bonus REAL DEFAULT 1.0,
        acquisition_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 行为记录表
      `CREATE TABLE IF NOT EXISTS pet_behaviors (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        action_type TEXT NOT NULL CHECK (action_type IN ('feed', 'explore', 'train', 'adventure')),
        action_target TEXT NOT NULL,
        keywords_added TEXT,
        activity_cost INTEGER DEFAULT 10,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 玩家活动点数表
      `CREATE TABLE IF NOT EXISTS player_activity (
        player_id TEXT PRIMARY KEY DEFAULT 'default',
        activity_points INTEGER DEFAULT 100,
        max_points INTEGER DEFAULT 100,
        last_recovery DATETIME DEFAULT CURRENT_TIMESTAMP,
        daily_reset DATE DEFAULT (date('now')),
        total_consumed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 探险日志表
      `CREATE TABLE IF NOT EXISTS adventure_logs (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        location TEXT NOT NULL,
        adventure_type TEXT DEFAULT 'exploration',
        description TEXT NOT NULL,
        detailed_story TEXT,
        rewards TEXT,
        activity_cost INTEGER DEFAULT 10,
        duration_minutes INTEGER DEFAULT 30,
        success_rate REAL DEFAULT 0.8,
        actual_result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 战斗日志表
      `CREATE TABLE IF NOT EXISTS battle_logs (
        id TEXT PRIMARY KEY,
        pet1_id TEXT NOT NULL,
        pet2_id TEXT NOT NULL,
        battle_type TEXT DEFAULT 'friendly',
        pre_battle_description TEXT,
        battle_process TEXT NOT NULL,
        post_battle_description TEXT,
        winner_id TEXT,
        rounds INTEGER DEFAULT 1,
        pet1_final_hp INTEGER,
        pet2_final_hp INTEGER,
        experience_gained INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet1_id) REFERENCES pets (id),
        FOREIGN KEY (pet2_id) REFERENCES pets (id),
        FOREIGN KEY (winner_id) REFERENCES pets (id)
      )`,

      // 冒险事件表（加入 is_completed 以兼容业务查询）
      `CREATE TABLE IF NOT EXISTS adventure_events (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_title TEXT NOT NULL,
        event_description TEXT NOT NULL,
        detailed_narrative TEXT,
        rewards TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
        is_completed INTEGER DEFAULT 0,
        activity_cost INTEGER DEFAULT 15,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 宠物相遇记录表
      `CREATE TABLE IF NOT EXISTS pet_encounters (
        id TEXT PRIMARY KEY,
        pet1_id TEXT NOT NULL,
        pet2_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        location TEXT,
        encounter_story TEXT NOT NULL,
        interaction_result TEXT,
        friendship_change INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet1_id) REFERENCES pets (id),
        FOREIGN KEY (pet2_id) REFERENCES pets (id)
      )`,

      // 神话觉醒记录表
      `CREATE TABLE IF NOT EXISTS mythology_awakenings (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        previous_form TEXT,
        awakened_form TEXT NOT NULL,
        awakening_type TEXT NOT NULL,
        awakening_story TEXT NOT NULL,
        attribute_changes TEXT,
        special_abilities TEXT,
        awakening_level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 聊天历史表
      `CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        player_message TEXT NOT NULL,
        pet_response TEXT NOT NULL,
        speech_level INTEGER DEFAULT 0,
        response_context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 宠物图像记录表
      `CREATE TABLE IF NOT EXISTS pet_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        style TEXT DEFAULT 'fantasy',
        environment TEXT DEFAULT 'natural',
        size TEXT DEFAULT '2K',
        generation_type TEXT DEFAULT 'single' CHECK (generation_type IN ('single', 'evolution', 'comparison')),
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 宠物人格档案表
      `CREATE TABLE IF NOT EXISTS pet_personas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id TEXT NOT NULL UNIQUE,
        profile_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 图像重新生成记录表
      `CREATE TABLE IF NOT EXISTS pet_image_regenerations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id TEXT NOT NULL,
        variation_count INTEGER DEFAULT 1,
        is_paid INTEGER DEFAULT 0,
        cost INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 系统事件记录表
      `CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        description TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 新手引导进度表
      `CREATE TABLE IF NOT EXISTS tutorial_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        current_stage TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        progress_data TEXT DEFAULT '{}',
        choices_data TEXT DEFAULT '{}',
        completed INTEGER DEFAULT 0,
        completed_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    try {
      for (const tableSQL of tables) {
        await this.exec(tableSQL);
      }
      // 运行迁移，确保旧库补上新列
      await this.ensureMigrations();
      logger.info('All enhanced database tables created successfully');
    } catch (error) {
      logger.error('Failed to create tables:', error);
      throw error;
    }
  }

  /**
   * 简单迁移：为旧库补充缺失列
   */
  async ensureMigrations() {
    try {
      const cols = await this.all(`PRAGMA table_info('adventure_events')`);
      const hasIsCompleted = Array.isArray(cols) && cols.some(c => c.name === 'is_completed');
      if (!hasIsCompleted) {
        await this.run(`ALTER TABLE adventure_events ADD COLUMN is_completed INTEGER DEFAULT 0`);
        logger.info('Migration: added is_completed to adventure_events');
      }
    } catch (e) {
      logger.warn('Migration ensureMigrations encountered error (may be benign on fresh DB):', e.message || e);
    }
  }

  /**
   * 执行SQL语句
   */
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 执行查询语句
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 执行查询所有语句
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 执行插入/更新语句
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * 获取增强版数据库统计信息
   */
  async getEnhancedStats() {
    const stats = {};
    
    const tables = [
      'users', 'pets', 'pet_traits', 'pet_behaviors', 
      'player_activity', 'adventure_logs', 'battle_logs',
      'adventure_events', 'pet_encounters', 'mythology_awakenings',
      'chat_history', 'pet_images', 'pet_personas', 'pet_image_regenerations', 'system_events', 'tutorial_progress'
    ];
    
    for (const table of tables) {
      try {
        const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = result.count;
      } catch (error) {
        stats[table] = 0;
      }
    }

    // 获取稀有度分布
    try {
      const rarityStats = await this.all(`
        SELECT rarity, COUNT(*) as count 
        FROM pets 
        GROUP BY rarity 
        ORDER BY 
          CASE rarity 
            WHEN 'SSS' THEN 5 
            WHEN 'SSR' THEN 4 
            WHEN 'SR' THEN 3 
            WHEN 'R' THEN 2 
            WHEN 'N' THEN 1 
          END DESC
      `);
      stats.rarity_distribution = rarityStats;
    } catch (error) {
      stats.rarity_distribution = [];
    }

    // 获取活动点数状态
    try {
      const activityStatus = await this.get(`
        SELECT 
          activity_points,
          max_points,
          total_consumed,
          last_recovery
        FROM player_activity 
        WHERE player_id = 'default'
      `);
      stats.activity_status = activityStatus || {
        activity_points: 100,
        max_points: 100,
        total_consumed: 0,
        last_recovery: new Date().toISOString()
      };
    } catch (error) {
      stats.activity_status = {
        activity_points: 100,
        max_points: 100,
        total_consumed: 0,
        last_recovery: new Date().toISOString()
      };
    }
    
    return stats;
  }

  /**
   * 事务支持
   */
  beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  commit() {
    return this.run('COMMIT');
  }

  rollback() {
    return this.run('ROLLBACK');
  }

  /**
   * 关闭数据库连接
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Enhanced database close error:', err);
            reject(err);
          } else {
            logger.info('Enhanced database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = EnhancedDatabase;