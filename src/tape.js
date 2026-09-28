'use strict';
// 八音盒纸带和证据蜡封：第 3 集全片共用的两件画具（T 包负责实现，接口由主会话定，其他包只调用、不改）。
// 场景只依赖下面写明的参数和返回值。开发用展示页 tape.html，截图 node tools/tape-shot.mjs → out/frames/tape.png。
//
// tape(c, o)  画一条八音盒打孔纸带（一个孔 = 1 比特）。o 全是纯数据：
//   x, y        纸带左端中线的位置；rot 转角（弧度）
//   cells       格子数组，每格 { bits: 比特数（可以是小数）, ch: 格子上方手写的字（可选）, hot: 0..1 红色强调（惊讶火花那一格） }
//               一格的宽度按 bits 伸缩：w = max(minW, bits × unit)，严格按比例（数据可视化，长短要准）
//               孔按 bits 取整打在格子里（整数部分是实心圆孔；小数部分再打一个更小、更淡的孔，大小和浓淡随小数部分变）
//   unit        每比特多宽（像素），默认 22；minW 一格最窄，默认 10
//   h           纸带高，默认 64；rows 孔排成几行，默认 2（孔先竖着排满一列再换下一列）
//   p           0..1 纸带从左往右「送出来」的比例（按总长）；punch 0..1 孔打出来的比例（按格子顺序，格内逐孔打，打孔时有纸屑落下）
//   roll        0..1 右端卷成一卷的程度（0 平摊，1 全部卷起，只剩一个纸卷）；卷越多纸卷越粗
//   al          整体透明度
//   可选（成品加的，不传就是默认）：
//   seed        纸边剪口的随机种子，默认 3400
//   chSize      格子上方字号，默认 34；chColor 字色，默认 P.ink；chGap 字的基线离纸带上沿多远，默认 14
//   guide       false 时不画两侧的小导孔（默认画）
//   返回 { len 纸带总长, at(i) 第 i 格中心的 [x, y]（已卷进纸卷的格子返回纸卷中心）, end 纸带可见右端的 [x, y]（有纸卷时是纸卷中心）}
//
// tapeBox(c, x, y, s, t)  八音盒本体（剪纸小木盒：打开的盒盖、铜色梳齿、左侧摇柄随 t 转），纸带从它右侧的缝里出来。
//   (x, y) 是盒子正面中心，s 缩放。出口 = (x + TAPE.box.x × s, y + TAPE.box.y × s)，缝高 TAPE.box.slit × s（放得下 h = 64 的纸带）；
//   把纸带的 x, y 设成出口坐标、h 不超过缝高即可。函数也返回 { out: [出口 x, y], slit: 缝高 }，和常量算出来的一样。
//   可选第 6 个参数 o = { play 0..1 梳齿颤动的强度（默认 1）}
// seal(c, x, y, kind, o)  证据蜡封：kind = 'thm' 定理 | 'exp' 实验 | 'corr' 相关 | 'hyp' 假说，一滴压扁的蜡，压印凹边，中间一个字（定、实、相、假）。
//   o = { r 半径（默认 26）, k 0..1 盖下去的动画（从上方落下、压扁、回弹）, al,
//         label 蜡封下方一行很小的手写说明（可选，如「定理」「实验」，k 过 0.7 后写出来）, labelSize 默认 r × .62, rot 蜡封本体转角（默认按 kind 给一个小角度）}
// 顶层名字带 TAPE / tape / seal 前缀（SEAL 是蜡封的颜色表）。
// 性能：纸带本体（剪边、纸纹、导孔、格线、全部孔）按 (格子比特数, unit, h, rows, 缩放档) 缓存成离屏图，每帧只贴图 + 画正在打孔的那一格；
//      蜡封本体按 (kind, r, 缩放档) 缓存。逐帧不用 c.filter，也不用 shadowBlur。

