-- =====================================================
-- 《灵境斗宠录》Supabase PostgreSQL Schema
-- 版本: 1.0.0
-- 创建日期: 2025-10-15
-- =====================================================

-- 清理旧表(谨慎使用,会删除所有数据!)
-- DROP TABLE IF EXISTS ai_cache CASCADE;
-- DROP TABLE IF EXISTS evolution_records CASCADE;
-- DROP TABLE IF EXISTS adventure_events CASCADE;
-- DROP TABLE IF EXISTS pet_traits CASCADE;
-- DROP TABLE IF EXISTS story_templates CASCADE;
-- DROP TABLE IF EXISTS pet_lore CASCADE;
-- DROP TABLE IF EXISTS pets CASCADE;
-- DROP TABLE IF EXISTS pet_species CASCADE;
-- DROP TABLE IF EXISTS game_config CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 核心表创建
-- =====================================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    game_progress JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}'
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON TABLE users IS '用户账号信息表';
COMMENT ON COLUMN users.game_progress IS '游戏进度JSON,如{level:10,story_chapter:3}';
COMMENT ON COLUMN users.settings IS '用户设置JSON,如{text_speed:1.5,sound:true}';

-- =====================================================

-- 2. 宠物基础信息表
CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL,
    rarity VARCHAR(10) NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR', 'SSS')),
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    experience INTEGER DEFAULT 0 CHECK (experience >= 0),
    health INTEGER DEFAULT 100 CHECK (health >= 0),
    attack INTEGER DEFAULT 10 CHECK (attack >= 0),
    defense INTEGER DEFAULT 10 CHECK (defense >= 0),
    speed INTEGER DEFAULT 10 CHECK (speed >= 0),
    special_traits JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    last_interaction TIMESTAMP DEFAULT NOW(),
    evolution_stage INTEGER DEFAULT 0 CHECK (evolution_stage >= 0),
    custom_name VARCHAR(255),
    bond_level INTEGER DEFAULT 0 CHECK (bond_level >= 0 AND bond_level <= 100),
    mood VARCHAR(20) DEFAULT 'neutral'
);

-- 宠物表索引
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_rarity ON pets(rarity);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_level ON pets(level DESC);
CREATE INDEX IF NOT EXISTS idx_pets_created ON pets(created_at DESC);

COMMENT ON TABLE pets IS '宠物基础属性信息表';
COMMENT ON COLUMN pets.custom_name IS '玩家自定义名字,如"小火"';
COMMENT ON COLUMN pets.bond_level IS '羁绊等级0-100,影响进化';
COMMENT ON COLUMN pets.mood IS '心情状态:happy/neutral/sad/angry';

-- =====================================================

