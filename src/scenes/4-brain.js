'use strict';
// 第 4 段：人脑也在压缩（第三稿，从第二稿 4-brain.js 拆出来重排）。段首、段末各 0.8 秒是标准画面（spread + 页眉 + 两人在 EP3 站位）。
// 站位区（穿模）：帕秋莉 x≤420（下棋时退到 x=260，包围框 135–385），琪露诺 x≥1520（下棋时退到 1650，包围框 1496–1804）；
//   道具只放在 x 420–1470 之间：冰格在上方 y 160–300，两盘棋 y 390–700，计数排 y 740–840，卡片 x 520–1410。
//   人物走位先于道具出现（L4 前的停顿里让开），道具收掉以后再走回来。飞行物都在 y<440 的上方或道具区里走，不穿人。
//   L1 琪露诺：那我的脑子呢？（歪头想）
//   L2 头顶上方浮出四个冰格；琪露诺变出四颗小冰珠一颗颗落进去，第五颗撞到满格弹飞
//   L3 ★ 珠子跳出去；一大块冻着很多珠子的冰在空中冻成，缩小落进第一格，也只占一格。停住
//   L4 冰格收起、两人让开；左页立起一盘真实对局，看一眼就蒙上霜，棋子按组复原；盘下「大师」一排远长于「新手」；蜡封（实验）
//   L5 左盘淡下去；右页立起乱摆的一盘，蒙霜后棋子一颗颗冒出又滑走；盘下两排差不多长
//   L6 左盘亮回来，棋子几颗一组圈上淡冰；冰格重新浮出，四组整块飞进去，一组一格
//   L7 左盘收起、组块淡出；右盘乱摆的棋子重新摆好，一颗一颗飞进冰格，四格就满，第五颗弹飞
//   L8 ★ 右盘裂开、碎成冰渣落下。停住
//   L9 琪露诺：那我的三百道题……一摞卷子哗地倒在页上
//   L10 卡片按原因飞成十二摞，每摞顶上压一小块冰。段末各摞沉下去（第 5 段开头再浮上来）
// 节拍全部由台词起止和语音进度推出；静态棋盘先画进缓存图（按渲染缩放），右盘碎裂时按碎片裁剪这张图。
// 顶层名字一律带本段前缀 S4 / s4。第 5 段借用本文件的卡片摞（s4Stacks）。
const S4LINES = seq(1.0, [
  ['那我的脑子呢？', { who: 'cirno', mood: 'confused', pause: .3, hold: .6 }],
  ['你的脑子，一次只能抓住四样左右的东西。', { pause: .2, hold: 1.4 }],
  ['可一样东西，可以很大。', { hold: 1.8 }],
  ['象棋大师看一眼棋盘，摆对的棋子是新手的好几倍。', { pause: 1.0, hold: 1.8 }],
  ['可要是棋子乱摆，他就和新手差不多了。', { pause: .6, hold: 1.6 }],
  ['因为他记的是套路：几颗棋子一组，只占一个位置。', { pause: .3, hold: 1.6 }],
  ['乱摆的棋子没有套路，只能一颗一颗硬记。', { pause: .4, hold: 1.6 }],
  ['死记硬背，就是在记乱摆的棋子。', { pause: .2, hold: 1.8 }],
  ['那我的三百道题……', { who: 'cirno', mood: 'surprised', pause: .8, hold: 1.2 }],
  ['找出错的原因，也许只剩十几条。', { pause: .2, hold: 2.2 }],
]);
const S4T = i => S4LINES[i][0], S4E = i => S4LINES[i][1];
// S4W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S4W = (i, f) => { const v = voiceOf(S4LINES[i][2]), l = S4LINES[i], h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S4REST = .85;
const S4DUR = S4E(9) + .8 + S4REST;

// ===================== 节拍 =====================
const S4B = (() => { const T = S4T, E = S4E, w = S4W; return {
  cells: [w(1, .22), w(1, .4)], beads: [w(1, .52), w(1, .64), w(1, .76), w(1, .88)], extra: w(1, 1) + .15,
  beadsOut: T(2) + .05, blockForm: [w(2, .45), w(2, .8)], block: [w(2, .9), w(2, 1) + .6],
  cellsOff: [T(3) - 1.0, T(3) - .6], step: [T(3) - 1.0, T(3) - .15],
  lIn: [T(3) - .35, T(3) + .35], lHide: [w(3, .36), w(3, .46)], lBack: [w(3, .52), w(3, .82)], master: [w(3, .52), w(3, .86)], novice: [w(3, .86), w(3, 1)],
  seal: w(3, 1) + .15,
  lDim: [T(4) - .6, T(4) - .2], rIn: [T(4) - .5, T(4) + .1], rHide: [w(4, .26), w(4, .36)], rSlide: [w(4, .38), w(4, .9)], rTally: [w(4, .5), w(4, 1)],
  swap: [T(5) - .3, T(5) + .1], tallyOff: [T(5) - .3, T(5) + .1], rings: [w(5, .34), w(5, .62)], cells2: [w(5, .6), w(5, .75)], lift: [w(5, .72), w(5, 1) + .5],
  chunkOut: [T(6) - .2, T(6) + .3], lOut: [T(6) - .2, T(6) + .35], rBack: [T(6) + .05, T(6) + .6], singles: [w(6, .5), w(6, .62), w(6, .74), w(6, .86)], extra2: w(6, 1) + .1,
  crack: [w(7, .05), w(7, .42)], shatter: w(7, .48),
  clear: [T(8) - .8, T(8) - .35], back: [T(8) - .7, T(8) + .15], pour: [w(8, .05), w(8, 1) + .5],
  fly: [w(9, .25), w(9, 1) + .35], tags: w(9, 1) + .2,
  end: [E(9) + .05, E(9) + .75],
}; })();

