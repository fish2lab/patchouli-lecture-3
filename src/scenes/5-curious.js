'use strict';
// 第 5 段：好奇心（约 20 秒）。书页上立起一块书架板，三本摊开的小书站在上面，每本书下挂一截八音盒纸带（还要付多少比特）：
//   左：太熟的书，书页全白、落灰，纸带几乎没孔；琪露诺打哈欠，帕秋莉跳上书架坐在它旁边（她早读烂了）。
//   右：太难的书，书页全是乱码、按 8fps 闪，纸带孔又密又乱、还在变长；琪露诺凑过去又往后缩。
//   中：半懂不懂的书，左页清楚、右页压着一层硫酸纸（雾）；书页自己翻，每翻一页雾退一截，纸带上的孔一格格合并，书放出几道金线；琪露诺被吸过去。
//   末句后半「调速器」：一架铜色离心调速器沿书架上方的线滑过来，飞球在太熟那本上收拢、在太难那本上甩开，停在中间那本上。
// 节拍全部从 S5LINES 推；段首、段尾各 0.8 秒是标准画面（书页 + 页眉 + 两人在 EP3 站位）。
// 顶层名字一律带本段前缀 S5 / s5。
const S5LINES = seq(1.0, [
  '找规律的时候，好奇心会带路。',
  '太熟的东西早就压缩好了，所以无聊；',
  '太难的看起来像噪声，压不动，所以想逃。',
  ['半懂不懂的时候最想学。迪昂说，好奇心就像大脑的调速器。', { hold: .8 }],
]);
const S5DUR = seqEnd(S5LINES) + 1.2;

// 布局：书架板、三本书（中心 x）、纸带、调速器的滑线
const S5 = {
  shelfY: 600, shelfX0: 230, shelfX1: 1500,
  bw: 280, bh: 190,
  books: [{ x: 600, kind: 'easy' }, { x: CX, kind: 'mid' }, { x: 1320, kind: 'hard' }],
  tapeY: 668,
  railY: 128, govLen: 124,
  sit: { x: 330, y: 600 },                      // 帕秋莉坐在书架左端
  col: { dust: '#8f877b', hard: '#3e3441', mid: '#6d5d8c', page: '#f4efe4', brass: '#b07a45', brassDark: '#7d5530' },
};
const S5_NOISE = '瞵飜齉龘靐驫鱻麤爨灥鬱纛龖讟鸞籲饢曩囊躞戇蠹齾灪驤羈';
const S5_TEXT = '找规律先猜后记能猜到的就不用记讲给别人听错题按原因归类';

// 节拍：t(i) = [开始, 结束]
const s5T = i => [S5LINES[i][0], S5LINES[i][1]];

