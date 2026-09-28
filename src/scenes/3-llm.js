'use strict';
// 第 3 段：大模型 —— 会猜的魔导书（3B1B「下一个 token 概率条」「Prediction → Compression」的剪纸版）。
//   舞台：右页上立起一本小一号的魔导书，一支羽毛笔自己在它的左页写「今天的晚饭是冰冻青」。
//   L1–L2 每写一个要猜的字前，书脊底下垂下几条书签丝带：宽度 = 候选字的概率（实测 top-8），真正出现的那个字的丝带染成紫色
//         （不在前 8 名里就补在最右边）。前四组快速带过，第五组是 BITS.next['今天的晚饭是冰冻']，停得最久。
//   L3    「青」的丝带又细又长，打一个结，结的大小 = −log₂p；丝带收起，九个字的结串成一行挂在书下。
//   L4    左页角手写「平均每字要付的比特 = 交叉熵 = 训练损失」，句末 −Σ p·log₂q 淡淡出现约 1 秒。帕秋莉走近指着。
//   L5    字倒着流回书里、结也被吸回去，书一页页变薄，封底吐出一截短纸带（tape），盖「定」蜡封（算术编码）。
//   L6    琪露诺从右页一路走到左页问话；小书缩到右页右边，右页左边掉下一个打了绳结的纸包（压缩包）。
//   L7    上方一行「我是最强的！」×3：后两遍缩成两个小指针箭头指回第一遍（LZ 的做法）；
//         下面两截纸带比「新写中文每个字」要打的孔：纸包（gzip，用长文本《故乡》的数，短文本上 gzip 的字典开销会夸大差距）长，魔导书（模型，新写中文）短。
//   L8    两组剪纸条：图片 PNG 58.5% / 模型 43.4%，声音 FLAC 30.3% / 模型 16.4%（Delétang 等 2024），盖「实」蜡封。
//   L9    下面一块跷跷板：左边 PNG、FLAC，右边模型；一摞大书砸在模型那头「模型本身 ≈ 140 GB（Chinchilla 70B）」，板子压翻。
//   L10–L11 31 枚图钉钉在右页上排成几乎一条直线（示意图，不画刻度），一根线穿过去，盖「相」蜡封。
//   L12   「压缩就是智能」手写在右页，盖「假」蜡封；帕秋莉抱臂得意，琪露诺走回原位。
//   开头和最后 0.8 秒：spread + 页眉 + 两人在 EP3 标准站位，书页上别的都收掉。
// 顶层名字一律带本段前缀 S3 / s3。
const S3LINES = seq(1.0, [
  '这种会猜的模型，就是大语言模型。',
  ['它训练时只做一件事：猜下一个字。', { hold: .3 }],
  ['训练的目标，是让真正出现的那个字，平均花的比特最少。', { hold: .9 }],
  ['这个数叫交叉熵，就是它的训练损失。', { hold: .9 }],
  ['所以训练大模型，就是在造一台压缩机。', { hold: 1.0 }],
  ['那电脑里的压缩包，也是一本聪明的魔导书？', { who: 'cirno', mood: 'confused' }],
  ['压缩包只会找重复的字句。模型学到了语法和常识，', { hold: .8 }],
  ['拿去压图片和声音，都比 PNG、FLAC 省，', { hold: .6 }],
  ['只是模型本身的大小没算进去。', { hold: 1.0 }],
  ['有人比了 31 个模型：', { hold: .3 }],
  ['压缩得越好，考试分数越高，几乎是一条直线。', { hold: .6 }],
  ['所以有人说，压缩就是智能。这还是一个假说，但它很好用。', { mood: 'smug', hold: .5 }],
]);
const S3T = i => S3LINES[i][0], S3E = i => S3LINES[i][1];
// S3W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S3W = (i, f) => { const l = S3LINES[i], v = voiceOf(l[2]), h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S3END = seqEnd(S3LINES), S3DUR = S3END + 2.0;

// ===================== 数据（全部来自 BITS） =====================
const S3SENT = BITS.lines['今天的晚饭是冰冻青蛙！'];
const S3N = 9;                                                     // 写到「青」为止
const S3CH = S3SENT.chars.slice(0, S3N), S3BITS = S3SENT.bits.slice(0, S3N);
// 丝带组：要猜的那个字的位置 → 候选前 8 名 [字, 概率]；真正出现的字不在前 8 名就补在最后（概率 = 2^−比特）
const S3RIB = [3, 5, 6, 7, 8].map(pos => {
  const top = pos === 8 ? BITS.next['今天的晚饭是冰冻'] : S3SENT.top[pos], real = S3CH[pos];
  const list = top.map(([ch, p]) => ({ ch, p, real: ch === real }));
  if (!list.some(r => r.real)) list.push({ ch: real, p: Math.pow(2, -S3BITS[pos]), real: true, extra: true });
  return { pos, list };
});

