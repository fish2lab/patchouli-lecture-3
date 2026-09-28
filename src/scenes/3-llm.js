'use strict';
// 第 3 段：大模型（骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md「画面」和 docs/施工.md 重写，台词不改字）。
// 顶层名字一律带本段前缀 S3 / s3。
const S3LINES = seq(1.0, [
  '这种会猜的模型，就是大语言模型。',
  '它训练时只做一件事：猜下一个字。',
  '训练的目标，是让真正出现的那个字，平均花的比特最少。',
  '这个数叫交叉熵，就是它的训练损失。',
  '所以训练大模型，就是在造一台压缩机。',
  ['那电脑里的压缩包，也是一本聪明的魔导书？', { who: 'cirno' }],
  '压缩包只会找重复的字句。模型学到了语法和常识，',
  '拿去压图片和声音，都比 PNG、FLAC 省，',
  '只是模型本身的大小没算进去。',
  '有人比了 31 个模型：',
  '压缩得越好，考试分数越高，几乎是一条直线。',
  '所以有人说，压缩就是智能。这还是一个假说，但它很好用。',
]);
const S3DUR = seqEnd(S3LINES) + 1.2;

function s3Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第三页 · 会猜的魔导书', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 3, key: 'llm', title: '大模型', dur: S3DUR, lines: S3LINES, fn: s3Draw });
