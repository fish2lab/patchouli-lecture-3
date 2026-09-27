'use strict';
// 第 1 段：预测机（第二轮：立体书）。「冰的网络」第一次出现，平面画法和立体画法都在 src/net.js。
//   舞台：摊开的魔导书。先平着长出网络，再镜头压低成斜看，网络像立体书一样立起来（圆片、冰晶、两张牌立在纸铰链上，线拱成纸条），
//   两个人也从书页上立起来，在零件之间走动；段末全部折平、镜头回到正上方。
//   进场（平）：第一帧 = 开场最后一帧（spread + 结霜 9 分卷在 EP2.exam + NET.cast 两人，noFlip）；试卷淡下去，霜花长成三根线、冰晶、三个圆片，
//         现实牌背面朝上滑进来。
//   立起：镜头压低成斜看，冰晶、三个圆片、现实牌依次折起，纸条拱起来，两人也立起来。
//   L1 帕秋莉走到输入那一列旁边；三个输入依次一跳，冰珠沿拱起的纸条流进冰晶（书页上手写「线越粗，权重越大」）→ 冰晶一胀 → 吐出预测牌。
//      镜头先看输入这一半，出预测牌时往右移。琪露诺走到现实牌旁边。
//   L2 镜头推到两张牌：琪露诺一指，现实牌翻开 → 虚线拉过来、红笔括出差距 → 火花炸开，琪露诺吓一跳。
//   L3 【全片最重要的镜头】火花飞回冰晶，镜头压得更低、推近，贴着「眼睛」那根纸条跟拍火花往回跑，身后的纸条变粗（旁边耳朵那根变细）；
//      帕秋莉在纸条尽头指着。镜头拉回全景：第二轮，冰珠按新粗细再流一遍，新预测牌带着上一次的灰虚线，现实牌再翻开，差距小了很多；
//      琪露诺高兴地飞上冰晶，站在尖上。
//   L4 镜头移到左页前角：帕秋莉走过去，一块立牌折起来，写着「1972 年 / 雷斯科拉 & 瓦格纳的学习模型」。
//   L5–L6 立牌往后倒平，前面一块新立牌翻起来（像翻页）：铅笔画的小多层网络，「delta 规则」只描最后一层，「反向传播」红点从输出往回跑。
//   L7 镜头上到冰晶尖上的琪露诺，她托着下巴，头上一个问号；立牌倒下收掉。
//   L8 全景偏左：预测牌收回、现实牌翻回去；琪露诺把一张牌举过头顶，从冰晶上扔进「眼睛」，冰珠流进冰晶（她跟着冰晶一颠）。
//   段末：两人回到标准站位，立体件全部折平，镜头回到正上方；ΔV = αβ(λ − ΣV) 在右页右上角淡淡出现约 1 秒。
//   最后 0.6 秒 = 平的 spread + 网络静止态 netRest()（平面画法）+ NET.cast 两人，没有页眉、公式。第 2 段从这张画翻页。
// 性能：书页（spread 只依赖常数）第一次用时画进一张 2 倍大的缓存，之后每帧按透视一条条贴出来；不用 c.filter。
// 顶层名字一律带本段前缀 S1 / s1。
const S1LINES = seq(1.3, [
  '你的大脑，其实一直在预测。',
  ['眼睛、耳朵送来的信号，各乘一个权重，加起来，就是它的预测。', { pause: 1.3, hold: 1.1 }],
  ['然后拿预测去对现实。对不上，就会「惊讶」。', { hold: 1.0 }],
  ['惊讶有多大，权重就改多少。下次，猜得更准一点。', { hold: 4.8 }],
  '这是 1972 年，雷斯科拉和瓦格纳提出的学习模型。',
  ['学计算机的同学应该眼熟：', { mood: 'smug' }],
  ['它和神经网络里的 delta 规则很像，是反向传播的简化版。', { hold: .6 }],
  ['所以我的脑子……是一台会自己训练的神经网络？', { who: 'cirno', mood: 'surprised' }],
  ['可以这么类比。区别是，训练数据得你自己去喂。', { mood: 'smug', hold: 1.0 }],
]);
const S1T = i => S1LINES[i][0], S1E = i => S1LINES[i][1];
// S1W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S1W = (i, f) => { const v = voiceOf(S1LINES[i][2]), l = S1LINES[i], h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S1END = seqEnd(S1LINES), S1DUR = S1END + 3.2;

// 两轮学习的数：权重（眼睛、耳朵、书页）、预测水位、现实水位。学完的权重就是静止态的权重
const S1W0 = [.2, .65, .3], S1W1 = netRest().lines.map(l => l.w), S1DW = S1W1.map((w, i) => w - S1W0[i]);
const S1V0 = .3, S1V1 = .68, S1REAL = netRest().real.v;

