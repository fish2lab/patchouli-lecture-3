'use strict';
// 第 6 段：结尾（魔导书编配，照第 2 集片尾：清单 → 合书 → 封面金墨写演职信息 → 镜头抬起）。
//   开头 1 秒是标准画面（第 5 段翻页过来）。
//   L0 琪露诺把一张借书卡大小的卡片举过头顶：卡上写「错题 300 道 → 12 条」，只打了 12 个孔（一条规律一个孔）。
//   L0 之后：卡片放大、飞到左页钉住；琪露诺往右让开。
//   L1「能猜到的，就不用记」在右页写成标题；L2–L4 一句一行手写清单，每行前一个小墨线图：放大镜（找规律）、对话气泡里的线越讲越短（讲给别人听）、错题卡归成三摞（按原因归类）。
//   L5 琪露诺「果然，我是最强的！」握拳蹦起来，清单下面一条小纸带只打出 1 个孔；L6「只值 1 比特」时纸带旁写上「= 1 比特」，「下课」帕秋莉鞠一躬。
//   片尾（约 13 秒）：左半本书翻过来合上（逐列透视），帕秋莉跳上封面、扑倒睡着；琪露诺飞出画面；
//        合上的书滑到桌子正中，金墨逐行写出演职信息；镜头从正上方慢慢抬到斜看（开场的反向）。
//
// 【从第 5 段接过来】第一帧严格是：
//   spread(c, tau)
//   drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: 'normal', mouth: 0, blink: blinkAt(tau), t: tau })
//   drawCirno(c, { ...EP3.cir, pose: 'stand', mood: 'normal', mouth: 0, blink: blinkAt(tau, 2), t: tau })
// 书页上没有别的东西（没有页眉）。
// 顶层名字一律带本段前缀 S6 / s6。
const S6LINES = seq(1.0, [
  ['帕秋莉！三百道错题，我压成了一张卡片！', { who: 'cirno', mood: 'proud' }],
  '能猜到的，就不用记。',
  '先找规律，',
  '讲给别人听，',
  '错题按原因归类。',
  ['果然，我是最强的！', { who: 'cirno', mood: 'proud' }],
  ['……这句还是只值 1 比特。下课。', { mood: 'smug', hold: 0.6 }],
]);
const s6T = i => S6LINES[i][0], s6E = i => S6LINES[i][1];
// 节拍（都从台词时间推出来）
const S6K = (() => { const e0 = s6E(0), e6 = s6E(6), close0 = e6 - 1.0, close1 = close0 + 1.6;
  return { card0: s6T(0) - .05, card1: s6T(0) + .35, move0: e0 + .05, move1: e0 + .75,
    tape0: s6T(5) + .15, punch: s6T(5) + .9, bit: s6T(6) + 1.1, bow0: e6 - 2.3, bow1: e6 - 1.4, close0, close1, slide1: close1 + .8,
    title: close1 + .55, cred0: close1 + 1.3, credStep: .35, tilt0: close1 + 6.5, tilt1: close1 + 10.5, tilt2: close1 + 12.6, end: close1 + 13 }; })();