const TAPE = { unit: 22, minW: 10, h: 64, rows: 2,
  box: { x: 84, y: 6, slit: 72 },            // 八音盒出口（相对盒子正面中心、缩放前）和缝高
  thick: 1.1, core: 7,                        // 纸卷：每圈纸厚、卷芯半径
  pad: 10, tile: 4096, cacheMax: 40 };
const SEAL = { thm: ['定', '#5e4270'], exp: ['实', '#365e4b'], corr: ['相', '#7c5d26'], hyp: ['假', '#7d3431'] };
const TAPE_CACHE = new Map();

// 缓存：Map 按插入顺序，取用时挪到末尾，超出上限删最旧的
function tapeMemo(key, make) {
  let v = TAPE_CACHE.get(key);
  if (v) { TAPE_CACHE.delete(key); TAPE_CACHE.set(key, v); return v; }
  v = make(); TAPE_CACHE.set(key, v);
  while (TAPE_CACHE.size > TAPE.cacheMax) TAPE_CACHE.delete(TAPE_CACHE.keys().next().value);
  return v;
}
// 当前变换的缩放（选缓存分辨率档：1 或 2）
function tapeRes(c) { const m = c.getTransform(); return Math.hypot(m.a, m.b) > 1.25 ? 2 : 1; }

// 一格里孔的位置：返回 [{ x, y, r, frac }]，x 相对格子左边，y 相对纸带中线
function tapeHoles(bits, w, h, rows) {
  const n = Math.ceil(bits - 1e-9), whole = Math.floor(bits + 1e-9), cols = Math.ceil(n / rows) || 1, band = h - 20;
  const pitchX = w / cols, pitchY = band / rows, r = Math.max(1.4, Math.min(6.5, pitchX * .36, pitchY * .34)), out = [];
  for (let k = 0; k < n; k++) {
    const col = Math.floor(k / rows), row = k % rows, frac = k < whole ? 1 : bits - whole;
    out.push({ x: pitchX * (col + .5), y: -band / 2 + pitchY * (row + .5), r, frac });
  }
  return out;
}
// 画一个孔（在纸带局部坐标里）。g 0..1 打出来的程度
function tapeHole(c, x, y, r, frac, g = 1) {
  if (g <= 0 || frac <= 0) return;
  const rr = r * (frac < 1 ? .45 + .5 * frac : 1) * g, al = frac < 1 ? .3 + .5 * frac : 1;
  c.save(); c.globalAlpha *= al;
  c.fillStyle = EP3_TAPE_COL.hole; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
  // 孔壁：上沿压暗一弯（纸有厚度），下沿一道亮的纸口
  c.fillStyle = 'rgba(10,6,8,.45)'; c.beginPath(); c.arc(x, y, rr, Math.PI * 1.1, Math.PI * 1.9); c.arc(x, y + rr * .35, rr * .8, Math.PI * 1.85, Math.PI * 1.15, true); c.fill();
  c.strokeStyle = 'rgba(255,250,236,.55)'; c.lineWidth = Math.max(.6, rr * .18); c.beginPath(); c.arc(x, y, rr + .3, Math.PI * .15, Math.PI * .85); c.stroke();
  c.restore();
}

