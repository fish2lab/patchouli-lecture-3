'use strict';
// 第 2 段：比特（第三稿）。问一次「是不是」= 对折一次 = 纸带打一个孔 = 1 比特。
//   开头 0.8 秒是标准画面；镜头右移出书、俯拍桌面（第二稿暗号段的对折剪纸），帕秋莉站在书页剩下的一窄条上，琪露诺站在桌子右边。
//   桌上：一张方纸 = 琪露诺来找帕秋莉的所有时候；左下一台八音盒，吐出一截空纸带。
//   L1 方纸、八音盒和空纸带。L2 中线；右半张写「我是最强的」。
//   L3 左半张翻折过去再打开（问一次）→ 纸带打 1 个孔；剪刀沿折痕剪开，右半张滑开；「1 比特」。纸带撕下，挂到那半张下面。
//   L4 剩下的半张：剪口一闪 = 第 1 问（孔 1），横折 = 第 2 问（孔 2），竖折 = 第 3 问（孔 3）；剪出 1/8，写「来玩」；「3 比特」。
//   L5 ★ 两张纸片并排：大纸片挂 1 个孔、小纸片挂 3 个孔；剩下的纸退到背景。
//   L6 四张纸片（1/2、1/4、1/8、1/8）排成一排，各挂一截纸带（1、2、3、3 个孔）；「平均下来」时每截纸带按自己那张纸片的大小缩短
//      （缩短后的总长就是平均码长，画面不写数）。
//   L7 ★ 四截缩短的纸带首尾接成一条，手写「熵」，盖定理蜡封「香农 1948」。
//   L8 琪露诺指着最大的那张「我是最强的」；L9 帕秋莉抱臂得意。镜头回到书页，右上角淡淡出现 H = Σ p·(−log₂p) 约 1 秒；最后 0.8 秒是标准画面。
// 所有节拍按 S2LINES 的时间和语音进度算（S2K：说到某个词的时刻）。顶层名字一律带本段前缀 S2 / s2。
const S2LINES = seq(1.0, [
  ['消息有多少，可以数出来：猜中它，要问几次「是不是」。', { pause: .5, hold: .8 }],
  ['你来找我，一半的时候是说「我是最强的」。', { pause: .2, hold: .8 }],
  ['我只要问一次「是这句吗」，一半的时候就猜中了。这叫 1 比特。', { pause: .3, hold: 1.4 }],
  ['少见的话，要多问几次。八分之一的话，要问三次：3 比特。', { pause: .3, hold: 1.6 }],
  ['越难猜，比特越多。', { pause: .3, hold: 1.6 }],
  ['常说的话用短暗号，少说的用长暗号，平均下来最省。', { pause: .3, hold: 1.6 }],
  ['省到不能再省的那个数，香农叫它「熵」。', { pause: .6, hold: 1.6 }],
  ['所以「我是最强的」……只值 1 比特？', { who: 'cirno', mood: 'surprised', pause: .3, hold: .5 }],
  ['全幻想乡都猜得到，当然不值钱。', { mood: 'smug', hold: .4 }],
]);
const S2T = i => S2LINES[i][0], S2E = i => S2LINES[i][1];
// S2W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）；S2K：说到 word 的时刻（按字位置估）
const S2W = (i, f) => { const l = S2LINES[i], v = voiceOf(l[2]), h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S2K = (i, word) => { const s = S2LINES[i][2], k = s.indexOf(word); return S2W(i, Math.max(0, k) / s.length); };
const S2END = seqEnd(S2LINES), S2DUR = S2END + 2.7;

// ===================== 桌面上的东西（俯拍时的屏幕坐标） =====================
// 站位区：帕秋莉 x 125–375（书页剩下的一窄条），琪露诺 x 1586–1894；道具和字只放在 x 420–1560、y 90–880 之间。
const S2PAN = 1400;                                                    // 出书俯拍：镜头右移多少
const S2SQ = { x: 500, y: 96, s: 500 };                               // 方纸 = 所有的时候
const S2CAM = { cx: 750, cy: 346, F: 1500 };                           // 翻折时的透视
const S2BOX = { x: 560, y: 800 };                                      // 八音盒正面中心；纸带出口 = x + 84, y + 6
const S2OUT = [S2BOX.x + TAPE.box.x, S2BOX.y + TAPE.box.y];
const S2U = 60, S2TH = 48;                                             // 纸带：每比特 60 像素、宽 48
const S2PAPER = P.cap, S2PAPERB = mix(P.cap, P.paperEdge, .38);
// 四张纸片（剪下来以后的颜色、大小、比特数、概率）。a 是纸上的原位（左上角）
const S2PC = (() => { const { x, y, s } = S2SQ, h = s / 2, q = s / 4; return {
  A: { r: [x + h, y, h, s], n: 1, p: 1 / 2, col: mix(mix(P.purple, P.ink, .12), P.cap, .68), t: '我是最强的' },
  B: { r: [x, y, h, h], n: 2, p: 1 / 4, col: mix(mix(P.blue, P.ink, .12), P.cap, .7) },
  C: { r: [x + q, y + h, q, h], n: 3, p: 1 / 8, col: mix(mix(P.moon, P.ink, .38), P.cap, .66), t: '来玩' },
  D: { r: [x, y + h, q, h], n: 3, p: 1 / 8, col: mix(mix(P.g3, P.hairDark, .25), P.cap, .7) },
}; })();
const S2ROW = { A: [540, 96], B: [840, 346], C: [1140, 346], D: [1315, 346] };    // 第 6 句排成一排（左上角），底边都在 y = 596
const S2PARK = { A: [1040, 96], C: [1340, 346] };                                  // 第 3–5 句：大纸片、小纸片放到右边
const S2JOIN = { x: 990, y: 830, u: 100 };                                          // 第 7 句：接成的一条纸带（中心、每比特宽）
const S2CARD = [850, 752, 500, 150];                                                // 接纸带、写「熵」、盖蜡封的那张卡片
const S2LAB = mix(P.cap, P.paperEdge, .15);                                          // 桌面上的手写字（木桌深色，用浅色）

// ===================== 节拍 =====================
const S2B = (() => { const t = S2T, e = S2E, k = S2K, B = {};
  B.pan = [.85, 1.9];
  B.sheet = Math.max(B.pan[1] - .3, k(0, '消息')); B.box = k(0, '要问几次');
  B.mid = k(1, '一半'); B.say = k(1, '我是最强的');
  B.f1 = k(2, '问一次'); B.cut1 = k(2, '一半的时候'); B.bit1 = k(2, '1 比特'); B.tear1 = B.bit1 + 1.0;
  B.q1 = k(3, '少见') + .1; B.f2 = k(3, '多问几次'); B.f3 = k(3, '八分之一'); B.cut3 = k(3, '要问三次'); B.bit3 = k(3, '3 比特'); B.lw = B.bit3 + .7;
  B.pair = t(4);                                                  // 第 5 句：两张纸片并排
  B.row = t(5) - .1; B.more = k(5, '少说的'); B.sq = k(5, '平均下来');
  B.join = t(6) + .05; B.ent = k(6, '熵'); B.seal = B.ent + .4;
  B.pick = k(7, '我是最强的'); B.back = [e(8) - .1, e(8) + .9]; B.egg = [e(8) + .9, e(8) + 1.9];
  return B; })();
// 一次对折：翻起 .35 秒、停 .1 秒、翻回 .3 秒；折到最高时打孔
const S2FOLD = (a, tau) => Math.PI * (sm(a, a + .35, tau) - sm(a + .45, a + .75, tau)) * .985;
const S2APEX = a => a + .38;

// ===================== 小画具 =====================
const s2Proj = (x, y, z) => { const k = S2CAM.F / (S2CAM.F - z); return [S2CAM.cx + (x - S2CAM.cx) * k, S2CAM.cy + (y - S2CAM.cy) * k]; };
const s2Rect = ([x, y, w, h]) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// 平放的一片纸（多边形）：先画一道厚边，再贴上去
function s2Sheet(c, pts, color, seed, lift = 0) {
  c.fillStyle = alpha(P.ink, .10 + lift * .012); c.fill(polyPath(pts.map(([a, b]) => [a + 3 + lift * .6, b + 7 + lift])));
  c.fillStyle = mix(P.paperEdge, P.ink, .12); c.fill(polyPath(pts.map(([a, b]) => [a + 1.5, b + 4])));
  return cutPaper(c, pts, color, { seed, step: 34, blur: 8, sy: 6, grain: .12, shadow: false });
}
// 翻起来的那一片：绕折线（ax 'v' 竖线 x = a，'h' 横线 y = a）转 th，按透视投影；背面略暗；桌上有它的影子
function s2Flap(c, r, ax, a, th) {
  const p3 = s2Rect(r).map(([px, py]) => { const d = ax === 'v' ? px - a : py - a, z = Math.abs(d) * Math.sin(th), m = a + d * Math.cos(th);
    return ax === 'v' ? [m, py, z] : [px, m, z]; });
  const st = Math.sin(th);
  c.save(); c.fillStyle = alpha(P.ink, .16 * st); c.fill(polyPath(p3.map(([px, py, z]) => [px + z * .28, py + z * .38]))); c.restore();
  const path = polyPath(p3.map(q => s2Proj(...q)));
  c.save(); c.translate(0, 4); c.fillStyle = mix(P.paperEdge, P.ink, .12); c.fill(path); c.restore();
  c.fillStyle = th < Math.PI / 2 ? S2PAPER : S2PAPERB; c.fill(path); grain(c, path, .12);
  c.fillStyle = alpha(P.ink, .10 * Math.abs(Math.cos(th)) * (th > Math.PI / 2 ? 1 : .4)); c.fill(path);
  c.strokeStyle = alpha(P.paperEdge, .9); c.lineWidth = 1.5; c.stroke(path);
}
// 剪刀：(x, y) 是刀口，ang 朝前方向，open 张开角
function s2Scissors(c, x, y, ang, open, al = 1) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(ang); c.scale(1.2, 1.2);
  const steel = mix(P.g1, P.g2, .45), grip = mix(P.purple, P.ink, .1);
  for (const s of [-1, 1]) { c.save(); c.rotate(s * open);
    cutPaper(c, [[0, 0], [-8, -6 * s], [-150, -4 * s], [-150, 3 * s]].map(([a, b]) => [a + 70, b]), steel, { seed: 3900 + s, step: 12, blur: 4 });
    rline(c, circPts(-104, 26 * s, 24, 20), { w: 9, color: grip, close: true, seed: 3902 + s, amp: .5 });
    rline(c, [[-80, 10 * s], [-40, 2 * s]], { w: 9, color: grip, seed: 3904 + s, amp: .4 });
    c.restore(); }
  brassPin(c, -40, 0, 7);
  c.restore();
}
// 折线上第 u（0..1，按长度）处的点和方向
function s2Along(pts, u) {
  const L = pathLen(pts), end = L * clamp(u, 0, 1); let acc = 0;
  for (let k = 1; k < pts.length; k++) { const [a, b] = [pts[k - 1], pts[k]], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + d >= end || k === pts.length - 1) { const f = clamp((end - acc) / (d || 1), 0, 1); return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])]; } acc += d; }
}
// 沿 cut 剪一刀：t0 起剪刀进场，剪 dur 秒；返回剪完的比例
function s2Cut(c, tau, cut, t0, dur) {
  const cu = sm(t0 + .12, t0 + .12 + dur, tau, x => x);
  if (tau > t0 - .5 && cu < 1) rline(c, cut, { w: 1.5, color: alpha(P.ink2, .45), dash: [8, 7], seed: 3910, amp: .2 });
  if (cu > 0) rline(c, cut, { w: 2.5, color: P.ink2, p: cu, seed: 3911, amp: .3 });
  const sa = win(t0, t0 + dur + .35, tau, .12);
  if (sa > 0) { const [x, y, ang] = s2Along(cut, cu), back = 40 * (1 - sm(t0, t0 + .12, tau));
    s2Scissors(c, x - Math.cos(ang) * back, y - Math.sin(ang) * back, ang, .05 + .22 * Math.abs(Math.sin((tau - t0) * 16)), sa); }
  return cu;
}
const s2Hop = (tau, a, b, n = 2, amp = 16) => tau > a && tau < b ? amp * Math.abs(Math.sin((tau - a) / (b - a) * Math.PI * n)) : 0;
// 纸片当前的左上角：原位 → 停放处 → 一排 → …（关键帧，时间都来自 S2B）
function s2PiecePos(id, tau) {
  const B = S2B, [x0, y0] = S2PC[id].r, row = S2ROW[id];
  if (id === 'A') return key(tau, [[B.cut1 + .6, [x0, y0]], [B.cut1 + 1.3, S2PARK.A], [B.row, S2PARK.A], [B.row + .8, row]]);
  if (id === 'C') return key(tau, [[B.cut3 + .7, [x0, y0]], [B.cut3 + 1.0, [x0 + 16, y0 + 12]], [B.pair, [x0 + 16, y0 + 12]], [B.pair + .7, S2PARK.C], [B.row, S2PARK.C], [B.row + .8, row]]);
  return key(tau, [[B.row, [x0, y0]], [B.row + .8, row]]);
}
// 一截挂在纸片下面的竖纸带（纸片底边中点往下），返回画纸带用的参数
const s2Hang = (id, tau) => { const [x, y] = s2PiecePos(id, tau), r = S2PC[id].r; return { x: x + r[2] / 2, y: y + r[3] + 14, rot: Math.PI / 2 }; };
// 第 6 句末：每截纸带按自己那张纸片的大小缩短；返回当前的比特数
const s2Sq = (id, tau) => { const q = S2PC[id]; return q.n * lerp(1, q.p, sm(S2B.sq, S2B.sq + 1.0, tau)); };
// 接成一条时第 i 截的左端
const S2ORDER = ['A', 'B', 'C', 'D'];
function s2JoinAt(i) { const tot = S2ORDER.reduce((a, id) => a + S2PC[id].n * S2PC[id].p, 0); let x = S2JOIN.x - tot * S2JOIN.u / 2;
  for (let k = 0; k < i; k++) x += S2PC[S2ORDER[k]].n * S2PC[S2ORDER[k]].p * S2JOIN.u; return x; }