// ===================== 节拍（全部由台词时间算出） =====================
const S1B = (() => { const w = S1W, T = S1T, E = S1E, B = {
  frost: [.45, 2.6], exam: [.8, 2.3], node: [1.3, 1.9], grow: [1.8, 2.8], tok: 2.5, real: [w(0, .75), w(0, .75) + .6],
  tilt: [3.45, 5.6], popN: 3.75, popT: [3.95, 4.1, 4.25], popC: 4.45, popP: 4.2, popR: 4.5,
  send: [w(1, 0), w(1, .1), w(1, .2)], flow: .95, sum: w(1, .6), pred0: [w(1, .76), w(1, .95)], note: w(1, .36), cwalk: [w(1, .8), w(1, .8) + 1.0],
  flip0: [w(2, .3), w(2, .45)], cmp0: [w(2, .5), w(2, .7)], burst: [w(2, .8), w(2, .95)],
  back: [w(3, .02), w(3, .25)], down: [w(3, .3), w(3, .3) + 2.9],
  y1972: w(4, .12), rw: w(4, .38), plA: w(4, 0) - .05, plTurn: T(5) + .1,
  sketch: [T(5) + .8, E(5) + .2], delta: w(6, .22), bp: [w(6, .52), w(6, .85)], plOut: T(7) + .3,
  cirQ: w(7, .05), reset: [w(8, .28), w(8, .42)], hold: w(8, .42), fly: [w(8, .6), w(8, .82)], feed: w(8, .82),
  fold: S1END + .05, foldC: S1END + .75, flat: [S1END + .15, S1END + 1.55], formula: [S1END + 1.45, S1END + 2.6],
};
B.r2 = B.down[1] + .5; B.cfly = [B.r2 + 4.0, B.r2 + 5.0]; B.home = [S1END - .45, S1END + .6];
return B; })();

// 折起：t0 起 d 秒弹起（带回弹），t1 起 0.4 秒折平。返回 0..~1.1（1 = 竖直）
const s1Up = (tau, t0, t1 = Infinity, d = .5) => easeOutBack(clamp((tau - t0) / d, 0, 1), 1.9) * (1 - sm(t1, t1 + .4, tau));

// 网络这一刻的参数（纯函数）
function s1Net(tau) {
  const B = S1B, o = netRest(), r2 = B.r2;
  const learned = tau >= B.down[1];
  o.lines.forEach((l, i) => {
    l.w = learned ? S1W1[i] : S1W0[i];
    l.grow = sm(B.grow[0] + i * .12, B.grow[1] + i * .12, tau);
    l.k = easeOutBack(sm(B.tok + i * .12, B.tok + .4 + i * .12, tau));
    const hits = [B.send[i], B.down[1] - .05, r2 + .55 + i * .08].concat(i === 0 ? [B.feed] : []);
    l.pulse = Math.max(...hits.map(h => tau > h && tau < h + .45 ? (tau - h) / .45 : 0));
    const fl = [[B.send[i] + .05, B.send[i] + .05 + B.flow], [r2 + .6 + i * .08, r2 + .6 + i * .08 + B.flow]].concat(i === 0 ? [[B.feed + .05, B.feed + .05 + B.flow]] : []);
    const f = fl.find(([a, b]) => tau > a && tau < b); l.flow = f ? (tau - f[0]) / (f[1] - f[0]) : null;
  });
  const sums = [B.sum, r2 + 1.55, B.feed + .85];
  o.node = { k: easeOutBack(sm(B.node[0], B.node[1], tau)), pulse: Math.max(...sums.map(h => tau > h && tau < h + .5 ? (tau - h) / .5 : 0)) };
  const k0 = sm(B.pred0[0], B.pred0[1], tau) * (1 - sm(r2 + .1, r2 + .5, tau));
  const k1 = sm(r2 + 1.8, r2 + 2.4, tau) * (1 - sm(B.reset[0], B.reset[1], tau));
  o.pred = tau < r2 + .5 ? (k0 > 0 ? { v: S1V0, k: k0 } : null) : (k1 > 0 ? { v: S1V1, k: k1, ghost: S1V0 } : null);
  const flip = tau < r2 ? sm(B.flip0[0], B.flip0[1], tau) * (1 - sm(r2 + .05, r2 + .45, tau))
    : tau < B.reset[0] - .5 ? sm(r2 + 2.7, r2 + 3.1, tau) : 1 - sm(B.reset[0], B.reset[1], tau);
  o.real = { v: S1REAL, flip, k: sm(B.real[0], B.real[1], tau) };
  o.cmp = tau < r2 ? sm(B.cmp0[0], B.cmp0[1], tau) * (1 - sm(r2 - .1, r2 + .05, tau)) : sm(r2 + 3.2, r2 + 3.7, tau) * (1 - sm(B.reset[0] - .2, B.reset[0], tau));
  // 火花：炸开（L2 末）→ 停住 → 回到冰晶 → 沿线慢慢跑回去（跟拍）
  if (tau >= B.burst[0] && tau < B.down[1]) {
    const p = tau < B.back[0] ? .15 * sm(B.burst[0], B.burst[1], tau, x => x)
      : tau < B.down[0] ? lerp(.15, .4, sm(B.back[0], B.back[1], tau, x => x)) : lerp(.4, 1, sm(B.down[0], B.down[1], tau, x => easeSine(x) * .35 + x * .65));
    o.spark = { p, dw: S1DW };
  }
  // 立起程度
  const F = B.fold;
  o.up = { tok: [0, 1, 2].map(i => s1Up(tau, B.popT[i], F + i * .08)), node: s1Up(tau, B.popN, F + .25), cards: s1Up(tau, B.popC, F + .1),
    arch: [0, 1, 2].map(i => sm(B.popT[i] + .15, B.popT[i] + .9, tau) * (1 - sm(F - .05, F + .35, tau))) };
  return o;
}

