'use strict';
// 第 3 段：巩固（第二轮：跳出书的冰雕）。段首 film.js 翻一页，落到这一页：平的魔导书跨页 + 静止态网络（印在页上）+ 两人 NET.cast 站位。
//   L0 页眉淡入；虚线框圈出「公式」；「巩固」纸签落下钉在右页上角
//   L1 三根线上长出细裂纹、网络一颤、掉碎纸（平的）
//   L1 末 → L2 镜头压低成斜看（2.5D）、拉开：页上的网络一件件立起来，变成一座半透明的冰雕（输入圆牌、冰晶、现实牌立在纸铰链上，
//      纸条变成拱起来的冰条）。琪露诺飞起来悬在冰雕上方；帕秋莉从左边走到右边，书堆立起来，她坐上去看
//   L3 琪露诺拎起水桶，一整桶泼上去：水盖住冰雕，顺着前面淌下来，在书页上摊开、往读者这边流走；冰只闪一下
//   L4 小泼两次：每次一层透明冰板（有厚度，斜看能看到板的侧面），一层叠一层。说完她落到冰顶上站着
//   L5 镜头推到冰雕前面：书页上摊开一张日历。「隔几天」一行四个记号，行尾的小冰块一层层长高；「考前一晚」五个记号挤在最后一格，行尾一滩水流走
//   L6 镜头转到冰雕左前方：一块立着的刻度牌，刻度正好对着冰层的高度（今天 → 10 个月，每 2 个月一格）；每冒一个记号冰雕长一层（2 → 7），
//      站在冰顶上的琪露诺被一层层抬高
//   L7 镜头拉远跳出书：看到书桌靠着图书馆的墙，墙上一扇窗，窗外是夜和月亮；整间屋子变暗，琪露诺趴在冰雕上睡着，冰雕自己长一层（7 → 8）
//   L8 窗外换成太阳，一束光照进来落在冰雕上；最上面那层没冻好的冰化水往下滴（8 → 7.4），琪露诺哭丧脸
//   段末：帕秋莉飘回左边、琪露诺飞回右边，书堆和刻度牌折平；镜头回到正上方，冰雕冻成一整块 → 缩成一滴水落在书页上。
// 【最后一帧（交给结尾段）】spread(c, tau) → waterDrop(c, EP2.drop.x, EP2.drop.y, NET.dropR)
//   → drawPatchouli(c, { ...NET.cast.pch, … }) → drawCirno(c, { ...NET.cast.cir, … })。书页上没有别的东西。
//   段末最后 S3REST 秒一直是这张画（fn 里 tau ≥ S3B.drop[1] 时直接这么画）。
// 透视：书页坐标 (X, Y) = 平放时的屏幕坐标，h = 离开书页的高度。s3P 投影（镜头只俯仰、不偏航），平的时候（S3CAM 首尾）是恒等变换。
// 书页（跨页 + 页上画的东西）先画进一张缓冲，再按行条带投影（kit 的 tiltPlane 同一思路，外加推拉平移）。
// 顶层名字一律带本段前缀 S3 / s3。
const S3LINES = seq(1.0, [
  '公式里没写的第四根柱子：巩固。',
  '刚学会的东西很脆，要慢慢冻结实。',
  ['冻结！这个我在行！', { who: 'cirno', mood: 'proud', pause: .7 }],
  ['那你知道，一桶水泼上去，是冻不成冰雕的吧？', { mood: 'smug', hold: .7 }],
  ['当然！要一层一层泼，冻好一层再泼下一层！', { who: 'cirno', mood: 'proud', hold: .6 }],
  ['复习也一样：隔几天来一次，比考前一晚全塞进去牢得多。', { pause: .4 }],
  ['想记住十个月，就大约每两个月复习一次。', { pause: .3, hold: 1.0 }],
  ['每一层，大多在你睡着的时候冻结。', { pause: .6 }],
  ['所以熬夜复习，就是把没冻好的冰拿去晒太阳。', { pause: .2, hold: .8 }],
]);
const S3T = i => S3LINES[i][0], S3E = i => S3LINES[i][1];
// S3W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold；f > 1 落进 hold）
const S3W = (i, f) => { const v = voiceOf(S3LINES[i][2]), l = S3LINES[i], h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S3REST = .7;

// ===================== 节拍（全部由台词时间算出） =====================
const S3B = (() => { const w = S3W, T = S3T, E = S3E; return {
  head: [.3, E(1) - .2],
  box: [w(0, .02), w(0, .42)], boxLbl: w(0, .3), boxOut: [T(1) + .4, T(1) + 1.1], tag: [w(0, .72), w(0, .95)],
  crack: [w(1, .12), w(1, .48)], shake: [w(1, .3), w(1, .62)], chips: w(1, .42),
  tilt: [E(1) - .25, T(2) + .35], rise: E(1) - .05,                 // 镜头压低；网络零件一件件立起来
  walk: [T(2) - .2, T(2) + 2.2], hop: .4, books: [T(2) + .1, T(2) + .7],
  fly: [T(2) - .35, T(2) + .6],
  bucket: [T(3) + .05, T(3) + .4], big: w(3, .22), bigDur: 3.0,
  small: [w(4, .12), w(4, .62)], smallDur: 1.0,
  putAway: [E(4) - .35, E(4) + .05], land: [E(4) - .15, E(4) + .6],
  cal: [T(5) - .3, T(5) + .2], calA: [w(5, .16), w(5, .24), w(5, .32), w(5, .4)], calB: w(5, .6), calRun: w(5, .8), calOut: [T(6) - .2, T(6) + .2],
  ruler: [T(6) - .2, T(6) + .3], ten: w(6, .12), every: w(6, .5), marks: [w(6, .52), w(6, .67), w(6, .82), w(6, .97), w(6, 1.12)],
  night: [T(7) - .55, T(7) + .35], grow8: [w(7, .55), w(7, .95)], sleep: [T(7) + .1, w(8, .5)],
  sun: [w(8, .45), w(8, .65)], melt: [w(8, .62), E(8)],
  out: [E(8) - .1, E(8) + .5], ret: [E(8) - .2, E(8) + 2.2], cirRet: [E(8) + .15, E(8) + 1.9], booksOut: [E(8) + .9, E(8) + 1.3],
  flat: [E(8) + .3, E(8) + 2.2], block: [E(8) + .3, E(8) + 2.1], drop: [E(8) + 2.25, E(8) + 3.4],
}; })();
const S3DUR = S3B.drop[1] + S3REST;

// ===================== 镜头 =====================
// 关键帧 [对准的书页点 X, Y, 高 h, 推拉, 俯仰, 这一点落在画面正中往下多少]；FLAT 是恒等变换（正上方看平的书）
const S3F = 1400, S3FLAT = [CX, CY, 0, 1, 0, 0];
const S3CAM = (() => { const B = S3B, T = S3T, E = S3E, A = [980, 540, 110, .95, 1.1, 90], BIG = [980, 560, 100, 1.0, 1.05, 90], CAL = [930, 830, 40, 1.12, .95, 140],
  RUL = [620, 690, 130, 1.0, 1.0, 40], NIGHT = [960, 300, 200, .6, .85, -60], SUN = [980, 360, 220, .68, .9, -30];
  return [[B.tilt[0], S3FLAT], [B.tilt[1], A], [S3W(3, .1), A], [B.big + .3, BIG], [S3E(4) - .3, BIG], [T(5) + .2, CAL], [B.calRun + .8, CAL], [T(6) + .3, RUL], [B.marks[4] + .5, RUL],
    [T(7) + .5, NIGHT], [B.sun[0], NIGHT], [B.sun[1] + .4, SUN], [B.flat[0], SUN], [B.flat[1], S3FLAT]]; })();
function s3Raw(V, X, Y, h) { const d = Y - V.ay, cp = Math.cos(V.p), sp = Math.sin(V.p), y = d * cp - h * sp, z = -d * sp - h * cp, k = S3F / Math.max(60, S3F + z); return [V.ax + (X - V.ax) * k, V.ay + y * k, k]; }
function s3View(tau) {
  const [X, Y, hc, zm, p, off] = key(tau, S3CAM), V = { p, ax: X, ay: Y, zm, ox: 0, oy: 0 };
  const [sx, sy] = s3Raw(V, X, Y, hc); V.ox = CX - sx * zm; V.oy = CY + off - sy * zm;
  V.flat = p < 1e-4 && Math.abs(zm - 1) < 1e-4 && Math.abs(V.ox) < .01 && Math.abs(V.oy) < .01;
  return V;
}
// 书页坐标 → 屏幕 [x, y, 缩放]
function s3P(V, X, Y, h = 0) { const [x, y, k] = s3Raw(V, X, Y, h); return [V.ox + x * V.zm, V.oy + y * V.zm, k * V.zm]; }
const s3PP = (V, pts) => pts.map(([x, y, h]) => { const q = s3P(V, x, y, h || 0); return [q[0], q[1]]; });
// 立起来的卡片：铰链 (X, Y) 在书页上，a 0 平躺 → π/2 竖直；卡片局部 (lx, ly)，ly 向上为负，铰链在 ly = 0
function s3Aff(V, X, Y, a, ref = 100, th = 0) {
  const ct = Math.cos(th), st = Math.sin(th), f = (lx, ly) => { const hh = -ly, b = hh * Math.cos(a); return s3P(V, X + lx * ct + b * st, Y + lx * st - b * ct, hh * Math.sin(a)); };
  const o = f(0, 0), m0 = f(0, -ref), m1 = f(ref, -ref);
  return [(m1[0] - m0[0]) / ref, (m1[1] - m0[1]) / ref, (o[0] - m0[0]) / ref, (o[1] - m0[1]) / ref, o[0], o[1]];
}
// 在卡片上画：fn 用书页坐标画（平躺时和画在页上完全重合）；th 是卡片绕竖轴转的角（0 = 正对镜头方向）
function s3Card(c, V, X, Y, a, fn, ref, th = 0) { c.save(); c.transform(...s3Aff(V, X, Y, a, ref, th)); c.translate(-X, -Y); fn(c); c.restore(); }

// ===================== 书页缓冲 + 桌子 + 墙 =====================
// 跨页本身和时间无关：按（渲染缩放）画一次记住（只是缓存）
const S3SPREAD = new Map(), S3BUF = document.createElement('canvas');
function s3SpreadBmp(sc) { let cv = S3SPREAD.get(sc); if (!cv) { cv = document.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
  const g = cv.getContext('2d'); g.setTransform(sc, 0, 0, sc, 0, 0); spread(g, 0); S3SPREAD.set(sc, cv); } return cv; }
function s3Ground(c, V, fn) {
  const sc = c.getTransform().a || 1;
  if (V.flat) { c.drawImage(s3SpreadBmp(sc), 0, 0, W, H); fn(c); return; }
  if (S3BUF.width !== Math.round(W * sc)) { S3BUF.width = Math.round(W * sc); S3BUF.height = Math.round(H * sc); }
  const b = S3BUF.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(s3SpreadBmp(sc), 0, 0); b.setTransform(sc, 0, 0, sc, 0, 0); fn(b);
  const x0 = BOOK.x - 30, x1 = BOOK.x + BOOK.w + 30, y0 = BOOK.y - 26, y1 = BOOK.y + BOOK.h + 36, st = 4;
  c.save();
  for (let y = y0; y < y1; y += st) { const ya = s3P(V, x0, y), yb = s3P(V, x0, Math.min(y1, y + st)), xr = s3P(V, x1, y);
    if (yb[1] < -2 || ya[1] > H + 2) continue;
    c.drawImage(S3BUF, x0 * sc, y * sc, (x1 - x0) * sc, st * sc, ya[0], ya[1], xr[0] - ya[0], yb[1] - ya[1] + .7); }
  c.restore();
}
// 墙：书桌靠着图书馆的墙（Y = S3WALL 的竖直面），墙上一排书架和一扇窗
const S3WALL = -120, S3WIN = { x0: 700, x1: 1220, h0: 170, h1: 640 };
function s3Room(c, V, tau, sky) {
  if (V.flat) return;
  c.fillStyle = mix(P.shelfDark, P.night, .3); c.fillRect(0, 0, W, H);
  const wq = (x0, x1, h0, h1) => s3PP(V, [[x0, S3WALL, h0], [x1, S3WALL, h0], [x1, S3WALL, h1], [x0, S3WALL, h1]]);
  // 书架：窗两边各一架，四层
  for (const [x0, x1] of [[-900, 620], [1300, 2820]]) {
    c.fillStyle = mix(P.shelf, P.night, .25); c.fill(polyPath(wq(x0, x1, 0, 1500)));
    for (let r = 0; r < 4; r++) { const hb = 40 + r * 300, r0 = rng(3900 + r + x0);
      c.fillStyle = mix(P.shelfDark, P.night, .2); c.fill(polyPath(wq(x0, x1, hb - 22, hb)));
      let x = x0 + 20; while (x < x1 - 30) { const bw = 26 + r0() * 34, bh = 170 + r0() * 90, col = ['#5b3a55', '#3d4a6b', '#6b4a3a', '#4a5a4a', '#5a3040', '#3a3a60', '#6a5a3a'][Math.floor(r0() * 7)];
        c.fillStyle = mix(col, P.night, .35); c.fill(polyPath(wq(x, Math.min(x1 - 20, x + bw - 5), hb, hb + bh))); x += bw; } }
  }
  // 窗
  const { x0, x1, h0, h1 } = S3WIN, fr = mix(P.shelf2, P.paper2, .15);
  c.fillStyle = fr; c.fill(polyPath(wq(x0 - 26, x1 + 26, h0 - 30, h1 + 26)));
  s3Glass(c, V, tau, sky);
  const bar = (a, b) => { c.fillStyle = fr; c.fill(polyPath(s3PP(V, [a[0], a[1], b[1], b[0]]))); };
  const xm = (x0 + x1) / 2, hm = (h0 + h1) / 2;
  bar([[xm - 7, S3WALL, h0], [xm + 7, S3WALL, h0]], [[xm - 7, S3WALL, h1], [xm + 7, S3WALL, h1]]);
  bar([[x0, S3WALL, hm - 7], [x1, S3WALL, hm - 7]], [[x0, S3WALL, hm + 7], [x1, S3WALL, hm + 7]]);
  c.fillStyle = mix(fr, P.ink, .2); c.fill(polyPath(wq(x0 - 40, x1 + 40, h0 - 46, h0 - 26)));
}
// 窗玻璃里的天：sky = { night 0..1, sun 0..1 }（都 0 = 傍晚的暗蓝）
function s3Glass(c, V, tau, sky, al = 1) {
  const { x0, x1, h0, h1 } = S3WIN, pts = s3PP(V, [[x0, S3WALL, h0], [x1, S3WALL, h0], [x1, S3WALL, h1], [x0, S3WALL, h1]]), path = polyPath(pts);
  const tl = pts[3], br = pts[1], sw = br[0] - tl[0], sh = br[1] - tl[1];
  c.save(); c.globalAlpha *= al; c.clip(path);
  c.fillStyle = mix(mix(P.night3, P.blue, .35), P.night2, sky.night); c.fillRect(tl[0], tl[1], sw, sh);
  if (sky.sun > 0) { c.globalAlpha *= 1; c.fillStyle = alpha(mix(P.sky, P.paper, .3), sky.sun); c.fillRect(tl[0], tl[1], sw, sh);
    const k = easeOutBack(sm(.2, 1, sky.sun)); if (k > .01) { const sx = tl[0] + sw * .62, sy = tl[1] + sh * .34, r = sw * .12 * k;
      c.save(); c.translate(sx, sy); c.rotate(tau * .4);
      cutPaper(c, starPts(0, 0, r * 1.6, 12, .72, 0), mix(P.gold, P.lamp, .3), { seed: 3955, step: 8, blur: 4, grain: .05 });
      cutPaper(c, circPts(0, 0, r, 24), mix(P.gold, P.paper, .15), { seed: 3956, step: 8, blur: 2, sx: 1, sy: 1, grain: .05 }); c.restore(); } }
  const mk = sky.night * (1 - sky.sun);
  if (mk > .01) { c.globalAlpha = al * mk; drawMoonIcon(c, tl[0] + sw * .62, tl[1] + sh * .32, sw * .11, P.moon, -.5);
    [[.2, .2, 7], [.3, .64, 5], [.84, .72, 6], [.14, .46, 4], [.46, .14, 4]].forEach(([u, v, r], j) => sparkle(c, tl[0] + sw * u, tl[1] + sh * v, r * sw / 300 * (1 + .25 * Math.sin(tau * 3 + j)), { color: P.lamp, rot: j })); }
  c.restore();
}
// 桌面：书外面的木头（书页缓冲只盖书和它周围一圈）
function s3Desk(c, V) {
  if (V.flat) return;
  const sp = Math.sin(V.p), yF = Math.min(2200, V.ay + (S3F - 260) / Math.max(sp, 1e-3)), q = s3PP(V, [[-3000, S3WALL, 0], [4900, S3WALL, 0], [4900, yF, 0], [-3000, yF, 0]]);
  const path = polyPath(q); c.fillStyle = WOOD; c.fill(path);
  c.save(); c.clip(path); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2 * V.zm;
  for (let k = -3; k < 22; k++) { const y0 = 30 + k * 78 + Math.sin(k * 1.7) * 12; if (y0 < S3WALL || y0 > yF) continue; c.beginPath();
    for (let j = 0; j <= 12; j++) { const X = -600 + j * 260, u = (X + 600) / 3120, p = s3P(V, X, y0 + Math.sin(u * 5 + k) * 10); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
  c.restore(); grain(c, path, .1);
  // 墙根一道暗线
  const a = s3P(V, -3000, S3WALL), b = s3P(V, 4900, S3WALL); rline(c, [[a[0], a[1]], [b[0], b[1]]], { w: 3, color: 'rgba(0,0,0,.4)', seed: 3990, amp: .2 });
}

// ===================== 冰雕 =====================
// 立起来的零件：铰链 = 平面图里零件的下沿。输入圆牌 i：(x, y + R)；冰晶：(CX, 470 + r)；现实牌：(1352, 470 + 140)
const S3TOKH = NET.ins.map(p => [p.x, p.y + NET.inR]), S3NODEH = [NET.node.x, NET.node.y + NET.node.r], S3CARDH = [NET.real.x, NET.real.y + NET.real.h / 2];
// 冰层：每层一块透明冰板，厚 S3TH，一层比下一层往里收 S3IN；底层范围 S3FP = [x0, y0, x1, y1]
const S3FP = [440, 240, 1490, 820], S3TH = 30, S3IN = 8, S3ICEC = EP2_ICE, S3WATER = NET.col.water, S3PEN = alpha(P.ink2, .85);
const s3Lay = j => { const e = S3IN * j; return [S3FP[0] + e, S3FP[1] + e, S3FP[2] - e, S3FP[3] - e]; };
// 冰层层数（小数 = 正在冻的那层的厚度）：大泼几乎不长 → 两次小泼各一层 → 5 个记号各一层 → 夜里一层 → 太阳化掉大半层
function s3Ice(tau) {
  const B = S3B, bu = (tau - B.big) / B.bigDur;
  let ice = .32 * sm(.2, .34, bu) - .2 * sm(.4, .85, bu);
  B.small.forEach((t0, k) => { ice += (k ? 1 : .88) * sm(t0 + .45 * B.smallDur, t0 + .95 * B.smallDur, tau); });
  B.marks.forEach(t0 => { ice += sm(t0 + .05, t0 + .45, tau); });
  ice += sm(B.grow8[0], B.grow8[1], tau);
  ice -= .6 * sm(B.melt[0], B.melt[1], tau, x => x);
  return Math.max(0, ice);
}
const s3Top = n => S3TH * Math.max(0, n);
// 零件立起的角度（错开）
function s3Rise(tau, j) { const t0 = S3B.rise + j * .1; return Math.PI / 2 * easeOutBack(clamp((tau - t0) / .6, 0, 1), 1.6); }
// 冰做的零件（在卡片上画，书页坐标）
function s3IceTok(g, i, kind) {
  const [x, y] = netTok(i), R = NET.inR;
  cutPaper(g, circPts(x, y, R, 30), mix(EP2_ICE, '#ffffff', .25), { seed: 3440 + i, step: 10, blur: 6, sy: 4, al: .88 });
  rline(g, circPts(x, y, R - 7, 30), { w: 2, color: alpha(EP2_FROST, .9), close: true, seed: 3445 + i });
  g.save(); g.translate(x, y); g.globalAlpha *= .8; netIcon(g, kind, 3450 + i * 10); g.restore();
  rline(g, [[x - R * .55, y - R * .55], [x - R * .2, y - R * .78]], { w: 4, color: alpha('#ffffff', .8), seed: 3447 + i, amp: .3 });
}
function s3IceCard(g) {
  const { x, y, w, h } = NET.real;
  g.save(); g.translate(x, y); g.rotate(.035);
  cutPaper(g, rectPts(-w / 2, -h / 2, w, h, 8), mix(EP2_ICE, P.purple, .22), { seed: 3481, step: 22, blur: 8, sy: 5, al: .85 });
  rline(g, rectPts(-w / 2 + 11, -h / 2 + 11, w - 22, h - 22, 4), { w: 2, color: alpha(EP2_FROST, .9), close: true, seed: 3483 });
  drawMoonIcon(g, 0, -h / 2 + 40, 13, alpha(P.moon, .7), -.5);
  zh(g, '？', 0, 38, { size: 96, color: alpha('#ffffff', .9), align: 'center' });
  rline(g, [[-w / 2 + 22, -h / 2 + 70], [-w / 2 + 22, -h / 2 + 30], [-w / 2 + 50, -h / 2 + 22]], { w: 5, color: alpha('#ffffff', .7), seed: 3484, amp: .3 });
  g.restore();
}
// 冰条：输入圆牌中心 → 冰晶中心，拱起来；a 0 平躺（= 平面图的纸条）→ 1 立体
function s3Strip(c, V, i, w, a, al) {
  const [tx, ty] = S3TOKH[i], hw = netWpx(w) / 2, L = [], R = [];
  const P3 = u => { const [fx, fy] = netAt(i, u), y3 = lerp(ty, S3NODEH[1], u), h3 = lerp(NET.inR, NET.node.r, u) + 70 * Math.sin(u * Math.PI);
    return [fx, lerp(fy, y3, a), h3 * a]; };
  const n = 16, sp = [];
  for (let k = 0; k <= n; k++) { const [x, y, h] = P3(k / n); sp.push(s3P(V, x, y, h)); }
  for (let k = 0; k <= n; k++) { const p = sp[k], q = sp[Math.min(n, k + 1)], o = sp[Math.max(0, k - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, ww = hw * p[2];
    L.push([p[0] - dy / l * ww, p[1] + dx / l * ww]); R.unshift([p[0] + dy / l * ww, p[1] - dx / l * ww]); }
  cutPaper(c, L.concat(R), mix(NET.col.strip, EP2_ICE, .35), { seed: 3410 + i, step: 16, blur: 5, sx: 2, sy: 4, grain: .05, al: .82 * al });
  rline(c, L.slice(2, -2), { w: 1.6, color: alpha('#ffffff', .75), seed: 3415 + i, amp: .3, al });
}
// ===================== 光和立体件 =====================
// 全段一个光源：左上后方的窗。S3LD 是指向光源的单位向量；影子：高 h 的点落在书页上 (x + h·S3SH[0], y + h·S3SH[1])（往右前方）
const S3LD = (() => { const v = [-.38, -.42, .82], l = Math.hypot(...v); return v.map(x => x / l); })();
const S3SH = [-S3LD[0] / S3LD[2], -S3LD[1] / S3LD[2]];
const s3Cam = V => [V.ax, V.ay + S3F * Math.sin(V.p), S3F * Math.cos(V.p)];
// 竖直面的受光：法线 (nx, ny) → 0 背光 … 1 正对光
const s3Lit = (nx, ny) => clamp((nx * S3LD[0] + ny * S3LD[1]) / Math.hypot(S3LD[0], S3LD[1]), -1, 1) * .5 + .5;
const s3Shift = ([x, y, h]) => [x + h * S3SH[0], y + h * S3SH[1]];
// 一个立体件在书页上的影子：底面点 + 顶面点顺着光挪到书页上，取凸包（画在书页缓冲里）
function s3CastShadow(g, pts3, al, col = '#2a1c16') { if (al <= .003) return; g.save(); g.globalAlpha *= al; g.fillStyle = col; g.fill(polyPath(netHull(pts3.map(s3Shift)))); g.restore(); }
// s3Prism：竖直棱柱（冰板、书、小冰块）。pts 书页上的底面轮廓（屏幕顺时针），h0..h1。
//   o = { side: [上沿色, 下沿色], sideAl, top, topAl, hole（顶面挖掉的内轮廓，画台阶用）, dark 背光面压暗, light 受光面提亮, rim 顶边亮线色, rimAl }
//   返回 { sides: [{ a, b, nx, ny, lit, q 屏幕四点 }], top 顶面屏幕点 }
function s3Prism(c, V, pts, h0, h1, o) {
  const cam = s3Cam(V), n = pts.length, sides = [];
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l;
    if (nx * (cam[0] - (a[0] + b[0]) / 2) + ny * (cam[1] - (a[1] + b[1]) / 2) > 0) sides.push({ a, b, nx, ny, lit: s3Lit(nx, ny) }); }
  const top = s3PP(V, pts.map(p => [p[0], p[1], h1]));
  c.save();
  if (h1 - h0 > .3 && sides.length && (o.sideAl ?? 1) > 0) {
    const sp = new Path2D(); let y0 = Infinity, y1 = -Infinity;
    sides.forEach(s => { s.q = s3PP(V, [[s.a[0], s.a[1], h0], [s.b[0], s.b[1], h0], [s.b[0], s.b[1], h1], [s.a[0], s.a[1], h1]]); sp.addPath(polyPath(s.q));
      y0 = Math.min(y0, s.q[2][1], s.q[3][1]); y1 = Math.max(y1, s.q[0][1], s.q[1][1]); });
    const gr = c.createLinearGradient(0, y0, 0, Math.max(y0 + 1, y1)); gr.addColorStop(0, o.side[0]); gr.addColorStop(1, o.side[1]);
    c.globalAlpha = o.sideAl ?? 1; c.fillStyle = gr; c.fill(sp);
    sides.forEach(s => { const d = (1 - s.lit) * (o.dark ?? .3), li = s.lit * (o.light ?? .15);
      if (d > .01) { c.globalAlpha = d * (o.sideAl ?? 1); c.fillStyle = '#10182a'; c.fill(polyPath(s.q)); }
      if (li > .01) { c.globalAlpha = li * (o.sideAl ?? 1); c.fillStyle = '#ffffff'; c.fill(polyPath(s.q)); } });
  }
  if (o.top && (o.topAl ?? 1) > 0) { c.globalAlpha = o.topAl ?? 1; c.fillStyle = o.top;
    const tp = polyPath(top); if (o.hole) { tp.addPath(polyPath(s3PP(V, o.hole.slice().reverse().map(p => [p[0], p[1], h1])))); c.fill(tp, 'evenodd'); } else c.fill(tp); }
  c.restore();
  if (o.rim && sides.length) { c.save(); c.globalAlpha = o.rimAl ?? 1; c.strokeStyle = o.rim; c.lineWidth = (o.rimW ?? 2) * top[0][2] || 2; c.lineJoin = 'round'; c.beginPath();
    sides.forEach(s => { const a = s3P(V, s.a[0], s.a[1], h1), b = s3P(V, s.b[0], s.b[1], h1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }); c.stroke(); c.restore(); }
  return { sides, top };
}
// 水平面上贴一张图（冰顶的霜花）：按行条带投影，和书页缓冲同一个办法
function s3PlaneImg(c, V, img, [x0, y0, x1, y1], h, al, rows = 14) {
  if (al <= .01) return; c.save(); c.globalAlpha *= al;
  for (let r = 0; r < rows; r++) { const ya = lerp(y0, y1, r / rows), yb = lerp(y0, y1, (r + 1) / rows), p = s3P(V, x0, ya, h), q = s3P(V, x0, yb, h), e = s3P(V, x1, ya, h);
    c.drawImage(img, 0, img.height * r / rows, img.width, img.height / rows, p[0], p[1], e[0] - p[0], q[1] - p[1] + .8); }
  c.restore();
}
// 霜花图：一块冰顶大小的透明图，霜从四周边缘往里长（p 0..1，按 8 档记住；只是缓存）
const S3FROSTIMG = new Map();
function s3FrostImg(p) {
  const q = Math.round(clamp(p, 0, 1) * 8); let cv = S3FROSTIMG.get(q);
  if (!cv) { cv = document.createElement('canvas'); const Wd = S3FP[2] - S3FP[0], Hd = S3FP[3] - S3FP[1], s = .5; cv.width = Wd * s; cv.height = Hd * s;
    const g = cv.getContext('2d'); g.scale(s, s);
    for (let k = 0; k < 18; k++) { const side = k % 4, u = .08 + .84 * hash(k, 3601), [x, y, a] = side === 0 ? [u * Wd, 0, Math.PI / 2] : side === 1 ? [Wd, u * Hd, Math.PI] : side === 2 ? [u * Wd, Hd, -Math.PI / 2] : [0, u * Hd, 0];
      ep2Frost(g, x, y, a + (hash(k, 3602) - .5) * .8, 150 + 90 * hash(k, 3603), q / 8, 3610 + k); }
    S3FROSTIMG.set(q, cv); }
  return cv;
}
// 一层冰板。st = { fz 冻透 0..1（0 = 刚泼上的一层白雾水，1 = 透明冰）, wet 化水 0..1, top 是不是最上面一层, hole 上一层的底面（台阶）, al }
const S3ICE_SIDE = ['#d2e6f2', '#5d8db2'], S3ICE_TOP = '#e2eff7';
function s3IceSlab(c, V, j, lay, h0, h1, st) {
  const [x0, y0, x1, y1] = lay, pts = rectPts(x0, y0, x1 - x0, y1 - y0, Math.min(26, (x1 - x0) / 2 - .5, (y1 - y0) / 2 - .5)), fog = 1 - st.fz, al = st.al ?? 1;
  const side = [mix(mix(S3ICE_SIDE[0], S3WATER, st.wet * .35), '#ffffff', fog * .55), mix(mix(S3ICE_SIDE[1], S3WATER, st.wet * .5), '#dfe8ee', fog * .5)];
  const R = s3Prism(c, V, pts, h0, h1, { side, sideAl: al * (.5 + .36 * fog), top: mix(mix(S3ICE_TOP, S3WATER, st.wet * .45), '#ffffff', fog * .4),
    topAl: al * (st.top ? .26 + .5 * fog : .22), hole: st.top ? null : st.hole, dark: .34, light: .3, rim: '#ffffff', rimAl: al * (.3 + .35 * st.fz), rimW: 2 });
  if (!R.sides.length || h1 - h0 < 1) return R;
  const small = !!st.noFrost;
  // 顶边一圈霜白毛边 + 冰里的气泡、裂纹（位置只由层号决定）
  if (!small) { c.save(); c.globalAlpha = al * (.3 + .3 * st.fz); c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath();
  R.sides.forEach((s, i) => { const L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]), m = Math.max(1, Math.round(L / 70));
    for (let k = 0; k < m; k++) { const u = (k + hash(k + i * 31, 3620 + j)) / m, p = s3P(V, lerp(s.a[0], s.b[0], u), lerp(s.a[1], s.b[1], u), h1 - 2), r = (4 + 5 * hash(k + i * 17, 3621 + j)) * p[2];
      for (let e = 0; e < 3; e++) { const an = hash(k * 3 + e + i * 7, 3622 + j) * TAU; c.moveTo(p[0], p[1]); c.lineTo(p[0] + Math.cos(an) * r, p[1] + Math.sin(an) * r * .8); } } });
  c.stroke(); c.restore(); }
  if (st.fz > .5 && !small) { const a = al * sm(.5, 1, st.fz);
    c.save(); c.globalAlpha = a * .7; c.strokeStyle = '#ffffff'; c.fillStyle = alpha('#ffffff', .25); c.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) { const p = s3P(V, lerp(x0 + 40, x1 - 40, hash(k, 3630 + j)), y1 - 4 - 30 * hash(k, 3631 + j), lerp(h0 + 5, h1 - 5, hash(k, 3632 + j))), r = (2.5 + 4 * hash(k, 3633 + j)) * p[2];
      c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill(); c.stroke(); }
    if (j % 2 === 0) { const cx = lerp(x0 + 90, x1 - 90, hash(j, 3634)), pts2 = [];
      for (let k = 0; k < 5; k++) pts2.push(s3P(V, cx + k * 14 + 10 * (hash(k, 3635 + j) - .5), y1 - 1, lerp(h1 - 3, h0 + 3, k / 4)));
      c.globalAlpha = a * .22; c.strokeStyle = '#1c3a58'; c.lineWidth = 2; c.beginPath(); pts2.forEach((p, k) => k ? c.lineTo(p[0] + 1, p[1] + 1) : c.moveTo(p[0] + 1, p[1] + 1)); c.stroke();
      c.globalAlpha = a * .75; c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.beginPath(); pts2.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
    c.restore(); }
  // 最上面一层：顶面一条斜的高光 + 霜花（冻的时候从边缘往里长，冻好后淡淡留在边上）
  if (st.top) {
    const w = x1 - x0, d = y1 - y0, band = (u0, u1, wd, a) => { const q = s3PP(V, [[x0 + w * u0, y0 + d * .03, h1], [x0 + w * u0 + wd, y0 + d * .03, h1], [x0 + w * u1 + wd, y1 - d * .03, h1], [x0 + w * u1, y1 - d * .03, h1]]);
      c.save(); c.globalAlpha = a; c.fillStyle = '#ffffff'; c.fill(polyPath(q)); c.restore(); };
    band(.3, .12, w * .07, al * .22 * st.fz); band(.38, .2, w * .018, al * .3 * st.fz);
    const fp = st.fz < 1 ? sm(0, .8, st.fz) : 1;
    if (fp > 0 && !st.noFrost) s3PlaneImg(c, V, s3FrostImg(fp), lay, h1 + .5, al * (st.fz < 1 ? .95 : .4) * (1 - st.wet));
  }
  return R;
}
const s3LayPts = j => { const [a, b, cc, d] = s3Lay(j); return rectPts(a, b, cc - a, d - b, 26); };
// 冰层状态：层数 n（含化掉的），第 j 层：厚度很快泼满（th），再慢慢冻透（fz）；太阳底下最上面那层变薄变湿
function s3Stack(c, V, n, melt, al) {
  const N = Math.ceil(Math.min(n + .6 * melt, 9) - 1e-4); if (N <= 0 || al <= 0) return 0;
  let hTop = 0;
  for (let j = 0; j < N; j++) { const f = clamp(n + .6 * melt - j, 0, 1), last = j === N - 1, th = sm(0, .3, f) * (last ? 1 - .6 * melt : 1), fz = sm(.25, 1, f, x => x);
    const h0 = S3TH * j, h1 = h0 + S3TH * th; hTop = h1;
    s3IceSlab(c, V, j, s3Lay(j), h0, h1, { fz, wet: last ? melt : 0, top: last, hole: last ? null : s3LayPts(j + 1), al }); }
  return hTop;
}
// 整座冰雕：冰条 → 零件（冰里那一截略微折射：错开、压扁、变淡）→ 冰层 → 冰顶以上的零件再画一遍（露在冰外面，不变形）
function s3Sculpt(c, V, tau, S) {
  const lines = netRest().lines, pa = S.parts;
  if (pa > 0) {
    const pieces = [], thick = (X, Y, a, fn, ref) => g => { fade(g, .35, () => s3Card(g, V, X + 2, Y - 4, a, fn, ref)); s3Card(g, V, X, Y, a, fn, ref); };
    lines.forEach((l, i) => { const a = s3Rise(tau, [0, 1, 4][i]); if (a > .04) pieces.push({ Y: S3TOKH[i][1], X: S3TOKH[i][0], a, draw: thick(S3TOKH[i][0], S3TOKH[i][1], a, gg => s3IceTok(gg, i, l.kind), 60) }); });
    { const a = s3Rise(tau, 2); if (a > .04) pieces.push({ Y: S3NODEH[1], X: S3NODEH[0], a, draw: thick(S3NODEH[0], S3NODEH[1], a, gg => { gg.globalAlpha *= .92; netNode(gg, {}, tau); }, 80) }); }
    { const a = s3Rise(tau, 3); if (a > .04) pieces.push({ Y: S3CARDH[1], X: S3CARDH[0], a, draw: thick(S3CARDH[0], S3CARDH[1], a, s3IceCard, 140) }); }
    pieces.sort((p, q) => p.Y - q.Y);
    const inIce = S.ice > .05 ? S.stackAl : 0, fr = s3P(V, 965, S3FP[3], s3Top(S.ice));
    fade(c, pa * (1 - .35 * inIce), () => { c.save();
      if (inIce > 0) { c.translate(fr[0], fr[1]); c.transform(1 + .015 * inIce, 0, -.03 * inIce, 1 - .035 * inIce, 0, 5 * inIce * fr[2]); c.translate(-fr[0], -fr[1]); }
      lines.forEach((l, i) => { const a = s3Rise(tau, [0, 1, 4][i]) / (Math.PI / 2); if (a > .02) s3Strip(c, V, i, l.w, Math.min(a, 1.05), sm(0, .3, a)); });
      pieces.forEach(p => fade(c, sm(.04, .5, p.a), () => p.draw(c)));
      c.restore(); });
    const hT = s3Stack(c, V, S.ice, S.melt, S.stackAl);
    if (hT > .5 && S.stackAl > 0) fade(c, pa, () => pieces.forEach(p => { const yc = s3P(V, p.X, p.Y, hT + 1)[1]; c.save(); c.beginPath(); c.rect(-10, -10, W + 20, yc + 10); c.clip(); fade(c, sm(.04, .5, p.a), () => p.draw(c)); c.restore(); }));
  }
  // 冻成一整块：冰层收成正中一块冰（中心 = EP2.drop），再缩成一滴水
  if (S.block > 0) {
    const u = easeIO(S.block), shr = sm(0, .7, S.drop), half = lerp(NET.cube / 2, 0, shr), dx = EP2.drop.x, dy = EP2.drop.y, [x0, y0, x1, y1] = S3FP;
    const fp = [lerp(x0, dx - half, u), lerp(y0, dy - half, u), lerp(x1, dx + half, u), lerp(y1, dy + half, u)], hh = lerp(s3Top(S.iceB), 40, u) * (1 - shr);
    if (fp[2] - fp[0] > 4) s3IceSlab(c, V, 0, fp, 0, Math.max(.5, hh), { fz: 1, wet: 0, top: true, al: sm(0, .3, S.block) * lerp(.8, 1, u) * (1 - sm(.4, 1, shr)) });
    const dr = NET.dropR * easeOutBack(sm(.35, 1, S.drop)); if (dr > .5) waterDrop(c, dx, dy, dr);
  }
}
// 小冰块（日历行尾、刻度牌上的记号）：一块圆角冰方
function s3IceCube(c, V, x, y, h0, s, al) {
  if (s <= .02 || al <= .01) return;
  s3IceSlab(c, V, 7, [x - 11 * s, y - 9 * s, x + 11 * s, y + 9 * s], h0, h0 + 18 * s, { fz: 1, wet: 0, top: true, al, noFrost: true });
}

// ===================== 平面上的东西（画进书页缓冲） =====================
const S3BOXF = [476, 186, 1462, 794];
function s3FormBox(g, tau) {
  const B = S3B, a = 1 - sm(B.boxOut[0], B.boxOut[1], tau); if (a <= 0 || tau < B.box[0]) return;
  const [x0, y0, x1, y1] = S3BOXF, p = sm(B.box[0], B.box[1], tau, x => x);
  fade(g, a * .8, () => {
    rline(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], { w: 3, color: P.ink2, dash: [14, 10], seed: 3701, amp: .6, p });
    zh(g, '公式', x1 - 18, y0 + 44, { size: 38, color: P.ink2, align: 'right', p: writeP(tau, B.boxLbl, '公式', .12) });
  });
}
const S3TAG = { x: 1668, y: 226 };
function s3Tag(g, tau, a) {
  const B = S3B, u = sm(B.tag[0], B.tag[1], tau, easeOut); if (u <= 0 || a <= 0) return;
  const { x } = S3TAG, y = S3TAG.y - 70 * (1 - u), rot = lerp(-.25, .045, easeOutBack(sm(B.tag[0], B.tag[1] + .15, tau)));
  fade(g, a * sm(0, .3, u), () => {
    spin(g, x, y, rot, () => {
      cutPaper(g, rectPts(x - 104, y - 62, 208, 124, 6), NET.col.card, { seed: 3705, step: 22, blur: 8, sy: 5 });
      rline(g, rectPts(x - 94, y - 52, 188, 104, 4), { w: 1.6, color: alpha(P.ink2, .35), close: true, seed: 3706, amp: .4 });
      zh(g, '第四根柱子', x, y - 16, { size: 24, color: P.ink2, align: 'center' });
      zh(g, '巩固', x, y + 42, { size: 58, color: mix(NET.col.strip, P.ink, .35), align: 'center' });
    });
    if (u > .95) brassPin(g, x, y - 48, 10);
  });
}
// 刚学会的线：细裂纹 + 碎纸片（平面图上）
const S3CRACK = [[.3, .56, .8], [.26, .5, .76], [.34, .6, .82]];
function s3Tan(i, u) { const a = netAt(i, u - .012), b = netAt(i, u + .012), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
function s3Cracks(g, tau, lines, jit, al) {
  const B = S3B; if (al <= 0 || tau < B.crack[0]) return;
  lines.forEach((l, i) => S3CRACK[i].forEach((u, j) => {
    const p = sm(B.crack[0] + (i * 3 + j) * .07, B.crack[0] + (i * 3 + j) * .07 + .35, tau, x => x); if (p <= 0) return;
    const [cx, cy] = netAt(i, u), [tx, ty] = s3Tan(i, u), nx = -ty, ny = tx, hw = netWpx(l.w) / 2 + 2, s = 3811 + i * 7 + j, pts = [];
    for (let k = 0; k <= 4; k++) { const v = k / 4 * 2 - 1, z = (k % 2 ? 1 : -1) * (2 + 3 * hash(k, s)); pts.push([cx + jit[0] + nx * hw * v + tx * z, cy + jit[1] + ny * hw * v + ty * z]); }
    rline(g, pts, { w: 1.7, color: P.ink2, seed: s, amp: .3, p, al: al * .85 });
  }));
  for (let k = 0; k < 6; k++) {
    const t0 = B.chips + k * .09, u = (tau - t0) / 1.1; if (u <= 0 || u >= 1) continue;
    const i = k % 3, [x, y] = netAt(i, S3CRACK[i][k < 3 ? 1 : 2]), sz = 4 + 3 * hash(k, 381);
    g.save(); g.globalAlpha *= 1 - sm(.6, 1, u); g.translate(x + 14 * Math.sin(u * 5 + k), y + 90 * u * u + 8 * u); g.rotate(u * 6 * (hash(k, 382) - .5));
    g.fillStyle = NET.col.strip; g.fill(polyPath([[-sz, -sz * .6], [sz * .8, -sz * .4], [sz * .4, sz * .7], [-sz * .7, sz * .5]])); g.restore();
  }
}
// 水痕：从 (x, y0) 往 foot 淌，p 头的进度；越接近 foot 越淡（平面上 = 往读者这边流；屏幕上 = 往下淌）
function s3Streak(g, x, y0, p, w, al, seed, foot) {
  if (p <= 0 || al <= 0) return;
  const yh = lerp(y0, foot, p), yt = lerp(y0, yh, sm(.3, 1, p, x => x)), fadeFoot = 1 - sm(foot - Math.min(110, (foot - y0) * .6), foot, yh) * .9;
  if (yh - yt < 3) return;
  const n = 14, L = [], R = [], xs = yy => x + 4 * Math.sin(yy * .019 + seed);
  for (let k = 0; k <= n; k++) { const u = k / n, yy = lerp(yt, yh, u), hw = w * .5 * (.15 + .85 * Math.pow(u, .7)); L.push([xs(yy) - hw, yy]); R.unshift([xs(yy) + hw, yy]); }
  g.save(); g.globalAlpha *= al * fadeFoot;
  g.fillStyle = alpha(S3WATER, .5); g.fill(polyPath(L.concat(R)));
  g.fillStyle = alpha(S3WATER, .75); g.beginPath(); g.ellipse(xs(yh), yh, w * .62, w * .78, 0, 0, TAU); g.fill();
  g.fillStyle = alpha('#ffffff', .55); g.beginPath(); g.arc(xs(yh) - w * .2, yh - w * .25, w * .16, 0, TAU); g.fill();
  g.restore();
}
function s3Sheet(g, cx, cy, rx, ry, al, seed, lump = 1) {
  if (al <= 0 || rx < 2) return;
  const pts = []; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, r = 1 + lump * (.1 * Math.sin(a * 5 + seed) + .06 * Math.sin(a * 9 + seed * 2)); pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  cutPaper(g, pts, S3WATER, { seed, step: 24, blur: 6, grain: .04, al, shadow: false });
  g.save(); g.globalAlpha *= al * .8; g.strokeStyle = alpha('#ffffff', .55); g.lineWidth = 3; g.stroke(polyPath(pts, true)); g.restore();
}
// 大泼在书页上：冰雕底下摊开一大滩，前沿往读者这边流成一道道水
function s3BigGround(g, tau) {
  const B = S3B, u = (tau - B.big) / B.bigDur; if (u <= .2 || u >= 1) return;
  const [x0, , x1, y1] = S3FP, sp = sm(.24, .5, u, easeOut), dr = 1 - sm(.7, 1, u);
  s3Sheet(g, (x0 + x1) / 2, y1 - 20, (x1 - x0) * .5 * lerp(.8, 1.08, sp), lerp(20, 90, sp), .45 * dr, 3750, .6);
  for (let k = 0; k < 16; k++) { const x = x0 + 30 + k * (x1 - x0 - 60) / 15 + 14 * hash(k, 378), t0 = .3 + .14 * hash(k, 380), p = sm(t0, t0 + .45, u, x => easeIn(x) * .4 + x * .6);
    s3Streak(g, x, y1 + 30, p, 10 + 10 * hash(k, 381), dr, 3760 + k, BOOK.y + BOOK.h - 16); }
}
// 太阳底下化的水：冰雕前沿一滩慢慢变大
function s3MeltGround(g, tau) {
  const B = S3B, m = sm(B.melt[0] + .3, B.melt[1] + .6, tau, x => x) * (1 - sm(B.block[0], B.block[0] + .8, tau)); if (m <= 0) return;
  const [x0, , x1, y1] = S3FP; s3Sheet(g, (x0 + x1) / 2, y1 + 18, (x1 - x0) * .42 * m, 34 * m, .45, 3790, .7);
}
// 日历：摊在冰雕前面的书页上（两行 × 14 格）
const S3CAL = { x: 640, y: 850, cw: 46, ch: 36, gap: 10, n: 14, A: [0, 3, 7, 11] };
function s3CalRow(r) { return S3CAL.y + r * (S3CAL.ch + S3CAL.gap); }
function s3Calendar(g, tau) {
  const B = S3B, k = sm(B.cal[0], B.cal[1], tau, easeOut) * (1 - sm(B.calOut[0], B.calOut[1], tau)); if (k <= .01) return;
  const { x, cw, ch, n } = S3CAL, x1 = x + n * cw, y = s3CalRow(0), bot = s3CalRow(1) + ch;
  fade(g, k, () => { g.save(); g.translate(0, (1 - k) * 60);
    cutPaper(g, rectPts(500, y - 14, x1 + 120 - 500, bot + 14 - (y - 14), 5), NET.col.card, { seed: 3801, step: 26, blur: 7, sy: 4 });
    for (let r = 0; r < 2; r++) {
      for (let d = 0; d <= n; d++) rline(g, [[x + d * cw, s3CalRow(r)], [x + d * cw, s3CalRow(r) + ch]], { w: 1.4, color: alpha(P.ink2, .4), seed: 3802 + d + r * 20, amp: .2 });
      rline(g, [[x, s3CalRow(r)], [x1, s3CalRow(r)]], { w: 1.4, color: alpha(P.ink2, .4), seed: 3840 + r, amp: .2 });
      rline(g, [[x, s3CalRow(r) + ch], [x1, s3CalRow(r) + ch]], { w: 1.4, color: alpha(P.ink2, .4), seed: 3842 + r, amp: .2 });
    }
    zh(g, '隔几天', x - 14, s3CalRow(0) + 28, { size: 30, color: P.ink2, align: 'right' });
    zh(g, '考前一晚', x - 14, s3CalRow(1) + 28, { size: 30, color: P.ink2, align: 'right', p: writeP(tau, B.calB - .35, '考前一晚', .06) });
    S3CAL.A.forEach((d, j) => { const t0 = B.calA[j], m = easeOutBack(sm(t0, t0 + .25, tau)); s3Mark(g, x + d * cw + cw / 2, s3CalRow(0) + ch / 2, m, 3850 + j); });
    for (let j = 0; j < 5; j++) { const t0 = B.calB + j * .09, m = easeOutBack(sm(t0, t0 + .22, tau));
      s3Mark(g, x + (n - 1) * cw + cw / 2 + (hash(j, 387) - .5) * 20, s3CalRow(1) + ch / 2 + (hash(j, 388) - .5) * 14, m * .9, 3870 + j); }
    // 考前一晚那行行尾：一滩水，往读者这边流走
    const ru = (tau - B.calRun) / 1.6;
    if (ru > 0) { const jx = x1 + 60, jy = s3CalRow(1) + ch / 2, a = 1 - sm(.55, 1, ru);
      s3Sheet(g, jx, jy + 6 * ru, 34 * sm(0, .2, ru, easeOut), 14 * sm(0, .2, ru, easeOut), .75 * a, 3880);
      for (let j = 0; j < 3; j++) s3Streak(g, jx - 20 + j * 20, jy + 8, sm(.12 + j * .1, .8 + j * .06, ru, x => x), 8, a, 3881 + j, BOOK.y + BOOK.h - 16); }
    g.restore(); });
}
// 隔几天那行行尾的小冰块：一个记号冻一层，一层层叠高
function s3CalIce(c, V, tau) {
  const B = S3B, k = sm(B.cal[0], B.cal[1], tau, easeOut) * (1 - sm(B.calOut[0], B.calOut[1], tau)); if (k <= .01) return;
  let layers = 0; B.calA.forEach(t0 => { layers += sm(t0 + .1, t0 + .4, tau); });
  const X = S3CAL.x + S3CAL.n * S3CAL.cw + 60, Y = s3CalRow(0) + S3CAL.ch / 2 + (1 - k) * 60;
  for (let j = 0; j < 4; j++) { const f = clamp(layers - j, 0, 1); if (f <= 0) continue; const e = 28 - j * 3;
    s3IceSlab(c, V, j, [X - e, Y - e * .75, X + e, Y + e * .75], j * 13, j * 13 + 13 * sm(0, .4, f), { fz: sm(.3, 1, f), wet: 0, top: j === Math.ceil(layers) - 1, al: k, noFrost: true,
      hole: rectPts(X - e + 3, Y - (e - 3) * .75, 2 * e - 6, 1.5 * (e - 3), 8) }); }
}
function s3CalIceShadow(g, tau) {
  const B = S3B, k = sm(B.cal[0], B.cal[1], tau, easeOut) * (1 - sm(B.calOut[0], B.calOut[1], tau)); if (k <= .01) return;
  let layers = 0; B.calA.forEach(t0 => { layers += sm(t0 + .1, t0 + .4, tau); }); if (layers <= 0) return;
  const X = S3CAL.x + S3CAL.n * S3CAL.cw + 60, Y = s3CalRow(0) + S3CAL.ch / 2 + (1 - k) * 60, H = 13 * layers;
  s3CastShadow(g, [[X - 28, Y - 21, 0], [X + 28, Y - 21, 0], [X + 28, Y + 21, 0], [X - 28, Y + 21, 0], [X - 20, Y - 15, H], [X + 20, Y - 15, H], [X + 20, Y + 15, H], [X - 20, Y + 15, H]], .22 * k, '#27415a');
}
function s3Mark(g, x, y, k, seed) {
  if (k <= .01) return;
  pop(g, x, y, k, () => { cutPaper(g, circPts(x, y, 13, 14), mix(EP2_ICE, EP2_ICE_DEEP, .45), { seed, step: 6, blur: 2, sx: 1, sy: 1.5, grain: 0 });
    rline(g, circPts(x, y, 13, 14), { w: 1.6, color: alpha(P.ink2, .7), close: true, seed: seed + 1, amp: .3 }); });
}
// 刻度牌：折成三角立牌立在冰雕左前方，斜着朝向右前（绕竖轴转 S3RUL.th），前板往后斜 S3RUL.a，后板撑着；纸有厚度。
//   刻度的高度 = 冰层的高度（今天 = 第 2 层顶，每 2 个月 = 一层，10 个月 = 第 7 层顶）；记号是嵌在牌上的小冰块
const S3RUL = { X: 330, Y: 830, w: 230, L: 300, a: 1.3, th: -.42 };
// 牌上的点：lx 横向（相对中线），hh 沿前板往上的长度；back = true 时在后板上（从脊往下 hh）
function s3RulGeo(k) { const a = S3RUL.a * k, { X, Y, w, L, th } = S3RUL, ct = Math.cos(th), st = Math.sin(th);
  const pt = (lx, hh, back = false) => { const d = hh * Math.cos(a), h = (back ? 2 * L - hh : hh) * Math.sin(a); return [X + lx * ct + d * st, Y + lx * st - d * ct, h]; };
  return { a, X, Y, w, L, th, pt }; }
function s3RulShadow(g, k, al) { if (k < .03) return; const { w, L, pt } = s3RulGeo(k);
  s3CastShadow(g, [pt(-w / 2, 0), pt(w / 2, 0), pt(-w / 2, 2 * L, true), pt(w / 2, 2 * L, true), pt(-w / 2, L), pt(w / 2, L)], al); }
function s3Ruler(c, V, tau, k) {
  if (k < .03) return;
  const B = S3B, { a, X, Y, w, L, th, pt } = s3RulGeo(k), sa = Math.max(.05, Math.sin(a)), hOf = m => (S3TH * 2 + m * S3TH / 2) / sa, lvl = m => Y - hOf(m), sx = X + w / 2 - 22;
  const xl = X - w / 2, xr = X + w / 2, paper = NET.col.card, edge = mix(paper, P.paperEdge, .75);
  // 后板（从脊往后落到书页），和看得见的那个三角侧口（里面暗）
  const back = s3PP(V, [pt(-w / 2, L), pt(w / 2, L), pt(w / 2, 2 * L, true), pt(-w / 2, 2 * L, true)]);
  c.save(); c.fillStyle = mix(paper, P.ink, .3); c.fill(polyPath(back)); c.restore();
  const tri = s3PP(V, [pt(w / 2, 0), pt(w / 2, L), pt(w / 2, 2 * L, true)]); c.save(); c.fillStyle = mix(P.shelfDark, paper, .22); c.fill(polyPath(tri));
  c.strokeStyle = edge; c.lineWidth = 2; c.beginPath(); c.moveTo(tri[0][0], tri[0][1]); c.lineTo(tri[1][0], tri[1][1]); c.lineTo(tri[2][0], tri[2][1]); c.stroke(); c.restore();
  // 纸厚：前板先往里错开几像素画一张纸边色
  s3Card(c, V, X + 3 * Math.sin(th), Y - 3 * Math.cos(th) - 4, a, g => { g.fillStyle = edge; g.fill(polyPath(rectPts(xl, Y - L, w, L, 5))); }, 150, th);
  s3Card(c, V, X, Y, a, g => {
    cutPaper(g, rectPts(xl, Y - L, w, L, 5), paper, { seed: 3900, step: 24, shadow: false, grain: .1 });
    // 前板背着窗：从上往下压暗一点
    const gr = g.createLinearGradient(0, Y - L, 0, Y); gr.addColorStop(0, 'rgba(40,30,20,.02)'); gr.addColorStop(1, 'rgba(40,30,20,.2)'); g.fillStyle = gr; g.fill(polyPath(rectPts(xl, Y - L, w, L, 5)));
    rline(g, [[xl + 4, Y - L + 1.5], [xr - 4, Y - L + 1.5]], { w: 3.5, color: '#ffffff', seed: 3899, amp: .2, al: .95 });   // 脊上迎光的一条亮边
    rline(g, [[xr - 1.5, Y - L + 4], [xr - 1.5, Y - 2]], { w: 2.5, color: alpha(P.ink, .3), seed: 3898, amp: .2 });
    rline(g, [[sx, lvl(0)], [sx, lvl(10)]], { w: 3.5, color: P.ink2, seed: 3901, amp: .4 });
    for (let m = 0; m <= 10; m++) rline(g, [[sx - (m % 2 ? 8 : 16), lvl(m)], [sx, lvl(m)]], { w: m % 2 ? 1.6 : 2.6, color: alpha(P.ink2, m % 2 ? .5 : .85), seed: 3902 + m, amp: .2 });
    zh(g, '今天', sx - 24, lvl(0) + 10, { size: 26, color: P.ink2, align: 'right' });
    for (let m = 2; m < 10; m += 2) zh(g, String(m), sx - 24, lvl(m) + 9, { size: 24, color: alpha(P.ink2, .8), align: 'right' });
    zh(g, '10 个月', sx - 22, lvl(10) + 12, { size: 38, color: P.ink, align: 'right', p: writeP(tau, B.ten, '10 个月', .08) });
    zh(g, '每 2 个月', X - 2, Y - L + 44, { size: 32, color: P.ink, align: 'center', p: writeP(tau, B.every, '每 2 个月', .07) });
    B.marks.forEach((t0, j) => { const hp = sm(t0 + .05, t0 + .3, tau, x => x); if (hp <= 0) return;
      const pts = []; for (let q = 0; q <= 10; q++) { const u = q / 10; pts.push([sx + 20 + Math.sin(u * Math.PI) * 14, lerp(lvl(j * 2), lvl(j * 2 + 2), u)]); } rline(g, pts, { w: 2.2, color: S3PEN, seed: 3920 + j, amp: .3, p: hp }); });
  }, 150, th);
  // 记号：嵌在牌面上的小冰块（有体积，跟着同一个相机）
  B.marks.forEach((t0, j) => { const m = easeOutBack(sm(t0, t0 + .28, tau)); if (m <= .02) return;
    const [wx, wy, wh] = pt(sx - X, hOf(j * 2));
    s3IceCube(c, V, wx, wy + 11 * m, wh - 10 * m, m * 1.1, 1);
    const s = Math.sin(clamp((tau - t0) / .5, 0, 1) * Math.PI), p = s3P(V, wx + 14, wy, wh + 22); if (s > 0) sparkle(c, p[0], p[1], 14 * s * p[2], { color: EP2_FROST, rot: j }); });
}
// 书堆（帕秋莉坐的）：四本不透明的精装书。书脊朝左（迎光），前面和右边是书口（一叠页边线），上下两片封面板；顶面是封面
const S3BOOKS = { X: 1570, Y: 800, n: 4, th: 30 }, S3BOOKC = [mix(P.purple, P.ink, .25), mix(P.ribbonRed, P.ink, .3), mix(P.ribbonBlue, P.ink, .25), mix(P.green, P.ink, .3)];
const s3BookRect = j => { const w = 126 - j * 6 + 6 * hash(j, 391), d = 80 - j * 3, dx = 12 * (hash(j, 392) - .5), dy = 8 * (hash(j, 393) - .5); return [S3BOOKS.X - w + dx, S3BOOKS.Y - d + dy, S3BOOKS.X + w + dx, S3BOOKS.Y + d + dy]; };
function s3BooksShadow(g, k) { if (k <= .01) return; const [x0, y0, x1, y1] = s3BookRect(0), H = S3BOOKS.n * S3BOOKS.th * Math.min(1, k);
  s3CastShadow(g, [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, H], [x1, y0, H], [x1, y1, H], [x0, y1, H]], .3); }
function s3Books(c, V, k) {
  if (k <= .01) return;
  const { n, th } = S3BOOKS, pageCol = mix(P.cap, P.paperEdge, .25), kk = Math.min(1.08, k);
  for (let j = 0; j < n; j++) {
    const [x0, y0, x1, y1] = s3BookRect(j), h0 = j * th * kk, h1 = h0 + th * kk, col = S3BOOKC[j], bd = 4 * kk;
    const pts = rectPts(x0, y0, x1 - x0, y1 - y0, 3);
    // 书身：侧面先整体画成书口的纸色
    const R = s3Prism(c, V, pts, h0, h1, { side: [pageCol, mix(pageCol, P.g2, .3)], sideAl: 1, top: mix(col, '#ffffff', .12), topAl: 1, dark: .38, light: .12 });
    R.sides.forEach(s => {
      const q = (ha, hb) => polyPath(s3PP(V, [[s.a[0], s.a[1], ha], [s.b[0], s.b[1], ha], [s.b[0], s.b[1], hb], [s.a[0], s.a[1], hb]]));
      const shade = (1 - s.lit) * .38;
      if (s.nx < -.7) {   // 书脊：整面布纹色 + 两道金线
        c.fillStyle = mix(col, '#000000', shade * .6); c.fill(q(h0, h1));
        for (const f of [.25, .75]) { const a = s3P(V, s.a[0], s.a[1], lerp(h0, h1, f)), b = s3P(V, s.b[0], s.b[1], lerp(h0, h1, f)); rline(c, [[a[0], a[1]], [b[0], b[1]]], { w: 2 * a[2], color: mix(P.moon, '#000', shade * .5), seed: 3940 + j, amp: .1 }); }
      } else {            // 书口：上下封面板 + 页边线
        c.fillStyle = mix(col, '#000000', shade * .7); c.fill(q(h0, h0 + bd)); c.fill(q(h1 - bd, h1));
        c.save(); c.strokeStyle = alpha(mix(P.paperEdge, P.ink, .3), .55); c.lineWidth = .9;
        for (let r = 1; r < 5; r++) { const hh = lerp(h0 + bd, h1 - bd, r / 5), a = s3P(V, s.a[0], s.a[1], hh), b = s3P(V, s.b[0], s.b[1], hh); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        c.restore();
      }
    });
    // 顶面：封面上一块压印的标签 + 靠光那边一道亮边
    if (j === n - 1 || true) { const lab = s3PP(V, [[x0 + 30, y0 + 30, h1], [x0 + 110, y0 + 30, h1], [x0 + 110, y0 + 70, h1], [x0 + 30, y0 + 70, h1]]);
      c.save(); c.globalAlpha = .5; c.strokeStyle = mix(P.moon, col, .3); c.lineWidth = 1.5; c.stroke(polyPath(lab)); c.restore(); }
    const e0 = s3P(V, x0 + 3, y1, h1), e1 = s3P(V, x0 + 3, y0 + 4, h1), e2 = s3P(V, x1 - 4, y0 + 4, h1);
    rline(c, [[e0[0], e0[1]], [e1[0], e1[1]], [e2[0], e2[1]]], { w: 1.8, color: alpha('#ffffff', .45), seed: 3945 + j, amp: .15 });
  }
}

// ===================== 水桶、飞着的水 =====================
function s3Bucket(c, mouth, rot, k) {
  if (k <= .01) return;
  const [x, y] = mouth, body = mix(P.shelf2, P.paper2, .28), hoop = mix(P.g3, P.ink, .2);
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  cutPaper(c, [[-46, 0], [46, 0], [36, 84], [-36, 84]], body, { seed: 3721, step: 12, blur: 5, sy: 3 });
  for (const yy of [16, 64]) { const hw = 46 - yy * 10 / 84; rline(c, [[-hw, yy], [hw, yy]], { w: 6, color: hoop, seed: 3722 + yy, amp: .3 }); }
  for (const xx of [-18, 8, 28]) rline(c, [[xx * 1.05, 4], [xx * .8, 80]], { w: 1.3, color: alpha(P.ink, .35), seed: 3730 + xx, amp: .3 });
  c.fillStyle = S3WATER; c.beginPath(); c.ellipse(0, 1, 44, 8, 0, 0, TAU); c.fill();
  rline(c, ellPts(0, 1, 46, 9, 24), { w: 2.4, color: hoop, close: true, seed: 3725, amp: .3 });
  c.restore();
}
function s3Slug(c, x, y, r, ang, al = 1) {
  if (r <= 1 || al <= 0) return;
  c.save(); c.globalAlpha *= al * .85; c.translate(x, y); c.rotate(ang);
  const pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, tail = Math.max(0, -Math.cos(a)); pts.push([Math.cos(a) * r * (1 + tail * .9), Math.sin(a) * r * (.7 - tail * .25)]); }
  cutPaper(c, pts, S3WATER, { seed: 3740, step: 10, blur: 4, grain: .04 });
  c.fillStyle = alpha('#ffffff', .6); c.beginPath(); c.ellipse(r * .3, -r * .25, r * .22, r * .1, 0, 0, TAU); c.fill();
  c.restore();
}
function s3Arc(a, b, lift, u) { const m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift], v = 1 - u;
  return [v * v * a[0] + 2 * v * u * m[0] + u * u * b[0], v * v * a[1] + 2 * v * u * m[1] + u * u * b[1], Math.atan2(2 * v * (m[1] - a[1]) + 2 * u * (b[1] - m[1]), 2 * v * (m[0] - a[0]) + 2 * u * (b[0] - m[0]))]; }
// 大泼（屏幕上）：水团飞过去 → 盖住冰雕 → 顺着冰雕前面往下淌。返回要画在角色前面的水团
function s3BigSplash(c, V, tau, mouth, hT) {
  const B = S3B, u = (tau - B.big) / B.bigDur; if (u <= 0 || u >= 1) return null;
  const [x0, y0, x1, y1] = S3FP, tgt = s3P(V, 980, 520, hT + 150);
  const cover = sm(.14, .3, u, easeOut) * (1 - sm(.36, .62, u));
  if (cover > 0) { const q = s3PP(V, [[x0 + 60, y0 + 40, hT + 160], [x1 - 60, y0 + 40, hT + 160], [x1 - 20, y1, hT + 40], [x0 + 20, y1, hT + 40]]);
    const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[2][1]) / 2;
    s3Sheet(c, cx, cy + 60 * sm(.3, .6, u), (q[2][0] - q[3][0]) * .42 * cover, (q[2][1] - q[0][1]) * .5 * cover, .4, 3752); }
  if (u > .14 && u < .45) for (let k = 0; k < 14; k++) { const v = sm(.14, .45, u, easeOut), an = hash(k, 375) * TAU, d = (260 + 320 * hash(k, 376)) * tgt[2];
    const x = tgt[0] + Math.cos(an) * d * v * 1.3, y = tgt[1] + Math.sin(an) * d * v * .6 + 200 * v * v, r = (5 + 7 * hash(k, 377)) * tgt[2];
    c.save(); c.globalAlpha *= .7 * (1 - sm(.3, .45, u)); c.fillStyle = S3WATER; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); }
  // 冰雕前面往下淌的水
  for (let k = 0; k < 12; k++) { const X = x0 + 40 + k * (x1 - x0 - 80) / 11, a = s3P(V, X, y1, 170), b = s3P(V, X, y1, 0), t0 = .22 + .1 * hash(k, 379), p = sm(t0, t0 + .3, u, x => x);
    s3Streak(c, a[0], a[1], p, (9 + 8 * hash(k, 381)) * a[2], 1 - sm(.55, .8, u), 3770 + k, b[1]); }
  if (u < .2) { const v = sm(0, .2, u, x => x), [x, y, ang] = s3Arc(mouth, tgt, 160 * tgt[2], v); return () => s3Slug(c, x, y, lerp(22, 70, v) * tgt[2], ang, 1); }
  return null;
}
// 小泼：一小团水落到冰顶上，铺成一层水膜，冻住（冰层在 s3Ice 里长），冰星一闪
function s3SmallSplash(c, V, tau, mouth, t0, hT) {
  const D = S3B.smallDur, u = (tau - t0) / D; if (u <= 0 || u >= 1.2) return null;
  const tgt = s3P(V, 980, 530, hT + 4), [x0, y0, x1, y1] = s3Lay(Math.max(0, Math.round(hT / S3TH)));
  if (u > .5) for (let k = 0; k < 8; k++) { const p = s3P(V, lerp(x0, x1, hash(k, 391 + (t0 | 0))), lerp(y0, y1, hash(k, 392)), hT + 6), s = Math.sin(clamp((u - .5 - k * .04) / .5, 0, 1) * Math.PI);
    sparkle(c, p[0], p[1], 20 * s * p[2], { color: EP2_FROST, rot: k }); }
  if (u < .26) { const v = sm(0, .26, u, x => x), [x, y, ang] = s3Arc(mouth, tgt, 110 * tgt[2], v); return () => s3Slug(c, x, y, lerp(14, 34, v) * tgt[2], ang, 1); }
  return null;
}
// 太阳底下，最上面那层滴水：沿冰顶前沿一串水滴往下掉到书页
function s3Drips(c, V, tau, hT, lay) {
  const B = S3B; if (tau < B.melt[0]) return;
  const a = 1 - sm(B.block[0], B.block[0] + .4, tau), [x0, , x1, y1] = lay;
  for (let k = 0; k < 10; k++) {
    const X = lerp(x0 + 40, x1 - 40, (k + .5) / 10) + 16 * hash(k, 398), per = .9 + .5 * hash(k, 399), ph = (tau - B.melt[0] - hash(k, 400) * .8) / per;
    if (ph < 0) continue; const u = ph - Math.floor(ph), top = s3P(V, X, y1, hT), bot = s3P(V, X, S3FP[3] + 16, 0);
    const r = (6 + 6 * sm(0, .5, u)) * top[2], y = top[1] + 6 + (u < .5 ? 4 * u : 4 + (bot[1] - top[1]) * Math.pow((u - .5) / .5, 2)), al = a * (1 - sm(.85, 1, u));
    c.save(); c.globalAlpha *= al * .8; c.fillStyle = S3WATER; c.beginPath(); c.ellipse(top[0], y, r * .8, r * (u < .5 ? 1.2 : 1.5), 0, 0, TAU); c.fill(); c.restore();
  }
}
// 影子（画在书页上）：一块软的椭圆
// 角色的影子：一条顺着光方向拉长的软影（h 是脚离书页的高度；h < 0 = 坐在别的东西上，不画）
function s3CharShadow(g, X, Y, h, H, al) {
  if (h < 0) return; const a = [X + h * S3SH[0], Y + h * S3SH[1]], b = [X + (h + H * .8) * S3SH[0], Y + (h + H * .8) * S3SH[1]], an = Math.atan2(b[1] - a[1], b[0] - a[0]), l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  g.save(); g.globalAlpha *= al * (1 - sm(150, 500, h)); g.fillStyle = '#2a1c16'; g.translate(a[0], a[1]); g.rotate(an); g.beginPath(); g.ellipse(l * .45, 0, l * .55, 34, 0, 0, TAU); g.fill(); g.restore(); }