// ===================== 冰格（工作记忆） =====================
const S4CELL = { y: 240, s: 110, xs: [690, 840, 1080, 1230], d: 22 };   // 前面那一面的中心 y、边长、四格中心 x（避开书脊）、斜看的纵深
const S4SRC = [1560, 400];   // 琪露诺变出冰珠的地方：她头顶上方，包围框外
function s4IceFace(c, pts, fill, al) { c.fillStyle = alpha(fill, al); c.fill(polyPath(pts)); }
// 冰格后半（后壁、底、右侧）：先画，再放里面的东西，最后画前壁 s4CellFront
function s4CellBack(c, x, y, s, k) {
  const h = s / 2, d = S4CELL.d;
  c.save(); c.globalAlpha *= k;
  s4IceFace(c, [[x - h + d, y - h - d], [x + h + d, y - h - d], [x + h + d, y + h - d], [x - h + d, y + h - d]], EP2_ICE_DEEP, .35);
  s4IceFace(c, [[x - h, y + h], [x + h, y + h], [x + h + d, y + h - d], [x - h + d, y + h - d]], EP2_ICE_DEEP, .55);
  s4IceFace(c, [[x + h, y - h], [x + h + d, y - h - d], [x + h + d, y + h - d], [x + h, y + h]], EP2_ICE_DEEP, .6);
  c.restore();
}
function s4CellFront(c, x, y, s, k, glow = 0) {
  const h = s / 2, d = S4CELL.d;
  c.save(); c.globalAlpha *= k;
  s4IceFace(c, rectPts(x - h, y - h, s, s), EP2_ICE, .38 + glow * .2);
  c.strokeStyle = alpha(EP2_FROST, .95); c.lineWidth = 2.5; c.lineJoin = 'round';
  c.stroke(polyPath(rectPts(x - h, y - h, s, s)));
  c.beginPath(); c.moveTo(x - h, y - h); c.lineTo(x - h + d, y - h - d); c.lineTo(x + h + d, y - h - d); c.lineTo(x + h + d, y + h - d); c.lineTo(x + h, y + h); c.moveTo(x + h, y - h); c.lineTo(x + h + d, y - h - d); c.stroke();
  c.strokeStyle = alpha('#ffffff', .7); c.lineWidth = 3; c.beginPath(); c.moveTo(x - h + 10, y - h + 30); c.lineTo(x - h + 30, y - h + 10); c.stroke();
  c.restore();
}
function s4Bead(c, x, y, r, al = 1) {
  if (al <= 0 || r <= .5) return;
  c.save(); c.globalAlpha *= al;
  c.fillStyle = alpha('#3a4a60', .18); c.beginPath(); c.arc(x + 2, y + 3, r, 0, TAU); c.fill();
  c.fillStyle = EP2_ICE_DEEP; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = alpha('#6f96b3', .8); c.lineWidth = 1.5; c.stroke();
  c.fillStyle = alpha('#ffffff', .85); c.beginPath(); c.ellipse(x - r * .35, y - r * .35, r * .28, r * .18, -.6, 0, TAU); c.fill();
  c.restore();
}
// 一大块冻在一起的冰：立方体，里面冻着 4×3 颗珠子；form 0..1 珠子聚拢、冰冻上去
function s4Block(c, x, y, s, al = 1, form = 1) {
  if (al <= 0) return; const h = s / 2, d = s * .2, ice = sm(.45, 1, form);
  c.save(); c.globalAlpha *= al;
  if (ice > 0) { c.save(); c.globalAlpha *= ice;
    s4IceFace(c, [[x - h, y - h], [x - h + d, y - h - d], [x + h + d, y - h - d], [x + h, y - h]], EP2_FROST, .9);
    s4IceFace(c, [[x + h, y - h], [x + h + d, y - h - d], [x + h + d, y + h - d], [x + h, y + h]], EP2_ICE_DEEP, .9);
    s4IceFace(c, rectPts(x - h, y - h, s, s), EP2_ICE, .92); c.restore(); }
  const g = sm(0, .6, form);
  for (let i = 0; i < 12; i++) { const bx = x - h + s * (.18 + (i % 4) * .215), by = y - h + s * (.24 + Math.floor(i / 4) * .26) + (i % 2) * s * .04, a = hash(i, 4401) * TAU, R = s * .4 * (1 - g);
    s4Bead(c, bx + Math.cos(a) * R, by + Math.sin(a) * R * .6, s * .075, .9 * sm(0, .2, form)); }
  if (ice > 0) { c.save(); c.globalAlpha *= ice; s4IceFace(c, rectPts(x - h, y - h, s, s), EP2_FROST, .18);
    c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.stroke(polyPath(rectPts(x - h, y - h, s, s))); c.restore(); }
  c.restore();
}

