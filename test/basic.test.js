/**
 * 基础功能测试
 */

const Database = require('../src/models/Database');
const AIService = require('../src/ai/AIService');
const AIEngine = require('../src/ai/AIEngine');
const PetManager = require('../src/game/PetManager');

describe('灵境斗宠录 - 基础功能测试', () => {
  let db, aiService, aiEngine, petManager;
  
  beforeAll(async () => {
    // 使用内存数据库进行测试
    process.env.DB_PATH = ':memory:';
    
    db = new Database();
    await db.initialize();
    
    aiService = new AIService();
    aiEngine = new AIEngine(aiService);
    petManager = new PetManager(db, aiEngine);
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  test('数据库初始化', async () => {
    const stats = await db.getStats();
    expect(stats).toBeDefined();
    expect(stats.users).toBe(0);
    expect(stats.pets).toBe(0);
  });

  test('AI服务状态检查', () => {
    const status = aiService.getStatus();
    expect(status).toBeDefined();
    expect(typeof status.configured).toBe('boolean');
    expect(typeof status.cacheSize).toBe('number');
  });

  test('创建宠物', async () => {
    const testUserId = 'test-user-001';
    
    // 先创建用户
    await db.run(
      'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [testUserId, 'testuser', 'test@example.com', 'hashed_password']
    );

    const pet = await petManager.createPet(testUserId, '测试宠物');
    
    expect(pet).toBeDefined();
    expect(pet.name).toBe('测试宠物');
    expect(pet.user_id).toBe(testUserId);
    expect(pet.hp).toBeGreaterThan(0);
    expect(pet.attack).toBeGreaterThan(0);
  });

  test('宠物行为处理', async () => {
    const pets = await db.all('SELECT * FROM pets LIMIT 1');
    if (pets.length === 0) return;

    const pet = pets[0];
    const result = await petManager.processPlayerAction(pet.id, 'feed', '熔岩果');
    
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
  });

  test('AI引擎关键词提取', () => {
    const keywords = aiEngine.extractKeywords('feed', '熔岩果');
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords).toContain('火焰');
  });
});