// ===================== 布局 =====================
const S3BK = { x: 1350, y: 335, hw: 340, hh: 185 };                  // 小魔导书：书脊中心、半宽、半高（本地坐标 ±hw, ±hh）
const S3CPOS = k => k < 5 ? [-274 + k * 58, -62] : [-274 + (k - 5) * 58, 34];   // 第 k 个字在小书左页上的位置（本地坐标，基线）
const S3RIBY = [S3BK.y + S3BK.hh + 4, 762], S3KNOTY = 668, S3KNOTX = k => 1066 + k * 68, S3KN = 2.6;
const S3PCH = { home: [EP3.pch.x, EP3.pch.y], near: [440, EP3.pch.y] };
const S3CIR = { home: [EP3.cir.x, EP3.cir.y], book: [1752, EP3.cir.y], left: [770, EP3.cir.y] };

// ===================== 节拍（全部由台词时间推出） =====================
const S3B = (() => {
  const T = S3T, E = S3E, w = S3W, B = {};
  B.pop = [.95, 1.45]; B.cwalk0 = [.9, 2.0];
  // 写字：今天的 快写；晚、是、冰、冻 之前各垂一组丝带
  const t0 = T(0) + .55, t1 = E(1) - .15, quick = .28, show = 1.0, pre = S3RIB.slice(0, 4).length;
  const k = (t1 - t0) / (8 * quick + pre * show);
  B.wr = []; B.rib = [];
  let t = t0;
  for (let i = 0; i < 8; i++) { const s = S3RIB.findIndex(r => r.pos === i); if (s >= 0 && s < 4) { B.rib[s] = [t, t + show * k]; t += show * k; } B.wr[i] = t; t += quick * k; }
  B.rib[4] = [T(2) - .15, w(2, .64)];                    // 主角那组：BITS.next
  B.knot = [w(2, .32), w(2, .5)];                         // 「真正出现的那个字」→ 结
  B.wr[8] = w(2, .66);
  B.row = [w(2, .7), E(2) - .1];                          // 一行结
  B.ledger = [w(2, .9), w(3, .12), w(3, .58)];             // 三行手写
  B.formula = [E(3) - .75, E(3) + .45];
  B.back = w(4, 0); B.thin = [w(4, .2), w(4, .62)]; B.tape = [w(4, .42), w(4, .85)]; B.seal1 = w(4, .88);
  B.clear4 = [T(5) - .1, T(5) + .35];
  B.cwalk1 = [T(5) - .2, T(5) + 1.7]; B.move = [T(5) + .1, T(5) + 1.0]; B.parcel = w(5, .55);
  B.row7 = w(6, 0); B.ptr = [w(6, .12), w(6, .42)]; B.tapes = [w(6, .55), w(6, .9)];
  B.clear7 = [T(7) - .2, T(7) + .2]; B.bars = [w(7, .08), w(7, .3), w(7, .5), w(7, .72)]; B.seal2 = w(7, .85);
  B.saw = [T(8) - .1, T(8) + .3]; B.drop = [w(8, .3), w(8, .52)]; B.tilt = [w(8, .5), w(8, .5) + .7];
  B.clear9 = [T(9) - .3, T(9) + .1]; B.axes = [T(9), T(9) + .5]; B.pins = [w(9, .1), E(9) - .1];
  B.line = [w(10, .15), w(10, .6)]; B.seal3 = w(10, .7);
  B.clear11 = [T(11) - .1, T(11) + .3]; B.write = T(11) + .25; B.seal4 = w(11, .6);
  B.cwalk2 = [w(11, .62), w(11, .62) + 1.7]; B.pwalk = [E(11) - .3, E(11) + .7]; B.clearEnd = [E(11) + .1, E(11) + .6];
  B.book = [T(7) - .2, T(7) + .2];                         // 小书收起（和纸包一起）
  return B;
})();

// ===================== 小画具 =====================
// 走位：legs = [[t0, t1, [x, y]], …] 依次走过去（一蹦一蹦），返回 [x, y, 蹦起高度, 正在走的方向 0 | ±1]
function s3Move(tau, home, legs) {
  let p = home, hop = 0, dir = 0;
  for (const [t0, t1, q] of legs) { if (tau >= t1) { p = q; continue; }
    if (tau > t0) { const u = (tau - t0) / (t1 - t0), e = easeIO(u), n = Math.max(2, Math.round((t1 - t0) * 3.2)); hop = Math.abs(Math.sin(u * Math.PI * n)) * 20; dir = Math.sign(q[0] - p[0]); p = [lerp(p[0], q[0], e), lerp(p[1], q[1], e)]; }
    break; }
  return [p[0], p[1], hop, dir];
}
// 弹起：t0 起 d 秒立起（带回弹），t1 起 0.35 秒折平
const s3Up = (tau, t0, t1 = 1e9, d = .45) => easeOutBack(clamp((tau - t0) / d, 0, 1), 1.6) * (1 - sm(t1, t1 + .35, tau));