const S6GOLD = mix(P.moon, P.cap, .32);                                // 封面金墨（和第 1、2 集片尾同一种）
const S6CW = BOOK.w / 2 + 20;                                          // 封面宽
const S6PAT = { land: 1560 };                                          // 帕秋莉合书时跳上封面的落点（合书前的屏幕 x）
const S6CARD = { w: 200, h: 270 };                                     // 卡片（借书卡大小）
const S6PIN = { x: 700, y: 330, k: 1.25, rot: .05 };                   // 卡片放大后钉在左页的位置
const S6CIRX = 1720;                                                   // 清单出来时琪露诺让到这里
const S6LIST = { head: 182, icon: 1078, text: 1142, y0: 300, dy: 122, size: 44 };   // 右页：标题行 y、图的中心 x、字的起点、第一行图中心 y、行距、字号
const S6ITEMS = ['先找规律，', '讲给别人听，', '错题按原因归类。'];
const S6BIT = { x: 1046, y: 736, label: 690 };                         // 「我是最强的」那条小纸带：左端、中线、上方标签的基线
// 演职信息（[文字, 组]；组与组之间空一点）
const S6CREDITS = [
  ['知识来源：斯坦尼斯拉斯·迪昂《精准学习》', 0], ['（浙江教育出版社），及作者的读书划线', 0],
  ['文献：Shannon 1948；Shannon 1951；冯志伟 1984《汉字的熵》', 1], ['Delétang 等 2024（ICLR）；Huang 等 2024（COLM）', 1],
  ['Cowan 2001；Chase & Simon 1973；Gobet & Simon 1996', 1], ['Bisra 等 2018；Kang 等 2009', 1],
  ['比特数：Qwen3-1.7B-Base 本机实测', 2], ['可视化致谢：3Blue1Brown《Compression is Intelligence》', 2],
  ['角色：东方 Project © 上海爱丽丝幻乐团（ZUN）。本片为同人科普作品。', 3],
  ['字体：霞鹜文楷（SIL OFL）　语音：AquesTalk（© 株式会社アクエスト）', 4],
];

// ===================== 卡片：三百道错题压成的十二条规律 =====================
// 卡片画在 (0, 0) 为中心的局部坐标里：卡头两行字，下面 2 列 × 6 行，每行一个孔 + 一道短墨线（一条规律）
const S6RULES = Array.from({ length: 12 }, (_, k) => ({ col: k % 2, row: Math.floor(k / 2), len: 34 + hash(k, 5) * 34 }));
function s6CardFace(c) {
  const { w, h } = S6CARD, path = cutPaper(c, rectPts(-w / 2, -h / 2, w, h, 6), '#f6f2e8', { seed: 3701, step: 30, blur: 8, sy: 4 });
  c.save(); c.clip(path);
  c.fillStyle = alpha(P.purple, .55); c.fillRect(-w / 2, -h / 2, w, 10);                                       // 卡头一道紫边
  zh(c, '错题 300 道', 0, -h / 2 + 48, { size: 28, align: 'center', color: P.ink });
  zh(c, '→ 12 条', 0, -h / 2 + 84, { size: 26, align: 'center', color: P.ink2 });
  rline(c, [[-w / 2 + 16, -h / 2 + 100], [w / 2 - 16, -h / 2 + 100]], { w: 1.4, color: alpha(P.ink2, .5), seed: 3702, amp: .3 });
  S6RULES.forEach(({ col, row, len }, k) => { const x = -w / 2 + 22 + col * (w / 2 - 6), y = -h / 2 + 122 + row * 24;
    c.fillStyle = EP3_TAPE_COL.hole; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
    rline(c, [[x + 12, y + 1], [x + 12 + len, y + 1]], { w: 2, color: alpha(P.ink2, .6), seed: 3710 + k, amp: .4 }); });
  c.restore();
}
// 卡片的位置：L0 在琪露诺举起的手里（hold），L0 之后放大飞到左页钉住
function s6CardAt(tau, hold) { const f = sm(S6K.move0, S6K.move1, tau, easeIO), hx = hold ? hold[0] : EP3.cir.x, hy = (hold ? hold[1] : EP3.cir.y - 419) - 40;
  return { x: lerp(hx, S6PIN.x, f), y: lerp(hy, S6PIN.y, f) - Math.sin(f * Math.PI) * 80, rot: lerp(-.06, S6PIN.rot, f) + Math.sin(f * Math.PI) * .12, k: lerp(.8, S6PIN.k, f), lift: Math.sin(f * Math.PI), f }; }
