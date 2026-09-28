'use strict';
// 第 6 段：结尾（骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md「画面」和 docs/施工.md 重写，台词不改字）。
// 顶层名字一律带本段前缀 S6 / s6。
const S6LINES = seq(1.0, [
  ['帕秋莉！三百道错题，我压成了一张卡片！', { who: 'cirno', mood: 'proud' }],
  '能猜到的，就不用记。',
  '先找规律，',
  '讲给别人听，',
  '错题按原因归类。',
  ['果然，我是最强的！', { who: 'cirno', mood: 'proud' }],
  ['……这句还是只值 1 比特。下课。', { mood: 'smug', hold: 0.6 }],
]);
const S6DUR = seqEnd(S6LINES) + 1.2;

function s6Draw(c, tau, L) {
  spread(c, tau);
  // 开场 / 结尾没有页眉
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 6, key: 'ending', title: '结尾', dur: S6DUR, lines: S6LINES, fn: s6Draw });
