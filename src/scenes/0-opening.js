'use strict';
// 第 0 段：开场（魔导书编配，照抄第 1 集 v3 的故事书开场，压到第一句台词前约 3.8 秒）。
//   0–1.5 秒：斜看桌上的厚魔导书，镜头转到正上方，金墨画出双框、角花、七曜阵和「帕秋莉讲座 · 第 2 集」。
//   铜扣「咔」地弹开 → 封面带透视翻开，直接落成摊开的书：封面内侧就是左页（淡墨七曜阵、帕秋莉已经站在上面看书），
//   右页是扉页「从 9 分到 90 分」「笨蛋都能懂的学习公式」（封面底下早就印好）。没有衬纸、没有翻空白页。
//   3.1 秒：琪露诺从画面右外冲进来（冰晶和寒气拖尾），把一张结冰的 9 分试卷「啪」地拍在摊开的书上（EP2.exam），扉页收掉。
//   L1「卷子都结冰了」试卷冒寒气；L2 琪露诺「最强」蹦一下、拳头边迸出冰晶；L3 帕秋莉袖口亮起一个小魔法阵又「噗」地灭掉；
//   L4「但有一个公式」试卷上的霜花亮一下（预告第 1 段霜花长成网络），不画公式。
//
// 【交接给第 1 段】最后约 1 秒画面静止，严格是：
//   spread(c, tau)
//   examPaper(c, { score: 9, frost: 1 })                       // 默认位置 EP2.exam，其余默认参数
//   drawPatchouli(c, { ...EP2.pch, pose: 'lecture', mood: 'normal', mouth: 0, blink: blinkAt(tau), t: tau })   // 不传 look/gesture/facing（默认朝右）
//   drawCirno(c, { ...EP2.cir, pose: 'stand', mood: 'normal', mouth: 0, blink: blinkAt(tau, 2), t: tau })
// 书页上没有页眉、没有别的东西。
// 顶层名字一律带本段前缀 S0 / s0。
const S0LINES = seq(3.8, [
  ['帕秋莉！我考了 9 分！满分 100！', { who: 'cirno', mood: 'proud', dur: 3.4 }],
  ['……卷子都结冰了。', { mood: 'annoyed', dur: 2.0 }],
  ['快教我变聪明的魔法！我可是最强的！', { who: 'cirno', mood: 'proud' }],
  ['变聪明没有魔法。这句话由魔法使来说，应该够有说服力。', { mood: 'smug', hold: .4 }],
  ['但有一个公式。今天只讲它。', { hold: .6 }],
]);
const s0T = i => S0LINES[i][0], s0E = i => S0LINES[i][1];
const S0DUR = seqEnd(S0LINES) + 1.1;

// 前 3.8 秒的节拍（秒）
const S0H = {
  crane: 1.5,                                                            // 镜头从斜看转到正上方
  frame: .05, flour: .3, ring: .2, star: .45, glyph: .72, glyphStep: .07, moon: 1.05, rule: 1.1, title: 1.15, sub: 1.45, glint: 1.62,   // 金墨
  pop: 1.72, snap: 2.08,                                                 // 铜扣：舌片弹出 → 扣带翻到封面上
  open0: 2.08, open1: 2.85,                                              // 封面翻开（镜头同时平移到整本摊开），落下就是扉页和帕秋莉
  fly0: 3.1, slap: 3.7,                                                  // 琪露诺冲进来，试卷拍在书上
};
const S0CW = BOOK.w / 2 + 20, S0X0 = CX - 10, S0YM = BOOK.y - 8 + (BOOK.h + 20) / 2;   // 合着的书：宽、书脊那边的 x、竖直中线
const S0EMB = { x: S0X0 + 468, y: BOOK.y + 380, r: 232 };                              // 封面七曜阵
const S0GLYPHS = ['日', '月', '火', '水', '木', '金', '土'];
// 桌上的东西（桌面坐标：正上方看、书摊开时就是屏幕坐标）。书摊开后左半边会被封面盖住，所以左边只放平的茶渍，
// 立着的东西放在书摊开后的画面外面：镜头推近时自然出画。
const S0INK = { x: 2130, y: 400 }, S0CUP = { x: 640, y: 1230 }, S0STAIN = { x: 610, y: 640, r: 58 }, S0STACK = { x: 520, y: -250 }, S0TAIL = { x: 1068, len: 92 };

// ===================== 镜头 =====================
// cam = { x, y 画面中心对着的桌面点, z 缩放, pitch 俯仰（0 = 正上方）}
function s0Cam(tau) { const u = sm(0, S0H.crane, tau, easeIO), v = sm(S0H.open0, S0H.open1, tau, easeIO), bx = S0X0 + S0CW / 2;
  return { pitch: lerp(-.78, 0, u), x: lerp(lerp(1330, bx, u), CX, v), y: lerp(lerp(565, S0YM, u), CY, v), z: lerp(lerp(.72, .94, u), 1, v) }; }
function s0Apply(c, cam) { c.translate(CX, CY); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y); }
// s0P：桌面点 (X, Y) 高 Z → 屏幕 [x, y, 缩放]。Z = 0 时和 kit 的 tiltPlane 是同一个投影
function s0P(cam, X, Y, Z = 0) { const qx = (X - cam.x) * cam.z, d = (Y - cam.y) * cam.z, zz = Z * cam.z, cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const k = 1400 / (1400 + d * sp - zz * cp); return [CX + qx * k, CY + (d * cp + zz * sp) * k, k]; }
function s0Area(q) { let s = 0; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function s0Hull(pts) { const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1)); }
function s0Ring(cam, X, Y, Z, r, n = 36) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, q = s0P(cam, X + r * Math.cos(a), Y + r * Math.sin(a), Z); o.push([q[0], q[1]]); } return o; }

