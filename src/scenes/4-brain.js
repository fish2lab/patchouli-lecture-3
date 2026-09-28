'use strict';
// 第 4 段：人脑（冰棋盘）。段首、段末各 0.8 秒是标准画面（spread + 页眉 + 两人在 EP3 站位），中间：
//   L0 帕秋莉头顶浮出四个冰格（工作记忆），琪露诺一颗颗扔小冰珠进去，四颗就满，第五颗弹飞
//   L1 四颗珠子跳出去；一大块冻着一堆珠子的冰被扔进第一格，也放得下（小字 Cowan 2001）
//   L2 冰格收起；左页、右页各立起一盘斜看的冰棋盘（左：真实对局，右：乱摆），琪露诺飞到两盘中间看，
//      头顶五根冰凌一根根化掉（五秒），化完棋子隐去
//   L3 左盘棋子几颗几颗「冻」成组块（每组一圈淡冰）复原；盘下「大师」一排小棋子远多于「新手」；蜡封 exp + Chase & Simon 1973
//   L4 右盘棋子一颗颗冒出来又滑走，只剩三颗；盘下两排差不多长；小字 Gobet & Simon 1996
//   L5 左盘四个组块整块飞进重新浮出的四个冰格，一块占一格
//   L6 右盘裂开、碎成冰渣落下
//   L7 左盘和冰格收起；三百张错题卡哗地倒在右页上；琪露诺走到左页
//   L8 卡片按原因飞成十二摞，每摞顶上压一块写着原因的冰
//   L9 琪露诺头顶一枚问号冰晶，一根线连到「换元忘改上下限」那一摞
//   L10 帕秋莉对琪露诺讲，气泡里的话越说越短；蜡封 exp + 自我解释，Bisra 等 2018
//   L11 各摞依次一跳；那一摞摊开成十张错题卡，又合回一摞
//   段末：卡片摞沉下去，两人回到标准站位
// 节拍全部由台词时间推出；静态的棋盘先画进缓存图（按渲染缩放），右盘碎裂时按碎片裁剪这张图。
// 顶层名字一律带本段前缀 S4 / s4。
const S4LINES = seq(1.0, [
  '人脑也非压不可：一次只能抓住四样左右的东西。',
  ['但一样东西可以很大。', { hold: .8 }],
  ['让象棋大师看棋盘五秒钟再摆出来，', { pause: .2, hold: 1.1 }],
  ['真实对局他摆对的，是新手的好几倍。', { hold: .6 }],
  ['可棋子一乱摆，大师的优势几乎就没了。', { hold: .6 }],
  ['他记的是套路，几个棋子一个套路，只占一个位置。', { hold: .7 }],
  ['乱摆的棋盘就是噪声。噪声压缩不了，只能硬记。', { hold: .6 }],
  ['那我背三百道题……是在背噪声？', { who: 'cirno', mood: 'surprised', pause: .2, hold: .5 }],
  ['对。找出规律，也许只剩十几条。', { hold: 1.1 }],
  ['先问一句，这类题为什么这么做；', { hold: .3 }],
  ['再讲给别人听，讲不短，说明还没懂。', { hold: .8 }],
  ['最后，错题按原因归类。十道错题，常常是同一个原因。', { hold: .6 }],
]);
const S4T = i => S4LINES[i][0], S4E = i => S4LINES[i][1];
// S4W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S4W = (i, f) => { const v = voiceOf(S4LINES[i][2]), l = S4LINES[i], h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S4REST = .85;
const S4DUR = S4E(11) + 1.6 + S4REST;

// ===================== 节拍 =====================
const S4B = (() => { const T = S4T, E = S4E, w = S4W; return {
  cells: [w(0, .08), w(0, .3)], beads: [w(0, .4), w(0, .58), w(0, .74), w(0, .9)], extra: E(0) - .25,
  beadsOut: T(1) - .05, block: [T(1) + .25, w(1, 1) + .1], cowan: w(1, .5),
  cellsOff: [T(2) - .1, T(2) + .3],
  boards: [T(2) + .1, T(2) + .8], clock: [w(2, .35), E(2) - .35], hide: [E(2) - .35, E(2) - .05],
  left: [w(3, .05), w(3, .75)], seal1: w(3, .1), novice1: [w(3, .2), w(3, .9)],
  right: [w(4, .02), w(4, .6)], gobet: w(4, .7),
  cells2: [T(5) - .1, T(5) + .35], lift: [w(5, .25), w(5, .95)],
  crack: [w(6, .05), w(6, .38)], shatter: w(6, .42),
  clear: [T(7) - .2, T(7) + .45], pour: [T(7) + .2, T(7) + 1.6],
  fly: [w(8, .1), E(8) - .3], labels: E(8) - .45,
  ask: [T(9) + .1, E(9)], explain: [T(10), E(10) + .1], talk: [w(10, 0), w(10, .45), w(10, .8)], seal2: w(10, .1),
  hop: [w(11, .02), w(11, .38)], fan: [w(11, .45), w(11, .62)], fold: [w(11, .9), w(11, 1.02)],
  end: [E(11) + .05, E(11) + .9], ret: [E(11) + .1, S4DUR - S4REST - .05],
}; })();

