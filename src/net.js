'use strict';
// 冰的网络：第 1–3 段共用的画法（N 包负责，见 docs/施工.md「网络」）。第 2、3 段只调用，不改、不复制。
//
// 画在摊开的魔导书上（先 spread），剪纸 + 墨线 + 冰色。左边 3 个输入（剪纸圆片：眼睛、耳朵、书页），各一根冰色纸条连到
// 中间的冰晶（求和节点，正好压在书脊上，= EP2.exam / EP2.drop 的中心）；**纸条的粗细就是权重**。冰晶吐出「预测」牌，
// 右边一张「现实」牌（背面朝上是深紫底 + 问号）。两张牌上都有一根水位管：水位就是数值，两根水位一比就是差距。
// 学习 = 现实牌翻开 → 虚线把现实水位拉到预测牌上，红笔括出差距 → 红色「惊讶」火花从差距处出发，回到冰晶，再沿线往回跑，
// 火花经过的那一截纸条就换成新粗细。
//
// netDraw(c, o, t)   画整张网络。o 全是纯数据（调用方从 tau 算出来），不存状态；t 只用来让火花转、雾飘、卡住时抖。
//   o.lines[i]   第 i 根输入线（0 上 / 1 中 / 2 下），每项：
//     kind    'eye' | 'ear' | 'page' | 'video' | 'word' | null   输入圆片上的墨线小图（null 只写字）
//     label   圆片下的手写标签；不写就按 kind 取（眼睛 / 耳朵 / 书页 / 视频 / 单词），'' 不写
//     w       权重 0..1 → 纸条宽 5..30 像素
//     on      1 亮 / 0 暗（暗线变灰、变淡；火花默认只走亮线，暗线的粗细不变）
//     cut     0..1 断开：中间崩断，两截往下垂，断口有几道墨线。≥ .5 的线火花不走
//     grow    0..1 纸条从冰晶往输入方向长出来的比例（进场用）；k 0..1 输入圆片的大小（弹出用）
//     pulse   0..1 输入圆片一跳（送信号、被喂东西时）
//     flow    0..1 前向信号：三颗冰珠从输入沿线流进冰晶（珠子大小跟权重走）；null 不画
//   o.node       冰晶：{ k 0..1 大小, pulse 0..1 求和时一亮一胀, stuck 0..1 卡住（抖 + 裂纹长出来） }
//   o.pred       预测牌：null = 不出预测（没有比较，也就没有火花）。{ v 0..1 水位, k 0..1（0 藏在冰晶里，1 在自己的位置）,
//                ghost 上一次的水位（灰色虚线刻度，给「更接近了」对照；不要就不写）, al }
//   o.real       现实牌：{ v 0..1 水位, flip 0 背面朝上 → 1 翻开, k 0..1 出现（从右边滑进来）, al }；null 不画
//   o.cmp        0..1 比较：虚线把现实水位拉到预测牌上，再用红笔括出差距（需要 pred 和翻开的 real）
//   o.spark      惊讶火花：null 不画。{ p 0..1 进度, dw [每根线的权重变化], lines 走哪几根线（默认：亮着且没断的线）,
//                fog 0..1 清晰 → 散成一团雾, size 默认 1 }
//                p 的分段：0–.15 在差距处炸开；.15–.4 回到冰晶；.4–1 沿线跑回输入，经过的那截纸条换成 w + dw·(1 − fog)。
//                p = 1 时整根线都是新粗细，调用方下一拍把 w 改成新值、spark 置 null，画面连续。
//                fog 越大：火花越散（一团灰红的雾在冰晶附近飘），沿线的小火花越淡，粗细变化越小（fog = 1 时一根线都不改）。
//   o.spot       追光：{ line 照哪根, k 0..1 强度 }。一张半透明的硫酸纸光锥从页顶照到那根线的输入上；
//                其他线自动按 k 压暗（在它们自己的 on 上再乘 1 − k）
//   o.ice        冰层层数（小数：整数部分是已经冻好的层，小数部分是正在冻的那层）。每层一张半透明冰纸盖住整张网络，一层比一层大；
//                两层以上四角长霜花
//   o.block      0..1 整张网络冻成一整块冰：冰层收拢成正中的冰块（中心 = EP2.drop），网络淡出
//   o.drop       0..1 冰块缩成一滴水：drop = 1 时只剩 waterDrop(c, EP2.drop.x, EP2.drop.y, NET.dropR)（交给结尾段）
//   o.al         整体透明度
//
// 静止态 netRest()：返回一份新的 o（可以随意改），第 1 段最后一帧、第 2 段第一帧和最后一帧、第 3 段第一帧都画
//   netDraw(c, netRest(), tau)：三根线亮着、权重 [.7, .3, .55]（第 1 段学完之后的样子），冰晶静止，没有预测牌，
//   现实牌背面朝上，没有火花、追光、冰层。页眉不属于静止态（每段自己淡入淡出）。
// 标准站位 NET.cast：网络段里两人的站位和姿势，静止态那一帧照这个画（网络在 x 470–1440 之间，避开两人）：
//   drawPatchouli(c, { ...NET.cast.pch, mood, mouth, blink, t })   帕秋莉 = EP2.pch，pose 'lecture'，gesture .35（固定，首尾不跳）
//   drawCirno(c, { ...NET.cast.cir, mood, mouth, blink, t })       琪露诺 = EP2.cir（朝左），pose 'stand'，gesture .6
// 位置查询（场景里放道具、对准节拍用）：
//   netTok(i)          第 i 个输入圆片的中心 [x, y]；NET.inR 是半径
//   netAt(i, u)        第 i 根线上 u 处的点（u = 0 在输入圆片边上，1 在冰晶边上）
//   netLevel(which, v) 'pred' | 'real' 牌上水位 v 那一点（水位管中线）[x, y]
//   netSparkAt(o, i)   火花此刻的位置（i 省略 = 主火花；给 i = 第 i 根线上那颗），场景要让东西跟着火花走时用
// 本文件顶层名字一律 NET / net 前缀。

