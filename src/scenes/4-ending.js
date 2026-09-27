'use strict';
// 第 4 段：结尾（魔导书编配，照第 1 集片尾：清单 → 合书 → 封面金墨写演职信息 → 镜头抬起）。
//   开头：第 3 段化成的一滴水落到书页正中（EP2.drop），溅开；冰面在 EP2.exam 的位置扩开，冰下是一张结霜的试卷，
//        冰和霜一起化掉，露出 90 分。L0 琪露诺指着试卷；L1「多了一个零」时分数里的「0」蹦一下、闪一下。
//   L1 之后：试卷缩小、飞到左页钉住；琪露诺往右让开；右页一句一行手写清单，每行配一个小墨线图：
//        一盏灯和它的光锥、一张翻过来的牌、一个红火花、三层冰和一弯月亮。
//   L6 琪露诺「最强」蹦一下；L7 帕秋莉指清单「是方法最强」，「下课」鞠一躬。
//   片尾（约 8 秒）：左半本书翻过来合上（逐列透视），帕秋莉跳上封面、扑倒睡着；琪露诺飞出画面；
//        合上的书滑到桌子正中，金墨逐行写出演职信息；镜头从正上方慢慢抬到斜看（开场的反向）。
//
// 【从第 3 段接过来】第一帧严格是：
//   spread(c, tau)
//   waterDrop(c, EP2.drop.x, EP2.drop.y, NET.dropR)            // 水滴中心正在落点上，半径 NET.dropR（34），squash 0
//   drawPatchouli(c, { ...EP2.pch, pose: 'lecture', mood: 'normal', mouth: 0, blink: blinkAt(tau), t: tau })
//   drawCirno(c, { ...EP2.cir, pose: 'stand', mood: 'normal', mouth: 0, blink: blinkAt(tau, 2), t: tau })
// 书页上没有别的东西（没有页眉）。
// 顶层名字一律带本段前缀 S4 / s4。
const S4LINES = seq(1.0, [
  ['帕秋莉！我考了……90 分！', { who: 'cirno', mood: 'happy' }],
  ['从 9 到 90，多了一个零。不错。', { mood: 'smug', dur: 3.6 }],
  ['一次只开一盏灯。', { pause: .7, dur: 1.8 }],
  ['先猜，再看答案。', { dur: 2.0 }],
  ['错了马上弄清为什么。', { dur: 2.3 }],
  ['隔几天复习，然后睡觉。', { hold: .5 }],
  ['果然，我是最强的！', { who: 'cirno', mood: 'proud', dur: 2.1 }],
  ['……是方法最强。下课。', { mood: 'annoyed', hold: 1.2 }],
]);
const s4T = i => S4LINES[i][0], s4E = i => S4LINES[i][1];
const S4DROP_R = NET.dropR;                                                  // 交接水滴的半径
// 节拍（都从台词时间推出来）
const S4K = (() => { const e1 = s4E(1), e7 = s4E(7), close0 = e7 - 1.0, close1 = close0 + 1.6;
  return { splash: .1, ice0: .1, ice1: .55, melt0: s4T(0) + .4, melt1: s4T(0) + 2.1, zero: s4T(1) + 1.0,
    move0: e1 + .05, move1: e1 + .7, bow0: e7 - 2.3, bow1: e7 - 1.4, close0, close1, slide1: close1 + .8,
    title: close1 + .55, cred0: close1 + 1.3, credStep: .26, tilt0: close1 + .9, tilt1: close1 + 5.2, tilt2: close1 + 7.4, end: close1 + 7.7 }; })();
const S4GOLD = mix(P.moon, P.cap, .32);                                // 封面金墨（和第 1 集片尾同一种）
const S4CW = BOOK.w / 2 + 20;                                          // 封面宽
const S4PAT = { land: 1560 };                                          // 帕秋莉合书时跳上封面的落点（合书前的屏幕 x）
const S4PIN = { x: 690, y: 300, k: .5, rot: .06 };                     // 试卷缩小后钉在左页的位置
const S4CIRX = 1710;                                                   // 清单出来时琪露诺让到这里
const S4LIST = { icon: 1068, text: 1135, y0: 196, dy: 126, size: 42 }; // 右页清单：图的中心 x、字的起点、第一行图中心 y、行距、字号
const S4ITEMS = ['一次只开一盏灯。', '先猜，再看答案。', '错了马上弄清为什么。', '隔几天复习，然后睡觉。'];
// 演职信息（[文字, 组]；组与组之间空一点）
const S4CREDITS = [
  ['知识来源：斯坦尼斯拉斯·迪昂《精准学习》', 0], ['（浙江教育出版社），及作者的读书划线', 0],
  ['补充文献：Dunlosky, J. et al. (2013) Improving students’ learning', 1], ['with effective learning techniques. Psychological Science in the Public Interest', 1],
  ['Roediger, H. L. & Karpicke, J. D. (2006) Test-enhanced learning. Psychological Science', 1],
  ['角色：东方 Project © 上海爱丽丝幻乐团（ZUN）。本片为同人科普作品。', 2],
  ['字体：霞鹜文楷（SIL OFL）　语音：AquesTalk（© 株式会社アクエスト）', 3],
];