// ===================== 镜头 =====================
// 对准 [书页 X, Y, 离页高 hc, 推近倍数, 俯仰倍数]：这一点落在画面正中略上。tilt = 0 时就是正上方的平面（和开场一样）
// 第 6 项：这一点落在屏幕中线上方多少像素（越大，书页远端的桌面越少）
const S1VIEW = { WIDE: [960, 600, 110, 1.1, 1, 30], LEFT: [800, 560, 100, 1.38, 1, 60], MID: [1030, 560, 120, 1.25, 1, 50], CARDS: [1270, 600, 150, 1.45, 1, 40],
  NODE: [940, 520, 90, 1.6, 1.05, 110], WIDE2: [990, 600, 110, 1.12, 1, 30], PLAC: [470, 740, 150, 1.5, 1, 40], CIRNO: [960, 546, 300, 1.35, 1, 90], FEED: [780, 600, 160, 1.22, 1, 50] };
function s1View(tau, o) {
  const B = S1B, T = S1T, w = S1W, A = S1VIEW;
  const tilt = sm(B.tilt[0], B.tilt[1], tau, easeIO) * (1 - sm(B.flat[0], B.flat[1], tau, easeIO));
  let aim = key(tau, [[0, A.WIDE], [B.tilt[1], A.WIDE], [T(1) - .2, A.WIDE], [T(1) + 1.4, A.LEFT], [w(1, .72), A.LEFT], [w(1, .95), A.MID], [T(2), A.MID], [w(2, .25), A.CARDS],
    [B.back[0], A.CARDS], [B.down[0], A.NODE], [B.down[1] + .3, A.NODE], [B.down[1] + 1.4, A.WIDE2], [T(4) - .4, A.WIDE2], [T(4) + .9, A.PLAC], [T(7) - .3, A.PLAC], [T(7) + .9, A.CIRNO],
    [T(8) - .1, A.CIRNO], [T(8) + 1.0, A.FEED], [S1END, A.FEED], [B.flat[1], A.WIDE]]);
  // 跟拍：火花沿「眼睛」那根纸条往回跑，镜头压低、推近，贴着它走（略偏向耳朵那根，两根的变化都在画里）
  const fol = sm(B.down[0] - .35, B.down[0] + .45, tau) * (1 - sm(B.down[1] + .15, B.down[1] + 1.2, tau));
  if (fol > 0 && o.spark) { const s = o.spark.p >= .4 ? netSparkAt3(o, 0) : netSparkAt3(o), e = o.spark.p >= .4 ? netSparkAt3(o, 1) : s;
    aim = aim.map((v, j) => lerp(v, [lerp(s[0], e[0], .25) + 30, lerp(s[1], e[1], .25) + 30, s[2] * .8, 2.3, .88, 70][j], fol)); }
  else if (fol > 0) aim = aim.map((v, j) => lerp(v, [640, 360, 60, 2.3, .88, 70][j], fol));
  const [X, Y, hc, z0, pf, up] = aim, V = { p: -1.02 * pf * tilt, cx: CX + (X - CX) * tilt, cy: 760, zm: lerp(1, z0 * (1 + .012 * Math.sin(tau * .5)), tilt), dy: 0, tilt };
  const pt = netP(V, X, Y, hc); V.dy = (-up - (pt[1] - CY) * V.zm) * tilt;
  return V;
}