// ===================== 桌面和桌上的东西 =====================
// 桌面：和 kit 的 desk() 同一套木纹线（每块 W×H、14 道），往外铺时左右隔块镜像，线在接缝处连得上；
// 正上方看、镜头在原位时和 desk() 一模一样（书摊开后 spread() 画的就是 desk()）；斜看时按透视投影，远处挤在一起
function s0Desk(c, cam) {
  c.fillStyle = WOOD; c.fillRect(0, 0, W, H);
  const hw = CX / cam.z + 40, hh = CY / cam.z + 40, flat = Math.abs(cam.pitch) < .002;
  const n0 = flat ? Math.floor((cam.x - hw) / W) : -1, n1 = flat ? Math.floor((cam.x + hw) / W) : 1, m0 = flat ? Math.floor((cam.y - hh) / H) : -2, m1 = flat ? Math.floor((cam.y + hh) / H) : 1;
  c.save(); c.strokeStyle = 'rgba(0,0,0,.25)';
  if (flat) { s0Apply(c, cam); c.lineWidth = 2; } else c.lineWidth = 2 * cam.z;
  for (let n = n0; n <= n1; n++) { const odd = n % 2 !== 0, fx = u => odd ? (n + 1) * W - u : n * W + u;
    for (let m = m0; m <= m1; m++) for (let k = 0; k < 14; k++) { const y = 30 + k * 78 + Math.sin(k * 1.7) * 12 + m * H;
      c.beginPath();
      if (flat) { const sy = CY + (y - cam.y) * cam.z; if (sy < -30 || sy > H + 30) continue; c.moveTo(fx(0), y); c.bezierCurveTo(fx(W * .3), y + 10, fx(W * .6), y - 12, fx(W), y + 6); c.stroke(); continue; }
      let vis = false;
      for (let i = 0; i <= 24; i++) { const t = i / 24, s = 1 - t, bx = 3 * s * s * t * W * .3 + 3 * s * t * t * W * .6 + t * t * t * W,
        by = s * s * s * y + 3 * s * s * t * (y + 10) + 3 * s * t * t * (y - 12) + t * t * t * (y + 6), [sx, sy] = s0P(cam, fx(bx), by);
        if (sy > -20 && sy < H + 20) vis = true; i ? c.lineTo(sx, sy) : c.moveTo(sx, sy); }
      if (vis) c.stroke(); } }
  c.restore();
  c.save(); s0Apply(c, cam); grain(c, polyPath(rectPts(cam.x - 3 * hw, cam.y - 4 * hh, 6 * hw, 8 * hh)), .1); c.restore();
}
// 远处压暗（镜头斜的时候才有）
function s0Dusk(c, pit) { const a = clamp(-pit / .78, 0, 1); if (a <= .01) return;
  const g = c.createLinearGradient(0, 0, 0, H * .45); g.addColorStop(0, alpha('#0d0908', .78 * a)); g.addColorStop(1, alpha('#0d0908', 0)); c.fillStyle = g; c.fillRect(0, 0, W, H * .45); }
function s0Shadow(c, cam, pts, a = .34) { const q = pts.map(([X, Y]) => { const p = s0P(cam, X, Y, 0); return [p[0], p[1]]; });
  c.save(); c.fillStyle = `rgba(14,8,6,${a})`; c.shadowColor = `rgba(14,8,6,${a})`; c.shadowBlur = 16 * cam.z; c.fill(polyPath(q)); c.restore(); }
function s0Cyl(c, cam, X, Y, z0, r0, r1, hh, side, top, seed) { const lo = s0Ring(cam, X, Y, z0, r0), hi = s0Ring(cam, X, Y, z0 + hh, r1);
  cutPaper(c, s0Hull([...lo, ...hi]), side, { seed, step: 18, shadow: false, grain: .08 }); cutPaper(c, hi, top, { seed: seed + 1, step: 18, shadow: false, grain: .08 }); return hi; }
// s0Box：长方体看得见的侧面（背面剔除），返回顶面四角。face(i, quad)：i = 0 远 1 右 2 近 3 左（转过 rot 之后的局部方向），quad = [下, 下, 上, 上]
function s0Box(c, cam, X, Y, z0, bw, bd, bh, rot, face) { const co = Math.cos(rot), si = Math.sin(rot), at = (u, v, z) => { const q = s0P(cam, X + u * co - v * si, Y + u * si + v * co, z); return [q[0], q[1]]; };
  const base = [[-bw / 2, -bd / 2], [bw / 2, -bd / 2], [bw / 2, bd / 2], [-bw / 2, bd / 2]], lo = base.map(([u, v]) => at(u, v, z0)), hi = base.map(([u, v]) => at(u, v, z0 + bh));
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, q = [lo[i], lo[j], hi[j], hi[i]]; if (s0Area(q) > 0) face(i, q); }
  return hi; }
const s0Lp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
// 一本书（角落那摞）：左边是书脊，其余三面是夹在两块书板之间的书页
function s0Tome(c, cam, X, Y, z0, bw, bd, bh, rot, cover, seed) {
  const top = s0Box(c, cam, X, Y, z0, bw, bd, bh, rot, (i, q) => {
    cutPaper(c, q, mix(cover, P.ink, i === 3 ? .15 : .25), { seed: seed + i, step: 30, shadow: false, grain: .1 }); if (i === 3) return;
    const [a, b, e, d] = q; cutPaper(c, [s0Lp(a, d, .2), s0Lp(b, e, .2), s0Lp(b, e, .8), s0Lp(a, d, .8)], P.paper2, { seed: seed + 10 + i, step: 40, shadow: false, grain: .1, edge: false }); });
  cutPaper(c, top, cover, { seed: seed + 5, step: 30, shadow: false, grain: .12 });
  const cen = top.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
  rline(c, top.map(p => s0Lp(p, cen, .16)), { w: 1.2, color: alpha(GRIMOIRE.gold, .5), close: true, seed: seed + 6, amp: .3 });
}
function s0Stack(c, cam) { const { x, y } = S0STACK;
  s0Shadow(c, cam, rectPts(x - 196, y - 130, 410, 290, 24));
  s0Tome(c, cam, x, y, 0, 380, 270, 54, .05, mix(P.purple, P.ink, .35), 3100);
  s0Tome(c, cam, x + 14, y - 6, 54, 340, 250, 46, -.09, mix(P.green, P.ink, .42), 3120);
  s0Tome(c, cam, x - 8, y + 4, 100, 300, 220, 40, .14, mix(P.red, P.ink, .45), 3140); }