// 小魔导书的姿态：位置、缩放、立起、变薄
function s3BookPose(tau) {
  const B = S3B, u = sm(B.move[0], B.move[1], tau);
  return { x: lerp(S3BK.x, 1585, u), y: lerp(S3BK.y, 425, u), s: lerp(1, .5, u), k: s3Up(tau, B.pop[0], B.book[0]), thin: sm(B.thin[0], B.thin[1], tau) };
}
// 本地坐标 → 屏幕（书立起时 popup 只压 y，这里按全立起算）
const s3BookPt = (bp, p) => [bp.x + p[0] * bp.s, bp.y + p[1] * bp.s];

function s3Book(c, bp, inner) {
  const { hw, hh } = S3BK;
  popup(c, bp.y + hh * bp.s, clamp(bp.k, 0, 1.2), () => {
    c.save(); c.translate(bp.x, bp.y); c.scale(bp.s, bp.s);
    cutPaper(c, rectPts(-hw - 16, -hh - 12, hw * 2 + 32, hh * 2 + 26, 8), mix(P.purple, P.ink, .45), { seed: 3601, step: 30, blur: 12, sy: 6 });   // 书壳
    const nL = Math.round(lerp(5, 1, bp.thin));                                                                                           // 书页厚度：一页页变薄
    for (let k = nL; k >= 1; k--) cutPaper(c, rectPts(-hw + 4 - k * 2, -hh + 4 + k * 3, hw * 2 - 8 + k * 4, hh * 2, 3), mix(BOOK.page2, '#000000', .05 * k), { seed: 3602 + k, step: 50, shadow: false, grain: 0 });
    for (const sd of [-1, 1]) {
      const path = cutPaper(c, rectPts(sd < 0 ? -hw : 2, -hh, hw - 2, hh * 2, 3), '#efe6d2', { seed: 3610 + sd, step: 50, shadow: false, grain: .12, edge: false });
      c.save(); c.clip(path); const g = c.createLinearGradient(0, 0, sd * 90, 0); g.addColorStop(0, 'rgba(60,40,20,.28)'); g.addColorStop(1, 'rgba(60,40,20,0)'); c.fillStyle = g; c.fillRect(-hw, -hh, hw * 2, hh * 2); c.restore();
    }
    for (let r = 0; r < 4; r++) rline(c, [[30, -96 + r * 64], [hw - 34, -96 + r * 64]], { w: 1.2, color: alpha(P.ink2, .12), seed: 3620 + r });   // 右页淡横格
    inner(c);
    c.restore();
  }, [bp.x - (S3BK.hw + 16) * bp.s, bp.x + (S3BK.hw + 16) * bp.s]);
}

// 羽毛笔：笔尖在 (x, y)，杆往右上斜
function s3Quill(c, x, y, al = 1) {
  if (al <= 0) return;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(.55);
  const vane = [[-3, -26], [-15, -60], [-24, -110], [-17, -160], [-4, -196], [5, -170], [14, -120], [13, -70], [5, -34]];
  cutPaper(c, vane, '#f1ece4', { seed: 3630, step: 10, blur: 6, sx: 3, sy: 5 });
  for (let k = 0; k < 6; k++) { const yy = -52 - k * 24; rline(c, [[0, yy], [-14 + k * .8, yy - 16]], { w: 1.2, color: alpha(P.g2, .6), seed: 3631 + k, amp: .3 }); rline(c, [[0, yy], [11, yy - 14]], { w: 1.2, color: alpha(P.g2, .6), seed: 3640 + k, amp: .3 }); }
  rline(c, [[0, 0], [0, -200]], { w: 2.4, color: P.ink2, seed: 3650, amp: .3 });
  c.fillStyle = P.ink; c.beginPath(); c.moveTo(-3, -12); c.lineTo(0, 2); c.lineTo(3, -12); c.closePath(); c.fill();
  c.restore();
}