function s3Shadow(g, x, y, rx, ry, al) { if (al <= .01) return; g.save(); g.globalAlpha *= al; g.fillStyle = '#2a1c16'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.restore(); }

// ===================== 两个人的走位 =====================
// 帕秋莉：站位 → 走到右边 → 跳上书堆坐着看 → 段末飘回站位
function s3PchAt(tau) {
  const B = S3B, [a, b] = B.walk, C = NET.cast.pch, seat = [S3BOOKS.X - 20, S3BOOKS.Y + 70, S3BOOKS.th * 4], stop = [S3BOOKS.X - 10, 900];
  if (tau < a) return { X: C.x, Y: C.y, h: 0, pose: C.pose, facing: 1, cast: true };
  if (tau < b) { const u = sm(a, b, tau, x => easeIO(x) * .3 + x * .7), st = twos(tau) * 9;
    return { X: lerp(C.x, stop[0], u), Y: lerp(C.y, stop[1], u), h: 7 * Math.abs(Math.sin(st)), pose: 'stand', facing: 1, tilt: .05 * Math.sin(st) }; }
  const [r0, r1] = B.ret;
  if (tau < r0) { const hp = sm(b, b + B.hop, tau);
    if (hp < 1) return { X: lerp(stop[0], seat[0], hp), Y: lerp(stop[1], seat[1], hp), h: lerp(0, seat[2], hp) + 60 * Math.sin(hp * Math.PI), pose: hp < .6 ? 'stand' : 'sit', facing: hp < .6 ? 1 : -1 };
    return { X: seat[0], Y: seat[1], h: seat[2], pose: 'sit', facing: -1 }; }
  if (tau < r1) { const u = sm(r0, r1, tau);
    return { X: lerp(seat[0], C.x, u), Y: lerp(seat[1], C.y, u), h: lerp(seat[2], 0, sm(.6, 1, u)) + 70 * Math.sin(u * Math.PI), pose: 'stand', facing: u < .92 ? -1 : 1, float: true }; }
  return { X: C.x, Y: C.y, h: 0, pose: C.pose, facing: 1, cast: true };
}
// 琪露诺：站位 → 飞到冰雕上空（泼水）→ 落到冰顶上站着 / 睡着 → 段末飞回站位
const S3HOV = [1230, 640, 180], S3PERCH = [1150, 660];
function s3CirAt(tau, hT) {
  const B = S3B, C = NET.cast.cir, [f0, f1] = B.fly, [l0, l1] = B.land, [r0, r1] = B.cirRet, bob = 10 * Math.sin(tau * 2.4);
  if (tau < f0 || tau >= r1) return { X: C.x, Y: C.y, h: 0, pose: 'stand', cast: true };
  if (tau < f1) { const u = sm(f0, f1, tau); return { X: lerp(C.x, S3HOV[0], u), Y: lerp(C.y, S3HOV[1], u), h: lerp(0, S3HOV[2], u) + 80 * Math.sin(u * Math.PI), pose: 'fly' }; }
  if (tau < l0) return { X: S3HOV[0], Y: S3HOV[1], h: S3HOV[2] + bob * sm(f1, f1 + .5, tau), pose: 'fly' };
  if (tau < l1) { const u = sm(l0, l1, tau); return { X: lerp(S3HOV[0], S3PERCH[0], u), Y: lerp(S3HOV[1], S3PERCH[1], u), h: lerp(S3HOV[2], hT, u) + 40 * Math.sin(u * Math.PI), pose: u < .85 ? 'fly' : 'stand' }; }
  if (tau < r0) return { X: S3PERCH[0], Y: S3PERCH[1], h: hT, pose: 'stand', perch: true };
  const u = sm(r0, r1, tau); return { X: lerp(S3PERCH[0], C.x, u), Y: lerp(S3PERCH[1], C.y, u), h: lerp(hT, 0, u) + 120 * Math.sin(u * Math.PI), pose: u < .9 ? 'fly' : 'stand' };
}