// 墨水瓶（方玻璃瓶 + 圆瓶口 + 纸标签「墨」）和插在里面的羽毛笔
function s0Inkwell(c, cam) { const { x, y } = S0INK, glass = mix(P.night3, P.blue, .3);
  s0Shadow(c, cam, rectPts(x - 58, y - 52, 134, 130, 20));
  const top = s0Box(c, cam, x, y, 0, 118, 118, 72, .12, (i, q) => { cutPaper(c, q, mix(glass, P.ink, i === 2 ? .05 : .3), { seed: 3200 + i, step: 24, shadow: false, grain: .08 });
    if (i !== 2) return; const [a, b, e, d] = q, lb = [s0Lp(s0Lp(a, b, .22), s0Lp(d, e, .22), .2), s0Lp(s0Lp(a, b, .78), s0Lp(d, e, .78), .2), s0Lp(s0Lp(a, b, .78), s0Lp(d, e, .78), .78), s0Lp(s0Lp(a, b, .22), s0Lp(d, e, .22), .78)];
    cutPaper(c, lb, P.paper, { seed: 3204, step: 14, shadow: false, grain: .1 });
    const cx = (lb[0][0] + lb[2][0]) / 2, cy = (lb[0][1] + lb[2][1]) / 2, sz = Math.abs(lb[2][1] - lb[0][1]) * .72; if (sz > 6) zh(c, '墨', cx, cy, { size: sz, align: 'center', color: P.ink, base: 'middle' }); });
  cutPaper(c, top, mix(glass, P.cap, .12), { seed: 3205, step: 24, shadow: false, grain: .08 });
  s0Cyl(c, cam, x, y, 72, 30, 28, 24, mix(glass, P.ink, .2), mix(glass, P.cap, .1), 3210);
  cutPaper(c, s0Ring(cam, x, y, 96, 20), P.ink, { seed: 3212, step: 10, shadow: false, grain: 0, edge: false });
  // 羽毛笔：笔杆从瓶口斜向左后方立起，羽片是一片剪纸
  const b = s0P(cam, x + 4, y + 2, 92), e = s0P(cam, x - 80, y - 150, 380), dx = e[0] - b[0], dy = e[1] - b[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, A = [], B = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14, t = lerp(.24, 1, u), wv = Math.pow(Math.sin(Math.PI * lerp(.06, .94, u)), .7) * 24 * cam.z * lerp(b[2], e[2], t), px = b[0] + dx * t, py = b[1] + dy * t;
    A.push([px + nx * wv, py + ny * wv]); B.push([px - nx * wv * .7, py - ny * wv * .7]); }
  cutPaper(c, [...A, ...B.slice().reverse()], P.cap, { seed: 3220, step: 7, blur: 5, sx: 3, sy: 4, grain: .1 });
  c.save(); c.strokeStyle = alpha(P.g2, .6); c.lineWidth = 1; for (let i = 2; i < 13; i += 2) { const t = lerp(.24, 1, i / 14), px = b[0] + dx * t, py = b[1] + dy * t;
    c.beginPath(); c.moveTo(px, py); c.lineTo(A[i + 1][0], A[i + 1][1]); c.moveTo(px, py); c.lineTo(B[i + 1][0], B[i + 1][1]); c.stroke(); } c.restore();
  rline(c, [[b[0], b[1]], [e[0], e[1]]], { w: 2.4 * cam.z, color: mix(P.cap, P.g2, .45), seed: 3221, amp: .2 });
}
// 茶杯和托盘（瓷白、一道紫边），斜看时冒两缕热气
function s0Cup(c, cam, tau) { const { x, y } = S0CUP, por = P.cap, porS = mix(P.cap, P.g2, .32);
  s0Shadow(c, cam, ellPts(x + 8, y + 10, 108, 104, 32));
  s0Cyl(c, cam, x, y, 0, 94, 104, 7, porS, por, 3300);
  rline(c, s0Ring(cam, x, y, 7, 70), { w: 1.2, color: alpha(P.g2, .6), close: true, seed: 3302, amp: .3 });
  const hp = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + i / 16 * Math.PI, q = s0P(cam, x + 58 + 20 * Math.cos(a), y, 41 + 20 * Math.sin(a)); hp.push([q[0], q[1]]); }
  rline(c, hp, { w: 10 * cam.z, color: porS, seed: 3303, amp: .2 }); rline(c, hp, { w: 5 * cam.z, color: por, seed: 3303, amp: .2 });
  s0Cyl(c, cam, x, y, 7, 42, 60, 62, porS, por, 3310);
  const band = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI, q = s0P(cam, x + 55 * Math.cos(a), y + 55 * Math.sin(a), 52); band.push([q[0], q[1]]); }
  rline(c, band, { w: 5 * cam.z, color: P.purple, seed: 3312, amp: .2 });
  cutPaper(c, s0Ring(cam, x, y, 7 + 58, 53), mix(P.g3, P.moon, .3), { seed: 3313, step: 14, shadow: false, grain: .06, edge: false });
  const st = clamp(-cam.pitch / .5, 0, 1); if (st > .02) for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, q = s0P(cam, x - 12 + k * 24 + Math.sin(u * 7 + tau * 2.5 + k * 2) * 12 * u, y - 6, 78 + u * 150); pts.push([q[0], q[1]]); }
    rline(c, pts, { w: 3.5 * cam.z, color: alpha(P.cap, .42 * st), smooth: true, seed: 3320 + k, amp: .3 }); }
}
// 茶渍：桌上一圈没擦干净的印子（平的，在书摊开后的封面底下）
function s0Stain(c) { const { x, y, r } = S0STAIN; c.save(); c.lineCap = 'round';
  c.strokeStyle = alpha(P.g2, .24); c.lineWidth = 7; c.beginPath(); c.arc(x, y, r, .5, 5.9); c.stroke();
  c.strokeStyle = alpha(P.g2, .14); c.lineWidth = 4; c.beginPath(); c.arc(x + 6, y - 3, r - 6, 2.2, 7.6); c.stroke();
  c.fillStyle = alpha(P.g2, .16); c.beginPath(); c.arc(x + r * 1.1, y + r * .8, 7, 0, TAU); c.fill(); c.restore(); }
// 紫丝带：从书底下露出来的一截，躺在桌上，末端燕尾。y0 = 露出来的起点，k = 露出来的长度比例（翻页时被拽回书里）
function s0Tail(c, y0, k) { const len = S0TAIL.len * k; if (len < 2) return;
  const x = S0TAIL.x, ang = .2, dx = Math.sin(ang), dy = Math.cos(ang), nx = dy, ny = -dx, hw = 15, ex = x + dx * len, ey = y0 + dy * len;
  cutPaper(c, [[x - nx * hw, y0 - ny * hw], [x + nx * hw, y0 + ny * hw], [ex + nx * hw, ey + ny * hw], [ex - dx * 16, ey - dy * 16], [ex - nx * hw, ey - ny * hw]], P.purple, { seed: 3401, step: 16, blur: 4, sx: 2, sy: 3, grain: .1 }); }