// 一条书签丝带：从 top 垂到 bot，宽 w，末端燕尾
function s3Ribbon(c, top, bot, w, col, seed) {
  const n = Math.min(w, 16) * .7, pts = [[top[0] - w / 2, top[1]], [top[0] + w / 2, top[1]], [bot[0] + w / 2, bot[1]], [bot[0], bot[1] - n], [bot[0] - w / 2, bot[1]]];
  cutPaper(c, pts, col, { seed, step: 14, blur: 3, sx: 1.5, sy: 2, grain: .05 });
}
// 结：r = 比特数 × S3KN，k 0..1 打结的动画
function s3Knot(c, x, y, r, col, k = 1, seed = 3700) {
  if (k <= .01 || r <= .5) return;
  pop(c, x, y, easeOutBack(clamp(k, 0, 1), 2.2), () => {
    for (const sd of [-1, 1]) rline(c, ellPts(x + sd * r * .95, y - r * .15, r * .5, r * .34, 20, sd * .5), { w: Math.max(2, r * .22), color: col, close: true, seed: seed + sd, amp: .4 });
    cutPaper(c, ellPts(x, y, r * .72, r * .62, 18), col, { seed, step: 6, blur: 4, sx: 1, sy: 2 });
    rline(c, [[x - r * .3, y - r * .1], [x + r * .25, y + r * .2]], { w: Math.max(1.2, r * .08), color: alpha('#ffffff', .35), seed: seed + 5, amp: .3 });
  });
}
// 纸包（压缩包）：牛皮纸 + 十字绳 + 顶上的绳结
function s3Parcel(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  cutPaper(c, rectPts(-115, -78, 230, 156, 8), '#c4a57a', { seed: 3710, step: 24, blur: 10, sy: 5, grain: .16 });
  rline(c, [[-80, -60], [-60, -40], [-70, 55]], { w: 1.5, color: alpha('#7a5e3c', .5), seed: 3711 });
  rline(c, [[-118, 4], [118, -2]], { w: 5, color: '#8a6a45', seed: 3712 });
  rline(c, [[-6, -80], [4, 80]], { w: 5, color: '#8a6a45', seed: 3713 });
  for (const sd of [-1, 1]) rline(c, ellPts(sd * 22, -84, 22, 13, 18, sd * .4), { w: 4, color: '#8a6a45', close: true, seed: 3714 + sd });
  cutPaper(c, circPts(0, -82, 8, 10), '#8a6a45', { seed: 3716, step: 4, blur: 2 });
  zh(c, '压缩包', 58, 50, { size: 30, color: P.ink2, align: 'center' });
  c.restore();
}
// 一本厚书（砸在跷跷板上的那摞）
function s3Tome(c, x, y, w, h, col, seed) {
  cutPaper(c, rectPts(x - w / 2, y - h, w, h, 5), col, { seed, step: 26, blur: 8, sy: 4 });
  cutPaper(c, rectPts(x - w / 2 + 10, y - h + 7, w - 10, h - 14, 2), '#ece3cf', { seed: seed + 1, step: 40, shadow: false, grain: .08 });
  for (let k = 1; k < 4; k++) rline(c, [[x - w / 2 + 14, y - h + k * h / 4], [x + w / 2 - 4, y - h + k * h / 4]], { w: 1, color: alpha(P.g2, .4), seed: seed + 2 + k, amp: .3 });
  cutPaper(c, rectPts(x - w / 2, y - h, 16, h, 3), mix(col, '#000000', .2), { seed: seed + 7, step: 20, shadow: false });
}

