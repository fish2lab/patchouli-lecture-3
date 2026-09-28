'use strict';
// 第 3 段：压缩（第三稿骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md 第三稿重写，台词不改字）。
// 顶层名字一律带本段前缀 S3 / s3。
const S3LINES = seq(1.0, [
  ['反过来说：猜得越准，要记的就越少。预测，就是压缩。', { hold: 1.2 }],
  '现在的大语言模型，训练时也只练这一件事：猜下一个字。',
  '一个汉字在电脑里占 16 比特。让它来猜，只要 3.5 比特左右。',
]);
const S3DUR = seqEnd(S3LINES) + 1.2;

function s3Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第三页 · 预测就是压缩', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 3, key: 'compress', title: '压缩', dur: S3DUR, lines: S3LINES, fn: s3Draw });