// ===================== 书页（斜看） =====================
// spread 只依赖常数：第一次用时画进 2 倍大的缓存，之后每帧按透视一条条贴出来（和 kit 的 tiltPlane 同一套映射，但不用每帧重画整页）
let S1BOOK = null;
function s1BookImg() { if (!S1BOOK) { S1BOOK = document.createElement('canvas'); S1BOOK.width = W * 2; S1BOOK.height = H * 2; const g = S1BOOK.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); spread(g, 0); } return S1BOOK; }
function s1Book(c, V) {
  const img = s1BookImg(), S = 2, st = 4, cp = Math.cos(V.p), sp = Math.sin(V.p);
  c.fillStyle = WOOD; c.fillRect(-3000, -3000, W + 6000, H + 6000);
  const map = y => { const d = y - V.cy, k = NET3.F / (NET3.F + d * sp); return [V.cy + d * cp * k, k]; };
  for (let y = 0; y < H; y += st) { const [y0, k0] = map(y), [y1] = map(Math.min(H, y + st)); if (y1 <= y0) continue;
    const s0 = CY + V.dy + (y0 - CY) * V.zm, s1 = CY + V.dy + (y1 - CY) * V.zm; if (s1 < -10 || s0 > H + 10) continue;
    c.drawImage(img, 0, y * S, W * S, st * S, V.cx - V.cx * k0, y0, W * k0, y1 - y0 + .6); }
}
// 书页上的一段字：在 (x, y) 附近按书页平面仿射画
function s1OnPage(c, V, x, y, fn) { c.save(); c.transform(...netPlane(V, y, 0, 0, x, 60)); fn(c); c.restore(); }

// ===================== 人物（立在书页上的剪纸人偶） =====================
// 走位：legs = [[t0, t1, [x, y]], …] 依次走过去（一蹦一蹦），返回 [x, y, 蹦起高度]
function s1Move(tau, home, legs) {
  let p = home, hop = 0;
  for (const [t0, t1, q] of legs) { if (tau >= t1) { p = q; continue; }
    if (tau > t0) { const u = (tau - t0) / (t1 - t0), e = easeIO(u), n = Math.max(2, Math.round((t1 - t0) * 3.2)); hop = Math.abs(Math.sin(u * Math.PI * n)) * 22; p = [lerp(p[0], q[0], e), lerp(p[1], q[1], e)]; }
    break; }
  return [p[0], p[1], hop];
}
const S1P = { home: [NET.cast.pch.x, NET.cast.pch.y], in: [340, 520], pl: [600, 910] };
const S1C = { home: [NET.cast.cir.x, NET.cast.cir.y], real: [1548, 700], node: [NET.node.x, NET3.nodeY] };
// 帕秋莉这一刻：位置、姿势
function s1Pch(tau, L) {
  const B = S1B, T = S1T, E = S1E;
  const [X, Y, hop] = s1Move(tau, S1P.home, [[T(1) - .1, T(1) + 1.1, S1P.in], [T(4) - .4, T(4) + .8, S1P.pl], [B.home[0] + .1, B.home[1] - .05, S1P.home]]);
  const pointing = (tau > B.pred0[0] - .2 && tau < B.pred0[1] + .6) || (tau > B.burst[0] - .2 && tau < B.down[1] + .3) || (tau > B.delta - .2 && tau < E(6) - .2) || (tau > B.fly[0] - .2 && tau < B.feed + .6);
  const ges = key(tau, [[0, .35], [B.send[0] - .3, .35], [B.send[0] + .2, .8], [B.sum, .8], [B.sum + .4, .35], [B.r2, .35], [B.r2 + .4, .75], [B.r2 + 3.6, .75], [B.r2 + 4.1, .35],
    [T(4) + .7, .35], [T(4) + 1.1, .85], [T(5) + .5, .85], [T(5) + .9, .5], [T(8) - .1, .5], [T(8) + .3, .75], [B.reset[1], .75], [B.reset[1] + .4, .35]]);
  const facing = tau > T(4) - .4 && tau < T(7) - .2 ? -1 : 1;
  const a = s1Up(tau, B.popP, B.foldC) * Math.PI / 2;
  const look = tau > T(7) - .2 && tau < E(8) ? .6 : 0, tilt = tau > T(7) && tau < E(7) ? -.08 : 0;
  return { X, Y, h0: hop, a, draw: { pose: pointing ? 'point' : 'lecture', gesture: pointing ? .7 : ges, facing, look, tilt, mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau) } };
}
// 琪露诺：身边站 → 走到现实牌旁 → 飞上冰晶尖 → 扔牌 → 飞回标准站位
function s1Cir(tau, L, o) {
  const B = S1B, T = S1T, E = S1E, top = NET.node.r * (1 + (o.node.k ?? 1) * (1 + .1 * Math.sin(clamp(o.node.pulse || 0, 0, 1) * Math.PI)));
  let [X, Y, h0] = s1Move(tau, S1C.home, [[B.cwalk[0], B.cwalk[1], S1C.real]]), z = Y, pose = 'stand', gesture = NET.cast.cir.gesture, facing = -1, mood = 'normal', look = 0;
  const fly = (t0, t1, A, Bp, hA, hB, arc) => { const u = sm(t0, t1, tau, x => x), e = easeIO(u); X = lerp(A[0], Bp[0], e); Y = lerp(A[1], Bp[1], e); h0 = lerp(hA, hB, e) + arc * Math.sin(Math.PI * u); z = lerp(A[1], Bp[1] + .5, e); };
  if (tau >= B.cfly[0] && tau < B.home[0]) { fly(B.cfly[0], B.cfly[1], S1C.real, S1C.node, 0, top, 170); if (tau < B.cfly[1]) pose = 'fly'; }
  if (tau >= B.home[0]) { fly(B.home[0], B.home[1], S1C.node, S1C.home, top, 0, 150); if (tau < B.home[1]) { pose = 'fly'; facing = 1; } }
  if (tau > B.flip0[0] - .35 && tau < B.flip0[1] + .3) { pose = 'point'; gesture = .85; }
  if (tau > B.burst[0] && tau < B.back[1]) { mood = 'surprised'; h0 += 46 * Math.sin(Math.PI * sm(B.burst[0], B.burst[0] + .45, tau, x => x)); }
  if (tau > B.r2 + 3.4 && tau < B.cfly[1] + .4) mood = 'happy';
  if (tau > B.cfly[1] && tau < B.plOut) look = .5;
  if (L.who === 'cirno') { pose = tau < S1W(7, .45) ? 'think' : 'point'; gesture = .8; mood = moodOf(L, 'cirno'); }
  if (tau > B.hold && tau < B.fly[0]) pose = 'hold';
  else if (tau >= B.fly[0] && tau < B.fly[0] + .5) { pose = 'point'; gesture = .8; }
  if (tau > B.feed && tau < B.feed + 1.2) mood = 'happy';
  const a = s1Up(tau, B.popR, B.foldC) * Math.PI / 2;
  return { X, Y, h0, z, a, draw: { pose, gesture, facing, look, mood, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2) } };
}
// 琪露诺举着的那张牌的中心（hold 姿势，相对脚底；朝左、h 440 时量出来的）
const S1HOLD = [0, -419];

