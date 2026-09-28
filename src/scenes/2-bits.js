'use strict';
// 第 2 段：比特（第三稿骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md 第三稿重写，台词不改字）。
// 顶层名字一律带本段前缀 S2 / s2。
const S2LINES = seq(1.0, [
  '消息有多少，可以数出来：猜中它，要问几次「是不是」。',
  '你来找我，一半的时候是说「我是最强的」。',
  '我只要问一次「是这句吗」，一半的时候就猜中了。这叫 1 比特。',
  '少见的话，要多问几次。八分之一的话，要问三次：3 比特。',
  ['越难猜，比特越多。', { hold: 1.2 }],
  '常说的话用短暗号，少说的用长暗号，平均下来最省。',
  ['省到不能再省的那个数，香农叫它「熵」。', { hold: 1.2 }],
  ['所以「我是最强的」……只值 1 比特？', { who: 'cirno' }],
  '全幻想乡都猜得到，当然不值钱。',
]);
const S2DUR = seqEnd(S2LINES) + 1.2;

function s2Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第二页 · 比特', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 2, key: 'bits', title: '比特', dur: S2DUR, lines: S2LINES, fn: s2Draw });