function s5Draw(c, tau, L) {
  const [a0] = s5T(0), [a1, b1] = s5T(1), [a2, b2] = s5T(2), [a3, b3] = s5T(3);
  const out = sm(b3, b3 + .4, tau);                         // 段尾收起（到 S5DUR - 0.8 全部收完）
  const inK = i => easeOutBack(clamp((tau - (a0 + .05 + i * .28)) / .5, 0, 1)) * (1 - out);
  const g0 = lerp(a3, b3, .38), g1 = g0 + 2.0;             // 调速器滑入、停住
  // 焦点：第二句亮太熟那本、第三句亮太难那本、第四句亮中间那本，其余压暗
  const act = [win(a1, a2, tau, .3), sm(a3 - .1, a3 + .3, tau), win(a2, a3, tau, .3)];
  const foc = act.map((_, i) => 1 - .5 * act.reduce((s, w, j) => s + (j === i ? 0 : w), 0));

  spread(c, tau);
  pageHeader(c, '第五页 · 好奇心', tau, .9);

  // 调速器的滑线（在书后面）
  const rail = sm(g0 - .5, g0, tau) * (1 - out);
  if (rail > 0) fade(c, rail, () => {
    thread(c, [470, S5.railY], [1450, S5.railY], { sag: 6, w: 2, p: rail, seed: 5101 });
    brassPin(c, 470, S5.railY, 8); brassPin(c, 1450, S5.railY, 8);
  });

  // 书架板
  const plank = sm(a0 - .2, a0 + .3, tau) * (1 - out);
  if (plank > 0) cutPaper(c, rectPts(S5.shelfX0, S5.shelfY, (S5.shelfX1 - S5.shelfX0) * plank, 18, 3), P.shelf2, { seed: 5102, step: 40, blur: 6 });

  // 三本书 + 纸带
  S5.books.forEach((b, i) => {
    const k = inK(i); if (k <= .001) return;
    fade(c, foc[i], () => {
      popup(c, S5.shelfY, k, () => s5Book(c, b.x, S5.shelfY, b.kind, tau, { a1, b1, a2, b2, a3, b3, i }), [b.x - 150, b.x + 150]);
      s5Tape(c, b, tau, clamp((tau - (a0 + .5 + i * .28)) / .6, 0, 1) * (1 - out), { a2, b2, a3, b3 });
    });
  });
  // 太熟那本在第二句飘一小团灰
  s5Dust(c, S5.books[0].x, S5.shelfY - S5.bh, tau - a1, 1 - out);

  // 蜡封：「半懂不懂」一出口就盖在中间那本书旁
  const sk = clamp((tau - (a3 + .3)) / .6, 0, 1) * (1 - out);
  if (sk > 0) {
    seal(c, 560, 790, 'exp', { k: sk, r: 28 });
    fade(c, sm(.5, 1, sk), () => {
      zh(c, 'Kang 等 2009', 602, 784, { size: 26, color: P.ink2 });
      zh(c, '半懂不懂时最好奇', 602, 818, { size: 26, color: P.ink2 });
    });
  }

  // 调速器
  const gk = sm(g0 - .3, g0 + .1, tau) * (1 - out);
  if (gk > 0) s5Governor(c, tau, g0, g1, gk);

  // ---------- 帕秋莉 ----------
  // 第一句抬手指书；第二句跳上书架左端坐下（这本她早读烂了）；末句后半跳下来指调速器；段尾回到 lecture
  const hopUp = sm(a1 + .1, a1 + .55, tau), hopDn = sm(g0 - .6, g0 - .15, tau);
  const pOn = hopUp > 0 && hopDn < 1;
  const pch = { ...EP3.pch, mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau };
  if (hopUp >= 1 && hopDn <= 0) {
    Object.assign(pch, { x: S5.sit.x, y: S5.sit.y, pose: 'sit', mood: tau < a2 ? 'smug' : pch.mood });
  } else if (pOn) {
    const u = hopUp < 1 ? hopUp : 1 - hopDn, arc = Math.sin(u * Math.PI) * 60;
    Object.assign(pch, { x: lerp(EP3.pch.x, S5.sit.x, u), y: lerp(EP3.pch.y, S5.sit.y + 170, u) - arc, pose: 'stand' });
  } else if (tau > a0 + .1 && tau < a1) {
    Object.assign(pch, { pose: 'point', gesture: sm(a0 + .1, a0 + .5, tau) });
  } else if (tau > g0 - .15 && tau < b3) {
    Object.assign(pch, { pose: 'point', gesture: sm(g0 - .15, g0 + .3, tau) * (1 - sm(b3 - .4, b3, tau)), tilt: -.08 });
  } else pch.pose = 'lecture';
  drawPatchouli(c, pch);

  // ---------- 琪露诺 ----------
  const cir = { ...EP3.cir, pose: 'stand', mood: moodOf(L, 'cirno'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau };
  const yawn = win(a1 + .6, b1 + .1, tau, .3);
  const lean = sm(a2 + .1, a2 + .8, tau), back = sm(a2 + 1.6, a2 + 1.9, tau, easeOut), home2 = sm(b2 - .3, a3 + .2, tau);
  const pull = sm(a3 + .2, a3 + 1.4, tau) * (1 - sm(b3 - .1, b3 + .4, tau));
  if (yawn > 0) {
    // 哈欠：垮下来、闭眼、张大嘴；嘴边冒一个「哈～」
    Object.assign(cir, { pose: 'slump', blink: Math.max(cir.blink, .85 * yawn), mouth: yawn, look: -.3 });
    fade(c, yawn, () => zh(c, '哈～', EP3.cir.x + 95, 500, { size: 34, color: P.g2 }));
  } else if (tau > a2 && tau < a3 + .2) {
    // 凑近太难那本，乱码一闪，往后缩
    const x = EP3.cir.x - 70 * lean * (1 - back) + 110 * back * (1 - home2);
    Object.assign(cir, { x, mood: back > .1 ? 'surprised' : 'confused', pose: back > .1 ? 'slump' : 'point', gesture: lean * (1 - back), tilt: back * .12 * (1 - home2) });
    if (back > 0 && home2 < 1) s5Shock(c, x - 120, 520, tau, back * (1 - home2));
  } else if (pull > 0) {
    // 被中间那本吸过去：飘起来、身子前倾
    Object.assign(cir, { pose: 'fly', mood: 'happy', x: lerp(EP3.cir.x, 1470, pull), y: EP3.cir.y - 50 * pull + Math.sin(tau * 3) * 6 * pull, look: .6 });
  } else if (tau > a0 && tau < a1) {
    cir.look = .5;
  }
  drawCirno(c, cir);
}

// s5Book：一本摊开、立在书架上的小书（书脊 x，底边 baseY）。kind = easy 全白落灰 | hard 乱码 | mid 半清楚半雾
function s5Book(c, x, baseY, kind, tau, T) {
  const w = S5.bw, h = S5.bh, y0 = baseY - h, seed = 5200 + T.i * 20;
  const cover = kind === 'easy' ? S5.col.dust : kind === 'hard' ? S5.col.hard : S5.col.mid;
  cutPaper(c, [[x - w / 2 - 12, y0 + 4], [x, y0 + 14], [x + w / 2 + 12, y0 + 4], [x + w / 2 + 12, baseY], [x - w / 2 - 12, baseY]], cover, { seed, step: 30, blur: 6 });
  const pg = side => side < 0
    ? [[x - w / 2, y0 - 4], [x - 4, y0 + 8], [x - 4, baseY - 6], [x - w / 2, baseY - 10]]
    : [[x + 4, y0 + 8], [x + w / 2, y0 - 4], [x + w / 2, baseY - 10], [x + 4, baseY - 6]];
  const paper = kind === 'easy' ? '#f7f4ee' : S5.col.page;
  const pl = cutPaper(c, pg(-1), paper, { seed: seed + 1, step: 40, blur: 3, sx: 1, sy: 2 });
  const pr = cutPaper(c, pg(1), paper, { seed: seed + 2, step: 40, blur: 3, sx: 1, sy: 2 });
  rline(c, [[x, y0 + 8], [x, baseY - 6]], { w: 2, color: alpha(P.ink, .3), seed: seed + 3 });

  if (kind === 'easy') {
    // 灰：一层灰膜 + 灰点 + 角上一张蛛网
    for (const p of [pl, pr]) { c.save(); c.clip(p); c.fillStyle = alpha(S5.col.dust, .16); c.fillRect(x - w, y0 - 20, w * 2, h + 40);
      for (let k = 0; k < 60; k++) { c.fillStyle = alpha(P.g3, .25 + .3 * hash(k, seed)); c.beginPath(); c.arc(x - w / 2 + hash(k, seed + 5) * w, y0 + hash(k, seed + 6) * h, .8 + hash(k, seed + 7) * 1.6, 0, TAU); c.fill(); }
      c.restore(); }
    const cx0 = x + w / 2 - 2, cy0 = y0 - 2;
    for (let k = 0; k < 4; k++) { const a = Math.PI / 2 + k * .38 + .15; rline(c, [[cx0, cy0], [cx0 + Math.cos(a) * 54, cy0 + Math.sin(a) * 54]], { w: 1, color: alpha(P.g3, .5), seed: seed + 10 + k, amp: .3 }); }
    for (const r of [18, 34, 50]) { const pts = []; for (let k = 0; k <= 8; k++) { const a = Math.PI / 2 + .15 + k * .38 * 3 / 8; pts.push([cx0 + Math.cos(a) * r, cy0 + Math.sin(a) * r + 3]); } rline(c, pts, { w: 1, color: alpha(P.g3, .45), seed: seed + r, amp: .3 }); }
  } else if (kind === 'hard') {
    // 乱码：字和噪点每 1/8 秒重排一次；第三句里闪得更凶
    const tk = tick(tau), hot = win(T.a2, T.b2, tau, .3), n = 34 + Math.round(20 * hot);
    for (const [p, side] of [[pl, -1], [pr, 1]]) { c.save(); c.clip(p);
      const x0 = side < 0 ? x - w / 2 : x + 4;
      for (let k = 0; k < n; k++) { const hx = hash(k, tk + side) , hy = hash(k + 99, tk + side);
        c.save(); c.translate(x0 + 10 + hx * (w / 2 - 20), y0 + 18 + hy * (h - 30)); c.rotate((hash(k, tk + 7) - .5) * 1.6);
        zh(c, S5_NOISE[Math.floor(hash(k, tk + 3) * S5_NOISE.length)], 0, 0, { size: 14 + hash(k, tk + 4) * 16, color: alpha(P.ink, .55 + .4 * hash(k, tk + 5)), align: 'center', base: 'middle' }); c.restore(); }
      for (let k = 0; k < 160; k++) { c.fillStyle = alpha(P.ink, .5); c.fillRect(x0 + hash(k, tk + 11 + side) * w / 2, y0 + hash(k, tk + 12 + side) * h, 2, 2); }
      c.restore(); }
  } else {
    // 半懂：左页清楚的字；右页一样的字压在硫酸纸（雾）下面。第四句里书页自己翻，每翻一页雾退一截
    const flips = [0, 1, 2].map(j => clamp((tau - (T.a3 + .5 + j * .9)) / .6, 0, 1)), done = flips.reduce((a, b) => a + b, 0);
    const lines = (x0, seedL) => { for (let r = 0; r < 6; r++) { const s = Math.floor(hash(r, seedL) * 18);
      zh(c, S5_TEXT.slice(s, s + 5), x0, y0 + 36 + r * 27, { size: 19, color: alpha(P.ink, .8) }); } };
    c.save(); c.clip(pl); lines(x - w / 2 + 16, seed + 30); c.restore();
    c.save(); c.clip(pr); lines(x + 30, seed + 31 + Math.floor(done)); c.restore();
    const fog = 1 - .2 * done;                                  // 雾盖住右页的比例（从书口往书脊退）
    c.save(); c.clip(pr);
    vellum(c, rectPts(x + w / 2 - (w / 2 + 6) * fog, y0 - 8, (w / 2 + 12) * fog, h + 8), { color: '#eeeae4', seed: seed + 40, al: 1.5 });
    for (let k = 0; k < 7; k++) { c.fillStyle = alpha('#ffffff', .35); c.beginPath(); c.ellipse(x + w / 2 - hash(k, seed) * (w / 2) * fog, y0 + 20 + hash(k, seed + 1) * (h - 40), 30, 16, 0, 0, TAU); c.fill(); }
    c.restore();
    // 金线：书在发光（几笔放射的短线，不用渐变）
    const glow = sm(T.a3 - .1, T.a3 + .5, tau);
    if (glow > 0) for (let k = 0; k < 9; k++) { const a = -Math.PI * (.1 + .8 * k / 8), L = (22 + 14 * Math.sin(tau * 5 + k * 1.7)) * glow, r0 = 128;
      rline(c, [[x + Math.cos(a) * r0 * 1.3, baseY - h / 2 + Math.sin(a) * r0], [x + Math.cos(a) * (r0 * 1.3 + L), baseY - h / 2 + Math.sin(a) * (r0 + L)]], { w: 3, color: alpha(P.moon, .85), seed: seed + 50 + k }); }
    // 自己翻的那一页
    flips.forEach((u, j) => { if (u <= 0 || u >= 1) return; const e = easeIO(u), cw = (w / 2) * Math.cos(e * Math.PI), lift = Math.sin(e * Math.PI) * 14;
      const pts = [[x, y0 + 8], [x + cw, y0 - 4 - lift], [x + cw, baseY - 10 + lift * .3], [x, baseY - 6]];
      c.save(); c.shadowColor = 'rgba(30,20,10,.25)'; c.shadowBlur = 8; c.fillStyle = cw > 0 ? '#f1ece2' : '#e3dccd'; c.fill(polyPath(pts)); c.restore(); });
  }
}

// s5Tape：书下的纸带（还要付多少比特）
function s5Tape(c, b, tau, p, T) {
  if (p <= 0) return;
  const x = b.x - 130, y = S5.tapeY;
  if (b.kind === 'easy') {
    tape(c, { x, y, cells: [0, 0, .3, 0, 0, 0].map(v => ({ bits: v })), unit: 10, minW: 12, h: 40, rows: 2, p });
  } else if (b.kind === 'hard') {
    // 孔又密又乱，每 1/8 秒重排；第三句里纸带还在变长（压不动）
    const tk = tick(tau), n = 8 + Math.round(4 * sm(T.a2 + .2, T.b2, tau));
    tape(c, { x, y, cells: Array.from({ length: n }, (_, k) => ({ bits: 3 + hash(k, tk) * 3 })), unit: 1, minW: 24, h: 40, rows: 3, p });
  } else {
    // 孔一格格合并：第四句里每格从 4 比特降到 1 比特，纸带跟着变短
    const cells = Array.from({ length: 8 }, (_, k) => ({ bits: lerp(4, 1, sm(T.a3 + .4 + k * .32, T.a3 + .9 + k * .32, tau)) }));
    tape(c, { x, y, cells, unit: 8, minW: 10, h: 40, rows: 2, p });
  }
}

// s5Dust：太熟那本书上飘起的一小团灰（u = 距第二句开头的秒数）
function s5Dust(c, x, y, u, al) {
  if (u < .2 || u > 2.6 || al <= 0) return;
  const k = (u - .2) / 2.4;
  c.save(); c.globalAlpha *= al * (1 - k) * .8;
  for (let i = 0; i < 14; i++) { const a = -Math.PI * (.2 + .6 * hash(i, 5301)), d = 20 + 90 * easeOut(k) * (.5 + hash(i, 5302));
    c.fillStyle = alpha(P.g2, .5); c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d - 30 * k, 4 + 8 * k * hash(i, 5303), 0, TAU); c.fill(); }
  c.restore();
}