// ===================== 水滴、冰面、试卷 =====================
// 水滴落地：压扁一下，溅出几颗小水珠和两圈涟漪
function s4Splash(c, tau) {
  const { x, y } = EP2.drop;
  if (tau < S4K.splash + .02) { waterDrop(c, x, y, S4DROP_R, { squash: sm(0, S4K.splash, tau, easeIn) }); return; }
  const u = tau - S4K.splash; if (u > .8) return;
  for (let k = 0; k < 2; k++) { const v = clamp((u - k * .12) / .6, 0, 1); if (v <= 0 || v >= 1) continue;
    const rx = 40 + easeOut(v) * 230; c.save(); c.globalAlpha *= 1 - v; c.strokeStyle = EP2_ICE_DEEP; c.lineWidth = 4 - k; c.beginPath(); c.ellipse(x, y + 10, rx, rx * .42, 0, 0, TAU); c.stroke(); c.restore(); }
  for (let k = 0; k < 9; k++) { const v = clamp(u / .6, 0, 1); if (v >= 1) break; const an = Math.PI + k / 8 * Math.PI, sp = 150 + hash(k, 41) * 160;
    const px = x + Math.cos(an) * sp * v * 1.1, py = y + Math.sin(an) * sp * v * .8 + 260 * v * v;
    waterDrop(c, px, py, (7 + hash(k, 42) * 6) * (1 - v * .5), { al: 1 - v }); }
}
// 冰面：一块边缘不齐的冰（冰色半透明 + 几道白色高光和裂纹），从中心扩开（spread 0..1），融化时变淡、往里收（melt 0..1）
const S4ICE_PTS = (() => { const { w, h } = EP2.exam, o = [], n = 44;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, ca = Math.cos(a), sa = Math.sin(a), r = 1 / Math.max(Math.abs(ca) / (w / 2 + 26), Math.abs(sa) / (h / 2 + 26)), j = 1 + (hash(i, 51) - .5) * .09; o.push([ca * r * j, sa * r * j]); }
  return o; })();
function s4IceSheet(c, spread, melt) {
  const a = 1 - melt; if (a <= 0 || spread <= 0) return; const k = lerp(1, .93, melt), { w, h } = EP2.exam;
  c.save(); c.globalAlpha *= a; c.scale(k, k);
  const path = polyPath(S4ICE_PTS);
  c.fillStyle = alpha(EP2_ICE, .78); c.fill(path); c.strokeStyle = EP2_ICE_DEEP; c.lineWidth = 3; c.stroke(path);
  c.save(); c.clip(path); c.strokeStyle = alpha('#ffffff', .7); c.lineCap = 'round';
  for (const [x0, y0, len, lw] of [[-w * .35, -h * .2, 220, 10], [-w * .1, -h * .35, 140, 6], [w * .05, h * .15, 190, 8]]) { c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + len * .6, y0 - len * .8); c.stroke(); }
  c.lineWidth = 2; c.strokeStyle = alpha('#ffffff', .8); c.beginPath();
  for (const [x0, y0, pts] of [[20, 30, [[70, -40], [120, -30], [170, -90]]], [-30, 60, [[-90, 110], [-120, 190]]], [10, 20, [[-40, -80], [-20, -160], [-70, -230]]]]) { c.moveTo(x0, y0); for (const [px, py] of pts) c.lineTo(px, py); }
  c.stroke(); c.restore(); c.restore();
}
// 冰面扩开的圆（冰和冰下的试卷都只在这个圆里）
const s4IceR = tau => easeOut(clamp((tau - S4K.ice0) / (S4K.ice1 - S4K.ice0), 0, 1)) * 400;
// 试卷的位置：先在 EP2.exam，L1 之后缩小飞到左页钉住
function s4PaperAt(tau) { const E = EP2.exam, f = sm(S4K.move0, S4K.move1, tau, easeIO);
  return { x: lerp(E.x, S4PIN.x, f), y: lerp(E.y, S4PIN.y, f) - Math.sin(f * Math.PI) * 70, rot: lerp(E.rot, S4PIN.rot, f) + Math.sin(f * Math.PI) * .12, k: lerp(1, S4PIN.k, f), lift: Math.sin(f * Math.PI), f }; }
