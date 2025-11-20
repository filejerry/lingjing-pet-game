/**
 * WebSocket - 多人对战系统
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');
const Database = require('../models/Database');
const BattleSystem = require('../game/BattleSystem');

// 匹配队列
const matchQueue = new Map();
// 对战房间
const battleRooms = new Map();

// 单例数据库与战斗系统实例
let dbInstance = null;
let battleSystem = null;

async function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
    try {
      await dbInstance.initialize();
      logger.info('Database initialized for battle socket');
    } catch (error) {
      logger.error('Failed to initialize database for battle socket:', error);
      throw error;
    }
  }
  return dbInstance;
}

async function getBattleSystem() {
  if (!battleSystem) {
    const db = await getDatabase();
    battleSystem = new BattleSystem(db);
  }
  return battleSystem;
}

/**
 * 加载用于战斗的宠物属性
 */
async function loadPetForBattle(petId) {
  try {
    const db = await getDatabase();

    const pet = await db.get(
      'SELECT * FROM pets WHERE id = ? AND is_active = 1',
      [petId]
    );

    if (!pet) {
      throw new Error('Pet not found');
    }

    const traits = await db.all(
      'SELECT * FROM pet_traits WHERE pet_id = ? AND is_active = 1',
      [petId]
    );

    return {
      id: pet.id,
      name: pet.name,
      element_type: pet.element_type || 'neutral',
      traits: traits || [],
      hp: pet.hp,
      maxHp: pet.hp,
      attack: pet.attack,
      defense: pet.defense,
      magic: pet.magic,
      resistance: pet.resistance,
      speed: pet.speed,
      existsInDb: true
    };
  } catch (error) {
    logger.error('加载宠物失败, 使用默认属性', { petId, error: error.message });

    // 回退到默认属性, 允许前端体验对战流程
    return {
      id: petId,
      name: '未知宠物',
      element_type: 'neutral',
      traits: [],
      hp: 1000,
      maxHp: 1000,
      attack: 100,
      defense: 50,
      magic: 80,
      resistance: 60,
      speed: 50,
      existsInDb: false
    };
  }
}

/**
 * 配置对战 WebSocket
 */
function setupBattleSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  });

  io.on('connection', (socket) => {
    logger.info(`客户端连接: ${socket.id}`);

    // 加入匹配队列
    socket.on('battle:join_queue', async (data = {}) => {
      const { petId, userId } = data;

      if (!petId || !userId) {
        return socket.emit('battle:error', {
          message: '缺少 petId 或 userId'
        });
      }

      try {
        logger.info(`玩家 ${userId} 加入匹配队列, 宠物: ${petId}`);

        matchQueue.set(socket.id, {
          socketId: socket.id,
          userId,
          petId,
          timestamp: Date.now()
        });

        socket.emit('battle:queue_joined', {
          message: '已加入匹配队列',
          queueSize: matchQueue.size
        });

        // 尝试进行匹配
        tryMatch(io);

      } catch (error) {
        logger.error('加入匹配队列失败:', error);
        socket.emit('battle:error', {
          message: '加入匹配队列失败'
        });
      }
    });

    // 离开匹配队列
    socket.on('battle:leave_queue', () => {
      if (matchQueue.has(socket.id)) {
        matchQueue.delete(socket.id);
        socket.emit('battle:queue_left', {
          message: '已离开匹配队列'
        });
      }
    });

    // 战斗行动
    socket.on('battle:action', async (data = {}) => {
      const { roomId, action, targetId } = data;

      try {
        const room = battleRooms.get(roomId);
        if (!room) {
          return socket.emit('battle:error', {
            message: '战斗房间不存在'
          });
        }

        const result = await processBattleAction(room, socket.id, action, targetId);

        // 广播战斗结果
        io.to(roomId).emit('battle:action_result', result);

        // 检查战斗是否结束
        if (result.battleEnd) {
          io.to(roomId).emit('battle:end', {
            winner: result.winner,
            rewards: result.rewards
          });

          // 异步保存战斗记录
          saveBattleRecordForRoom(room, result).catch((error) => {
            logger.error('保存战斗记录失败:', error);
          });

          // 清理房间
          battleRooms.delete(roomId);
        }

      } catch (error) {
        logger.error('处理战斗行动失败:', error);
        socket.emit('battle:error', {
          message: '战斗行动失败'
        });
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      logger.info(`客户端断开: ${socket.id}`);

      // 从匹配队列移除
      matchQueue.delete(socket.id);

      // 处理房间中的玩家断开
      battleRooms.forEach((room, roomId) => {
        if (room.player1.socketId === socket.id || room.player2.socketId === socket.id) {
          const opponentId = room.player1.socketId === socket.id
            ? room.player2.socketId
            : room.player1.socketId;

          io.to(opponentId).emit('battle:opponent_disconnected', {
            message: '对手已断开连接',
            result: 'win'
          });

          battleRooms.delete(roomId);
        }
      });
    });
  });

  return io;
}

/**
 * 尝试匹配玩家
 */