// ===================== 各块画面 =====================
// 小书里的字 + 羽毛笔 + 丝带 + 结（L1–L5）
function s3Writing(c, tau, bp) {
  const B = S3B;
  // 羽毛笔的路线：每个字前悬停，写的时候划一下
  const rest = [150, 70], K = [[B.pop[1], rest]];
  for (let k = 0; k < S3N; k++) { const [x, y] = S3CPOS(k); K.push([B.wr[k] - .18, [x - 8, y - 34]], [B.wr[k], [x - 18, y - 10]], [B.wr[k] + .2, [x + 16, y - 16]]); }
  K.push([B.wr[8] + .7, rest]);
  const qal = sm(B.pop[0] + .3, B.pop[1], tau) * (1 - sm(B.back - .2, B.back + .2, tau));
  s3Book(c, bp, g => {
    // 字：写出来，L5 倒着流回书脊
    for (let k = 0; k < S3N; k++) {
      const a = sm(B.wr[k], B.wr[k] + .18, tau); if (a <= 0) continue;
      const u = sm(B.back + k * .07, B.back + k * .07 + .55, tau, easeIn), [x, y] = S3CPOS(k), X = lerp(x, -6, u), Y = lerp(y, -40, u) - Math.sin(u * Math.PI) * 50;
      if (u >= 1) continue;
      pop(g, X, Y - 18, 1 - u * .7, () => zh(g, S3CH[k], X, Y, { size: 50, color: k === 8 ? P.purple : P.ink, align: 'center', al: a * (1 - u * u) }));
    }
    // 右页：「下一个字？」（垂丝带的时候）
    const ask = Math.max(...B.rib.map(([a, b]) => win(a, b, tau, .25)));
    if (ask > 0) zh(g, '下一个字？', 172, -104, { size: 34, color: P.ink2, align: 'center', al: ask });
    const [qx, qy] = key(tau, K);
    s3Quill(g, qx, qy + Math.sin(tau * 7) * 2, qal);
  });
  if (bp.k < .5) return;
  // 丝带
  B.rib.forEach(([a, b], s) => {
    const L = sm(a, a + .35, tau) * (1 - sm(b - .28, b, tau)); if (L <= 0) return;
    const list = S3RIB[s].list, n = list.length, main = s === 4, gap = main ? 66 : 58, W = main ? 270 : 230;
    list.forEach((r, j) => {
      const off = (j - (n - 1) / 2) + (r.extra ? .45 : 0), top = [S3BK.x + off * 7, S3RIBY[0]], bot = [S3BK.x + off * gap, lerp(S3RIBY[0], S3RIBY[1], L)], w = Math.max(3, r.p * W);
      const col = r.real ? P.purple : mix(P.g1, P.moon, .22);
      s3Ribbon(c, top, [lerp(top[0], bot[0], L), bot[1]], w, col, 3660 + j + s * 10);
      if (L > .85) zh(c, r.ch === '\n' ? '↵' : r.ch, bot[0], S3RIBY[1] + 44, { size: 36, color: r.real ? P.purple : P.ink2, align: 'center', al: sm(.85, 1, L) });
      if (main && r.real) {   // 主角那组：真正出现的「青」打一个结
        const kk = sm(B.knot[0], B.knot[1], tau) * L, kx = lerp(top[0], bot[0], .72), ky = lerp(top[1], S3RIBY[1], .72);
        s3Knot(c, kx, ky, S3BITS[8] * S3KN * 1.4, P.purple, kk, 3690);
      }
    });
    if (main && L > .9) zh(c, '丝带越宽，猜它的把握越大', S3BK.x, 872, { size: 28, color: P.ink2, align: 'center', al: sm(.9, 1, L) * (1 - sm(B.knot[0], B.knot[0] + .3, tau)) });
  });
  // 一行结：每个字要付的比特
  const rowA = sm(B.row[0], B.row[0] + .3, tau);
  if (rowA > 0) {
    const gone = k => sm(B.back + .1 + k * .06, B.back + .5 + k * .06, tau, easeIn);
    rline(c, [[1030, S3KNOTY], [1650, S3KNOTY]], { w: 2.2, color: alpha(P.purple, .7), seed: 3720, p: sm(B.row[0], B.row[0] + .4, tau), al: 1 - sm(B.back + .1, B.back + .5, tau) });
    for (let k = 0; k < S3N; k++) {
      const kk = sm(B.row[0] + .15 + k * .09, B.row[0] + .45 + k * .09, tau), u = gone(k); if (kk <= 0 || u >= 1) continue;
      const x = lerp(S3KNOTX(k), S3BK.x, u), y = lerp(S3KNOTY, S3BK.y + S3BK.hh, u);
      zh(c, S3CH[k], x, y - 50, { size: 28, color: k === 8 ? P.purple : P.ink2, align: 'center', al: kk * (1 - u) });
      s3Knot(c, x, y, S3BITS[k] * S3KN * (1 - u * .6), P.purple, kk, 3730 + k);
    }
  }
  // 封底吐出一截短纸带 + 定理蜡封
  const tp = sm(B.tape[0], B.tape[1], tau, easeOut), out = 1 - sm(B.clear4[0], B.clear4[1], tau);
  if (tp > 0 && out > 0) {
    tape(c, { x: 1330, y: 552, rot: .07, cells: S3BITS.map(b => ({ bits: b })), unit: 6, h: 42, p: tp, al: out });
    fade(c, out * sm(B.seal1 - .2, B.seal1 + .1, tau), () => zh(c, '预测多准，就能压多短（算术编码）', 1300, 684, { size: 30, color: P.ink2, align: 'center' }));
    seal(c, 1580, 674, 'thm', { r: 30, k: sm(B.seal1, B.seal1 + .6, tau, x => x), al: out });
  }
}

// 左页角的账本：平均每字要付的比特 = 交叉熵 = 训练损失，外加公式彩蛋
function s3Ledger(c, tau) {
  const B = S3B, out = 1 - sm(B.clear4[0], B.clear4[1], tau); if (out <= 0 || tau < B.ledger[0]) return;
  c.save(); c.globalAlpha *= out;
  const L = [['平均每字要付的比特', B.ledger[0]], ['＝ 交叉熵', B.ledger[1]], ['＝ 训练损失', B.ledger[2]]];
  L.forEach(([s, t0], i) => zh(c, s, 540 + (i ? 40 : 0), 250 + i * 72, { size: i ? 46 : 40, color: i === 2 ? P.purple : P.ink, p: writeP(tau, t0, s, .08) }));
  const f = win(B.formula[0], B.formula[1], tau, .3);
  if (f > 0) zh(c, '−Σ p · log₂ q', 700, 500, { size: 40, color: P.ink2, align: 'center', al: .45 * f });
  c.restore();
}