// 「0」：L1 说到「多了一个零」时蹦一下（压扁、落回原位），旁边一颗小闪光。
// 做法：盖住 examPaper 画的分数和红圈（同色纸 + 同一张纸纹），重画「9」、红圈（同一个种子）和跳起来的「0」
function s4Zero(c, tau) {
  const u = tau - S4K.zero; if (u < 0 || u > 1.1) return; const { w, h } = EP2.exam, sx = w / 2 - 92, sy = -h / 2 + 96, size = 96;
  const w90 = zhWidth(c, '90', size), w9 = zhWidth(c, '9', size), w0 = zhWidth(c, '0', size), x9 = sx - w90 / 2, zx = x9 + w9 + w0 / 2;
  const v = clamp(u / .55, 0, 1), hop = Math.sin(v * Math.PI) * 34, sq = v > .85 ? Math.sin((v - .85) / .15 * Math.PI) * .12 : 0;
  const patch = polyPath(rectPts(sx - 94, sy - 66, 188, 138));
  c.fillStyle = '#f6f2e8'; c.fill(patch); grain(c, patch, .1);
  zh(c, '9', x9, sy + 40, { size, color: P.red });
  c.save(); c.translate(zx, sy + 40 - hop); c.scale(1 + sq, 1 - sq); zh(c, '0', 0, 0, { size, color: P.red, align: 'center' }); c.restore();
  rline(c, ellPts(sx, sy + 4, 82, 58, 40, -.2), { w: 5, color: P.red, seed: 3301 + 5 });
  const sp = sm(.25, .4, u, easeOutBack) * (1 - sm(.7, 1.1, u)); if (sp > 0) sparkle(c, zx + w0 * .6, sy - 30 - hop * .5, 22 * sp, { color: P.moon, rot: .2 });
}
function s4Paper(c, tau) {
  if (tau < S4K.ice0) return;
  const p = s4PaperAt(tau), R = s4IceR(tau), melt = sm(S4K.melt0, S4K.melt1, tau), frost = 1 - sm(S4K.melt0, S4K.melt1 + .4, tau);
  if (p.lift > .01) { c.save(); c.translate(p.x + 30 * p.lift, p.y + 44 * p.lift); c.rotate(p.rot); c.scale(p.k, p.k); c.fillStyle = `rgba(20,12,10,${.18 * p.lift})`; c.fillRect(-EP2.exam.w / 2, -EP2.exam.h / 2, EP2.exam.w, EP2.exam.h); c.restore(); }
  c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(p.k, p.k);
  if (R < 399) { c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip(); }
  examPaper(c, { x: 0, y: 0, rot: 0, score: 90, frost });
  s4Zero(c, tau);
  s4IceSheet(c, R, melt);
  // 融化时底边滴下几滴水
  for (let k = 0; k < 3; k++) { const v = sm(S4K.melt0 + .3 + k * .35, S4K.melt0 + 1.2 + k * .35, tau, easeIn); if (v <= 0 || v >= 1) continue;
    waterDrop(c, -120 + k * 130, EP2.exam.h / 2 + 20 + v * 70, 10, { al: 1 - v * v }); }
  c.restore();
  if (p.f >= 1) { const k = sm(S4K.move1, S4K.move1 + .15, tau, easeOutBack), co = Math.cos(S4PIN.rot), si = Math.sin(S4PIN.rot), px = 26, py = -EP2.exam.h / 2 * S4PIN.k + 13;
    brassPin(c, S4PIN.x + co * px - si * py, S4PIN.y + si * px + co * py, 10 * k + .01); }
}