// ===================== 桌面：方纸、对折、剪 =====================
function s2Desk(c, tau) {
  const B = S2B, { x: X, y: Y, s: S } = S2SQ, h = S / 2, q = S / 4;
  const ap = sm(B.sheet, B.sheet + .5, tau, easeOut); if (ap <= 0) return;
  c.save(); c.globalAlpha *= ap; c.translate(0, -30 * (1 - ap));
  const dimAll = B.join < tau ? 1 - .65 * sm(B.join, B.join + .5, tau) : 1;               // 第 7 句：纸片退到背景
  // ---------- 第 1 刀之前：整张方纸 ----------
  if (tau < B.cut1 + .6) {
    const th = S2FOLD(B.f1, tau), A = S2PC.A;
    s2Sheet(c, s2Rect(A.r), S2PAPER, 3920);
    s2APieceText(c, tau, A.r, 1);
    if (th > .002) s2Flap(c, [X, Y, h, S], 'v', X + h, th);
    else s2Sheet(c, s2Rect([X, Y, h, S]), S2PAPER, 3921);
    // 中线（L2），折过以后是折痕
    const mk = sm(B.mid, B.mid + .5, tau, x => x);
    if (mk > 0 && th <= .002 && tau < B.f1) rline(c, [[X + h, Y - 4], [X + h, Y + S + 4]], { w: 2, color: alpha(P.ink2, .6), p: mk, seed: 3922, amp: .4 });
    if (tau > B.f1 + .7) s2Cut(c, tau, [[X + h, Y - 12], [X + h, Y + S + 12]], B.cut1 - .05, .6);
  } else {
    // ---------- 剩下的半张（左边） ----------
    const L2 = tau < B.row + .05;
    if (L2) {
      const dimL = 1 - .7 * sm(B.pair, B.pair + .5, tau);
      c.save(); c.globalAlpha *= dimL;
      if (tau < B.f2 + .8) {
        const th = S2FOLD(B.f2, tau);
        if (tau < B.f2) s2Sheet(c, s2Rect([X, Y, h, S]), S2PAPER, 3930);
        else { s2Sheet(c, s2Rect([X, Y + h, h, h]), S2PAPER, 3930);
          if (th > .002) s2Flap(c, [X, Y, h, h], 'h', Y + h, th); else s2Sheet(c, s2Rect([X, Y, h, h]), S2PAPER, 3931); }
        // 第 1 问：剪口一闪
        const fl = win(B.q1 - .1, B.q1 + .5, tau, .15);
        if (fl > 0) rline(c, [[X + h, Y + 4], [X + h, Y + S - 4]], { w: 6, color: alpha(P.purple, .7 * fl), seed: 3932, amp: .4 });
      } else if (tau < B.cut3 + .7) {
        const th = S2FOLD(B.f3, tau);
        s2Sheet(c, s2Rect([X, Y, h, h]), S2PAPER, 3931);
        s2Sheet(c, s2Rect(S2PC.C.r), S2PAPER, 3933);
        if (th > .002) s2Flap(c, S2PC.D.r, 'v', X + q, th); else s2Sheet(c, s2Rect(S2PC.D.r), S2PAPER, 3934);
        rline(c, [[X + 6, Y + h], [X + h - 6, Y + h]], { w: 1.5, color: alpha(P.ink2, .4), dash: [8, 7], seed: 3935, amp: .2 });
        if (tau > B.f3 + .7) s2Cut(c, tau, [[X + q, Y + S + 12], [X + q, Y + h], [X + h + 12, Y + h]], B.cut3 - .05, .65);
      } else {
        // 剪掉 1/8 以后：一块 L 形（1/4 + 1/8），折痕还在
        s2Sheet(c, [[X, Y], [X + h, Y], [X + h, Y + h], [X + q, Y + h], [X + q, Y + S], [X, Y + S]], S2PAPER, 3936);
        rline(c, [[X + 6, Y + h], [X + q - 4, Y + h]], { w: 1.5, color: alpha(P.ink2, .4), dash: [8, 7], seed: 3935, amp: .2 });
      }
      c.restore();
    } else {
      // 第 6 句起：B、D 两片分开，排进一排
      const tint = sm(B.row, B.row + .6, tau);
      for (const id of ['B', 'D']) { const [x, y] = s2PiecePos(id, tau), r = S2PC[id].r;
        c.save(); c.globalAlpha *= dimAll * lerp(.3, 1, tint); s2Sheet(c, s2Rect([x, y, r[2], r[3]]), mix(S2PAPER, S2PC[id].col, tint), 3940 + id.charCodeAt(0)); c.restore(); }
    }
  }
  // ---------- 剪下来的大纸片 A（右半张）和小纸片 C ----------
  if (tau >= B.cut1 + .6) {
    const [x, y] = s2PiecePos('A', tau), r = S2PC.A.r, pick = sm(B.pick, B.pick + .35, tau, easeOutBack) * (1 - sm(B.back[0], B.back[0] + .3, tau));
    const tint = sm(B.cut1 + .6, B.cut1 + 1.0, tau), al = s2DimA(tau) * (B.pick < tau ? lerp(dimAll, 1, sm(B.pick, B.pick + .3, tau)) : dimAll);
    c.save(); c.globalAlpha *= al;
    const rr = [x, y - pick * 12, r[2], r[3]];
    s2Sheet(c, s2Rect(rr), mix(S2PAPER, S2PC.A.col, tint), 3920, pick * 8);
    s2APieceText(c, tau, rr, 1);
    c.restore();
    if (pick > 0) sparkle(c, rr[0] + rr[2] - 16, rr[1] + 18, 18 * win(B.pick, B.pick + 1.6, tau, .3), { color: P.moon });
  }
  if (tau >= B.cut3 + .7) {
    const [x, y] = s2PiecePos('C', tau), r = S2PC.C.r, tint = sm(B.cut3 + .7, B.cut3 + 1.1, tau);
    c.save(); c.globalAlpha *= dimAll;
    s2Sheet(c, s2Rect([x, y, r[2], r[3]]), mix(S2PAPER, S2PC.C.col, tint), 3933);
    zh(c, '来玩', x + r[2] / 2, y + r[3] / 2 + 14, { size: 40, color: P.ink, align: 'center', p: writeP(tau, B.lw, '来玩', .12) });
    c.restore();
  }
  c.restore();
}
// A 在第 4 句退到背景，第 5 句回来
const s2DimA = tau => 1 - .65 * (sm(S2B.q1 - .3, S2B.q1 + .2, tau) - sm(S2B.pair, S2B.pair + .5, tau));
// A 上的字「我是最强的」（L2 写出）
function s2APieceText(c, tau, r, al) {
  const B = S2B, t = '我是最强的'; if (tau < B.say) return;
  zh(c, t, r[0] + r[2] / 2, r[1] + r[3] / 2 + 13, { size: 38, color: P.ink, align: 'center', p: writeP(tau, B.say, t, .12), al });
}

