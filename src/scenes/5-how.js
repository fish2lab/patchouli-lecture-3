'use strict';
// 第 5 段：怎么压（第三稿）。接第 4 段末沉下去的十二摞错题卡。段首、段末各 0.8 秒是标准画面。
// 站位区（穿模）：两人一直在 EP3 标准站位（帕秋莉包围框 x 205–455，琪露诺 1446–1754）；
//   卡片摞在 x 520–1410、y 480–830，三个小图一行在上方 y 150–260，讲解气泡在 x 480–880、y 290–420（尾巴尖停在帕秋莉框外）。
//   开头 十二摞从书页里浮上来
//   L1 「为什么」时上方第一个位置冒出一枚问号冰晶，一根线垂到一摞上（那一摞抬起一点，其余变淡）；句末线收起
//   L2 帕秋莉对琪露诺讲，气泡里是三行墨线，说到「讲不短」缩成两行、再缩成短短一行；蜡封（实验，自我解释）；
//      句末气泡缩小，飞到第二个位置
//   L3 「归类」时十二摞依次一跳；第三个位置冒出三小摞卡片。三个小图排成一行停住，最后连同卡片摞一起收掉
// 气泡里不写字（屏幕上只写正在念的关键词）；小图不压书脊。顶层名字一律带本段前缀 S5 / s5；卡片摞借第 4 段的 s4Stacks。
const S5LINES = seq(1.0, [
  ['怎么压？先问：这道题为什么这么做。', { pause: .6, hold: 1.4 }],
  ['再讲给别人听。讲不短，就是还没懂。', { pause: .3, hold: 2.2 }],
  ['最后，错题按原因归类。', { pause: .3, hold: 1.8 }],
]);
const S5T = i => S5LINES[i][0], S5E = i => S5LINES[i][1];
const S5W = (i, f) => { const v = voiceOf(S5LINES[i][2]), l = S5LINES[i], h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S5REST = .85;
const S5DUR = S5E(2) + .6 + S5REST;

const S5B = (() => { const T = S5T, E = S5E, w = S5W; return {
  rise: [.8, 1.5],
  ask: w(0, .5), thread: [w(0, .6), w(0, .9)], threadOff: [E(0) - .5, E(0) - .1],
  talk: [w(1, .08), w(1, .45), w(1, .8)], seal: w(1, .2), toSlot: [E(1) - .7, E(1) - .05],
  hop: [w(2, .3), w(2, .95)], stacks3: w(2, 1),
  end: [E(2) + .05, E(2) + .6],
}; })();
const S5SLOT = [[700, 205], [1010, 205], [1320, 205]];   // 三个小图的位置（避开书脊 CX±20）
const S5HOT = 1;                                         // 问号连着的那一摞

// 问号冰晶（第二稿人脑段）
function s5Crystal(c, x, y, r, al, t) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(Math.sin(t * 1.3) * .05);
  const hex = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU - Math.PI / 2; hex.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU - Math.PI / 2; rline(c, [[Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3]], { w: 4, color: alpha(EP2_ICE_DEEP, .9), seed: 4470 + k }); }
  cutPaper(c, hex, EP2_ICE, { seed: 4471, step: 10, blur: 4, grain: .04 });
  c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.stroke(polyPath(hex.map(([a, b]) => [a * .8, b * .8])));
  zh(c, '？', 0, r * .36, { size: r * 1.05, color: '#5f86a6', align: 'center' });
  c.restore();
}
// 讲解气泡：lines = 每行墨线的长度比例（不写字）；(x, y) 左上角，宽 w
function s5Talk(c, x, y, w, lines, o = {}) {
  const { tail = null, al = 1, seed = 5480, p = 1 } = o, lh = 34 * (w / 400), h = lines.length * lh + 36 * (w / 400);
  c.save(); c.globalAlpha *= al;
  bubble(c, x, y, w, h, { tail, fill: '#f7f3ea', seed, w: 3 });
  lines.forEach((f, k) => { const ly = y + 18 * (w / 400) + lh * (k + .55);
    rline(c, [[x + w * .08, ly], [x + w * (.08 + .84 * f), ly]], { w: Math.max(3.5, 5 * w / 400), color: alpha(P.ink2, .75), seed: seed + 10 + k, amp: 2.2, p: clamp(p * lines.length - k, 0, 1) }); });
  c.restore();
  return h;
}
const S5TALK = [[1, .95, .7], [.9, .5], [.75]];

