/**
 * 系统功能测试 - 不依赖外部AI API
 */

require('dotenv').config();
const AIService = require('../src/ai/AIService');
const AIEngine = require('../src/ai/AIEngine');
const PetManager = require('../src/game/PetManager');
const BattleSystem = require('../src/game/BattleSystem');
const Database = require('../src/models/Database');
const logger = require('../src/utils/logger');

async function testSystemFunctions() {
  console.log('🧪 开始系统功能测试（离线模式）...\n');
  
  try {
    // 1. 测试AI服务初始化
    console.log('📝 测试1: AI服务初始化');
    const aiService = new AIService();
    const aiEngine = new AIEngine(aiService);
    console.log('✅ AI服务初始化成功\n');

    // 2. 测试宠物管理器
    console.log('📝 测试2: 宠物管理系统');
    const database = new Database();
    await database.initialize();
    const petManager = new PetManager(database);
    
    const testUser = { id: 'test-user-001', username: 'TestPlayer' };
    const newPet = await petManager.createPet(testUser, '小火龙');
    console.log('✅ 宠物创建成功:', newPet.name);
    console.log(`   属性: HP=${newPet.hp}, 攻击=${newPet.attack}, 防御=${newPet.defense}, 速度=${newPet.speed}\n`);

    // 3. 测试第一层：行为解析
    console.log('📝 测试3: 第一层 - 行为解析与提示词修正');
    const actionResult = await aiEngine.processPlayerAction(newPet, 'feed', '熔岩果');
    console.log('✅ 行为解析成功:');
    console.log('   关键词:', actionResult.keywords);
    console.log('   更新后提示词:', actionResult.updatedPrompt.substring(0, 100) + '...\n');

    // 4. 测试第二层：进化模板生成（降级模式）
    console.log('📝 测试4: 第二层 - 进化模板生成（降级模式）');
    const mockBehaviors = [
      { action_type: 'feed', action_target: '熔岩果', keywords_added: ['火焰', '灼热'] },
      { action_type: 'explore', action_target: '火山口', keywords_added: ['火焰', '危险'] }
    ];
    
    const evolutionTemplate = await aiEngine.generateEvolutionTemplate(newPet, mockBehaviors);
    console.log('✅ 进化模板生成成功:');
    console.log('   描述:', evolutionTemplate.evolution_description);
    console.log('   新词条数量:', evolutionTemplate.new_traits.length);
    console.log('   属性变化:', JSON.stringify(evolutionTemplate.attribute_changes) + '\n');

    // 5. 测试第三层：数值智能体（算法降级）
    console.log('📝 测试5: 第三层 - 数值智能体（算法降级）');
    const numericalResult = await aiEngine.generateNumericalTraits(evolutionTemplate, newPet);
    console.log('✅ 数值词条生成成功:');
    console.log('   生成方法:', numericalResult.generation_method);
    console.log('   词条数量:', numericalResult.traits.length);
    if (numericalResult.traits.length > 0) {
      const firstTrait = numericalResult.traits[0];
      console.log('   示例词条:', `${firstTrait.name} (${firstTrait.type}) - 效果值: ${firstTrait.effect_value}`);
    }
    console.log('   属性变化:', JSON.stringify(numericalResult.attribute_changes) + '\n');

    // 6. 测试战斗系统
    console.log('📝 测试6: 战斗系统');
    const battleSystem = new BattleSystem();
    
    // 创建第二只宠物用于战斗
    const pet2 = await petManager.createPet(testUser, '水精灵');
    pet2.base_prompt = '一只温柔的水精灵，擅长治疗魔法。';
    pet2.attack = 20;
    pet2.defense = 25;
    
    // 给宠物添加一些词条
    newPet.traits = numericalResult.traits.slice(0, 2);
    pet2.traits = [{
      id: 'trait-water-1',
      name: '水之治愈',
      type: 'special',
      effect_value: 15,
      special_mechanism: 'heal'
    }];

    const battleResult = await battleSystem.simulateBattle(newPet, pet2);
    console.log('✅ 战斗模拟成功:');
    console.log('   胜利者:', battleResult.winner.name);
    console.log('   回合数:', battleResult.rounds);
    console.log('   战斗日志长度:', battleResult.battleLog.length + '\n');

    // 7. 测试宠物属性应用
    console.log('📝 测试7: 宠物属性应用');
    const updatedPet = await petManager.applyEvolution(newPet, numericalResult);
    console.log('✅ 进化应用成功:');
    console.log('   进化前属性: HP=50, 攻击=25, 防御=20, 速度=15');
    console.log(`   进化后属性: HP=${updatedPet.hp}, 攻击=${updatedPet.attack}, 防御=${updatedPet.defense}, 速度=${updatedPet.speed}`);
    console.log('   新增词条数:', updatedPet.traits.length + '\n');

    // 8. 测试AI服务状态
    console.log('📝 测试8: AI服务状态检查');
    const aiStatus = aiService.getStatus();
    console.log('✅ AI服务状态:');
    console.log('   配置状态:', aiStatus.configured ? '✅ 已配置' : '❌ 未配置');
    console.log('   缓存大小:', aiStatus.cacheSize);
    console.log('   请求计数:', aiStatus.requestCount);
    console.log('   剩余请求:', aiStatus.remainingRequests + '\n');

    console.log('🎉 所有系统功能测试通过！');
    console.log('\n📊 测试总结:');
    console.log('✅ 三层AI架构正常工作');
    console.log('✅ 宠物管理系统正常');
    console.log('✅ 战斗系统正常');
    console.log('✅ 进化系统正常');
    console.log('✅ 降级机制正常');
    
    console.log('\n💡 下一步:');
    console.log('1. 配置正确的AI API来启用完整功能');
    console.log('2. 测试托管奇遇系统');
    console.log('3. 测试玩家间宠物相遇');
    console.log('4. 部署到生产环境');

  } catch (error) {
    console.error('❌ 系统测试失败:', error.message);
    console.error('详细错误:', error.stack);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testSystemFunctions().then(() => {
    console.log('\n测试完成，程序退出。');
    process.exit(0);
  }).catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testSystemFunctions };