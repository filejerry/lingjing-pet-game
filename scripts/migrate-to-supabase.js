/**
 * SQLite → Supabase 数据迁移工具
 * 将现有SQLite数据迁移到Supabase PostgreSQL
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const SupabaseDatabase = require('../src/models/SupabaseDatabase');
const path = require('path');
const fs = require('fs');

// 迁移配置
const SQLITE_PATH = process.env.SQLITE_DB_PATH || './data/pets.db';
const BATCH_SIZE = 100; // 批量插入大小

// 需要迁移的表(按依赖顺序)
const TABLES_TO_MIGRATE = [
  'users',
  'pet_species',
  'pets',
  'pet_lore',
  'pet_traits',
  'story_templates',
  'adventure_events',
  'game_config'
];

class DataMigration {
  constructor() {
    this.sqliteDb = null;
    this.supabaseDb = null;
    this.stats = {
      tablesProcessed: 0,
      totalRows: 0,
      errors: []
    };
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    console.log('📦 初始化数据库连接...\n');

    // 检查SQLite数据库是否存在
    if (!fs.existsSync(SQLITE_PATH)) {
      throw new Error(`SQLite数据库文件不存在: ${SQLITE_PATH}`);
    }

    // 连接SQLite
    this.sqliteDb = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) throw new Error('SQLite连接失败: ' + err.message);
    });
    console.log('✅ SQLite 连接成功');

    // 连接Supabase
    this.supabaseDb = new SupabaseDatabase();
    await this.supabaseDb.initialize();
    console.log('✅ Supabase 连接成功\n');
  }

  /**
   * 从SQLite查询所有数据
   */
  async querySQLite(sql) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 获取表的列信息
   */
  async getTableColumns(tableName) {
    const rows = await this.querySQLite(`PRAGMA table_info(${tableName})`);
    return rows.map(row => row.name);
  }

  /**
   * 转换数据类型 (SQLite → PostgreSQL)
   */
  convertValue(value, columnName) {
    // NULL值直接返回
    if (value === null || value === undefined) {
      return null;
    }

    // JSON字段处理
    const jsonColumns = [
      'game_progress', 'settings', 'special_traits',
      'base_stats', 'evolution_paths', 'trigger_conditions',
      'variables', 'choices_made', 'outcomes', 'event_data',
      'ai_prompt_settings', 'stats_before', 'stats_after',
      'player_choices', 'response_data'
    ];

    if (jsonColumns.includes(columnName)) {
      if (typeof value === 'string') {
        try {
          // 验证是否为有效JSON
          JSON.parse(value);
          return value;
        } catch (e) {
          // 如果不是有效JSON,包装成对象
          return JSON.stringify({ value });
        }
      }
      return JSON.stringify(value);
    }

    // 布尔值处理
    if (typeof value === 'number' && columnName.startsWith('is_')) {
      return value === 1;
    }

    return value;
  }

  /**
   * 迁移单个表
   */
  async migrateTable(tableName) {
    console.log(`\n📋 开始迁移表: ${tableName}`);
    console.log('─'.repeat(50));

    try {
      // 1. 获取列信息
      const columns = await this.getTableColumns(tableName);
      console.log(`   列数: ${columns.length}`);

      // 2. 查询所有数据
      const rows = await this.querySQLite(`SELECT * FROM ${tableName}`);
      console.log(`   行数: ${rows.length}`);

      if (rows.length === 0) {
        console.log(`   ⚠️  表为空,跳过迁移`);
        return { tableName, rows: 0, success: true };
      }

      // 3. 转换数据
      const convertedRows = rows.map(row => {
        const converted = {};
        columns.forEach(col => {
          converted[col] = this.convertValue(row[col], col);
        });
        return converted;
      });

      // 4. 批量插入到Supabase
      let insertedCount = 0;
      for (let i = 0; i < convertedRows.length; i += BATCH_SIZE) {
        const batch = convertedRows.slice(i, i + BATCH_SIZE);

        try {
          // 构建批量插入SQL
          const values = batch.map(row => {
            const vals = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val;
              // 字符串和JSON需要转义
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            return `(${vals.join(',')})`;
          });

          const sql = `
            INSERT INTO ${tableName} (${columns.join(',')})
            VALUES ${values.join(',')}
            ON CONFLICT DO NOTHING
          `;

          await this.supabaseDb.query(sql);
          insertedCount += batch.length;

          // 进度显示
          const progress = Math.round((insertedCount / rows.length) * 100);
          process.stdout.write(`\r   进度: ${insertedCount}/${rows.length} (${progress}%)`);
        } catch (error) {
          console.error(`\n   ❌ 批次插入失败:`, error.message);
          this.stats.errors.push({
            table: tableName,
            error: error.message,
            batch: i / BATCH_SIZE
          });
        }
      }

      console.log(`\n   ✅ 迁移完成: ${insertedCount}/${rows.length} 行`);
      this.stats.totalRows += insertedCount;
      this.stats.tablesProcessed++;

      return { tableName, rows: insertedCount, success: true };
    } catch (error) {
      console.error(`\n   ❌ 表迁移失败:`, error.message);
      this.stats.errors.push({
        table: tableName,
        error: error.message
      });
      return { tableName, rows: 0, success: false, error: error.message };
    }
  }

  /**
   * 执行完整迁移
   */
  async migrate() {
    console.log('═'.repeat(60));
    console.log('  《灵境斗宠录》数据迁移工具');
    console.log('  SQLite → Supabase PostgreSQL');
    console.log('═'.repeat(60));
    console.log('');

    const startTime = Date.now();
    const results = [];

    try {
      // 初始化连接
      await this.initialize();

      // 检查源数据库表
      console.log('📊 检查源数据库...');
      const tables = await this.querySQLite(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      console.log(`   找到 ${tables.length} 个表\n`);

      // 按顺序迁移每个表
      for (const tableName of TABLES_TO_MIGRATE) {
        const tableExists = tables.some(t => t.name === tableName);
        if (tableExists) {
          const result = await this.migrateTable(tableName);
          results.push(result);
        } else {
          console.log(`\n⚠️  表 ${tableName} 在源数据库中不存在,跳过`);
        }
      }

      // 迁移统计
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('\n');
      console.log('═'.repeat(60));
      console.log('  📊 迁移统计报告');
      console.log('═'.repeat(60));
      console.log(`  ⏱️  总耗时: ${elapsed}秒`);
      console.log(`  📋 处理表数: ${this.stats.tablesProcessed}/${TABLES_TO_MIGRATE.length}`);
      console.log(`  📝 迁移行数: ${this.stats.totalRows}`);
      console.log(`  ✅ 成功: ${results.filter(r => r.success).length} 个表`);
      console.log(`  ❌ 失败: ${results.filter(r => !r.success).length} 个表`);
      console.log('');

      // 详细结果
      console.log('  详细结果:');
      results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        const info = result.success
          ? `${result.rows} 行`
          : `错误: ${result.error}`;
        console.log(`    ${icon} ${result.tableName.padEnd(25)} ${info}`);
      });

      // 错误汇总
      if (this.stats.errors.length > 0) {
        console.log('\n  ⚠️  错误详情:');
        this.stats.errors.forEach((err, idx) => {
          console.log(`    ${idx + 1}. [${err.table}] ${err.error}`);
        });
      }

      console.log('');
      console.log('═'.repeat(60));

      if (results.every(r => r.success)) {
        console.log('  🎉 数据迁移全部完成!');
        console.log('═'.repeat(60));
        console.log('');
        console.log('  🚀 下一步:');
        console.log('    1. 修改 .env 配置: DATABASE_TYPE=supabase');
        console.log('    2. 测试连接: npm run test:supabase');
        console.log('    3. 启动应用: npm start');
        console.log('    4. 部署到Vercel: vercel --prod');
        console.log('');
      } else {
        console.log('  ⚠️  迁移过程中出现错误,请检查日志');
        console.log('═'.repeat(60));
        console.log('');
      }

    } catch (error) {
      console.error('\n❌ 迁移过程出现致命错误:', error);
      console.error(error.stack);
      process.exit(1);
    } finally {
      // 关闭连接
      await this.cleanup();
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    console.log('🧹 清理资源...');

    if (this.sqliteDb) {
      await new Promise((resolve) => {
        this.sqliteDb.close(() => {
          console.log('   ✅ SQLite 连接已关闭');
          resolve();
        });
      });
    }

    if (this.supabaseDb) {
      await this.supabaseDb.close();
      console.log('   ✅ Supabase 连接已关闭');
    }

    console.log('');
  }
}

// 主函数
async function main() {
  // 检查环境配置
  if (!process.env.SUPABASE_DB_URL) {
    console.error('❌ 错误: 未设置 SUPABASE_DB_URL 环境变量');
    console.error('请先配置 .env 文件,参考 .env.example.supabase');
    process.exit(1);
  }

  // 确认迁移操作
  console.log('⚠️  警告: 此操作将向Supabase数据库写入数据');
  console.log(`   源数据库: ${SQLITE_PATH}`);
  console.log(`   目标数据库: ${process.env.SUPABASE_URL || 'Supabase'}`);
  console.log('');

  // 在生产环境需要确认
  if (process.env.NODE_ENV === 'production') {
    console.log('按 Ctrl+C 取消,或等待5秒后自动开始...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const migration = new DataMigration();
  await migration.migrate();
}

// 运行迁移
main().catch(console.error);