const NET = {
  node: { x: CX, y: 470, r: 76 },
  ins: [{ x: 600, y: 262 }, { x: 562, y: 470 }, { x: 600, y: 678 }],
  inR: 56,
  pred: { x: 1158, y: 470, w: 172, h: 280 },
  real: { x: 1352, y: 470, w: 172, h: 280 },
  wpx: [5, 30],
  hull: [470, 172, 1450, 776],          // 冰层盖住的范围 x0 y0 x1 y1
  cube: 250,                            // 冻成的冰块边长
  dropR: 34,                            // 最后那滴水的半径
  names: { eye: '眼睛', ear: '耳朵', page: '书页', video: '视频', word: '单词' },
  cast: { pch: { ...EP2.pch, pose: 'lecture', gesture: .35 }, cir: { ...EP2.cir, pose: 'stand', gesture: .6 } },
  col: { strip: mix(EP2_ICE_DEEP, P.blue, .32), dim: mix(P.g1, EP2_ICE, .25), bead: EP2_FROST, card: '#f6f2e8', back: mix(P.purple, P.ink, .35),
    water: mix(EP2_ICE_DEEP, P.blue, .38), tok: '#f3eee2' },
};

function netRest() {
  return {
    lines: [{ kind: 'eye', w: .7 }, { kind: 'ear', w: .3 }, { kind: 'page', w: .55 }],
    node: {}, pred: null, real: { v: .78, flip: 0 }, cmp: 0, spark: null, spot: null, ice: 0, block: 0, drop: 0, al: 1,
  };
}

// ---------- 几何（载入时算一次） ----------
const netTok = i => [NET.ins[i].x, NET.ins[i].y];
// 每根线：输入圆片边 → 冰晶边的一条二次曲线，上下两根略往外弯，采样 30 段
const NET_LP = NET.ins.map((a, i) => {
  const b = NET.node, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
  const p0 = [a.x + ux * (NET.inR - 6), a.y + uy * (NET.inR - 6)], p2 = [b.x - ux * (b.r * .7), b.y - uy * (b.r * .7)];
  const bend = [-34, -6, 34][i], p1 = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2 + bend], pts = [], nrm = [];
  for (let k = 0; k <= 30; k++) { const u = k / 30, v = 1 - u;
    pts.push([v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]]);
    const tx = 2 * v * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]), ty = 2 * v * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]), tl = Math.hypot(tx, ty);
    nrm.push([-ty / tl, tx / tl]); }
  return { pts, nrm };
});
function netAt(i, u) { const q = NET_LP[i].pts, f = clamp(u, 0, 1) * 30, k = Math.min(29, Math.floor(f)), r = f - k; return [lerp(q[k][0], q[k + 1][0], r), lerp(q[k][1], q[k + 1][1], r)]; }
const netWpx = w => lerp(NET.wpx[0], NET.wpx[1], clamp(w, 0, 1));
// 牌上的水位管：管中心在牌中心偏左 20，管从牌顶下 70 到牌底上 26
const NET_TUBE = { dx: -20, top: 70, bot: 26, hw: 15 };
function netLevel(which, v) { const cd = NET[which]; return [cd.x + NET_TUBE.dx, cd.y - cd.h / 2 + NET_TUBE.top + (1 - clamp(v, 0, 1)) * (cd.h - NET_TUBE.top - NET_TUBE.bot)]; }

// 线的有效状态：追光压暗、默认值
function netLines(o) {
  const sp = o.spot && o.spot.k > 0 ? o.spot : null;
  return (o.lines || netRest().lines).map((l, i) => { const e = { on: 1, cut: 0, grow: 1, k: 1, pulse: 0, flow: null, w: .5, ...l };
    if (e.label == null) e.label = NET.names[e.kind] || ''; if (sp && sp.line !== i) e.on *= 1 - sp.k; return e; });
}
// 火花的几段：返回 { head 主火花位置, q 沿线进度 0..1, burst 炸开 0..1, a0 起点 }
function netSparkPhase(o) {
  const sp = o.spark; if (!sp) return null;
  const p = clamp(sp.p, 0, 1), pr = o.pred || { v: .5 }, rv = o.real ? o.real.v : .5;
  const a0 = [NET.pred.x + NET_TUBE.dx + NET_TUBE.hw + 18, (netLevel('pred', pr.v)[1] + netLevel('real', rv)[1]) / 2];
  const nd = [NET.node.x, NET.node.y], m = sm(.15, .4, p, easeIO);
  const head = m <= 0 ? a0 : [lerp(a0[0], nd[0], m), lerp(a0[1], nd[1], m) - Math.sin(m * Math.PI) * 40];
  return { p, a0, head, q: sm(.4, 1, p, x => x), burst: sm(0, .15, p, x => x) };
}
function netSparkAt(o, i) { const ph = netSparkPhase(o); if (!ph) return null; return i == null ? ph.head : netAt(i, 1 - ph.q); }

// ---------- 画 ----------
function netDraw(c, o = {}, t = 0) {
  const al = o.al ?? 1; if (al <= 0) return;
  const blk = o.drop > 0 ? 1 : clamp(o.block || 0, 0, 1), inner = 1 - sm(.15, .7, blk);
  const lines = netLines(o), ph = netSparkPhase(o), sp = o.spark;
  const active = sp ? (sp.lines || lines.map((l, i) => i).filter(i => lines[i].on >= .5 && lines[i].cut < .5)) : [];
  c.save(); c.globalAlpha *= al;
  if (inner > 0) fade(c, inner, () => {
    if (o.spot && o.spot.k > 0) netSpot(c, o.spot);
    lines.forEach((l, i) => { const on = active.includes(i) && ph ? { q: ph.q, dw: (sp.dw && sp.dw[i]) || 0, fog: sp.fog || 0 } : null; netStrip(c, i, l, on, t); });
    lines.forEach((l, i) => netToken(c, i, l));
    if (o.pred) netCardAt(c, 'pred', o.pred, o);
    netNode(c, o.node || {}, t);
    if (o.real) netCardAt(c, 'real', o.real, o);
    if (o.cmp > 0 && o.pred && o.real && (o.real.flip ?? 0) > .5 && (o.pred.k ?? 1) > .95) netCmp(c, o);
    if (ph) netSpark(c, ph, sp, active, t);
  });
  if (o.ice > 0 && blk < 1) netIce(c, o.ice, 1 - blk);
  if (blk > 0) netBlock(c, blk, o.drop || 0, o.ice || 0);
  c.restore();
}