// ===================== 立牌（左页前角）：1972 批注 → 翻页 → 多层网络草图 =====================
const S1PL = { x0: 90, x1: 460, y0: 450, Y: 760 }, S1PEN = alpha(P.ink2, .85);
function s1PlacardFace(c, tau, which) {
  const { x0, x1, y0, Y } = S1PL, cx = (x0 + x1) / 2, B = S1B;
  cutPaper(c, rectPts(x0, y0, x1 - x0, Y - y0, 5), '#f6f2e8', { seed: which ? 3731 : 3730, step: 20, blur: 5, sy: 3 });
  rline(c, rectPts(x0 + 12, y0 + 12, x1 - x0 - 24, Y - y0 - 24, 3), { w: 1.6, color: alpha(P.ink2, .3), close: true, seed: 3732 + which, amp: .5 });
  if (!which) {
    zh(c, '1972 年', cx, y0 + 100, { size: 66, color: S1PEN, align: 'center', p: writeP(tau, B.y1972, '1972 年', .09) });
    rline(c, [[cx - 110, y0 + 122], [cx - 110 + 220 * sm(B.y1972 + .5, B.y1972 + .9, tau), y0 + 124]], { w: 2.4, color: S1PEN, seed: 3602 });
    zh(c, '雷斯科拉 & 瓦格纳', cx, y0 + 176, { size: 34, color: S1PEN, align: 'center', p: writeP(tau, B.rw, '雷斯科拉 & 瓦格纳', .07) });
    zh(c, '的学习模型', cx, y0 + 222, { size: 34, color: S1PEN, align: 'center', p: writeP(tau, B.rw + .7, '的学习模型', .07) });
  } else { c.save(); c.translate(x0 + 16, y0 + 44); c.scale(.9, .9); c.translate(-1066, -676); s1Sketch(c, tau); c.restore(); }
}
// 草图：3 → 4 → 1 的小网络，铅笔线。delta 规则只描最后一层；反向传播一颗红点从输出往回跑
const S1SK = { xs: [1086, 1186, 1286], ys: [[712, 762, 812], [696, 745, 795, 844], [770]], r: 10 };
function s1Sketch(c, tau) {
  const B = S1B, { xs, ys, r } = S1SK, draw = sm(B.sketch[0], B.sketch[1], tau, x => x), pen = alpha(P.ink2, .55);
  let e = 0;
  for (let L0 = 0; L0 < 2; L0++) for (const y0 of ys[L0]) for (const y1 of ys[L0 + 1]) { const last = L0 === 1, dk = last ? sm(B.delta, B.delta + .5, tau) : 0;
    rline(c, [[xs[L0] + r, y0], [xs[L0 + 1] - r, y1]], { w: 1.8 + 1.6 * dk, color: dk > 0 ? mix(mix(P.ink2, P.paper, .45), P.ink, dk) : pen, seed: 3610 + e++, amp: .4, p: clamp(draw * 1.6 - L0 * .4, 0, 1) }); }
  ys.forEach((col, L0) => col.forEach((y, j) => rline(c, circPts(xs[L0], y, r, 16), { w: 2.4, color: alpha(P.ink2, .75), close: true, seed: 3650 + L0 * 5 + j, amp: .4, p: clamp(draw * 2 - L0 * .35, 0, 1) })));
  zh(c, 'delta 规则', xs[2] + 22, ys[2][0] + 10, { size: 30, color: S1PEN, p: writeP(tau, B.delta, 'delta 规则', .06) });
  zh(c, '反向传播', xs[1], 900, { size: 32, color: S1PEN, align: 'center', p: writeP(tau, B.bp[0], '反向传播', .08) });
  const u = sm(B.bp[0], B.bp[1], tau, x => x); if (u <= 0 || u >= 1) return;
  const seg = u < .5 ? 1 : 0, v = u < .5 ? u / .5 : (u - .5) / .5, al = 1 - sm(.85, 1, u);
  const from = seg === 1 ? ys[2] : ys[1], to = ys[seg], x0 = xs[seg + 1], x1 = xs[seg];
  c.save(); c.globalAlpha *= al; c.fillStyle = P.red;
  for (const yb of to) for (const ya of from) { if (seg === 0 && ya !== ys[1][1] && ya !== ys[1][2]) continue;
    c.beginPath(); c.arc(lerp(x0, x1, v), lerp(ya, yb, v), 5.5, 0, TAU); c.fill(); }
  c.restore();
}
// 两块立牌的角度和透明度：A 在 L4 折起、L5 往后倒平；B 从前面平躺（背面朝上）翻起来，L7 往前倒下收掉
function s1Placards(tau) {
  const B = S1B, aA = s1Up(tau, B.plA, B.plTurn) * Math.PI / 2, alA = sm(B.plA - .05, B.plA + .1, tau) * (1 - sm(B.plTurn + .25, B.plTurn + .7, tau));
  const rise = sm(B.plTurn + .05, B.plTurn + .75, tau, x => easeOutBack(x, 1.6)), fall = sm(B.plOut, B.plOut + .6, tau, easeIn);
  const aB = Math.PI - Math.PI / 2 * rise + Math.PI / 2 * fall, alB = sm(B.plTurn, B.plTurn + .3, tau) * (1 - sm(B.plOut + .3, B.plOut + .8, tau));
  return [{ which: 0, a: aA, al: alA }, { which: 1, a: aB, al: alB }].filter(q => q.al > .003);
}