// ===================== 冰棋盘（斜看） =====================
const S4F = 1600, S4PS = .8, S4FY = .52;
const S4BD = { L: { x: 640, y: 560, q: 46, id: 'L' }, R: { x: 1250, y: 560, q: 46, id: 'R' } };
// 棋盘坐标 (u, v)：u 0..8 从 a 列到 h 列，v 0..8 从远（第 8 行）到近（第 1 行）；h 是离开盘面的高度
function s4Pt(B, u, v, h = 0) { const X = (u - 4) * B.q, Z = (v - 4) * B.q, k = S4F / (S4F - Z * S4PS); return [B.x + X * k, B.y + Z * S4FY * k - h * k, k]; }
const s4Sq = (f, r) => [f + .5, 8 - r + .5];   // f 0..7，r 1..8 → 格子中心的 (u, v)
const S4BMP = new Map();
function s4BoardBmp(B, sc) {
  const id = B.id + '|' + sc; let cv = S4BMP.get(id); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
  const g = cv.getContext('2d'); g.setTransform(sc, 0, 0, sc, 0, 0);
  const P4 = (u, v, h) => { const p = s4Pt(B, u, v, h); return [p[0], p[1]]; }, th = 20;
  const top = [P4(-.25, -.25), P4(8.25, -.25), P4(8.25, 8.25), P4(-.25, 8.25)];
  // 落在书页上的影子、冰板的厚度（近边和两侧）
  g.save(); g.shadowColor = 'rgba(40,30,40,.35)'; g.shadowBlur = 20; g.shadowOffsetY = 12; g.fillStyle = alpha(EP2_ICE_DEEP, .9);
  g.fill(polyPath([top[0], top[1], top[2], [top[2][0], top[2][1] + th], [top[3][0], top[3][1] + th], top[3]])); g.restore();
  g.fillStyle = mix(EP2_ICE_DEEP, '#6f96b3', .35); g.fill(polyPath([top[3], top[2], [top[2][0], top[2][1] + th], [top[3][0], top[3][1] + th]]));
  g.fillStyle = alpha('#ffffff', .35); g.fillRect(top[3][0], top[3][1] + 3, top[2][0] - top[3][0], 2);
  g.fillStyle = EP2_ICE; g.fill(polyPath(top));
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) if ((f + r) % 2 === 0) {
    g.fillStyle = alpha(EP2_ICE_DEEP, .75); g.fill(polyPath([P4(f, r), P4(f + 1, r), P4(f + 1, r + 1), P4(f, r + 1)])); }
  g.strokeStyle = alpha(EP2_FROST, .95); g.lineWidth = 2.5; g.stroke(polyPath([P4(0, 0), P4(8, 0), P4(8, 8), P4(0, 8)]));
  g.strokeStyle = alpha('#ffffff', .9); g.lineWidth = 2; g.stroke(polyPath(top));
  g.save(); g.clip(polyPath(top)); g.strokeStyle = alpha('#ffffff', .35); g.lineWidth = 7;
  for (const u of [1.2, 1.9, 5.6]) { g.beginPath(); const a = P4(u, 0), b = P4(u - 1.6, 3.2); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.restore();
  grain(g, polyPath(top), .06);
  S4BMP.set(id, cv); return cv;
}
// 棋子：剪纸国际象棋子，右半边轮廓（从底到顶，x 是半宽，y 向上为负，王高约 1）镜像成整片；马单独给整圈
const S4PROF = {
  p: [[.30, 0], [.30, -.07], [.22, -.11], [.13, -.16], [.10, -.36], [.18, -.40], [.18, -.43], [.10, -.46]],
  r: [[.32, 0], [.32, -.07], [.24, -.11], [.18, -.16], [.18, -.55], [.24, -.58], [.24, -.76], [.15, -.76], [.15, -.69], [.05, -.69], [.05, -.76], [0, -.76]],
  b: [[.30, 0], [.30, -.07], [.22, -.11], [.14, -.16], [.10, -.45], [.18, -.48], [.18, -.51], [.12, -.53], [.16, -.62], [.14, -.72], [.08, -.80], [.03, -.84], [.05, -.86], [.04, -.90], [0, -.91]],
  q: [[.32, 0], [.32, -.07], [.24, -.11], [.15, -.16], [.10, -.55], [.20, -.58], [.20, -.61], [.13, -.63], [.18, -.78], [.25, -.88], [.17, -.84], [.13, -.92], [.07, -.85], [0, -.94]],
  k: [[.32, 0], [.32, -.07], [.24, -.11], [.15, -.16], [.11, -.58], [.21, -.61], [.21, -.64], [.14, -.66], [.20, -.84], [.08, -.87], [.04, -.88], [.04, -.92], [.10, -.92], [.10, -.96], [.04, -.96], [.04, -1.02], [0, -1.02]],
};
for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (1 - i / 8) * 2.3; S4PROF.p.push([Math.cos(a) * .135 * (i === 8 ? 0 : 1), -.585 + Math.sin(a) * .135]); }
const S4KNIGHT = [[-.32, 0], [.32, 0], [.32, -.07], [.24, -.11], [.20, -.16], [.22, -.40], [.20, -.60], [.12, -.76], [.03, -.84], [-.01, -.93], [-.07, -.83], [-.20, -.72], [-.31, -.57], [-.29, -.50], [-.19, -.50], [-.09, -.55], [-.16, -.36], [-.20, -.16], [-.24, -.11], [-.32, -.07]];
const S4PIECE = (() => { const out = {}, S = 100;
  for (const t of 'prbqk') { const r = S4PROF[t].map(([x, y]) => [x * S, y * S]), l = r.slice().reverse().map(([x, y]) => [-x, y]); out[t] = new Path2D(polyPath(scissor([...r, ...l], 4400 + t.charCodeAt(0), 7, .5))); }
  out.n = new Path2D(polyPath(scissor(S4KNIGHT.map(([x, y]) => [x * S, y * S]), 4410, 7, .5)));
  return out; })();
// s4Piece：在屏幕 (x, y) 立一颗棋子（y 是底边），高 s（王的高度），white 白子 / 黑子
function s4Piece(c, type, x, y, s, white, al = 1, flip = false) {
  if (al <= 0 || s <= 1) return; const k = s / 100;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.scale(flip ? -k : k, k);
  c.fillStyle = 'rgba(30,25,40,.28)'; c.translate(4, 3); c.fill(S4PIECE[type]); c.translate(-4, -3);
  c.fillStyle = white ? '#f3eee6' : '#3b3444'; c.fill(S4PIECE[type]);
  c.strokeStyle = white ? alpha(P.ink2, .7) : alpha('#8a7f98', .8); c.lineWidth = 1.6 / k; c.stroke(S4PIECE[type]);
  c.restore();
}
// 真实对局：意大利开局走了十几步，双方王车易位，王前兵链；26 子
const S4REAL = [
  ['k', 6, 1, 1], ['r', 5, 1, 1], ['r', 0, 1, 1], ['q', 4, 2, 1], ['n', 5, 3, 1], ['b', 1, 3, 1], ['p', 0, 2, 1], ['p', 1, 2, 1], ['p', 2, 3, 1], ['p', 5, 2, 1], ['p', 6, 2, 1], ['p', 7, 2, 1], ['p', 4, 4, 1],
  ['k', 6, 8, 0], ['r', 5, 8, 0], ['r', 0, 8, 0], ['q', 4, 7, 0], ['n', 5, 6, 0], ['b', 3, 6, 0], ['p', 0, 7, 0], ['p', 1, 7, 0], ['p', 2, 6, 0], ['p', 5, 7, 0], ['p', 6, 7, 0], ['p', 7, 7, 0], ['p', 4, 5, 0],
];
// 组块：几颗棋子一个套路（白王城堡、黑王城堡、白后翼兵链、黑后翼兵链）；其余棋子复原不出来
const S4GROUPS = [[0, 1, 9, 10, 11], [13, 14, 22, 23, 24], [2, 6, 7, 8], [15, 19, 20, 21]];
const S4GROUP_OF = (() => { const g = {}; S4GROUPS.forEach((G, j) => G.forEach(i => g[i] = j)); return g; })();
const S4NGROUP = S4GROUPS.reduce((a, G) => a + G.length, 0);
// 乱摆：同样 26 颗子，随机格子（确定性的）
const S4RAND = (() => { const sq = Array.from({ length: 64 }, (_, i) => i), r = rng(4420);
  for (let i = 63; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [sq[i], sq[j]] = [sq[j], sq[i]]; }
  return S4REAL.map(([t, , , w], i) => [t, sq[i] % 8, 1 + Math.floor(sq[i] / 8), w]); })();
