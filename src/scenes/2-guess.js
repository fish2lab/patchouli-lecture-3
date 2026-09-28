'use strict';
// 第 2 段：猜字（骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md「画面」和 docs/施工.md 重写，台词不改字）。
// 顶层名字一律带本段前缀 S2 / s2。
const S2LINES = seq(1.0, [
  '换成一整句话。我来猜你的下一个字，猜中了，你就不用传。',
  ['床前明月光，疑是地上……', { who: 'cirno' }],
  ['霜。这个字几乎不用听，只花 0.01 比特。', { mood: 'smug' }],
  ['今天的晚饭是……冰冻青蛙！', { who: 'cirno', mood: 'proud' }],
  ['「青蛙」我可猜不到，一下就贵了。', { mood: 'surprised' }],
  '猜得越准，要传的越少：预测和压缩，是同一件事。',
  '上一集的「惊讶」，就是要付的比特。',
  '香农让人一个字母一个字母地猜英文，',
  '英语每个字母只要 1 比特左右。',
  '一个汉字在电脑里占 16 比特；让会猜的模型来猜，只要 3.5 比特左右。',
]);
const S2DUR = seqEnd(S2LINES) + 1.2;

function s2Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第二页 · 猜字', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 2, key: 'guess', title: '猜字', dur: S2DUR, lines: S2LINES, fn: s2Draw });