// ===================== 冰格（工作记忆） =====================
const S4CELL = { y: 240, s: 110, xs: [420, 560, 700, 840], d: 22 };   // 前面那一面的中心 y、边长、四格中心 x、斜看的纵深
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
// 一大块冻在一起的冰：立方体，里面冻着 4×3 颗珠子
function s4Block(c, x, y, s, al = 1) {
  if (al <= 0) return; const h = s / 2, d = s * .2;
  c.save(); c.globalAlpha *= al;
  s4IceFace(c, [[x - h, y - h], [x - h + d, y - h - d], [x + h + d, y - h - d], [x + h, y - h]], EP2_FROST, .9);
  s4IceFace(c, [[x + h, y - h], [x + h + d, y - h - d], [x + h + d, y + h - d], [x + h, y + h]], EP2_ICE_DEEP, .9);
  s4IceFace(c, rectPts(x - h, y - h, s, s), EP2_ICE, .92);
  for (let i = 0; i < 12; i++) s4Bead(c, x - h + s * (.18 + (i % 4) * .215), y - h + s * (.24 + Math.floor(i / 4) * .26) + (i % 2) * s * .04, s * .075, .9);
  s4IceFace(c, rectPts(x - h, y - h, s, s), EP2_FROST, .18);
  c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.stroke(polyPath(rectPts(x - h, y - h, s, s)));
  c.restore();
}

// ===================== 冰棋盘（斜看） =====================
const S4F = 1600, S4PS = .8, S4FY = .52;
const S4BD = { L: { x: 560, y: 580, q: 54, id: 'L' }, R: { x: 1360, y: 580, q: 54, id: 'R' } };
// 棋盘坐标 (u, v)：u 0..8 从 a 列到 h 列，v 0..8 从远（第 8 行）到近（第 1 行）；h 是离开盘面的高度
function s4Pt(B, u, v, h = 0) { const X = (u - 4) * B.q, Z = (v - 4) * B.q, k = S4F / (S4F - Z * S4PS); return [B.x + X * k, B.y + Z * S4FY * k - h * k, k]; }
const s4Sq = (f, r) => [f + .5, 8 - r + .5];   // f 0..7，r 1..8 → 格子中心的 (u, v)
const S4BMP = new Map();
function s4BoardBmp(B, sc) {
  const id = B.id + '|' + sc; let cv = S4BMP.get(id); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
  const g = cv.getContext('2d'); g.setTransform(sc, 0, 0, sc, 0, 0);
  const P4 = (u, v, h) => { const p = s4Pt(B, u, v, h); return [p[0], p[1]]; }, th = 22;
  const top = [P4(-.25, -.25), P4(8.25, -.25), P4(8.25, 8.25), P4(-.25, 8.25)];
  // 落在书页上的影子、冰板的厚度（近边和两侧）
  g.save(); g.shadowColor = 'rgba(40,30,40,.35)'; g.shadowBlur = 22; g.shadowOffsetY = 14; g.fillStyle = alpha(EP2_ICE_DEEP, .9);
  g.fill(polyPath([top[0], top[1], top[2], [top[2][0], top[2][1] + th], [top[3][0], top[3][1] + th], top[3]])); g.restore();
  g.fillStyle = mix(EP2_ICE_DEEP, '#6f96b3', .35); g.fill(polyPath([top[3], top[2], [top[2][0], top[2][1] + th], [top[3][0], top[3][1] + th]]));
  g.fillStyle = alpha('#ffffff', .35); g.fillRect(top[3][0], top[3][1] + 3, top[2][0] - top[3][0], 2);
  g.fillStyle = EP2_ICE; g.fill(polyPath(top));
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) if ((f + r) % 2 === 0) {
    g.fillStyle = alpha(EP2_ICE_DEEP, .75); g.fill(polyPath([P4(f, r), P4(f + 1, r), P4(f + 1, r + 1), P4(f, r + 1)])); }
  g.strokeStyle = alpha(EP2_FROST, .95); g.lineWidth = 2.5; g.stroke(polyPath([P4(0, 0), P4(8, 0), P4(8, 8), P4(0, 8)]));
  g.strokeStyle = alpha('#ffffff', .9); g.lineWidth = 2; g.stroke(polyPath(top));
  // 冰面上几道斜的反光
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
// 兵头是一个圆：补在 p 的轮廓后面
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
// 真实对局：意大利开局走了十几步，双方王车易位，王前兵链（f/g/h 兵 + 王 + 车）；26 子
const S4REAL = [
  ['k', 6, 1, 1], ['r', 5, 1, 1], ['r', 0, 1, 1], ['q', 4, 2, 1], ['n', 5, 3, 1], ['b', 1, 3, 1], ['p', 0, 2, 1], ['p', 1, 2, 1], ['p', 2, 3, 1], ['p', 5, 2, 1], ['p', 6, 2, 1], ['p', 7, 2, 1], ['p', 4, 4, 1],
  ['k', 6, 8, 0], ['r', 5, 8, 0], ['r', 0, 8, 0], ['q', 4, 7, 0], ['n', 5, 6, 0], ['b', 3, 6, 0], ['p', 0, 7, 0], ['p', 1, 7, 0], ['p', 2, 6, 0], ['p', 5, 7, 0], ['p', 6, 7, 0], ['p', 7, 7, 0], ['p', 4, 5, 0],
];
// 组块：几颗棋子一个套路（白王城堡、黑王城堡、白后翼兵链、黑后翼兵链）；其余棋子复原不出来
const S4GROUPS = [[0, 1, 9, 10, 11], [13, 14, 22, 23, 24], [2, 6, 7, 8], [15, 19, 20, 21]];
const S4GROUP_OF = (() => { const g = {}; S4GROUPS.forEach((G, j) => G.forEach(i => g[i] = j)); return g; })();
// 乱摆：同样 26 颗子，随机格子（确定性的）
const S4RAND = (() => { const sq = Array.from({ length: 64 }, (_, i) => i), r = rng(4420);
  for (let i = 63; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [sq[i], sq[j]] = [sq[j], sq[i]]; }
  return S4REAL.map(([t, , , w], i) => [t, sq[i] % 8, 1 + Math.floor(sq[i] / 8), w]); })();