const S4KEEP = [3, 11, 17];          // L5：乱摆盘上复原对的那三颗
const S4SINGLE = [16, 4, 13, 21];    // L7：一颗一颗飞进冰格的四颗（第五颗 S4EXTRA 弹飞）
const S4EXTRA = 7;
const S4PH = { k: 78, q: 75, b: 70, n: 70, r: 68, p: 62 };   // 各棋子高（像素，k = 1 时）

// 冰圈：棋盘平面上围住一组格子的圆角框（投影成多边形）
function s4Ring(B, G, pos) {
  let u0 = 9, u1 = -1, v0 = 9, v1 = -1; for (const i of G) { const [u, v] = s4Sq(pos[i][1], pos[i][2]); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, ru = (u1 - u0) / 2 + .62, rv = (v1 - v0) / 2 + .62, pts = [];
  for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, ca = Math.cos(a), sa = Math.sin(a); const p = s4Pt(B, cu + ru * Math.sign(ca) * Math.pow(Math.abs(ca), .45), cv + rv * Math.sign(sa) * Math.pow(Math.abs(sa), .45)); pts.push([p[0], p[1]]); }
  return pts;
}
const S4RINGS = S4GROUPS.map(G => s4Ring(S4BD.L, G, S4REAL));
function s4DrawRing(c, pts, al) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al;
  c.fillStyle = alpha(EP2_FROST, .55); c.fill(polyPath(pts)); c.strokeStyle = alpha('#ffffff', .95); c.lineWidth = 3; c.stroke(polyPath(pts));
  c.strokeStyle = alpha('#7ea6c2', .6); c.lineWidth = 1.5; c.stroke(polyPath(pts.map(([x, y]) => [x + 1.5, y + 2])));
  c.restore();
}
// 画一盘棋：items = [{ i, u, v, al, lift, sy }]（按远到近排好）
function s4DrawPieces(c, B, pos, items) {
  for (const it of items.slice().sort((a, b) => a.v - b.v)) { const [t, , , w] = pos[it.i], [x, y, k] = s4Pt(B, it.u, it.v, it.lift || 0);
    s4Piece(c, t, x, y, S4PH[t] * k * (it.sy ?? 1), w, it.al, t === 'n' && w === 0); }
}
// 棋盘上一颗子的屏幕底点和高
function s4PieceAt(B, pos, i) { const [u, v] = s4Sq(pos[i][1], pos[i][2]), [x, y, k] = s4Pt(B, u, v); return [x, y, S4PH[pos[i][0]] * k]; }
// 碎片：把右盘的屏幕四边形切成 5×4 块带抖动的三角形
const S4SHARDS = (() => { const B = S4BD.R, nu = 5, nv = 4, grid = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const edge = i === 0 || j === 0 || i === nu || j === nv, ju = edge && (i === 0 || i === nu) ? 0 : (hash(i * 7 + j, 4430) - .5) * .9, jv = edge && (j === 0 || j === nv) ? 0 : (hash(i * 5 + j * 3, 4431) - .5) * .9;
    const u = -.25 + 8.5 * i / nu + ju, v = -.25 + 8.5 * j / nv + jv, p = s4Pt(B, u, v); grid.push([p[0], p[1]]); }
  const g = (i, j) => grid[j * (nu + 1) + i], out = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = g(i, j), b = g(i + 1, j), c2 = g(i + 1, j + 1), d = g(i, j + 1);
    const tris = (i + j) % 2 ? [[a, b, c2], [a, c2, d]] : [[a, b, d], [b, c2, d]];
    for (const tr of tris) { const cx = (tr[0][0] + tr[1][0] + tr[2][0]) / 3, cy = (tr[0][1] + tr[1][1] + tr[2][1]) / 3; out.push({ tr: tr.map(p => [p[0], p[1] + (p[1] > B.y + 90 ? 20 : 0)]), cx, cy, n: out.length }); } }
  return out; })();

// 盘下的计数：大师 / 新手各一排小棋子（只画「好几倍」，不写数）；rows = [[名字, 个数, 开始, 结束, 分组空隙, 透明度]]
function s4Tally(c, B, tau, rows) {
  const x0 = B.x - 190;
  rows.forEach(([name, n, t0, t1, gaps, al], r) => { if (al <= 0) return; const y = 770 + r * 50;
    c.save(); c.globalAlpha *= al;
    c.fillStyle = r ? P.g2 : P.ink2; c.beginPath(); c.arc(x0, y - 26, 9, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x0, y - 4, 15, 12, 0, Math.PI, TAU); c.fill();
    zh(c, name, x0 + 24, y - 4, { size: 26, color: P.ink2 });
    let x = x0 + 90;
    for (let k = 0; k < n; k++) { const at = lerp(t0, t1, n > 1 ? k / (n - 1) : 0), a = sm(at, at + .2, tau); if (gaps && gaps.includes(k)) x += 10;
      if (a > 0) s4Piece(c, 'p', x, y + 2 - 8 * (1 - a), 30, !!r, a); x += 17; }
    c.restore(); });
}
// 蒙霜：棋子被一层白霜盖住（「看一眼」之后收起来）
function s4Frost(c, B, a) {
  if (a <= 0) return; const q = [s4Pt(B, -.25, -.25), s4Pt(B, 8.25, -.25), s4Pt(B, 8.25, 8.25), s4Pt(B, -.25, 8.25)].map(p => [p[0], p[1]]);
  q[0][1] -= 75; q[1][1] -= 75; c.fillStyle = alpha(EP2_FROST, .75 * a); c.fill(polyPath(q));
}