function s6Card(c, tau, hold) {
  if (tau < S6K.card0) return;
  const p = s6CardAt(tau, hold), pk = sm(S6K.card0, S6K.card1, tau, easeOutBack), { w, h } = S6CARD;
  if (p.lift > .01) { c.save(); c.translate(p.x + 30 * p.lift, p.y + 44 * p.lift); c.rotate(p.rot); c.scale(p.k, p.k); c.fillStyle = `rgba(20,12,10,${.18 * p.lift})`; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); }
  c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(p.k * pk, p.k * pk); s6CardFace(c); c.restore();
  const sp = tau - S6K.card1; if (sp > 0 && sp < .6) sparkle(c, p.x + w * .4, p.y - h * .4, 26 * Math.sin(sp / .6 * Math.PI), { color: P.moon, rot: .2 });
  if (p.f >= 1) { const k = sm(S6K.move1, S6K.move1 + .15, tau, easeOutBack), co = Math.cos(S6PIN.rot), si = Math.sin(S6PIN.rot), px = 0, py = -h / 2 * S6PIN.k + 14;
    brassPin(c, S6PIN.x + co * px - si * py, S6PIN.y + si * px + co * py, 10 * k + .01); }
}

// ===================== 右页：标题、清单、1 比特的小纸带 =====================
// 三个小墨线图，(x, y) 中心，p 画出进度，u 画完后的秒数（小动作）
function s6Icon(c, i, x, y, p, u) {
  const o = { w: 3, color: P.ink, amp: .5 }, seg = (a, b) => clamp((p - a) / (b - a), 0, 1);
  if (i === 0) {   // 放大镜：镜片里三个一样的小点排成一行（规律），镜头轻轻晃
    const dx = Math.sin(Math.max(0, u) * 2.2) * 3, lx = x - 6 + dx, ly = y - 6;
    rline(c, circPts(lx, ly, 22, 36), { ...o, close: true, p: seg(0, .45), seed: 4101 });
    rline(c, [[lx + 16, ly + 16], [lx + 34, ly + 34]], { ...o, w: 6, p: seg(.4, .6), seed: 4102 });
    for (let j = 0; j < 3; j++) { const k = sm(.6 + j * .12, .75 + j * .12, p, easeOutBack); if (k <= 0) continue;
      c.fillStyle = P.ink; c.beginPath(); c.arc(lx - 11 + j * 11, ly, 3.4 * k, 0, TAU); c.fill(); }
  } else if (i === 1) {   // 对话气泡：里面一道线越讲越短
    rline(c, rectPts(x - 30, y - 24, 60, 40, 10), { ...o, close: true, p: seg(0, .4), seed: 4111 });
    rline(c, [[x - 14, y + 17], [x - 22, y + 31], [x - 2, y + 17]], { ...o, p: seg(.35, .5), seed: 4113 });
    const L = lerp(36, 12, sm(0, 1.2, u, easeIO)); if (p > .5) rline(c, [[x - L / 2, y - 4], [x + L / 2, y - 4]], { ...o, w: 3.4, p: seg(.5, .8), seed: 4112 });
  } else {   // 错题卡归成三摞：每摞三张小卡，一摞一摞落下
    for (let s = 0; s < 3; s++) for (let j = 0; j < 3; j++) { const k = sm(s * .22 + j * .06, s * .22 + j * .06 + .2, p, easeOutBack); if (k <= 0) continue;
      const cx = x - 30 + s * 30, cy = y + 16 - j * 8 - (1 - k) * 20;
      cutPaper(c, rectPts(cx - 12, cy - 8, 24, 16, 2), j === 2 ? '#f6f2e8' : mix('#f6f2e8', P.ink2, .12 + .08 * j), { seed: 4121 + s * 3 + j, step: 8, blur: 2, sx: 1, sy: 1.5, grain: .05 }); }
    rline(c, [[x - 48, y + 27], [x + 48, y + 27]], { ...o, w: 2, color: alpha(P.ink, .5), p: seg(.7, 1), seed: 4130 });
  }
}
function s6List(c, tau) {
  const L = S6LIST, t1 = s6T(1), head = '能猜到的，就不用记。';
  if (tau >= t1) { zh(c, head, L.icon - 40, L.head, { size: 54, color: P.ink, p: writeP(tau, t1 + .1, head, .08) });
    rline(c, [[L.icon - 40, L.head + 20], [L.icon - 40 + zhWidth(c, head, 54), L.head + 20]], { w: 2, color: alpha(P.moon, .8), seed: 4140, p: sm(t1 + .9, t1 + 1.5, tau) }); }
  for (let i = 0; i < 3; i++) { const t0 = s6T(i + 2); if (tau < t0) continue; const y = L.y0 + i * L.dy, text = S6ITEMS[i];
    s6Icon(c, i, L.icon, y, sm(t0, t0 + .7, tau, t => t), tau - t0 - .7);
    zh(c, text, L.text, y + 15, { size: L.size, color: P.ink, p: writeP(tau, t0 + .2, text, .07) }); }
  // L5：一条小纸带，一整句「我是最强的」只打 1 个孔；L6「只值 1 比特」时旁边写上「= 1 比特」
  if (tau >= S6K.tape0) { const B = S6BIT, a = sm(S6K.tape0, S6K.tape0 + .3, tau);
    fade(c, a, () => {
      zh(c, '「我是最强的」', B.x, B.label, { size: 34, color: P.ink2 });
      const r = tape(c, { x: B.x, y: B.y, cells: [{ bits: 0 }, { bits: 0 }, { bits: 1 }, { bits: 0 }, { bits: 0 }], unit: 58, minW: 56, h: 64, rows: 1,
        p: sm(S6K.tape0, S6K.tape0 + .45, tau, easeOut), punch: tau >= S6K.punch ? 1 : 0 });
      const u = tau - S6K.punch, [hx, hy] = r.at(2);
      if (u > 0 && u < .35) { const k = u / .35; c.save(); c.globalAlpha *= 1 - k; c.strokeStyle = P.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
        for (let j = 0; j < 6; j++) { const an = j / 6 * TAU + .3, r0 = 14 + 22 * k; c.moveTo(hx + Math.cos(an) * r0, hy + Math.sin(an) * r0); c.lineTo(hx + Math.cos(an) * (r0 + 12), hy + Math.sin(an) * (r0 + 12)); }
        c.stroke(); c.restore(); }
      if (tau >= S6K.bit) { const t = '= 1 比特'; zh(c, t, B.x + r.len + 24, B.y + 16, { size: 46, color: P.ink, p: writeP(tau, S6K.bit, t, .08) }); }
    }); }
}

