'use strict';
// 第 1 段：猜字（第三稿骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md 第三稿重写，台词不改字）。
// 顶层名字一律带本段前缀 S1 / s1。
const S1LINES = seq(1.0, [
  '玩个游戏。我说上半句，你猜下一个字。',
  '床前明月光，疑是地上——',
  ['霜！', { who: 'cirno' }],
  '猜中了。所以这个字，我其实不用说。',
  '再来。今天的晚饭是冰冻——',
  ['……冰冻什么？', { who: 'cirno' }],
  '青蛙。',
  ['这谁猜得到啊！', { who: 'cirno' }],
  '对。猜不到的字，才真正带来了消息。',
]);
const S1DUR = seqEnd(S1LINES) + 1.2;

function s1Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第一页 · 猜字', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 1, key: 'guess', title: '猜字', dur: S1DUR, lines: S1LINES, fn: s1Draw });