// ===================== 错题卡（第 5 段接着用） =====================
const S4NS = 12;                                  // 十二摞：两行，每行左页三摞、右页三摞（避开书脊）
const S4STX = [560, 710, 860, 1070, 1220, 1370], S4STY = [600, 800];
const s4StackPos = s => [S4STX[s % 6], S4STY[Math.floor(s / 6)]];
const S4NC = 144, S4PER = S4NC / S4NS;
const S4CARD = Array.from({ length: S4NC }, (_, i) => ({ x: 560 + hash(i, 4450) * 800, y: 660 + hash(i, 4451) * 180, rot: (hash(i, 4452) - .5) * 1.6,
  t: i / S4NC, s: i % S4NS, j: Math.floor(i / S4NS), fly: hash(i, 4453) }));
function s4Card(c, x, y, rot, s = 1, al = 1, seed = 0, mark = true) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = 'rgba(30,25,35,.22)'; c.fillRect(-30, -20, 64, 46);
  c.fillStyle = '#f6f1e6'; c.fillRect(-32, -23, 64, 46); c.strokeStyle = alpha(P.paperEdge, .9); c.lineWidth = 1; c.strokeRect(-32, -23, 64, 46);
  c.fillStyle = alpha(P.ink2, .5); for (let k = 0; k < 3; k++) c.fillRect(-25, -14 + k * 11, 26 + hash(k, seed) * 20, 2.5);
  if (mark) { c.strokeStyle = alpha(P.red, .85); c.lineWidth = 3; c.beginPath(); c.moveTo(16, -12); c.lineTo(26, -2); c.moveTo(26, -12); c.lineTo(16, -2); c.stroke(); }
  c.restore();
}
// 一小块冰（每摞顶上压着，代表「一个原因」；不写字）
function s4Tag(c, x, y, k, seed) {
  if (k <= 0) return; const w = 44, h = 26, d = 8, s = easeOutBack(clamp(k, 0, 1)), dy = (1 - s) * -30;
  c.save(); c.globalAlpha *= clamp(k * 2, 0, 1); c.translate(x, y + dy); c.rotate((hash(seed, 4462) - .5) * .12);
  s4IceFace(c, [[-w / 2, -h], [-w / 2 + d, -h - d], [w / 2 + d, -h - d], [w / 2, -h]], EP2_FROST, .95);
  s4IceFace(c, [[w / 2, -h], [w / 2 + d, -h - d], [w / 2 + d, -d], [w / 2, 0]], EP2_ICE_DEEP, .95);
  s4IceFace(c, rectPts(-w / 2, -h, w, h), EP2_ICE, .95);
  c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.strokeRect(-w / 2, -h, w, h);
  c.restore();
}
// 一摞：n 张卡叠起来；tag 0..1 顶上的小冰块
function s4Stack(c, s, n, tag, al = 1, lift = 0) {
  if (al <= 0 || n <= 0) return; const [x, y0] = s4StackPos(s), y = y0 - lift;
  c.save(); c.globalAlpha *= al;
  for (let k = 0; k < n; k++) s4Card(c, x + (hash(k, 4460 + s) - .5) * 6, y - 23 - k * 3, (hash(k, 4461 + s) - .5) * .12, 1, 1, s * 20 + k, k === n - 1);
  s4Tag(c, x, y - 46 - n * 3 + 2, tag, s);
  c.restore();
}
// 十二摞全部（第 5 段也调用）：al 整体透明度、rise 0..1 从页面里浮上来、hop(s) 每摞跳多高、dim(s) 每摞的透明度
function s4Stacks(c, o = {}) {
  const { al = 1, rise = 1, hop = () => 0, dim = () => 1, n = () => S4PER, tag = () => 1 } = o;
  if (al <= 0 || rise <= 0) return;
  for (let s = 0; s < S4NS; s++) { const k = n(s); if (k <= 0) continue;
    c.save(); const [x, y] = s4StackPos(s); c.translate(x, y); c.scale(1, rise); c.translate(-x, -y);
    s4Stack(c, s, k, tag(s), al * dim(s) * clamp(rise * 1.5, 0, 1), hop(s)); c.restore(); }
}