// ===================== 右页清单 =====================
// 四个小墨线图，(x, y) 中心，p 画出进度，u 画完后的秒数（小动作）
function s4Icon(c, i, x, y, p, u) {
  const o = { w: 3, color: P.ink, amp: .6 }, seg = (a, b) => clamp((p - a) / (b - a), 0, 1);
  if (i === 0) {   // 一盏灯：吊线、灯罩、光锥，锥底一个小点被照亮
    rline(c, [[x, y - 58], [x, y - 36]], { ...o, w: 2, p: seg(0, .2), seed: 4001 });
    rline(c, [[x - 12, y - 36], [x + 12, y - 36], [x + 22, y - 20], [x - 22, y - 20], [x - 12, y - 36]], { ...o, p: seg(.15, .45), seed: 4002 });
    const a = seg(.45, 1) * (.85 + .15 * Math.sin(u * 5));
    if (a > 0) { c.save(); c.fillStyle = alpha(P.moon, .28 * a); c.beginPath(); c.moveTo(x - 20, y - 20); c.lineTo(x + 20, y - 20); c.lineTo(x + 46, y + 44); c.lineTo(x - 46, y + 44); c.closePath(); c.fill(); c.restore();
      rline(c, [[x - 20, y - 20], [x - 46, y + 44]], { ...o, w: 1.6, color: alpha(P.ink, .6), p: a, seed: 4003 }); rline(c, [[x + 20, y - 20], [x + 46, y + 44]], { ...o, w: 1.6, color: alpha(P.ink, .6), p: a, seed: 4004 });
      c.fillStyle = alpha(P.ink, a); c.beginPath(); c.ellipse(x, y + 42, 9, 4, 0, 0, TAU); c.fill(); }
  } else if (i === 1) {   // 一张牌：先是背面（斜线），翻过来是一个勾
    const fl = sm(.5, 1, p), sx = Math.cos(fl * Math.PI), bw = 30, bh = 42;
    if (p <= 0) return; c.save(); c.translate(x, y); c.scale(Math.max(.04, Math.abs(sx)), 1);
    const card = rectPts(-bw, -bh, bw * 2, bh * 2, 6);
    c.fillStyle = sx > 0 ? mix(BOOK.page, P.ink, .06) : '#f6f2e8'; c.globalAlpha *= seg(0, .3); c.fill(polyPath(card)); c.globalAlpha = 1;
    rline(c, card, { ...o, close: true, p: seg(0, .4), seed: 4011 });
    if (sx > 0 && p > .3) { c.save(); c.clip(polyPath(card)); c.strokeStyle = alpha(P.ink, .35); c.lineWidth = 1.5; c.beginPath(); for (let d = -80; d < 80; d += 11) { c.moveTo(d - 40, -bh); c.lineTo(d + 40, bh); } c.stroke(); c.restore(); }
    if (sx < 0) rline(c, [[-14, 2], [-3, 14], [16, -14]], { ...o, w: 4, seed: 4012, p: seg(.8, 1) });
    c.restore();
  } else if (i === 2) {   // 一个红火花：八角星 + 几道短线
    const k = sm(0, .5, p, easeOutBack), tw = 1 + .08 * Math.sin(u * 9);
    if (k > 0) { cutPaper(c, starPts(x, y, 30 * k * tw, 8, .42, u * .4), P.red, { seed: 4021, step: 5, blur: 3, sx: 1, sy: 2 });
      c.save(); c.strokeStyle = P.red; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
      for (let j = 0; j < 4; j++) { const an = j * Math.PI / 2 + .4, r0 = 38 * k, r1 = r0 + 14 * seg(.5, 1); c.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); c.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); } c.stroke(); c.restore(); }
  } else {   // 三层冰，一层一层叠上去；上面一弯月亮
    for (let j = 0; j < 3; j++) { const v = sm(j * .22, j * .22 + .25, p, easeOutBack); if (v <= 0) continue; const yy = y + 36 - j * 18;
      c.save(); c.translate(x, yy); c.scale(1, v); cutPaper(c, rectPts(-42 + j * 5, -8, 84 - j * 10, 16, 3), j % 2 ? EP2_ICE_DEEP : EP2_ICE, { seed: 4031 + j, step: 12, blur: 2, sx: 1, sy: 1.5, grain: .05 }); c.restore(); }
    const m = sm(.66, 1, p, easeOutBack); if (m > 0) drawMoonIcon(c, x + 18, y - 34 - Math.sin(u * 1.5) * 2, 18 * m, P.moon, -.5);
  }
}
function s4List(c, tau) {
  for (let i = 0; i < 4; i++) { const t0 = s4T(i + 2); if (tau < t0) continue; const y = S4LIST.y0 + i * S4LIST.dy, text = S4ITEMS[i];
    s4Icon(c, i, S4LIST.icon, y, sm(t0, t0 + .7, tau, t => t), tau - t0 - .7);
    zh(c, text, S4LIST.text, y + 15, { size: S4LIST.size, color: P.ink, p: writeP(tau, t0 + .25, text, .07) }); }
}