// L7：压缩包 vs 魔导书
function s3Parcels(c, tau) {
  const B = S3B, out = 1 - sm(B.clear7[0], B.clear7[1], tau); if (out <= 0 || tau < B.parcel - .1) return;
  c.save(); c.globalAlpha *= out; c.translate(0, (1 - out) * 40);
  const d = clamp((tau - B.parcel) / .5, 0, 1);
  if (d > 0) s3Parcel(c, 1150, lerp(120, 430, easeOutBack(d, 1.2)), 1);
  // 一行重复的话 → 后两遍缩成指针
  const ra = sm(B.row7 - .1, B.row7 + .25, tau);
  if (ra > 0) {
    const s = '我是最强的！', size = 34, x0 = 1010, y0 = 222, cw = zhWidth(c, s, size), u = sm(B.ptr[0], B.ptr[1], tau);
    zh(c, s, x0, y0, { size, color: P.ink, al: ra });
    for (let r = 1; r <= 2; r++) {
      const ox = x0 + r * (cw + 6), tx = x0 + cw + 12 + (r - 1) * 64;
      if (u < 1) zh(c, s, lerp(ox, tx, u), y0, { size: size * (1 - u * .6), color: P.ink2, al: ra * (1 - u) });
      if (u > 0) {
        const bx = lerp(ox, tx, u);
        fade(c, sm(.3, 1, u), () => {
          cutPaper(c, rectPts(bx, y0 - 34, 52, 42, 6), mix(P.purple, P.paper, .72), { seed: 3740 + r, step: 12, blur: 3 });
          arrow(c, [bx + 40, y0 - 13], [bx + 12, y0 - 13], { w: 2.5, color: P.purple, head: 8, seed: 3748 + r });
          arrow(c, [bx + 26, y0 - 36], [x0 + 12 + (r - 1) * 20, y0 - 38], { w: 2.5, color: P.purple, bend: 22 + r * 12, head: 12, seed: 3745 + r, p: sm(.5, 1, u) });
        });
      }
    }
  }
  // 新写的中文，每个字要打的孔：纸包（gzip）一长截，魔导书（模型）一小截
  const ta = sm(B.tapes[0], B.tapes[1], tau, easeOut);
  if (ta > 0) {
    tape(c, { x: 1045, y: 640, cells: [{ bits: BITS.dial.old.gzip }], unit: 14, h: 44, p: ta });
    tape(c, { x: 1560, y: 640, cells: [{ bits: BITS.dial.new.model }], unit: 14, h: 44, p: ta });
    zh(c, '同一段新写的中文，每个字要打的孔', 1330, 726, { size: 28, color: P.ink2, align: 'center', al: sm(.6, 1, ta) });
  }
  c.restore();
}

