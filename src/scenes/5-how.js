'use strict';
// 第 5 段：怎么压（第三稿骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md 第三稿重写，台词不改字）。
// 顶层名字一律带本段前缀 S5 / s5。
const S5LINES = seq(1.0, [
  '怎么压？先问：这道题为什么这么做。',
  '再讲给别人听。讲不短，就是还没懂。',
  '最后，错题按原因归类。',
]);
const S5DUR = seqEnd(S5LINES) + 1.2;

function s5Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第五页 · 怎么压', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 5, key: 'how', title: '怎么压', dur: S5DUR, lines: S5LINES, fn: s5Draw });