-- 3. 宠物背景故事表
CREATE TABLE IF NOT EXISTS pet_lore (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER UNIQUE REFERENCES pets(id) ON DELETE CASCADE,
    background_story TEXT,
    detailed_description TEXT,
    personality_traits TEXT,
    special_abilities TEXT,
    origin_story TEXT,
    evolution_history TEXT,
    ai_prompt_settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 宠物背景表索引
CREATE INDEX IF NOT EXISTS idx_pet_lore_pet_id ON pet_lore(pet_id);

COMMENT ON TABLE pet_lore IS '宠物详细背景故事(AI生成内容)';
COMMENT ON COLUMN pet_lore.ai_prompt_settings IS 'AI生成时使用的提示词配置';

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_pet_lore_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pet_lore_updated_at
BEFORE UPDATE ON pet_lore
FOR EACH ROW
EXECUTE FUNCTION update_pet_lore_updated_at();

-- =====================================================

-- 4. 宠物种族模板表
CREATE TABLE IF NOT EXISTS pet_species (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    base_rarity VARCHAR(10) NOT NULL CHECK (base_rarity IN ('N', 'R', 'SR', 'SSR', 'SSS')),
    base_stats JSONB NOT NULL,
    evolution_paths JSONB DEFAULT '[]',
    special_traits JSONB DEFAULT '[]',
    lore_template TEXT,
    is_legendary BOOLEAN DEFAULT FALSE,
    element_type VARCHAR(20),
    region VARCHAR(50)
);

-- 宠物种族表索引
CREATE INDEX IF NOT EXISTS idx_pet_species_category ON pet_species(category);
CREATE INDEX IF NOT EXISTS idx_pet_species_rarity ON pet_species(base_rarity);
CREATE INDEX IF NOT EXISTS idx_pet_species_element ON pet_species(element_type);
CREATE INDEX IF NOT EXISTS idx_pet_species_legendary ON pet_species(is_legendary);

COMMENT ON TABLE pet_species IS '宠物种族模板库';
COMMENT ON COLUMN pet_species.element_type IS '元素类型:火/水/木/土/风/雷/光/暗';
COMMENT ON COLUMN pet_species.region IS '所属区域:森林界/海洋界/昆仑等';

-- =====================================================

-- 5. 剧情模板库表
CREATE TABLE IF NOT EXISTS story_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 剧情模板表索引
CREATE INDEX IF NOT EXISTS idx_story_templates_category ON story_templates(category);
CREATE INDEX IF NOT EXISTS idx_story_templates_active ON story_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_story_templates_priority ON story_templates(priority DESC);

COMMENT ON TABLE story_templates IS '剧情模板库,用于动态生成故事';
COMMENT ON COLUMN story_templates.trigger_conditions IS '触发条件JSON,如{pet_level:20,rarity:"SSR"}';
COMMENT ON COLUMN story_templates.priority IS '优先级,数字越大越优先';

-- =====================================================

-- 6. 宠物词条表
CREATE TABLE IF NOT EXISTS pet_traits (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    trait_name VARCHAR(100) NOT NULL,
    trait_value TEXT,
    trait_type VARCHAR(50) NOT NULL,
    trait_rarity VARCHAR(10),
    acquired_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 宠物词条表索引
CREATE INDEX IF NOT EXISTS idx_pet_traits_pet_id ON pet_traits(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_traits_type ON pet_traits(trait_type);
CREATE INDEX IF NOT EXISTS idx_pet_traits_rarity ON pet_traits(trait_rarity);

COMMENT ON TABLE pet_traits IS '宠物词条/特性表';
COMMENT ON COLUMN pet_traits.trait_type IS '词条类型:被动/主动/光环等';
COMMENT ON COLUMN pet_traits.is_active IS '是否激活状态';

-- =====================================================

-- 7. 冒险事件表
CREATE TABLE IF NOT EXISTS adventure_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    choices_made JSONB DEFAULT '[]',
    outcomes JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE
);

-- 冒险事件表索引
CREATE INDEX IF NOT EXISTS idx_adventure_events_user_id ON adventure_events(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_events_type ON adventure_events(event_type);
CREATE INDEX IF NOT EXISTS idx_adventure_events_created ON adventure_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adventure_events_completed ON adventure_events(completed);

COMMENT ON TABLE adventure_events IS '冒险事件记录表';
COMMENT ON COLUMN adventure_events.event_type IS '事件类型:战斗/探索/进化/遭遇等';

-- =====================================================

-- 8. 游戏配置表
CREATE TABLE IF NOT EXISTS game_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    config_type VARCHAR(20) DEFAULT 'string',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 游戏配置表索引
CREATE INDEX IF NOT EXISTS idx_game_config_key ON game_config(config_key);

COMMENT ON TABLE game_config IS '全局游戏配置表';
COMMENT ON COLUMN game_config.config_type IS '配置类型:string/number/json/boolean';

-- =====================================================

-- 9. 进化记录表(新增)
CREATE TABLE IF NOT EXISTS evolution_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    from_species VARCHAR(100) NOT NULL,
    to_species VARCHAR(100) NOT NULL,
    from_rarity VARCHAR(10) NOT NULL,
    to_rarity VARCHAR(10) NOT NULL,
    evolution_path VARCHAR(50),
    trigger_reason TEXT,
    ai_story TEXT,
    stats_before JSONB,
    stats_after JSONB,
    player_choices JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 进化记录表索引
CREATE INDEX IF NOT EXISTS idx_evolution_records_pet_id ON evolution_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_evolution_records_created ON evolution_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evolution_records_path ON evolution_records(evolution_path);

COMMENT ON TABLE evolution_records IS '宠物进化历史记录表';
COMMENT ON COLUMN evolution_records.trigger_reason IS '进化触发原因:等级/羁绊/道具/事件等';
COMMENT ON COLUMN evolution_records.ai_story IS 'AI生成的进化剧情';

-- =====================================================

-- 10. AI响应缓存表(新增)
CREATE TABLE IF NOT EXISTS ai_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    prompt_hash VARCHAR(64) NOT NULL,
    response_data JSONB NOT NULL,
    model_name VARCHAR(50),
    token_usage INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP
);

-- AI缓存表索引
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hit_count ON ai_cache(hit_count DESC);

COMMENT ON TABLE ai_cache IS 'AI响应缓存,减少API调用成本';
COMMENT ON COLUMN ai_cache.cache_key IS '缓存键,如pet_evolution_123';
COMMENT ON COLUMN ai_cache.prompt_hash IS 'Prompt的SHA256哈希值';
COMMENT ON COLUMN ai_cache.expires_at IS '过期时间,NULL表示永不过期';

-- 自动清理过期缓存的函数
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================

-- 11. 战斗记录表(新增,为后续战斗系统准备)
CREATE TABLE IF NOT EXISTS battle_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    opponent_type VARCHAR(20) NOT NULL,
    opponent_data JSONB NOT NULL,
    battle_log JSONB NOT NULL,
    result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'lose', 'draw')),
    rewards JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battle_records_user_id ON battle_records(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_records_pet_id ON battle_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_battle_records_result ON battle_records(result);
CREATE INDEX IF NOT EXISTS idx_battle_records_created ON battle_records(created_at DESC);

COMMENT ON TABLE battle_records IS '战斗记录表';
COMMENT ON COLUMN battle_records.opponent_type IS '对手类型:pve/pvp/boss';

-- =====================================================
-- 初始数据插入
-- =====================================================

-- 插入默认游戏配置
INSERT INTO game_config (config_key, config_value, description, config_type) VALUES
('game_version', '1.0.0', '游戏版本号', 'string'),
('text_speed_default', '1.5', '默认文字浮现速度(秒)', 'number'),
('max_pets_per_user', '50', '每个用户最大宠物数量', 'number'),
('evolution_min_level', '20', '最低进化等级', 'number'),
('ai_cache_expire_hours', '168', 'AI缓存过期时间(小时,默认7天)', 'number'),
('gacha_ssr_rate', '0.01', 'SSR抽取概率', 'number'),
('gacha_sss_rate', '0.001', 'SSS抽取概率', 'number')
ON CONFLICT (config_key) DO NOTHING;

-- 插入初始宠物种族模板(示例)
INSERT INTO pet_species (name, category, base_rarity, base_stats, element_type, region, lore_template) VALUES
('幼龙', '龙族', 'N', '{"health":100,"attack":15,"defense":10,"speed":12}', '火', '龙界', '诞生于世界树烈焰枝条的幼小龙族...'),
('灵狐', '精怪族', 'R', '{"health":80,"attack":20,"defense":8,"speed":25}', '风', '森林界', '青木灵境的月光下,灵气凝聚而成...'),
('九尾狐', '精怪族', 'SSR', '{"health":150,"attack":35,"defense":20,"speed":40}', '幻', '梦幻界', '传说中的九尾仙狐,掌控幻术与预知...'),
('应龙', '龙族', 'SSR', '{"health":250,"attack":50,"defense":40,"speed":30}', '雷', '天界', '上古神龙,翼展千里,翱翔九天...'),
('凤凰', '仙禽族', 'SSR', '{"health":200,"attack":45,"defense":35,"speed":50}', '火', '昆仑', '涅槃重生的不死神鸟,火焰之主...')
ON CONFLICT (name) DO NOTHING;

-- 插入示例剧情模板
INSERT INTO story_templates (template_name, category, content, trigger_conditions, priority) VALUES
('进化前兆', 'evolution', '你感觉到{petName}的体内涌动着强大的力量...', '{"min_level":20}', 10),
('战斗胜利', 'battle', '经过激烈的战斗,{petName}成功击败了对手!', '{}', 5),
('探索遭遇', 'adventure', '在{region}深处,{petName}发现了一处神秘遗迹...', '{}', 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 视图创建(便于查询)
-- =====================================================

-- 宠物完整信息视图
CREATE OR REPLACE VIEW v_pets_full AS
SELECT
    p.*,
    pl.background_story,
    pl.personality_traits,
    u.username as owner_username,
    ps.category as species_category,
    ps.element_type
FROM pets p
LEFT JOIN pet_lore pl ON p.id = pl.pet_id
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN pet_species ps ON p.species = ps.name;

COMMENT ON VIEW v_pets_full IS '宠物完整信息视图(含背景故事和主人信息)';

-- 用户统计视图
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.id,
    u.username,
    COUNT(p.id) as total_pets,
    COUNT(CASE WHEN p.rarity = 'SSS' THEN 1 END) as sss_count,
    COUNT(CASE WHEN p.rarity = 'SSR' THEN 1 END) as ssr_count,
    MAX(p.level) as max_pet_level,
    u.created_at
FROM users u
LEFT JOIN pets p ON u.id = p.user_id
GROUP BY u.id, u.username, u.created_at;

COMMENT ON VIEW v_user_stats IS '用户统计视图(宠物数量、稀有度分布等)';

-- =====================================================
-- 性能优化:分区表(可选,数据量大时启用)
-- =====================================================

-- 示例:按月分区adventure_events表
-- CREATE TABLE adventure_events_2025_10 PARTITION OF adventure_events
-- FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- =====================================================
-- Row Level Security (RLS) 配置(可选)
-- =====================================================

-- 启用RLS后,用户只能访问自己的数据
-- ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY pets_user_policy ON pets
--     USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- =====================================================
-- 完成提示
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '《灵境斗宠录》数据库Schema创建完成!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '已创建表: 11 个';
    RAISE NOTICE '已创建索引: 30+ 个';
    RAISE NOTICE '已创建视图: 2 个';
    RAISE NOTICE '已插入初始数据';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '下一步: 运行数据迁移工具 npm run migrate:data';
    RAISE NOTICE '==============================================';
END $$;