// L8–L9：剪纸条 + 跷跷板
function s3Bars(c, tau) {
  const B = S3B, out = 1 - sm(B.clear9[0], B.clear9[1], tau); if (out <= 0 || tau < B.bars[0] - .3) return;
  c.save(); c.globalAlpha *= out; c.translate(0, (1 - out) * 40);
  const Lf = 540, x0 = 1120, rows = [['图片', 238, [['PNG', 58.5, B.bars[0]], ['模型', 43.4, B.bars[1]]]], ['声音', 432, [['FLAC', 30.3, B.bars[2]], ['模型', 16.4, B.bars[3]]]]];
  for (const [title, y, bars] of rows) {
    zh(c, title, 1012, y, { size: 38, color: P.ink, al: sm(bars[0][2] - .3, bars[0][2], tau) });
    bars.forEach(([lab, v, t0], j) => {
      const g = sm(t0, t0 + .45, tau, easeOut); if (g <= 0) return;
      const yy = y + 50 + j * 56, w = Lf * v / 100 * g, model = lab === '模型';
      zh(c, lab, 1012, yy + 12, { size: 30, color: model ? P.purple : P.ink2, al: sm(0, .3, g) });
      if (w > 2) cutPaper(c, rectPts(x0, yy - 16, w, 34, 3), model ? P.purple : P.g2, { seed: 3760 + j + y, step: 22, blur: 4, sy: 3 });
      zh(c, v + '%', x0 + w + 14, yy + 12, { size: 30, color: model ? P.purple : P.ink2, al: sm(.7, 1, g) });
    });
  }
  const fa = sm(B.bars[3], B.bars[3] + .4, tau) * (1 - sm(B.saw[0] - .2, B.saw[0] + .2, tau));
  if (fa > 0) { zh(c, '原始压缩率，越短越省；数据切成 2048 字节小块', 1012, 618, { size: 26, color: P.ink2, al: fa }); zh(c, 'Delétang 等 2024', 1012, 656, { size: 24, color: P.g2, al: fa }); }
  seal(c, 1728, 250, 'exp', { r: 30, k: sm(B.seal2, B.seal2 + .6, tau, x => x) });
  // 跷跷板
  const up = s3Up(tau, B.saw[0], 1e9, .4);
  if (up > .01) {
    const fx = 1385, fy = 800, ang = .1 * easeOutBack(sm(B.tilt[0], B.tilt[1], tau, x => x), 2);
    popup(c, 870, clamp(up, 0, 1.15), () => {
      cutPaper(c, [[fx, fy - 4], [fx + 44, 866], [fx - 44, 866]], '#6b4a36', { seed: 3780, step: 14, blur: 6 });
      spin(c, fx, fy, ang, () => {
        cutPaper(c, rectPts(1030, fy - 14, 710, 16, 4), '#8a6a4e', { seed: 3781, step: 30, blur: 6, sy: 3 });
        cutPaper(c, rectPts(1060, fy - 68, 150, 54, 4), P.g1, { seed: 3782, step: 16, blur: 5 });
        zh(c, 'PNG、FLAC', 1135, fy - 30, { size: 24, color: P.ink2, align: 'center' });
        s3Tome(c, 1650, fy - 14, 150, 50, mix(P.purple, P.ink, .3), 3783);
        zh(c, '模型', 1650, fy - 26, { size: 24, color: P.purple, align: 'center' });
        // 一摞大书从天而降
        const dk = sm(B.drop[0], B.drop[1], tau, easeIn);
        if (dk > 0) {
          const dy = (1 - dk) * -520, base = fy - 64 + dy, cols = ['#5b3034', '#4a4a5e', '#6b4a36', '#3f5a52', '#5b3034'];
          for (let k = 0; k < 5; k++) s3Tome(c, 1650 + (hash(k, 37) - .5) * 26, base - k * 52, 190 - k * 8, 50, cols[k], 3790 + k * 10);
        }
      });
    }, [1030, 1740]);
    const la = sm(B.drop[1], B.drop[1] + .35, tau);
    if (la > 0) { zh(c, '模型本身 ≈ 140 GB', 1530, 660, { size: 34, color: P.ink, align: 'right', al: la }); zh(c, '（Chinchilla 70B）', 1530, 700, { size: 26, color: P.ink2, align: 'right', al: la }); }
  }
  c.restore();
}

// L10–L11：31 枚图钉 + 一根线（示意图，不画刻度）
const S3PINS = Array.from({ length: 31 }, (_, i) => {
  const u = clamp((i + .5) / 31 + (hash(i, 41) - .5) * .03, 0, 1), n = (hash(i, 42) + hash(i, 43) - 1) * 34;
  return { x: 1100 + u * 560, y: 300 + u * 420 + n, t: hash(i, 44) };
});
function s3Pins(c, tau) {
  const B = S3B, out = 1 - sm(B.clear11[0], B.clear11[1], tau); if (out <= 0 || tau < B.axes[0]) return;
  c.save(); c.globalAlpha *= out;
  const ax = sm(B.axes[0], B.axes[1], tau);
  rline(c, [[1050, 236], [1050, 790], [1740, 790]], { w: 3, color: P.ink2, p: ax, seed: 3800 });
  if (ax >= 1) { rline(c, [[1040, 254], [1050, 234], [1060, 254]], { w: 3, color: P.ink2, seed: 3801 }); rline(c, [[1722, 780], [1742, 790], [1722, 800]], { w: 3, color: P.ink2, seed: 3802 }); }
  const la = sm(B.axes[0] + .2, B.axes[1] + .2, tau);
  zh(c, '示意：31 个模型，r ≈ −0.93，Huang 等 2024', 1050, 186, { size: 28, color: P.ink2, al: la });
  zh(c, '考试分', 1068, 262, { size: 28, color: P.ink2, al: la });
  zh(c, '每字比特 →', 1740, 836, { size: 28, color: P.ink2, align: 'right', al: la });
  zh(c, '← 压得越好', 1060, 836, { size: 26, color: P.purple, al: la });
  // 线：最小二乘拟合那 31 个点
  const n = S3PINS.length, mx = S3PINS.reduce((a, p) => a + p.x, 0) / n, my = S3PINS.reduce((a, p) => a + p.y, 0) / n;
  const b = S3PINS.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / S3PINS.reduce((a, p) => a + (p.x - mx) ** 2, 0), fy = x => my + b * (x - mx);
  const lp = sm(B.line[0], B.line[1], tau);
  if (lp > 0) { rline(c, [[1080, fy(1080)], [1690, fy(1690)]], { w: 2.4, color: '#6b4f55', p: lp, seed: 3810, amp: .3 }); brassPin(c, 1080, fy(1080), 8); if (lp >= 1) brassPin(c, 1690, fy(1690), 8); }
  S3PINS.forEach((p, i) => {
    const t0 = lerp(B.pins[0], B.pins[1] - .2, p.t), k = clamp((tau - t0) / .25, 0, 1); if (k <= 0) return;
    pop(c, p.x, p.y, easeOutBack(k, 2.5), () => {
      c.fillStyle = 'rgba(40,25,15,.25)'; c.beginPath(); c.ellipse(p.x + 3, p.y + 4, 8, 5, 0, 0, TAU); c.fill();
      cutPaper(c, circPts(p.x, p.y, 8, 12), i % 5 === 0 ? P.purple : P.red, { seed: 3820 + i, step: 4, blur: 2, sx: 1, sy: 2, grain: 0 });
      c.fillStyle = 'rgba(255,240,230,.6)'; c.beginPath(); c.arc(p.x - 2.5, p.y - 2.5, 2.4, 0, TAU); c.fill();
    });
  });
  seal(c, 1700, 318, 'corr', { r: 30, k: sm(B.seal3, B.seal3 + .6, tau, x => x) });
  c.restore();
}

