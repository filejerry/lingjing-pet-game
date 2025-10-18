/**
 * 灵境斗宠录 - 宠物生成路由
 * 作者：树枝 (微信: wzq8083)
 */

const express = require('express');
const PetGenerator = require('../game/PetGenerator');
const PetMatchingEngine = require('../ai/PetMatchingEngine');

const router = express.Router();
const petGenerator = new PetGenerator();

/**
 * 根据选择智能匹配宠物（使用AI + 固定算法）
 */
router.post('/generate', async (req, res) => {
    try {
        const { choice, playerId = 'default_player' } = req.body;
        
        if (!choice) {
            return res.status(400).json({
                success: false,
                error: '缺少选择参数'
            });
        }

        // 初始化AI匹配引擎
        const matchingEngine = new PetMatchingEngine(req.aiEngine?.aiService, { db: req.db });
        
        // 使用AI智能匹配宠物
        const pet = await matchingEngine.matchPetByChoice(choice, playerId);
        
        // 获取宠物描述
        const description = petGenerator.getPetDescription(pet);

        res.json({
            success: true,
            pet: {
                ...pet,
                description: description
            }
        });

    } catch (error) {
        console.error('宠物匹配失败:', error);
        res.status(500).json({
            success: false,
            error: '宠物匹配失败'
        });
    }
});

/**
 * 获取宠物详细信息
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.db) {
            return res.status(500).json({
                success: false,
                error: '数据库连接不可用'
            });
        }

        const stmt = req.db.prepare('SELECT * FROM pets WHERE id = ?');
        const pet = stmt.get(id);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: '宠物不存在'
            });
        }

        // 解析JSON字段
        pet.stats = JSON.parse(pet.stats);
        
        // 获取描述
        const description = petGenerator.getPetDescription(pet);

        res.json({
            success: true,
            pet: {
                ...pet,
                description: description
            }
        });

    } catch (error) {
        console.error('获取宠物信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取宠物信息失败'
        });
    }
});

/**
 * 获取所有宠物列表
 */
router.get('/', async (req, res) => {
    try {
        if (!req.db) {
            return res.status(500).json({
                success: false,
                error: '数据库连接不可用'
            });
        }

        const stmt = req.db.prepare('SELECT * FROM pets ORDER BY created_at DESC');
        const pets = stmt.all();
        
        // 解析JSON字段
        pets.forEach(pet => {
            pet.stats = JSON.parse(pet.stats);
        });

        res.json({
            success: true,
            pets: pets
        });

    } catch (error) {
        console.error('获取宠物列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取宠物列表失败'
        });
    }
});

module.exports = router;