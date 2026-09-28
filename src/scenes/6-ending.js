'use strict';
// 第 6 段：结尾（魔导书编配，照第 2 集片尾：合书 → 封面金墨写演职信息 → 镜头抬起）。
//   开头 1 秒是标准画面（第 5 段翻页过来）。
//   L0「三百道错题」开场那摞卷子从上面掉到右页中间、晃两下；「我压成了」琪露诺握拳一挥，卷子一下压扁，
//      「一张卡片」压扁处弹起一张借书卡大小的卡片，飞到琪露诺手里、举过头顶。L0 之后卡片飞到左页钉住，琪露诺往右让开一步。
//   L1「能猜到的，就不用记。」两行大字写在右页上方（卡片淡到背景），★ 句说完停约 1.2 秒。
//   L2 琪露诺「果然，我是最强的！」握拳蹦起来；大字淡到背景，下面一条小纸带只打出 1 个孔。
//   L3「1 比特」时纸带旁写上「= 1 比特」，「下课」帕秋莉鞠一躬。
//   片尾（约 13 秒）：左半本书翻过来合上（逐列透视），帕秋莉跳上封面、扑倒睡着；琪露诺飞出画面；
//        合上的书滑到桌子正中，金墨逐行写出演职信息；镜头从正上方慢慢抬到斜看（开场的反向）。
// 站位区（防穿模）：帕秋莉 x 205–455；琪露诺 x 1446–1754（L0 之后 1526–1834）、头顶 y ≥ 440。
//   卷子 x 1027–1433；卡片钉在左页 x 575–825；大字 x 1160–1640、y ≤ 380；纸带和「= 1 比特」x 1010–1510、y 560–680。
//
// 【从第 5 段接过来】第一帧严格是：
//   spread(c, tau)
//   drawPatchouli(c, { ...EP3.pch, pose: 'lecture', mood: 'normal', mouth: 0, blink: blinkAt(tau), t: tau })
//   drawCirno(c, { ...EP3.cir, pose: 'stand', mood: 'normal', mouth: 0, blink: blinkAt(tau, 2), t: tau })
// 书页上没有别的东西（没有页眉）。
// 顶层名字一律带本段前缀 S6 / s6（卷子借用开场的 s0Pile / S0PILE）。
const S6LINES = seq(1.0, [
  ['帕秋莉！三百道错题，我压成了一张卡片！', { who: 'cirno', mood: 'proud' }],
  ['能猜到的，就不用记。', { hold: 1.2 }],
  ['果然，我是最强的！', { who: 'cirno', mood: 'proud' }],
  ['……这句还是只值 1 比特。下课。', { mood: 'smug', hold: 0.6 }],
]);
const s6T = i => S6LINES[i][0], s6E = i => S6LINES[i][1];
// s6W：第 i 句里念到 sub 的时刻（按语音时长和字的位置估）
function s6W(i, sub) { const [t0, t1, text] = S6LINES[i], v = voiceOf(text), n = [...text].length, k = [...text.slice(0, Math.max(0, text.indexOf(sub)))].length;
  return t0 + (v ? v.d : Math.min(t1 - t0, n * .17 + .5)) * k / n; }
// 节拍（都从台词和语音进度推出来）
const S6K = (() => { const land = s6W(0, '三百'), press0 = s6W(0, '压成') - .1, press1 = press0 + .45, card1 = press1 + .35, grab0 = Math.max(s6W(0, '卡片') - .1, card1 + .1),
    e0 = s6E(0), e3 = s6E(3), bow0 = s6W(3, '下课') - .05, bow1 = bow0 + .9, close0 = Math.max(bow1 + .1, e3 - 1.0), close1 = close0 + 1.6;
  return { drop0: land - .45, land, press0, press1, card1, grab0, grab1: grab0 + .45, move0: e0 + .05, move1: e0 + .75,
    tape0: s6T(2) + .15, punch: s6W(2, '最强') + .2, bit: s6W(3, '1 比特') - .05, bow0, bow1, close0, close1, slide1: close1 + .8,
    title: close1 + .55, cred0: close1 + 1.3, credStep: .35, tilt0: close1 + 6.5, tilt1: close1 + 10.5, tilt2: close1 + 12.6, end: close1 + 13 }; })();