// ===================== 封面：七曜阵和标题 =====================
// s0Sigil：七曜阵——外双圈（圈间一串小点）、一笔画成的七芒星、内圈、七个角上的曜字圆章、阵心月牙。o 里是各部分画出进度 0..1
function s0Sigil(c, x, y, r, o = {}) {
  const { color, text = color, fill = null, w = 2.6, ring = 1, star = 1, glyphs = 7, moon = 1, moonColor = P.moon, rot = 0, seed = 1, beads = true } = o;
  const r2 = r - 12, va = k => rot - Math.PI / 2 + k * TAU / 7, vx = k => x + Math.cos(va(k)) * r2, vy = k => y + Math.sin(va(k)) * r2;
  rline(c, circPts(x, y, r, 120), { w, color, close: true, p: ring, seed, amp: .4 });
  rline(c, circPts(x, y, r2, 110), { w: w * .55, color, close: true, p: clamp(ring * 1.25 - .25, 0, 1), seed: seed + 1, amp: .4 });
  if (beads && ring >= 1) { c.save(); c.fillStyle = color; for (let k = 0; k < 21; k++) if (k % 3) { const a = rot - Math.PI / 2 + k * TAU / 21; c.beginPath(); c.arc(x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6), w * .7, 0, TAU); c.fill(); } c.restore(); }
  const st = []; for (let i = 0; i <= 7; i++) { const k = (i * 3) % 7; st.push([vx(k), vy(k)]); }
  rline(c, st, { w: w * .8, color, p: star, seed: seed + 2, amp: .4 });
  rline(c, circPts(x, y, r * .33, 64), { w: w * .55, color, close: true, p: clamp(star * 1.4 - .4, 0, 1), seed: seed + 3, amp: .4 });
  const mr = r * .115;
  for (let k = 0; k < 7; k++) { const g = clamp(glyphs - k, 0, 1); if (g <= 0) continue;
    pop(c, vx(k), vy(k), easeOutBack(g), () => { if (fill) { c.fillStyle = fill; c.beginPath(); c.arc(vx(k), vy(k), mr, 0, TAU); c.fill(); }
      rline(c, circPts(vx(k), vy(k), mr, 28), { w: w * .6, color, close: true, seed: seed + 10 + k, amp: .3 });
      zh(c, S0GLYPHS[k], vx(k), vy(k) + 1, { size: mr * 1.25, align: 'center', color: text, base: 'middle' }); }); }
  if (moon > 0) drawMoonIcon(c, x, y, r * .2 * moon, moonColor, -.5);
}
// 标题下面的一道短金线（中间一粒菱形）
function s0Rule(c, x, y, p, color, seed) { if (p <= 0) return;
  rline(c, [[x - 20, y], [x - 170, y]], { w: 2, color, p, seed, amp: .3 }); rline(c, [[x + 20, y], [x + 170, y]], { w: 2, color, p, seed: seed + 1, amp: .3 });
  const k = sm(.5, 1, p, easeOutBack); if (k > 0) { c.save(); c.fillStyle = color; c.fill(polyPath([[x, y - 9 * k], [x + 9 * k, y], [x, y + 9 * k], [x - 9 * k, y]])); c.restore(); } }
// 封面上的纹样：第一帧就压印在皮面上（暗线），金墨沿着压印一笔笔画上去。tau 足够大时就是画完的封面
function s0CoverArt(c, tau) {
  const { x, y, r } = S0EMB, G = GRIMOIRE, H0 = S0H, lin = t => t, ty = BOOK.y + 810, sy = BOOK.y + 898;
  for (const [col, ox, oy] of [[alpha(P.cap, .07), 1.2, 1.6], [alpha(P.ink, .34), 0, 0]]) {
    s0Sigil(c, x + ox, y + oy, r, { color: col, w: 3.4, seed: 300, beads: false, moonColor: col });
    s0Rule(c, x + ox, BOOK.y + 690 + oy, 1, col, 330);
    zh(c, '帕秋莉讲座', x + ox, ty + oy, { size: 84, align: 'center', color: col }); zh(c, '第 2 集', x + ox, sy + oy, { size: 46, align: 'center', color: col }); }
  s0Sigil(c, x, y, r, { color: G.gold, fill: G.leather, w: 2.6, seed: 300, ring: sm(H0.ring, H0.ring + .45, tau, lin), star: sm(H0.star, H0.star + .45, tau, lin),
    glyphs: clamp((tau - H0.glyph) / H0.glyphStep, 0, 7), moon: sm(H0.moon, H0.moon + .35, tau, easeOutBack), moonColor: P.moon });
  s0Rule(c, x, BOOK.y + 690, sm(H0.rule, H0.rule + .35, tau, lin), G.gold, 330);
  zh(c, '帕秋莉讲座', x, ty, { size: 84, align: 'center', color: G.gold, p: writeP(tau, H0.title, '帕秋莉讲座', .06) });
  zh(c, '第 2 集', x, sy, { size: 46, align: 'center', color: G.gold, p: writeP(tau, H0.sub, '第 2 集', .05) });
  const gl = tau - H0.glint; if (gl > 0 && gl < .35) sparkle(c, x + r * .09, y - r * .12, 22 * Math.sin(gl / .35 * Math.PI), { color: P.cap, rot: gl * 2 });
}
const s0ClaspU = tau => sm(S0H.pop, S0H.snap, tau, t => t);
function s0Jolt(tau) { const t = tau - S0H.pop; return t > 0 && t < .3 ? Math.sin(t / .3 * Math.PI * 3) * 3.5 * (1 - t / .3) : 0; }
// 「咔」：舌片弹出的一瞬，书口外几道短线
function s0Click(c, tau) { const t = tau - S0H.pop; if (t < 0 || t > .24) return; const k = t / .24, x = S0X0 + S0CW + 4, y = S0YM;
  c.save(); c.globalAlpha *= 1 - k * k; c.strokeStyle = P.cap; c.lineWidth = 3; c.lineCap = 'round';
  for (const a of [-1.15, -.6, .6, 1.15]) { const r0 = 34 + 26 * k, r1 = r0 + 18; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke(); }
  c.restore(); }