function s5Draw(c, tau, L) {
  const B = S5B, T = S5T, w = S5W;
  spread(c, tau);
  pageHeader(c, '第五页 · 怎么压', tau, .9);
  const out = 1 - sm(B.end[0], B.end[1], tau);

  // ---- 十二摞（接第 4 段）：L1 那一摞抬起、其余变淡；L3 依次一跳 ----
  const focus = win(B.ask, B.threadOff[1] + .2, tau, .35);
  s4Stacks(c, { al: out, rise: sm(B.rise[0], B.rise[1], tau, easeOutBack) * (1 - sm(B.end[0], B.end[1], tau)),
    dim: s => s === S5HOT ? 1 : 1 - .5 * focus,
    hop: s => { const hs = lerp(B.hop[0], B.hop[1], s / (S4NS - 1)); return Math.sin(sm(hs, hs + .3, tau, t => t) * Math.PI) * 22 + (s === S5HOT ? 12 * focus : 0); } });

  // ---- 第一个小图：问号冰晶 + 垂到那一摞的线 ----
  const [qx, qy] = S5SLOT[0], qa = sm(B.ask, B.ask + .45, tau, easeOutBack) * out;
  const [hx, hy] = s4StackPos(S5HOT), th = sm(B.thread[0], B.thread[1], tau) * (1 - sm(B.threadOff[0], B.threadOff[1], tau));
  if (th > 0) thread(c, [qx, qy + 48], [hx, hy - 46 - S4PER * 3 - 30 - 12 * focus], { p: th, sag: 12, color: alpha('#5f86a6', .9) });
  pop(c, qx, qy, qa, () => s5Crystal(c, qx, qy, 44, 1, tau));

  // ---- 第二个小图：讲解气泡越讲越短，句末缩小飞到第二个位置 ----
  const idx = tau < B.talk[1] ? 0 : tau < B.talk[2] ? 1 : 2, lines = S5TALK[idx];
  const bIn = sm(B.talk[0], B.talk[0] + .35, tau, easeOutBack), fly = sm(B.toSlot[0], B.toSlot[1], tau);
  if (bIn > 0) {
    const shrink = idx > 0 ? easeOutBack(sm(B.talk[idx], B.talk[idx] + .35, tau)) : 1;
    const bw0 = [400, 300, 190][idx] * (idx > 0 ? lerp(idx === 1 ? 400 / 300 : 300 / 190, 1, clamp(shrink, 0, 1)) : 1), bw = lerp(bw0, 190, fly), bx = lerp(480, S5SLOT[1][0] - 95, fly), by = lerp(290, S5SLOT[1][1] - 42, fly) - Math.sin(fly * Math.PI) * 40;
    pop(c, 480, 420, fly > 0 ? 1 : bIn, () => s5Talk(c, bx, by, bw, lines, { tail: fly < .05 ? [462, 440] : null, al: out, seed: 5480 + idx, p: idx === 0 ? sm(B.talk[0] + .1, B.talk[0] + .9, tau) : 1 }));
    seal(c, 905, 415, 'exp', { k: sm(B.seal, B.seal + .55, tau, t => t), r: 24, al: 1 - fly, label: '自我解释', labelSize: 19 });
  }

  // ---- 第三个小图：三小摞卡片 ----
  const s3 = sm(B.stacks3, B.stacks3 + .45, tau, easeOutBack) * out;
  if (s3 > 0) { const [sx, sy] = S5SLOT[2];
    pop(c, sx, sy + 30, s3, () => { for (let m = 0; m < 3; m++) for (let k = 0; k < 4; k++) s4Card(c, sx + (m - 1) * 62, sy + 34 - k * 6, (hash(k, 5490 + m) - .5) * .1, .85, 1, 5500 + m * 10 + k, k === 3); }); }

  // ---- 两人（标准站位，不走动） ----
  let pPose = 'lecture', pGest, pMood = 'normal';
  if (tau >= B.ask - .2 && tau < T(1)) { pPose = 'point'; }
  if (tau >= B.talk[0] && tau < B.toSlot[0]) { pPose = 'lecture'; pGest = .6 + .3 * Math.sin(twos(tau) * 3); }
  if (tau >= B.talk[2] && tau < T(2)) pMood = 'smug';
  drawPatchouli(c, { ...EP3.pch, pose: pPose, gesture: pGest, mood: moodOf(L, 'patchouli', pMood), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  let pose = 'stand', mood = 'normal', look = 0, gest = null;
  if (tau >= B.ask - .3 && tau < T(1)) { pose = 'think'; mood = 'confused'; }
  if (tau >= T(1) && tau < B.talk[2]) { pose = 'think'; look = .6; }
  if (tau >= B.talk[2] && tau < T(2)) { pose = 'stand'; mood = 'happy'; }
  if (tau >= B.hop[0] && tau < B.end[0]) { pose = 'proud'; mood = 'proud'; gest = .8; }
  drawCirno(c, { ...EP3.cir, pose, gesture: gest, look, mood: moodOf(L, 'cirno', mood), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

scene({ order: 5, key: 'how', title: '怎么压', dur: S5DUR, lines: S5LINES, fn: s5Draw });