const S6GOLD = mix(P.moon, P.cap, .32);                                // 封面金墨（和第 1、2 集片尾同一种）
const S6CW = BOOK.w / 2 + 20;                                          // 封面宽
const S6PAT = { land: 1560 };                                          // 帕秋莉合书时跳上封面的落点（合书前的屏幕 x）
const S6CARD = { w: 200, h: 270 };                                     // 卡片（借书卡大小）
const S6PIN = { x: 700, y: 330, k: 1.25, rot: .05 };                   // 卡片放大后钉在左页的位置
const S6CIRX = 1680;                                                   // L0 之后琪露诺让到这里（包围框右边不出书页）
const S6BIG = { x: 1400, y0: 250, y1: 372, size: 96 };                 // 右页大字：两行的中心 x、基线
const S6BIT = { x: 1010, y: 640, label: 588 };                         // 「我是最强的」那条小纸带：左端、中线、上方标签的基线
// 演职信息（[文字, 组]；组与组之间空一点）
const S6CREDITS = [
  ['知识来源：斯坦尼斯拉斯·迪昂《精准学习》', 0], ['（浙江教育出版社），及作者的读书划线', 0],
  ['文献：Shannon 1948；Cowan 2001', 1], ['Chase & Simon 1973；Gobet & Simon 1996；Bisra 等 2018', 1],
  ['比特数：Qwen3-1.7B-Base 本机实测', 2], ['可视化致谢：3Blue1Brown《Compression is Intelligence》', 2],
  ['角色：东方 Project © 上海爱丽丝幻乐团（ZUN）。本片为同人科普作品。', 3],
  ['字体：霞鹜文楷（SIL OFL）　语音：AquesTalk（© 株式会社アクエスト）', 4],
];

// ===================== 卷子压成卡片 =====================
// 卷子：从上面掉下来（底边 y 从画面外落到 S0PILE.y）、落地晃两下，press 时压扁；压扁后不画
function s6Papers(c, tau) {
  const K = S6K; if (tau < K.drop0 || tau >= K.press1) return;
  const y = lerp(-40, S0PILE.y, sm(K.drop0, K.land, tau, easeIn)), u = tau - K.land, sway = u > 0 ? -34 * Math.sin(u * 7) * Math.exp(-u * 2.4) : 0;
  s0Pile(c, { x: S0PILE.x, y, sway, squash: sm(K.press0, K.press1, tau, easeIn) });
}
// 压扁的一下：卷子底边两侧迸几道短墨线
function s6Puff(c, tau) { const u = tau - S6K.press1; if (u < 0 || u > .35) return; const k = u / .35, { x, y, w } = S0PILE;
  c.save(); c.globalAlpha *= 1 - k; c.strokeStyle = P.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
  for (const sd of [-1, 1]) for (const a of [-.5, -.15, .2]) { const r0 = w / 2 + 10 + 40 * k, ax = Math.cos(a) * sd, ay = Math.sin(a) - .2;
    c.moveTo(x + ax * r0, y - 20 + ay * 40); c.lineTo(x + ax * (r0 + 26), y - 20 + ay * 40 + ay * 14); }
  c.stroke(); c.restore(); }