// 琪露诺喂的那张牌：小卡片（和网络里的牌同一种纸）
function s1FeedCard(c, x, y, rot, s, al = 1) {
  if (s <= .02 || al <= 0) return;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot); c.scale(s, s);
  cutPaper(c, rectPts(-34, -46, 68, 92, 5), NET.col.card, { seed: 3670, step: 14, blur: 5 });
  for (let k = 0; k < 4; k++) rline(c, [[-22, -26 + k * 16], [22 - (k % 2) * 12, -26 + k * 16]], { w: 2, color: alpha(P.ink2, .55), seed: 3671 + k, amp: .3 });
  c.restore();
}
// 霜花（冰色加深一点，离开试卷后在书页上也看得见）：从 (x, y) 朝 a 长 len，长出比例 p
function s1Frost(c, x, y, a, len, p, seed, depth = 0, al = 1) {
  if (p <= 0 || depth > 2) return;
  const Ln = len * Math.min(1, p * (1 + depth * .4)), ex = x + Math.cos(a) * Ln, ey = y + Math.sin(a) * Ln;
  rline(c, [[x, y], [ex, ey]], { w: Math.max(1.5, 5 - depth * 1.3), color: mix(EP2_ICE_DEEP, EP2_FROST, .25), seed: seed + depth, amp: .6, al });
  const n = 4 - depth;
  for (let i = 1; i <= n; i++) {
    const u = i / (n + 1), bx = x + Math.cos(a) * Ln * u, by = y + Math.sin(a) * Ln * u, bp = clamp((p - u * .5) * 1.6, 0, 1);
    for (const s of [-1, 1]) s1Frost(c, bx, by, a + s * (.75 + .25 * hash(i * 2 + (s > 0), seed)), len * .22 * (1 - u * .4), bp, seed * 3 + i, depth + 1, al);
  }
}
const s1NoteA = tau => sm(S1B.note, S1B.note + .3, tau) * (1 - sm(S1T(2) - .2, S1T(2) + .3, tau));
// 「线越粗，权重越大」写在网络前面的空白书页上（立起来的纸条不会挡住它），箭头指向书页那根纸条
const S1NOTE = [640, 880];
function s1NoteText(c, tau) { zh(c, '线越粗，权重越大', S1NOTE[0], S1NOTE[1], { size: 40, color: S1PEN, p: writeP(tau, S1B.note, '线越粗，权重越大', .06) }); }

