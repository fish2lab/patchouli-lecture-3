'use strict';
// 第 0 段：开场（骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md「画面」和 docs/施工.md 重写，台词不改字）。
// 顶层名字一律带本段前缀 S0 / s0。
const S0LINES = seq(3.8, [
  ['帕秋莉！三百道错题，我要整本背下来！我可是最强的！', { who: 'cirno', mood: 'proud' }],
  ['我这座图书馆有十万本书。你猜，我是怎么记住的？', { mood: 'smug' }],
  ['……全背下来？', { who: 'cirno', mood: 'surprised' }],
  ['一本都没背。我只记猜不到的那一点点。', { mood: 'smug' }],
]);
const S0DUR = seqEnd(S0LINES) + 1.2;

function s0Draw(c, tau, L) {
  spread(c, tau);
  // 开场 / 结尾没有页眉
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 0, key: 'opening', title: '开场', dur: S0DUR, lines: S0LINES, fn: s0Draw, noFlip: true });
