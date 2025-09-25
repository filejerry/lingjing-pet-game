/**
 * AI集成测试 - 验证DeepSeek API是否正常工作
 */

require('dotenv').config();
const AIService = require('../src/ai/AIService');
const AIEngine = require('../src/ai/AIEngine');
const logger = require('../src/utils/logger');

async function testAIIntegration() {
  console.log('🧪 开始AI集成测试...\n');
  
  const aiService = new AIService();
  const aiEngine = new AIEngine(aiService);
  
  // 测试宠物数据
  const testPet = {
    id: 'test-pet-001',
    name: '小火龙',
    base_prompt: '一只好奇的小火龙，喜欢探索新事物，对火焰有天然的亲和力。',
    hp: 50,
    attack: 25,
    defense: 20,
    speed: 15,
    traits: []
  };
  
  const testBehaviors = [
    { action_type: 'feed', action_target: '熔岩果', keywords_added: ['火焰', '灼热'] },
    { action_type: 'explore', action_target: '古老遗迹', keywords_added: ['神秘', '古老'] }
  ];

  try {
    console.log('📝 测试1: 基础AI内容生成');
    const basicContent = await aiService.generateContent(
      '请简单介绍一下《灵境斗宠录》这款游戏的特色。',
      { temperature: 0.7 }
    );
    console.log('✅ 基础内容生成成功:');
    console.log(basicContent.substring(0, 200) + '...\n');

    console.log('📝 测试2: 第二层 - 进化内容生成');
    const evolutionResult = await aiEngine.generateEvolutionTemplate(testPet, testBehaviors);
    console.log('✅ 进化模板生成成功:');
    console.log(JSON.stringify(evolutionResult, null, 2).substring(0, 300) + '...\n');

    console.log('📝 测试3: 第三层 - 数值智能体');
    if (evolutionResult && typeof evolutionResult === 'object') {
      const numericalResult = await aiEngine.generateNumericalTraits(evolutionResult, testPet);
      console.log('✅ 数值词条生成成功:');
      console.log(JSON.stringify(numericalResult, null, 2).substring(0, 300) + '...\n');
    }

    console.log('📝 测试4: 创意内容生成 - 事件描述');
    const eventDescription = await aiService.generateEventDescription(
      testPet, 
      '森林探索', 
      '在一片古老的森林中发现了发光的蘑菇'
    );
    console.log('✅ 事件描述生成成功:');
    console.log(eventDescription.substring(0, 200) + '...\n');

    console.log('📝 测试5: 宠物相遇描述');
    const testPet2 = {
      name: '水精灵',
      base_prompt: '一只温柔的水精灵，擅长治疗魔法，性格温和友善。'
    };
    
    const encounterDescription = await aiService.generateEncounterDescription(
      testPet, testPet2, '友好相遇'
    );
    console.log('✅ 相遇描述生成成功:');
    console.log(encounterDescription.substring(0, 200) + '...\n');

    console.log('🎉 所有AI功能测试通过！DeepSeek API集成成功！');
    
    // 显示AI服务状态
    const status = aiService.getStatus();
    console.log('\n📊 AI服务状态:');
    console.log(`- 配置状态: ${status.configured ? '✅ 已配置' : '❌ 未配置'}`);
    console.log(`- 缓存大小: ${status.cacheSize}`);
    console.log(`- 请求计数: ${status.requestCount}`);
    console.log(`- 剩余请求: ${status.remainingRequests}`);

  } catch (error) {
    console.error('❌ AI测试失败:', error.message);
    console.error('详细错误:', error);
    
    if (error.message.includes('API')) {
      console.log('\n💡 可能的解决方案:');
      console.log('1. 检查.env文件中的API配置');
      console.log('2. 确认DeepSeek API密钥是否有效');
      console.log('3. 检查网络连接');
      console.log('4. 查看API调用限制');
    }
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testAIIntegration().then(() => {
    console.log('\n测试完成，程序退出。');
    process.exit(0);
  }).catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testAIIntegration };