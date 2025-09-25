/**
 * 数据库模型 - SQLite数据库管理
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './data/game.db';
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      // 确保数据目录存在
      const fs = require('fs');
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Database connection failed:', err);
          reject(err);
        } else {
          logger.info('Database connected successfully');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * 创建所有数据表
   */
  async createTables() {
    const tables = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      // 宠物基础信息表
      `CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        base_prompt TEXT NOT NULL,
        hp INTEGER DEFAULT 100,
        attack INTEGER DEFAULT 20,
        defense INTEGER DEFAULT 15,
        speed INTEGER DEFAULT 10,
        magic INTEGER DEFAULT 10,
        resistance INTEGER DEFAULT 10,
        element_type TEXT DEFAULT 'neutral',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_evolution DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // 宠物词条表
      `CREATE TABLE IF NOT EXISTS pet_traits (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        trait_name TEXT NOT NULL,
        trait_type TEXT NOT NULL CHECK (trait_type IN ('attack', 'defense', 'special', 'passive')),
        effect_value INTEGER NOT NULL,
        effect_description TEXT,
        special_mechanism TEXT,
        is_negative BOOLEAN DEFAULT 0,
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
        keywords_added TEXT, -- JSON格式存储
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 冒险事件表
      `CREATE TABLE IF NOT EXISTS adventure_events (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_title TEXT NOT NULL,
        event_description TEXT NOT NULL,
        rewards TEXT, -- JSON格式存储奖励
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        FOREIGN KEY (pet_id) REFERENCES pets (id)
      )`,

      // 宠物相遇记录表
      `CREATE TABLE IF NOT EXISTS pet_encounters (
        id TEXT PRIMARY KEY,
        pet1_id TEXT NOT NULL,
        pet2_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        encounter_description TEXT NOT NULL,
        rewards TEXT, -- JSON格式存储双方奖励
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet1_id) REFERENCES pets (id),
        FOREIGN KEY (pet2_id) REFERENCES pets (id)
      )`,

      // 战斗记录表
      `CREATE TABLE IF NOT EXISTS battle_records (
        id TEXT PRIMARY KEY,
        attacker_id TEXT NOT NULL,
        defender_id TEXT NOT NULL,
        battle_log TEXT NOT NULL, -- JSON格式存储战斗过程
        winner_id TEXT,
        battle_type TEXT DEFAULT 'pve',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attacker_id) REFERENCES pets (id),
        FOREIGN KEY (defender_id) REFERENCES pets (id)
      )`,

      // 游戏配置表
      `CREATE TABLE IF NOT EXISTS game_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }

    // 插入默认配置
    await this.insertDefaultConfig();
    
    logger.info('All database tables created successfully');
  }

  /**
   * 插入默认游戏配置
   */
  async insertDefaultConfig() {
    const defaultConfigs = [
      ['evolution_check_interval', '3600000', '进化检查间隔(毫秒)'],
      ['adventure_min_duration', '1800000', '最短冒险时间(毫秒)'],
      ['encounter_probability', '0.3', '宠物相遇概率'],
      ['max_traits_per_type', '{"attack":5,"defense":5,"special":3,"passive":8}', '每种类型词条上限'],
      ['element_advantages', '{"fire":["nature","ice"],"water":["fire","earth"],"earth":["air","water"],"air":["earth","fire"],"light":["dark"],"dark":["light"],"nature":["earth","air"],"chaos":["all"]}', '元素克制关系']
    ];

    for (const [key, value, description] of defaultConfigs) {
      await this.run(
        'INSERT OR IGNORE INTO game_config (key, value, description) VALUES (?, ?, ?)',
        [key, value, description]
      );
    }
  }

  /**
   * 执行SQL语句
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database run error:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * 查询单条记录
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database get error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 查询多条记录
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database all error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 开始事务
   */
  beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  /**
   * 提交事务
   */
  commit() {
    return this.run('COMMIT');
  }

  /**
   * 回滚事务
   */
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
            logger.error('Database close error:', err);
            reject(err);
          } else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取数据库统计信息
   */
  async getStats() {
    const stats = {};
    
    const tables = ['users', 'pets', 'pet_traits', 'pet_behaviors', 'adventure_events'];
    
    for (const table of tables) {
      const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result.count;
    }
    
    return stats;
  }
}

module.exports = Database;