// ===================== 角色 =====================
function s4Patchouli(c, tau, L) {
  const K = S4K, T = s4T, E = EP2.pch, mouth = mouthOf(L, 'patchouli'), blink = blinkAt(tau);
  if (tau < .15) { drawPatchouli(c, { ...NET.cast.pch, mood: 'normal', mouth: 0, blink, t: tau }); return; }   // 交接帧
  let pose = 'lecture', mood = moodOf(L, 'patchouli', 'normal'), look = .6, gesture, rot = 0, tilt = 0;
  if (tau < T(0)) { pose = 'stand'; mood = 'surprised'; look = .8; }
  else if (tau < T(1)) { pose = 'stand'; mood = (tau - T(0)) / (s4E(0) - T(0)) < .6 ? 'surprised' : 'normal'; look = .8; }
  else if (tau < T(2) - .3) { pose = tau < s4E(1) ? 'point' : 'lecture'; look = .7; }
  else if (tau < T(6)) { const i = [2, 3, 4, 5].filter(j => tau >= T(j)).pop(), lt = i ? tau - T(i) : 9; gesture = lt < .9 ? .95 : .5; look = .7;
    if (i === 5 && (tau - T(5)) / (s4E(5) - T(5)) > .65) mood = 'sleepy'; }
  else if (tau < T(7)) { pose = 'cross'; mood = 'annoyed'; look = -.3; }
  else if (tau < K.bow0) { pose = 'point'; look = .6; }
  else { pose = 'stand'; mood = 'smug'; const b = Math.sin(clamp((tau - K.bow0) / (K.bow1 - K.bow0), 0, 1) * Math.PI); rot = .14 * b; tilt = .15 * b; }   // 「下课」鞠一躬
  c.save(); c.translate(E.x, E.y); c.rotate(rot); c.translate(-E.x, -E.y);
  drawPatchouli(c, { ...E, pose, mood, look, gesture, tilt, mouth, blink, t: tau }); c.restore();
}
// 琪露诺的冰晶
function s4Flake(c, x, y, r, rot, a) { if (a <= 0 || r <= .5) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot); c.strokeStyle = EP2_ICE_DEEP; c.lineWidth = Math.max(1.4, r * .18); c.lineCap = 'round'; c.beginPath();
  for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3, bx = Math.cos(an) * r * .55, by = Math.sin(an) * r * .55;
    c.moveTo(0, 0); c.lineTo(Math.cos(an) * r, Math.sin(an) * r); for (const s of [-.7, .7]) { c.moveTo(bx, by); c.lineTo(bx + Math.cos(an + s) * r * .32, by + Math.sin(an + s) * r * .32); } }
  c.stroke(); c.restore(); }