// ===================== 角色 =====================
function s6Patchouli(c, tau, L) {
  const K = S6K, T = s6T, E = EP3.pch, mouth = mouthOf(L, 'patchouli'), blink = blinkAt(tau);
  if (tau < T(0)) { drawPatchouli(c, { ...E, pose: 'lecture', mood: 'normal', mouth: 0, blink, t: tau }); return; }   // 交接帧
  let pose = 'lecture', mood = moodOf(L, 'patchouli', 'normal'), look = .6, gesture, rot = 0, tilt = 0;
  if (tau < T(1)) { pose = 'stand'; mood = (tau - T(0)) / (s6E(0) - T(0)) < .5 ? 'surprised' : 'normal'; look = .8; }
  else if (tau < T(2)) { pose = 'point'; look = .7; tilt = -.05; }
  else if (tau < T(5)) { const i = [2, 3, 4].filter(j => tau >= T(j)).pop(), lt = tau - T(i); gesture = lt < .9 ? .95 : .5; look = .7; }
  else if (tau < T(6)) { pose = 'cross'; mood = 'annoyed'; look = -.3; }
  else if (tau < K.bow0) { pose = 'point'; look = .6; }
  else { pose = 'stand'; mood = 'smug'; const b = Math.sin(clamp((tau - K.bow0) / (K.bow1 - K.bow0), 0, 1) * Math.PI); rot = .14 * b; tilt = .15 * b; }   // 「下课」鞠一躬
  c.save(); c.translate(E.x, E.y); c.rotate(rot); c.translate(-E.x, -E.y);
  drawPatchouli(c, { ...E, pose, mood, look, gesture, tilt, mouth, blink, t: tau }); c.restore();
}
// 琪露诺的冰晶
function s6Flake(c, x, y, r, rot, a) { if (a <= 0 || r <= .5) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot); c.strokeStyle = EP2_ICE_DEEP; c.lineWidth = Math.max(1.4, r * .18); c.lineCap = 'round'; c.beginPath();
  for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3, bx = Math.cos(an) * r * .55, by = Math.sin(an) * r * .55;
    c.moveTo(0, 0); c.lineTo(Math.cos(an) * r, Math.sin(an) * r); for (const s of [-.7, .7]) { c.moveTo(bx, by); c.lineTo(bx + Math.cos(an + s) * r * .32, by + Math.sin(an + s) * r * .32); } }
  c.stroke(); c.restore(); }