const S4KEEP = [3, 11, 17];   // 乱摆盘上复原对的那三颗
const S4PH = { k: 64, q: 62, b: 58, n: 58, r: 56, p: 50 };   // 各棋子高（像素，k = 1 时）

// 冰圈：棋盘平面上围住一组格子的圆角框（投影成多边形）
function s4Ring(B, G, pos) {
  let u0 = 9, u1 = -1, v0 = 9, v1 = -1; for (const i of G) { const [u, v] = s4Sq(pos[i][1], pos[i][2]); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, ru = (u1 - u0) / 2 + .62, rv = (v1 - v0) / 2 + .62, pts = [];
  for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, ca = Math.cos(a), sa = Math.sin(a); const p = s4Pt(B, cu + ru * Math.sign(ca) * Math.pow(Math.abs(ca), .45), cv + rv * Math.sign(sa) * Math.pow(Math.abs(sa), .45)); pts.push([p[0], p[1]]); }
  return pts;
}
function s4DrawRing(c, pts, al) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al;
  c.fillStyle = alpha(EP2_FROST, .55); c.fill(polyPath(pts)); c.strokeStyle = alpha('#ffffff', .95); c.lineWidth = 3; c.stroke(polyPath(pts));
  c.strokeStyle = alpha('#7ea6c2', .6); c.lineWidth = 1.5; c.stroke(polyPath(pts.map(([x, y]) => [x + 1.5, y + 2])));
  c.restore();
}
// 画一盘棋：items = [{ i, u, v, al, lift }]（按远到近排好）
function s4DrawPieces(c, B, pos, items) {
  for (const it of items.slice().sort((a, b) => a.v - b.v)) { const [t, , , w] = pos[it.i], [x, y, k] = s4Pt(B, it.u, it.v, it.lift || 0);
    s4Piece(c, t, x, y, S4PH[t] * k * (it.sy ?? 1), w, it.al, t === 'n' && w === 0); }
}
// 碎片：把右盘的屏幕四边形切成 5×4 块带抖动的三角形
const S4SHARDS = (() => { const B = S4BD.R, nu = 5, nv = 4, grid = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const edge = i === 0 || j === 0 || i === nu || j === nv, ju = edge && (i === 0 || i === nu) ? 0 : (hash(i * 7 + j, 4430) - .5) * .9, jv = edge && (j === 0 || j === nv) ? 0 : (hash(i * 5 + j * 3, 4431) - .5) * .9;
    const u = -.25 + 8.5 * i / nu + ju, v = -.25 + 8.5 * j / nv + jv, p = s4Pt(B, u, v); grid.push([p[0], p[1]]); }
  const g = (i, j) => grid[j * (nu + 1) + i], out = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = g(i, j), b = g(i + 1, j), c2 = g(i + 1, j + 1), d = g(i, j + 1);
    const tris = (i + j) % 2 ? [[a, b, c2], [a, c2, d]] : [[a, b, d], [b, c2, d]];
    for (const tr of tris) { const cx = (tr[0][0] + tr[1][0] + tr[2][0]) / 3, cy = (tr[0][1] + tr[1][1] + tr[2][1]) / 3; out.push({ tr: tr.map(p => [p[0], p[1] + (p[1] > B.y + 100 ? 22 : 0)]), cx, cy, n: out.length }); } }
  return out; })();

// 盘下的计数：大师 / 新手各一排小棋子（只画「好几倍」，不写数）
function s4Tally(c, B, tau, rows) {
  const x0 = B.x - 250;
  rows.forEach(([name, n, t0, t1, gaps, al], r) => { if (al <= 0) return; const y = 785 + r * 50;
    c.save(); c.globalAlpha *= al;
    c.fillStyle = r ? P.g2 : P.ink2; c.beginPath(); c.arc(x0, y - 26, 9, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x0, y - 4, 15, 12, 0, Math.PI, TAU); c.fill();
    zh(c, name, x0 + 24, y - 4, { size: 24, color: P.ink2 });
    let x = x0 + 86;
    for (let k = 0; k < n; k++) { const at = lerp(t0, t1, n > 1 ? k / (n - 1) : 0), a = sm(at, at + .2, tau); if (gaps && gaps.includes(k)) x += 10;
      if (a > 0) s4Piece(c, 'p', x, y + 2 - 8 * (1 - a), 30, !!r, a); x += 17; }
    c.restore(); });
}

// ===================== 冰凌倒数（五秒） =====================
function s4Clock(c, tau) {
  const B = S4B, a = Math.min(sm(B.boards[0], B.boards[1], tau), 1 - sm(B.hide[1], B.hide[1] + .3, tau)); if (a <= 0) return;
  const x0 = CX - 110, y0 = 150, u = clamp((tau - B.clock[0]) / (B.clock[1] - B.clock[0]), 0, 1) * 5;
  c.save(); c.globalAlpha *= a;
  cutPaper(c, rectPts(x0 - 10, y0 - 16, 240, 18, 6), EP2_ICE_DEEP, { seed: 4440, step: 10, blur: 3, grain: .04 });
  for (let i = 0; i < 5; i++) { const m = clamp(u - i, 0, 1), L = 78 * (1 - m), x = x0 + 22 + i * 44;
    if (L > 2) { c.fillStyle = alpha(EP2_ICE, .95); c.fill(polyPath([[x - 11, y0], [x + 11, y0], [x + 1, y0 + L], [x - 1, y0 + L]]));
      c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 5, y0 + 4); c.lineTo(x - 1, y0 + L * .7); c.stroke(); }
    if (m > .05 && m < 1) { const dy = 78 * m + 60 * m * m; s4Bead(c, x, y0 + dy, 5, 1 - m); }
    else if (m >= 1) { const since = tau - (B.clock[0] + (i + 1) / 5 * (B.clock[1] - B.clock[0])); if (since < .5) s4Bead(c, x, y0 + 138 + since * 200, 5, 1 - since * 2); }
  }
  c.restore();
}