// 卡片画在 (0, 0) 为中心的局部坐标里：卡头一行字，下面十来道短墨线（压下来剩的几条规律）
const S6RULES = Array.from({ length: 12 }, (_, k) => ({ row: k, len: 60 + hash(k, 5) * 90 }));
function s6CardFace(c) {
  const { w, h } = S6CARD, path = cutPaper(c, rectPts(-w / 2, -h / 2, w, h, 6), '#f6f2e8', { seed: 3701, step: 30, blur: 8, sy: 4 });
  c.save(); c.clip(path);
  c.fillStyle = alpha(P.purple, .55); c.fillRect(-w / 2, -h / 2, w, 10);                                       // 卡头一道紫边
  zh(c, '错题 300 道', 0, -h / 2 + 52, { size: 30, align: 'center', color: P.ink });
  rline(c, [[-w / 2 + 16, -h / 2 + 72], [w / 2 - 16, -h / 2 + 72]], { w: 1.4, color: alpha(P.ink2, .5), seed: 3702, amp: .3 });
  S6RULES.forEach(({ row, len }, k) => { const y = -h / 2 + 94 + row * 14.5; rline(c, [[-w / 2 + 22, y], [-w / 2 + 22 + len, y]], { w: 2, color: alpha(P.ink2, .6), seed: 3710 + k, amp: .4 }); });
  c.restore();
}
// 卡片的位置：压扁处弹起 → grab 飞到琪露诺举起的手里（hold）→ L0 之后放大飞到左页钉住
const S6CARD_BASE = [S0PILE.x, S0PILE.y - S6CARD.h * .8 / 2 - 4];
function s6CardAt(tau, hold) {
  const K = S6K, hx = hold ? hold[0] : EP3.cir.x, hy = (hold ? hold[1] : EP3.cir.y - 419) - 40, g = sm(K.grab0, K.grab1, tau, easeIO), f = sm(K.move0, K.move1, tau, easeIO);
  const ax = lerp(S6CARD_BASE[0], hx, g), ay = lerp(S6CARD_BASE[1], hy, g) - Math.sin(g * Math.PI) * 90;
  return { x: lerp(ax, S6PIN.x, f), y: lerp(ay, S6PIN.y, f) - Math.sin(f * Math.PI) * 80, rot: lerp(-.06 * g, S6PIN.rot, f) + Math.sin(f * Math.PI) * .12, k: lerp(.8, S6PIN.k, f), lift: Math.max(Math.sin(f * Math.PI), Math.sin(g * Math.PI)), f }; }
function s6Card(c, tau, hold) {
  const K = S6K; if (tau < K.press1 - .05) return;
  const p = s6CardAt(tau, hold), pk = sm(K.press1 - .05, K.card1, tau, easeOutBack), { w, h } = S6CARD, al = 1 - .65 * sm(s6T(1), s6T(1) + .4, tau);   // L1 起淡到背景
  c.save(); c.globalAlpha *= al;
  if (p.lift > .01) { c.save(); c.translate(p.x + 30 * p.lift, p.y + 44 * p.lift); c.rotate(p.rot); c.scale(p.k, p.k); c.fillStyle = `rgba(20,12,10,${.18 * p.lift})`; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); }
  c.save(); c.translate(p.x, p.y + (1 - pk) * h * p.k / 2); c.rotate(p.rot); c.scale(p.k, p.k * pk); s6CardFace(c); c.restore();   // 从底边弹起来
  const sp = tau - K.card1; if (sp > 0 && sp < .6) sparkle(c, p.x + w * .4, p.y - h * .4, 26 * Math.sin(sp / .6 * Math.PI), { color: P.moon, rot: .2 });
  if (p.f >= 1) { const k = sm(K.move1, K.move1 + .15, tau, easeOutBack), co = Math.cos(S6PIN.rot), si = Math.sin(S6PIN.rot), px = 0, py = -h / 2 * S6PIN.k + 14;
    brassPin(c, S6PIN.x + co * px - si * py, S6PIN.y + si * px + co * py, 10 * k + .01); }
  c.restore();
}