// 片尾琪露诺飞出画面的路线
const S6EXIT = [S6CIRX, EP3.cir.y, 2250, -160];
function s6ExitAt(tau) { const u = sm(S6K.close0 - .1, S6K.close0 + 1.3, tau, easeIn); return [lerp(S6EXIT[0], S6EXIT[2], u), lerp(S6EXIT[1], S6EXIT[3], u) - Math.sin(u * Math.PI) * 60, u]; }
// 琪露诺：L0 举卡片（返回 hold 点给卡片用）→ 让到右边 → 每出一行点一下头 → L5 握拳蹦 → L6 鼓腮 → 合书时飞走
function s6Cirno(c, tau, L) {
  const K = S6K, T = s6T, E = EP3.cir, mouth = mouthOf(L, 'cirno'), blink = blinkAt(tau, 2);
  if (tau < T(0) - .05) { drawCirno(c, { ...E, pose: 'stand', mood: 'normal', mouth: 0, blink, t: tau }); return null; }   // 交接帧
  if (tau >= K.close0 - .1) {   // 合书时飞走，身后一串冰晶
    for (let k = 0; k < 14; k++) { const tk = K.close0 - .1 + k * .1, age = tau - tk; if (age < 0 || age > 1.1) continue; const [px, py] = s6ExitAt(tk);
      s6Flake(c, px + 30 + (hash(k, 61) - .5) * 120, py - 200 + hash(k, 62) * 200 + age * 50, 9 + hash(k, 63) * 8, age * 2 + k, 1 - age / 1.1); }
    const [x, y, u] = s6ExitAt(tau); if (u >= 1) return null;
    drawCirno(c, { x, y, h: E.h, facing: 1, pose: 'fly', mood: 'happy', blink: 0, mouth: 0, t: tau, tilt: .15 }); return null; }
  const mv = sm(K.move0, K.move1, tau, easeIO);
  let x = lerp(E.x, S6CIRX, mv), y = E.y - Math.sin(mv * Math.PI) * 70, pose = 'stand', mood = moodOf(L, 'cirno', 'normal'), gesture, look = 0, tilt = 0;
  if (tau < K.move0) { pose = 'hold'; mood = 'proud'; y -= Math.abs(Math.sin(clamp((tau - T(0) - .2) / .5, 0, 1) * Math.PI)) * 30; }
  else if (tau < T(2)) mood = 'happy';
  else if (tau < T(5)) { const i = [2, 3, 4].filter(j => tau >= T(j)).pop(); tilt = .08 * Math.sin(clamp((tau - T(i) - .3) / .4, 0, 1) * Math.PI); look = -.4; }   // 每出一行点一下头
  else if (tau < T(6)) { const lt = tau - T(5); pose = 'proud'; mood = 'proud'; gesture = sm(0, .3, lt, easeOutBack); y -= Math.abs(Math.sin(clamp((lt - .1) / .5, 0, 1) * Math.PI)) * 34; }
  else mood = 'pout';
  const r = drawCirno(c, { x, y, h: E.h, facing: E.facing, pose, mood, mouth, blink, t: tau, gesture, look, tilt });
  if (tau >= T(5) && tau < T(5) + 1.2) { const lt = tau - T(5) - .25, [hx, hy] = r.hands.reduce((a, b) => b[1] < a[1] ? b : a);
    for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + (k - 2.5) * .45, d = easeOut(clamp(lt / .6, 0, 1)) * (60 + hash(k, 64) * 50); s6Flake(c, hx + Math.cos(an) * d, hy + Math.sin(an) * d, 10 + hash(k, 65) * 6, lt * 3 + k, 1 - sm(.3, .9, lt, t => t)); } }
  return pose === 'hold' ? r.hold : null;
}

