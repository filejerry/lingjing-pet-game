/**
 * FixedAlgorithmEngine
 * 根据宠物状态变化与标签，生成三层提示词的增强片段（evolution/story/numerical）。
 * 该模块不依赖外部服务，纯规则运算，便于扩展与测试。
 */
function clampDelta(val) {
  if (val > 9999) return 9999;
  if (val < -9999) return -9999;
  return val;
}

function rarityWeight(rarity) {
  const map = { N: 1.0, R: 1.1, SR: 1.25, SSR: 1.5, SSS: 1.8 };
  return map[rarity] || 1.0;
}

function tagsFromKeywords(keywords = []) {
  const set = new Set();
  (keywords || []).forEach(k => {
    const t = String(k).toLowerCase();
    if (t.includes('龙')) set.add('dragon');
    if (t.includes('星') || t.includes('星辉') || t.includes('星光')) set.add('stellar');
    if (t.includes('自然') || t.includes('树') || t.includes('花') || t.includes('草')) set.add('nature');
    if (t.includes('暗') || t.includes('影')) set.add('shadow');
    if (t.includes('时') || t.includes('时间')) set.add('chrono');
    if (t.includes('虚') || t.includes('幻')) set.add('mystic');
  });
  return Array.from(set);
}

function buildHints(current, last) {
  const cur = current || {};
  const prev = last || {};
  const rarity = cur.rarity || 'N';

  const deltas = {
    hp: clampDelta((cur.hp ?? 0) - (prev.hp ?? 0)),
    attack: clampDelta((cur.attack ?? 0) - (prev.attack ?? 0)),
    defense: clampDelta((cur.defense ?? 0) - (prev.defense ?? 0)),
    speed: clampDelta((cur.speed ?? 0) - (prev.speed ?? 0)),
    magic: clampDelta((cur.magic ?? 0) - (prev.magic ?? 0)),
  };

  const kw = Array.isArray(cur.keywords) ? cur.keywords : [];
  const tags = tagsFromKeywords(kw);

  const w = rarityWeight(rarity);

  // 规则建议集合
  const suggestions = [];

  // 速度上升
  if (deltas.speed > 0) {
    suggestions.push('由于速度提升，建议考虑“敏捷/闪避/连击/先手”相关能力与词条。');
  }
  // 魔力上升
  if (deltas.magic > 0) {
    suggestions.push('魔力增强，可输出“灵纹/法阵/星辉/共鸣”类能力与效果。');
  }
  // 攻击上升、防御下降
  if (deltas.attack > 0 && deltas.defense < 0) {
    suggestions.push('攻击上升但防御下降，呈现高风险高回报倾向，建议“暴击提升/背水一战/玻璃利刃”类特性。');
  }
  // 防御显著上升
  if (deltas.defense > 0 && deltas.defense >= Math.max(deltas.attack, deltas.speed)) {
    suggestions.push('防御显著提升，建议“护盾/格挡/反击/稳固”类能力。');
  }
  // HP 显著上升
  if (deltas.hp > 0 && deltas.hp >= 20 * w) {
    suggestions.push('生命值提升明显，建议“回复/再生/血脉觉醒/坚韧”相关词条。');
  }

  // 稀有度引导
  if (['SSR', 'SSS'].includes(rarity)) {
    suggestions.push('稀有度较高，应加入更强的神话意象与传承词条，如“神纹刻印/祖灵呼应/圣徽祝福”。');
  }

  // 生态标签引导
  if (tags.includes('dragon')) {
    suggestions.push('龙族标签：考虑“龙息/龙鳞/龙威/古碑誓约/血统觉醒”。');
  }
  if (tags.includes('stellar')) {
    suggestions.push('星象标签：考虑“星辉庇护/星铸碎片/星宿指引/夜空共鸣”。');
  }
  if (tags.includes('nature')) {
    suggestions.push('自然标签：考虑“灵泉滋养/藤蔓护体/花灵同伴/树语低鸣”。');
  }
  if (tags.includes('shadow')) {
    suggestions.push('暗影标签：考虑“潜行/残影/噬光/夜幕折跃”。');
  }
  if (tags.includes('chrono')) {
    suggestions.push('时间标签：考虑“时流加速/回溯刻印/命运分岔/瞬步”。');
  }
  if (tags.includes('mystic')) {
    suggestions.push('虚幻标签：考虑“幻象折射/镜域/虚空印记/灵识”。');
  }

  // 三层提示词增强片段
  const evolutionHint =
    `固定算法建议：${suggestions.join(' ')} 请在进化候选的“特性词条”和“数值倾向”中体现上述方向，保持中文与可玩性。`;
  const storyHint =
    `固定算法建议：${suggestions.join(' ')} 请在演出文本中以隐喻或意象轻描，分句呈现，不要直白罗列。`;
  const numericalHint =
    `固定算法建议：根据上述方向进行小幅数值固化与特性条目选择，遵循稀有度倍率与稳健增幅。`;

  return {
    tags,
    deltas,
    suggestions,
    promptAugmentations: {
      evolution: evolutionHint,
      story: storyHint,
      numerical: numericalHint,
    },
  };
}

module.exports = {
  buildHints,
};