function tryMatch(io) {
  if (matchQueue.size < 2) {
    return;
  }

  const players = Array.from(matchQueue.values());

  // 简单匹配: 取队列中最早的两个玩家
  const player1 = players[0];
  const player2 = players[1];

  const roomId = `battle_${Date.now()}`;
  const room = {
    id: roomId,
    player1,
    player2,
    state: 'matching',
    turn: 'player1',
    createdAt: Date.now(),
    battleLog: []
  };

  battleRooms.set(roomId, room);

  matchQueue.delete(player1.socketId);
  matchQueue.delete(player2.socketId);

  // 通知双方匹配成功
  io.to(player1.socketId).emit('battle:match_found', {
    roomId,
    role: 'player1',
    opponent: {
      userId: player2.userId,
      petId: player2.petId
    }
  });

  io.to(player2.socketId).emit('battle:match_found', {
    roomId,
    role: 'player2',
    opponent: {
      userId: player1.userId,
      petId: player1.petId
    }
  });

  logger.info(`匹配成功: ${player1.userId} vs ${player2.userId}, 房间: ${roomId}`);

  // 3秒后开始战斗
  setTimeout(() => {
    startBattle(io, roomId).catch((error) => {
      logger.error('启动战斗失败:', error);
      const room = battleRooms.get(roomId);
      if (!room) return;

      io.to(room.player1.socketId).emit('battle:error', { message: '战斗初始化失败' });
      io.to(room.player2.socketId).emit('battle:error', { message: '战斗初始化失败' });
      battleRooms.delete(roomId);
    });
  }, 3000);
}

/**
 * 开始战斗
 */
async function startBattle(io, roomId) {
  const room = battleRooms.get(roomId);
  if (!room) return;

  room.state = 'fighting';

  const [pet1, pet2] = await Promise.all([
    loadPetForBattle(room.player1.petId),
    loadPetForBattle(room.player2.petId)
  ]);

  room.player1Pet = { ...pet1 };
  room.player2Pet = { ...pet2 };

  room.battleLog.push(
    `战斗开始：${pet1.name} (玩家 ${room.player1.userId}) VS ${pet2.name} (玩家 ${room.player2.userId})`
  );

  io.to(room.id).emit('battle:start', {
    player1: room.player1Pet,
    player2: room.player2Pet,
    firstTurn: room.turn
  });

  logger.info(`战斗开始 房间 ${roomId}`);
}

/**
 * 处理战斗行动
 */
async function processBattleAction(room, socketId, action, targetId) {
  const isPlayer1 = room.player1.socketId === socketId;
  const currentPlayer = isPlayer1 ? 'player1' : 'player2';

  // 检查是否轮到该玩家
  if (room.turn !== currentPlayer) {
    throw new Error('不是你的回合');
  }

  const attacker = isPlayer1 ? room.player1Pet : room.player2Pet;
  const defender = isPlayer1 ? room.player2Pet : room.player1Pet;

  const result = {
    action,
    attacker: currentPlayer,
    battleEnd: false
  };

  switch (action) {
    case 'attack': {
      const system = await getBattleSystem();
      const damage = system.calculateDamage(attacker, defender);
      defender.hp = Math.max(0, defender.hp - damage);

      result.damage = damage;
      result.targetHp = defender.hp;
      result.message = `普通攻击造成 ${damage} 点伤害`;

      room.battleLog.push(
        `${attacker.name} 对 ${defender.name} 发动普通攻击，造成 ${damage} 点伤害，目标剩余 HP=${defender.hp}/${defender.maxHp}`
      );
      break;
    }

    case 'skill': {
      const system = await getBattleSystem();
      const damage = Math.floor(system.calculateDamage(attacker, defender) * 1.3);
      defender.hp = Math.max(0, defender.hp - damage);

      result.damage = damage;
      result.targetHp = defender.hp;
      result.message = `技能造成 ${damage} 点伤害`;

      room.battleLog.push(
        `${attacker.name} 释放技能攻击 ${defender.name}，造成 ${damage} 点伤害，目标剩余 HP=${defender.hp}/${defender.maxHp}`
      );
      break;
    }

    case 'defend': {
      attacker.defending = true;
      result.message = '进入防御姿态';

      room.battleLog.push(
        `${attacker.name} 进入防御姿态，准备格挡下一次攻击`
      );
      break;
    }

    default:
      throw new Error(`未知行动: ${action}`);
  }

  // 检查战斗是否结束
  if (defender.hp <= 0) {
    result.battleEnd = true;
    result.winner = currentPlayer;
    result.rewards = {
      exp: 50,
      coins: 100
    };

    room.battleLog.push(`${defender.name} 倒下了，本局胜者：${attacker.name}`);
  }

  // 未结束则切换回合
  if (!result.battleEnd) {
    room.turn = room.turn === 'player1' ? 'player2' : 'player1';
  }

  return result;
}

/**
 * 保存战斗记录
 */
async function saveBattleRecordForRoom(room, lastResult) {
  try {
    const system = await getBattleSystem();

    const attackerPet = room.player1Pet;
    const defenderPet = room.player2Pet;

    // 如果宠物不是来自数据库, 则跳过保存 (避免外键问题)
    if (!attackerPet.existsInDb || !defenderPet.existsInDb) {
      logger.warn('跳过保存战斗记录: 宠物不在数据库中');
      return;
    }

    const winnerPet = lastResult.winner === 'player1' ? attackerPet : defenderPet;

    const battleResult = {
      winner: winnerPet,
      battleLog: room.battleLog,
      rounds: room.battleLog.length,
      finalState: {
        attacker: attackerPet,
        defender: defenderPet
      }
    };

    await system.saveBattleRecord(attackerPet, defenderPet, battleResult, 'pvp');
  } catch (error) {
    logger.error('保存战斗记录失败:', error);
  }
}

module.exports = {
  setupBattleSocket
};