// ===================== 合书与片尾（照第 2 集片尾） =====================
// 封面：和开场同一本书（kit 的 grimoireCover）+ 月牙徽记；ct = 封面落下后的秒数（< 0 不写字）
function s6Cover(c, tau, x0, ct) {
  const { y } = BOOK, cx = x0 + S6CW / 2, maxW = S6CW - 200;
  grimoireCover(c, x0, S6CW, { clasp: ct < 0 ? 1 : 1 - sm(0, .3, ct) });
  drawMoonIcon(c, cx, y + 88, 34, P.moon, -.5);
  if (ct < 0) return;
  const K = S6K, T = s => s - K.close1, head = '帕秋莉讲座 · 第 3 集 · 完';
  zh(c, head, cx, y + 190, { size: 52, align: 'center', color: S6GOLD, p: writeP(ct, T(K.title), head, .05) });
  rline(c, [[cx - 170, y + 222], [cx + 170, y + 222]], { w: 2, color: alpha(P.moon, .6), seed: 1203, p: sm(T(K.title) + .6, T(K.title) + 1.0, ct) });
  // 同一组用同一个字号（取组里最长那行能放下的字号）；最后一行要在睡着的帕秋莉上方（她的帽子在 y ≈ 760）
  const fit = {}; S6CREDITS.forEach(([s, g]) => { fit[g] = Math.min(fit[g] ?? 30, 30 * maxW / zhWidth(c, s, 30)); });
  let yy = y + 280, grp = 0;
  S6CREDITS.forEach(([s, g], i) => { if (g !== grp) { yy += 14; grp = g; } const t0 = T(K.cred0) + i * K.credStep;
    zh(c, s, cx, yy, { size: fit[g], align: 'center', color: S6GOLD, p: writeP(ct, t0, s, .012), al: sm(t0 - .05, t0 + .2, ct) }); yy += 41; });
}
// 合书：左半本（左页 + 封面）绕书脊从左翻到右，逐列透视，th 0..π
const S6BUF = document.createElement('canvas');
// s6BufCtx：取缓冲画布（sc = 出片缩放，不含镜头推拉）
function s6BufCtx(sc) { if (S6BUF.width !== Math.round(W * sc)) { S6BUF.width = Math.round(W * sc); S6BUF.height = Math.round(H * sc); }
  const b = S6BUF.getContext('2d'); b.setTransform(sc, 0, 0, sc, 0, 0); return b; }