// s5Shock：琪露诺被乱码吓退时脸旁的几道惊吓线
function s5Shock(c, x, y, tau, k) {
  for (let i = 0; i < 3; i++) { const a = Math.PI + (i - 1) * .45, r0 = 30, r1 = 30 + 34 * k;
    rline(c, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], { w: 4, color: alpha(P.ink, .8 * k), seed: 5310 + i, t: tau }); }
}

// s5Governor：铜色离心调速器，挂在滑线上。先停在太熟那本上（飞球收拢），滑到太难那本（甩开），最后停在中间（半开）
function s5Governor(c, tau, g0, g1, al) {
  const [xe, xm, xh] = S5.books.map(b => b.x);
  const x = key(tau, [[g0, xe], [g0 + .4, xe], [g0 + 1.1, xh], [g0 + 1.4, xh], [g1, xm]]);
  const d = clamp((x - xe) / (xh - xe), 0, 1), settle = sm(g1 - .2, g1 + .8, tau);
  const th = lerp(.12, 1.4, d) + .06 * Math.sin((tau - g1) * 9) * Math.exp(-Math.max(0, tau - g1) * 3) * settle;
  const spin = Math.cos(tau * lerp(3, 16, d)), y = S5.railY, L = S5.govLen, top = y + 28, bot = top + 196;
  c.save(); c.globalAlpha *= al;
  // 挂钩和竖轴
  rline(c, [[x, y], [x, top]], { w: 3, color: S5.col.brassDark, seed: 5401 });
  cutPaper(c, rectPts(x - 6, top, 12, bot - top, 2), S5.col.brass, { seed: 5402, step: 20, blur: 3 });
  cutPaper(c, rectPts(x - 20, top - 8, 40, 18, 3), S5.col.brassDark, { seed: 5403, step: 10, blur: 3 });
  // 两根摆臂 + 飞球（转起来时左右宽度按 cos 变，看起来在绕轴转）
  const sx = .78 + .22 * Math.abs(spin);
  for (const s of [-1, 1]) {
    const bx = x + s * Math.sin(th) * L * sx, by = top + Math.cos(th) * L;
    const mx = x + s * Math.sin(th) * L * .55 * sx, my = top + Math.cos(th) * L * .55, cy = top + Math.cos(th) * L * 1.1;
    rline(c, [[x, top + 2], [bx, by]], { w: 5, color: S5.col.brassDark, seed: 5410 + s, amp: .4 });
    rline(c, [[mx, my], [x, cy]], { w: 2.5, color: S5.col.brassDark, seed: 5412 + s, amp: .4 });
    cutPaper(c, circPts(bx, by, 23, 20), S5.col.brass, { seed: 5420 + s, step: 5, blur: 4 });
    c.fillStyle = 'rgba(255,240,200,.55)'; c.beginPath(); c.arc(bx - 7, by - 7, 6, 0, TAU); c.fill();
  }
  const cy = top + Math.cos(th) * L * 1.1;
  cutPaper(c, rectPts(x - 16, cy - 6, 32, 12, 2), S5.col.brassDark, { seed: 5430, step: 8, blur: 3 });
  c.restore();
  // 停住后的小字（右边，避开书脊）
  const lk = sm(g1 - .1, g1 + .4, tau) * al;
  if (lk > 0) fade(c, lk, () => zh(c, '迪昂《精准学习》', x + 130, y + 130, { size: 28, color: P.ink2 }));
}

scene({ order: 5, key: 'curious', title: '好奇心', dur: S5DUR, lines: S5LINES, fn: s5Draw });