// 追光：页顶一条窄口，往下张开罩住那个输入和它半根线（硫酸纸）
function netSpot(c, s) {
  const [tx, ty] = netTok(s.line), m = netAt(s.line, .45), cx = (tx + m[0]) / 2 + 10, cy = (ty + m[1]) / 2;
  const top = BOOK.L.y + 16, ax = tx - 20, pts = [[ax - 26, top], [ax + 26, top]];
  for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; pts.push([cx + Math.cos(a) * 150, cy + 16 + Math.sin(a) * 84]); }
  c.save(); c.globalAlpha *= s.k;
  vellum(c, netHull(pts), { color: '#fffaec', seed: 3401, step: 30, blur: 8, sy: 2, al: .95 });
  c.restore();
}
function netHull(pts) { // 凸包（单调链）
  const q = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of q) { while (lo.length >= 2 && cr(lo.at(-2), lo.at(-1), p) <= 0) lo.pop(); lo.push(p); }
  for (const p of q.reverse()) { while (up.length >= 2 && cr(up.at(-2), up.at(-1), p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

// 一根输入线：冰色纸条，宽度沿线可以变（火花经过的那一截换成新粗细）。on 暗了变灰变淡；cut 断成两截下垂
function netStrip(c, i, l, spk, t) {
  if (l.grow <= 0) return;
  const { pts, nrm } = NET_LP[i], u0 = 1 - clamp(l.grow, 0, 1), dim = clamp(l.on, 0, 1);
  const newW = spk ? clamp(l.w + spk.dw * (1 - spk.fog), 0, 1) : l.w, front = spk ? 1 - spk.q : 2;
  const wAt = u => lerp(netWpx(l.w), netWpx(newW), spk ? sm(front - .035, front + .035, u, x => x) : 0);
  const color = mix(NET.col.dim, NET.col.strip, dim), a = lerp(.35, 1, dim);
  const piece = (ua, ub, pivot, ang, seed) => {
    const L = [], R = [];
    for (let k = 0; k <= 30; k++) { const u = k / 30; if (u < ua - 1e-6 || u > ub + 1e-6) continue;
      let [x, y] = pts[k]; const [nx, ny] = nrm[k], hw = wAt(u) / 2;
      let px = x + nx * hw, py = y + ny * hw, qx = x - nx * hw, qy = y - ny * hw;
      if (ang) { const f = Math.pow(Math.abs(u - pivot[2]) / .5, 1.15), ca = Math.cos(ang * f), sa = Math.sin(ang * f), rot = (X, Y) => [pivot[0] + (X - pivot[0]) * ca - (Y - pivot[1]) * sa, pivot[1] + (X - pivot[0]) * sa + (Y - pivot[1]) * ca];
        [px, py] = rot(px, py); [qx, qy] = rot(qx, qy); }
      L.push([px, py]); R.unshift([qx, qy]); }
    if (L.length < 2) return;
    cutPaper(c, L.concat(R), color, { seed, step: 16, blur: 3, sx: 1.5, sy: 2.5, grain: .06, al: a });
  };
  if (l.cut > 0) {
    const g = .04 + .06 * l.cut, sag = .42 * sm(0, 1, l.cut, easeOut), side = 1;   // 两截都往下垂
    const pin = pts[0], nd = pts[30];
    piece(Math.max(u0, 0), .5 - g, [pin[0], pin[1], 0], sag * side, 3410 + i);
    if (.5 + g >= u0) piece(Math.max(u0, .5 + g), 1, [nd[0], nd[1], 1], -sag * side, 3420 + i);
    const snap = 1 - sm(.15, .5, l.cut); if (snap > 0) { const [bx, by] = netAt(i, .5);
      for (let k = 0; k < 5; k++) { const an = k / 5 * TAU + .3, r0 = 14, r1 = 14 + 26 * sm(0, .25, l.cut);
        rline(c, [[bx + Math.cos(an) * r0, by + Math.sin(an) * r0], [bx + Math.cos(an) * r1, by + Math.sin(an) * r1]], { w: 3, color: P.ink2, seed: 3430 + k, al: snap }); } }
  } else piece(u0, 1, null, 0, 3410 + i);
  // 前向信号：三颗冰珠
  if (l.flow != null && l.flow > 0 && l.flow < 1 && l.cut < .5) for (let b = 0; b < 3; b++) {
    const u = l.flow * 1.4 - b * .2; if (u <= 0 || u >= 1) continue;
    const [x, y] = netAt(i, u), r = (4 + 8 * l.w) * (1 - sm(.85, 1, u)) * sm(0, .08, u), aa = a * (1 - sm(.9, 1, u));
    if (r <= .5) continue;
    c.save(); c.globalAlpha *= aa; c.fillStyle = NET.col.bead; c.strokeStyle = P.ink2; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke(); c.restore();
  }
}

// 输入圆片：剪纸圆 + 墨线小图 + 手写标签
function netToken(c, i, l) {
  const k = clamp(l.k, 0, 1.3); if (k <= .01) return;
  const [x, y] = netTok(i), s = k * (1 + .14 * Math.sin(clamp(l.pulse, 0, 1) * Math.PI)), R = NET.inR, a = lerp(.4, 1, clamp(l.on, 0, 1));
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s);
  cutPaper(c, circPts(0, 0, R, 30), NET.col.tok, { seed: 3440 + i, step: 10, blur: 5 });
  rline(c, circPts(0, 0, R - 7, 30), { w: 1.5, color: alpha(P.ink2, .35), close: true, seed: 3445 + i });
  netIcon(c, l.kind, 3450 + i * 10);
  if (l.pulse > 0) rline(c, circPts(0, 0, R + 6 + 18 * l.pulse, 30), { w: 3, color: P.ink2, close: true, seed: 3448, al: 1 - l.pulse });
  c.restore();
  if (l.label) zh(c, l.label, x, y + R * s + 34, { size: 28, color: P.ink2, align: 'center', al: a * clamp(k, 0, 1) });
}
function netIcon(c, kind, seed) {
  const ink = { w: 3, color: P.ink2, seed, smooth: true, amp: .5 };
  if (kind === 'eye') {
    rline(c, [[-30, 2], [-14, -14], [0, -18], [14, -14], [30, 2]], ink); rline(c, [[-30, 2], [-14, 14], [0, 17], [14, 14], [30, 2]], { ...ink, seed: seed + 1 });
    c.fillStyle = P.ink2; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(3, -3, 3, 0, TAU); c.fill();
    for (let k = -1; k <= 1; k++) rline(c, [[k * 12, -17 + Math.abs(k) * 3], [k * 17, -26 + Math.abs(k) * 3]], { ...ink, w: 2.2, smooth: false, seed: seed + 2 + k });
  } else if (kind === 'ear') {
    rline(c, [[-12, -8], [-10, -24], [4, -30], [20, -20], [22, -2], [12, 10], [7, 22], [-4, 30], [-13, 24]], ink);
    rline(c, [[-3, -4], [2, -16], [12, -12], [10, -2], [3, 4], [3, 12]], { ...ink, w: 2.5, seed: seed + 1 });
  } else if (kind === 'page') {
    rshape(c, [[-31, -16], [-2, -10], [-2, 22], [-31, 16]], { fill: '#fbf8f0', stroke: P.ink2, w: 2.5, seed, amp: .5 });
    rshape(c, [[2, -10], [31, -16], [31, 16], [2, 22]], { fill: '#fbf8f0', stroke: P.ink2, w: 2.5, seed: seed + 1, amp: .5 });
    for (let k = 0; k < 3; k++) { const yy = -5 + k * 8; rline(c, [[-26, yy - 3], [-8, yy + 1]], { w: 1.6, color: alpha(P.ink2, .6), seed: seed + 3 + k, amp: .3 }); rline(c, [[8, yy + 1], [26, yy - 3]], { w: 1.6, color: alpha(P.ink2, .6), seed: seed + 6 + k, amp: .3 }); }
  } else if (kind === 'video') {
    rshape(c, rectPts(-19, -30, 38, 60, 7), { fill: '#fbf8f0', stroke: P.ink2, w: 3, seed, amp: .5 });
    c.fillStyle = P.ink2; c.fill(polyPath([[-7, -11], [11, 0], [-7, 11]]));
  } else if (kind === 'word') {
    spin(c, 0, 0, -.12, () => { rshape(c, rectPts(-28, -20, 56, 40, 4), { fill: '#fbf8f0', stroke: P.ink2, w: 2.5, seed, amp: .5 });
      zh(c, 'ABC', 0, 9, { size: 22, color: P.ink2, align: 'center' }); });
  }
}

// 冰晶：六角冰片 + 内层霜面 + 墨线棱；pulse 一亮一胀，stuck 抖 + 裂纹
function netNode(c, nd, t) {
  const k = clamp(nd.k ?? 1, 0, 1.3); if (k <= .01) return;
  const { x, y, r } = NET.node, pu = Math.sin(clamp(nd.pulse || 0, 0, 1) * Math.PI), st = clamp(nd.stuck || 0, 0, 1), tt = twos(t);
  const dx = st * 7 * noise1(tt * 11, 3), dy = st * 5 * noise1(tt * 11, 8), rot = st * .05 * noise1(tt * 9, 5);
  c.save(); c.translate(x + dx, y + dy); c.rotate(rot); c.scale(k * (1 + .1 * pu), k * (1 + .1 * pu));
  const out = starPts(0, 0, r, 6, .8, 0);
  cutPaper(c, out, mix(EP2_ICE, EP2_FROST, .3 * pu), { seed: 3460, step: 12, blur: 7, sy: 4 });
  cutPaper(c, starPts(0, 0, r * .56, 6, .8, Math.PI / 6), mix(EP2_FROST, '#ffffff', .4 * pu), { seed: 3461, step: 8, blur: 3, sx: 1, sy: 1.5, grain: .04 });
  for (let a = 0; a < 6; a++) { const an = -Math.PI / 2 + a * TAU / 6; rline(c, [[Math.cos(an) * r * .2, Math.sin(an) * r * .2], [Math.cos(an) * r * .92, Math.sin(an) * r * .92]], { w: 1.6, color: alpha(P.ink2, .38), seed: 3462 + a, amp: .4 }); }
  rline(c, out, { w: 2.2, color: alpha(P.ink2, .55), close: true, seed: 3469, amp: .5 });
  if (st > 0) { const cracks = [[[4, -6], [18, -20], [14, -34], [30, -48]], [[-2, 4], [-20, 10], [-26, 28], [-44, 34]], [[6, 6], [12, 26], [30, 30], [34, 50]]];
    cracks.forEach((cr, j) => rline(c, cr, { w: 2.6, color: P.ink, seed: 3470 + j, amp: .4, p: sm(j * .15, .6 + j * .15, st, x => x) })); }
  c.restore();
}

// 牌：pred 从冰晶里滑出来（k），real 可以翻（flip）
function netCardAt(c, which, cd, o) {
  const base = NET[which], k = clamp(cd.k ?? 1, 0, 1); if (k <= .01 || (cd.al ?? 1) <= 0) return;
  let x = base.x, y = base.y, s = 1, rot = which === 'pred' ? -.03 : .035;
  if (which === 'pred') { x = lerp(NET.node.x, base.x, easeOut(k)); s = lerp(.25, 1, easeOut(k)); rot *= k; }
  else { x = lerp(base.x + 160, base.x, easeOut(k)); }
  const flip = which === 'real' ? clamp(cd.flip ?? 1, 0, 1) : 1, sx = Math.abs(Math.cos(flip * Math.PI)), lift = Math.sin(flip * Math.PI) * 22;
  c.save(); c.globalAlpha *= (cd.al ?? 1) * (which === 'real' ? sm(0, .4, k) : 1);
  c.translate(x, y - lift); c.rotate(rot); c.scale(s * Math.max(.02, sx), s);
  const { w, h } = base, front = flip >= .5;
  const path = cutPaper(c, rectPts(-w / 2, -h / 2, w, h, 6), front ? NET.col.card : NET.col.back, { seed: which === 'pred' ? 3480 : 3481, step: 22, blur: 6 + lift * .4, sy: 4 + lift * .3 });
  if (front) netCardFace(c, which, cd, w, h);
  else { rline(c, rectPts(-w / 2 + 11, -h / 2 + 11, w - 22, h - 22, 4), { w: 2, color: alpha(P.moon, .6), close: true, seed: 3483 });
    drawMoonIcon(c, 0, -h / 2 + 40, 13, alpha(P.moon, .8), -.5);
    zh(c, '？', 0, 38, { size: 96, color: alpha(P.cap, .85), align: 'center' }); }
  c.restore();
  return path;
}
function netCardFace(c, which, cd, w, h) {
  zh(c, which === 'pred' ? '预测' : '现实', 0, -h / 2 + 44, { size: 32, color: which === 'pred' ? P.ink2 : P.ink, align: 'center' });
  const tx = NET_TUBE.dx, top = -h / 2 + NET_TUBE.top, bot = h / 2 - NET_TUBE.bot, hw = NET_TUBE.hw, lv = top + (1 - clamp(cd.v, 0, 1)) * (bot - top);
  c.fillStyle = NET.col.water; c.fillRect(tx - hw + 2, lv, hw * 2 - 4, bot - lv);
  c.fillStyle = alpha('#ffffff', .35); c.fillRect(tx - hw + 4, lv + 2, 4, Math.max(0, bot - lv - 6));
  rline(c, [[tx - hw, top], [tx - hw, bot], [tx + hw, bot], [tx + hw, top]], { w: 2.6, color: P.ink2, seed: which === 'pred' ? 3485 : 3486, amp: .4 });
  for (let k = 1; k < 5; k++) { const yy = lerp(bot, top, k / 5); rline(c, [[tx + hw + 4, yy], [tx + hw + (k % 2 ? 12 : 20), yy]], { w: 2, color: alpha(P.ink2, .55), seed: 3487 + k, amp: .2 }); }
  if (cd.ghost != null) { const gy = top + (1 - clamp(cd.ghost, 0, 1)) * (bot - top);
    rline(c, [[tx - hw - 12, gy], [tx + hw + 12, gy]], { w: 3, color: alpha(P.g2, .9), dash: [7, 6], seed: 3492, amp: .3 });
    if (lv < gy - 26) arrow(c, [tx - hw - 22, gy - 4], [tx - hw - 22, lv + 6], { w: 2.4, color: alpha(P.ink2, .7), head: 10, seed: 3493 }); }
}
// 比较：虚线把现实水位拉过来，红笔括出差距
function netCmp(c, o) {
  const k = clamp(o.cmp, 0, 1), pr = netLevel('pred', o.pred.v), rl = netLevel('real', o.real.v), bx = pr[0] + NET_TUBE.hw + 18;
  rline(c, [[rl[0] + NET_TUBE.hw, rl[1]], [pr[0] - NET_TUBE.hw - 8, rl[1]]],{ w: 2.6, color: P.ink2, dash: [10, 8], seed: 3495, amp: .3, p: sm(0, .5, k, x => x) });
  const kb = sm(.45, 1, k, x => x); if (kb <= 0 || Math.abs(rl[1] - pr[1]) < 3) return;
  rline(c, [[bx - 8, pr[1]], [bx, pr[1]], [bx, rl[1]], [bx - 8, rl[1]]], { w: 5, color: P.red, seed: 3496, amp: .5, p: kb });
}
// 惊讶火花：炸开 → 回到冰晶 → 沿线分头跑回输入
function netSparkPiece(c, x, y, r, rot, a, seed) {
  if (r <= .5 || a <= 0) return;
  c.save(); c.globalAlpha *= a;
  cutPaper(c, starPts(x, y, r, 7, .42, rot), P.red, { seed, step: 5, blur: 3, sx: 1, sy: 2, grain: .05 });
  c.fillStyle = mix(P.red, '#fff4e0', .45); c.beginPath(); c.arc(x, y, r * .26, 0, TAU); c.fill();
  c.restore();
}
function netSpark(c, ph, sp, active, t) {
  const fog = clamp(sp.fog || 0, 0, 1), sz = sp.size ?? 1, clear = 1 - fog, rot = t * 3;
  const [hx, hy] = ph.head, onNode = ph.p >= .4;
  // 炸开：几道放射的红笔线
  if (ph.p < .3) { const b = ph.burst, fadeB = 1 - sm(.15, .3, ph.p);
    for (let k = 0; k < 7; k++) { const an = k / 7 * TAU - .4, r0 = 26 * sz, r1 = r0 + 30 * sz * easeOut(b);
      rline(c, [[ph.a0[0] + Math.cos(an) * r0, ph.a0[1] + Math.sin(an) * r0], [ph.a0[0] + Math.cos(an) * r1, ph.a0[1] + Math.sin(an) * r1]], { w: 3.5, color: P.red, seed: 3500 + k, al: fadeB * clear }); } }
  // 主火花（到冰晶后淡掉，分成沿线的小火花）
  const mainR = sz * (ph.p < .15 ? 40 * easeOutBack(ph.burst) : 28), mainA = clear * (1 - sm(.4, .5, ph.p));
  if (!onNode || mainA > 0) { for (let k = 1; k <= 3; k++) { const m = Math.max(0, sm(.15, .4, ph.p - k * .02, easeIO)), tx = lerp(ph.a0[0], NET.node.x, m), ty = lerp(ph.a0[1], NET.node.y, m) - Math.sin(m * Math.PI) * 40;
      if (ph.p > .15 && ph.p < .45) netSparkPiece(c, tx, ty, mainR * (.5 - k * .1), rot + k, mainA * .7, 3510 + k); }
    netSparkPiece(c, hx, hy, mainR, rot, mainA, 3509); }
  if (onNode && ph.q < 1) for (const i of active) { const [x, y] = netAt(i, 1 - ph.q);
    netSparkPiece(c, x, y, 22 * sz, rot + i, clear * (1 - sm(.85, 1, ph.q)) * sm(0, .06, ph.q), 3520 + i); }
  // 雾：一团灰红的小纸屑在差距处/冰晶附近散开，越来越淡
  if (fog > 0) { const cx = onNode ? NET.node.x + 40 : hx, cy = onNode ? NET.node.y : hy, spread = 20 + 120 * fog, tt = twos(t);
    c.save(); c.globalAlpha *= (.25 + .5 * fog) * (1 - sm(.85, 1, ph.p));
    for (let j = 0; j < 28; j++) { const an = hash(j, 351) * TAU + tt * .3 * (hash(j, 352) - .5), rr = spread * Math.sqrt(hash(j, 353)) * sm(0, .2, ph.p + .05);
      const x = cx + Math.cos(an) * rr * 1.3 + 8 * noise1(tt * .7 + j, 354), y = cy + Math.sin(an) * rr * .8 + 8 * noise1(tt * .7 + j, 355), r = 4 + 9 * hash(j, 356);
      c.fillStyle = mix(P.red, P.g2, .35 + .45 * fog); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    c.restore(); }
}

// 冰层：每层一张半透明冰纸盖住整张网络，一层比一层大；两层以上四角长霜花
function netIcePts(e, seed) { const [x0, y0, x1, y1] = NET.hull; return wobble(resample(rectPts(x0 - e, y0 - e, x1 - x0 + e * 2, y1 - y0 + e * 2, 70), 24, true), seed, 7, .05); }
function netIce(c, ice, a) {
  const n = Math.ceil(Math.min(ice, 8));
  c.save(); c.globalAlpha *= a;
  for (let k = 0; k < n; k++) { const f = clamp(ice - k, 0, 1), e = 12 * k - 20 * (1 - f), pts = netIcePts(e, 3530 + k);
    cutPaper(c, pts, EP2_ICE, { seed: 3540 + k, step: 26, blur: 6, sy: 3, grain: .05, al: .26 * sm(0, .6, f) });
    rline(c, pts, { w: 2, color: EP2_FROST, close: true, seed: 3550 + k, amp: .8, al: .8 * f }); }
  const fr = sm(1.5, 3.5, ice), [x0, y0, x1, y1] = NET.hull, e = 12 * (n - 1);
  if (fr > 0) [[x0 - e + 30, y0 - e + 30, .8], [x1 + e - 30, y0 - e + 30, 2.35], [x0 - e + 30, y1 + e - 30, -.8], [x1 + e - 30, y1 + e - 30, -2.35]].forEach(([x, y, an], k) => ep2Frost(c, x, y, an, 130, fr, 3560 + k));
  c.restore();
}
// 冻成一整块冰 → 缩成一滴水
function netBlock(c, b, d, ice) {
  const [x0, y0, x1, y1] = NET.hull, e = 12 * Math.max(0, Math.ceil(ice) - 1), u = easeIO(b), dx = EP2.drop.x, dy = EP2.drop.y;
  const shrink = sm(0, .7, d), half = lerp(NET.cube / 2, 0, shrink);
  const bx0 = lerp(x0 - e, dx - half, u), bx1 = lerp(x1 + e, dx + half, u), by0 = lerp(y0 - e, dy - half, u), by1 = lerp(y1 + e, dy + half, u);
  const bw = bx1 - bx0, bh = by1 - by0;
  if (bw > 4 && bh > 4) {
    const r = Math.min(bw, bh) * lerp(.12, .5, shrink) - 1, pts = rectPts(bx0, by0, bw, bh, Math.max(4, r));
    const col = mix(EP2_ICE, EP2_ICE_DEEP, .35 * u);
    cutPaper(c, pts, col, { seed: 3570, step: 22, blur: 8, sy: 4, grain: .05, al: lerp(.3, 1, u) });
    c.save(); c.globalAlpha *= u * (1 - shrink);   // 冰块的棱和高光
    rline(c, [[bx0 + bw * .12, by0 + bh * .22], [bx0 + bw * .12, by0 + bh * .12], [bx0 + bw * .3, by0 + bh * .12]], { w: 5, color: '#ffffff', seed: 3571, al: .8 });
    rline(c, [[bx0 + bw * .2, by1 - bh * .15], [bx1 - bw * .15, by0 + bh * .2]], { w: 2, color: alpha('#ffffff', .6), seed: 3572 });
    rline(c, [[bx0 + bw * .45, by1 - bh * .1], [bx1 - bw * .1, by0 + bh * .45]], { w: 2, color: alpha('#ffffff', .45), seed: 3573 });
    c.restore();
  }
  const dr = NET.dropR * easeOutBack(sm(.35, 1, d)); if (dr > .5) waterDrop(c, dx, dy, dr);
}

// ===================== 立体书版（第 1 段用；上面的平面版接口和画法不变） =====================
// 同一张网络立起来：输入圆片、冰晶、两张牌各自立在一道纸铰链上（绕底边折起），三根线变成拱起来的纸条（宽度仍是权重）。
// 相机 V = { p 俯仰（0 = 正上方，负 = 近处在下）, cx 透视中心 x, cy 俯仰轴（书页 y）, zm 推拉, dy 竖移 }，焦距 NET3.F。
// 用法（照第 1 集立体书那一页）：调用方先 c.translate(CX, CY + V.dy); c.scale(V.zm, V.zm); c.translate(-V.cx, -CY)，
// 把书页按同一套透视斜着画出来，再调 netPop(c, V, o, t, extra)：先画贴在书页上的东西（影子、铰链纸舌），再按远近画立体件（圆片标签立起后挪到圆片左边）。
//   o     和 netDraw 同一份参数，另加 o.up = { tok: [0..1 ×3], node, cards, arch: [0..1 ×3] }：立起程度（0 平躺 = 平面版的样子，
//         1 竖直，可略大于 1 回弹）；arch 是纸条拱起的程度。缺省全是 1。不支持 cut、fog、spot、ice、block、drop（第 1 段用不到）。
//         o.spark 另可给 qs[i]：第 i 根线上火花的沿线进度（缺省按 p 算，三根一起跑）。
//   extra 调用方自己的立体件 [{ z 书页上的 y（越大越近，后画）, draw(c) }]（人物、立牌），和网络一起排远近。
// 其他：netP(V, X, Y, h) 书页点 (X, Y) 离页高 h → 屏幕 [x, y, 缩放]；netUp(Yh, a, h0, x, y) 平面坐标里的点在「以 y = Yh 为铰链、
//   折起 a 弧度、底边离页 h0」的卡片上的三维位置 [X, Y, h]；netPlane(V, Yh, a, h0, x0, ref) 这张卡片的仿射矩阵（平面坐标 → 屏幕），
//   c.transform(...M) 之后照平面坐标画即可（a = 0 且相机正上方时是单位矩阵）；netShadow(c, V, pts3, al) 把三维点围成的影子画在书页上；
//   netFlat(V, pts) 书页上的点 → 屏幕；netS3(i, u, g) 第 i 根纸条 u 处的三维点（g = netGeo3(o)）；netSparkAt3(o, i) 火花此刻的三维位置。
const NET3 = { F: 2800, L: [.3, .42], arch: 70, cardY: NET.pred.y + NET.pred.h / 2, nodeY: NET.node.y + NET.node.r, shade: '#2a1c16' };
function netP(V, X, Y, h = 0) {
  const x = X - V.cx, d = Y - V.cy, cp = Math.cos(V.p), sp = Math.sin(V.p), y = d * cp + h * sp, z = d * sp - h * cp, k = NET3.F / (NET3.F + z);
  return [V.cx + x * k, V.cy + y * k, k];
}
const netUp = (Yh, a, h0, x, y) => [x, Yh - (Yh - y) * Math.cos(a), h0 + (Yh - y) * Math.sin(a)];
function netPlane(V, Yh, a, h0 = 0, x0 = CX, ref = 100) {
  const F = (x, y) => { const q = netUp(Yh, a, h0, x, y); return netP(V, q[0], q[1], q[2]); };
  const o = F(x0, Yh), m0 = F(x0, Yh - ref), m1 = F(x0 + ref, Yh - ref);
  const A = (m1[0] - m0[0]) / ref, B = (m1[1] - m0[1]) / ref, C = (o[0] - m0[0]) / ref, D = (o[1] - m0[1]) / ref;
  return [A, B, C, D, o[0] - A * x0 - C * Yh, o[1] - B * x0 - D * Yh];
}
const netShadowPt = (V, [x, y, h]) => netP(V, x + h * NET3.L[0], y - h * NET3.L[1], 0);
function netShadow(c, V, pts3, al) { if (al <= .003 || pts3.length < 3) return;
  c.save(); c.globalAlpha *= al; c.fillStyle = NET3.shade; c.fill(polyPath(pts3.map(q => netShadowPt(V, q)))); c.restore(); }
const netFlat = (V, pts) => pts.map(([x, y]) => { const q = netP(V, x, y, 0); return [q[0], q[1]]; });
const netUpA = a => Math.sin(clamp(a, 0, Math.PI / 2));

function netGeo3(o) {
  const up = o.up || {}, A = v => clamp(v ?? 1, 0, 1.25) * Math.PI / 2;
  return { aT: [0, 1, 2].map(i => A(up.tok ? up.tok[i] : 1)), aN: A(up.node), aC: A(up.cards), arch: [0, 1, 2].map(i => clamp(up.arch ? up.arch[i] : 1, 0, 1.2)) };
}
// 第 i 根纸条 u 处（0 输入端，1 冰晶端）的三维点：两端跟着圆片中心、冰晶中心升起，中间再拱起一段
function netS3(i, u, g, b = netAt(i, u)) {
  const R = NET.inR, r = NET.node.r, aT = g.aT[i], aN = g.aN;
  const dy = lerp(R * (1 - Math.cos(aT)), r * (1 - Math.cos(aN)), u), h = lerp(R * Math.sin(aT), r * Math.sin(aN), u) + g.arch[i] * NET3.arch * Math.sin(Math.PI * u);
  return [b[0], b[1] + dy, h];
}
function netSparkAt3(o, i) {
  const ph = netSparkPhase(o); if (!ph) return null; const g = netGeo3(o);
  if (i != null) { const q = o.spark.qs && o.spark.qs[i] != null ? o.spark.qs[i] : ph.q, p = netS3(i, 1 - clamp(q, 0, 1), g); p[2] += 8; return p; }
  const a0 = netUp(NET3.cardY, g.aC, 0, ph.a0[0], ph.a0[1]), nc = netUp(NET3.nodeY, g.aN, 0, NET.node.x, NET.node.y), m = sm(.15, .4, ph.p, easeIO);
  return [lerp(a0[0], nc[0], m), lerp(a0[1], nc[1], m), lerp(a0[2], nc[2], m) + Math.sin(m * Math.PI) * 70];
}

// 拱起的纸条：和 netStrip 同一个轮廓、同一个 seed，只是每个点先抬到三维再投影（a = 0、正上方时和平面版一样）
function netStrip3(c, V, i, l, spk, g) {
  if (l.grow <= 0) return;
  const { pts, nrm } = NET_LP[i], u0 = 1 - clamp(l.grow, 0, 1), dim = clamp(l.on, 0, 1);
  const newW = spk ? clamp(l.w + spk.dw, 0, 1) : l.w, front = spk ? 1 - spk.q : 2;
  const wAt = u => lerp(netWpx(l.w), netWpx(newW), spk ? sm(front - .035, front + .035, u, x => x) : 0);
  const color = mix(NET.col.dim, NET.col.strip, dim), a = lerp(.35, 1, dim), Lp = [], Rp = [];
  for (let k = 0; k <= 30; k++) { const u = k / 30; if (u < u0 - 1e-6) continue;
    const [x, y, h] = netS3(i, u, g, pts[k]), [nx, ny] = nrm[k], hw = wAt(u) / 2, p = netP(V, x + nx * hw, y + ny * hw, h), q = netP(V, x - nx * hw, y - ny * hw, h);
    Lp.push([p[0], p[1]]); Rp.unshift([q[0], q[1]]); }
  if (Lp.length < 2) return;
  cutPaper(c, Lp.concat(Rp), color, { seed: 3410 + i, step: 16, blur: 3, sx: 1.5, sy: 2.5, grain: .06, al: a });
  if (l.flow != null && l.flow > 0 && l.flow < 1) for (let b = 0; b < 3; b++) {
    const u = l.flow * 1.4 - b * .2; if (u <= 0 || u >= 1) continue;
    const s = netS3(i, u, g), [x, y, k] = netP(V, s[0], s[1], s[2] + 4), r = (4 + 8 * l.w) * (1 - sm(.85, 1, u)) * sm(0, .08, u) * k, aa = a * (1 - sm(.9, 1, u));
    if (r <= .5) continue;
    c.save(); c.globalAlpha *= aa; c.fillStyle = NET.col.bead; c.strokeStyle = P.ink2; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke(); c.restore();
  }
}

// 贴在书页上的：影子、纸铰链的纸舌、圆片下的标签（圆片立起来之后标签留在书页上）
function netPage3(c, V, o, g, lines) {
  const R = NET.inR, r = NET.node.r;
  const tab = (x0, w, Yh, a) => { const k = clamp(netUpA(a) * 3, 0, 1); if (k <= .01) return;
    cutPaper(c, netFlat(V, rectPts(x0 - w / 2, Yh - 2, w, 16, 2)), mix(BOOK.page2, P.g2, .25), { seed: 3700 + (x0 | 0) % 13, step: 10, blur: 2, sx: 0, sy: 1, grain: .04, edge: false, al: k });
    rline(c, netFlat(V, [[x0 - w / 2 - 6, Yh], [x0 + w / 2 + 6, Yh]]), { w: 1.5, color: alpha(P.ink2, .35), seed: 3701, amp: .3, al: k }); };
  lines.forEach((l, i) => { const [tx, ty] = netTok(i), k = clamp(l.k, 0, 1.3);
    if (k > .01) netShadow(c, V, circPts(tx, ty, R * k, 20).map(([x, y]) => netUp(ty + R, g.aT[i], 0, x, y)), .16 * netUpA(g.aT[i]));
    if (l.grow > 0 && g.arch[i] > .01) { const A0 = [], B0 = [], w = netWpx(l.w) / 2;
      for (let k2 = 0; k2 <= 10; k2++) { const u = lerp(1 - l.grow, 1, k2 / 10), s = netS3(i, u, g); A0.push([s[0], s[1] - w, s[2]]); B0.unshift([s[0], s[1] + w, s[2]]); }
      netShadow(c, V, A0.concat(B0), .1 * Math.min(1, g.arch[i])); } });
  const nk = o.node?.k ?? 1;
  if (nk > .01) netShadow(c, V, starPts(NET.node.x, NET.node.y, r * nk, 6, .8, 0).map(([x, y]) => netUp(NET3.nodeY, g.aN, 0, x, y)), .16 * netUpA(g.aN));
  for (const which of ['pred', 'real']) { const cd = o[which]; if (!cd || (cd.k ?? 1) <= .01) continue; const b = NET[which], k = clamp(cd.k ?? 1, 0, 1);
    const x = which === 'pred' ? lerp(NET.node.x, b.x, easeOut(k)) : lerp(b.x + 160, b.x, easeOut(k)), s = which === 'pred' ? lerp(.25, 1, easeOut(k)) : 1;
    const fl = which === 'real' ? Math.max(.02, Math.abs(Math.cos(clamp(cd.flip ?? 1, 0, 1) * Math.PI))) : 1;
    netShadow(c, V, rectPts(x - b.w / 2 * s * fl, b.y - b.h / 2 * s, b.w * s * fl, b.h * s).map(([px, py]) => netUp(NET3.cardY, g.aC, 0, px, py)),
      .14 * netUpA(g.aC) * (which === 'real' ? sm(0, .4, k) : 1) * (cd.al ?? 1)); }
  lines.forEach((l, i) => { if (l.k > .3) tab(netTok(i)[0], 64, netTok(i)[1] + R, g.aT[i]); });
  if (nk > .3) tab(NET.node.x, 70, NET3.nodeY, g.aN);
  if (o.real && (o.real.k ?? 1) > .5) tab(NET.real.x, 90, NET3.cardY, g.aC);
  if (o.pred && (o.pred.k ?? 1) > .6) tab(NET.pred.x, 90, NET3.cardY, g.aC);
}
// 圆片的标签：平躺时在圆片下方（和平面版一样），一立起来就挪到圆片左边（写在同一张卡上，不会被前面的圆片挡住）
function netLabel3(c, i, l, a) {
  const k = clamp(l.k, 0, 1); if (!l.label || k <= .01) return;
  const [x, y] = netTok(i), s = k * (1 + .14 * Math.sin(clamp(l.pulse, 0, 1) * Math.PI)), u = clamp(a / (Math.PI / 2) * 2.5, 0, 1);
  zh(c, l.label, lerp(x, x - NET.inR * s - 52, u), lerp(y + NET.inR * s + 34, y + 11, u), { size: lerp(28, 32, u), color: P.ink2, align: 'center', al: lerp(.4, 1, clamp(l.on, 0, 1)) * k });
}

// 立体件：[{ z, draw(c) }]，z = 铰链在书页上的 y（越大越近、越后画）
function netPieces(V, o, t, g, lines) {
  const out = [], R = NET.inR, ph = netSparkPhase(o), sp = o.spark;
  const active = sp ? (sp.lines || lines.map((l, i) => i).filter(i => lines[i].on >= .5 && lines[i].cut < .5)) : [];
  const qOf = i => sp && sp.qs && sp.qs[i] != null ? clamp(sp.qs[i], 0, 1) : ph ? ph.q : 0;
  lines.forEach((l, i) => { const Yh = netTok(i)[1] + R;
    out.push({ z: Yh - 1, draw: c => netStrip3(c, V, i, l, active.includes(i) && ph && ph.p >= .4 ? { q: qOf(i), dw: (sp.dw && sp.dw[i]) || 0 } : null, g) });
    out.push({ z: Yh, draw: c => { c.transform(...netPlane(V, Yh, g.aT[i], 0, netTok(i)[0], 60)); netToken(c, i, { ...l, label: '' }); netLabel3(c, i, l, g.aT[i]); } }); });
  out.push({ z: NET3.nodeY, draw: c => { c.transform(...netPlane(V, NET3.nodeY, g.aN, 0, NET.node.x, 76)); netNode(c, o.node || {}, t); } });
  out.push({ z: NET3.cardY, draw: c => { c.transform(...netPlane(V, NET3.cardY, g.aC, 0, (NET.pred.x + NET.real.x) / 2, 140));
    if (o.pred) netCardAt(c, 'pred', o.pred, o);
    if (o.real) netCardAt(c, 'real', o.real, o);
    if (o.cmp > 0 && o.pred && o.real && (o.real.flip ?? 0) > .5 && (o.pred.k ?? 1) > .95) netCmp(c, o);
    if (ph && ph.p < .3) { const b = ph.burst, fB = 1 - sm(.15, .3, ph.p), sz = sp.size ?? 1;   // 炸开的红笔线画在牌面上
      for (let k = 0; k < 7; k++) { const an = k / 7 * TAU - .4, r0 = 26 * sz, r1 = r0 + 30 * sz * easeOut(b);
        rline(c, [[ph.a0[0] + Math.cos(an) * r0, ph.a0[1] + Math.sin(an) * r0], [ph.a0[0] + Math.cos(an) * r1, ph.a0[1] + Math.sin(an) * r1]], { w: 3.5, color: P.red, seed: 3500 + k, al: fB }); } } } });
  if (ph) out.push({ z: 1e5, draw: c => {   // 火花总在最前面
    const sz = sp.size ?? 1, rot = t * 3, mainA = 1 - sm(.4, .5, ph.p), mainR = sz * (ph.p < .15 ? 40 * easeOutBack(ph.burst) : 28);
    if (mainA > 0) for (let k = 3; k >= 0; k--) { if (k && !(ph.p > .15 && ph.p < .45)) continue;
      const q = netSparkAt3({ ...o, spark: { ...sp, p: Math.max(0, ph.p - k * .02) } }), [x, y, s] = netP(V, q[0], q[1], q[2]);
      if (k === 0) netSparkPiece(c, x, y, mainR * s, rot, mainA, 3509); else netSparkPiece(c, x, y, mainR * (.5 - k * .1) * s, rot + k, mainA * .7, 3510 + k); }
    if (ph.p >= .4) for (const i of active) { const q = qOf(i); if (q >= 1) continue; const s3 = netS3(i, 1 - q, g), [x, y, s] = netP(V, s3[0], s3[1], s3[2] + 8);
      netSparkPiece(c, x, y, 22 * sz * s, rot + i, (1 - sm(.85, 1, q)) * sm(0, .06, q), 3520 + i); } } });
  return out;
}
function netPop(c, V, o = {}, t = 0, extra = []) {
  const al = o.al ?? 1; if (al <= 0) return;
  const g = netGeo3(o), lines = netLines(o);
  c.save(); c.globalAlpha *= al;
  netPage3(c, V, o, g, lines);
  netPieces(V, o, t, g, lines).concat(extra).sort((a, b) => a.z - b.z).forEach(p => { c.save(); p.draw(c); c.restore(); });
  c.restore();
}
