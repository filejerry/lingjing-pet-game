/**
 * Supabase数据库连接层
 * 支持 PostgreSQL (Supabase) 和 SQLite (本地开发)
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

class SupabaseDatabase {
  constructor() {
    this.pool = null;
    this.dbType = process.env.DATABASE_TYPE || 'sqlite';
    this.isSupabase = this.dbType === 'supabase';
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      if (this.isSupabase) {
        await this.initializeSupabase();
      } else {
        await this.initializeSQLite();
      }
      logger.info(`Database initialized successfully (Type: ${this.dbType})`);
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 初始化 Supabase PostgreSQL 连接
   */
  async initializeSupabase() {
    const connectionString = process.env.SUPABASE_DB_URL;

    if (!connectionString) {
      throw new Error('SUPABASE_DB_URL environment variable is not set');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Supabase 需要SSL连接
      },
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
    });

    // 测试连接
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      logger.info('Supabase connection test successful:', result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * 初始化 SQLite 连接 (本地开发备用)
   */
  async initializeSQLite() {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const fs = require('fs');

    const dbPath = process.env.SQLITE_DB_PATH || './data/pets.db';
    const dataDir = path.dirname(dbPath);

    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建SQLite连接
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('SQLite connection failed:', err);
        throw err;
      }
      logger.info('SQLite database connected');
    });
  }

  /**
   * 执行查询 (兼容 PostgreSQL 和 SQLite)
   * @param {string} sql - SQL查询语句
   * @param {array} params - 参数数组
   * @returns {Promise<array>} 查询结果
   */
  async query(sql, params = []) {
    if (this.isSupabase) {
      return await this.queryPostgreSQL(sql, params);
    } else {
      return await this.querySQLite(sql, params);
    }
  }

  /**
   * PostgreSQL 查询
   */
  async queryPostgreSQL(sql, params = []) {
    const client = await this.pool.connect();
    try {
      // 转换 SQLite 占位符 ? 为 PostgreSQL 占位符 $1, $2, ...
      let pgSql = sql;
      let pgParams = params;

      if (sql.includes('?')) {
        let index = 1;
        pgSql = sql.replace(/\?/g, () => `$${index++}`);
      }

      // 记录查询日志 (开发模式)
      if (process.env.LOG_SQL_QUERIES === 'true') {
        logger.debug('SQL Query:', { sql: pgSql, params: pgParams });
      }

      const result = await client.query(pgSql, pgParams);
      return result.rows;
    } catch (error) {
      logger.error('PostgreSQL query failed:', { sql, params, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * SQLite 查询
   */
  async querySQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('SQLite query failed:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 执行单条语句 (INSERT/UPDATE/DELETE)
   * @returns {Promise<object>} 返回受影响的行数和插入的ID
   */
  async run(sql, params = []) {
    if (this.isSupabase) {
      return await this.runPostgreSQL(sql, params);
    } else {
      return await this.runSQLite(sql, params);
    }
  }

  /**
   * PostgreSQL 执行
   */
  async runPostgreSQL(sql, params = []) {
    const client = await this.pool.connect();
    try {
      // 转换占位符
      let pgSql = sql;
      if (sql.includes('?')) {
        let index = 1;
        pgSql = sql.replace(/\?/g, () => `$${index++}`);
      }

      // 如果是 INSERT 语句,自动添加 RETURNING 子句获取插入的ID
      if (sql.trim().toUpperCase().startsWith('INSERT') && !sql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING id';
      }

      const result = await client.query(pgSql, params);

      return {
        rowCount: result.rowCount,
        lastID: result.rows.length > 0 ? result.rows[0].id : null,
        rows: result.rows
      };
    } catch (error) {
      logger.error('PostgreSQL execution failed:', { sql, params, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * SQLite 执行
   */
  async runSQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('SQLite execution failed:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve({
            rowCount: this.changes,
            lastID: this.lastID
          });
        }
      });
    });
  }

  /**
   * 查询单行数据
   */
  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 事务处理
   * @param {function} callback - 事务回调函数
   */
  async transaction(callback) {
    if (this.isSupabase) {
      return await this.transactionPostgreSQL(callback);
    } else {
      return await this.transactionSQLite(callback);
    }
  }

  /**
   * PostgreSQL 事务
   */
  async transactionPostgreSQL(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * SQLite 事务
   */
  async transactionSQLite(callback) {
    try {
      await this.runSQLite('BEGIN TRANSACTION');
      const result = await callback(this.db);
      await this.runSQLite('COMMIT');
      return result;
    } catch (error) {
      await this.runSQLite('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * 批量插入 (性能优化)
   * @param {string} table - 表名
   * @param {array} columns - 列名数组
   * @param {array} values - 值数组 [[v1,v2], [v3,v4], ...]
   */
  async batchInsert(table, columns, values) {
    if (this.isSupabase) {
      return await this.batchInsertPostgreSQL(table, columns, values);
    } else {
      return await this.batchInsertSQLite(table, columns, values);
    }
  }

  /**
   * PostgreSQL 批量插入
   */
  async batchInsertPostgreSQL(table, columns, values) {
    if (values.length === 0) return { rowCount: 0 };

    const client = await this.pool.connect();
    try {
      // 构建批量插入SQL
      // INSERT INTO table (col1, col2) VALUES ($1,$2),($3,$4),...
      const colStr = columns.join(',');
      const rowCount = columns.length;
      const valueStrs = [];
      const params = [];

      values.forEach((row, rowIndex) => {
        const rowParams = [];
        for (let i = 0; i < rowCount; i++) {
          const paramIndex = rowIndex * rowCount + i + 1;
          rowParams.push(`$${paramIndex}`);
          params.push(row[i]);
        }
        valueStrs.push(`(${rowParams.join(',')})`);
      });

      const sql = `INSERT INTO ${table} (${colStr}) VALUES ${valueStrs.join(',')}`;
      const result = await client.query(sql, params);

      return { rowCount: result.rowCount };
    } catch (error) {
      logger.error('Batch insert failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * SQLite 批量插入
   */
  async batchInsertSQLite(table, columns, values) {
    const colStr = columns.join(',');
    const placeholders = columns.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${colStr}) VALUES (${placeholders})`;

    let insertedCount = 0;
    for (const row of values) {
      try {
        await this.runSQLite(sql, row);
        insertedCount++;
      } catch (error) {
        logger.error('Batch insert row failed:', error);
      }
    }

    return { rowCount: insertedCount };
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    try {
      if (this.isSupabase && this.pool) {
        await this.pool.end();
        logger.info('Supabase connection pool closed');
      } else if (this.db) {
        await new Promise((resolve, reject) => {
          this.db.close((err) => {
            if (err) reject(err);
            else {
              logger.info('SQLite database closed');
              resolve();
            }
          });
        });
      }
    } catch (error) {
      logger.error('Error closing database:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      if (this.isSupabase) {
        const result = await this.query('SELECT NOW() as time, version() as version');
        return {
          status: 'healthy',
          type: 'PostgreSQL (Supabase)',
          time: result[0].time,
          version: result[0].version
        };
      } else {
        const result = await this.query('SELECT datetime("now") as time');
        return {
          status: 'healthy',
          type: 'SQLite',
          time: result[0].time
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * 获取表信息
   */
  async getTableInfo() {
    try {
      if (this.isSupabase) {
        const tables = await this.query(`
          SELECT table_name,
                 pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        return tables;
      } else {
        const tables = await this.query(`
          SELECT name as table_name
          FROM sqlite_master
          WHERE type='table'
          ORDER BY name
        `);
        return tables;
      }
    } catch (error) {
      logger.error('Failed to get table info:', error);
      return [];
    }
  }

  /**
   * 清理过期AI缓存 (定时任务调用)
   */
  async cleanExpiredAICache() {
    try {
      const result = await this.run('DELETE FROM ai_cache WHERE expires_at < NOW()');
      logger.info(`Cleaned ${result.rowCount} expired AI cache entries`);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to clean AI cache:', error);
      return 0;
    }
  }
}

module.exports = SupabaseDatabase;