// 平的画面（开场交接、段末交接）：和原来的平面版一模一样
function s1Flat(c, tau, L, o) {
  const B = S1B;
  spread(c, tau);
  pageHeader(c, '第一页 · 大脑一直在预测', tau, 1.4, { t1: B.fold });
  const ex = sm(B.exam[0], B.exam[1], tau);
  if (ex < 1) fade(c, 1 - ex, () => pop(c, EP2.exam.x, EP2.exam.y, 1 - .12 * ex, () => examPaper(c, { score: 9, frost: 1 })));
  const fr = sm(B.frost[0], B.frost[1], tau, x => x), frA = 1 - sm(B.grow[1] - .2, B.grow[1] + .6, tau);
  if (fr > 0 && frA > 0) NET.ins.forEach((p, i) => { const dx = p.x - NET.node.x, dy = p.y - NET.node.y;
    s1Frost(c, NET.node.x, NET.node.y, Math.atan2(dy, dx), Math.hypot(dx, dy) - NET.inR * .6, clamp(fr * 1.15 - i * .07, 0, 1), 3680 + i * 7, 0, frA); });
  if (tau >= B.node[0] - .1) netDraw(c, o, tau);
  const fa = win(B.formula[0], B.formula[1], tau, .3);
  if (fa > 0) zh(c, 'ΔV = αβ(λ − ΣV)', BOOK.R.x + BOOK.R.w - 60, 128, { size: 32, color: P.ink2, align: 'right', al: fa * .55 });
  const p = s1Pch(tau, L), q = s1Cir(tau, L, o);
  drawPatchouli(c, { ...NET.cast.pch, x: p.X, y: p.Y - p.h0, ...p.draw, t: tau });
  drawCirno(c, { ...NET.cast.cir, x: q.X, y: q.Y - q.h0, ...q.draw, t: tau });
}

