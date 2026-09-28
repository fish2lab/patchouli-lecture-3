'use strict';
// 第 1 段：暗号（骨架占位：只画书页、页眉和标准站位的两人。施工包按 docs/方案.md「画面」和 docs/施工.md 重写，台词不改字）。
// 顶层名字一律带本段前缀 S1 / s1。
const S1LINES = seq(1.0, [
  '琪露诺每天往图书馆传话，来来回回就四句。',
  '一半是「我是最强的」，四分之一是「肚子饿了」，',
  '「来玩」和「考试没及格」各占八分之一。',
  '每回答一个是或否，就是 1 比特。',
  '四句话，每句两个比特，刚好够分。',
  '聪明一点：最常说的那句只给 1 比特，越少见的话暗号越长。',
  '平均下来，每句只要 1.75 比特。',
  '概率每砍一半，就多 1 比特。越难猜的消息，越值钱。',
  '把每句话的比特数按出现次数平均，叫作「熵」。',
  '1948 年香农证明：不管暗号怎么编，平均都短不过熵。',
  ['所以「我是最强的」……只值 1 比特？', { who: 'cirno', mood: 'surprised' }],
  ['全幻想乡都猜得到的话，本来就不值钱。', { mood: 'smug' }],
]);
const S1DUR = seqEnd(S1LINES) + 1.2;

function s1Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第一页 · 暗号', tau, .9);
  drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  drawCirno(c, { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 1, key: 'code', title: '暗号', dur: S1DUR, lines: S1LINES, fn: s1Draw });
