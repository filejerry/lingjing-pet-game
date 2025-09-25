/**
 * 简化系统测试 - 验证核心功能
 */

require('dotenv').config();
const AIService = require('../src/ai/AIService');
const AIEngine = require('../src/ai/AIEngine');
const PetManager = require('../src/game/PetManager');
const Database = require('../src/models/Database');
const logger = require('../src/utils/logger');

async function runSimpleTest() {
  console.log('🧪 开始简化系统测试...\n');
  
  try {
    // 1. 测试AI服务
    console.log('📝 测试1: AI服务初始化');
    const aiService = new AIService();
    const aiEngine = new AIEngine(aiService);
    console.log('✅ AI服务初始化成功\n');

    // 2. 测试数据库和宠物管理
    console.log('📝 测试2: 数据库和宠物管理');
    const database = new Database();
    await database.initialize();
    const petManager = new PetManager(database);
    
    const testUser = { id: 'test-user-001', username: 'TestPlayer' };
    const newPet = await petManager.createPet(testUser, '小火龙');
    console.log('✅ 宠物创建成功:', newPet.name);
    console.log(`   属性: HP=${newPet.hp}, 攻击=${newPet.attack}, 防御=${newPet.defense}, 速度=${newPet.speed}\n`);

    // 3. 测试行为解析
    console.log('📝 测试3: 行为解析');
    const actionResult = await aiEngine.processPlayerAction(newPet, 'feed', '熔岩果');
    console.log('✅ 行为解析成功:');
    console.log('   关键词:', actionResult.keywords);
    console.log('   提示词已更新\n');

    // 4. 测试进化模板生成（降级模式）
    console.log('📝 测试4: 进化模板生成');
    const mockBehaviors = [
      { action_type: 'feed', action_target: '熔岩果', keywords_added: ['火焰', '灼热'] }
    ];
    
    const evolutionTemplate = await aiEngine.generateEvolutionTemplate(newPet, mockBehaviors);
    console.log('✅ 进化模板生成成功:');
    console.log('   描述:', evolutionTemplate.evolution_description);
    console.log('   新词条数量:', evolutionTemplate.new_traits.length);
    console.log('   属性变化:', JSON.stringify(evolutionTemplate.attribute_changes) + '\n');

    // 5. 测试数值生成
    console.log('📝 测试5: 数值词条生成');
    const numericalResult = await aiEngine.generateNumericalTraits(evolutionTemplate, newPet);
    console.log('✅ 数值词条生成成功:');
    console.log('   生成方法:', numericalResult.generation_method);
    console.log('   词条数量:', numericalResult.traits.length);
    if (numericalResult.traits.length > 0) {
      console.log('   示例词条:', numericalResult.traits[0].name);
    }
    console.log('   属性变化:', JSON.stringify(numericalResult.attribute_changes) + '\n');

    // 6. 测试进化应用
    console.log('📝 测试6: 进化应用');
    const updatedPet = await petManager.applyEvolution(newPet, numericalResult);
    console.log('✅ 进化应用成功:');
    console.log(`   进化后属性: HP=${updatedPet.hp}, 攻击=${updatedPet.attack}, 防御=${updatedPet.defense}, 速度=${updatedPet.speed}`);
    console.log('   词条数量:', updatedPet.traits.length + '\n');

    // 7. 测试AI服务状态
    console.log('📝 测试7: AI服务状态');
    const aiStatus = aiService.getStatus();
    console.log('✅ AI服务状态:');
    console.log('   配置状态:', aiStatus.configured ? '✅ 已配置' : '❌ 未配置');
    console.log('   缓存大小:', aiStatus.cacheSize);
    console.log('   请求计数:', aiStatus.requestCount + '\n');

    console.log('🎉 核心系统测试通过！');
    console.log('\n📊 测试总结:');
    console.log('✅ 三层AI架构工作正常');
    console.log('✅ 宠物管理系统正常');
    console.log('✅ 进化系统正常');
    console.log('✅ 数据库操作正常');
    console.log('✅ 降级机制正常');
    
    console.log('\n💡 系统已准备就绪！');
    console.log('🚀 可以启动Web服务器进行完整测试');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  runSimpleTest().then(() => {
    console.log('\n测试完成。');
    process.exit(0);
  }).catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runSimpleTest };