scene({ order: 1, key: 'model', title: '预测机', dur: S1DUR, lines: S1LINES, noFlip: true,
  fn(c, tau, L) {
    const B = S1B, o = s1Net(tau), V = s1View(tau, o);
    if (V.tilt <= 0) { s1Flat(c, tau, L, o); return; }
    const base = c.getTransform();
    c.save(); c.translate(CX, CY + V.dy); c.scale(V.zm, V.zm); c.translate(-V.cx, -CY);
    s1Book(c, V);
    // ---- 贴在书页上的：页眉、批注、人物和立牌的影子、立牌的纸舌 ----
    s1OnPage(c, V, 330, 104, g => pageHeader(g, '第一页 · 大脑一直在预测', tau, 1.4, { t1: B.fold }));
    const nA = s1NoteA(tau); if (nA > 0) s1OnPage(c, V, S1NOTE[0] + 160, S1NOTE[1], g => fade(g, nA, () => s1NoteText(g, tau)));
    const pch = s1Pch(tau, L), cir = s1Cir(tau, L, o), pls = s1Placards(tau);
    const charShadow = (X, Y, a, h0, hh) => { const k = netUpA(a); if (k <= .01) return;
      netShadow(c, V, ellPts(X, Y, 70, 18, 16).map(([x, y]) => [x, y, h0]), .16 * k);
      netShadow(c, V, [[-46, 0], [46, 0], [34, -hh], [-34, -hh]].map(([lx, ly]) => netUp(Y, a, h0, X + lx, Y + ly)), .09 * k); };
    charShadow(pch.X, pch.Y, pch.a, pch.h0, 470); charShadow(cir.X, cir.Y, cir.a, cir.h0, 400);
    for (const pl of pls) { const k = netUpA(Math.min(pl.a, Math.PI - pl.a));
      netShadow(c, V, rectPts(S1PL.x0, S1PL.y0, S1PL.x1 - S1PL.x0, S1PL.Y - S1PL.y0).map(([x, y]) => netUp(S1PL.Y, pl.a, 0, x, y)), .14 * k * pl.al);
      if (k > .05) cutPaper(c, netFlat(V, rectPts(215, S1PL.Y - 2, 120, 16, 2)), mix(BOOK.page2, P.g2, .25), { seed: 3735, step: 10, blur: 2, sx: 0, sy: 1, edge: false, al: pl.al }); }
    // ---- 立体件：人物、立牌、喂的牌、批注箭头，和网络一起排远近 ----
    const extra = [];
    extra.push({ z: pch.Y + .2, draw: g => { g.transform(...netPlane(V, pch.Y, pch.a, pch.h0, pch.X, 250)); drawPatchouli(g, { ...NET.cast.pch, x: pch.X, y: pch.Y, ...pch.draw, t: tau }); } });
    const cirM = netPlane(V, cir.Y, cir.a, cir.h0, cir.X, 220);
    extra.push({ z: cir.z + .3, draw: g => { g.transform(...cirM);
      const r = drawCirno(g, { ...NET.cast.cir, x: cir.X, y: cir.Y, ...cir.draw, t: tau });
      const qA = sm(B.cirQ, B.cirQ + .25, tau) * (1 - sm(S1E(7) - .1, S1E(7) + .3, tau));
      if (qA > 0) pop(g, r.head[0] - 96, r.head[1] - 120, easeOutBack(sm(B.cirQ, B.cirQ + .3, tau)), () => zh(g, '？', r.head[0] - 96, r.head[1] - 100, { size: 64, color: P.ink2, align: 'center', al: qA }));
      if (tau > B.hold && tau < B.fly[0]) s1FeedCard(g, r.hold[0], r.hold[1], .05 * Math.sin(tau * 6), easeOutBack(sm(B.hold, B.hold + .3, tau))); } });
    if (tau >= B.fly[0] && tau < B.fly[1] + .05) extra.push({ z: 1e4, draw: g => {
      const u = sm(B.fly[0], B.fly[1], tau, x => easeIO(x)), a = netUp(cir.Y, cir.a, cir.h0, cir.X + S1HOLD[0], cir.Y + S1HOLD[1]);
      const b = netUp(NET.ins[0].y + NET.inR, o.up.tok[0] * Math.PI / 2, 0, NET.ins[0].x, NET.ins[0].y), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.max(a[2], b[2]) + 180];
      const q = [0, 1, 2].map(j => (1 - u) * (1 - u) * a[j] + 2 * (1 - u) * u * m[j] + u * u * b[j]), [x, y, k] = netP(V, q[0], q[1], q[2]);
      s1FeedCard(g, x, y, -u * TAU * 1.25, k * lerp(.85, .35, sm(.75, 1, u)), 1 - sm(.9, 1, u)); } });
    for (const pl of pls) extra.push({ z: S1PL.Y + (pl.which ? .1 : 0), draw: g => { const M = netPlane(V, S1PL.Y, pl.a, 0, (S1PL.x0 + S1PL.x1) / 2, 130);
      g.globalAlpha *= pl.al; g.transform(...M);
      if (M[0] * M[3] - M[1] * M[2] > 0) s1PlacardFace(g, tau, pl.which);
      else cutPaper(g, rectPts(S1PL.x0, S1PL.y0, S1PL.x1 - S1PL.x0, S1PL.Y - S1PL.y0, 5), mix('#f6f2e8', P.g1, .5), { seed: 3733, step: 20, blur: 5, sy: 3 }); } });
    if (nA > 0) extra.push({ z: 900, draw: g => { const s = netS3(2, .5, netGeo3(o)), e = netP(V, s[0], s[1] + 14, s[2] - 4), f = netP(V, S1NOTE[0] + 150, S1NOTE[1] - 44, 0);
      fade(g, nA, () => arrow(g, [f[0], f[1]], [e[0], e[1]], { w: 2.4, color: S1PEN, head: 12, bend: -14, seed: 3601, p: sm(B.note + .5, B.note + .9, tau) })); } });
    netPop(c, V, o, tau, extra);
    c.restore();
    // 远处压暗一点（斜看时书的远端和桌面）
    c.save(); c.setTransform(base); const gr = c.createLinearGradient(0, 0, 0, 420); gr.addColorStop(0, `rgba(12,8,6,${.45 * V.tilt})`); gr.addColorStop(1, 'rgba(12,8,6,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, 420); c.restore();
  },
});
