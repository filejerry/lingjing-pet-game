// StoryAgent.js - 进化叙事Agent（遵循三层AI结构与三层固定算法）
const BaseAgent = require('../core/BaseAgent');
const { buildHints } = require('../../ai/FixedAlgorithmEngine');

/**
 * 固定算法三原则（简版）
 * - 结构固化：统一叙事结构 S = [引, 承, 转, 合]
 * - 规则固化：元素映射规则 R：{species->母题, rarity->语气, traits->意象, env->场景}
 * - 语言固化：语义模板 T：分层短句+并列意象+收束句
 */
class StoryAgent extends BaseAgent {
  constructor() {
    super('StoryAgent', ['evolution_narrative', 'template_mapping', 'context_weaving', 'self_test']);
    this.lastState = null;
  }

  rarityTone(rarity) {
    switch (rarity) {
      case 'SSS': return '传说';
      case 'SSR': return '史诗';
      case 'SR': return '稀有';
      case 'R': return '优秀';
      default: return '普通';
    }
  }

  // L3 判断层：将核心数据与候选进化映射为叙事母题
  mapMotifs(pet, ctx, candidate) {
    const species = pet.species || '未知灵体';
    const tone = this.rarityTone(pet.rarity);
    const env = (ctx.environment || '秘境');
    const traits = Array.from(new Set([...(pet.specialTraits || []), ...((candidate?.effects?.newTraits) || [])]));
    const to = candidate?.effects?.target || candidate?.tpl?.to || `${species}之变`;

    return {
      species, tone, env, traits,
      toForm: to,
      deltas: candidate?.effects?.delta || {},
    };
  }

  // L2 进化层：生成叙事结构（引、承、转、合）
  buildStoryStructure(m) {
    const t = m.traits.slice(0, 3).join('、') || '未名特质';
    const d = m.deltas;
    const deltaText = `生命+${d.health ?? 0} 攻击+${d.attack ?? 0} 防御+${d.defense ?? 0} 速度+${d.speed ?? 0}`;

    const intro = `在${m.env}的寂光之下，${m.species}以${m.tone}的气息苏醒。`;
    const rise = `它执${t}为印，循旧轨而不囿其形，心意沿世界树脉络缓缓攀升。`;
    const turn = `当命理与契约在指间合符，形质向「${m.toForm}」迁移，属性涌动：${deltaText}。`;
    const close = `彼时风止火熄，纹理与名号落定，此次进化，被刻入灵境的年轮。`;

    return [intro, rise, turn, close];
  }

  // L3 固化层：输出演出文本（逐行展示友好）
  solidify(lines) {
    return {
      style: 'line-by-line',
      lines,
      durationMs: lines.length * 1500,
      quality: 'stable-template-v1'
    };
  }

  // 对外主流程：生成随进化的叙事片段
  async previewEvolutionStory(petCoreData, context = {}, evolutionCandidate) {
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

    const motifs = this.mapMotifs(petCoreData, context, evolutionCandidate || {});
    const lines = this.buildStoryStructure(motifs);
    if (hints && hints.suggestions && hints.suggestions.length) {
      const hintLine = `暗线提示：${hints.suggestions[0].replace('建议','')}`;
      lines.splice(Math.max(1, lines.length - 2), 0, hintLine);
    }
    const output = this.solidify(lines);
    this.lastState = current;
    this.logMemory({ event: 'storyPreview', motifs, output, hints });
    const self = await this.selfCheck();
    return { agent: this.name, ok: true, selfCheck: self, narrative: output };
  }
}

module.exports = StoryAgent;