// s6Swing：翻到左半（face）时直接用 s6Closing 已经画进缓冲的摊开书（spread + 钉着的卡片）；翻过去以后缓冲里重画封面
function s6Swing(c, tau, th, sc) {
  const face = Math.cos(th) > 0;   // true：看到的是左页那面；false：封面那面
  if (!face) { const b = s6BufCtx(sc); b.clearRect(0, 0, W, H); s6Cover(b, tau, CX - 10, -1); }
  const f = 2900, y0 = BOOK.y - 8, y1 = BOOK.y + BOOK.h + 12, span = CX - (BOOK.x - 10), step = 4;
  const col = s => { const hz = s * Math.sin(th), k = f / (f - hz); return [CX - s * Math.cos(th) * k, k]; };
  const shade = .38 * (1 - Math.abs(Math.cos(th))), up = [], dn = [];
  for (let s = 0; s < span; s += step) {
    const [xa, ka] = col(s), [xb] = col(Math.min(span, s + step)), xs = face ? CX - s - step : CX - 10 + s;
    const top = CY + (y0 - CY) * ka, hh = (y1 - y0) * ka; up.push([xa, top]); dn.push([xa, top + hh]);
    const dx = Math.min(xa, xb), dw = Math.abs(xb - xa) + .7; if (dw < .05) continue;
    c.drawImage(S6BUF, xs * sc, y0 * sc, step * sc, (y1 - y0) * sc, dx, top, dw, hh);
  }
  // 翻起来时整片压暗（一次填满，不逐列）
  if (shade > .01 && up.length > 1) { c.fillStyle = `rgba(20,12,10,${shade * (face ? 1 : .7)})`; c.fill(polyPath([...up, ...dn.reverse()])); }
}
// 镜头俯仰：y → [屏幕 x, 屏幕 y, 缩放]（和 kit 的 tiltPlane 同一个公式）
function s6TiltMap(x, y, pitch, f = 1400) { const cp = Math.cos(pitch), sp = Math.sin(pitch), d = y - CY, k = f / (f + d * sp); return [CX + (x - CX) * k, CY + d * cp * k, k]; }
function s6Closing(c, tau, L) {
  const K = S6K, cu = sm(K.close0, K.close1, tau, easeIO), th = cu * Math.PI;
  const slide = sm(K.close1, K.slide1, tau, easeIO), x0 = lerp(CX - 10, CX - S6CW / 2, slide), dx = x0 - (CX - 10);
  const pitch = tau < K.tilt1 ? lerp(0, -.2, sm(K.tilt0, K.tilt1, tau, easeIO)) : lerp(-.2, -.8, sm(K.tilt1, K.tilt2, tau, easeIO));
  const zoom = lerp(1, .9, sm(K.tilt1, K.tilt2, tau, easeIO)) * (1 - .035 * Math.sin(cu * Math.PI));
  const thud = tau > K.close1 && tau < K.close1 + .25 ? Math.sin((tau - K.close1) / .25 * Math.PI * 3) * 3 * (1 - (tau - K.close1) / .25) : 0;
  c.fillStyle = WOOD; c.fillRect(0, 0, W, H);
  const sc = c.getTransform().a || 1;
  c.save(); c.translate(CX, CY + thud); c.scale(zoom, zoom); c.translate(-CX, -CY);
  if (cu < 1) {
    // 摊开的书只画一次（spread 很贵）：画进缓冲，右半本贴到画面上，左半本给 s6Swing 翻
    const b = s6BufCtx(sc); spread(b, tau); s6Card(b, tau, null);
    desk(c);
    c.drawImage(S6BUF, (CX - 12) * sc, 0, (W - CX + 12) * sc, H * sc, CX - 12, 0, W - CX + 12, H);
    s6List(c, tau);
    if (th > Math.PI / 2) { const a = sm(Math.PI / 2, Math.PI, th, t => t), wv = BOOK.R.w * (1 - a) + 60, g = c.createLinearGradient(CX, 0, CX + wv + 200, 0); g.addColorStop(0, `rgba(20,12,10,${.45 * a})`); g.addColorStop(1, 'rgba(20,12,10,0)'); c.fillStyle = g; c.fillRect(CX, BOOK.y, BOOK.R.w + 60, BOOK.h); }
    s6Swing(c, tau, th, sc);
  } else {
    const ct = tau - K.close1;
    tiltPlane(c, b => { desk(b); b.save(); b.translate(dx, 0);
      cutPaper(b, rectPts(CX - 10 + 6, BOOK.y - 2, S6CW - 6, BOOK.h + 18, 6), BOOK.page2, { seed: 1210, step: 50, blur: 14, sx: 0, sy: 8, grain: .1 });
      s6Cover(b, tau, CX - 10, ct); b.restore(); }, { pitch, cy: CY });
    if (pitch < -.01) { const [ax, ay, ka] = s6TiltMap(x0, BOOK.y + BOOK.h + 12, pitch), [bx] = s6TiltMap(x0 + S6CW, BOOK.y + BOOK.h + 12, pitch);
      grimoireEdge(c, ax, ay, bx, ay, GRIMOIRE.thick * Math.sin(-pitch) * ka); }
  }
  s6Sleeper(c, tau, L, dx, pitch);
  c.restore();
  s6Cirno(c, tau, L);   // 飞出画面（不跟镜头）
  if (pitch < -.01) { const a = sm(0, -.8, pitch, t => t), g = c.createLinearGradient(0, 0, 0, H * .55); g.addColorStop(0, alpha('#0d0908', .85 * a)); g.addColorStop(1, alpha('#0d0908', 0)); c.fillStyle = g; c.fillRect(0, 0, W, H * .55); }
  const dk = sm(K.end - .7, K.end, tau); if (dk > 0) { c.fillStyle = alpha('#0d0908', dk * .75); c.fillRect(0, 0, W, H); }
}
// 帕秋莉：从左页跳起来，越过书脊落在合上的封面上 → 纸板一样扑倒 → 躺着睡（呼吸、Z）
function s6Sleeper(c, tau, L, dx, pitch) {
  const K = S6K, E = EP3.pch, flop0 = K.close1 + .45, flop1 = flop0 + .3, j = sm(K.close0 + .15, K.close1 + .05, tau, t => t), jump = Math.sin(j * Math.PI) * 260, ground = E.y - (tau > K.close1 ? 6 : 0), fx = S6PAT.land + dx;
  if (tau < flop0) {
    const x = lerp(E.x, S6PAT.land, sm(0, 1, j, easeIO)) + dx, y = ground - jump, rot = j > 0 && j < 1 ? .08 * Math.sin(j * TAU) : 0;
    const mood = j > .02 && j < .6 ? 'surprised' : j >= .6 ? 'sleepy' : 'smug', [px, py, k] = s6TiltMap(x, y, pitch);
    c.save(); c.translate(px, py); c.rotate(rot); c.translate(-px, -py);
    drawPatchouli(c, { x: px, y: py, h: E.h * k, pose: 'stand', mood, facing: j < .5 ? 1 : -1, look: .2, blink: mood === 'surprised' ? 0 : blinkAt(tau), mouth: mouthOf(L, 'patchouli'), t: tau });
    c.restore(); return; }
  if (tau < flop1) { const f = sm(flop0, flop1, tau, easeIn), [px, py, k] = s6TiltMap(fx, ground, pitch);
    c.save(); c.translate(px, py); c.rotate(-f * Math.PI / 2); c.translate(-px, -py);
    drawPatchouli(c, { x: px, y: py, h: E.h * k, pose: 'tired', mood: 'sleepy', facing: -1, blink: 1, t: tau }); c.restore(); return; }
  const bo = tau - flop1, bounce = bo < .35 ? Math.abs(Math.sin(bo / .35 * Math.PI)) * 14 * (1 - bo / .35) : 0;
  const [px, py, k] = s6TiltMap(fx - 250, ground + 96, pitch), fl = 1 - (1 - Math.cos(pitch)) * .7;
  c.save(); c.translate(px, py); c.scale(1, fl); c.translate(-px, -py);
  const r = drawPatchouli(c, { x: px, y: py - bounce * k, h: E.h * k, pose: 'lie', mood: 'sleepy', facing: 1, blink: 1, t: tau }); c.restore();
  r.head = [r.head[0], py + (r.head[1] - py) * fl];
  for (let n = 0; n < 3; n++) { const per = 2.4, on = tau - flop1 - .6 - n * .8, ph = (on % per + per) % per; if (on < 0) continue;
    const a = Math.min(sm(0, .3, ph), 1 - sm(1.7, 2.3, ph)); if (a <= 0) continue;
    zh(c, n % 2 ? 'z' : 'Z', r.head[0] + 40 + ph * 40, r.head[1] - 60 - ph * 50, { size: (30 + ph * 8) * k, color: P.cap, al: a * .9, base: 'middle' }); }
}

scene({ order: 6, key: 'ending', title: '结尾', dur: S6K.end, lines: S6LINES,
  fn(c, tau, L) {
    if (tau >= S6K.close0) { s6Closing(c, tau, L); return; }
    spread(c, tau);
    s6List(c, tau);
    s6Patchouli(c, tau, L);
    const hold = s6Cirno(c, tau, L);
    s6Card(c, tau, hold);
  } });
