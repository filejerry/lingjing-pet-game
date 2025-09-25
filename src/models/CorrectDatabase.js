/**
 * 修正版数据库 - 支持正确的三层AI架构
 * 使用sqlite3替代better-sqlite3以避免依赖问题
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class CorrectDatabase {
  constructor() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'correct_pets.db');
    this.db = new sqlite3.Database(dbPath);
    
    // 启用外键约束
    this.db.run('PRAGMA foreign_keys = ON');
    this.db.run('PRAGMA journal_mode = WAL');
  }

  async init() {
    try {
      await this.createTables();
      logger.info('Correct database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize correct database:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      // 宠物基础表
      `CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        base_prompt TEXT NOT NULL,
        hp INTEGER DEFAULT 50,
        attack INTEGER DEFAULT 10,
        defense INTEGER DEFAULT 8,
        speed INTEGER DEFAULT 12,
        magic INTEGER DEFAULT 10,
        rarity TEXT DEFAULT 'N' CHECK (rarity IN ('N', 'R', 'SR', 'SSR', 'SSS')),
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        max_experience INTEGER DEFAULT 100,
        element_type TEXT DEFAULT 'neutral',
        pet_type TEXT DEFAULT 'unknown',
        appearance TEXT DEFAULT '',
        personality TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_l2_evolution DATETIME
      )`,

      `CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pets_is_active ON pets(is_active)`,

      // L1层：行为记录表
      `CREATE TABLE IF NOT EXISTS pet_behaviors (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        target TEXT NOT NULL,
        context TEXT,
        timestamp DATETIME NOT NULL,
        processed_by_l3 INTEGER DEFAULT 0,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_behaviors_pet_processed ON pet_behaviors(pet_id, processed_by_l3)`,
      `CREATE INDEX IF NOT EXISTS idx_behaviors_timestamp ON pet_behaviors(timestamp)`,

      // L3层：智能体判断记录表
      `CREATE TABLE IF NOT EXISTS pet_l3_judgments (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        behavior_count INTEGER NOT NULL,
        accumulated_weight REAL NOT NULL,
        should_trigger_l2 INTEGER NOT NULL,
        judgment_data TEXT,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_l3_judgments_pet_time ON pet_l3_judgments(pet_id, timestamp)`,

      // L2层：提示词进化记录表
      `CREATE TABLE IF NOT EXISTS pet_l2_evolutions (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        old_prompt TEXT NOT NULL,
        new_prompt TEXT NOT NULL,
        evolution_content TEXT,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_l2_evolutions_pet_time ON pet_l2_evolutions(pet_id, timestamp)`,

      // L3层：词缀固化表
      `CREATE TABLE IF NOT EXISTS pet_traits (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        trait_name TEXT NOT NULL,
        trait_type TEXT NOT NULL CHECK (trait_type IN ('passive', 'active', 'trigger')),
        effect_description TEXT NOT NULL,
        numerical_effect TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_traits_pet_active ON pet_traits(pet_id, is_active)`,

      // 战斗记录表
      `CREATE TABLE IF NOT EXISTS battle_records (
        id TEXT PRIMARY KEY,
        pet1_id TEXT NOT NULL,
        pet2_id TEXT,
        battle_type TEXT NOT NULL,
        winner_id TEXT,
        battle_log TEXT,
        rewards TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet1_id) REFERENCES pets (id),
        FOREIGN KEY (pet2_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_battles_pet1_time ON battle_records(pet1_id, timestamp)`,

      // 冒险事件表
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

      `CREATE INDEX IF NOT EXISTS idx_adventures_pet_status ON adventure_events(pet_id, status)`,

      // 宠物相遇表
      `CREATE TABLE IF NOT EXISTS pet_encounters (
        id TEXT PRIMARY KEY,
        pet1_id TEXT NOT NULL,
        pet2_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        encounter_story TEXT NOT NULL,
        interaction_result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet1_id) REFERENCES pets (id),
        FOREIGN KEY (pet2_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_encounters_pet1_time ON pet_encounters(pet1_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_encounters_pet2_time ON pet_encounters(pet2_id, created_at)`,

      // 聊天记录表
      `CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        user_message TEXT NOT NULL,
        pet_response TEXT NOT NULL,
        chat_level TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_chat_pet_time ON chat_history(pet_id, timestamp)`,

      // 用户活动点数表
      `CREATE TABLE IF NOT EXISTS user_activity_points (
        user_id TEXT PRIMARY KEY,
        current_points INTEGER DEFAULT 100,
        max_points INTEGER DEFAULT 100,
        last_recovery DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_spent INTEGER DEFAULT 0
      )`,

      // 激活码表
      `CREATE TABLE IF NOT EXISTS activation_codes (
        code TEXT PRIMARY KEY,
        value INTEGER NOT NULL,
        is_used INTEGER DEFAULT 0,
        used_by TEXT,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE INDEX IF NOT EXISTS idx_codes_used ON activation_codes(is_used)`,

      // 宠物性格表
      `CREATE TABLE IF NOT EXISTS pet_personalities (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL UNIQUE,
        personality_data TEXT NOT NULL,
        personality_type TEXT,
        last_interaction_type TEXT,
        interaction_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_personalities_pet ON pet_personalities(pet_id)`,
      `CREATE INDEX IF NOT EXISTS idx_personalities_type ON pet_personalities(personality_type)`,

      // 性格演化历史表
      `CREATE TABLE IF NOT EXISTS personality_evolution (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        old_type TEXT,
        new_type TEXT,
        trigger_type TEXT,
        impact_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_evolution_pet ON personality_evolution(pet_id)`,
      `CREATE INDEX IF NOT EXISTS idx_evolution_time ON personality_evolution(created_at)`
    ];

    for (const tableSQL of tables) {
      await this.exec(tableSQL);
    }

    logger.info('All correct database tables created successfully');
  }

  // Promise化的数据库操作方法
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(error) {
        if (error) {
          logger.error('Database run error:', error);
          reject(error);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (error, row) => {
        if (error) {
          logger.error('Database get error:', error);
          reject(error);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error) {
          logger.error('Database all error:', error);
          reject(error);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (error) => {
        if (error) {
          logger.error('Database exec error:', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // 事务支持
  beginTransaction() {
    return this.exec('BEGIN TRANSACTION');
  }

  commit() {
    return this.exec('COMMIT');
  }

  rollback() {
    return this.exec('ROLLBACK');
  }

  // 获取数据库统计信息
  async getStats() {
    const stats = {};
    
    const tables = [
      'pets', 'pet_behaviors', 'pet_l3_judgments', 'pet_l2_evolutions', 
      'pet_traits', 'battle_records', 'adventure_events', 'pet_encounters',
      'pet_personalities', 'personality_evolution'
    ];
    
    for (const table of tables) {
      try {
        const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = result ? result.count : 0;
      } catch (error) {
        stats[table] = 0;
      }
    }
    
    return stats;
  }

  // 清理过期数据
  async cleanup() {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30天前
    
    try {
      // 清理过期的行为记录
      await this.run(`
        DELETE FROM pet_behaviors 
        WHERE timestamp < ? AND processed_by_l3 = 1
      `, [cutoffDate.toISOString()]);
      
      // 清理过期的聊天记录
      await this.run(`
        DELETE FROM chat_history 
        WHERE timestamp < ?
      `, [cutoffDate.toISOString()]);
      
      logger.info('Database cleanup completed');
    } catch (error) {
      logger.error('Database cleanup failed:', error);
    }
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((error) => {
          if (error) {
            logger.error('Database close error:', error);
          } else {
            logger.info('Correct database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = CorrectDatabase;