// ===================== 右页：大字、1 比特的小纸带 =====================
function s6Words(c, tau) {
  const K = S6K, B = S6BIG, t1 = s6T(1), v = voiceOf(S6LINES[1][2]), spc = (v ? v.d : 2) / 10, a = 1 - .65 * sm(K.tape0 - .1, K.tape0 + .3, tau);   // L2 起淡到背景
  if (tau >= t1) fade(c, a, () => {
    zh(c, '能猜到的，', B.x, B.y0, { size: B.size, align: 'center', color: P.ink, p: writeP(tau, t1 + .05, '能猜到的，', spc) });
    zh(c, '就不用记。', B.x, B.y1, { size: B.size, align: 'center', color: P.ink, p: writeP(tau, t1 + .05 + 5 * spc, '就不用记。', spc) });
    const u0 = t1 + .05 + 10 * spc; rline(c, [[B.x - 230, B.y1 + 26], [B.x + 230, B.y1 + 26]], { w: 3, color: alpha(P.moon, .85), seed: 4140, p: sm(u0, u0 + .5, tau) }); });
  // L2：一条小纸带，一整句「我是最强的」只打 1 个孔；L3「1 比特」时旁边写上「= 1 比特」
  if (tau >= K.tape0) { const Bt = S6BIT, ta = sm(K.tape0, K.tape0 + .3, tau);
    fade(c, ta, () => {
      zh(c, '「我是最强的」', Bt.x, Bt.label, { size: 34, color: P.ink2 });
      const r = tape(c, { x: Bt.x, y: Bt.y, cells: [{ bits: 0 }, { bits: 0 }, { bits: 1 }, { bits: 0 }, { bits: 0 }], unit: 58, minW: 56, h: 64, rows: 1,
        p: sm(K.tape0, K.tape0 + .45, tau, easeOut), punch: tau >= K.punch ? 1 : 0 });
      const u = tau - K.punch, [hx, hy] = r.at(2);
      if (u > 0 && u < .35) { const k = u / .35; c.save(); c.globalAlpha *= 1 - k; c.strokeStyle = P.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
        for (let j = 0; j < 6; j++) { const an = j / 6 * TAU + .3, r0 = 14 + 22 * k; c.moveTo(hx + Math.cos(an) * r0, hy + Math.sin(an) * r0); c.lineTo(hx + Math.cos(an) * (r0 + 12), hy + Math.sin(an) * (r0 + 12)); }
        c.stroke(); c.restore(); }
      if (tau >= K.bit) { const t = '= 1 比特'; zh(c, t, Bt.x + r.len + 24, Bt.y + 16, { size: 46, color: P.ink, p: writeP(tau, K.bit, t, .08) }); }
    }); }
}

// ===================== 角色 =====================
function s6Patchouli(c, tau, L) {
  const K = S6K, T = s6T, E = EP3.pch, mouth = mouthOf(L, 'patchouli'), blink = blinkAt(tau);
  if (tau < T(0)) { drawPatchouli(c, { ...E, pose: 'lecture', mood: 'normal', mouth: 0, blink, t: tau }); return; }   // 交接帧
  let pose = 'lecture', mood = moodOf(L, 'patchouli', 'normal'), look = .6, gesture, rot = 0, tilt = 0;
  if (tau < T(1)) { pose = 'stand'; mood = tau < K.card1 ? 'surprised' : 'normal'; look = .8; }
  else if (tau < T(2)) { const lt = tau - T(1); gesture = lt < 1.2 ? .95 : .5; look = .7; }
  else if (tau < T(3)) { pose = 'cross'; mood = 'annoyed'; look = -.3; }
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
// 琪露诺：看卷子掉下来 → 「压成」握拳一挥 → 接住卡片举过头顶（返回 hold 点给卡片用）→ 让到右边 → L2 握拳蹦 → L3 鼓腮 → 合书时飞走
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
  if (tau < K.press0 - .2) { look = .5; }
  else if (tau < K.grab0) { pose = 'proud'; gesture = sm(K.press0 - .2, K.press0 + .05, tau, easeOutBack); y -= Math.abs(Math.sin(clamp((tau - K.press0 + .1) / .45, 0, 1) * Math.PI)) * 30; }
  else if (tau < K.move0) { pose = 'hold'; mood = 'proud'; y -= Math.abs(Math.sin(clamp((tau - K.grab1) / .5, 0, 1) * Math.PI)) * 24; }
  else if (tau < T(2)) { mood = 'happy'; look = -.4; tilt = .06 * Math.sin(clamp((tau - T(1) - .3) / .5, 0, 1) * Math.PI); }
  else if (tau < T(3)) { const lt = tau - T(2); pose = 'proud'; mood = 'proud'; gesture = sm(0, .3, lt, easeOutBack); y -= Math.abs(Math.sin(clamp((lt - .1) / .5, 0, 1) * Math.PI)) * 34; }
  else mood = 'pout';
  const r = drawCirno(c, { x, y, h: E.h, facing: E.facing, pose, mood, mouth, blink, t: tau, gesture, look, tilt });
  if (tau >= T(2) && tau < T(2) + 1.2) { const lt = tau - T(2) - .25, [hx, hy] = r.hands.reduce((a, b) => b[1] < a[1] ? b : a);
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
    s6Words(c, tau);
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
    s6Words(c, tau);
    s6Papers(c, tau); s6Puff(c, tau);
    s6Patchouli(c, tau, L);
    const hold = s6Cirno(c, tau, L);
    s6Card(c, tau, hold);
  } });
