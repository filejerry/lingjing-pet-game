#!/usr/bin/env node

/**
 * 《灵境斗宠录》快速启动脚本
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log(`
🐾 ===============================================
   欢迎来到《灵境斗宠录》
   AI驱动的文字宠物养成游戏
🐾 ===============================================
`);

async function quickStart() {
  try {
    // 1. 检查环境
    console.log('📋 正在检查运行环境...');
    
    if (!fs.existsSync('package.json')) {
      console.error('❌ 错误: 请在项目根目录运行此脚本');
      process.exit(1);
    }

    // 2. 检查依赖
    if (!fs.existsSync('node_modules')) {
      console.log('📦 正在安装依赖包...');
      await runCommand('npm', ['install']);
    }

    // 3. 检查环境配置
    if (!fs.existsSync('.env')) {
      console.log('⚙️ 正在创建环境配置...');
      fs.copyFileSync('.env.example', '.env');
      console.log('✅ 已创建 .env 文件，你可以稍后配置AI API');
    }

    // 4. 初始化数据库
    if (!fs.existsSync('data/game.db')) {
      console.log('🗄️ 正在初始化数据库...');
      await runCommand('node', ['scripts/init-database.js']);
    }

    // 5. 启动服务
    console.log(`
🚀 准备启动游戏服务器...

📝 启动后你可以:
   • 浏览器访问: http://localhost:3000
   • 查看API文档: http://localhost:3000/api/info
   • 健康检查: http://localhost:3000/health

💡 提示:
   • 首次运行会使用模板降级模式 (无需AI API)
   • 如需完整AI功能，请在 .env 中配置AI API密钥
   • 按 Ctrl+C 可停止服务器

🎮 开始你的灵境之旅吧！
`);

    // 启动开发服务器
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    // 处理退出信号
    process.on('SIGINT', () => {
      console.log('\n👋 正在关闭服务器...');
      server.kill('SIGINT');
      process.exit(0);
    });

    server.on('close', (code) => {
      console.log(`\n🛑 服务器已停止 (退出码: ${code})`);
      process.exit(code);
    });

  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败: ${command} ${args.join(' ')}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

// 运行快速启动
if (require.main === module) {
  quickStart();
}

module.exports = { quickStart };