// 片尾琪露诺飞出画面的路线
const S4EXIT = [S4CIRX, EP2.cir.y, 2250, -160];
function s4ExitAt(tau) { const u = sm(S4K.close0 - .1, S4K.close0 + 1.3, tau, easeIn); return [lerp(S4EXIT[0], S4EXIT[2], u), lerp(S4EXIT[1], S4EXIT[3], u) - Math.sin(u * Math.PI) * 60, u]; }
function s4Cirno(c, tau, L) {
  const K = S4K, T = s4T, E = EP2.cir, mouth = mouthOf(L, 'cirno'), blink = blinkAt(tau, 2);
  if (tau < .15) { drawCirno(c, { ...NET.cast.cir, mood: 'normal', mouth: 0, blink, t: tau }); return; }   // 交接帧
  if (tau >= K.close0 - .1) {   // 合书时飞走，身后一串冰晶
    for (let k = 0; k < 14; k++) { const tk = K.close0 - .1 + k * .1, age = tau - tk; if (age < 0 || age > 1.1) continue; const [px, py] = s4ExitAt(tk);
      s4Flake(c, px + 30 + (hash(k, 61) - .5) * 120, py - 200 + hash(k, 62) * 200 + age * 50, 9 + hash(k, 63) * 8, age * 2 + k, 1 - age / 1.1); }
    const [x, y, u] = s4ExitAt(tau); if (u >= 1) return;
    drawCirno(c, { x, y, h: E.h, facing: 1, pose: 'fly', mood: 'happy', blink: 0, mouth: 0, t: tau, tilt: .15 }); return; }
  const mv = sm(K.move0, K.move1, tau, easeIO);
  let x = lerp(E.x, S4CIRX, mv), y = E.y - Math.sin(mv * Math.PI) * 70, pose = 'stand', mood = moodOf(L, 'cirno', 'normal'), gesture, look = 0, tilt = 0;
  if (tau < T(0)) mood = 'surprised';
  else if (tau < T(1)) { pose = 'point'; gesture = .9; y -= Math.abs(Math.sin(clamp((tau - T(0) - 1.2) / .5, 0, 1) * Math.PI)) * 24; }
  else if (tau < T(2)) mood = 'happy';
  else if (tau < T(6)) { const i = [2, 3, 4, 5].filter(j => tau >= T(j)).pop(); tilt = .08 * Math.sin(clamp((tau - T(i) - .3) / .4, 0, 1) * Math.PI); look = -.4; }   // 每出一行点一下头
  else if (tau < T(7)) { const lt = tau - T(6); pose = 'proud'; gesture = sm(0, .3, lt, easeOutBack); y -= Math.abs(Math.sin(clamp((lt - .1) / .5, 0, 1) * Math.PI)) * 34; }
  else mood = 'pout';
  const r = drawCirno(c, { x, y, h: E.h, facing: E.facing, pose, mood, mouth, blink, t: tau, gesture, look, tilt });
  if (tau >= T(6) && tau < T(6) + 1.2) { const lt = tau - T(6) - .25, [hx, hy] = r.hands.reduce((a, b) => b[1] < a[1] ? b : a);
    for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + (k - 2.5) * .45, d = easeOut(clamp(lt / .6, 0, 1)) * (60 + hash(k, 64) * 50); s4Flake(c, hx + Math.cos(an) * d, hy + Math.sin(an) * d, 10 + hash(k, 65) * 6, lt * 3 + k, 1 - sm(.3, .9, lt, t => t)); } }
}

// ===================== 合书与片尾（照第 1 集片尾） =====================
// 封面：和开场同一本书（kit 的 grimoireCover）+ 月牙徽记；ct = 封面落下后的秒数（< 0 不写字）
function s4Cover(c, tau, x0, ct) {
  const { y } = BOOK, cx = x0 + S4CW / 2, maxW = S4CW - 230;
  grimoireCover(c, x0, S4CW, { clasp: ct < 0 ? 1 : 1 - sm(0, .3, ct) });
  drawMoonIcon(c, cx, y + 88, 34, P.moon, -.5);
  if (ct < 0) return;
  const K = S4K, T = s => s - K.close1;
  zh(c, '帕秋莉讲座 · 第 2 集 · 完', cx, y + 190, { size: 52, align: 'center', color: S4GOLD, p: writeP(ct, T(K.title), '帕秋莉讲座 · 第 2 集 · 完', .05) });
  rline(c, [[cx - 170, y + 222], [cx + 170, y + 222]], { w: 2, color: alpha(P.moon, .6), seed: 1203, p: sm(T(K.title) + .6, T(K.title) + 1.0, ct) });
  let yy = y + 292, grp = 0;
  S4CREDITS.forEach(([s, g], i) => { if (g !== grp) { yy += 22; grp = g; } const t0 = T(K.cred0) + i * K.credStep, size = Math.min(32, 32 * maxW / zhWidth(c, s, 32));
    zh(c, s, cx, yy, { size, align: 'center', color: S4GOLD, p: writeP(ct, t0, s, .012), al: sm(t0 - .05, t0 + .2, ct) }); yy += 48; });
}
// 合书：左半本（左页 + 封面）绕书脊从左翻到右，逐列透视，th 0..π
const S4BUF = document.createElement('canvas');
// s4BufCtx：取缓冲画布（sc = 出片缩放，不含镜头推拉）
function s4BufCtx(sc) { if (S4BUF.width !== Math.round(W * sc)) { S4BUF.width = Math.round(W * sc); S4BUF.height = Math.round(H * sc); }
  const b = S4BUF.getContext('2d'); b.setTransform(sc, 0, 0, sc, 0, 0); return b; }