// 合着的书在桌面上平的部分（丝带、影子、书页、封面），画在 tiltPlane 的缓冲里；ext = 朝镜头那一面在桌面上占的深度
function s0BookFlat(c, tau, ext, jolt) {
  c.save(); c.translate(0, jolt);
  // 接触影：几层淡影一圈圈往外（不用 shadowBlur，逐帧省时间），朝镜头那边拉长到厚边底下
  c.save(); c.fillStyle = 'rgba(12,6,4,.13)'; for (const g of [22, 14, 7, 2]) c.fill(polyPath(rectPts(S0X0 - 4 - g, BOOK.y + 6 - g * .5, S0CW + 8 + 2 * g, BOOK.h + 14 + ext + g * 1.4, 12 + g))); c.restore();
  s0Tail(c, BOOK.y + BOOK.h + 6 + ext * .7, 1);
  cutPaper(c, rectPts(S0X0 + 6, BOOK.y - 2, S0CW - 6, BOOK.h + 18, 6), BOOK.page2, { seed: 1210, step: 50, shadow: false, grain: .1 });
  grimoireCover(c, S0X0, S0CW, { frame: sm(S0H.frame, S0H.frame + .5, tau, t => t), flourish: sm(S0H.flour, S0H.flour + .35, tau, t => t), clasp: s0ClaspU(tau), shadow: false });
  s0CoverArt(c, tau);
  s0Click(c, tau);
  c.restore();
}
// 0 → open0：桌上合着的书，镜头从斜看转到正上方
function s0Closed(c, tau) {
  const cam = s0Cam(tau), pit = cam.pitch, T = GRIMOIRE.thick, ext = T * Math.tan(-pit), jolt = s0Jolt(tau);
  s0Desk(c, cam);
  s0Stack(c, cam);
  tiltPlane(c, b => { b.save(); s0Apply(b, cam); s0Stain(b); s0BookFlat(b, tau, ext, jolt); b.restore(); }, { pitch: pit, strip: 6 });
  if (pit < -.002) {   // 书朝镜头的那一面：厚边 + 垂下来的丝带
    const yb = BOOK.y + BOOK.h + 12 + jolt, [ax, ay] = s0P(cam, S0X0, yb), [bx, by] = s0P(cam, S0X0 + S0CW, yb), [, ey] = s0P(cam, S0X0, yb, -T);
    grimoireEdge(c, ax, ay, bx, by, ey - ay);
    const [rx, ry, rk] = s0P(cam, S0TAIL.x, yb), [, ry2] = s0P(cam, S0TAIL.x, yb, -T), hw = 15 * cam.z * rk, ym = ry + (ry2 - ry) * .45;
    cutPaper(c, [[rx - hw, ym], [rx + hw, ym], [rx + hw, ry2 + 3], [rx - hw, ry2 + 3]], P.purple, { seed: 3402, step: 20, shadow: false, grain: .1 });
  }
  s0Inkwell(c, cam); s0Cup(c, cam, tau);
  s0Dusk(c, pit);
}

// ===================== 封面翻开 =====================
// 封面内侧（翻开后在左边）：就是摊开后的左页——淡墨七曜阵和站在上面的帕秋莉，落下那一帧和 spread 一模一样
function s0Inside(c, tau) {
  c.save(); c.beginPath(); c.rect(0, 0, CX, H); c.clip(); spread(c, tau); c.restore();
  s0Frontis(c, tau, 1); s0PchIdle(c, tau);
}
// 封面翻开：封面绕书脊从右翻到左，逐列透视（翻到半空时离镜头最近、最大）。th π → 0；cam 是这时的镜头（正上方，正在平移）
const S0BUF = document.createElement('canvas');
function s0Swing(c, tau, th, cam) {
  const sc = c.getTransform().a || 1; if (S0BUF.width !== Math.round(W * sc)) { S0BUF.width = Math.round(W * sc); S0BUF.height = Math.round(H * sc); }
  const b = S0BUF.getContext('2d'); b.setTransform(sc, 0, 0, sc, 0, 0); b.clearRect(0, 0, W, H);
  const face = Math.cos(th) > 0;   // true：看到的是封面内侧（左页）；false：封面
  if (face) s0Inside(b, tau); else { grimoireCover(b, S0X0, S0CW, { clasp: 1, shadow: false }); s0CoverArt(b, 99); }
  const f = 2900, y0 = BOOK.y - 8, y1 = BOOK.y + BOOK.h + 12, step = 4, span = face ? CX - (BOOK.x - 10) : S0CW, hx = face ? CX : S0X0;
  const col = s => { const k = f / (f - s * Math.sin(th) * cam.z); return [CX + (hx - s * Math.cos(th) - cam.x) * cam.z * k, k]; };
  const shade = .36 * (1 - Math.abs(Math.cos(th))), up = [], dn = [];
  for (let s = 0; s < span; s += step) {
    const [xa, ka] = col(s), [xb, kb] = col(Math.min(span, s + step)), xs = face ? CX - s - step : S0X0 + s;
    const top = CY + (y0 - cam.y) * cam.z * ka, hh = (y1 - y0) * cam.z * ka;
    up.push([xa, top]); dn.push([xa, top + hh]); if (s + step >= span) { up.push([xb, CY + (y0 - cam.y) * cam.z * kb]); dn.push([xb, CY + (y1 - cam.y) * cam.z * kb]); }
    const dx = Math.min(xa, xb), dw = Math.abs(xb - xa) + .7; if (dw < .05) continue;
    c.drawImage(S0BUF, xs * sc, y0 * sc, step * sc, (y1 - y0) * sc, dx, top, dw, hh);
  }
  // 翻起来时整片压暗（一次填满，不逐列）
  if (shade > .01) { c.fillStyle = `rgba(20,12,10,${shade * (face ? 1 : .7)})`; c.fill(polyPath([...up, ...dn.reverse()])); }
}
// open0 → open1：封面翻开，镜头平移到整本摊开的书（open1 时正好是 spread 的画面）
function s0Opening(c, tau) {
  const cam = s0Cam(tau), th = Math.PI * (1 - sm(S0H.open0, S0H.open1, tau, easeIO));
  s0Desk(c, cam);
  c.save(); s0Apply(c, cam); s0Stain(c);
  c.save(); c.beginPath(); c.rect(CX - 12, -4000, 8000, 9000); c.clip(); spread(c, tau); s0TitlePage(c, 1); c.restore();
  s0Tail(c, BOOK.y + BOOK.h + 6, 1 - sm(S0H.open0 + .2, S0H.open1, tau));   // 丝带在翻开时被拽回书里
  const sh = Math.sin(th); if (sh > .02) { const wv = S0CW * Math.abs(Math.cos(th)) + 160, side = Math.cos(th) < 0 ? 1 : -1, g = c.createLinearGradient(CX, 0, CX + side * wv, 0);
    g.addColorStop(0, `rgba(20,12,10,${.4 * sh})`); g.addColorStop(1, 'rgba(20,12,10,0)'); c.fillStyle = g; c.fillRect(Math.min(CX, CX + side * wv), BOOK.y - 8, wv, BOOK.h + 20); }
  c.restore();
  s0Inkwell(c, cam); s0Cup(c, cam, tau);
  s0Swing(c, tau, th, cam);
}