// 纸带本体的离屏图（分块，每块宽不超过 TAPE.tile 像素）。punched = true 时连孔一起画
function tapeSheet(spec, punched, res) {
  const { ws, xs, len, h, rows, seed, guide } = spec;
  const key = ['tape', spec.sig, punched ? 1 : 0, res].join('|');
  return tapeMemo(key, () => {
    const pad = TAPE.pad, strip = rectPts(0, -h / 2, len, h, 2), tiles = [];
    const scut = scissor(strip, seed, 14, .8), path = polyPath(scut, true), shadow = polyPath(scut.map(([a, b]) => [a + 2.5, b + 3.5]), true);
    for (let x0 = -pad; x0 < len + pad; x0 += TAPE.tile) {
      const tw = Math.min(TAPE.tile, len + pad - x0 + pad), cv = document.createElement('canvas');
      cv.width = Math.ceil(tw * res); cv.height = Math.ceil((h + pad * 2) * res);
      const g = cv.getContext('2d'); g.scale(res, res); g.translate(-x0, h / 2 + pad);
      // 投影：两层错开的淡影，代替 shadowBlur
      g.fillStyle = 'rgba(30,20,35,.12)'; g.fill(polyPath(scut.map(([a, b]) => [a + 1.2, b + 1.8]), true));
      g.fillStyle = 'rgba(30,20,35,.16)'; g.fill(shadow);
      g.fillStyle = EP3_TAPE_COL.paper; g.fill(path);
      grain(g, path, .13);
      g.save(); g.clip(path);
      // 两侧沿边一道压痕线 + 一排导孔
      g.strokeStyle = alpha(EP3_TAPE_COL.edge, .7); g.lineWidth = 1;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(Math.max(0, x0), s * (h / 2 - 9.5)); g.lineTo(Math.min(len, x0 + tw), s * (h / 2 - 9.5)); g.stroke(); }
      if (guide) {
        g.fillStyle = alpha(EP3_TAPE_COL.hole, .78);
        for (let gx = 6; gx < len - 3; gx += 12) if (gx > x0 - 8 && gx < x0 + tw + 8) for (const s of [-1, 1]) { g.beginPath(); g.arc(gx, s * (h / 2 - 4.8), 1.7, 0, TAU); g.fill(); }
      }
      // 格线：很淡的墨线（手画，略抖）
      for (let i = 1; i < ws.length; i++) {
        const lx = xs[i] - ws[i] / 2; if (lx < x0 - 4 || lx > x0 + tw + 4) continue;
        rline(g, [[lx, -h / 2 + 10], [lx, h / 2 - 10]], { w: 1.2, color: alpha(P.ink, .2), seed: seed + i, amp: .5 });
      }
      if (punched) spec.cells.forEach((q, i) => {
        const l = xs[i] - ws[i] / 2; if (l > x0 + tw || l + ws[i] < x0) return;
        for (const o of tapeHoles(q.bits || 0, ws[i], h, rows)) tapeHole(g, l + o.x, o.y, o.r, o.frac);
      });
      g.restore();
      g.strokeStyle = alpha(mix(EP3_TAPE_COL.paper, '#ffffff', .5), .6); g.lineWidth = 1; g.stroke(path);
      tiles.push({ x0, w: tw, cv });
    }
    return tiles;
  });
}
// 贴离屏图的 [a, b) 段（纸带局部 x）
function tapeBlit(c, tiles, a, b, h, res) {
  const pad = TAPE.pad;
  for (const T of tiles) {
    const s0 = Math.max(a, T.x0), s1 = Math.min(b, T.x0 + T.w); if (s1 <= s0) continue;
    c.drawImage(T.cv, (s0 - T.x0) * res, 0, (s1 - s0) * res, T.cv.height, s0, -h / 2 - pad, s1 - s0, h + pad * 2);
  }
}

function tape(c, o = {}) {
  const { x = 0, y = 0, rot = 0, cells = [], unit = TAPE.unit, minW = TAPE.minW, h = TAPE.h, rows = TAPE.rows, p = 1, punch = 1, roll = 0, al = 1,
    seed = 3400, chSize = 34, chColor = P.ink, chGap = 14, guide = true } = o;
  const ws = cells.map(q => Math.max(minW, (q.bits || 0) * unit)), xs = [];
  let acc = 0; for (const w of ws) { xs.push(acc + w / 2); acc += w; }
  const len = acc, shown = len * clamp(p, 0, 1), rolled = shown * clamp(roll, 0, 1), flat = shown - rolled;
  const R = rolled > 0 ? Math.sqrt(TAPE.core * TAPE.core + TAPE.thick * rolled / Math.PI) : 0;
  const ca = Math.cos(rot), sa = Math.sin(rot), W2 = u => [x + ca * u, y + sa * u];
  const at = i => { const u = xs[i] ?? 0; return W2(rolled > 0 && u > flat ? flat + R : u); };
  const end = W2(rolled > 0 ? flat + R : shown);
  if (!(al > 0) || len <= 0 || shown <= 0) return { len, at, end };

  c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot);
  const res = tapeRes(c), sig = [ws.map(w => w.toFixed(2)).join(','), cells.map(q => (+(q.bits || 0)).toFixed(3)).join(','), h, rows, seed, guide ? 1 : 0].join('/');
  const spec = { sig, ws, xs, len, h, rows, seed, guide, cells };
  // 打孔进度：前 done 格打完（贴有孔的图），第 done 格正在打（贴无孔的图，再逐孔画）
  const nP = clamp(punch, 0, 1) * cells.length, done = Math.floor(nP + 1e-9), cut = done < cells.length ? xs[done] - ws[done] / 2 : len;
  const edgeR = flat, blitR = rolled <= 0 && shown >= len ? len + TAPE.pad : edgeR;
  if (cut > 0) tapeBlit(c, tapeSheet(spec, true, res), -TAPE.pad, Math.min(cut, blitR), h, res);
  if (cut < blitR) tapeBlit(c, tapeSheet(spec, false, res), cut > 0 ? cut : -TAPE.pad, blitR, h, res);
  // 纸带送出来时的右端：剪口处一道细影
  if (rolled <= 0 && shown < len) { c.fillStyle = 'rgba(40,28,24,.18)'; c.fillRect(shown - 1.5, -h / 2, 1.5, h); }

  c.save(); c.beginPath(); c.rect(-2, -h / 2 - 2, edgeR + 2, h + 8); c.clip();
  // 惊讶火花那一格：压暗的红晕（中间浓、四周淡）
  cells.forEach((q, i) => {
    if (!q.hot) return; const l = xs[i] - ws[i] / 2; if (l > edgeR) return;
    const R = ws[i] / 2 + h * .45, g = c.createRadialGradient(xs[i], 0, 0, xs[i], 0, R);
    g.addColorStop(0, alpha(P.red, .3 * q.hot)); g.addColorStop(.55, alpha(P.red, .2 * q.hot)); g.addColorStop(1, alpha(P.red, 0));
    c.fillStyle = g; c.fillRect(xs[i] - R, -h / 2 + 1, R * 2, h - 2);
  });
  // 正在打孔的那一格：逐孔打出，孔撑开时带一点回弹，打下来的圆纸屑翻着落下
  if (done < cells.length && nP > done) {
    const i = done, l = xs[i] - ws[i] / 2, holes = tapeHoles(cells[i].bits || 0, ws[i], h, rows), u = (nP - done) * holes.length;
    holes.forEach((q, k) => { const g = clamp((u - k) * 2.2, 0, 1); if (g > 0) tapeHole(c, l + q.x, q.y, q.r, q.frac, easeOutBack(g, 2.4)); });
  }
  c.restore();
  // 纸屑：刚打完的孔掉出一片小圆纸，下落约 1.2 格的打孔进度（画在纸带外面，不裁剪）
  if (punch < 1) for (let i = Math.max(0, done - 1); i <= Math.min(cells.length - 1, done); i++) {
    const l = xs[i] - ws[i] / 2; if (l > edgeR) continue;
    const holes = tapeHoles(cells[i].bits || 0, ws[i], h, rows);
    holes.forEach((q, k) => {
      const f = (nP - i) * holes.length - k - .45, life = holes.length * 1.2, v = f / life; if (f <= 0 || v >= 1) return;
      const hx = hash(i * 31 + k, seed), dx = (hx - .5) * 26 * v + Math.sin(v * 9 + hx * 6) * 3, dy = v * v * (h * .9 + 30) + v * 8;
      c.save(); c.globalAlpha *= 1 - sm(.6, 1, v); c.translate(l + q.x + dx, q.y + dy); c.rotate(v * 5 + hx * 3); c.scale(1, Math.cos(v * 11 + hx * 4));
      c.fillStyle = EP3_TAPE_COL.paper; c.beginPath(); c.arc(0, 0, q.r * q.frac, 0, TAU); c.fill();
      c.strokeStyle = alpha(EP3_TAPE_COL.edge, .9); c.lineWidth = .8; c.stroke(); c.restore();
    });
  }
  // 格子上方的手写字
  cells.forEach((q, i) => { if (q.ch && xs[i] <= edgeR + 1) zh(c, q.ch, xs[i], -h / 2 - chGap, { size: chSize, color: chColor, align: 'center' }); });
  if (rolled > 0) tapeRoll(c, flat, R, h, rolled, seed);
  c.restore();
  return { len, at, end };
}

// 纸卷：竖着的一小段圆柱（轴和纸带同宽），左边和平摊的纸带相切；顶面能看到一圈圈纸层
function tapeRoll(c, x0, R, h, rolled, seed) {
  const cx = x0 + R, ry = Math.max(2, R * .3), top = -h / 2, bot = h / 2, paper = EP3_TAPE_COL.paper;
  c.save();
  // 落在纸面上的影
  c.fillStyle = 'rgba(30,20,35,.16)'; c.beginPath(); c.ellipse(cx + 3, bot + 2, R + 2, ry * .9, 0, 0, TAU); c.fill(); c.fillRect(cx - R + 3, top + 4, R * 2, h);
  // 柱身：三道竖向的明暗（剪纸式分块，不做渐变）
  const body = new Path2D(); body.moveTo(cx - R, top); body.lineTo(cx - R, bot); body.ellipse(cx, bot, R, ry, 0, Math.PI, 0, true); body.lineTo(cx + R, top); body.closePath();
  c.fillStyle = mix(paper, '#5a4a3a', .1); c.fill(body);
  c.save(); c.clip(body);
  c.fillStyle = 'rgba(255,252,240,.45)'; c.fillRect(cx - R * .75, top, R * .5, h + ry + 2);
  c.fillStyle = 'rgba(60,40,24,.16)'; c.fillRect(cx + R * .3, top, R * .75, h + ry + 2);
  c.fillStyle = 'rgba(60,40,24,.16)'; c.fillRect(cx + R * .72, top, R * .35, h + ry + 2);
  // 卷在外圈的导孔：沿柱身压扁成一排短痕
  c.fillStyle = alpha(EP3_TAPE_COL.hole, .5);
  for (let k = -3; k <= 3; k++) { const xx = cx + Math.sin(k * .42 + rolled * .05) * R * .85, s = Math.cos(k * .42) * 1.6; if (s > .3) for (const yy of [top + 4.8, bot - 4.8]) c.fillRect(xx - s / 2, yy - 1.6, s, 3.2); }
  grain(c, body, .1);
  c.restore();
  c.strokeStyle = alpha(EP3_TAPE_COL.edge, .9); c.lineWidth = 1; c.stroke(body);
  // 顶面：纸层一圈圈（圈数随卷的长度，最多 7 道）
  c.fillStyle = paper; c.beginPath(); c.ellipse(cx, top, R, ry, 0, 0, TAU); c.fill();
  const rings = Math.min(7, Math.max(1, Math.floor((R - TAPE.core) / 2.2)));
  c.strokeStyle = alpha(EP3_TAPE_COL.edge, .8); c.lineWidth = .8;
  for (let k = 1; k <= rings; k++) { const rr = TAPE.core + (R - TAPE.core) * k / (rings + 1); c.beginPath(); c.ellipse(cx + (hash(k, seed) - .5), top, rr, rr * .3, 0, 0, TAU); c.stroke(); }
  c.fillStyle = alpha(EP3_TAPE_COL.hole, .75); c.beginPath(); c.ellipse(cx, top, TAPE.core * .7, TAPE.core * .21, 0, 0, TAU); c.fill();
  c.strokeStyle = alpha(EP3_TAPE_COL.edge, 1); c.lineWidth = 1.2; c.beginPath(); c.ellipse(cx, top, R, ry, 0, 0, TAU); c.stroke();
  c.restore();
}

// ===================== 八音盒 =====================
const TAPE_WOOD = { body: '#6b4a36', dark: '#4a3326', lid: '#7a563d', inner: '#3e2a20', brass: '#b08a45', brass2: '#8a6a32' };
// 盒子静态部分（盒身、盒盖、缝、脚）缓存成离屏图；梳齿和摇柄每帧画
function tapeBoxSheet(res) {
  return tapeMemo('box|' + res, () => {
    const pw = 260, ph = 230, ox = 130, oy = 130, cv = document.createElement('canvas'); cv.width = pw * res; cv.height = ph * res;
    const g = cv.getContext('2d'); g.scale(res, res); g.translate(ox, oy);
    // 打开的盒盖（看到内面）：往后立起，略窄
    const lid = cutPaper(g, [[-74, -52], [-66, -112], [66, -112], [74, -52]], TAPE_WOOD.inner, { seed: 3411, step: 16, blur: 5 });
    g.save(); g.clip(lid); rline(g, [[-58, -104], [58, -104], [64, -60], [-64, -60]], { w: 1.4, color: alpha(TAPE_WOOD.brass, .6), close: true, seed: 3412, amp: .6 });
    drawMoonIcon(g, 0, -82, 11, alpha(TAPE_WOOD.brass, .75), -.5); g.restore();
    // 盒口里侧（梳齿后面的暗槽）
    cutPaper(g, rectPts(-72, -54, 144, 14, 2), '#2c1e18', { seed: 3413, step: 20, shadow: false, grain: .05 });
    // 脚
    for (const s of [-1, 1]) cutPaper(g, rectPts(s * 62 - 9, 52, 18, 10, 2), TAPE_WOOD.dark, { seed: 3414 + s, step: 8, blur: 3 });
    // 盒身正面
    const body = cutPaper(g, rectPts(-80, -42, 160, 96, 5), TAPE_WOOD.body, { seed: 3401, step: 14, blur: 7, sy: 4 });
    g.save(); g.clip(body);
    for (let k = 0; k < 6; k++) { const yy = -30 + k * 16 + hash(k, 3) * 5; rline(g, [[-84, yy], [-20, yy + 2 * Math.sin(k)], [84, yy - 1]], { w: 1, color: 'rgba(30,18,12,.28)', seed: 3420 + k, amp: 1.2, smooth: true }); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-84, 40, 168, 16);   // 底边压暗一条
    g.restore();
    // 盒沿（上沿一条浅色木条）
    cutPaper(g, rectPts(-83, -48, 166, 11, 3), TAPE_WOOD.lid, { seed: 3402, step: 14, blur: 3 });
    // 正面一块小铜牌
    cutPaper(g, rectPts(-20, 6, 40, 20, 4), TAPE_WOOD.brass2, { seed: 3403, step: 8, blur: 2, sx: 1, sy: 1.5 });
    rline(g, [[-12, 16], [12, 16]], { w: 1.2, color: 'rgba(40,28,10,.5)', seed: 3404, amp: .4 });
    // 两侧的纸带缝（出口在右，入口在左），铜色唇口
    for (const s of [-1, 1]) {
      const sx0 = s > 0 ? TAPE.box.x - 10 : -TAPE.box.x - 2, sy0 = TAPE.box.y - TAPE.box.slit / 2;
      cutPaper(g, rectPts(sx0, sy0 - 3, 12, TAPE.box.slit + 6, 2), TAPE_WOOD.brass2, { seed: 3405 + s, step: 8, blur: 2, sx: s, sy: 1 });
      g.fillStyle = '#1e1512'; g.fillRect(s > 0 ? sx0 + 6 : sx0 + 2, sy0, 4, TAPE.box.slit);
    }
    return { cv, ox, oy, pw, ph };
  });
}

function tapeBox(c, x, y, s = 1, t = 0, o = {}) {
  const { play = 1 } = o;
  c.save(); c.translate(x, y); c.scale(s, s);
  const res = tapeRes(c), B = tapeBoxSheet(res);
  c.drawImage(B.cv, -B.ox, -B.oy, B.pw, B.ph);
  // 铜梳齿：从盒口里立起一排长短不一的齿（长的在左、音低），轻轻颤
  const n = 15;
  for (let k = 0; k < n; k++) {
    const tx = -60 + k * (120 / (n - 1)), len = 20 - k * .85, jig = play * Math.sin(t * 38 + k * 1.7) * Math.max(0, Math.sin(t * 5.3 + k * .9)) * 1.2;
    c.strokeStyle = k % 2 ? TAPE_WOOD.brass : mix(TAPE_WOOD.brass, '#e8cf9a', .25); c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx, -46); c.lineTo(tx + jig, -46 - len); c.stroke();
  }
  cutPaper(c, rectPts(-66, -50, 132, 6, 2), TAPE_WOOD.brass2, { seed: 3409, step: 10, shadow: false, grain: 0 });   // 梳背
  // 摇柄：左侧面的铜轴 + 一根曲柄 + 木把手，随 t 转
  const a = t * 3, hx = -86, hy = TAPE.box.y - 18, ex = hx + Math.cos(a) * 26, ey = hy + Math.sin(a) * 26;
  c.lineCap = 'round'; c.strokeStyle = 'rgba(30,20,35,.25)'; c.lineWidth = 5; c.beginPath(); c.moveTo(hx + 2, hy + 3); c.lineTo(ex + 2, ey + 3); c.stroke();
  c.strokeStyle = TAPE_WOOD.brass2; c.lineWidth = 5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke();
  c.strokeStyle = TAPE_WOOD.brass; c.lineWidth = 2; c.beginPath(); c.moveTo(hx, hy - 1); c.lineTo(ex, ey - 1); c.stroke();
  c.fillStyle = TAPE_WOOD.brass; c.beginPath(); c.arc(hx, hy, 6, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,240,200,.6)'; c.beginPath(); c.arc(hx - 1.5, hy - 1.5, 2, 0, TAU); c.fill();
  c.fillStyle = 'rgba(30,20,35,.25)'; c.beginPath(); c.ellipse(ex + 2, ey + 3, 6, 8, 0, 0, TAU); c.fill();
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.ellipse(ex, ey, 6, 8, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,230,200,.35)'; c.beginPath(); c.ellipse(ex - 2, ey - 3, 2, 3, 0, 0, TAU); c.fill();
  c.restore();
  return { out: [x + TAPE.box.x * s, y + TAPE.box.y * s], slit: TAPE.box.slit * s };
}

// ===================== 证据蜡封 =====================
// 蜡滴轮廓：圆 + 低频起伏 + 两三处外溢的小蜡舌
function sealBlob(r, seed) {
  const pts = [], n = 64, lobes = [0, 1, 2].map(k => [hash(k, seed) * TAU, .08 + .1 * hash(k + 9, seed)]);
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU; let rr = 1 + .045 * Math.sin(a * 3 + seed) + .03 * Math.sin(a * 7 + seed * 2);
    for (const [la, lh] of lobes) { const d = Math.atan2(Math.sin(a - la), Math.cos(a - la)); rr += lh * Math.exp(-d * d * 18); }
    pts.push([Math.cos(a) * r * rr, Math.sin(a) * r * rr]);
  }
  return pts;
}
function sealSheet(kind, r, res) {
  const R = Math.round(r * 2) / 2;
  return tapeMemo(['seal', kind, R, res].join('|'), () => {
    const [, col] = SEAL[kind] || SEAL.hyp, seed = 3450 + Object.keys(SEAL).indexOf(kind) * 7, S = Math.ceil(R * 1.5 + 10), cv = document.createElement('canvas');
    cv.width = cv.height = S * 2 * res; const g = cv.getContext('2d'); g.scale(res, res); g.translate(S, S);
    const blob = cutPaper(g, sealBlob(R, seed), col, { seed, step: Math.max(4, R * .2), blur: 4, sx: 1.5, sy: 2.5, grain: .05, edge: false, smooth: true });
    g.save(); g.clip(blob);
    // 外圈蜡的厚边：外缘一道亮、往里一道暗
    g.strokeStyle = alpha(mix(col, '#ffffff', .4), .5); g.lineWidth = R * .07; g.stroke(blob);
    // 压印凹槽：上左暗、下右亮（光从左上来，凹下去的边缘反过来）
    const ri = R * .74;
    g.lineWidth = R * .09;
    g.strokeStyle = alpha(mix(col, '#000000', .45), .75); g.beginPath(); g.arc(0, 0, ri, Math.PI * .75, Math.PI * 1.9); g.stroke();
    g.strokeStyle = alpha(mix(col, '#ffffff', .35), .6); g.beginPath(); g.arc(0, 0, ri, Math.PI * -.15, Math.PI * .8); g.stroke();
    g.fillStyle = mix(col, '#000000', .1); g.beginPath(); g.arc(0, 0, ri - R * .05, 0, TAU); g.fill();
    // 印面外圈一圈细小的齿纹
    g.fillStyle = alpha(mix(col, '#000000', .35), .5);
    for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; g.beginPath(); g.arc(Math.cos(a) * ri * .86, Math.sin(a) * ri * .86, R * .025, 0, TAU); g.fill(); }
    // 蜡面反光：左上一小道
    g.strokeStyle = 'rgba(255,248,236,.35)'; g.lineWidth = R * .06; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, R * .9, Math.PI * 1.08, Math.PI * 1.3); g.stroke();
    g.restore();
    return { cv, S };
  });
}

function seal(c, x, y, kind, o = {}) {
  const { r = 26, k = 1, al = 1, label = null, labelSize = r * .62 } = o, [ch, col] = SEAL[kind] || SEAL.hyp;
  if (k <= 0 || al <= 0) return;
  const rot = o.rot ?? (hash(ch.charCodeAt(0), 3450) - .5) * .35;
  const drop = (1 - sm(0, .55, k, easeIn)) * -46, sq = 1 + .22 * Math.sin(sm(.5, 1, k, t => t) * Math.PI) * (1 - sm(.85, 1, k) * .6);
  c.save(); c.globalAlpha *= al;
  // 落下时纸面上的影子：越近越实
  if (k < .6) { c.fillStyle = `rgba(30,20,35,${.18 * sm(0, .55, k)})`; c.beginPath(); c.ellipse(x, y + r * .15, r * (1.25 - .3 * sm(0, .55, k)), r * .35, 0, 0, TAU); c.fill(); }
  c.save(); c.globalAlpha *= sm(0, .25, k); c.translate(x, y + drop); c.scale(sq, 1 / sq); c.rotate(rot);
  const res = tapeRes(c), Sh = sealSheet(kind, r, res), rs = r / (Math.round(r * 2) / 2);
  c.drawImage(Sh.cv, -Sh.S * rs, -Sh.S * rs, Sh.S * 2 * rs, Sh.S * 2 * rs);
  // 字：凹下去的压印（左上一道暗边、右下一道亮边，中间是略深的蜡色）
  const fs = r * 1.0, by = r * .35, zo = { size: fs, align: 'center' };
  zh(c, ch, -r * .035, by - r * .035, { ...zo, color: alpha(mix(col, '#000000', .55), .8) });
  zh(c, ch, r * .035, by + r * .035, { ...zo, color: alpha(mix(col, '#ffffff', .45), .7) });
  zh(c, ch, 0, by, { ...zo, color: mix(col, '#000000', .22) });
  c.restore();
  if (label) zh(c, label, x, y + r * 1.25 + labelSize, { size: labelSize, color: P.ink2, align: 'center', p: sm(.7, 1, k, t => t), al: .85 });
  c.restore();
}