// ===================== 纸带、字、蜡封 =====================
function s2Tapes(c, tau) {
  const B = S2B, ap = sm(B.box, B.box + .5, tau, easeOut); if (ap <= 0) return;
  const [ox, oy] = S2OUT, boxAl = ap * (1 - .7 * sm(B.pair, B.pair + .5, tau)) * (1 - sm(B.row, B.row + .5, tau));
  const cell = n => Array.from({ length: n }, () => ({ bits: 1 })), T = { unit: S2U, h: S2TH, rows: 1 };
  // 八音盒
  if (boxAl > 0) { c.save(); c.globalAlpha *= boxAl; c.translate(0, 20 * (1 - ap)); tapeBox(c, S2BOX.x, S2BOX.y, 1, tau, { play: win(B.f1, B.f1 + 1, tau) + win(B.q1, B.f3 + 1, tau) }); c.restore(); }
  // ---------- 第 1 截：1 个孔，撕下来挂到大纸片下面 ----------
  const p1 = sm(B.box + .3, B.box + .8, tau, x => x), k1 = sm(B.tear1, B.tear1 + .7, tau);
  const hA = s2Hang('A', tau), pos1 = k1 <= 0 ? { x: ox, y: oy, rot: 0 } : { x: lerp(ox, hA.x, easeIO(k1)), y: lerp(oy, hA.y, easeIO(k1)) - Math.sin(k1 * Math.PI) * 60, rot: lerp(0, hA.rot, easeIO(k1)) };
  if (tau < B.row) tape(c, { ...T, ...pos1, cells: cell(1), p: p1, punch: sm(S2APEX(B.f1), S2APEX(B.f1) + .2, tau), al: s2DimA(tau) });
  const lab1 = [lerp(ox + S2U + 22, hA.x + 32, easeIO(k1)), lerp(oy + 14, hA.y + 46, easeIO(k1))], la1 = sm(B.bit1, B.bit1 + .4, tau) * s2DimA(tau) * (1 - sm(B.row, B.row + .4, tau));
  if (la1 > 0) zh(c, '1 比特', lab1[0], lab1[1], { size: 40, color: S2LAB, al: la1, p: writeP(tau, B.bit1, '1 比特', .06) });
  // ---------- 第 2 截：3 个孔（剪口一闪、横折、竖折各打一个），第 5 句撕下来挂到小纸片下面 ----------
  const pz = [B.q1, S2APEX(B.f2), S2APEX(B.f3)];
  const feed = (sm(pz[0] - .25, pz[0], tau) + sm(pz[1] - .25, pz[1], tau) + sm(pz[2] - .25, pz[2], tau)) / 3;
  const punch = (sm(pz[0], pz[0] + .2, tau) + sm(pz[1], pz[1] + .2, tau) + sm(pz[2], pz[2] + .2, tau)) / 3;
  const k3 = sm(B.pair, B.pair + .7, tau), hC = s2Hang('C', tau);
  const pos3 = k3 <= 0 ? { x: ox, y: oy, rot: 0 } : { x: lerp(ox, hC.x, easeIO(k3)), y: lerp(oy, hC.y, easeIO(k3)) - Math.sin(k3 * Math.PI) * 60, rot: lerp(0, hC.rot, easeIO(k3)) };
  if (tau < B.row && feed > 0) tape(c, { ...T, ...pos3, cells: cell(3), p: feed, punch });
  const lab3 = [lerp(ox + 3 * S2U + 22, hC.x + 32, easeIO(k3)), lerp(oy + 14, hC.y + 110, easeIO(k3))], la3 = sm(B.bit3, B.bit3 + .4, tau) * (1 - sm(B.row, B.row + .4, tau));
  if (la3 > 0) zh(c, '3 比特', lab3[0], lab3[1], { size: 40, color: S2LAB, al: la3, p: writeP(tau, B.bit3, '3 比特', .06) });
  // ---------- 第 6 句起：四张纸片各挂一截（1、2、3、3 个孔），缩短，第 7 句接成一条 ----------
  if (tau >= B.row) {
    const ju = sm(B.join, B.join + 1.0, tau), done = ju >= 1, dimJ = B.pick < tau ? 1 - .65 * sm(B.pick, B.pick + .4, tau) : 1;
    const ck = sm(B.join + .2, B.join + .7, tau, easeOut);
    if (ck > 0) { const [x, y, w, h] = S2CARD; c.save(); c.globalAlpha *= ck * dimJ; c.translate(0, 24 * (1 - ck));
      cutPaper(c, rectPts(x, y, w, h, 4), S2PAPER, { seed: 3960, step: 30, blur: 8, sy: 5, grain: .12 }); c.restore(); }
    if (!done) S2ORDER.forEach((id, i) => {
      const hg = s2Hang(id, tau), n = S2PC[id].n;
      const grow = id === 'B' || id === 'D' ? sm(B.more + (id === 'D' ? .25 : 0), B.more + .75 + (id === 'D' ? .25 : 0), tau, x => x) : 1;
      if (grow <= 0) return;
      const bits = Math.round(s2Sq(id, tau) / n * 100) / 100, u = easeIO(ju), jx = s2JoinAt(i);
      const o = ju <= 0 ? hg : { x: lerp(hg.x, jx, u), y: lerp(hg.y, S2JOIN.y, u) - Math.sin(ju * Math.PI) * 40, rot: lerp(hg.rot, 0, u) };
      tape(c, { ...T, ...o, unit: Math.round(lerp(S2U, S2JOIN.u, u)), minW: 2, cells: Array.from({ length: n }, () => ({ bits })), p: grow, punch: grow });
    });
    else tape(c, { ...T, x: s2JoinAt(0), y: S2JOIN.y, unit: S2JOIN.u, minW: 2, cells: S2ORDER.flatMap(id => Array.from({ length: S2PC[id].n }, () => ({ bits: S2PC[id].p }))), al: dimJ });
    // 熵 + 定理蜡封
    const ex = S2JOIN.x + S2ORDER.reduce((a, id) => a + S2PC[id].n * S2PC[id].p, 0) * S2JOIN.u / 2 + 34;
    if (tau > B.ent) zh(c, '熵', ex, S2JOIN.y + 26, { size: 76, color: P.ink, p: writeP(tau, B.ent, '熵', .25), al: dimJ });
    const sk = sm(B.seal, B.seal + .6, tau, x => x);
    if (sk > 0) seal(c, ex + 150, S2JOIN.y - 6, 'thm', { k: sk, r: 30, label: '香农 1948', al: dimJ });
  }
}