// s4Swing：翻到左半（face）时直接用 s4Closing 已经画进缓冲的摊开书（spread + 钉着的试卷）；翻过去以后缓冲里重画封面
function s4Swing(c, tau, th, sc) {
  const face = Math.cos(th) > 0;   // true：看到的是左页那面；false：封面那面
  if (!face) { const b = s4BufCtx(sc); b.clearRect(0, 0, W, H); s4Cover(b, tau, CX - 10, -1); }
  const f = 2900, y0 = BOOK.y - 8, y1 = BOOK.y + BOOK.h + 12, span = CX - (BOOK.x - 10), step = 4;
  const col = s => { const hz = s * Math.sin(th), k = f / (f - hz); return [CX - s * Math.cos(th) * k, k]; };
  const shade = .38 * (1 - Math.abs(Math.cos(th))), up = [], dn = [];
  for (let s = 0; s < span; s += step) {
    const [xa, ka] = col(s), [xb] = col(Math.min(span, s + step)), xs = face ? CX - s - step : CX - 10 + s;
    const top = CY + (y0 - CY) * ka, hh = (y1 - y0) * ka; up.push([xa, top]); dn.push([xa, top + hh]);
    const dx = Math.min(xa, xb), dw = Math.abs(xb - xa) + .7; if (dw < .05) continue;
    c.drawImage(S4BUF, xs * sc, y0 * sc, step * sc, (y1 - y0) * sc, dx, top, dw, hh);
  }
  // 翻起来时整片压暗（一次填满，不逐列）
  if (shade > .01 && up.length > 1) { c.fillStyle = `rgba(20,12,10,${shade * (face ? 1 : .7)})`; c.fill(polyPath([...up, ...dn.reverse()])); }
}
// 镜头俯仰：y → [屏幕 x, 屏幕 y, 缩放]（和 kit 的 tiltPlane 同一个公式）
function s4TiltMap(x, y, pitch, f = 1400) { const cp = Math.cos(pitch), sp = Math.sin(pitch), d = y - CY, k = f / (f + d * sp); return [CX + (x - CX) * k, CY + d * cp * k, k]; }
function s4Closing(c, tau, L) {
  const K = S4K, cu = sm(K.close0, K.close1, tau, easeIO), th = cu * Math.PI;
  const slide = sm(K.close1, K.slide1, tau, easeIO), x0 = lerp(CX - 10, CX - S4CW / 2, slide), dx = x0 - (CX - 10);
  const pitch = tau < K.tilt1 ? lerp(0, -.2, sm(K.tilt0, K.tilt1, tau, easeIO)) : lerp(-.2, -.8, sm(K.tilt1, K.tilt2, tau, easeIO));
  const zoom = lerp(1, .9, sm(K.tilt1, K.tilt2, tau, easeIO)) * (1 - .035 * Math.sin(cu * Math.PI));
  const thud = tau > K.close1 && tau < K.close1 + .25 ? Math.sin((tau - K.close1) / .25 * Math.PI * 3) * 3 * (1 - (tau - K.close1) / .25) : 0;
  c.fillStyle = WOOD; c.fillRect(0, 0, W, H);
  const sc = c.getTransform().a || 1;
  c.save(); c.translate(CX, CY + thud); c.scale(zoom, zoom); c.translate(-CX, -CY);
  if (cu < 1) {
    // 摊开的书只画一次（spread 很贵）：画进缓冲，右半本贴到画面上，左半本给 s4Swing 翻
    const b = s4BufCtx(sc); spread(b, tau); s4Paper(b, tau);
    desk(c);
    c.drawImage(S4BUF, (CX - 12) * sc, 0, (W - CX + 12) * sc, H * sc, CX - 12, 0, W - CX + 12, H);
    s4List(c, tau);
    if (th > Math.PI / 2) { const a = sm(Math.PI / 2, Math.PI, th, t => t), wv = BOOK.R.w * (1 - a) + 60, g = c.createLinearGradient(CX, 0, CX + wv + 200, 0); g.addColorStop(0, `rgba(20,12,10,${.45 * a})`); g.addColorStop(1, 'rgba(20,12,10,0)'); c.fillStyle = g; c.fillRect(CX, BOOK.y, BOOK.R.w + 60, BOOK.h); }
    s4Swing(c, tau, th, sc);
  } else {
    const ct = tau - K.close1;
    tiltPlane(c, b => { desk(b); b.save(); b.translate(dx, 0);
      cutPaper(b, rectPts(CX - 10 + 6, BOOK.y - 2, S4CW - 6, BOOK.h + 18, 6), BOOK.page2, { seed: 1210, step: 50, blur: 14, sx: 0, sy: 8, grain: .1 });
      s4Cover(b, tau, CX - 10, ct); b.restore(); }, { pitch, cy: CY });
    if (pitch < -.01) { const [ax, ay, ka] = s4TiltMap(x0, BOOK.y + BOOK.h + 12, pitch), [bx] = s4TiltMap(x0 + S4CW, BOOK.y + BOOK.h + 12, pitch);
      grimoireEdge(c, ax, ay, bx, ay, GRIMOIRE.thick * Math.sin(-pitch) * ka); }
  }
  s4Sleeper(c, tau, L, dx, pitch);
  c.restore();
  s4Cirno(c, tau, L);   // 飞出画面（不跟镜头）
  if (pitch < -.01) { const a = sm(0, -.8, pitch, t => t), g = c.createLinearGradient(0, 0, 0, H * .55); g.addColorStop(0, alpha('#0d0908', .85 * a)); g.addColorStop(1, alpha('#0d0908', 0)); c.fillStyle = g; c.fillRect(0, 0, W, H * .55); }
  const dk = sm(K.end - .7, K.end, tau); if (dk > 0) { c.fillStyle = alpha('#0d0908', dk * .75); c.fillRect(0, 0, W, H); }
}
// 帕秋莉：从左页跳起来，越过书脊落在合上的封面上 → 纸板一样扑倒 → 躺着睡（呼吸、Z）
function s4Sleeper(c, tau, L, dx, pitch) {
  const K = S4K, E = EP2.pch, flop0 = K.close1 + .45, flop1 = flop0 + .3, j = sm(K.close0 + .15, K.close1 + .05, tau, t => t), jump = Math.sin(j * Math.PI) * 260, ground = E.y - (tau > K.close1 ? 6 : 0), fx = S4PAT.land + dx;
  if (tau < flop0) {
    const x = lerp(E.x, S4PAT.land, sm(0, 1, j, easeIO)) + dx, y = ground - jump, rot = j > 0 && j < 1 ? .08 * Math.sin(j * TAU) : 0;
    const mood = j > .02 && j < .6 ? 'surprised' : j >= .6 ? 'sleepy' : 'smug', [px, py, k] = s4TiltMap(x, y, pitch);
    c.save(); c.translate(px, py); c.rotate(rot); c.translate(-px, -py);
    drawPatchouli(c, { x: px, y: py, h: E.h * k, pose: 'stand', mood, facing: j < .5 ? 1 : -1, look: .2, blink: mood === 'surprised' ? 0 : blinkAt(tau), mouth: mouthOf(L, 'patchouli'), t: tau });
    c.restore(); return; }
  if (tau < flop1) { const f = sm(flop0, flop1, tau, easeIn), [px, py, k] = s4TiltMap(fx, ground, pitch);
    c.save(); c.translate(px, py); c.rotate(-f * Math.PI / 2); c.translate(-px, -py);
    drawPatchouli(c, { x: px, y: py, h: E.h * k, pose: 'tired', mood: 'sleepy', facing: -1, blink: 1, t: tau }); c.restore(); return; }
  const bo = tau - flop1, bounce = bo < .35 ? Math.abs(Math.sin(bo / .35 * Math.PI)) * 14 * (1 - bo / .35) : 0;
  const [px, py, k] = s4TiltMap(fx - 250, ground + 96, pitch), fl = 1 - (1 - Math.cos(pitch)) * .7;
  c.save(); c.translate(px, py); c.scale(1, fl); c.translate(-px, -py);
  const r = drawPatchouli(c, { x: px, y: py - bounce * k, h: E.h * k, pose: 'lie', mood: 'sleepy', facing: 1, blink: 1, t: tau }); c.restore();
  r.head = [r.head[0], py + (r.head[1] - py) * fl];
  for (let n = 0; n < 3; n++) { const per = 2.4, on = tau - flop1 - .6 - n * .8, ph = (on % per + per) % per; if (on < 0) continue;
    const a = Math.min(sm(0, .3, ph), 1 - sm(1.7, 2.3, ph)); if (a <= 0) continue;
    zh(c, n % 2 ? 'z' : 'Z', r.head[0] + 40 + ph * 40, r.head[1] - 60 - ph * 50, { size: (30 + ph * 8) * k, color: P.cap, al: a * .9, base: 'middle' }); }
}

scene({ order: 4, key: 'ending', title: '结尾', dur: S4K.end, lines: S4LINES, noFlip: true,
  fn(c, tau, L) {
    if (tau >= S4K.close0) { s4Closing(c, tau, L); return; }
    spread(c, tau);
    s4Paper(c, tau);
    s4Splash(c, tau);
    s4List(c, tau);
    s4Patchouli(c, tau, L);
    s4Cirno(c, tau, L);
  } });