// ===================== 扉页 =====================
// 左页：淡墨七曜阵（早就印好），慢慢转
function s0Frontis(c, tau, al) { if (al <= 0) return; const Lp = BOOK.L;
  fade(c, al, () => s0Sigil(c, Lp.x + Lp.w * .6, Lp.y + Lp.h / 2 - 60, 250, { color: alpha(P.ink, .3), text: alpha(P.ink, .5), fill: BOOK.page, w: 2.2, seed: 40,
    moonColor: alpha(P.moon, .8), rot: (tau - S0H.open0) * .12 })); }
// 花饰分隔线：两道细线从月牙往两边伸，末端卷起来
function s0Ornament(c, x, y, p = 1) {
  for (const sx of [-1, 1]) { const m = pts => pts.map(([u, v]) => [x + sx * u, y + v]);
    rline(c, spline(m([[34, 0], [120, -3], [190, 2], [226, -6], [232, -16], [222, -20], [216, -12]]), 4), { w: 2, color: P.ink2, p, seed: 2201 + sx, amp: .4 });
    rline(c, spline(m([[60, 7], [140, 9], [180, 6]]), 4), { w: 1.2, color: P.ink2, p: sm(.3, 1, p, t => t), seed: 2203 + sx, amp: .4 });
    const k = sm(.6, 1, p, easeOutBack); if (k > 0) { c.save(); c.fillStyle = P.ink2; const [dx, dy] = m([[250, -4]])[0]; c.beginPath(); c.arc(dx, dy, 3.5 * k, 0, TAU); c.fill(); c.restore(); } }
  drawMoonIcon(c, x, y - 2, 20 * sm(0, .5, p, easeOutBack), P.moon, -.5); }
// 右页：扉页（小字系列名夹在两道细线里、两行大字标题、带月牙的花饰分隔线、页底藏书处），封面翻开时已经印好
function s0TitlePage(c, al) { if (al <= 0) return; const R = BOOK.R, x = R.x + R.w / 2;
  c.save(); c.globalAlpha *= al;
  for (const [yy, lw, sd] of [[R.y + 158, 1.8, 2211], [R.y + 166, .9, 2212], [R.y + 236, .9, 2213], [R.y + 244, 1.8, 2214]]) rline(c, [[x - 240, yy], [x + 240, yy]], { w: lw, color: P.ink2, seed: sd, amp: .4 });
  zh(c, '帕秋莉讲座 · 第 2 集', x, R.y + 213, { size: 34, align: 'center', color: P.ink2 });
  zh(c, '从 9 分到 90 分', x, R.y + 405, { size: 88, align: 'center', color: P.ink });
  zh(c, '笨蛋都能懂的学习公式', x, R.y + 528, { size: 70, align: 'center', color: P.ink });
  s0Ornament(c, x, R.y + 628);
  zh(c, '红魔馆 · 地下大图书馆 藏', x, R.y + 830, { size: 28, align: 'center', color: P.ink2 });
  c.restore(); }

// ===================== 琪露诺冲进来、拍卷子 =====================
// 飞行中试卷的位置：从画面右外（高处）加速冲到 EP2.exam，中间拱起一点；k 是离书页的高度带来的放大
function s0Carry(tau) { const E = EP2.exam, u = sm(S0H.fly0, S0H.slap, tau, t => t * t);
  return { x: lerp(2330, E.x, u), y: lerp(300, E.y, u) - Math.sin(u * Math.PI) * 90, rot: lerp(.4, E.rot, u), k: lerp(1.16, 1.1, u), lift: 1 - u * .6 }; }
// 琪露诺相对试卷中心的位置（她在试卷右边、双手推着它）
const S0CIR_OFF = [300, 270];
// 试卷：拍下之前在空中（带一道离地的影子），拍下的一瞬压扁一点点再弹回；0.12 秒后就是默认参数的 examPaper
function s0Exam(c, tau) {
  const ts = S0H.slap, E = EP2.exam;
  if (tau >= ts + .12) { examPaper(c, { score: 9, frost: 1 }); return; }
  let x = E.x, y = E.y, rot = E.rot, k = 1, lift = 0;
  if (tau < ts) ({ x, y, rot, k, lift } = s0Carry(tau));
  else k = lerp(.965, 1, sm(ts, ts + .12, tau, easeOut));
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  if (lift > 0) { c.fillStyle = `rgba(20,12,10,${.2 * lift})`; c.fillRect(-E.w / 2 + 40 * lift, -E.h / 2 + 60 * lift, E.w, E.h); }
  examPaper(c, { x: 0, y: 0, rot: 0, score: 9, frost: 1 });
  c.restore();
}
// 一片小冰晶（三道交叉的短线，末端分叉）
function s0Flake(c, x, y, r, rot, a, color = EP2_ICE_DEEP) { if (a <= 0 || r <= .5) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot); c.strokeStyle = color; c.lineWidth = Math.max(1.4, r * .18); c.lineCap = 'round'; c.beginPath();
  for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3, bx = Math.cos(an) * r * .55, by = Math.sin(an) * r * .55;
    c.moveTo(0, 0); c.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    for (const s of [-.7, .7]) { c.moveTo(bx, by); c.lineTo(bx + Math.cos(an + s) * r * .32, by + Math.sin(an + s) * r * .32); } }
  c.stroke(); c.restore(); }