// ===================== 两人走位 =====================
const S4PX = 260, S4CX = 1650;   // 下棋时两人退到的位置
function s4Cast(c, tau, L) {
  const B = S4B, T = S4T, w = S4W;
  const pK = [[B.step[0], EP3.pch.x], [B.step[1], S4PX], [B.back[0], S4PX], [B.back[1], EP3.pch.x]];
  const cK = [[B.step[0] + .05, EP3.cir.x], [B.step[1], S4CX], [B.back[0], S4CX], [B.back[1], EP3.cir.x]];
  const px = key(tau, pK), pWalk = Math.abs(key(tau + .05, pK) - px) > .2;
  const cx = key(tau, cK), cWalk = Math.abs(key(tau + .05, cK) - cx) > .2;
  // 帕秋莉
  let pPose = 'lecture', pMood = 'normal', pFace = 1, pGest;
  if (tau >= T(2) && tau < T(3) - 1) { pPose = 'lecture'; pGest = .9; }
  if (tau >= T(3) && tau < T(8) - .8) pPose = 'point';
  if (tau >= T(4) - .2 && tau < T(5) - .3) pGest = .9;                 // 指向远处的右盘
  if (tau >= T(7) && tau < T(8) - .8) { pPose = 'cross'; pMood = tau > B.shatter ? 'smug' : 'normal'; }
  if (tau >= T(9) && tau < B.end[0]) pPose = 'point';
  if (pWalk) pPose = 'stand';
  const pBob = pWalk ? -Math.abs(Math.sin(twos(tau) * 9)) * 8 : 0;
  drawPatchouli(c, { ...EP3.pch, x: px, y: EP3.pch.y + pBob, facing: pFace, pose: pPose, gesture: pGest, mood: moodOf(L, 'patchouli', pMood), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  // 琪露诺
  let pose = 'stand', facing = -1, gest = null, mood = 'normal', look = 0;
  if (tau >= T(0) - .2 && tau < T(1)) { pose = 'think'; mood = 'confused'; }
  if (tau >= B.beads[0] - .4 && tau < B.extra + .5) { pose = 'proud'; gest = .7 + .3 * Math.sin(twos(tau) * 6); }
  if (tau >= B.extra + .5 && tau < T(2)) { mood = 'surprised'; }
  if (tau >= B.blockForm[0] - .3 && tau < B.block[1]) { pose = 'proud'; gest = 1; mood = 'proud'; }
  if (tau >= T(3) && tau < T(4) - .6) { pose = 'point'; gest = .7; mood = tau > w(3, .82) ? 'happy' : 'normal'; }
  if (tau >= T(4) - .6 && tau < T(5) - .3) { pose = 'think'; mood = 'confused'; }
  if (tau >= T(5) - .3 && tau < T(6)) { pose = 'stand'; look = .5; }
  if (tau >= T(6) && tau < T(7)) { pose = 'point'; gest = .6; mood = tau > B.extra2 ? 'surprised' : 'normal'; }
  if (tau >= T(7) && tau < T(8) - .8) { pose = 'slump'; mood = tau > B.shatter ? 'surprised' : 'confused'; }
  if (tau >= T(8) - .1 && tau < T(9)) { pose = 'slump'; mood = 'cry'; }
  if (tau >= T(9) && tau < B.end[0]) { pose = tau > B.tags ? 'stand' : 'think'; mood = tau > B.tags ? 'happy' : 'confused'; }
  if (cWalk) { pose = 'stand'; mood = 'normal'; }
  const cBob = cWalk ? -Math.abs(Math.sin(twos(tau) * 9)) * 8 : 0;
  return drawCirno(c, { ...EP3.cir, x: cx, y: EP3.cir.y + cBob, facing, pose, gesture: gest, look, mood: moodOf(L, 'cirno', mood), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

// ===================== 主画面 =====================
function s4Draw(c, tau, L) {
  const B = S4B, T = S4T, w = S4W, sc = c.getTransform().a || 1;
  spread(c, tau);
  pageHeader(c, '第四页 · 人脑', tau, .9);

  // ---- 两盘冰棋 ----
  const lIn = sm(B.lIn[0], B.lIn[1], tau, easeOutBack), lOut = 1 - sm(B.lOut[0], B.lOut[1], tau);
  const lDim = 1 - .65 * (sm(B.lDim[0], B.lDim[1], tau) - sm(B.swap[0], B.swap[1], tau));
  const rIn = sm(B.rIn[0], B.rIn[1], tau, easeOutBack), rDim = 1 - .65 * (sm(B.swap[0], B.swap[1], tau) - sm(B.rBack[0], B.rBack[0] + .4, tau));
  const rShat = tau >= B.shatter;
  const drawBoardImg = (bd, k, al) => { if (k <= .001 || al <= 0) return; const fy = bd.y + 140;
    c.save(); c.globalAlpha *= al; c.translate(0, fy); c.scale(1, k); c.translate(0, -fy); c.drawImage(s4BoardBmp(bd, sc), 0, 0, W, H); c.restore(); };
  const lK = lIn * lOut, lA = lOut * lDim;
  drawBoardImg(S4BD.L, lK, lA);
  if (!rShat) { drawBoardImg(S4BD.R, rIn, rDim);
    const cr = sm(B.crack[0], B.crack[1], tau, t => t);
    if (cr > 0) for (const s of S4SHARDS) { if (hash(s.n, 4432) > .55) continue; rline(c, s.tr, { w: 2, color: alpha('#ffffff', .95), p: cr, close: true, seed: 4433 + s.n, amp: .5 }); rline(c, s.tr, { w: 1, color: alpha('#5f86a6', .7), p: cr * .9, close: true, seed: 4434 + s.n, amp: .5 }); }
  } else { const u = tau - B.shatter, bmp = s4BoardBmp(S4BD.R, sc);
    // 碎片往下落，横向只散开一点（不飞进琪露诺的站位区）
    for (const s of S4SHARDS) { const dx = (s.cx - S4BD.R.x) * .22 * u + (hash(s.n, 4435) - .5) * 50 * u, dy = 320 * u * u + (hash(s.n, 4436) - .3) * -50 * u, rot = (hash(s.n, 4437) - .5) * 3 * u, al = 1 - sm(.35, .95, u);
      if (al <= 0) continue;
      c.save(); c.globalAlpha *= al; c.translate(s.cx + dx, s.cy + dy); c.rotate(rot); c.scale(1 - .3 * sm(0, 1, u), 1 - .3 * sm(0, 1, u)); c.translate(-s.cx, -s.cy);
      c.clip(polyPath(s.tr)); c.drawImage(bmp, 0, 0, W, H); c.restore();
      if (al > .2 && u < .7) { c.save(); c.globalAlpha *= al * .8; c.translate(s.cx + dx, s.cy + dy); c.rotate(rot); c.translate(-s.cx, -s.cy); c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 1.5; c.stroke(polyPath(s.tr)); c.restore(); } }
    for (let k = 0; k < 24; k++) { const a = hash(k, 4438) * TAU, sp = 60 + hash(k, 4439) * 120, x = S4BD.R.x + Math.cos(a) * sp * u * 1.2, y = S4BD.R.y + 40 + Math.sin(a) * sp * .4 * u + 380 * u * u; s4Bead(c, x, y, 3 + hash(k, 4441) * 4, 1 - sm(.35, .9, u)); }
  }

  // 左盘棋子：立起时全部摆着 → 蒙霜收起 → 成组的棋子复原（其余复原不出来）→ L6 圈上淡冰 → 整块飞走
  const lShow = sm(B.lIn[1] - .3, B.lIn[1], tau), lFrost = Math.sin(sm(B.lHide[0] - .1, B.lHide[1] + .35, tau, t => t) * Math.PI);
  const lItems = [];
  S4REAL.forEach((p, i) => { const [u, v] = s4Sq(p[1], p[2]), g = S4GROUP_OF[i]; let al = lShow, lift = 0, sy = 1;
    if (tau < B.lHide[1]) sy = lerp(1, .2, sm(B.lHide[0], B.lHide[1], tau));
    else { al = 0; if (g !== undefined) { const at = lerp(B.lBack[0], B.lBack[1], g / 3); al = sm(at, at + .3, tau); lift = (1 - sm(at, at + .35, tau, easeOutBack)) * 50; } }
    if (g !== undefined && tau >= s4LiftAt(g)) al = 0;   // 被整块搬走的交给组块画
    if (al > 0) lItems.push({ i, u, v, al: al * lA, lift, sy }); });
  S4GROUPS.forEach((G, g) => { if (tau < s4LiftAt(g)) s4DrawRing(c, S4RINGS[g], sm(lerp(B.rings[0], B.rings[1], g / 3), lerp(B.rings[0], B.rings[1], g / 3) + .3, tau) * lA); });
  s4DrawPieces(c, S4BD.L, S4REAL, lItems);
  if (lK > .5) s4Frost(c, S4BD.L, lFrost * lA);

  // 右盘棋子：立起时全部摆着 → 蒙霜 → 一颗颗冒出又滑走（只剩三颗）→ L7 重新摆好、四颗飞进冰格 → 碎掉时落下
  const rShow = sm(B.rIn[1] - .3, B.rIn[1], tau), rFrost = Math.sin(sm(B.rHide[0] - .1, B.rHide[1] + .35, tau, t => t) * Math.PI);
  const rItems = [];
  S4RAND.forEach((p, i) => { const [u, v] = s4Sq(p[1], p[2]); let al = rShow, du = 0, dv = 0, sy = 1;
    if (tau < B.rHide[1]) sy = lerp(1, .2, sm(B.rHide[0], B.rHide[1], tau));
    else if (tau < B.rBack[0]) { const at = lerp(B.rSlide[0], B.rSlide[1] - .5, i / 25), keep = S4KEEP.includes(i); al = sm(at, at + .15, tau);
      if (!keep) { const m = sm(at + .25, at + .9, tau, easeIn), a = hash(i, 4442) * TAU; du = Math.cos(a) * 3.5 * m; dv = Math.sin(a) * 3.5 * m; al *= 1 - sm(at + .45, at + .9, tau); } }
    else { const at = B.rBack[0] + (i / 25) * .35; al = sm(at, at + .2, tau);
      const j = S4SINGLE.indexOf(i); if (j >= 0 && tau >= B.singles[j]) al = 0; if (i === S4EXTRA && tau >= B.extra2) al = 0; }
    if (rShat) { const u2 = tau - B.shatter; al *= 1 - sm(0, .45, u2); dv += u2 * u2 * 5; }
    if (al > 0) rItems.push({ i, u: u + du, v: v + dv, al: al * rDim, sy }); });
  if (rIn > .01) s4DrawPieces(c, S4BD.R, S4RAND, rItems);
  if (rIn > .5 && !rShat) s4Frost(c, S4BD.R, rFrost);

  // 蜡封（实验）：盖在左盘右上角，跟着左盘走
  seal(c, 880, 410, 'exp', { k: sm(B.seal, B.seal + .55, tau, t => t), r: 24, al: lA * lIn, label: 'Chase & Simon 1973', labelSize: 19 });
  // 盘下「大师 / 新手」
  const tOff = 1 - sm(B.tallyOff[0], B.tallyOff[1], tau), tl = lOut * lDim * tOff, tr = rDim * tOff;
  if (tau >= B.master[0] - .1) s4Tally(c, S4BD.L, tau, [['大师', S4NGROUP, B.master[0], B.master[1], [4, 9, 13], tl], ['新手', 4, B.novice[0], B.novice[1], null, tl]]);
  if (tau >= B.rTally[0] - .1) s4Tally(c, S4BD.R, tau, [['大师', 4, B.rTally[0], B.rTally[1] - .2, null, tr], ['新手', 3, B.rTally[0] + .2, B.rTally[1], null, tr]]);

  // ---- 冰格：L2–L3、L6–L8 ----
  const cellK = Math.max(Math.min(sm(B.cells[0], B.cells[1], tau, easeOutBack), 1 - sm(B.cellsOff[0], B.cellsOff[1], tau)),
    Math.min(sm(B.cells2[0], B.cells2[1], tau, easeOutBack), 1 - sm(B.clear[0], B.clear[1], tau)));
  const { y: cy, s: cs, xs } = S4CELL;
  const chunkA = 1 - sm(B.chunkOut[0], B.chunkOut[1], tau);
  if (cellK > .001) {
    xs.forEach(x => pop(c, x, cy, cellK, () => s4CellBack(c, x, cy, cs, 1)));
    // 小冰珠：落进格子；L3 开头跳出去
    B.beads.forEach((t0, i) => { const [x1, y1] = [xs[i], cy + 18], u = sm(t0, t0 + .5, tau), out = sm(B.beadsOut, B.beadsOut + .55, tau, t => t);
      if (u > .999 && out <= 0) s4Bead(c, x1, y1, 24, cellK);
      else if (out > 0 && out < 1) s4Bead(c, x1 + (i - 1.5) * 40 * out, y1 - 110 * out + 300 * out * out, 24, (1 - out) * cellK); });
    // 大冰块：落在第一格
    if (tau >= B.block[1] && tau < B.cellsOff[1]) s4Block(c, xs[0], cy + 4, cs * .84, cellK);
    // L6：四个组块落在四格；L7 开头淡出
    S4GROUPS.forEach((G, g) => { const at = s4LiftAt(g); if (tau < at + .6 || chunkA <= 0) return; s4Chunk(c, g, 1, chunkA * cellK); });
    // L7：单颗棋子落在格里
    S4SINGLE.forEach((i, j) => { if (tau >= B.singles[j] + .5) { const t = S4RAND[i]; s4Piece(c, t[0], xs[j], cy + 44, 84, t[3], cellK, t[0] === 'n' && t[3] === 0); } });
    xs.forEach((x, i) => { const g1 = s4LiftAt(i) + .5, g2 = B.singles[i] + .45, glow = Math.max(win(g1, g1 + .5, tau, .2), win(g2, g2 + .5, tau, .2));
      pop(c, x, cy, cellK, () => s4CellFront(c, x, cy, cs, 1, glow)); });
  }

  // ---- 错题卡：L9 倒在页上，L10 飞成十二摞，段末沉下去 ----
  const cardsOut = 1 - sm(B.end[0], B.end[1], tau);
  if (tau >= B.pour[0] && cardsOut > 0) {
    const counts = new Array(S4NS).fill(0), flying = [];
    for (const k of S4CARD) {
      const t0 = lerp(B.pour[0], B.pour[1] - .45, k.t), fl0 = lerp(B.fly[0], B.fly[1] - .6, k.fly), u = sm(fl0, fl0 + .6, tau);
      if (u >= 1) { counts[k.s]++; continue; }
      if (u > 0) { const [sx, sy] = s4StackPos(k.s), ey = sy - 23 - k.j * 3; flying.push([lerp(k.x, sx, u), lerp(k.y, ey, u) - Math.sin(u * Math.PI) * 90, lerp(k.rot, 0, u), k]); continue; }
      const d = sm(t0, t0 + .45, tau, easeOut); if (d > 0) s4Card(c, k.x, k.y - 480 * (1 - d), k.rot + (1 - d) * 2, 1, Math.min(1, d * 3) * cardsOut, k.s * 20 + k.j, true);
    }
    s4Stacks(c, { al: cardsOut, rise: 1 - sm(B.end[0], B.end[1], tau), n: s => counts[s], tag: s => sm(B.tags + s * .04, B.tags + s * .04 + .4, tau) });
    for (const [x, y, r, k] of flying) s4Card(c, x, y, r, 1, 1, k.s * 20 + k.j, true);
  }

  // ---- 两人 ----
  s4Cast(c, tau, L);

  // ---- 飞行物（画在人物前面，都在上方走） ----
  if (cellK > .001) {
    const src = S4SRC;
    const glint = t0 => { const v = sm(t0 - .25, t0, tau); if (v > 0 && v < 1) sparkle(c, src[0], src[1], 18 * Math.sin(v * Math.PI), { color: '#ffffff' }); };
    B.beads.forEach((t0, i) => { glint(t0); const u = sm(t0, t0 + .5, tau); if (u <= 0 || u >= 1) return; const x1 = xs[i], y1 = cy + 18;
      s4Bead(c, lerp(src[0], x1, u), lerp(src[1], y1, u) - Math.sin(u * Math.PI) * 120, 24); });
    // 第五颗：撞到满了的格子弹飞
    { const t0 = B.extra, u = sm(t0, t0 + .4, tau, t => t), v = sm(t0 + .4, t0 + 1.1, tau, t => t); glint(t0);
      if (u > 0 && u < 1) s4Bead(c, lerp(src[0], xs[3] + 90, u), lerp(src[1], cy - 30, u) - Math.sin(u * Math.PI) * 100, 24);
      else if (u >= 1 && v < 1) s4Bead(c, xs[3] + 90 + 90 * v, cy - 30 - 80 * v + 600 * v * v, 24, 1 - v);
      if (u >= 1 && v < .3) sparkle(c, xs[3] + 70, cy - 40, 22 * (1 - v / .3), { color: '#ffffff' }); }
    // 大冰块：在琪露诺和冰格之间的空中冻成，缩小落进第一格
    const bf = sm(B.blockForm[0], B.blockForm[1], tau, t => t), bu = sm(B.block[0], B.block[1], tau), bx0 = 1250, by0 = 360;
    if (bf > 0 && bu < 1) s4Block(c, lerp(bx0, xs[0], bu), lerp(by0, cy + 4, bu) - Math.sin(bu * Math.PI) * 90, cs * lerp(1.8, .84, easeIO(bu)), 1, bf);
    if (bu >= 1 && tau < B.block[1] + .5) sparkle(c, xs[0] + 40, cy - 50, 26 * (1 - sm(B.block[1], B.block[1] + .5, tau)), { color: '#ffffff' });
    // L6：组块整块从左盘飞进冰格
    S4GROUPS.forEach((G, g) => { const at = s4LiftAt(g), u = sm(at, at + .6, tau); if (u > 0 && u < 1) s4Chunk(c, g, u, 1); });
    // L7：乱摆的棋子一颗一颗飞进冰格；第五颗弹飞
    S4SINGLE.forEach((i, j) => { const t0 = B.singles[j], u = sm(t0, t0 + .5, tau); if (u <= 0 || u >= 1) return; const [x0, y0, h0] = s4PieceAt(S4BD.R, S4RAND, i), t = S4RAND[i];
      s4Piece(c, t[0], lerp(x0, xs[j], u), lerp(y0, cy + 44, u) - Math.sin(u * Math.PI) * 120, lerp(h0, 84, u), t[3], 1, t[0] === 'n' && t[3] === 0); });
    { const t0 = B.extra2, u = sm(t0, t0 + .4, tau, t => t), v = sm(t0 + .4, t0 + 1.1, tau, t => t), [x0, y0, h0] = s4PieceAt(S4BD.R, S4RAND, S4EXTRA), t = S4RAND[S4EXTRA];
      if (u > 0 && u < 1) s4Piece(c, t[0], lerp(x0, xs[3] + 90, u), lerp(y0, cy, u) - Math.sin(u * Math.PI) * 100, lerp(h0, 80, u), t[3]);
      else if (u >= 1 && v < 1) s4Piece(c, t[0], xs[3] + 90 + 70 * v, cy - 80 * v + 520 * v * v, 80, t[3], 1 - v);
      if (u >= 1 && v < .3) sparkle(c, xs[3] + 70, cy - 40, 22 * (1 - v / .3), { color: '#ffffff' }); }
  }
}
// 第 g 组从左盘起飞的时刻
function s4LiftAt(g) { return lerp(S4B.lift[0], S4B.lift[1] - .6, g / 3); }
// 组块：左盘上那一组棋子连同冰圈，u 0..1 从盘上飞到第 g 个冰格（缩小）
function s4Chunk(c, g, u, al) {
  const pts = S4RINGS[g], G = S4GROUPS[g], { y: cy, xs } = S4CELL;
  const gx = pts.reduce((a, p) => a + p[0], 0) / pts.length, gy = pts.reduce((a, p) => a + p[1], 0) / pts.length - 20;
  const s = lerp(1, .42, u), x = lerp(gx, xs[g], u), y = lerp(gy, cy + 6, u) - Math.sin(u * Math.PI) * 60;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.scale(s, s); c.translate(-gx, -gy);
  s4DrawRing(c, pts, 1);
  s4DrawPieces(c, S4BD.L, S4REAL, G.map(i => { const [u2, v2] = s4Sq(S4REAL[i][1], S4REAL[i][2]); return { i, u: u2, v: v2, al: 1 }; }));
  c.restore();
}

scene({ order: 4, key: 'brain', title: '人脑', dur: S4DUR, lines: S4LINES, fn: s4Draw });
