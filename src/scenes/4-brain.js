'use strict';
// 第 4 段：人脑（第三稿骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md 第三稿重写，台词不改字）。
// 顶层名字一律带本段前缀 S4 / s4。
const S4LINES = seq(1.0, [
  ['那我的脑子呢？', { who: 'cirno' }],
  '你的脑子，一次只能抓住四样左右的东西。',
  ['可一样东西，可以很大。', { hold: 1.2 }],
  '象棋大师看一眼棋盘，摆对的棋子是新手的好几倍。',
  '可要是棋子乱摆，他就和新手差不多了。',
  '因为他记的是套路：几颗棋子一组，只占一个位置。',
  '乱摆的棋子没有套路，只能一颗一颗硬记。',
  ['死记硬背，就是在记乱摆的棋子。', { hold: 1.2 }],
  ['那我的三百道题……', { who: 'cirno' }],
  '找出错的原因，也许只剩十几条。',
]);
const S4DUR = seqEnd(S4LINES) + 1.2;

function s4Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第四页 · 人脑', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 4, key: 'brain', title: '人脑', dur: S4DUR, lines: S4LINES, fn: s4Draw });