// L12：「压缩就是智能」+ 假说蜡封
function s3Motto(c, tau) {
  const B = S3B, out = 1 - sm(B.clearEnd[0], B.clearEnd[1], tau); if (out <= 0 || tau < B.write) return;
  c.save(); c.globalAlpha *= out;
  const s = '压缩就是智能', p = writeP(tau, B.write, s, .16);
  zh(c, s, 1370, 380, { size: 96, color: P.ink, align: 'center', p });
  rline(c, [[1100, 408], [1640, 402]], { w: 3, color: alpha(P.purple, .7), seed: 3850, p: sm(B.write + 1.0, B.write + 1.5, tau) });
  seal(c, 1728, 330, 'hyp', { r: 34, k: sm(B.seal4, B.seal4 + .6, tau, x => x) });
  c.restore();
}

// ===================== 人物 =====================
function s3Pch(c, tau, L) {
  const B = S3B, T = S3T, E = S3E;
  const [x, y, hop, dir] = s3Move(tau, S3PCH.home, [[T(2) - .1, T(2) + .9, S3PCH.near], [B.pwalk[0], B.pwalk[1], S3PCH.home]]);
  let pose = 'lecture', gesture;
  if (tau > B.ledger[1] - .3 && tau < E(3)) pose = 'point';
  else if (tau > B.axes[0] && tau < B.seal3 + .6) pose = 'point';
  else if (tau > T(11) + .1 && tau < E(11) - .2) pose = 'cross';
  const mood = L.who === 'patchouli' || !L.who ? moodOf(L, 'patchouli') : 'normal';
  drawPatchouli(c, { ...EP3.pch, x, y: y - hop, pose, gesture, facing: dir < 0 ? -1 : 1, mood, mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
}
function s3Cir(c, tau, L) {
  const B = S3B, T = S3T, E = S3E;
  const [x, y, hop, dir] = s3Move(tau, S3CIR.home, [[B.cwalk0[0], B.cwalk0[1], S3CIR.book], [B.cwalk1[0], B.cwalk1[1], S3CIR.left], [B.cwalk2[0], B.cwalk2[1], S3CIR.home]]);
  let pose = 'stand', facing = -1, mood = 'normal';
  if (tau > B.cwalk0[1] && tau < B.cwalk1[0]) { pose = 'think'; mood = tau > B.knot[0] && tau < B.row[1] ? 'surprised' : 'normal'; }
  if (tau >= B.cwalk1[1] && tau < B.cwalk2[0]) {
    facing = 1;
    if (tau < E(5) + .3) pose = 'point';
    else if (tau > B.drop[0] && tau < E(8)) { pose = 'stand'; mood = 'surprised'; }
    else if (tau > T(9) && tau < E(10)) pose = 'think';
    else if (tau > T(11)) { pose = 'stand'; mood = 'happy'; }
  }
  if (dir) { facing = dir; pose = 'stand'; }
  if (L.who === 'cirno') mood = moodOf(L, 'cirno');
  drawCirno(c, { ...EP3.cir, x, y: y - hop, pose, facing, mood, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

function s3Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第三页 · 会猜的魔导书', tau, .9);
  const bp = s3BookPose(tau);
  if (bp.k > .001) s3Writing(c, tau, bp);
  s3Ledger(c, tau);
  s3Parcels(c, tau);
  s3Bars(c, tau);
  s3Pins(c, tau);
  s3Motto(c, tau);
  s3Pch(c, tau, L);
  s3Cir(c, tau, L);
}

scene({ order: 3, key: 'llm', title: '大模型', dur: S3DUR, lines: S3LINES, fn: s3Draw });
