'use strict';
// 第 5 段：好奇心（骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md「画面」和 docs/施工.md 重写，台词不改字）。
// 顶层名字一律带本段前缀 S5 / s5。
const S5LINES = seq(1.0, [
  '找规律的时候，好奇心会带路。',
  '太熟的东西早就压缩好了，所以无聊；',
  '太难的看起来像噪声，压不动，所以想逃。',
  '半懂不懂的时候最想学。迪昂说，好奇心就像大脑的调速器。',
]);
const S5DUR = seqEnd(S5LINES) + 1.2;

function s5Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第五页 · 好奇心', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 5, key: 'curious', title: '好奇心', dur: S5DUR, lines: S5LINES, fn: s5Draw });
