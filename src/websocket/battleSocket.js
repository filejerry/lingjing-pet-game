/**
 * WebSocket - 多人对战系统
 */

import { Server } from 'socket.io'
import logger from '../utils/logger.js'

// 匹配队列
const matchQueue = new Map()
// 对战房间
const battleRooms = new Map()

export function setupBattleSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  })

  io.on('connection', (socket) => {
    logger.info(`客户端连接: ${socket.id}`)

    // 加入匹配队列
    socket.on('battle:join_queue', async (data) => {
      const { petId, userId } = data

      try {
        logger.info(`玩家 ${userId} 加入匹配队列, 宠物: ${petId}`)

        // 将玩家加入队列
        matchQueue.set(socket.id, {
          socketId: socket.id,
          userId,
          petId,
          timestamp: Date.now()
        })

        socket.emit('battle:queue_joined', {
          message: '已加入匹配队列',
          queueSize: matchQueue.size
        })

        // 尝试匹配
        tryMatch(io)

      } catch (error) {
        logger.error('加入匹配队列失败:', error)
        socket.emit('battle:error', {
          message: '加入匹配队列失败'
        })
      }
    })

    // 离开匹配队列
    socket.on('battle:leave_queue', () => {
      if (matchQueue.has(socket.id)) {
        matchQueue.delete(socket.id)
        socket.emit('battle:queue_left', {
          message: '已离开匹配队列'
        })
      }
    })

    // 战斗行动
    socket.on('battle:action', async (data) => {
      const { roomId, action, targetId } = data

      try {
        const room = battleRooms.get(roomId)
        if (!room) {
          return socket.emit('battle:error', {
            message: '战斗房间不存在'
          })
        }

        // 处理战斗行动
        const result = await processBattleAction(room, socket.id, action, targetId)

        // 广播战斗结果
        io.to(roomId).emit('battle:action_result', result)

        // 检查战斗是否结束
        if (result.battleEnd) {
          io.to(roomId).emit('battle:end', {
            winner: result.winner,
            rewards: result.rewards
          })

          // 清理房间
          battleRooms.delete(roomId)
        }

      } catch (error) {
        logger.error('处理战斗行动失败:', error)
        socket.emit('battle:error', {
          message: '战斗行动失败'
        })
      }
    })

    // 断开连接
    socket.on('disconnect', () => {
      logger.info(`客户端断开: ${socket.id}`)

      // 从匹配队列移除
      matchQueue.delete(socket.id)

      // 处理房间中的玩家断开
      battleRooms.forEach((room, roomId) => {
        if (room.player1.socketId === socket.id || room.player2.socketId === socket.id) {
          // 通知对手玩家离开
          const opponentId = room.player1.socketId === socket.id
            ? room.player2.socketId
            : room.player1.socketId

          io.to(opponentId).emit('battle:opponent_disconnected', {
            message: '对手已断开连接',
            result: 'win'
          })

          // 清理房间
          battleRooms.delete(roomId)
        }
      })
    })
  })

  return io
}

/**
 * 尝试匹配玩家
 */
function tryMatch(io) {
  if (matchQueue.size < 2) {
    return
  }

  const players = Array.from(matchQueue.values())

  // 简单匹配: 取队列中最早的两个玩家
  const player1 = players[0]
  const player2 = players[1]

  // 创建战斗房间
  const roomId = `battle_${Date.now()}`
  const room = {
    id: roomId,
    player1,
    player2,
    state: 'starting',
    turn: 'player1',
    createdAt: Date.now()
  }

  battleRooms.set(roomId, room)

  // 从队列中移除
  matchQueue.delete(player1.socketId)
  matchQueue.delete(player2.socketId)

  // 通知双方匹配成功
  io.to(player1.socketId).emit('battle:match_found', {
    roomId,
    role: 'player1',
    opponent: {
      userId: player2.userId,
      petId: player2.petId
    }
  })

  io.to(player2.socketId).emit('battle:match_found', {
    roomId,
    role: 'player2',
    opponent: {
      userId: player1.userId,
      petId: player1.petId
    }
  })

  logger.info(`匹配成功: ${player1.userId} vs ${player2.userId}, 房间: ${roomId}`)

  // 3秒后开始战斗
  setTimeout(() => {
    startBattle(io, roomId)
  }, 3000)
}

/**
 * 开始战斗
 */
function startBattle(io, roomId) {
  const room = battleRooms.get(roomId)
  if (!room) return

  room.state = 'fighting'

  // TODO: 从数据库加载宠物数据
  room.player1Pet = {
    hp: 1000,
    maxHp: 1000,
    attack: 100,
    defense: 50
  }

  room.player2Pet = {
    hp: 1000,
    maxHp: 1000,
    attack: 100,
    defense: 50
  }

  // 广播战斗开始
  io.to(roomId).emit('battle:start', {
    player1: room.player1Pet,
    player2: room.player2Pet,
    firstTurn: room.turn
  })

  logger.info(`战斗开始: 房间 ${roomId}`)
}

/**
 * 处理战斗行动
 */
async function processBattleAction(room, socketId, action, targetId) {
  // 判断是哪个玩家
  const isPlayer1 = room.player1.socketId === socketId
  const currentPlayer = isPlayer1 ? 'player1' : 'player2'

  // 检查是否轮到该玩家
  if (room.turn !== currentPlayer) {
    throw new Error('不是你的回合')
  }

  const attacker = isPlayer1 ? room.player1Pet : room.player2Pet
  const defender = isPlayer1 ? room.player2Pet : room.player1Pet

  let result = {
    action,
    attacker: currentPlayer,
    battleEnd: false
  }

  // 处理不同行动
  switch (action) {
    case 'attack':
      // 计算伤害
      const damage = Math.max(attacker.attack - defender.defense / 2, 10)
      defender.hp -= damage

      result.damage = damage
      result.targetHp = defender.hp
      result.message = `造成 ${damage} 点伤害!`
      break

    case 'skill':
      // 技能攻击 (伤害更高)
      const skillDamage = attacker.attack * 1.5
      defender.hp -= skillDamage

      result.damage = skillDamage
      result.targetHp = defender.hp
      result.message = `释放技能,造成 ${skillDamage} 点伤害!`
      break

    case 'defend':
      // 防御 (降低下次受到的伤害)
      result.message = '进入防御姿态!'
      break

    default:
      throw new Error('未知行动')
  }

  // 检查战斗是否结束
  if (defender.hp <= 0) {
    result.battleEnd = true
    result.winner = currentPlayer
    result.rewards = {
      exp: 50,
      coins: 100
    }
  }

  // 切换回合
  room.turn = room.turn === 'player1' ? 'player2' : 'player1'

  return result
}