// ===================== 错题卡 =====================
const S4LABELS = ['单位没换', '审题漏条件', '符号抄错', '公式记混', '分类没讨论全', '换元忘改上下限', '定义域忘了', '看错所求', '计算跳步', '没画图', '正负号搞反', '边界没验证'];
const S4HOT = 5;   // 「为什么」「讲给别人听」「十道错题」都落在这一摞
const S4NC = 144, S4PER = S4NC / 12;
const s4StackPos = s => [1090 + (s % 4) * 190, 380 + Math.floor(s / 4) * 210];
const S4CARD = Array.from({ length: S4NC }, (_, i) => ({ x: 1080 + hash(i, 4450) * 640, y: 640 + hash(i, 4451) * 210, rot: (hash(i, 4452) - .5) * 1.6,
  t: i / S4NC, s: i % 12, j: Math.floor(i / 12), fly: hash(i, 4453) }));
function s4Card(c, x, y, rot, s = 1, al = 1, seed = 0, mark = true) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = 'rgba(30,25,35,.22)'; c.fillRect(-30, -20, 64, 46);
  c.fillStyle = '#f6f1e6'; c.fillRect(-32, -23, 64, 46); c.strokeStyle = alpha(P.paperEdge, .9); c.lineWidth = 1; c.strokeRect(-32, -23, 64, 46);
  c.fillStyle = alpha(P.ink2, .5); for (let k = 0; k < 3; k++) c.fillRect(-25, -14 + k * 11, 26 + hash(k, seed) * 20, 2.5);
  if (mark) { c.strokeStyle = alpha(P.red, .85); c.lineWidth = 3; c.beginPath(); c.moveTo(16, -12); c.lineTo(26, -2); c.moveTo(26, -12); c.lineTo(16, -2); c.stroke(); }
  c.restore();
}
// 一摞：n 张卡叠起来；label 冰块压在顶上（lab 0..1）
function s4Stack(c, s, n, lab, al = 1, lift = 0) {
  if (al <= 0 || n <= 0) return; const [x, y0] = s4StackPos(s), y = y0 - lift;
  c.save(); c.globalAlpha *= al;
  for (let k = 0; k < n; k++) s4Card(c, x + (hash(k, 4460 + s) - .5) * 6, y - 23 - k * 3, (hash(k, 4461 + s) - .5) * .12, 1, 1, s * 20 + k, k === n - 1);
  if (lab > 0) { const top = y - 46 - n * 3 + 4, k = easeOutBack(lab), w = 176, h = 40, d = 8, dy = (1 - k) * -40;
    c.save(); c.globalAlpha *= clamp(lab * 2, 0, 1); c.translate(0, dy);
    s4IceFace(c, [[x - w / 2, top - h], [x - w / 2 + d, top - h - d], [x + w / 2 + d, top - h - d], [x + w / 2, top - h]], EP2_FROST, .95);
    s4IceFace(c, [[x + w / 2, top - h], [x + w / 2 + d, top - h - d], [x + w / 2 + d, top - d], [x + w / 2, top]], EP2_ICE_DEEP, .95);
    s4IceFace(c, rectPts(x - w / 2, top - h, w, h), EP2_ICE, .95);
    c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.strokeRect(x - w / 2, top - h, w, h);
    zh(c, S4LABELS[s], x, top - h / 2 + 1, { size: S4LABELS[s].length > 6 ? 21 : 24, color: P.ink, align: 'center', base: 'middle' });
    c.restore(); }
  c.restore();
}

// ===================== 问号冰晶、讲解气泡 =====================
function s4Crystal(c, x, y, r, al, t) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(Math.sin(t * 1.3) * .05);
  const hex = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU - Math.PI / 2; hex.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU - Math.PI / 2; rline(c, [[Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3]], { w: 4, color: alpha(EP2_ICE_DEEP, .9), seed: 4470 + k }); }
  cutPaper(c, hex, EP2_ICE, { seed: 4471, step: 10, blur: 4, grain: .04 });
  c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.stroke(polyPath(hex.map(([a, b]) => [a * .8, b * .8])));
  zh(c, '？', 0, r * .36, { size: r * 1.05, color: '#5f86a6', align: 'center' });
  c.restore();
}
const S4TALK = ['因为换元以后，积分变量变成了新的那个，所以上下限也得换成新变量的范围，不然……', '换元后，上下限跟着新变量换。', '换元，就换上下限。'];
function s4Explain(c, tau) {
  const B = S4B, a = Math.min(sm(B.explain[0], B.explain[0] + .3, tau), 1 - sm(B.explain[1] - .2, B.explain[1] + .2, tau)); if (a <= 0) return;
  const idx = tau < B.talk[1] ? 0 : tau < B.talk[2] ? 1 : 2, t0 = B.talk[idx], txt = S4TALK[idx], size = 32;
  const lines = wrapText(c, txt, 500, size), bw = Math.min(560, Math.max(...lines.map(l => zhWidth(c, l, size))) + 60), bh = lines.length * 44 + 36;
  const shrink = idx > 0 ? easeOutBack(sm(t0, t0 + .35, tau)) : 1, bx = 360, by = 330 - bh;
  c.save(); c.globalAlpha *= a;
  bubble(c, bx, by, bw, bh, { tail: [318, 405], fill: '#f7f3ea', seed: 4480 + idx, w: 3 });
  c.save(); c.globalAlpha *= clamp(shrink, 0, 1);
  lines.forEach((l, k) => zh(c, l, bx + 30, by + 50 + k * 44, { size, color: P.ink, p: writeP(tau, t0 + .05, txt, .025) * lines.length - k }));
  c.restore();
  // 旧的长句被划掉、飘走的一小截：越说越短
  if (idx > 0) { const old = S4TALK[idx - 1], u = sm(t0, t0 + .5, tau); if (u < 1) zh(c, old.slice(0, 12) + '…', bx + 30, by - 20 - u * 40, { size: 24, color: P.g2, al: 1 - u }); }
  seal(c, bx + bw + 4, by - 6, 'exp', { k: sm(B.seal2, B.seal2 + .55, tau, t => t), r: 24 });
  zh(c, '自我解释，Bisra 等 2018', bx + bw - 14, by - 22, { size: 22, color: P.ink2, align: 'right', al: sm(B.seal2 + .3, B.seal2 + .7, tau) });
  c.restore();
}

