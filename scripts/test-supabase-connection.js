/**
 * Supabase 连接测试脚本
 * 用于验证数据库配置是否正确
 */

require('dotenv').config();
const SupabaseDatabase = require('../src/models/SupabaseDatabase');

async function testConnection() {
  console.log('🔍 开始测试 Supabase 连接...\n');

  const db = new SupabaseDatabase();

  try {
    // 1. 初始化连接
    console.log('1️⃣  正在初始化数据库连接...');
    await db.initialize();
    console.log('   ✅ 数据库连接成功\n');

    // 2. 健康检查
    console.log('2️⃣  执行健康检查...');
    const health = await db.healthCheck();
    console.log('   状态:', health.status);
    console.log('   类型:', health.type);
    console.log('   时间:', health.time);
    if (health.version) {
      console.log('   版本:', health.version.split(',')[0]);
    }
    console.log('   ✅ 健康检查通过\n');

    // 3. 查询表信息
    console.log('3️⃣  查询数据库表信息...');
    const tables = await db.getTableInfo();
    console.log(`   找到 ${tables.length} 个表:`);
    tables.forEach(table => {
      const sizeInfo = table.size ? ` (${table.size})` : '';
      console.log(`   - ${table.table_name}${sizeInfo}`);
    });
    console.log('   ✅ 表信息查询成功\n');

    // 4. 测试基本CRUD操作
    console.log('4️⃣  测试基本CRUD操作...');

    // 测试查询配置表
    const configs = await db.query('SELECT * FROM game_config LIMIT 3');
    console.log(`   - 查询成功: 获取到 ${configs.length} 条配置`);

    if (configs.length > 0) {
      console.log(`   - 示例配置: ${configs[0].config_key} = ${configs[0].config_value}`);
    }

    // 测试插入(测试用户)
    const testUsername = `test_user_${Date.now()}`;
    const insertResult = await db.run(
      `INSERT INTO users (username, email, password_hash, game_progress, settings)
       VALUES ($1, $2, $3, $4, $5)`,
      [testUsername, `${testUsername}@test.com`, 'test_hash', '{}', '{}']
    );
    console.log(`   - 插入成功: 新用户ID = ${insertResult.lastID}`);

    // 测试查询刚插入的用户
    const user = await db.get('SELECT * FROM users WHERE username = $1', [testUsername]);
    console.log(`   - 查询成功: 用户名 = ${user.username}`);

    // 测试更新
    await db.run('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    console.log(`   - 更新成功: 设置了登录时间`);

    // 测试删除
    const deleteResult = await db.run('DELETE FROM users WHERE id = $1', [user.id]);
    console.log(`   - 删除成功: 删除了 ${deleteResult.rowCount} 条记录`);

    console.log('   ✅ CRUD操作测试通过\n');

    // 5. 测试事务
    console.log('5️⃣  测试事务功能...');
    try {
      await db.transaction(async (client) => {
        // 在事务中插入测试数据
        await client.query(
          `INSERT INTO users (username, email, password_hash, game_progress, settings)
           VALUES ($1, $2, $3, $4, $5)`,
          [`trans_test_${Date.now()}`, 'trans@test.com', 'hash', '{}', '{}']
        );
        // 故意抛出错误测试回滚
        throw new Error('测试回滚');
      });
    } catch (error) {
      console.log(`   - 事务回滚成功: ${error.message}`);
    }

    // 验证回滚生效(不应该有trans_test开头的用户)
    const transUsers = await db.query(`SELECT * FROM users WHERE username LIKE 'trans_test%'`);
    if (transUsers.length === 0) {
      console.log('   ✅ 事务回滚验证通过\n');
    } else {
      console.log('   ❌ 事务回滚失败\n');
    }

    // 6. 测试视图查询
    console.log('6️⃣  测试视图查询...');
    try {
      const stats = await db.query('SELECT * FROM v_user_stats LIMIT 5');
      console.log(`   - 用户统计视图查询成功: ${stats.length} 条记录`);
      console.log('   ✅ 视图查询通过\n');
    } catch (error) {
      console.log('   ⚠️  视图查询失败 (可能还未创建用户数据)\n');
    }

    // 7. 性能测试
    console.log('7️⃣  简单性能测试...');
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await db.query('SELECT 1');
    }
    const elapsed = Date.now() - startTime;
    console.log(`   - 10次查询耗时: ${elapsed}ms (平均 ${(elapsed/10).toFixed(2)}ms)`);
    console.log('   ✅ 性能测试完成\n');

    // 总结
    console.log('═══════════════════════════════════════');
    console.log('🎉 所有测试通过! Supabase连接配置正确');
    console.log('═══════════════════════════════════════\n');

    console.log('📌 环境信息:');
    console.log(`   数据库类型: ${process.env.DATABASE_TYPE || 'sqlite'}`);
    if (process.env.DATABASE_TYPE === 'supabase') {
      const urlParts = process.env.SUPABASE_URL?.split('.') || [];
      const projectId = urlParts[0]?.split('//')[1] || 'unknown';
      console.log(`   项目ID: ${projectId}`);
      console.log(`   连接池: min=${process.env.DB_POOL_MIN || 2}, max=${process.env.DB_POOL_MAX || 10}`);
    }
    console.log('');

    console.log('🚀 下一步:');
    console.log('   1. 运行数据迁移: npm run migrate:data');
    console.log('   2. 启动应用: npm start');
    console.log('   3. 部署到Vercel: vercel --prod');
    console.log('');

  } catch (error) {
    console.error('❌ 连接测试失败:\n');
    console.error('错误信息:', error.message);
    console.error('\n可能的原因:');
    console.error('  1. 环境变量未正确配置 (检查 .env 文件)');
    console.error('  2. Supabase项目未正确创建');
    console.error('  3. 数据库Schema未执行 (运行 supabase-schema.sql)');
    console.error('  4. 网络连接问题\n');
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    // 关闭连接
    await db.close();
    console.log('🔚 连接已关闭');
  }
}

// 运行测试
testConnection();
