#!/usr/bin/env node
/**
 * 依赖检查脚本 - 验证所有必需的模块是否正确安装
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查项目依赖安装状况...\n');

// 读取package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log(`📦 项目: ${packageJson.name} v${packageJson.version}`);
console.log(`📝 描述: ${packageJson.description}\n`);

// 检查核心依赖
const coreDependencies = [
  'express',
  'cors', 
  'helmet',
  'dotenv',
  'better-sqlite3',
  'sqlite3',
  'bcryptjs',
  'jsonwebtoken',
  'axios',
  'winston',
  'node-cron',
  'uuid'
];

console.log('✅ 核心依赖检查:');
let allDepsOk = true;

for (const dep of coreDependencies) {
  try {
    require(dep);
    console.log(`  ✓ ${dep}`);
  } catch (error) {
    console.log(`  ✗ ${dep} - ${error.message}`);
    allDepsOk = false;
  }
}

// 检查项目文件结构
console.log('\n📁 项目结构检查:');
const requiredDirs = [
  'src',
  'src/ai',
  'src/models', 
  'src/routes',
  'src/game',
  'src/utils',
  'data',
  'logs',
  'public'
];

for (const dir of requiredDirs) {
  if (fs.existsSync(dir)) {
    console.log(`  ✓ ${dir}/`);
  } else {
    console.log(`  ✗ ${dir}/ - 目录不存在`);
    allDepsOk = false;
  }
}

// 检查关键文件
console.log('\n📄 关键文件检查:');
const requiredFiles = [
  'src/app.js',
  'src/ai/AIService.js',
  'src/ai/PetPersonaSystem.js',
  'src/ai/ImageEvolutionSystem.js',
  'src/models/EnhancedDatabase.js',
  'src/routes/petPersonaRoutes.js',
  '.env'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - 文件不存在`);
    allDepsOk = false;
  }
}

// 检查环境变量
console.log('\n🔧 环境配置检查:');
require('dotenv').config();

const requiredEnvVars = [
  'PORT',
  'ARK_API_KEY',
  'SEEDREAM_API_KEY',
  'KIMI_MODEL',
  'SEEDREAM_MODEL'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`  ✓ ${envVar}`);
  } else {
    console.log(`  ✗ ${envVar} - 环境变量未设置`);
    allDepsOk = false;
  }
}

// 最终结果
console.log('\n' + '='.repeat(50));
if (allDepsOk) {
  console.log('🎉 所有依赖和配置检查通过！');
  console.log('✅ 项目已准备就绪，可以启动服务');
  console.log('\n启动命令:');
  console.log('  npm start     # 生产模式');
  console.log('  npm run dev   # 开发模式');
} else {
  console.log('❌ 发现问题，请修复后重试');
  console.log('\n修复建议:');
  console.log('  npm install   # 安装缺失的依赖');
  console.log('  cp .env.example .env  # 复制环境配置');
}
console.log('='.repeat(50));

process.exit(allDepsOk ? 0 : 1);