// 飞行的拖尾：冰晶留在原地慢慢飘落，一团团寒气（淡色圆）变大变淡
function s0Trail(c, tau) {
  const t0 = S0H.fly0, t1 = S0H.slap; if (tau < t0 || tau > t1 + 1.3) return;
  for (let k = 0; k < 14; k++) { const tk = t0 + (k + .5) * (t1 - t0) / 14, age = tau - tk; if (age < 0 || age > 1.1) continue;
    const p = s0Carry(tk), a = Math.max(0, 1 - age / 1.1) * .28; c.fillStyle = alpha(EP2_FROST, a);
    c.beginPath(); c.ellipse(p.x + S0CIR_OFF[0] + 60 + hash(k, 5) * 40, p.y + S0CIR_OFF[1] - 150 + hash(k, 6) * 120, 26 + age * 50, 18 + age * 30, 0, 0, TAU); c.fill(); }
  for (let k = 0; k < 20; k++) { const tk = t0 + (k + .3) * (t1 - t0) / 20, age = tau - tk; if (age < 0 || age > 1.2) continue;
    const p = s0Carry(tk), x = p.x + S0CIR_OFF[0] + 40 + (hash(k, 1) - .3) * 170 + age * 26, y = p.y + S0CIR_OFF[1] - 260 + hash(k, 2) * 220 + age * 60;
    s0Flake(c, x, y, 9 + hash(k, 3) * 9, age * 2.2 + k, 1 - age / 1.2); }
}
// 「啪」：书震一下、试卷四周迸出墨线和冰碴、一个手写的「啪！」
const s0SlapJolt = tau => { const u = tau - S0H.slap; return u > 0 && u < .3 ? Math.sin(u / .3 * Math.PI * 3) * 5 * (1 - u / .3) : 0; };
function s0Impact(c, tau) {
  const u = tau - S0H.slap, E = EP2.exam; if (u < 0 || u > .8) return;
  if (u < .26) { const a = 1 - u / .26; c.save(); c.strokeStyle = alpha(P.ink, .85 * a); c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
    for (let k = 0; k < 12; k++) { const an = k / 12 * TAU + .2, ex = Math.cos(an), ey = Math.sin(an), r0 = 1 / Math.max(Math.abs(ex) / (E.w / 2 + 30), Math.abs(ey) / (E.h / 2 + 30)) + u * 120, len = 40 * a + 10;
      c.moveTo(E.x + ex * r0, E.y + ey * r0); c.lineTo(E.x + ex * (r0 + len), E.y + ey * (r0 + len)); } c.stroke(); c.restore(); }
  for (let k = 0; k < 12; k++) { const a = 1 - sm(.2, .65, u, t => t); if (a <= 0) break;
    const an = hash(k, 11) * TAU, ex = Math.cos(an), ey = Math.sin(an), r0 = 1 / Math.max(Math.abs(ex) / (E.w / 2), Math.abs(ey) / (E.h / 2)), d = r0 + easeOut(clamp(u / .6, 0, 1)) * (80 + hash(k, 12) * 140);
    const x = E.x + ex * d, y = E.y + ey * d + u * u * 200, s = 8 + hash(k, 13) * 10, ro = u * 8 * (hash(k, 14) - .5) + k;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(ro); c.fillStyle = k % 2 ? EP2_ICE : EP2_FROST; c.strokeStyle = EP2_ICE_DEEP; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-s, -s * .3); c.lineTo(s * .8, -s * .6); c.lineTo(s * .2, s * .7); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  const k = sm(0, .14, u, easeOutBack), a = 1 - sm(.5, .8, u);
  if (k > 0 && a > 0) fade(c, a, () => spin(c, E.x + 300, E.y - 250, -.16, () => pop(c, E.x + 300, E.y - 250, k, () => zh(c, '啪！', E.x + 300, E.y - 225, { size: 76, align: 'center', color: P.ink, weight: 500 }))));
}
// L1：试卷冒出几缕寒气
function s0Mist(c, tau) {
  const t0 = s0T(1) - .2, t1 = s0T(2) + .3; if (tau < t0 || tau > t1) return; const E = EP2.exam, a = Math.min(sm(t0, t0 + .4, tau), 1 - sm(t1 - .5, t1, tau));
  for (let k = 0; k < 3; k++) { const x0 = E.x - 120 + k * 120, ph = tau * 1.6 + k * 1.3, pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x0 + Math.sin(u * 5 + ph) * 14 * u + k * 6 * u, E.y - E.h / 2 + 30 - u * (110 + 30 * Math.sin(ph * .7))]); }
    rline(c, pts, { w: 5, color: alpha(EP2_ICE_DEEP, .55 * a), smooth: true, seed: 3501 + k, amp: .4 }); }
}
// L4「但有一个公式」：试卷上的霜花亮一下（霜花会在第 1 段长成网络，这里只是一闪的预告）
function s0Glint(c, tau) {
  const lt = tau - s0T(4), g = win(.45, 2.1, lt, .4); if (g <= 0) return; const E = EP2.exam;
  c.save(); c.translate(E.x, E.y); c.rotate(E.rot);
  c.beginPath(); c.rect(-E.w / 2, -E.h / 2, E.w, E.h); c.clip();
  c.fillStyle = alpha(EP2_FROST, .4 * g); c.fillRect(-E.w / 2, -E.h / 2, E.w, E.h);
  // 同一丛霜花（和 examPaper 同样的种子）再描一遍，叠亮
  c.globalAlpha *= g; for (let k = 0; k < 4; k++) ep2Frost(c, (k % 2 ? 1 : -1) * E.w / 2, (k < 2 ? -1 : 1) * E.h / 2, Math.atan2(-(k < 2 ? -1 : 1), -(k % 2 ? 1 : -1)), Math.min(E.w, E.h) * .5, 1, 3301 + 40 + k);
  for (let k = 0; k < 4; k++) { const sx = k % 2 ? 1 : -1, sy = k < 2 ? -1 : 1, an = Math.atan2(-sy, -sx);
    for (let j = 0; j < 3; j++) { const d = 60 + j * 70 + hash(k * 3 + j, 21) * 20, tw = .5 + .5 * Math.sin(tau * 8 + k * 2 + j * 1.7);
      const px = sx * E.w / 2 + Math.cos(an) * d, py = sy * E.h / 2 + Math.sin(an) * d, rr = (16 + 12 * hash(k + j, 22)) * tw;
      sparkle(c, px, py, rr * 1.3, { color: EP2_ICE_DEEP, rot: .3 }); sparkle(c, px, py, rr, { color: '#ffffff', rot: .3 }); } }
  c.restore();
}
// 琪露诺（L2「我可是最强的」的时候拳头边迸出几片冰晶）
function s0Cirno(c, tau, L) {
  const ts = S0H.slap, T = s0T, E = EP2.cir; if (tau < S0H.fly0) return;
  const mouth = mouthOf(L, 'cirno'), blink = blinkAt(tau, 2);
  if (tau >= s0E(4)) { drawCirno(c, { ...NET.cast.cir, mood: 'normal', mouth: 0, blink, t: tau }); return; }   // 交接帧（和网络段 NET.cast 同一姿势）
  if (tau < ts) { const p = s0Carry(tau); drawCirno(c, { x: p.x + S0CIR_OFF[0], y: p.y + S0CIR_OFF[1], h: E.h, facing: -1, pose: 'fly', mood: 'happy', mouth: 0, blink: 0, tilt: -.12, t: tau }); return; }
  // 拍完弹回自己的站位
  const f = sm(ts + .05, ts + .65, tau, easeIO), x0 = EP2.exam.x + S0CIR_OFF[0], y0 = EP2.exam.y + S0CIR_OFF[1];
  let x = lerp(x0, E.x, f), y = lerp(y0, E.y, f) - Math.sin(f * Math.PI) * 110, pose = f < .85 ? 'fly' : 'point', mood = moodOf(L, 'cirno', 'happy'), gesture = .9, look = 0, tilt = 0;
  if (tau >= T(1) && tau < T(2)) { pose = 'stand'; mood = 'happy'; }
  else if (tau >= T(2) && tau < T(3)) { const lt = tau - T(2); pose = 'proud'; gesture = sm(0, .3, lt, easeOutBack); y -= Math.abs(Math.sin(clamp((lt - .1) / .5, 0, 1) * Math.PI)) * 34; }
  else if (tau >= T(3) && tau < T(4)) { const lp = (tau - T(3)) / (s0E(3) - T(3)); pose = 'think'; mood = lp < .3 ? 'normal' : 'confused'; tilt = lp < .3 ? 0 : .1; }
  else if (tau >= T(4)) { const lt = tau - T(4); pose = 'stand'; mood = lt > .5 && lt < 2.1 ? 'surprised' : 'normal'; look = .3; }
  const r = drawCirno(c, { x, y, h: E.h, facing: E.facing, pose, mood, mouth, blink, t: tau, gesture, look, tilt });
  if (tau >= T(2) && tau < T(3) + .6) { const lt = tau - T(2) - .25, [hx, hy] = r.hands.reduce((a, b) => b[1] < a[1] ? b : a);
    for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + (k - 2.5) * .45, d = easeOut(clamp(lt / .6, 0, 1)) * (60 + hash(k, 31) * 50); s0Flake(c, hx + Math.cos(an) * d, hy + Math.sin(an) * d, 10 + hash(k, 32) * 6, lt * 3 + k, 1 - sm(.3, .9, lt, t => t)); } }
}
// 帕秋莉拍卷子之前的样子：站在左页上歪头看书（封面内侧翻下来时就画在上面）
function s0PchIdle(c, tau) { drawPatchouli(c, { ...EP2.pch, pose: 'stand', mood: 'normal', look: .7, tilt: .05, mouth: 0, blink: blinkAt(tau), t: tau }); }
// 帕秋莉：封面翻开时已经站在左页上；拍卷子时吓一跳；L3 袖口亮起一个小魔法阵又「噗」地灭掉；L4 指着试卷
function s0Patchouli(c, tau, L) {
  if (tau < S0H.slap) { s0PchIdle(c, tau); return; }
  const ts = S0H.slap, T = s0T, E = EP2.pch, mouth = mouthOf(L, 'patchouli'), blink = blinkAt(tau);
  if (tau >= s0E(4)) { drawPatchouli(c, { ...NET.cast.pch, mood: 'normal', mouth: 0, blink, t: tau }); return; }   // 交接帧（和网络段 NET.cast 同一姿势）
  let pose = 'stand', mood = 'normal', look = .7, gesture, hop = 0, tilt = 0;
  if (tau < T(1)) { mood = 'surprised'; hop = Math.sin(clamp((tau - ts) / .32, 0, 1) * Math.PI) * 22; look = .9; }
  else if (tau < T(2)) { mood = 'annoyed'; look = .9; }
  else if (tau < T(3)) { pose = 'cross'; mood = 'annoyed'; look = -.3; }
  else if (tau < T(4)) { pose = 'lecture'; mood = moodOf(L, 'patchouli', 'smug'); gesture = tau - T(3) < 1.6 ? .95 : .45; look = .5; }
  else { pose = 'point'; mood = moodOf(L, 'patchouli', 'normal'); look = .8; }
  const r = drawPatchouli(c, { ...E, y: E.y - hop, pose, mood, look, gesture, tilt, mouth, blink, t: tau });
  // L3「变聪明没有魔法」：袖口上方亮起一个小魔法阵，说到「没有魔法」时缩成一点、冒一小团烟
  const lt = tau - T(3); if (lt > 0 && lt < 2.4 && r && r.tip) { const [tx, ty] = r.tip, mx = tx + 30, my = ty - 80;
    const k = sm(.15, .45, lt, easeOutBack) * (1 - sm(1.05, 1.35, lt, easeIn)); if (k > .01) magicCircle(c, mx, my, 62 * k, tau, { color: P.moon, al: .9, spin: 1.2 });
    const pf = sm(1.3, 1.45, lt, easeOutBack) * (1 - sm(1.8, 2.3, lt)); if (pf > .01) pop(c, mx, my, pf, () => [[0, 0, 18], [16, -8, 13], [-15, -5, 12], [4, -18, 10]].forEach(([a, b, rr], j) => cutPaper(c, circPts(mx + a + (lt - 1.3) * 12, my + b - (lt - 1.3) * 30, rr, 14), P.cap, { seed: 3520 + j, step: 5, blur: 3 }))); }
}

scene({ order: 0, key: 'opening', title: '开场', dur: S0DUR, lines: S0LINES, noFlip: true,
  fn(c, tau, L) {
    if (tau < S0H.open0) { s0Closed(c, tau); return; }
    if (tau < S0H.open1) { s0Opening(c, tau); return; }
    const ts = S0H.slap;
    c.save(); c.translate(0, s0SlapJolt(tau));
    spread(c, tau);
    // 扉页（试卷拍下后收走）
    const tA = 1 - sm(ts + .02, ts + .4, tau);
    if (tA > 0) { s0Frontis(c, tau, tA); s0TitlePage(c, tA); }
    if (tau >= ts) s0Exam(c, tau);
    s0Mist(c, tau); s0Glint(c, tau);
    s0Patchouli(c, tau, L);
    s0Trail(c, tau);
    s0Cirno(c, tau, L);
    if (tau < ts && tau >= S0H.fly0) s0Exam(c, tau);
    s0Impact(c, tau);
    c.restore();
  } });