// 彩蛋：H = Σ p·(−log₂p)，书页右上角约 1 秒
function s2Egg(c, tau) {
  const a = win(S2B.egg[0], S2B.egg[1], tau, .3) * .6; if (a <= 0) return;
  const x = 1500, y = 132, s = 34, A = 'H = Σ p·(−log', Bs = 'p)', wa = zhWidth(c, A, s);
  zh(c, A, x, y, { size: s, color: P.ink2, al: a }); zh(c, '2', x + wa + 1, y + 10, { size: 22, color: P.ink2, al: a }); zh(c, Bs, x + wa + 16, y, { size: s, color: P.ink2, al: a });
}

// ===================== 两个人 =====================
function s2Cast(c, tau, L, dk) {
  const B = S2B, T = S2T, E = S2E;
  const hop = t => s2Hop(t, B.pan[0], B.pan[1], 2) + s2Hop(t, B.back[0], B.back[1], 2);
  // 帕秋莉：站在书页剩下的一窄条上
  let pp = 'lecture', pg, pm = moodOf(L, 'patchouli');
  if (tau >= B.f1 - .3 && tau < B.cut3 + 1) { pp = 'point'; pg = .7; }
  if (tau >= B.join && tau < B.seal + 1.2) { pp = 'point'; pg = .5; }
  if (tau >= T(8) && tau < B.back[0]) { pp = 'cross'; pm = 'smug'; }
  drawPatchouli(c, { ...EP3.pch, x: lerp(EP3.pch.x, 250, dk), y: EP3.pch.y - hop(tau), pose: pp, gesture: pg, mood: pm, mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  // 琪露诺：桌子右边
  let cp = 'stand', cg, cm = moodOf(L, 'cirno'), look;
  if (tau >= T(0) && tau < B.say) cp = 'think';
  if (tau >= B.say && tau < E(1) + .2) { cp = 'proud'; cg = .9; cm = 'proud'; }
  if (tau >= B.cut3 + .7 && tau < E(3)) cm = 'surprised';
  if (tau >= T(4) && tau < E(4)) cp = 'think';
  if (tau >= B.pick - .3 && tau < E(7) + .2) { cp = 'point'; cg = .9; look = -.3; }
  if (tau >= T(8) && tau < B.back[0]) cm = 'pout';
  drawCirno(c, { ...EP3.cir, x: lerp(EP3.cir.x, 1740, dk), y: EP3.cir.y - hop(tau + .2), pose: cp, gesture: cg, look, mood: cm, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

function s2Draw(c, tau, L) {
  const B = S2B, dk = sm(B.pan[0], B.pan[1], tau) - sm(B.back[0], B.back[1], tau), px = S2PAN * dk;
  if (px > 0) { c.save(); c.translate(W - px, 0); desk(c); c.restore(); }
  if (px < W) { c.save(); c.translate(-px, 0);
    spread(c, tau); pageHeader(c, '第二页 · 比特', tau, .9); s2Egg(c, tau);
    c.restore(); }
  // 回书页前先把桌上的东西收掉（淡出），免得镜头回移时纸片从琪露诺身上滑过
  const out = 1 - sm(B.back[0] - .45, B.back[0] + .05, tau);
  if (px > 0 && out > 0) { c.save(); c.globalAlpha *= out; c.translate(S2PAN - px, 0); s2Desk(c, tau); s2Tapes(c, tau); c.restore(); }
  s2Cast(c, tau, L, dk);
}

scene({ order: 2, key: 'bits', title: '比特', dur: S2DUR, lines: S2LINES, fn: s2Draw });
