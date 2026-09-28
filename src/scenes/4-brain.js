'use strict';
// 第 4 段：人脑（骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md「画面」和 docs/施工.md 重写，台词不改字）。
// 顶层名字一律带本段前缀 S4 / s4。
const S4LINES = seq(1.0, [
  '人脑也非压不可：一次只能抓住四样左右的东西。',
  '但一样东西可以很大。',
  '让象棋大师看棋盘五秒钟再摆出来，',
  '真实对局他摆对的，是新手的好几倍。',
  '可棋子一乱摆，大师的优势几乎就没了。',
  '他记的是套路，几个棋子一个套路，只占一个位置。',
  '乱摆的棋盘就是噪声。噪声压缩不了，只能硬记。',
  ['那我背三百道题……是在背噪声？', { who: 'cirno', mood: 'surprised' }],
  '对。找出规律，也许只剩十几条。',
  '先问一句，这类题为什么这么做；',
  '再讲给别人听，讲不短，说明还没懂。',
  '最后，错题按原因归类。十道错题，常常是同一个原因。',
]);
const S4DUR = seqEnd(S4LINES) + 1.2;

function s4Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第四页 · 人脑', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 4, key: 'brain', title: '人脑', dur: S4DUR, lines: S4LINES, fn: s4Draw });