scene({ order: 3, key: 'consolidate', title: '巩固', dur: S3DUR, lines: S3LINES,
  fn(c, tau, L) {
    const B = S3B;
    const pMood = moodOf(L, 'patchouli'), pMouth = mouthOf(L, 'patchouli'), cMouth = mouthOf(L, 'cirno');
    // ---------- 最后一帧（和之后的静止）：只有一滴水 + 两人站位 ----------
    if (tau >= B.drop[1]) {
      spread(c, tau);
      waterDrop(c, EP2.drop.x, EP2.drop.y, NET.dropR);
      drawPatchouli(c, { ...NET.cast.pch, mood: pMood, mouth: pMouth, blink: blinkAt(tau), t: tau });
      drawCirno(c, { ...NET.cast.cir, mood: moodOf(L, 'cirno'), mouth: cMouth, blink: blinkAt(tau, 2), t: tau });
      return;
    }
    const V = s3View(tau), ice = s3Ice(tau), block = sm(B.block[0], B.block[1], tau), drop = sm(B.drop[0], B.drop[1], tau, x => x);
    const parts = 1 - sm(0, .6, block), stackAl = 1 - sm(0, .35, block), hT = s3Top(ice), gone = 1 - sm(B.out[0], B.out[1], tau);
    const flatAl = 1 - sm(B.rise, B.rise + .45, tau);
    const night = sm(B.night[0], B.night[1], tau) * (1 - sm(B.sun[0], B.sun[1], tau)), day = sm(B.sun[0], B.sun[1], tau) * (1 - sm(B.flat[0], B.flat[0] + 1.2, tau));
    const booksK = easeOutBack(sm(B.books[0], B.books[1], tau)) * (1 - sm(B.booksOut[0], B.booksOut[1], tau));
    const rulK = easeOutBack(sm(B.ruler[0], B.ruler[1], tau), 1.6) * (1 - sm(B.out[0], B.out[1] + .2, tau));
    const pch = s3PchAt(tau), cir = s3CirAt(tau, hT);
    const sh = win(B.shake[0], B.shake[1], tau, .12), tt = twos(tau), jit = [2.2 * sh * noise1(tt * 16, 1), 1.6 * sh * noise1(tt * 16, 2)];

    // ---------- 屋子、桌子、书页 ----------
    s3Room(c, V, tau, { night: Math.max(night, sm(B.night[0], B.night[1], tau) * (1 - day)), sun: day });
    s3Desk(c, V);
    s3Ground(c, V, g => {
      pageHeader(g, '第三页 · 一层一层冻结实', tau, B.head[0], { t1: B.head[1] });
      s3FormBox(g, tau);
      const rest = netRest(); rest.lines.forEach(l => { l.label = ''; });
      // 输入的名字一直印在页上（圆牌立起来以后，名字留在它脚下）
      rest.lines.forEach((l, i) => { const [x, y] = netTok(i); zh(g, NET.names[l.kind], x, y + NET.inR + 34 + 40 * (1 - flatAl), { size: 28, color: P.ink2, align: 'center', al: gone * parts }); });
      if (flatAl > 0) fade(g, flatAl, () => { g.save(); g.translate(jit[0], jit[1]); netDraw(g, rest, tau); g.restore(); s3Cracks(g, tau, rest.lines, jit, 1); });
      // 立起来的东西的影子
      const rk = 1 - flatAl;
      if (rk > 0 && parts > 0 && !V.flat) {
        const cs = (x, Y, w, H, a) => s3CastShadow(g, [[x - w / 2, Y, 0], [x + w / 2, Y, 0], [x - w / 2, Y, H], [x + w / 2, Y, H]], a);
        S3TOKH.forEach(([x, y]) => cs(x, y, 100, NET.inR * 2, .13 * rk * parts)); cs(S3NODEH[0], S3NODEH[1], 130, NET.node.r * 2, .13 * rk * parts); cs(S3CARDH[0], S3CARDH[1], 172, NET.real.h, .13 * rk * parts); }
      // 冰的影子：偏蓝、顺着光落到右前方；贴着书页一圈深色接触阴影
      if (ice > .05 && stackAl > 0) { const [x0, y0, x1, y1] = S3FP, H = s3Top(ice), a = stackAl * Math.min(1, ice * 2);
        s3CastShadow(g, [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0 + 56, y0 + 56, H], [x1 - 56, y0 + 56, H], [x1 - 56, y1 - 56, H], [x0 + 56, y1 - 56, H]], .2 * a, '#27415a');
        const ring = polyPath(rectPts(x0, y0, x1 - x0, y1 - y0, 26)); g.save(); g.strokeStyle = '#18222e'; g.globalAlpha = .14 * a; g.lineWidth = 12; g.stroke(ring); g.globalAlpha = .32 * a; g.lineWidth = 3.5; g.stroke(ring); g.restore(); }
      if (!V.flat) { s3BooksShadow(g, booksK); s3RulShadow(g, rulK, .24); s3CalIceShadow(g, tau);
        s3CharShadow(g, pch.X, pch.Y, pch.pose === 'sit' ? -1 : pch.h, 500, .15);
        if (!cir.cast || cir.h > 0) s3CharShadow(g, cir.X, cir.Y, cir.perch ? -1 : cir.h, 440, .15); }
      s3BigGround(g, tau);
      s3MeltGround(g, tau);
      s3Calendar(g, tau);
      if (day > 0 && hT > 0) { g.save(); g.globalAlpha *= .22 * day * stackAl; g.fillStyle = mix(P.lamp, '#ffffff', .3); g.beginPath(); g.ellipse(980, 520, 520, 300, 0, 0, TAU); g.fill(); g.restore(); }
      s3Tag(g, tau, gone);
    });

    // ---------- 立体的东西（按深度） ----------
    const items = [];
    items.push({ z: 790, draw: () => s3Sculpt(c, V, tau, { parts: parts * (1 - flatAl * 0), ice, melt: sm(B.melt[0], B.melt[1], tau, x => x), stackAl, block, drop, iceB: s3Ice(B.block[0]) }) });
    items.push({ z: 800, draw: () => s3Drips(c, V, tau, hT, s3Lay(Math.max(0, Math.ceil(ice) - 1))) });
    items.push({ z: S3RUL.Y, draw: () => s3Ruler(c, V, tau, rulK) });
    items.push({ z: s3CalRow(0), draw: () => s3CalIce(c, V, tau) });
    items.push({ z: S3BOOKS.Y + 40, draw: () => s3Books(c, V, booksK) });

    // 琪露诺的姿势（水桶要用她的锚点）
    const hasBucket = tau > B.bucket[0] && tau < B.putAway[1];
    const bigG = key(tau, [[B.big - .35, 0], [B.big, 1], [B.big + .9, 1], [B.big + 1.5, .1]]);
    const smallG = Math.max(...B.small.map(t0 => key(tau, [[t0 - .2, .1], [t0, .6], [t0 + .5, .6], [t0 + .8, .1]])));
    const asleep = cir.perch && tau > B.sleep[0] && tau < B.sleep[1], melting = tau > B.melt[0] + .3 && tau < B.block[0] + .3;
    const bu = (tau - B.big) / B.bigDur;
    const cPose = cir.cast ? 'stand' : hasBucket ? 'throw' : asleep ? 'slump' : cir.pose;
    const cG = cir.cast ? NET.cast.cir.gesture : hasBucket ? (tau < B.small[0] - .3 ? bigG : smallG) : undefined;
    const cMood = L.who === 'cirno' ? moodOf(L, 'cirno') : bu > .25 && bu < 1.05 ? 'surprised' : melting ? 'cry' : hasBucket ? 'happy' : 'normal';
    const cp = s3P(V, cir.X, cir.Y, cir.h), cFace = cir.cast || tau < B.fly[0] + .3 ? -1 : cir.perch || tau > B.land[0] ? -1 : -1;
    const cirArgs = cir.cast && V.flat ? { ...NET.cast.cir, mood: cMood, mouth: cMouth, blink: blinkAt(tau, 2), t: tau }
      : { x: cp[0], y: cp[1], h: 440 * cp[2], facing: cFace, pose: cPose, gesture: cir.cast ? NET.cast.cir.gesture : cG, mood: cMood, mouth: cMouth, blink: asleep ? 1 : blinkAt(tau, 2), t: tau };
    let mouth = [cp[0] - 92 * cp[2], cp[1] - 256 * cp[2]];
    if (hasBucket) { c.save(); c.globalAlpha = 0; mouth = drawCirno(c, cirArgs).hold; c.restore(); }
    const flyWater = [];
    items.push({ z: 805, draw: () => { const f = s3BigSplash(c, V, tau, mouth, hT); if (f) flyWater.push(f);
      B.small.forEach(t0 => { const g = s3SmallSplash(c, V, tau, mouth, t0, hT); if (g) flyWater.push(g); }); } });

    // 帕秋莉
    const pp = s3P(V, pch.X, pch.Y, pch.h);
    const pointing = (tau > B.tag[0] - .2 && tau < S3E(0)) || (tau > B.crack[0] && tau < B.shake[1] + .2);
    const ges = key(tau, [[0, .35], [B.box[0] - .2, .35], [B.box[0] + .3, .75], [B.box[1] + .3, .75], [B.box[1] + .7, .35]]);
    const pArgs = pch.cast && V.flat ? { ...NET.cast.pch, pose: pointing ? 'point' : 'lecture', gesture: pointing ? .7 : ges, mood: pMood, mouth: pMouth, blink: blinkAt(tau), t: tau }
      : { x: pp[0], y: pp[1], h: 500 * pp[2], facing: pch.facing, pose: pch.cast ? 'lecture' : pch.pose, gesture: pch.cast ? .35 : undefined, tilt: pch.tilt || 0, mood: pMood, mouth: pMouth, blink: blinkAt(tau), t: tau };
    items.push({ z: pch.Y + 30, draw: () => drawPatchouli(c, pArgs) });
    // 琪露诺 + 水桶
    items.push({ z: cir.cast ? cir.Y : cir.h > 60 || cir.perch ? 850 : cir.Y, draw: () => {
      if (cir.perch) { const q = s3P(V, cir.X, cir.Y, cir.h); c.save(); c.globalAlpha = .25; c.fillStyle = mix(EP2_ICE_DEEP, P.ink, .3); c.beginPath(); c.ellipse(q[0] + 6 * q[2], q[1], 62 * q[2], 13 * q[2], 0, 0, TAU); c.fill(); c.restore(); }
      const a = drawCirno(c, cirArgs);
      if (tau > B.fly[0] && tau < B.fly[1] + .4) { const u = (tau - B.fly[0]) / (B.fly[1] + .4 - B.fly[0]);
        for (let k = 0; k < 4; k++) { const s = Math.sin(clamp(u * 1.6 - k * .15, 0, 1) * Math.PI), an = -2.4 + k * 1.1; sparkle(c, a.head[0] + Math.cos(an) * 150 * cp[2], a.head[1] + Math.sin(an) * 120 * cp[2], 16 * s * cp[2], { color: EP2_FROST, rot: k }); } }
      if (hasBucket) { const k = sm(B.bucket[0], B.bucket[1], tau, easeOutBack) * (1 - sm(B.putAway[0], B.putAway[1], tau)), [h0, h1] = a.hands, rot = Math.atan2(h1[1] - h0[1], h1[0] - h0[0]) - cG * 1.25 * (cFace < 0 ? -1 : 1);
        s3Bucket(c, a.hold, rot, k * .82 * cp[2]); }
      if (asleep) for (let k = 0; k < 3; k++) { const u = ((tau - B.sleep[0]) * .6 + k / 3) % 1; zh(c, 'z', a.head[0] + (40 + 50 * u) * cp[2], a.head[1] - (60 + 90 * u) * cp[2], { size: (22 + 16 * u) * cp[2], color: alpha(EP2_FROST, 1 - u) }); }
    } });
    items.sort((a, b) => a.z - b.z).forEach(it => it.draw());
    flyWater.forEach(f => f());

    // ---------- 夜色 / 阳光 ----------
    if (night > 0 && !V.flat) {
      c.save(); c.globalAlpha = .5 * night; c.fillStyle = '#141a33'; c.fillRect(0, 0, W, H); c.restore();
      s3Glass(c, V, tau, { night: 1, sun: 0 }, night);
      // 月光：窗 → 冰雕，一道很淡的冷光；冰雕自己长的那层一闪
      const q = s3PP(V, [[S3WIN.x0, S3WALL, S3WIN.h1], [S3WIN.x1, S3WALL, S3WIN.h1], [1380, 700, hT], [560, 700, hT]]);
      c.save(); c.globalAlpha = .1 * night; c.fillStyle = '#cfe2ff'; c.fill(polyPath(q)); c.restore();
      const gw = Math.sin(clamp((tau - B.grow8[0]) / (B.grow8[1] - B.grow8[0] + .4), 0, 1) * Math.PI);
      if (gw > 0) for (let k = 0; k < 6; k++) { const [x0, y0, x1, y1] = s3Lay(7), p = s3P(V, lerp(x0, x1, hash(k, 395)), lerp(y0, y1, hash(k, 396)), hT + 4); sparkle(c, p[0], p[1], 24 * gw * p[2], { color: EP2_FROST, rot: k }); }
    }
    if (day > 0 && !V.flat) {
      const q = s3PP(V, [[S3WIN.x0, S3WALL, S3WIN.h1], [S3WIN.x1, S3WALL, S3WIN.h1], [S3WIN.x1, S3WALL, S3WIN.h0], [1500, 780, hT], [460, 780, hT], [S3WIN.x0, S3WALL, S3WIN.h0]]);
      c.save(); c.globalAlpha = .2 * day; c.fillStyle = mix(P.lamp, '#fff6d8', .5); c.fill(polyPath(netHull(q))); c.restore();
    }
  },
});