// ===================== 两人走位 =====================
function s4Cast(c, tau, L) {
  const B = S4B, T = S4T, E = S4E, w = S4W;
  const px = key(tau, [[B.cellsOff[0], 330], [B.cellsOff[0] + 1.1, 170], [T(7), 170], [T(7) + 1.1, 250], [B.ret[0], 250], [B.ret[1] - .2, EP3.pch.x]]);
  const pWalk = Math.abs(key(tau + .05, [[B.cellsOff[0], 330], [B.cellsOff[0] + 1.1, 170], [T(7), 170], [T(7) + 1.1, 250], [B.ret[0], 250], [B.ret[1] - .2, EP3.pch.x]]) - px) > .3;
  let pPose = 'lecture', pMood, pGest = null;
  if (tau >= T(2) && tau < T(7)) { pPose = 'point'; }
  if (tau >= T(7) && tau < T(8)) { pPose = 'cross'; pMood = 'smug'; }
  if (tau >= T(11) && tau < B.end[0]) pPose = 'point';
  if (pWalk) pPose = 'stand';
  const pBob = pWalk ? -Math.abs(Math.sin(twos(tau) * 9)) * 8 : 0;
  drawPatchouli(c, { ...EP3.pch, x: px, y: EP3.pch.y + pBob, pose: pPose, gesture: pGest, mood: moodOf(L, 'patchouli', pMood || 'normal'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });

  // 琪露诺：右页扔珠子 → 飞到两盘中间 → 走到左页 → 回右页
  const flyTo = [T(2) - .1, T(2) + 1.0], back = [B.ret[0] + .1, B.ret[1] - .15];
  const cxK = [[flyTo[0], EP3.cir.x], [flyTo[1], CX], [T(7) + .1, CX], [T(7) + 1.1, 760], [back[0], 760], [back[1], EP3.cir.x]];
  const cx = key(tau, cxK), moving = Math.abs(key(tau + .05, cxK) - cx) > .3;
  let pose = 'stand', facing = -1, gest = null, mood = 'normal', look = 0;
  if (tau >= B.beads[0] - .3 && tau < B.extra + .4) { pose = 'point'; gest = .5 + .5 * Math.sin(twos(tau) * 6); }
  if (tau >= T(1) && tau < B.block[0] + .5) { pose = 'throw'; gest = sm(T(1), B.block[0], tau) - sm(B.block[0], B.block[0] + .35, tau) * .0; }
  if (tau >= B.block[0] + .5 && tau < T(2)) { pose = 'proud'; mood = 'proud'; }
  if (tau >= flyTo[1] && tau < T(3)) { pose = 'think'; mood = 'normal'; }
  if (tau >= T(3) && tau < T(4)) { pose = 'point'; facing = -1; gest = .8; mood = 'happy'; }
  if (tau >= T(4) && tau < T(5)) { pose = 'point'; facing = 1; gest = .8; mood = 'confused'; }
  if (tau >= T(5) && tau < T(6)) { pose = 'stand'; facing = -1; look = .6; }
  if (tau >= T(6) && tau < T(7)) { pose = 'slump'; facing = 1; mood = tau > B.shatter ? 'surprised' : 'confused'; }
  if (tau >= T(7) + 1.1 && tau < T(8)) { pose = 'stand'; facing = -1; }
  if (tau >= T(8) && tau < T(9)) { pose = 'stand'; facing = 1; mood = 'surprised'; }
  if (tau >= T(9) && tau < T(10)) { pose = 'think'; facing = 1; mood = 'confused'; }
  if (tau >= T(10) && tau < T(11)) { pose = 'stand'; facing = -1; mood = tau > B.talk[2] ? 'happy' : 'normal'; }
  if (tau >= T(11) && tau < B.end[0]) { pose = 'point'; facing = 1; gest = .7; mood = 'happy'; }
  if (moving) { pose = 'fly'; facing = key(tau + .05, cxK) > cx ? 1 : -1; }
  if (tau >= B.ret[1] - .1) { pose = 'stand'; facing = -1; mood = 'normal'; }
  if (tau < B.beads[0] - .3) { pose = 'stand'; facing = -1; }
  const hover = moving ? Math.sin(sm(0, 1, clamp((tau - (tau < T(5) ? flyTo[0] : tau < B.ret[0] ? T(7) + .1 : back[0])) / 1.0, 0, 1)) * Math.PI) * 60 : 0;
  return drawCirno(c, { ...EP3.cir, x: cx, y: EP3.cir.y - hover, facing, pose, gesture: gest, look, mood: moodOf(L, 'cirno', mood), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

// ===================== 主画面 =====================
function s4Draw(c, tau, L) {
  const B = S4B, T = S4T, E = S4E, sc = c.getTransform().a || 1;
  spread(c, tau);
  pageHeader(c, '第四页 · 人脑', tau, .9);

  // ---- 两盘冰棋 ----
  const bIn = sm(B.boards[0], B.boards[1], tau, easeOutBack), lOut = 1 - sm(B.clear[0], B.clear[1], tau);
  const rShat = tau >= B.shatter;
  const drawBoardImg = (bd, k, al) => { if (k <= .001 || al <= 0) return; const fy = bd.y + 150;
    c.save(); c.globalAlpha *= al; c.translate(0, fy); c.scale(1, k); c.translate(0, -fy); c.drawImage(s4BoardBmp(bd, sc), 0, 0, W, H); c.restore(); };
  drawBoardImg(S4BD.L, bIn * lOut, lOut);
  // 右盘：裂纹 → 碎成冰渣落下
  if (!rShat) { drawBoardImg(S4BD.R, bIn, 1);
    const cr = sm(B.crack[0], B.crack[1], tau, t => t);
    if (cr > 0) for (const s of S4SHARDS) { if (hash(s.n, 4432) > .55) continue; rline(c, s.tr, { w: 2, color: alpha('#ffffff', .95), p: cr, close: true, seed: 4433 + s.n, amp: .5 }); rline(c, s.tr, { w: 1, color: alpha('#5f86a6', .7), p: cr * .9, close: true, seed: 4434 + s.n, amp: .5 }); }
  } else { const u = tau - B.shatter, bmp = s4BoardBmp(S4BD.R, sc);
    for (const s of S4SHARDS) { const dx = (s.cx - S4BD.R.x) * .6 * u + (hash(s.n, 4435) - .5) * 80 * u, dy = 300 * u * u + (hash(s.n, 4436) - .3) * -60 * u, rot = (hash(s.n, 4437) - .5) * 3 * u, al = 1 - sm(.5, 1.3, u);
      if (al <= 0) continue;
      c.save(); c.globalAlpha *= al; c.translate(s.cx + dx, s.cy + dy); c.rotate(rot); c.scale(1 - .3 * sm(0, 1.2, u), 1 - .3 * sm(0, 1.2, u)); c.translate(-s.cx, -s.cy);
      c.clip(polyPath(s.tr)); c.drawImage(bmp, 0, 0, W, H); c.restore();
      if (al > .2 && u < .8) { c.save(); c.globalAlpha *= al * .8; c.translate(s.cx + dx, s.cy + dy); c.rotate(rot); c.translate(-s.cx, -s.cy); c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 1.5; c.stroke(polyPath(s.tr)); c.restore(); } }
    // 几粒冰渣
    for (let k = 0; k < 26; k++) { const a = hash(k, 4438) * TAU, sp = 120 + hash(k, 4439) * 220, x = S4BD.R.x + Math.cos(a) * sp * u * 1.2, y = S4BD.R.y + 40 + Math.sin(a) * sp * .4 * u + 420 * u * u; s4Bead(c, x, y, 3 + hash(k, 4441) * 4, 1 - sm(.4, 1.1, u)); }
  }

  // 棋子：看五秒（全部立着）→ 隐去 → 左盘按组块复原 / 右盘一颗颗冒出又滑走
  const show = Math.min(sm(B.boards[1] - .3, B.boards[1] + .1, tau), 1 - sm(B.hide[0], B.hide[1], tau));
  const lItems = [], rItems = [];
  S4REAL.forEach((p, i) => { const [u, v] = s4Sq(p[1], p[2]); let al = show, lift = 0, sy = 1;
    if (tau >= B.hide[1]) { const g = S4GROUP_OF[i]; al = 0;
      if (g !== undefined) { const at = lerp(B.left[0], B.left[1], g / 3); al = sm(at, at + .3, tau); lift = (1 - sm(at, at + .35, tau, easeOutBack)) * 60; } }
    sy = tau < B.hide[1] ? lerp(1, .2, sm(B.hide[0], B.hide[1], tau)) : 1;
    const g = S4GROUP_OF[i]; if (g !== undefined && tau >= B.lift[0]) al = 0;   // 被整块搬走的交给组块画
    if (al > 0) lItems.push({ i, u, v, al: al * lOut, lift, sy }); });
  S4RAND.forEach((p, i) => { const [u, v] = s4Sq(p[1], p[2]); let al = show, du = 0, dv = 0, sy = 1;
    if (tau < B.hide[1]) sy = lerp(1, .2, sm(B.hide[0], B.hide[1], tau));
    else { const at = lerp(B.right[0], B.right[1], i / 25), keep = S4KEEP.includes(i); al = sm(at, at + .15, tau);
      if (!keep) { const m = sm(at + .3, at + 1.1, tau, easeIn), a = hash(i, 4442) * TAU; du = Math.cos(a) * 5 * m; dv = Math.sin(a) * 5 * m; al *= 1 - sm(at + .55, at + 1.1, tau); } }
    if (rShat) { const u2 = tau - B.shatter; al *= 1 - sm(0, .5, u2); dv += u2 * u2 * 6; }
    if (al > 0) rItems.push({ i, u: u + du, v: v + dv, al, sy }); });
  // 左盘组块的淡冰圈（L3 出现，L5 跟着组块飞走）
  const ringPts = S4GROUPS.map(G => s4Ring(S4BD.L, G, S4REAL));
  S4GROUPS.forEach((G, g) => { const at = lerp(B.left[0], B.left[1], g / 3); if (tau < B.lift[0]) s4DrawRing(c, ringPts[g], sm(at + .1, at + .45, tau) * lOut); });
  s4DrawPieces(c, S4BD.L, S4REAL, lItems);
  s4DrawPieces(c, S4BD.R, S4RAND, rItems);
  // 冰面罩一下：五秒到了
  if (tau > B.hide[0] - .1 && tau < B.hide[1] + .5) { const a = Math.sin(clamp((tau - B.hide[0] + .1) / (B.hide[1] - B.hide[0] + .6), 0, 1) * Math.PI) * .6;
    for (const bd of [S4BD.L, S4BD.R]) { const q = [s4Pt(bd, -.25, -.25), s4Pt(bd, 8.25, -.25), s4Pt(bd, 8.25, 8.25), s4Pt(bd, -.25, 8.25)].map(p => [p[0], p[1] - 30]); c.fillStyle = alpha(EP2_FROST, a); c.fill(polyPath(q)); } }

  // 蜡封 + 出处小字
  const lNote = Math.min(sm(B.seal1 + .3, B.seal1 + .7, tau), lOut);
  seal(c, 800, 380, 'exp', { k: sm(B.seal1, B.seal1 + .55, tau, t => t), r: 24, al: lOut });
  zh(c, 'Chase & Simon 1973', 770, 390, { size: 22, color: P.ink2, align: 'right', al: lNote });
  zh(c, 'Gobet & Simon 1996：乱摆时大师只略好', S4BD.R.x, 395, { size: 22, color: P.ink2, align: 'center', al: sm(B.gobet, B.gobet + .4, tau) * (1 - sm(B.shatter - .2, B.shatter + .3, tau)) });
  // 盘下「大师 / 新手」
  const tl = lOut * sm(B.left[0] - .2, B.left[0] + .2, tau), tr = sm(B.right[0] - .2, B.right[0] + .2, tau) * (1 - sm(B.shatter - .2, B.shatter + .4, tau));
  s4Tally(c, S4BD.L, tau, [['大师', 18, B.left[0] + .1, B.left[1] + .2, [5, 10, 14], tl], ['新手', 4, B.novice1[0], B.novice1[1], null, tl]]);
  s4Tally(c, S4BD.R, tau, [['大师', 4, B.right[0] + .3, B.right[1] + .3, null, tr], ['新手', 3, B.right[0] + .5, B.right[1] + .2, null, tr]]);

  // ---- 冰格：L0–L1、L5 ----
  const cellK = Math.max(Math.min(sm(B.cells[0], B.cells[1], tau, easeOutBack), 1 - sm(B.cellsOff[0], B.cellsOff[1], tau)), Math.min(sm(B.cells2[0], B.cells2[1], tau, easeOutBack), lOut));
  const { y: cy, s: cs, xs } = S4CELL;
  if (cellK > .001) {
    xs.forEach((x, i) => pop(c, x, cy, cellK, () => s4CellBack(c, x, cy, cs, 1)));
    // 小冰珠：落进格子；L1 开头跳出去
    B.beads.forEach((t0, i) => { const [x1, y1] = [xs[i], cy + 18], u = sm(t0, t0 + .45, tau), out = sm(B.beadsOut, B.beadsOut + .55, tau, t => t);
      if (u > .999 && out <= 0) s4Bead(c, x1, y1, 24, cellK);
      else if (out > 0 && out < 1) s4Bead(c, x1 + (i - 1.5) * 50 * out, y1 - 120 * out + 380 * out * out, 24, (1 - out) * cellK); });
    // 一大块冰：塞进第一格
    const bu = sm(B.block[0], B.block[1], tau);
    if (bu >= 1 && tau < B.cellsOff[1]) s4Block(c, xs[0], cy + 4, cs * .84, cellK);
    // L5：左盘四个组块整块飞进四格
    if (tau >= B.lift[0]) S4GROUPS.forEach((G, g) => {
      const at = lerp(B.lift[0], B.lift[1] - .5, g / 3), u = sm(at, at + .55, tau), pts = ringPts[g];
      const gx = pts.reduce((a, p) => a + p[0], 0) / pts.length, gy = pts.reduce((a, p) => a + p[1], 0) / pts.length - 20;
      const tx = xs[g], ty = cy + 6, s = lerp(1, .42, u), x = lerp(gx, tx, u), y = lerp(gy, ty, u) - Math.sin(u * Math.PI) * 60;
      c.save(); c.globalAlpha *= lOut; c.translate(x, y); c.scale(s, s); c.translate(-gx, -gy);
      s4DrawRing(c, pts, 1);
      s4DrawPieces(c, S4BD.L, S4REAL, G.map(i => { const [u2, v2] = s4Sq(S4REAL[i][1], S4REAL[i][2]); return { i, u: u2, v: v2, al: 1 }; }));
      c.restore(); });
    xs.forEach((x, i) => { const land = tau >= B.lift[0] ? sm(lerp(B.lift[0], B.lift[1] - .5, i / 3) + .45, lerp(B.lift[0], B.lift[1] - .5, i / 3) + .8, tau) : 0;
      pop(c, x, cy, cellK, () => s4CellFront(c, x, cy, cs, 1, Math.sin(land * Math.PI))); });
    zh(c, 'Cowan 2001：一次约四样', 560, cy + 100, { size: 22, color: P.ink2, align: 'center', al: sm(B.cowan, B.cowan + .4, tau) * (1 - sm(B.cellsOff[0], B.cellsOff[0] + .3, tau)) });
  }

  // ---- 错题卡 ----
  const cardsOut = 1 - sm(B.end[0], B.end[1], tau);
  const hotLift = tau >= B.ask[0] && tau < B.end[0] ? 10 * sm(B.ask[0], B.ask[0] + .4, tau) : 0;
  if (tau >= B.pour[0] && cardsOut > 0) {
    const counts = new Array(12).fill(0), flying = [];
    for (const k of S4CARD) {
      const t0 = lerp(B.pour[0], B.pour[1] - .45, k.t), fl0 = lerp(B.fly[0], B.fly[1] - .6, k.fly), u = sm(fl0, fl0 + .6, tau);
      if (u >= 1) { counts[k.s]++; continue; }
      if (u > 0) { const [sx, sy] = s4StackPos(k.s), ey = sy - 23 - k.j * 3; flying.push([lerp(k.x, sx, u), lerp(k.y, ey, u) - Math.sin(u * Math.PI) * 140, lerp(k.rot, 0, u), k]); continue; }
      const d = sm(t0, t0 + .45, tau, easeOut); if (d > 0) s4Card(c, k.x, k.y - 520 * (1 - d), k.rot + (1 - d) * 2, 1, Math.min(1, d * 3), k.s * 20 + k.j, true);
    }
    // 摞：L9 起「换元」那摞抬一点，其余淡一点；L11 各摞依次一跳
    for (let s = 0; s < 12; s++) { const hot = s === S4HOT, dim = tau >= B.ask[0] && tau < B.hop[0] && !hot ? .55 : 1;
      const hs = lerp(B.hop[0], B.hop[1], s / 11), hop = Math.sin(sm(hs, hs + .3, tau, t => t) * Math.PI) * 18;
      const fanned = hot && tau >= B.fan[0] && tau < B.fold[1];
      const n = fanned ? Math.max(1, counts[s] - Math.round(10 * sm(B.fan[0], B.fan[1], tau) * (1 - sm(B.fold[0], B.fold[1], tau)))) : counts[s];
      s4Stack(c, s, n, sm(B.labels + s * .03, B.labels + s * .03 + .4, tau), dim * cardsOut, (hot ? hotLift : 0) + hop); }
    for (const [x, y, r, k] of flying) s4Card(c, x, y, r, 1, 1, k.s * 20 + k.j, true);
    // 十道错题：从那一摞摊开成一把扇子，再合回去
    const fo = sm(B.fan[0], B.fan[1], tau, easeOutBack) * (1 - sm(B.fold[0], B.fold[1], tau));
    if (fo > 0 && tau < B.fold[1]) { const [hx, hy] = s4StackPos(S4HOT), px = hx, py = hy - 40 - hotLift;
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k - 4.5) * .2, R = 200 * fo; s4Card(c, px + Math.cos(a) * R, py + Math.sin(a) * R * .9, a + Math.PI / 2, 1.15, Math.min(1, fo * 2), 900 + k, true); } }
  }

  // ---- 两人 ----
  const cir = s4Cast(c, tau, L);

  // ---- 飞行物（画在人物前面） ----
  if (cellK > .001) {
    const src = cir.tip || [EP3.cir.x - 60, 560];
    B.beads.forEach((t0, i) => { const u = sm(t0, t0 + .45, tau); if (u <= 0 || u >= 1) return; const x1 = xs[i], y1 = cy + 18;
      s4Bead(c, lerp(src[0], x1, u), lerp(src[1], y1, u) - Math.sin(u * Math.PI) * 180, 24); });
    // 第五颗：撞到满了的格子弹飞
    { const t0 = B.extra, u = sm(t0, t0 + .4, tau, t => t), v = sm(t0 + .4, t0 + 1.1, tau, t => t);
      if (u > 0 && u < 1) s4Bead(c, lerp(src[0], xs[3] + 90, u), lerp(src[1], cy - 30, u) - Math.sin(u * Math.PI) * 160, 24);
      else if (u >= 1 && v < 1) s4Bead(c, xs[3] + 90 + 180 * v, cy - 30 - 80 * v + 700 * v * v, 24, 1 - v);
      if (u >= 1 && v < .3) sparkle(c, xs[3] + 70, cy - 40, 22 * (1 - v / .3), { color: '#ffffff' }); }
    // 大冰块从琪露诺手里飞进第一格，一路缩小
    const bu = sm(B.block[0], B.block[1], tau);
    if (bu > 0 && bu < 1) s4Block(c, lerp(src[0] - 40, xs[0], bu), lerp(src[1] - 60, cy + 4, bu) - Math.sin(bu * Math.PI) * 200, cs * lerp(1.9, .84, easeIO(bu)));
    if (bu >= 1 && tau < B.block[1] + .5) sparkle(c, xs[0] + 40, cy - 50, 26 * (1 - sm(B.block[1], B.block[1] + .5, tau)), { color: '#ffffff' });
  }
  s4Clock(c, tau);
  // 问号冰晶 + 一根线连到那一摞
  const ask = Math.min(sm(B.ask[0], B.ask[0] + .4, tau, easeOutBack), 1 - sm(B.ask[1], B.ask[1] + .3, tau));
  if (ask > 0) { const [hx, hy] = s4StackPos(S4HOT), q = [760 + 0, 330];
    thread(c, [q[0] + 70, q[1]], [hx - 90, hy - 90 - hotLift], { p: sm(B.ask[0] + .3, B.ask[0] + 1.0, tau), sag: 50, color: alpha('#5f86a6', ask) });
    pop(c, q[0], q[1], ask, () => s4Crystal(c, q[0], q[1], 56, 1, tau)); }
  s4Explain(c, tau);
}

scene({ order: 4, key: 'brain', title: '人脑', dur: S4DUR, lines: S4LINES, fn: s4Draw });
