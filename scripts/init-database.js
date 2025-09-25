/**
 * 数据库初始化脚本
 */

require('dotenv').config();
const Database = require('../src/models/Database');
const logger = require('../src/utils/logger');

async function initializeDatabase() {
  const db = new Database();
  
  try {
    logger.info('Starting database initialization...');
    
    await db.initialize();
    
    // 插入一些测试数据
    await insertTestData(db);
    
    logger.info('Database initialization completed successfully!');
    
    // 显示统计信息
    const stats = await db.getStats();
    console.log('\n📊 Database Statistics:');
    console.table(stats);
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

async function insertTestData(db) {
  logger.info('Inserting test data...');
  
  // 创建测试用户
  const testUserId = 'test-user-001';
  await db.run(
    'INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
    [testUserId, 'testuser', 'test@example.com', 'hashed_password']
  );
  
  // 创建示例宠物
  const petId = 'demo-pet-001';
  await db.run(
    `INSERT OR IGNORE INTO pets (id, user_id, name, base_prompt, hp, attack, defense, speed, magic, resistance, element_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      petId, 
      testUserId, 
      '小火龙', 
      '一只充满活力的小火龙，身上散发着温暖的火焰气息。它对世界充满好奇，总是eager to explore。',
      100, 25, 18, 15, 12, 10, 'fire'
    ]
  );
  
  // 添加示例词条
  await db.run(
    `INSERT OR IGNORE INTO pet_traits (id, pet_id, trait_name, trait_type, effect_value, effect_description, special_mechanism)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'trait-001',
      petId,
      '火焰之心',
      'attack',
      15,
      '火属性攻击力提升',
      null
    ]
  );
  
  logger.info('Test data inserted successfully');
}

// 运行初始化
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };