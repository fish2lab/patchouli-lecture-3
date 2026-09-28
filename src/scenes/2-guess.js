'use strict';
// 第 2 段：猜字（预测 = 压缩；香农猜字；中文实测）。3B1B「语言的信息量滚动条」的剪纸版，八音盒纸带横向长镜头。
//   A 书页（L0 前半）  首帧 = 标准画面。第 2 集的冰网络（静止态，缩小）出现在书页上，预测牌滑出、翻过来变成一截纸带，
//                      冰晶后面接上八音盒。
//   → 横移出书（L0 后半）镜头往右滑出书，落到书旁边桌上铺开的一长条纸上；八音盒跟着滑过来放在左边，两人走到右边。
//   B 纸带（L1–L6）    琪露诺念一句，八音盒送出一格、打一格孔：格子宽 = 孔数 = 实测比特（BITS.lines）。
//                      「霜」之前纸带上方一排下一个字的概率条（BITS.next），霜 99.4%；霜那格几乎没有宽度。
//                      第一条纸带撕下挪到上面，第二句「今天的晚饭是冰冻青蛙！」镜头跟着纸带头往右走；冰冻之后的候选条里没有「青」，
//                      青蛙两格打出一串孔、冒红色惊讶火花。L5 镜头拉远，两条纸带上下对比；L6 火花一颗颗飞进孔里。
//   C 香农（L7–L8）    镜头继续往右：一行英文，猜对记「-」、猜错写出字母（香农 1951 的记法），下面一条只在猜错处打孔的纸带；
//                      手写 ≈ 1 比特 / 字母（0.6–1.3），盖「实」蜡封，写香农 1951。
//   D 拨盘（L9）       镜头甩回魔导书：四条纸带上下排开，长度 = 每字比特（GBK、gzip《故乡》、只看字频、会猜的模型）。
//   段末：纸带收掉，两人走回 EP3 站位，最后 0.85 秒只剩 spread + 两人 + 页眉。
// 所有节拍从 S2LINES 推出；比特数、孔数、概率条全部从 BITS 读（只有字频 9.7 比特写死，冯志伟 1984）。
// 顶层名字一律带本段前缀 S2 / s2。
const S2LINES = seq(1.0, [
  '换成一整句话。我来猜你的下一个字，猜中了，你就不用传。',
  ['床前明月光，疑是地上……', { who: 'cirno', hold: .8 }],
  ['霜。这个字几乎不用听，只花 0.01 比特。', { mood: 'smug', hold: .4 }],
  ['今天的晚饭是……冰冻青蛙！', { who: 'cirno', mood: 'proud', hold: .6 }],
  ['「青蛙」我可猜不到，一下就贵了。', { mood: 'surprised', hold: .4 }],
  ['猜得越准，要传的越少：预测和压缩，是同一件事。', { hold: .5 }],
  ['上一集的「惊讶」，就是要付的比特。', { hold: .6 }],
  ['香农让人一个字母一个字母地猜英文，', { pause: .6, hold: .3 }],
  ['英语每个字母只要 1 比特左右。', { hold: .8 }],
  ['一个汉字在电脑里占 16 比特；让会猜的模型来猜，只要 3.5 比特左右。', { pause: .8, dur: 6.6 }],
]);
const S2T = i => S2LINES[i][0], S2E = i => S2LINES[i][1];
// S2W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S2W = (i, f) => { const l = S2LINES[i], v = voiceOf(l[2]), h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S2END = seqEnd(S2LINES), S2DUR = S2END + 2.0;

// ===================== 数据（全部从 BITS 来） =====================
const S2SA = '床前明月光，疑是地上霜。', S2SB = '今天的晚饭是冰冻青蛙！', S2NA = '床前明月光，疑是地上', S2NB = '今天的晚饭是冰冻';
const S2U = 22, S2MINW = 10, S2TH = 64;                 // 纸带：每比特 22 像素，一格最窄 10（和 tape.js 默认一致）
function s2Geo(key) {
  const d = BITS.lines[key], ws = d.bits.map(b => Math.max(S2MINW, b * S2U)), xs = []; let acc = 0;
  for (const w of ws) { xs.push(acc); acc += w; }
  return { chars: d.chars, bits: d.bits, ws, xs, len: acc, total: d.total };
}
const S2GA = s2Geo(S2SA), S2GB = s2Geo(S2SB);
const S2FROST = S2GA.chars.indexOf('霜'), S2FROG = [S2GB.chars.indexOf('青'), S2GB.chars.indexOf('蛙')];
const s2Num = b => b >= 1 ? b.toFixed(1) : b.toFixed(3);          // 格子下的比特数
const s2Round = b => String(Math.round(b * 10) / 10);              // 拨盘上的数：16、11.6、3.5、0.6
const s2Pct = p => (p * 100).toFixed(1) + '%';
const s2Show = ch => ch === '\n' ? '↵' : ch === ' ' ? '␣' : ch;

// ===================== 舞台坐标 =====================
// 世界坐标：魔导书在 x 0..W；书右边桌上铺一长条纸（S2RX 起，宽 2W）。纸带段用纸条局部坐标（原点 S2RX），香农段原点 S2SX。
const S2RX = W, S2SX = W * 2;
const S2BOX = { x: 210, y: 640, s: 1.1 };                          // 纸条上八音盒的位置（局部）
const S2SLOT = S2BOX.x + 70 * S2BOX.s, S2LEAD = 60, S2X0 = S2SLOT + S2LEAD;   // 纸带从盒子右边的缝出来，先是一截空白引纸
const S2YA = 640, S2YA2 = 190, S2YB = 640;                         // 第一条纸带（撕下后挪到上面），第二条纸带
const S2FOLLOW = 1350;                                             // 第二句：纸带头超过屏幕 x=1350 后镜头跟着走
const S2ZOOM = { X: S2RX + 290, Y: -120, s: .7 };                    // L5–L6 拉远看两条纸带
const S2Z = (sx, sy) => [sx / S2ZOOM.s + S2ZOOM.X - S2RX, sy / S2ZOOM.s + S2ZOOM.Y];   // 拉远时屏幕点 → 纸条局部坐标
// 书页上的冰网络：网络坐标 (CX, 470) 放到世界 (CX, 440)，缩小 .55
const S2NT = { x: CX, y: 440, s: .75 };
const s2NetPt = (x, y) => [S2NT.x + (x - CX) * S2NT.s, S2NT.y + (y - 470) * S2NT.s];
const S2CARD = (() => { const [x, y] = s2NetPt(NET.pred.x, NET.pred.y); return { x, y, w: NET.pred.w * S2NT.s, h: NET.pred.h * S2NT.s }; })();
const S2BOOKBOX = { x: CX + 100, y: S2NT.y, s: .6 };                 // 书页上刚接上时的八音盒（世界坐标）

// ===================== 节拍（全部由台词时间算出） =====================
const S2B = (() => { const w = S2W, t = S2T, e = S2E, B = {};
  // L0：网络、预测牌、翻成纸带、接上八音盒、横移出书
  B.netIn = [t(0), t(0) + .5]; B.pred = [w(0, .1), w(0, .1) + .45]; B.realOut = [w(0, .22), w(0, .22) + .35];
  B.flip = [w(0, .3), w(0, .42)]; B.morph = [w(0, .42), w(0, .54)]; B.box = [w(0, .4), w(0, .52)];
  B.netOut = [w(0, .56), w(0, .7)]; B.pan = [w(0, .6), e(0) + .2];
  // L1–L2：第一句按字送纸；霜之前出概率条
  B.feedA = S2GA.chars.map((ch, i) => i < S2FROST ? [w(1, .04 + .88 * i / S2FROST), i ? .2 : .45]
    : i === S2FROST ? [t(2) + .05, .15] : [w(2, .14), .15]);
  B.panelA = [w(1, .8), t(3) - .1]; B.frost = [w(2, .42), t(3) - .1];
  // L3–L4：第一条撕下挪上去；第二句；冰冻之后的候选条；青蛙
  B.upA = [t(3) - .1, t(3) + .45];
  const nB = S2GB.chars.length;
  B.feedB = S2GB.chars.map((ch, i) => i < 6 ? [w(3, .06 + .055 * i), .18]
    : i < S2FROG[0] ? [w(3, .58 + .08 * (i - 6)), .2]
    : i < nB - 1 ? [t(4) + .1 + .35 * (i - S2FROG[0]), .3] : [w(4, .62), .15]);
  B.panelB = [w(3, .76), t(5) - .1]; B.miss = t(4) - .05;
  // L5：拉远对比；L6：火花飞进孔里
  B.zoom = [t(5) - .15, t(5) + .8]; B.totA = w(5, .25); B.totB = w(5, .38); B.eq = w(5, .6);
  B.surp = t(6) + .05; B.fly = [t(6) + .35, e(6) - .15];
  // L7–L8：香农
  B.toShannon = [e(6) + .05, t(7) + .1]; B.cols = [t(7) + .1, e(7) - .1]; B.head7 = t(7) - .2;
  B.one = t(8) + .1; B.range = w(8, .55); B.seal = w(8, .68); B.shannon = w(8, .8); B.blind = w(8, 1) + .1;
  // L9：甩回魔导书，四条纸带
  B.whip = [e(8) + .05, t(9) + .05];
  B.dial = [w(9, .02), w(9, .2), w(9, .3), w(9, .6)]; B.note = w(9, .86);
  // 段末
  B.clear = [S2END + .05, S2END + .5]; B.home = [S2END + .15, S2END + 1.15];
  return B; })();

// ===================== 纸带进度（纯函数） =====================
function s2Feed(tau, G, feed) {   // → { p, punch, head（局部 x）, fed（像素）, done[i] 0..1 }
  let fed = 0, n = 0; const done = [];
  feed.forEach(([a, d], i) => { const u = clamp((tau - a) / d, 0, 1); done.push(u); fed += G.ws[i] * u; if (u >= 1) n++; });
  return { p: fed / G.len, punch: n / G.ws.length, fed, head: S2X0 + fed, done };
}
const s2YA = tau => lerp(S2YA, S2YA2, sm(S2B.upA[0], S2B.upA[1], tau));
function s2CamFollow(tau) { const f = s2Feed(tau, S2GB, S2B.feedB); return tau < S2B.upA[0] ? 0 : Math.max(0, f.head - S2FOLLOW); }
// 镜头：世界点 (X, Y) 在屏幕左上角，缩放 s
function s2Cam(tau) {
  const B = S2B, L = (a, b, u) => ({ X: lerp(a.X, b.X, u), Y: lerp(a.Y, b.Y, u), s: lerp(a.s, b.s, u) });
  const book = { X: 0, Y: 0, s: 1 }, strip = { X: S2RX, Y: 0, s: 1 }, shan = { X: S2SX, Y: 0, s: 1 };
  if (tau < B.pan[1]) return L(book, strip, sm(B.pan[0], B.pan[1], tau));
  if (tau < B.zoom[0]) return { X: S2RX + s2CamFollow(tau), Y: 0, s: 1 };
  const f0 = { X: S2RX + s2CamFollow(B.zoom[0]), Y: 0, s: 1 };
  if (tau < B.toShannon[0]) return L(f0, S2ZOOM, sm(B.zoom[0], B.zoom[1], tau));
  if (tau < B.whip[0]) return L(S2ZOOM, shan, sm(B.toShannon[0], B.toShannon[1], tau));
  return L(shan, book, sm(B.whip[0], B.whip[1], tau, easeIO));
}

// ===================== 通用小画具 =====================
const S2IMG = {};
function s2Cache(c, key, base, w, draw) {   // 静止的底图按输出缩放缓存成图（只是缓存，画面仍只由参数决定）
  let e = S2IMG[key];
  if (!e || e.b !== base) { const cv = document.createElement('canvas'); cv.width = Math.round(w * base); cv.height = Math.round(H * base);
    const g = cv.getContext('2d'); g.setTransform(base, 0, 0, base, 0, 0); draw(g); e = S2IMG[key] = { b: base, cv }; }
  c.drawImage(e.cv, 0, 0, w, H);
}
function s2Runner(g) {   // 书旁边桌上铺开的一长条纸（宽 2W）
  g.fillStyle = WOOD; g.fillRect(0, 0, W * 2, H);
  g.save(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2;
  for (let k = 0; k < 14; k++) { const y = 30 + k * 78 + Math.sin(k * 1.3) * 12; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * .6, y - 10, W * 1.3, y + 12, W * 2, y - 4); g.stroke(); }
  g.restore();
  cutPaper(g, rectPts(40, 58, W * 2 - 80, H - 112, 6), BOOK.page, { seed: 3901, step: 80, blur: 14, sy: 6, grain: .12 });
  rline(g, [[70, 88], [W * 2 - 70, 88]], { w: 1.2, color: alpha(P.ink2, .12), seed: 3902, amp: .6 });
  rline(g, [[70, H - 84], [W * 2 - 70, H - 84]], { w: 1.2, color: alpha(P.ink2, .12), seed: 3903, amp: .6 });
}
// 1D 标签排开：挤在一起的字按组居中排开，间距 sp（窄格子「霜」「地上」的字不叠在一起）
function s2Fan(cs, sp) {
  const gs = [];
  cs.forEach(x => { let g = { n: 1, sum: x }; g.s = x;
    while (gs.length) { const p = gs.at(-1); if (p.s + p.n * sp <= g.s) break; gs.pop(); g = { n: p.n + g.n, sum: p.sum + g.sum }; g.s = g.sum / g.n - (g.n - 1) * sp / 2; }
    gs.push(g); });
  const out = []; for (const g of gs) for (let k = 0; k < g.n; k++) out.push(g.s + k * sp);
  return out;
}
const S2FANA = s2Fan(S2GA.xs.map((x, i) => S2X0 + x + S2GA.ws[i] / 2), 36), S2FANB = s2Fan(S2GB.xs.map((x, i) => S2X0 + x + S2GB.ws[i] / 2), 36);
// 一条句子纸带：tape + 格子上方的字（引线指到格子）+ 格子下的比特数
function s2Sentence(c, G, fan, y, f, o = {}) {
  const hot = o.hot || [], al = o.al ?? 1; if (al <= 0) return;
  const cells = G.bits.map((b, i) => ({ bits: b, hot: hot.includes(i) ? f.done[i] >= 1 ? 1 : 0 : 0 }));
  fade(c, al, () => {
    tape(c, { x: S2X0, y, cells, unit: S2U, minW: S2MINW, h: S2TH, p: f.p, punch: f.punch });
    G.chars.forEach((ch, i) => { const a = sm(.35, 1, f.done[i], x => x); if (a <= 0) return;
      const cx = S2X0 + G.xs[i] + G.ws[i] / 2, lx = fan[i], ly = y - S2TH / 2 - 44;
      zh(c, ch, lx, ly, { size: 36, color: hot.includes(i) ? P.red : P.ink, align: 'center', al: a });
      if (Math.abs(lx - cx) > 3) rline(c, [[lx, ly + 8], [cx, y - S2TH / 2 - 3]], { w: 1.2, color: alpha(P.ink2, .45 * a), seed: 3920 + i, amp: .3 });
      if (G.ws[i] >= 60) zh(c, s2Num(G.bits[i]), cx, y + S2TH / 2 + 34, { size: 24, color: P.g3, align: 'center', al: a * (o.num ?? 1) });
    });
  });
}
// 下一个字的概率条（3B1B 那一排）：左上角 (x, y)。hi 是真正出现的字；miss 是真正出现却不在前 8 名里的字
function s2Panel(c, x, y, list, o = {}) {
  const { k = 1, al = 1, hi = null, miss = null, missK = 0 } = o; if (al <= 0) return;
  const cw = 50, n = list.length + (miss ? 1 : 0), w = n * cw + 40, h = 250, base = y + 190, maxH = 105;
  fade(c, al, () => {
    vellum(c, rectPts(x, y, w, h, 8), { seed: 3910, al: 1.4 });
    zh(c, '下一个字？', x + 20, y + 36, { size: 28, color: P.ink2 });
    list.forEach(([ch, p], j) => {
      const cx = x + 20 + cw * (j + .5), u = sm(j * .06, j * .06 + .5, k), bh = Math.max(2, p * maxH) * u, on = ch === hi;
      cutPaper(c, rectPts(cx - 15, base - bh, 30, bh), on ? P.purple : P.g2, { seed: 3930 + j, step: 10, blur: 2, sx: 1, sy: 1.5, grain: .05, al: u > 0 ? 1 : 0 });
      zh(c, s2Show(ch), cx, base + 34, { size: 30, color: on ? P.purple : P.ink, align: 'center' });
      if (p >= .03) zh(c, s2Pct(p), cx, base - bh - 8, { size: 19, color: on ? P.purple : P.ink2, align: 'center', al: u });
    });
    if (miss && missK > 0) { const cx = x + 20 + cw * (list.length + .5);
      fade(c, missK, () => { rline(c, rectPts(cx - 15, base - 60, 30, 60), { w: 1.6, color: alpha(P.red, .7), close: true, dash: [5, 5], seed: 3940, amp: .3 });
        zh(c, miss, cx, base + 34, { size: 30, color: P.red, align: 'center' }); zh(c, '?', cx, base - 70, { size: 26, color: P.red, align: 'center' }); }); }
  });
}
// 小火花（红纸星）：画很多颗时用，比 netSparkPiece 省
function s2Spark(c, x, y, r, rot, a) {
  if (r <= .5 || a <= 0) return;
  c.save(); c.globalAlpha *= a; c.fillStyle = P.red; c.fill(polyPath(starPts(x, y, r, 7, .42, rot)));
  c.fillStyle = mix(P.red, '#fff4e0', .45); c.beginPath(); c.arc(x, y, r * .26, 0, TAU); c.fill(); c.restore();
}
// 纸带上每个孔的中心（和 tape.js 的打孔排布一致：孔按比特向上取整，rows 行）
function s2Holes(G, y, rows = 2) {
  const out = [];
  G.bits.forEach((b, i) => { const n = Math.ceil(b), cols = Math.ceil(n / rows) || 1, x0 = S2X0 + G.xs[i];
    for (let k = 0; k < n; k++) { const col = Math.floor(k / rows), row = k % rows; out.push([x0 + G.ws[i] * (col + .5) / cols, y - S2TH / 2 + S2TH * (row + .5) / rows]); } });
  return out;
}
const S2HOLES = (() => { const all = [...s2Holes(S2GA, S2YA2), ...s2Holes(S2GB, S2YB)].sort((a, b) => a[0] - b[0]);
  const [a, b] = S2B.fly, n = all.length, dt = .55; return all.map((q, j) => ({ q, t0: lerp(a, b - dt, j / Math.max(1, n - 1)), dt })); })();
const S2SRC = S2Z(215, 746);   // L6 那颗大「惊讶」火花（拉远画面里的屏幕位置换成纸条坐标）

// ===================== A：书页上的冰网络 → 纸带 =====================
function s2Book(c, tau) {
  const B = S2B, k = sm(B.netIn[0], B.netIn[1], tau, easeOut), out = sm(B.netOut[0], B.netOut[1], tau);
  if (k > 0 && out < 1) {
    const o = netRest(); o.al = k * (1 - out);
    const pk = sm(B.pred[0], B.pred[1], tau, easeOut), fl = sm(B.flip[0], B.flip[1], tau, x => x);
    if (pk > 0 && fl < .5) o.pred = { v: .62, k: pk, al: fl > 0 ? 0 : 1 };
    o.real.al = 1 - sm(B.realOut[0], B.realOut[1], tau);
    c.save(); c.translate(S2NT.x, S2NT.y); c.scale(S2NT.s, S2NT.s); c.translate(-CX, -470); netDraw(c, o, tau); c.restore();
  }
  // 预测牌翻面：前半是牌面（压扁），后半是纸带纸的背面，接着收成一截引纸接到八音盒的缝上
  const fl = sm(B.flip[0], B.flip[1], tau, x => x), mo = sm(B.morph[0], B.morph[1], tau);
  if (fl > 0 && tau < B.pan[0] + .05) {
    const d = S2CARD, bx = S2BOOKBOX, slot = bx.x + 70 * bx.s, lh = S2TH * bx.s / S2BOX.s, ll = 120;
    const cx = lerp(d.x, slot + ll / 2, mo), cy = d.y, w = lerp(d.w, ll, mo), h = lerp(d.h, lh, mo), sx = fl < .5 ? Math.cos(fl * Math.PI) : Math.max(.02, -Math.cos(fl * Math.PI));
    c.save(); c.translate(cx, cy); c.scale(Math.max(.02, Math.abs(sx)), 1);
    if (fl < .5) { cutPaper(c, rectPts(-d.w / 2, -d.h / 2, d.w, d.h, 4), NET.col.card, { seed: 3960, step: 16, blur: 4 }); zh(c, '预测', 0, -d.h / 2 + 26, { size: 18, color: P.ink2, align: 'center' }); }
    else cutPaper(c, rectPts(-w / 2, -h / 2, w, h, 2), EP3_TAPE_COL.paper, { seed: 3961, step: 16, blur: 4 });
    c.restore();
  }
}
// 八音盒 + 引纸：书页上接上 → 横移时滑到纸条左边（世界坐标）
function s2BoxAt(tau) {
  const B = S2B, u = sm(B.pan[0], B.pan[1], tau), a = S2BOOKBOX, b = { x: S2RX + S2BOX.x, y: S2BOX.y, s: S2BOX.s };
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), s: lerp(a.s, b.s, u), lead: lerp(120, S2LEAD, u), k: sm(B.box[0], B.box[1], tau, easeOutBack), leadK: sm(B.morph[1] - .05, B.morph[1], tau) };
}
function s2Box(c, tau) {
  const bx = s2BoxAt(tau); if (bx.k <= 0) return;
  const fa = s2Feed(tau, S2GA, S2B.feedA), fb = s2Feed(tau, S2GB, S2B.feedB), crank = (fa.fed + fb.fed) / 90;
  const slot = bx.x + 70 * bx.s, lh = S2TH * bx.s / S2BOX.s;
  if (bx.leadK > 0) fade(c, bx.leadK, () => cutPaper(c, rectPts(slot - 4, bx.y - lh / 2, bx.lead + 4, lh), EP3_TAPE_COL.paper, { seed: 3962, step: 16, blur: 3 }));
  pop(c, bx.x, bx.y, bx.k, () => tapeBox(c, bx.x, bx.y, bx.s, crank));
}

// ===================== B：纸带（纸条局部坐标） =====================
function s2Strip(c, tau) {
  const B = S2B, fa = s2Feed(tau, S2GA, B.feedA), fb = s2Feed(tau, S2GB, B.feedB), yA = s2YA(tau);
  if (tau < B.feedA[0][0] - .1) return;
  // 第一句
  s2Sentence(c, S2GA, S2FANA, yA, fa, { num: 1 });
  // 概率条（霜之前）
  const pa = win(B.panelA[0], B.panelA[1], tau, .35);
  if (pa > 0) { const head = S2X0 + S2GA.xs[S2FROST]; s2Panel(c, head - 440, 270, BITS.next[S2NA], { k: sm(B.panelA[0], B.panelA[0] + .9, tau, x => x), al: pa, hi: fa.done[S2FROST] > 0 ? '霜' : null }); }
  // 「霜」只要 0.009 比特
  const fr = win(B.frost[0], B.frost[1], tau, .3);
  if (fr > 0) { const cx = S2X0 + S2GA.xs[S2FROST] + S2GA.ws[S2FROST] / 2, txt = `霜：${s2Num(S2GA.bits[S2FROST])} 比特`;
    fade(c, fr, () => { zh(c, txt, cx - 20, S2YA + 150, { size: 40, color: P.purple, align: 'right', p: writeP(tau, B.frost[0], txt, .05) });
      arrow(c, [cx - 30, S2YA + 112], [cx - 2, S2YA + S2TH / 2 + 8], { w: 2.4, color: P.purple, head: 12, seed: 3970, p: sm(B.frost[0] + .3, B.frost[0] + .6, tau) }); }); }
  // 第二句
  if (tau >= B.feedB[0][0] - .1) s2Sentence(c, S2GB, S2FANB, S2YB, fb, { hot: S2FROG });
  const pb = win(B.panelB[0], B.panelB[1], tau, .35);
  if (pb > 0) { const head = S2X0 + S2GB.xs[S2FROG[0]]; s2Panel(c, head - 490, 275, BITS.next[S2NB], { k: sm(B.panelB[0], B.panelB[0] + .9, tau, x => x), al: pb, miss: '青', missK: sm(B.miss, B.miss + .4, tau) }); }
  // 青蛙：打孔那一刻炸开红色惊讶火花（火花大小跟比特走），之后小火花挂在格子上方
  S2FROG.forEach((i, j) => { const [a, d] = B.feedB[i], t0 = a + d, u = (tau - t0) / .9; if (tau < t0) return;
    const cx = S2X0 + S2GB.xs[i] + S2GB.ws[i] / 2, cy = S2YB, b = S2GB.bits[i];
    if (u < 1) for (let k = 0; k < 7; k++) { const an = k / 7 * TAU + j, rr = 30 + (50 + 8 * b) * easeOut(u);
      s2Spark(c, cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * .8, (6 + b) * (1 - .5 * u), tau * 4 + k, 1 - sm(.6, 1, u)); }
    const st = 1 - sm(B.zoom[0], B.zoom[0] + .4, tau);
    if (st > 0) netSparkPiece(c, cx, cy - S2TH / 2 - 128, (10 + 2 * b) * (u < .3 ? easeOutBack(u / .3) : 1), tau * 2 + j, st, 3980 + j);
  });
  // L5：总比特
  const tot = (G, y, t0, key) => { const a = sm(t0, t0 + .4, tau); if (a <= 0) return;
    const x = S2X0 + G.len + 36, s = `${G.chars.length} 个字 · ${s2Num(G.total)} 比特`;
    zh(c, s, x, y + 14, { size: 40, color: P.ink, p: writeP(tau, t0, s, .04) }); };
  const tk = 1 - sm(B.toShannon[1] - .2, B.toShannon[1], tau);
  if (tk > 0) fade(c, tk, () => { tot(S2GA, S2YA2, B.totA); tot(S2GB, S2YB, B.totB);
    const [ex, ey] = S2Z(190, 680), eqA = sm(B.eq, B.eq + .3, tau);
    if (eqA > 0) zh(c, '预测 ＝ 压缩', ex, ey, { size: 70, color: P.ink, p: writeP(tau, B.eq, '预测 ＝ 压缩', .07) });
    const [sx, sy] = S2Z(250, 766), sa = sm(B.surp, B.surp + .3, tau);
    if (sa > 0) { zh(c, '惊讶 ＝ 要付的比特', sx, sy, { size: 52, color: P.red, p: writeP(tau, B.surp, '惊讶 ＝ 要付的比特', .06) });
      netSparkPiece(c, S2SRC[0], S2SRC[1], 26 * easeOutBack(clamp((tau - B.surp) / .4, 0, 1)), tau * 2, sa, 3990); }
  });
  // L6：火花一颗颗飞进孔里（孔闪一下红）
  if (tau > B.fly[0] && tau < B.toShannon[1]) for (const { q, t0, dt } of S2HOLES) {
    const u = (tau - t0) / dt; if (u < 0) continue;
    if (u < 1) { const e = easeIO(u), m = [(S2SRC[0] + q[0]) / 2, Math.min(S2SRC[1], q[1]) - 180], v = 1 - e;
      s2Spark(c, v * v * S2SRC[0] + 2 * v * e * m[0] + e * e * q[0], v * v * S2SRC[1] + 2 * v * e * m[1] + e * e * q[1], 9 - 3 * e, tau * 5 + q[0], 1); }
    else { const g = 1 - clamp((u - 1) * dt / 1.2, 0, 1); if (g > 0) { c.fillStyle = alpha(P.red, .75 * g); c.beginPath(); c.arc(q[0], q[1], 8, 0, TAU); c.fill(); } }
  }
}

// ===================== C：香农猜字（局部坐标 = 屏幕坐标） =====================
// 例句照香农 1951 的例子：猜对的位置记「-」，猜错的写出字母。S2WRONG 是猜错的位置（空格也要猜）。
const S2EN = 'THE ROOM WAS NOT VERY LIGHT A SMALL OBLONG';
const S2WRONG = [4, 5, 6, 13, 14, 15, 17, 23, 30, 31, 36, 37, 38];
const S2RED = [...S2EN].map((ch, i) => S2WRONG.includes(i) ? ch : '-').join('');
const S2EC = { x0: 150, cw: 36, y1: 212, y2: 276, ty: 340 };
function s2Shannon(c, tau) {
  const B = S2B; if (tau < B.head7 || tau > B.whip[1] + .1) return;
  const E = S2EC, n = S2EN.length, cu = clamp((tau - B.cols[0]) / (B.cols[1] - B.cols[0]), 0, 1) * n;
  const hd = '猜对记「-」，猜错写出字母', ha = sm(B.head7, B.head7 + .4, tau);
  zh(c, hd, E.x0, 140, { size: 30, color: P.ink2, al: ha, p: writeP(tau, B.head7, hd, .04) });
  const cells = [...S2EN].map((ch, i) => ({ bits: S2WRONG.includes(i) ? 1 : 0 }));
  tape(c, { x: E.x0, y: E.ty, cells, unit: 1, minW: E.cw, h: 46, rows: 1, p: cu / n, punch: Math.floor(cu) / n });
  for (let i = 0; i < n; i++) { const a = clamp(cu - i, 0, 1); if (a <= 0) break;
    const cx = E.x0 + E.cw * (i + .5), ch = S2EN[i], wr = S2WRONG.includes(i);
    if (ch !== ' ') zh(c, ch, cx, E.y1, { size: 36, color: P.ink, align: 'center', al: a });
    else { c.fillStyle = alpha(P.ink2, .35 * a); c.beginPath(); c.arc(cx, E.y1 - 10, 2.5, 0, TAU); c.fill(); }
    zh(c, S2RED[i], cx, E.y2, { size: wr ? 36 : 30, color: wr ? P.red : P.g2, align: 'center', al: a });
  }
  // ≈ 1 比特 / 字母（0.6–1.3）+ 蜡封 + 香农 1951
  const one = '≈ 1 比特 / 字母', rg = '（0.6–1.3）';
  if (tau > B.one) { zh(c, one, E.x0, 520, { size: 72, color: P.ink, p: writeP(tau, B.one, one, .06) });
    const x1 = E.x0 + zhWidth(c, one, 72) + 16;
    if (tau > B.range) zh(c, rg, x1, 518, { size: 38, color: P.ink2, p: writeP(tau, B.range, rg, .05) });
    seal(c, x1 + zhWidth(c, rg, 38) + 56, 494, 'exp', { r: 30, k: clamp((tau - B.seal) / .6, 0, 1) });
    if (tau > B.shannon) zh(c, '香农 1951', E.x0, 598, { size: 38, color: P.ink2, p: writeP(tau, B.shannon, '香农 1951', .07) });
    const bl = `瞎猜（27 选 1）要 ${Math.log2(27).toFixed(2)} 比特`;
    if (tau > B.blind) zh(c, bl, E.x0, 660, { size: 28, color: P.g2, p: writeP(tau, B.blind, bl, .04) });
  }
}

// ===================== D：拨盘（魔导书上，世界 = 屏幕坐标） =====================
const S2ZIPF = 9.7;   // 只看字频：零阶熵 9.7 比特/字（冯志伟 1984《汉字的熵》；计算机统计 9.71）。不是本机实测，写死并标出处
const S2DIAL = [
  { name: 'GBK 编码', b: BITS.dial.new.gbk },
  { name: 'gzip 压《故乡》', b: BITS.dial.old.gzip },
  { name: '只看字频', b: S2ZIPF, src: '冯志伟 1984' },
  { name: '会猜的模型', b: BITS.dial.new.model },
];
const S2DL = { x0: 118, tx: 440, y0: 212, dy: 142, unit: 70 };
function s2Dial(c, tau) {
  const B = S2B, gone = sm(B.clear[0], B.clear[1], tau); if (tau < B.dial[0] || gone >= 1) return;
  fade(c, 1 - gone, () => {
    S2DIAL.forEach((r, i) => { const t0 = B.dial[i], a = sm(t0, t0 + .3, tau), u = sm(t0 + .1, t0 + .8, tau, easeOut); if (a <= 0) return;
      const y = S2DL.y0 + i * S2DL.dy, len = r.b * S2DL.unit, best = i === S2DIAL.length - 1;
      zh(c, r.name, S2DL.x0, y + 11, { size: 32, color: best ? P.purple : P.ink, al: a });
      tape(c, { x: S2DL.tx, y, cells: [{ bits: r.b }], unit: S2DL.unit, h: 52, rows: 1, p: u, punch: u >= 1 ? 1 : 0 });
      const nx = S2DL.tx + len * u + 22, s = `${s2Round(r.b)} 比特`;
      zh(c, s, nx, y + 14, { size: 40, color: best ? P.purple : P.ink, al: sm(t0 + .5, t0 + .8, tau) });
      if (r.src) zh(c, r.src, nx, y + 50, { size: 22, color: P.g2, al: sm(t0 + .6, t0 + .9, tau) });
    });
    const nt = `《故乡》只要 ${s2Round(BITS.dial.old.model)} 比特：模型背过它`;
    zh(c, nt, S2DL.tx, S2DL.y0 + 4 * S2DL.dy - 30, { size: 24, color: P.g2, al: .8 * sm(B.note, B.note + .5, tau) });
  });
}

// ===================== 角色（屏幕坐标：镜头动时两人跟着走） =====================
const S2PX = [330, 1590], S2CXS = [1600, 1815];
function s2Walk(tau, a, b) { const u = (tau - a) / (b - a); return u > 0 && u < 1 ? Math.abs(Math.sin(u * Math.PI * 5)) * 12 : 0; }
function s2Chars(c, tau, L) {
  const B = S2B, t = S2T, e = S2E, home = sm(B.home[0], B.home[1], tau), go = sm(B.pan[0], B.pan[1], tau);
  const px = tau < B.home[0] ? lerp(S2PX[0], S2PX[1], go) : lerp(S2PX[1], S2PX[0], home);
  const cx = tau < B.home[0] ? lerp(S2CXS[0], S2CXS[1], go) : lerp(S2CXS[1], S2CXS[0], home);
  const walk = s2Walk(tau, B.pan[0], B.pan[1]) + s2Walk(tau, B.home[0], B.home[1]);
  const moving = (tau > B.pan[0] && tau < B.pan[1]) || (tau > B.home[0] && tau < B.home[1]);
  const std = tau < B.pan[0] || tau >= B.home[1];
  // 帕秋莉
  let po = { pose: 'lecture' }, pm = moodOf(L, 'patchouli');
  if (std) po = { pose: 'lecture' };
  else if (moving) po = { pose: 'stand', facing: tau < B.pan[1] ? 1 : -1 };
  else { po = { facing: -1, pose: 'lecture', gesture: .45 };
    if (tau > t(1) && tau < t(2)) { po.pose = 'stand'; pm = tau > B.panelA[0] ? 'smug' : 'normal'; }
    else if (tau >= t(2) && tau < e(2)) po = { facing: -1, pose: 'point', gesture: .8 };
    else if (tau >= t(3) && tau < t(4)) po.pose = 'stand';
    else if (tau >= t(4) && tau < e(4)) { po = { facing: -1, pose: 'hide' }; pm = 'surprised'; }
    else if (tau >= t(6) && tau < e(6)) po = { facing: -1, pose: 'point', gesture: .6 };
    else if (tau >= B.toShannon[1] && tau < e(8)) po = { facing: -1, pose: 'point', gesture: .75 };
  }
  const jump = tau >= t(4) && tau < t(4) + .5 ? Math.sin((tau - t(4)) / .5 * Math.PI) * 26 : 0;
  drawPatchouli(c, { ...EP3.pch, x: px, y: EP3.pch.y - walk - jump, ...po, mood: pm, mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  // 琪露诺
  let co = { pose: 'stand' }, cm = moodOf(L, 'cirno');
  if (!std && !moving) {
    if (tau >= t(1) && tau < t(2)) co = { pose: 'point', gesture: .7 };
    else if (tau >= t(2) && tau < t(3)) cm = 'surprised';
    else if (tau >= t(3) && tau < e(3)) co = { pose: 'proud', gesture: .9 };
    else if (tau >= t(4) && tau < e(4)) { co = { pose: 'proud', gesture: .6 }; cm = 'happy'; }
    else if (tau >= t(5) && tau < e(6)) { co = { pose: 'think' }; cm = 'confused'; }
    else if (tau >= t(7) && tau < t(8)) { co = { pose: 'think' }; cm = 'confused'; }
    else if (tau >= t(8) && tau < e(8)) cm = 'surprised';
    else if (tau >= t(9)) cm = tau < B.dial[3] ? 'surprised' : 'happy';
  }
  drawCirno(c, { ...EP3.cir, x: cx, y: EP3.cir.y - walk * .8, ...co, mood: cm, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

// ===================== 主画面 =====================
function s2Draw(c, tau, L) {
  const base = c.getTransform().a || 1, cam = s2Cam(tau), vx0 = cam.X, vx1 = cam.X + W / cam.s;
  c.fillStyle = WOOD; c.fillRect(0, 0, W, H);
  c.save(); c.scale(cam.s, cam.s); c.translate(-cam.X, -cam.Y);
  if (vx0 < W) { s2Cache(c, 'spread', base, W, g => spread(g, 0)); pageHeader(c, '第二页 · 猜字', tau, .9); s2Book(c, tau); s2Dial(c, tau); }
  if (vx1 > S2RX) {
    c.save(); c.translate(S2RX, 0); s2Cache(c, 'runner', base, W * 2, s2Runner);
    if (vx0 < S2RX + W * 1.4 && vx1 > S2RX) s2Strip(c, tau);
    c.restore();
    if (vx1 > S2SX) { c.save(); c.translate(S2SX, 0); s2Shannon(c, tau); c.restore(); }
  }
  s2Box(c, tau);
  c.restore();
  s2Chars(c, tau, L);
}

scene({ order: 2, key: 'guess', title: '猜字', dur: S2DUR, lines: S2LINES, fn: s2Draw });
