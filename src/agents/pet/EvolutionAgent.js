// EvolutionAgent.js - 宠物独特进化Agent（NagaAgent风格）
const BaseAgent = require('../core/BaseAgent');
const { buildHints } = require('../../ai/FixedAlgorithmEngine');

// 稀有度倍率与权重
const RARITY = {
  SSS: { mult: 3.0, weight: 1.5 },
  SSR: { mult: 2.5, weight: 1.3 },
  SR:  { mult: 2.0, weight: 1.15 },
  R:   { mult: 1.5, weight: 1.0 },
  N:   { mult: 1.0, weight: 0.9 },
};

// 简化的进化路径模板（可从DB的pet_species.evolution_paths扩展）
const EVOLUTION_TEMPLATES = {
  火蜥蜴: [
    { to: '火龙',  req: { level: 20, bond: 60, env: ['火山', '熔岩洞'] }, tags: ['飞行', '烈焰'], rarityShift: 'SR' },
    { to: '战龙',  req: { level: 25, bond: 75, env: ['火山', '竞技场'] }, tags: ['战意', '龙威'], rarityShift: 'SSR' },
    { to: '炎蝠龙', req: { level: 22, bond: 50, env: ['火山', '高空'] }, tags: ['滑翔', '声波'], rarityShift: 'R' },
  ],
  九尾狐幼体: [
    { to: '九尾狐', req: { level: 18, bond: 70, env: ['森林', '灵界'] }, tags: ['幻术', '魅影'], rarityShift: 'SSR' },
    { to: '梦狐',   req: { level: 16, bond: 55, env: ['梦幻界'] }, tags: ['梦织', '眠语'], rarityShift: 'SR' },
  ],
};

class EvolutionAgent extends BaseAgent {
  constructor() {
    super('EvolutionAgent', ['evolution_decision', 'path_scoring', 'effect_projection', 'self_test']);
    this.lastState = null;
  }

  // 评分函数：根据核心数据与上下文为每条路径打分
  scorePath(pet, ctx, tpl) {
    const rarity = RARITY[pet.rarity] || RARITY.N;
    const levelScore = Math.min(1, (pet.level || 1) / (tpl.req.level || 1));
    const bondScore = Math.min(1, (ctx.playerBond || 0) / (tpl.req.bond || 1));
    const envScore = tpl.req.env ? (tpl.req.env.includes(ctx.environment) ? 1 : 0.3) : 0.5;
    const base = 0.4 * levelScore + 0.4 * bondScore + 0.2 * envScore;
    const rarityBoost = rarity.weight;
    // 独特性加权：根据特殊词条与模板标签的交集增强评分
    const traitIntersect = (pet.specialTraits || []).filter(t => tpl.tags.includes(t)).length;
    const uniqueness = 1 + 0.1 * traitIntersect;
    return base * rarityBoost * uniqueness;
  }

  // 生成进化效果预览（属性变化、词条新增等）
  projectEffects(pet, tpl, score) {
    const rarity = RARITY[pet.rarity] || RARITY.N;
    const mult = rarity.mult * (0.8 + 0.4 * Math.min(1, score)); // 随评分提升
    const base = pet.baseStats || { health: 100, attack: 10, defense: 10, speed: 10 };
    const delta = {
      health: Math.round(base.health * (mult - 1)),
      attack: Math.round(base.attack * (mult - 1)),
      defense: Math.round(base.defense * (mult - 1)),
      speed: Math.round(base.speed * (mult - 1)),
    };
    const newTraits = Array.from(new Set([...(pet.specialTraits || []), ...tpl.tags]));
    return { delta, newTraits, toRarity: tpl.rarityShift, target: tpl.to };
  }

  // 对外主流程：计算候选路径并返回Top结果
  async previewEvolution(petCoreData, context = {}) {
    // 动态固定算法提示融合
    const current = {
      rarity: petCoreData.rarity,
      hp: petCoreData.baseStats?.health,
      attack: petCoreData.baseStats?.attack,
      defense: petCoreData.baseStats?.defense,
      speed: petCoreData.baseStats?.speed,
      magic: petCoreData.baseStats?.magic,
      keywords: petCoreData.specialTraits
    };
    const hints = buildHints(current, this.lastState || {});
    context.promptAugmentations = Object.assign({}, context.promptAugmentations, hints.promptAugmentations);

    // 物种规范化与别名映射，避免因标点/空格/别名导致模板匹配失败
    const normalize = (s) => String(s || '').replace(/[()（）·\\-\\s]/g, '').trim();
    const SPECIES_ALIAS = {
      '火蜥蜴幼体': '火蜥蜴',
      '幼火蜥': '火蜥蜴',
      '火蜥蜴': '火蜥蜴',
      '九尾狐幼体': '九尾狐幼体', // 保留明确幼体
    };

    const rawSpecies = petCoreData.species;
    const key = SPECIES_ALIAS[normalize(rawSpecies)] || normalize(rawSpecies);

    // 模板查找
    let templates = EVOLUTION_TEMPLATES[key] || [];

    // 若无模板，生成程序化备选进化（保证架构可运行）
    if (!templates.length) {
      const baseTraits = Array.from(new Set(petCoreData.specialTraits || []));
      const lvl = petCoreData.level || 1;
      const bond = context.playerBond || 50;
      const env = context.environment || '秘境';
      const rarity = petCoreData.rarity || 'N';

      const procedural = [
        { to: `${key || rawSpecies}之龙变`, req: { level: lvl + 5, bond: bond + 10, env: [env] }, tags: Array.from(new Set([...baseTraits, '觉醒', '蜕变'])), rarityShift: rarity === 'N' ? 'R' : 'SR' },
        { to: `${key || rawSpecies}之秘焰`, req: { level: lvl + 3, bond: bond, env: [env, '火山'] }, tags: Array.from(new Set([...baseTraits, '秘焰', '龙威'])), rarityShift: rarity === 'SR' ? 'SSR' : 'SR' },
      ];
      templates = procedural;
    }

    // 统一评分与效果预测
    const scored = templates.map(tpl => {
      const score = this.scorePath(petCoreData, context, tpl);
      const effects = this.projectEffects(petCoreData, tpl, score);
      return { tpl, score: Number(score.toFixed(3)), effects };
    }).sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 2); // 返回前2条备选
    this.lastState = current;
    this.logMemory({ event: 'previewEvolution', speciesKey: key, pet: petCoreData, context, top, hints });

    // 自检：确保输出结构完整
    const self = await this.selfCheck();
    return { agent: this.name, ok: true, selfCheck: self, candidates: top };
  }
}

module.exports = EvolutionAgent;