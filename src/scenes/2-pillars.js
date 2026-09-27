'use strict';
// 第 2 段：三根柱子（第二轮：每根柱子一次翻页、一种舞台；同一台机器换形态出现，见 docs/方案.md「第二轮修改」）。
//   A 书页（L0）        首帧 = 翻页落下后的书页：静止态网络 + NET.cast 站位 + 页眉。预测牌滑出，三张纸签依次钉上（注意 / 主动参与 / 错误反馈）。
//   翻页 → B 纸剧场（L1–L5，注意）
//        书页变暗，一座纸剧场从页面上立起来（台口、幕布、台板），网络缩小成舞台布景。帕秋莉站在台口左前方，琪露诺躲在右侧幕布后探头。
//        L1 台口上吊下「注意」牌，场灯暗下去，顶上的追光灯只照「眼睛」那根线；L2 一轮学习，火花只走亮线。
//        L3 琪露诺飞到台口上方当提线人：眼睛、书页两块圆牌被收走，「视频」「单词」两个提线木偶顺着线降下来，耳朵那根线收起。
//        L4 两路一起送信号，冰晶卡住；L5 单词那路越走越慢，线断了，提线也断，木偶掉到台板上，琪露诺哭。
//   合上书 → C 俯拍桌面（L6–L12，主动参与）
//        魔导书右半边翻过来合上，镜头拉起来：书躺在桌上一叠书的最上面，帕秋莉坐在上面；旁边一本摊开的课本、一张画着网络的纸，
//        网络的预测牌和现实牌变成两张真的抽认卡。L7 没有预测牌，现实卡翻开也没有误差；L8 琪露诺扛着巨大的荧光笔把课本整页涂满，
//        网络纹丝不动；L9 课本合上，琪露诺先猜（出预测卡）再翻现实卡，火花回传；L11 红笔圈差距；L12 蒙对了，也冒一个小火花。
//        用过的卡片一律滑到桌角那一叠里（不翻回去）。
//   打开书 → D 横向长镜头（L13–L15，错误反馈）
//        镜头推回魔导书，封面翻开；书的右边接着一串摊在桌上的日历页（一周后、两周后、三周后）。L13 现实牌就在旁边，火花又快又清楚；
//        L14 镜头沿日历页往右横移到「三周后」，成绩卡在那里翻开，火花往回跑，跑到一半散成雾，镜头跟着回来，预测牌已经褪色；
//        L15 马上对答案，错题旁钉一张小纸条「我当时是怎么想的」，火花重新清楚。
//   段末：卡、签、纸条、网络都收掉，两人回到 NET.cast 站位，最后 0.5 秒只剩平的 spread + 两人（第 3 段开头翻页）。
// 闪烁（第一版）的原因：每讲完一小段，现实牌在 0.35 秒里用 easeIO 翻回背面——中点正是最快的时候，浅色正面在一两帧里换成深紫背面，
//   同一帧预测牌缩回冰晶、三个输入同时一跳，所以每次换句都「闪一下」。这一版不再把状态倒回去：用过的牌滑走、换舞台时翻页或合书。
// 顶层名字一律带本段前缀 S2 / s2。
const S2LINES = seq(1.0, [
  '迪昂说，这一个公式，就装下了学习的三根支柱。',
  ['第一，注意：你选了哪些输入。', { pause: .9 }],
  ['没注意到的输入，这次就不参与更新。', { hold: 1.5 }],
  ['那我一边刷视频一边背单词，两路输入，双倍学习！', { who: 'cirno', mood: 'proud', hold: .3 }],
  ['注意力有个瓶颈。', { mood: 'annoyed' }],
  ['同时做两件动脑的事，至少有一件会被放慢，或者直接丢掉。', { hold: 1.0 }],
  ['第二，主动参与：你得先猜。', { pause: 1.9 }],
  '不出预测，就没有误差，也就学不到东西。',
  ['所以反复读、整页划线，看着勤快，脑子却一次都没猜过。', { hold: .9 }],
  ['合上书，自己考自己。先猜答案，再翻过来看。', { hold: 1.0 }],
  ['那我错了 91 分的题，岂不是赚大了！', { who: 'cirno', mood: 'happy' }],
  ['要的不是错，是差距被看见。', { mood: 'annoyed' }],
  ['就算蒙对了，只要你原本不确定，对答案时也在学。', { hold: 1.3 }],
  ['第三，错误反馈：要快，要准。', { pause: 2.3, hold: .8 }],
  ['分数往往晚好几周才发，那时你早忘了自己是怎么想的。', { hold: 1.2 }],
  ['所以做完马上对答案，错题旁边写一句：我当时是怎么想的。', { hold: 1.2 }],
]);
const S2T = i => S2LINES[i][0], S2E = i => S2LINES[i][1];
// S2W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S2W = (i, f) => { const v = voiceOf(S2LINES[i][2]), l = S2LINES[i], h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S2END = seqEnd(S2LINES), S2DUR = S2END + 2.0;

// ===================== 数 =====================
const S2REST = netRest().lines.map(l => l.w), S2REAL = netRest().real.v;
const S2FD = .8;                                                     // 冰珠从输入流进冰晶要多久
const S2TAG = mix(P.purple, P.paper, .78), S2PEN = alpha(P.ink2, .85), S2HL = alpha(mix(P.moon, '#f6e7a8', .55), .55);
const S2KRAFT = mix(P.paperEdge, P.paper, .35);
// 网络在各舞台里的摆法：网络坐标的 (CX, 470) 放到屏幕 (x, y)，缩放 s，转 r
const S2NA = { x: CX, y: 470, s: 1, r: 0 }, S2NB = { x: 985, y: 505, s: .76, r: 0 }, S2NC = { x: 1500, y: 432, s: .64, r: -.015 };
function s2In(c, T, fn) { c.save(); c.translate(T.x, T.y); c.rotate(T.r); c.scale(T.s, T.s); c.translate(-CX, -470); fn(); c.restore(); }
function s2Map(T, p) { const dx = (p[0] - CX) * T.s, dy = (p[1] - 470) * T.s, co = Math.cos(T.r), si = Math.sin(T.r); return [T.x + dx * co - dy * si, T.y + dx * si + dy * co]; }
function s2Unmap(T, p) { const dx = p[0] - T.x, dy = p[1] - T.y, co = Math.cos(-T.r), si = Math.sin(-T.r); return [CX + (dx * co - dy * si) / T.s, 470 + (dx * si + dy * co) / T.s]; }

// 一轮学习的时间表：flow 冰珠出发，flip 现实牌翻开，burst 火花炸开；down 沿线跑回去用多久
function s2Round(flow, flip, burst, o = {}) {
  const d = o.down ?? 1.0, sum = flow + S2FD;
  return { flow, sum, out: sum + .05, flip, cmp: flip + .35, sp: [burst, burst + .25, burst + .3, burst + .7, burst + .75, burst + .75 + d], ...o };
}

// ===================== 节拍（全部由台词时间算出） =====================
const S2B = (() => { const w = S2W, t = S2T, e = S2E, B = {};
  // A：三张签；翻页进 B
  B.pred0 = w(0, .3); B.tagAtt = w(0, .55); B.tagAct = w(0, .7); B.tagFb = w(0, .85);
  B.fAB = [e(0) + .1, e(0) + 1.0];
  // B：剧场立起、吊牌、追光、一轮学习
  B.rise = [B.fAB[1] + .05, B.fAB[1] + 1.05]; B.dark = [B.fAB[1], B.fAB[1] + 1.1]; B.sign = w(1, .15); B.spot = w(1, .5);
  B.r2 = s2Round(t(2) - .1, t(2) - .1 + S2FD + .55, t(2) - .1 + S2FD + 1.3);
  B.off2 = B.r2.sp[5] + .35;
  // L3 提线木偶
  B.dash = t(3); B.c1t = w(3, .12); B.a1 = B.c1t + .75; B.c2t = w(3, .34); B.a2 = B.c2t + .75;
  B.two = w(3, .68); B.proud3 = w(3, .74);
  // L4 卡住；L5 放慢、断掉
  B.jam = t(4); B.stuck = [t(4) + .6, t(4) + 1.3]; B.slow = [w(5, .38), w(5, .74)]; B.cut = w(5, .78);
  // 合上书 → 桌面
  B.close = [e(5) - .15, e(5) + .75]; B.pull = [e(5) + .75, e(5) + 1.75]; B.cin = [e(5) + 1.45, e(5) + 2.35];
  // C
  B.tagAct2 = w(6, .3); B.slot = w(6, .55);
  B.flow7 = t(7); B.flip7 = w(7, .32); B.note7 = w(7, .45); B.sweep7 = t(8) + .05;
  B.hl = [w(8, .03), w(8, .12), w(8, .56), w(8, .64)]; B.proud8 = [w(8, .56), w(8, .74)];
  B.flow8 = w(8, .62); B.dots = w(8, .82);
  B.bookShut = [w(9, .03), w(9, .2)]; B.think = [w(9, .22), w(9, .42)]; B.deal9 = [w(9, .4), w(9, .52)];
  B.r9 = s2Round(w(9, .5), w(9, .86), w(9, 1) + .05, { down: 1.2 }); B.real9 = w(9, .64);
  B.circle = w(11, .45);
  B.sweep11 = t(12) - .05; B.deal12 = [t(12) + .3, t(12) + .75];
  B.r12 = s2Round(t(12) + .4, w(12, .64), w(12, .82), { size: .7, down: .9 }); B.settle = [w(12, .5), w(12, .64)]; B.real12 = w(12, .5);
  B.sweep12 = e(12) - .35;
  // 桌面 → 打开书
  B.cout = [e(12) - .05, e(12) + .55]; B.push = [e(12) + .35, e(12) + 1.35]; B.open = [e(12) + 1.35, e(12) + 2.25];
  // D
  B.tagFb2 = t(13) + .1;
  B.r13 = s2Round(w(13, .08), w(13, .08) + S2FD + .35, w(13, .08) + S2FD + .8, { size: 1.15, down: .75 });
  B.realOut13 = t(14) + .05; B.guess14 = [t(14) + .2, t(14) + .7];
  B.pan = [w(14, .12), w(14, .4)]; B.score = w(14, .44); B.sp14 = [w(14, .5), w(14, .56), w(14, .88)];   // 炸开、出发、散完
  B.back = [w(14, .9), t(15) - .05]; B.forget = [w(14, .6), w(14, .92)];
  B.restore = t(15) + .05; B.realIn15 = [t(15) + .1, t(15) + .5];
  B.r15 = s2Round(t(15) - 1, w(15, .16), w(15, .9), { down: 1.0 }); B.note = w(15, .4); B.write = w(15, .6);
  // 段末
  B.out = S2END + .05; B.fadeNet = [S2END + .35, S2END + .95]; B.home = [S2END + .2, S2END + 1.3];
  return B; })();

// 权重：按事件切换（火花跑完那一刻换成新粗细）；换舞台（翻页、合书、开书）时换成新舞台的初值——那一刻旧的网络已经看不见
const S2WEV = (() => { const B = S2B, add = (a, d) => a.map((v, i) => v + d[i]);
  const WA = add(S2REST, [.15, 0, 0]), W9 = add(S2REST, [.12, .08, .1]), W12 = add(W9, [.04, .03, .04]), W13 = add(S2REST, [.12, -.1, .1]), W15 = add(W13, [.06, .02, .08]);
  return [[B.r2.sp[5], WA], [B.close[1], S2REST], [B.r9.sp[5], W9], [B.r12.sp[5], W12], [B.push[1], S2REST], [B.r13.sp[5], W13], [B.r15.sp[5], W15]]; })();
function s2Weights(tau) { let cur = S2REST; for (const [t, w] of S2WEV) { if (tau < t) break; cur = w; } return cur; }
const s2Dw = r => { const a = s2Weights(r.sp[5] - 1e-3), b = s2Weights(r.sp[5] + 1e-3); return b.map((v, i) => v - a[i]); };
// 火花进度 p（炸开 → 停一下 → 回冰晶 → 沿线跑）；不在时段里返回 null
function s2SparkP(tau, sp) {
  const [b0, b1, k0, k1, d0, d1] = sp; if (tau < b0 || tau >= d1) return null;
  return tau < k0 ? .15 * sm(b0, b1, tau, x => x) : tau < d0 ? lerp(.15, .4, sm(k0, k1, tau, x => x)) : lerp(.4, 1, sm(d0, d1, tau, easeSine));
}
const s2Run = (tau, a, d) => tau > a && tau < a + d ? (tau - a) / d : null;
const s2Pulse = (tau, hits) => Math.max(0, ...hits.map(h => s2Run(tau, h, .45) ?? 0));
const s2Flow = (tau, starts) => { const f = starts.map(s => s2Run(tau, s, S2FD)).find(v => v != null); return f ?? null; };
const s2Win = (tau, a, b, d = .4) => sm(a, a + d, tau, easeSine) * (1 - sm(b, b + d, tau, easeSine));
// 一轮学习里网络要的 spark / cmp
function s2SparkOf(tau, rounds) {
  for (const r of rounds) { const p = s2SparkP(tau, r.sp); if (p == null) continue;
    return { p, dw: r.fog ? [0, 0, 0] : s2Dw(r), fog: r.fog || 0, size: r.size ?? 1, ...(r.lines ? { lines: r.lines } : {}) }; }
  return null;
}

// ===================== 通用小画具 =====================
// 纸签：左端剪成尖角，尖角里钉一颗铜钉。t0 落下钉上，t1 拔起飘走
function s2Tag(c, tau, x, y, text, t0, t1, o = {}) {
  const u = sm(t0, t0 + .35, tau, easeOut), gone = sm(t1, t1 + .4, tau); if (u <= 0 || gone >= 1) return;
  const sz = o.size || 32, ic = o.spark ? 30 : 0, tw = zhWidth(c, text, sz), w = tw + 52 + ic, h = sz + 22, rot = (o.rot ?? -.04) + (1 - u) * .22 - gone * .12;
  c.save(); c.globalAlpha *= Math.min(1, u * 2) * (1 - gone);
  c.translate(x, y - 30 * (1 - u) - 24 * gone); c.rotate(rot);
  cutPaper(c, [[-w / 2, 0], [-w / 2 + 20, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2 + 20, h / 2]], o.color || S2TAG, { seed: o.seed || 3700, step: 14, blur: 5 });
  if (o.spark) netSparkPiece(c, -w / 2 + 44, 0, 13, .3, 1, (o.seed || 3700) + 3);
  zh(c, text, -w / 2 + 32 + ic + tw / 2, sz * .34, { size: sz, color: P.ink, align: 'center' });
  const pk = sm(t0 + .2, t0 + .45, tau, easeOutBack); if (pk > 0) pop(c, -w / 2 + 16, 0, pk, () => brassPin(c, -w / 2 + 16, 0, 8));
  c.restore();
}
// 输入圆牌（照 net.js 的 netToken 画法抄的，给提线木偶用）：中心 (x, y)，网络坐标
function s2Token(c, x, y, kind, s = 1, o = {}) {
  if (s <= .01) return; const R = NET.inR;
  c.save(); c.globalAlpha *= o.al ?? 1; c.translate(x, y); c.rotate(o.rot || 0); c.scale(s, s);
  cutPaper(c, circPts(0, 0, R, 30), NET.col.tok, { seed: 3790 + (kind === 'word' ? 1 : 0), step: 10, blur: 5 });
  rline(c, circPts(0, 0, R - 7, 30), { w: 1.5, color: alpha(P.ink2, .35), close: true, seed: 3792 });
  netIcon(c, kind, 3794);
  if (o.pulse > 0) rline(c, circPts(0, 0, R + 6 + 18 * o.pulse, 30), { w: 3, color: P.ink2, close: true, seed: 3448, al: 1 - o.pulse });
  zh(c, NET.names[kind], 0, R + 34, { size: 28, color: o.label || P.ink2, align: 'center' });
  c.restore();
}
// 抽认卡 / 成绩卡（照 net.js 的牌画法抄的）：网络坐标 (x, y)，flip 0 背面 → 1 正面
const S2TUBE = { dx: -20, top: 70, bot: 26, hw: 15 };
function s2Card(c, which, o) {
  const { x, y, rot = 0, s = 1, flip = 1, v = .5, al = 1, lift: lf = 0, title } = o; if (s <= .01 || al <= 0) return;
  const w = NET.pred.w, h = NET.pred.h, sx = Math.abs(Math.cos(flip * Math.PI)), lift = Math.sin(flip * Math.PI) * 22 + lf, front = flip >= .5;
  c.save(); c.globalAlpha *= al; c.translate(x, y - lift); c.rotate(rot); c.scale(s * Math.max(.02, sx), s);
  cutPaper(c, rectPts(-w / 2, -h / 2, w, h, 6), front ? NET.col.card : NET.col.back, { seed: which === 'pred' ? 3480 : 3481, step: 22, blur: 6 + lift * .4, sy: 4 + lift * .3 });
  if (front) {
    zh(c, title || (which === 'pred' ? '预测' : '现实'), 0, -h / 2 + 44, { size: 32, color: which === 'pred' ? P.ink2 : P.ink, align: 'center' });
    const T = S2TUBE, top = -h / 2 + T.top, bot = h / 2 - T.bot, lv = top + (1 - clamp(v, 0, 1)) * (bot - top);
    c.fillStyle = NET.col.water; c.fillRect(T.dx - T.hw + 2, lv, T.hw * 2 - 4, bot - lv);
    c.fillStyle = alpha('#ffffff', .35); c.fillRect(T.dx - T.hw + 4, lv + 2, 4, Math.max(0, bot - lv - 6));
    rline(c, [[T.dx - T.hw, top], [T.dx - T.hw, bot], [T.dx + T.hw, bot], [T.dx + T.hw, top]], { w: 2.6, color: P.ink2, seed: which === 'pred' ? 3485 : 3486, amp: .4 });
    for (let k = 1; k < 5; k++) { const yy = lerp(bot, top, k / 5); rline(c, [[T.dx + T.hw + 4, yy], [T.dx + T.hw + (k % 2 ? 12 : 20), yy]], { w: 2, color: alpha(P.ink2, .55), seed: 3487 + k, amp: .2 }); }
  } else {
    rline(c, rectPts(-w / 2 + 11, -h / 2 + 11, w - 22, h - 22, 4), { w: 2, color: alpha(P.moon, .6), close: true, seed: 3483 });
    drawMoonIcon(c, 0, -h / 2 + 40, 13, alpha(P.moon, .8), -.5);
    zh(c, '？', 0, 38, { size: 96, color: alpha(P.cap, .85), align: 'center' });
  }
  c.restore();
}
// 荧光笔：剪纸笔杆 + 笔帽，笔尖在 (x, y)，笔杆朝 ang 方向伸出去
function s2Marker(c, x, y, ang, s = 1) {
  if (s <= .02) return;
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  cutPaper(c, [[0, 0], [16, -9], [16, 9]], mix(P.moon, '#e8c870', .4), { seed: 3720, step: 6, blur: 3, grain: 0 });
  cutPaper(c, rectPts(15, -14, 70, 28, 5), '#f1ece0', { seed: 3721, step: 12, blur: 5 });
  cutPaper(c, rectPts(78, -15, 28, 30, 6), mix(P.moon, P.ink, .12), { seed: 3722, step: 8, blur: 3 });
  rline(c, [[28, 0], [70, 0]], { w: 2, color: alpha(P.ink2, .4), seed: 3723, amp: .3 });
  zh(c, 'HL', 50, 8, { size: 18, color: alpha(P.ink2, .6), align: 'center' });
  c.restore();
}
function s2Arc(a, b, u, up = 240) {
  const m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - up], v = 1 - u;
  return [v * v * a[0] + 2 * v * u * m[0] + u * u * b[0], v * v * a[1] + 2 * v * u * m[1] + u * u * b[1]];
}
function s2Hull(pts) {
  const q = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of q) { while (lo.length >= 2 && cr(lo.at(-2), lo.at(-1), p) <= 0) lo.pop(); lo.push(p); }
  for (const p of q.reverse()) { while (up.length >= 2 && cr(up.at(-2), up.at(-1), p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// 角色：统一在这里画（嘴型、眨眼、t）
function s2Pch(c, tau, L, o) { return drawPatchouli(c, { h: 500, facing: 1, pose: 'lecture', gesture: .35, mood: moodOf(L, 'patchouli'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau, ...o }); }
function s2Cir(c, tau, L, o) { return drawCirno(c, { h: 440, facing: -1, pose: 'stand', gesture: .6, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau, ...o, mood: L.who === 'cirno' ? moodOf(L, 'cirno') : (o.mood || 'normal') }); }

// 摊开的魔导书（spread）不随时间变：按画面缩放缓存成一张图，每帧只贴图
// 同样缓存的还有：空桌面、合着的魔导书（书脊在右边）
const S2IMG = {};
function s2Img(c, key, draw) {
  const sc = c.getTransform().a || 1, e = S2IMG[key];
  if (!e || e.sc !== sc) { const cv = document.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc); const g = cv.getContext('2d'); g.setTransform(sc, 0, 0, sc, 0, 0); draw(g); S2IMG[key] = { sc, cv }; }
  c.drawImage(S2IMG[key].cv, 0, 0, W, H);
}
const s2Spread = c => s2Img(c, 'spread', g => spread(g, 0));

// ===================== A：书页（L0） =====================
function s2NetA(tau) {
  const B = S2B, o = netRest();
  o.lines.forEach((l, i) => { l.pulse = s2Pulse(tau, [B.tagAtt + i * .1]); });
  const k = sm(B.pred0, B.pred0 + .45, tau, easeOut); if (k > 0) o.pred = { v: .45, k };
  return o;
}
function s2StageA(c, tau, L, chars = true) {
  const B = S2B;
  s2Spread(c);
  pageHeader(c, '第二页 · 三根柱子', tau, .2);
  netDraw(c, s2NetA(tau), tau);
  s2Tag(c, tau, 612, 150, '注意', B.tagAtt, 1e9, { seed: 3750 });
  s2Tag(c, tau, 1160, 318, '主动参与', B.tagAct, 1e9, { seed: 3752, rot: .03 });
  s2Tag(c, tau, 1258, 676, '错误反馈', B.tagFb, 1e9, { seed: 3754, spark: true, rot: -.02 });
  const fa = sm(B.tagFb + .3, B.tagFb + .7, tau, x => x);
  if (fa > 0) arrow(c, [1258, 640], [1256, 560], { w: 2.4, color: S2PEN, head: 12, seed: 3756, p: fa });
  if (!chars) return;
  const pt = tau > w0(0, .5) && tau < S2E(0);
  s2Pch(c, tau, L, { ...NET.cast.pch, ...(pt ? { pose: 'point', gesture: .7 } : {}) });
  s2Cir(c, tau, L, { ...NET.cast.cir });
}
const w0 = S2W;

// ===================== B：纸剧场（L1–L5） =====================
const S2TH = { ox0: 250, ox1: 1670, oy0: 96, oy1: 900, ix0: 330, ix1: 1590, iy0: 176, iy1: 860, floor: 800, fold: 885, lamp: [735, 150] };
const S2THC = { frame: mix(P.ink, P.purple, .3), curtain: mix(P.red, P.ink, .38), curtainHi: mix(P.red, P.paper, .15), back: mix(BOOK.page, P.night, .42), floor: mix(S2KRAFT, P.ink, .25) };
function s2DarkPages(c, a = 1) {
  for (const [pg, side] of [[BOOK.L, -1], [BOOK.R, 1]]) {
    c.save(); c.globalAlpha *= a; c.fillStyle = mix(P.night2, P.purple, .12); c.fillRect(pg.x, pg.y, pg.w, pg.h);
    const gx = side < 0 ? pg.x + pg.w : pg.x, g = c.createLinearGradient(gx, 0, gx + side * 150, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(pg.x, pg.y, pg.w, pg.h);
    c.restore();
  }
  grain(c, polyPath(rectPts(BOOK.L.x, BOOK.L.y, BOOK.R.x + BOOK.R.w - BOOK.L.x, BOOK.L.h)), .06 * a);
}
function s2TheaterBack(c) {
  const T = S2TH;
  cutPaper(c, rectPts(T.ix0, T.iy0, T.ix1 - T.ix0, T.floor - T.iy0 + 20), S2THC.back, { seed: 3800, step: 60, shadow: false, grain: .1, edge: false });
  // 背景幕上几颗剪出来的星（布景）
  for (let k = 0; k < 9; k++) { const x = T.ix0 + 120 + hash(k, 381) * (T.ix1 - T.ix0 - 240), y = T.iy0 + 80 + hash(k, 382) * 120; c.fillStyle = alpha(P.moon, .35); c.fill(polyPath(starPts(x, y, 6 + 5 * hash(k, 383), 4, .35))); }
  // 台板
  const fl = [[T.ix0 - 30, T.floor], [T.ix1 + 30, T.floor], [T.ox1, T.fold], [T.ox0, T.fold]];
  cutPaper(c, fl, S2THC.floor, { seed: 3801, step: 30, blur: 6, sy: 3 });
  for (let k = 1; k < 7; k++) { const u = k / 7; rline(c, [[lerp(T.ix0 - 30, T.ox0, 0) + u * (T.ix1 - T.ix0 + 60), T.floor + 2], [T.ox0 + u * (T.ox1 - T.ox0), T.fold - 2]], { w: 1.4, color: alpha(P.ink, .3), seed: 3802 + k, amp: .3 }); }
}
function s2TheaterFront(c) {
  const T = S2TH, fr = S2THC.frame;
  // 幕布：两侧收起来的布，腰上系住
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? T.ix0 : T.ix1, dir = -side, sw = 0;
    const pts = [[x0, T.iy0], [x0 + dir * 170, T.iy0], [x0 + dir * 95 + sw, 420], [x0 + dir * 62, 520], [x0 + dir * 92 + sw, 650], [x0 + dir * 140, T.floor + 10], [x0, T.floor + 10]];
    cutPaper(c, pts, S2THC.curtain, { seed: 3810 + side, step: 16, blur: 10, sx: dir * 4, sy: 4, smooth: true });
    for (let k = 1; k < 4; k++) rline(c, [[x0 + dir * 40 * k, T.iy0 + 10], [x0 + dir * (18 + 12 * k), 520], [x0 + dir * (30 * k + 6), T.floor]], { w: 2, color: alpha(P.ink, .28), seed: 3813 + k * 2 + side, smooth: true, amp: .5 });
    cutPaper(c, rectPts(x0 + dir * 62 - 12, 508, 24, 26, 5), P.moon, { seed: 3818 + side, step: 6, blur: 3 });
  }
  // 顶上的幔（波浪边）
  const val = [[T.ix0, T.iy0 - 4], [T.ix1, T.iy0 - 4]]; for (let x = T.ix1; x >= T.ix0; x -= 6) { const u = ((x - T.ix0) / 105) % 1; val.push([x, T.iy0 + 48 + Math.sin(u * Math.PI) * 22]); }
  cutPaper(c, val, S2THC.curtain, { seed: 3820, step: 10, blur: 8, sy: 5 });
  rline(c, val.slice(2).map(([x, y]) => [x, y - 10]), { w: 2, color: alpha(P.moon, .5), seed: 3821, amp: .4 });
  // 台口框（中间镂空）
  const outer = rectPts(T.ox0, T.oy0, T.ox1 - T.ox0, T.oy1 - T.oy0, 8), inner = [];
  for (let k = 0; k <= 24; k++) { const a = Math.PI + k / 24 * Math.PI; inner.push([CX + Math.cos(a) * (T.ix1 - T.ix0) / 2, T.iy0 + 60 + Math.sin(a) * 60]); }
  inner.push([T.ix1, T.oy1], [T.ix0, T.oy1]);
  const path = new Path2D(); path.addPath(polyPath(scissor(outer, 3830, 30))); path.addPath(polyPath(scissor(inner.slice().reverse(), 3831, 20)));
  c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = fr; c.fill(path, 'evenodd'); c.restore();
  grain(c, path, .12);
  rline(c, inner.slice(0, 25).map(([x, y]) => [x, y - 14]), { w: 2.4, color: alpha(P.moon, .6), seed: 3832, amp: .4 });
  rline(c, rectPts(T.ox0 + 16, T.oy0 + 16, T.ox1 - T.ox0 - 32, T.oy1 - T.oy0 - 32, 6), { w: 1.6, color: alpha(P.moon, .4), close: true, seed: 3833, amp: .5 });
  drawMoonIcon(c, CX, T.oy0 + 38, 18, P.moon, -.5);
  // 顶上的追光灯（铜皮罐子，朝眼睛那根线歪着）
  const [lx, ly] = T.lamp, ang = Math.atan2(s2Map(S2NB, netTok(0))[1] - ly, s2Map(S2NB, netTok(0))[0] - lx);
  spin(c, lx, ly, ang - Math.PI / 2, () => { cutPaper(c, [[lx - 20, ly - 26], [lx + 20, ly - 26], [lx + 28, ly + 22], [lx - 28, ly + 22]], mix(P.moon, P.ink, .35), { seed: 3835, step: 8, blur: 4 });
    c.fillStyle = alpha('#fff4d6', .9); c.fill(polyPath(ellPts(lx, ly + 22, 26, 7, 16))); });
}
// 剧场的布景不随时间变：按画面缩放缓存成两张图（后景、台口），每帧只贴图
const S2THBUF = { sc: 0, back: null, front: null };
function s2Theater(c, part) {
  const sc = c.getTransform().a || 1;
  if (S2THBUF.sc !== sc) { for (const k of ['back', 'front']) { const cv = document.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
      const g = cv.getContext('2d'); g.setTransform(sc, 0, 0, sc, 0, 0); k === 'back' ? s2TheaterBack(g) : s2TheaterFront(g); S2THBUF[k] = cv; } S2THBUF.sc = sc; }
  c.drawImage(S2THBUF[part], 0, 0, W, H);
}
// 场灯暗下去：台口里盖一层暗色，光锥那一块挖掉；光锥里铺一层暖色硫酸纸
function s2Spot(c, k, target, cards = 0) {
  if (k <= 0) return;
  const T = S2TH, [lx, ly] = T.lamp, [tx, ty] = target, pts = [[lx - 22, ly + 20], [lx + 22, ly + 20]];
  for (let j = 0; j < 28; j++) { const a = j / 28 * TAU; pts.push([tx + Math.cos(a) * 125, ty + 20 + Math.sin(a) * 92]); }
  const cone = s2Hull(pts), p = new Path2D(); p.addPath(polyPath(rectPts(T.ix0, T.iy0, T.ix1 - T.ix0, T.floor - T.iy0 + 20))); p.addPath(polyPath(cone));
  const cc = s2Map(S2NB, [(NET.pred.x + NET.real.x) / 2, NET.pred.y + 10]), cr = ellPts(cc[0], cc[1], (NET.real.x - NET.pred.x + 260) * S2NB.s / 2, 190 * S2NB.s, 40);
  p.addPath(polyPath(cr));
  c.save(); c.globalAlpha *= .66 * k; c.fillStyle = P.night; c.fill(p, 'evenodd'); c.restore();
  c.save(); c.globalAlpha *= lerp(.66, .22, cards) * k; c.fillStyle = P.night; c.fill(polyPath(cr)); c.restore();   // 两张牌那里留一盏弱一点的灯
  c.save(); c.globalAlpha *= .22 * k; c.fillStyle = '#fff1c8'; c.fill(polyPath(cone)); c.restore();
}
function s2NetB(tau) {
  const B = S2B, o = netRest(), wt = s2Weights(tau);
  const flows = [[B.r2.flow, B.two, B.jam], [B.r2.flow], [B.r2.flow, B.two, B.jam]];
  for (let t = B.jam + .9; t < B.close[0]; t += .9) flows[0].push(t);       // 视频一直在放
  o.lines.forEach((l, i) => { l.w = wt[i]; l.pulse = s2Pulse(tau, flows[i]); l.flow = s2Flow(tau, flows[i]); });
  // 追光：线自己也压暗（在 on 上乘）
  const sk = s2Win(tau, B.spot, B.dash, .5);
  o.lines[1].on = o.lines[2].on = 1 - .7 * sk;
  // L3：眼睛、书页两块牌收走（提线木偶自己画），耳朵那根线收起
  o.lines[0].kind = tau < B.c1t + .15 ? 'eye' : 'video'; o.lines[2].kind = tau < B.c2t + .15 ? 'page' : 'word';
  o.lines[0].k = tau < B.c1t + .15 ? 1 - sm(B.c1t - .15, B.c1t + .15, tau) : 0;
  o.lines[2].k = tau < B.c2t + .15 ? 1 - sm(B.c2t - .15, B.c2t + .15, tau) : 0;
  const ear = 1 - sm(B.a1 + .1, B.a1 + .6, tau); o.lines[1].grow = ear; o.lines[1].k = ear;
  if (tau >= B.slow[0]) o.lines[2].flow = tau < B.cut + .4 ? .1 + .38 * sm(B.slow[0], B.slow[1], tau, x => Math.sqrt(x)) : null;
  if (tau >= B.cut) { o.lines[2].cut = sm(B.cut, B.cut + .6, tau); o.lines[2].flow = tau < B.cut + .15 ? o.lines[2].flow : null; }
  o.node = { pulse: s2Pulse(tau, [B.r2.sum, B.two + S2FD, B.jam + S2FD]), stuck: sm(B.stuck[0], B.stuck[1], tau) };
  // 一轮学习（只走亮线）
  const r = B.r2, kP = sm(r.out, r.out + .45, tau, easeOut) * (1 - sm(B.off2, B.off2 + .7, tau, easeSine));
  if (kP > 0) o.pred = { v: .45, k: kP };
  const kR = sm(B.rise[1] - .2, B.rise[1] + .3, tau) * (1 - sm(B.off2, B.off2 + .7, tau, easeSine));
  o.real = kR > 0 ? { v: S2REAL, flip: sm(r.flip, r.flip + .45, tau, easeSine), k: kR } : null;
  o.cmp = sm(r.cmp, r.cmp + .4, tau) * (1 - sm(B.off2 - .2, B.off2 + .2, tau));
  o.spark = s2SparkOf(tau, [{ ...r, lines: [0] }]);
  return o;
}
// 提线木偶的圆牌此刻在哪（网络坐标）：从台口上方顺着线降下来；单词那块线断后掉到台板上
function s2Puppet(tau, i) {
  const B = S2B, [t0, a] = i === 0 ? [B.c1t + .1, B.a1] : [B.c2t + .1, B.a2], home = netTok(i);
  if (tau < t0) return null;
  const u = sm(t0, a, tau, easeOut), bob = tau > a ? Math.sin((tau - a) * 5 + i) * 5 * (i === 2 && tau > B.cut ? 0 : 1) : 0;
  let x = home[0], y = lerp(-120, home[1], u) + bob, rot = (1 - u) * .3 * (i ? -1 : 1);
  if (i === 2 && tau > B.cut + .1) { const f = sm(B.cut + .1, B.cut + .6, tau, easeIn), fl = s2Unmap(S2NB, [0, S2TH.floor + 10])[1] - NET.inR;
    y = lerp(home[1], fl, f); x += 40 * f; rot = 1.2 * f + (f >= 1 ? .06 * Math.sin((tau - B.cut) * 9) * Math.exp(-(tau - B.cut - .6) * 5) : 0); }
  return { x, y, rot };
}
function s2StageB(c, tau, L, chars = true) {
  const B = S2B, T = S2TH, rise = sm(B.rise[0], B.rise[1], tau, easeOutBack);
  s2Spread(c); s2DarkPages(c, sm(B.dark[0], B.dark[1], tau));
  // 帕秋莉讲到哪儿就伸手指着
  const pts = [[w0(1, .45), B.r2.sp[5]], [B.cut - .3, B.close[0] - .35]], pointing = pts.some(([a, b]) => tau > a && tau < b);
  const pch = () => s2Pch(c, tau, L, { x: 470, y: 885, h: 410, pose: pointing ? 'point' : 'lecture', gesture: pointing ? .75 : .4 });
  // 琪露诺：幕后探头 → 飞到台口上方当提线人
  const cirWing = [1512, 885], cirTop = [1250, 545], fly = sm(B.dash, B.dash + .8, tau, easeIO);
  const cirPos = fly <= 0 ? cirWing : fly >= 1 ? s2CirTop(tau) : s2Arc(cirWing, cirTop, fly, 120);
  let cMood = 'normal';
  if (tau > B.cut) cMood = 'cry'; else if (tau > B.stuck[0]) cMood = 'surprised'; else if (tau < B.dash && tau > B.spot) cMood = 'confused';
  const cir = () => s2Cir(c, tau, L, { x: cirPos[0], y: cirPos[1], h: fly > 0 ? 370 : 390, pose: fly > 0 ? 'fly' : 'stand', facing: fly > 0 && fly < 1 ? -1 : -1, mood: cMood,
    ...(tau > B.proud3 && tau < S2E(3) ? { pose: 'fly', gesture: .9 } : {}) });
  popup(c, T.fold, rise, () => {
    s2Theater(c, 'back');
    s2In(c, S2NB, () => netDraw(c, s2NetB(tau), tau));
    // 提线木偶
    for (const i of [0, 2]) { const p = s2Puppet(tau, i); if (!p) continue;
      s2In(c, S2NB, () => s2Token(c, p.x, p.y, i ? 'word' : 'video', 1, { rot: p.rot, pulse: s2Pulse(tau, i ? [B.a2, B.two, B.jam] : [B.a1, B.two, B.jam]), label: P.ink2 })); }
    s2Spot(c, s2Win(tau, B.spot, B.dash, .5), s2Map(S2NB, netTok(0)), 1 - sm(B.off2, B.off2 + .7, tau, easeSine));
    // 「注意」吊牌：从幔上垂下来
    const sk = sm(B.sign, B.sign + .5, tau, easeOutBack) * (1 - sm(B.dash, B.dash + .4, tau));
    if (sk > .001) { const x = 1330, y = lerp(60, 300, sk), sw = Math.sin((tau - B.sign) * 4) * .05 * Math.exp(-(tau - B.sign) * 1.5);
      rline(c, [[x - 50, T.iy0 + 40], [x - 50, y - 30]], { w: 1.6, color: alpha(P.moon, .7), seed: 3840, amp: .2 }); rline(c, [[x + 50, T.iy0 + 40], [x + 50, y - 30]], { w: 1.6, color: alpha(P.moon, .7), seed: 3841, amp: .2 });
      spin(c, x, y - 30, sw, () => { cutPaper(c, rectPts(x - 80, y - 34, 160, 70, 6), S2KRAFT, { seed: 3842, step: 14, blur: 8, sy: 4 }); zh(c, '注意', x, y + 14, { size: 44, color: P.ink, align: 'center' }); }); }
    if (chars && fly <= 0) cir();                      // 在幕后：幕布挡住一半
    s2Theater(c, 'front');
    if (chars) pch();                                  // 两个人也是贴在这一页上的剪纸，跟着剧场一起立起来
  });
  if (!chars) return;
  if (fly > 0) { const h = cir();
    // 两根提线：从两只手连到两块木偶牌顶上
    for (const i of [0, 2]) { const p = s2Puppet(tau, i); if (!p || !h) continue; const top = s2Map(S2NB, [p.x, p.y - NET.inR]), hand = h.hands[i ? 0 : 1];
      const snap = i === 2 ? sm(B.cut, B.cut + .15, tau) : 0;
      if (snap < 1) rline(c, [hand, [lerp(hand[0], top[0], .5), lerp(hand[1], top[1], .5) + 10], top], { w: 1.8, color: alpha('#eadfca', .9), seed: 3845 + i, amp: .3, smooth: true, p: 1 - snap });
      else rline(c, [hand, [hand[0] - 10, hand[1] + 60 + 30 * sm(B.cut, B.cut + .6, tau)]], { w: 1.8, color: alpha('#eadfca', .9), seed: 3847, amp: .3 }); } }
}

// 琪露诺在台口上方悬着（飞到之后才开始上下飘，飘的幅度慢慢加上去）
function s2CirTop(tau) { const a = sm(S2B.dash + .8, S2B.dash + 1.6, tau); return [1250 + 8 * Math.sin(tau * 1.6) * a, 545 + 10 * Math.sin(tau * 2.1) * a]; }

// ===================== 合书 / 开书（B → C、C → D） =====================
const S2BUF = document.createElement('canvas');
function s2Buf(c, fn) {
  const sc = c.getTransform().a || 1; if (S2BUF.width !== Math.round(W * sc)) { S2BUF.width = Math.round(W * sc); S2BUF.height = Math.round(H * sc); }
  const b = S2BUF.getContext('2d'); b.setTransform(sc, 0, 0, sc, 0, 0); b.clearRect(0, 0, W, H); fn(b); return sc;
}
// 把 fn 画的书页（不含人物）画进缓冲，再按合书进度 u 画：右半边绕书脊翻到左边，过了一半露出书皮；u = 1 时只剩左半边一本合着的书
function s2Fold(c, u, fn) {
  const sc = s2Buf(c, fn);
  desk(c);
  const e = easeIO(clamp(u, 0, 1)), bw = BOOK.x + BOOK.w + 10 - CX, cw = bw * Math.cos(e * Math.PI), lift = Math.sin(e * Math.PI);
  c.drawImage(S2BUF, 0, 0, CX * sc, H * sc, 0, 0, CX, H);
  if (Math.abs(cw) < 2) return;
  c.save(); c.globalAlpha *= .35 * lift; c.fillStyle = '#140c08'; c.fillRect(Math.min(CX, CX + cw) + 20, BOOK.y + 20, Math.abs(cw), BOOK.h); c.restore();   // 翻起来的那半边在桌上的影子
  if (cw > 0) {
    c.drawImage(S2BUF, CX * sc, 0, bw * sc, H * sc, CX, -lift * 30, cw, H + lift * 60);
    c.save(); c.globalAlpha *= .4 * lift; c.fillStyle = '#2a1a10'; c.fillRect(CX, BOOK.y - lift * 30, cw, BOOK.h + lift * 60); c.restore();
  } else {
    c.save(); c.translate(CX, 0); c.scale(-Math.abs(cw) / bw, 1); c.translate(-(BOOK.x - 10), 0);
    grimoireCover(c, BOOK.x - 10, bw, { clasp: null }); c.restore();
    c.save(); c.globalAlpha *= .35 * lift; c.fillStyle = '#000'; c.fillRect(CX + cw, BOOK.y, -cw, BOOK.h); c.restore();
  }
}
// 合着的魔导书（书脊在右边，和 s2Fold u = 1 时一样）
function s2Closed(c) { const bw = BOOK.x + BOOK.w + 10 - CX; c.save(); c.translate(CX, 0); c.scale(-1, 1); c.translate(-(BOOK.x - 10), 0); grimoireCover(c, BOOK.x - 10, bw, { clasp: null }); c.restore(); }

// ===================== C：俯拍桌面（L6–L12） =====================
// 桌面上合着的魔导书放在 S2RF（屏幕矩形）；镜头 s2CamC(u)：u = 0 时这本书正好盖满左半边（刚合上），u = 1 时就是桌面的正常画面
const S2BW = BOOK.x + BOOK.w + 10 - CX, S2RF = { x: 80, y: 470, w: 360 }, S2RK = S2RF.w / S2BW;
function s2CamC(c, u) {
  const e = easeIO(clamp(u, 0, 1)), s0 = 1 / S2RK, s = Math.exp(lerp(Math.log(s0), 0, e)), g = (1 / s - S2RK) / (1 - S2RK);
  const bx = lerp(BOOK.x - 10, S2RF.x, g), by = lerp(BOOK.y - 8, S2RF.y, g);
  c.translate(bx, by); c.scale(s, s); c.translate(-S2RF.x, -S2RF.y);
}
function s2DeskWide(c) {   // 比画面大的桌面（镜头拉近推远时不露边）
  const T = c.getTransform(), iv = T.inverse(), sc = T.a, p0 = iv.transformPoint({ x: 0, y: 0 }), p1 = iv.transformPoint({ x: W * sc, y: H * sc });   // 只铺看得见的那一块
  const x0 = Math.min(p0.x, p1.x) - 4, y0 = Math.min(p0.y, p1.y) - 4, ww = Math.abs(p1.x - p0.x) + 8, hh = Math.abs(p1.y - p0.y) + 8;
  c.fillStyle = WOOD; c.fillRect(x0, y0, ww, hh);
  c.save(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let k = -12; k < 26; k++) { const y = 30 + k * 78 + Math.sin(k * 1.7) * 12; if (y < y0 - 20 || y > y0 + hh + 20) continue; c.beginPath(); c.moveTo(x0, y); c.bezierCurveTo(W * .3, y + 10, W * .6, y - 12, x0 + ww, y + 6); c.stroke(); } c.restore();
  grain(c, polyPath(rectPts(x0, y0, ww, hh)), .1);
}
const S2TB = { x: 490, y: 190, w: 620, h: 500 };          // 课本（摊开）
const S2SHEET = [[1150, 150], [1862, 132], [1868, 728], [1156, 742]];
const S2PILE = [1790, 850];                                // 桌角那叠用过的卡（屏幕）
// 课本：shut 0 摊开 → 1 右半边合上；hl 荧光笔涂到第几行（小数）
const S2TBL = (() => { const o = []; for (const side of [0, 1]) for (let k = 0; k < 8; k++) { const x0 = S2TB.x + (side ? S2TB.w / 2 + 34 : 34), y = S2TB.y + 96 + k * 46, len = (S2TB.w / 2 - 72) * (k === 7 ? .55 : .8 + .2 * hash(k + side * 8, 391));
  o.push([[x0, y], [x0 + len, y]]); } return o; })();
function s2Textbook(c, tau, shut, hl) {
  const { x, y, w, h } = S2TB, sp = x + w / 2, board = mix(P.green, P.ink, .3), page = '#f4efe3';
  cutPaper(c, rectPts(x - 12, y - 10, shut > .5 ? w / 2 + 12 : w + 24, h + 20, 6), board, { seed: 3850, step: 30, blur: 10, sy: 5 });
  const pageL = () => { cutPaper(c, rectPts(x, y, w / 2, h, 3), page, { seed: 3851, step: 40, shadow: false });
    zh(c, '第 3 章', x + 34, y + 58, { size: 30, color: P.ink2 }); };
  const pageR = () => { cutPaper(c, rectPts(sp, y, w / 2, h, 3), page, { seed: 3852, step: 40, shadow: false }); };
  pageL();
  const lines = (from, to) => { for (let k = from; k < to; k++) rline(c, S2TBL[k], { w: 3, color: alpha(P.ink2, .45), seed: 3853 + k, amp: .4 }); };
  lines(0, 8);
  const hlk = (from, to) => { c.save(); c.globalCompositeOperation = 'multiply'; for (let k = from; k < to; k++) { const p = clamp(hl - k, 0, 1); if (p > 0) rline(c, S2TBL[k], { w: 30, color: S2HL, seed: 3870 + k, amp: 1.2, p }); } c.restore(); };
  hlk(0, 8);
  const e = easeIO(clamp(shut, 0, 1)), cw = (w / 2) * Math.cos(e * Math.PI);
  if (cw > 1) { c.save(); c.translate(sp, 0); c.scale(cw / (w / 2), 1); c.translate(-sp, 0); pageR(); lines(8, 16); hlk(8, 16); c.restore(); }
  else if (cw < -1) { c.save(); c.translate(sp, 0); c.scale(cw / (w / 2), 1); c.translate(-sp, 0);
    cutPaper(c, rectPts(sp, y - 10, w / 2 + 12, h + 20, 6), board, { seed: 3854, step: 30, blur: 10, sy: 5 });
    c.restore();
    if (e > .95) { rline(c, rectPts(x + 16, y + 10, w / 2 - 34, h - 20, 4), { w: 2, color: alpha(P.moon, .5), close: true, seed: 3855 }); zh(c, '课本', x + w / 4, y + h / 2 + 14, { size: 48, color: alpha(P.cap, .9), align: 'center' }); } }
  rline(c, [[sp, y + 4], [sp, y + h - 4]], { w: 2, color: alpha(P.ink, .3), seed: 3856 });
}
function s2HlHead(tau) {   // 荧光笔此刻涂到哪一行的哪一点
  const B = S2B, hl = 16 * sm(B.hl[1], B.hl[2], tau, x => x), k = Math.min(15, Math.floor(hl)), p = hl - k, [a, b] = S2TBL[k];
  return { hl, pt: [lerp(a[0], b[0], p), a[1]] };
}
// 桌面上的卡：一张卡的一生 = 出现（发牌 / 滑进来）→ 放在网络坐标的牌位 → 翻开 → 扫到桌角那叠里
function s2CardAt(tau, cd) {
  // 返回网络坐标里的 { x, y, rot, s, flip, al } 或 null
  const [bx, by] = [NET[cd.which].x, NET[cd.which].y], rot0 = cd.which === 'pred' ? -.03 : .035;
  if (tau < cd.in[0]) return null;
  let x = bx, y = by, rot = rot0, s = 1, al = 1, lf = 0;
  const u = sm(cd.in[0], cd.in[1], tau, easeOut);
  if (cd.from === 'hand') { const h = s2Unmap(S2NC, cd.hand), q = s2Arc(h, [bx, by], u, 160); x = q[0]; y = q[1]; rot = lerp(-.6, rot0, u); s = lerp(.45, 1, u); lf = Math.sin(u * Math.PI) * 30; }
  else if (cd.from === 'right') { x = lerp(bx + 260, bx, u); al = sm(0, .5, u); }
  else al = u;
  const flip = cd.flip == null ? 1 : sm(cd.flip, cd.flip + .45, tau, easeSine);
  if (cd.sweep != null && tau > cd.sweep) { const pl = s2Unmap(S2NC, S2PILE), v = sm(cd.sweep, cd.sweep + .65, tau, easeSine), j = cd.pile || 0;
    x = lerp(x, pl[0] + j * 10, v); y = lerp(y, pl[1] - j * 6, v); rot = lerp(rot, .5 + j * .25, v); s = lerp(s, .7, v); lf += Math.sin(v * Math.PI) * 20; }
  return { x, y, rot, s, flip, al, lift: lf };
}
const S2CARDS = (() => { const B = S2B, hand = [1060, 560];
  return [
    { which: 'real', v: S2REAL, from: 'fade', in: [B.cin[0] + .3, B.cin[1]], flip: B.flip7, sweep: B.sweep7, pile: 0 },
    { which: 'pred', v: .3, from: 'hand', hand, in: B.deal9, sweep: B.sweep11, pile: 1 },
    { which: 'real', v: S2REAL, from: 'right', in: [B.real9 - .45, B.real9], flip: B.r9.flip, sweep: B.sweep11 + .1, pile: 2 },
    { which: 'pred', v: null, from: 'hand', hand, in: B.deal12, sweep: B.sweep12, pile: 3 },
    { which: 'real', v: S2REAL, from: 'right', in: [B.real12 - .45, B.real12], flip: B.r12.flip, sweep: B.sweep12 + .1, pile: 4 },
  ]; })();
const s2Slosh = tau => { const B = S2B; return lerp(.71 + .2 * Math.sin((tau - B.deal12[0]) * 5.2), S2REAL, sm(B.settle[0], B.settle[1], tau)); };
function s2NetC(tau) {
  const B = S2B, o = netRest(), wt = s2Weights(tau), R = [B.r9, B.r12];
  const flows = [B.flow7, B.flow8, B.r9.flow, B.r12.flow];
  o.lines.forEach((l, i) => { l.w = wt[i]; l.pulse = s2Pulse(tau, flows); l.flow = s2Flow(tau, flows); });
  o.node = { pulse: s2Pulse(tau, flows.map(f => f + S2FD)) };
  // 卡是自己画的（抽认卡）；这里只给比较和火花要的数（al 0 = 网络不画牌）
  const active = r => tau > r.cmp - .5 && tau < r.sp[5] + 2.5;
  o.pred = null; o.real = null;
  if (active(B.r9) && tau < B.sweep11) { o.pred = { v: .3, k: 1, al: 0 }; o.real = { v: S2REAL, flip: 1, al: 0 }; }
  if (active(B.r12) && tau < B.sweep12) { o.pred = { v: S2REAL, k: 1, al: 0 }; o.real = { v: S2REAL, flip: 1, al: 0 }; }
  o.cmp = o.pred ? Math.max(sm(B.r9.cmp, B.r9.cmp + .4, tau) * (1 - sm(B.sweep11 - .2, B.sweep11, tau)), sm(B.r12.cmp, B.r12.cmp + .4, tau) * (1 - sm(B.sweep12 - .2, B.sweep12, tau))) : 0;
  o.spark = s2SparkOf(tau, R);
  return o;
}
function s2StageC(c, tau, L, cam = 1, chars = true, items = 1) {
  const B = S2B;
  c.save(); s2CamC(c, cam);
  if (cam >= 1) s2Img(c, 'desk', desk); else s2DeskWide(c);
  // 书堆：两本书垫在魔导书下面（镜头拉起来之后才出现，从下面塞进来）
  const stk = sm(B.pull[0] + .3, B.pull[1], tau, easeOut) * (1 - sm(B.cout[0], B.push[0] + .3, tau)) * items;
  if (stk > 0) [[mix(P.blue, P.ink, .35), 26, 22, .035], [mix(P.green, P.ink, .4), -14, 44, -.03]].forEach(([col, dx, dy, r], k) => {
    spin(c, S2RF.x + S2RF.w / 2, S2RF.y + 200, r * stk, () => cutPaper(c, rectPts(S2RF.x + dx * stk - 6, S2RF.y + dy * stk - 4, S2RF.w + 12, 410, 8), col, { seed: 3860 + k, step: 24, blur: 10, sy: 5, al: stk })); });
  const closed = g => { g.save(); g.translate(S2RF.x, S2RF.y); g.scale(S2RK, S2RK); g.translate(-(BOOK.x - 10), -(BOOK.y - 8)); s2Closed(g); g.restore(); };
  if (cam >= 1) s2Img(c, 'closed', closed); else closed(c);
  // 课本、画着网络的纸：从画面外滑进来（出场时滑出去）
  const kin = sm(B.cin[0], B.cin[1], tau, easeOut) * (1 - sm(B.cout[0], B.cout[1], tau, easeIn)) * items;
  if (kin > 0) {
    c.save(); c.translate(0, (1 - kin) * -700);
    s2Textbook(c, tau, sm(B.bookShut[0], B.bookShut[1], tau), 16 * sm(B.hl[1], B.hl[2], tau, x => x));
    c.restore();
    c.save(); c.translate((1 - kin) * 900, 0);
    cutPaper(c, S2SHEET, '#f3ede0', { seed: 3880, step: 40, blur: 12, sy: 6 });
    s2In(c, S2NC, () => {
      // 预测牌该在的地方：铅笔虚线空框（L6 画出来，发牌时退掉）
      const a = sm(B.slot, B.slot + .2, tau) * (1 - sm(B.deal9[1] - .2, B.deal9[1], tau));
      if (a > 0) { const { x, y, w, h } = NET.pred; spin(c, x, y, -.03, () => rline(c, rectPts(x - w / 2, y - h / 2, w, h, 6), { w: 3, color: alpha(P.ink2, .55), dash: [12, 9], seed: 3740, amp: .6, al: a, p: sm(B.slot, B.slot + .7, tau, x => x) })); }
      netDraw(c, s2NetC(tau), tau);
    });
    c.restore();
    // 抽认卡（在纸上面画，扫走时越过纸边落到桌角）
    s2In(c, { ...S2NC, x: S2NC.x + (1 - kin) * 900 }, () => { for (const cd of S2CARDS) { const q = s2CardAt(tau, cd); if (q) s2Card(c, cd.which, { ...q, v: cd.v ?? s2Slosh(tau) }); } });
    s2OverC(c, tau, kin);
  }
  c.restore();
  if (chars) s2CharsC(c, tau, L, cam);
}
function s2OverC(c, tau, kin) {
  const B = S2B, M = p => { const q = s2Map(S2NC, p); return [q[0] + (1 - kin) * 900, q[1]]; };
  const [tx, ty] = M([NET.pred.x, NET.pred.y - 236]);
  s2Tag(c, tau, tx, ty, '主动参与', B.tagAct2, B.cout[0] - .3, { seed: 3752, rot: .03 });
  const n7 = sm(B.note7, B.note7 + .2, tau) * (1 - sm(B.sweep7, B.sweep7 + .3, tau)), [nx, ny] = M([NET.real.x, NET.real.y + 190]);
  if (n7 > 0) zh(c, '没有误差', nx, ny, { size: 30, color: S2PEN, align: 'center', al: n7, p: writeP(tau, B.note7, '没有误差', .09) });
  const dA = sm(B.dots, B.dots + .2, tau) * (1 - sm(S2T(9), S2T(9) + .3, tau)), [dx, dy] = M([NET.node.x, NET.node.y - 120]);
  if (dA > 0) zh(c, '……', dx, dy, { size: 56, color: S2PEN, align: 'center', al: dA, p: writeP(tau, B.dots, '……', .25) });
  // L11：红笔再圈一圈差距
  const cA = 1 - sm(B.sweep11 - .3, B.sweep11, tau);
  if (tau > B.circle && cA > 0) s2In(c, { ...S2NC, x: S2NC.x + (1 - kin) * 900 }, () => { const bx = NET.pred.x + S2TUBE.dx + S2TUBE.hw + 18, y0 = netLevel('pred', .3)[1], y1 = netLevel('real', S2REAL)[1];
    rline(c, ellPts(bx + 4, (y0 + y1) / 2, 34, (y0 - y1) / 2 + 30, 40, -.1), { w: 5, color: P.red, seed: 3770, amp: 1.2, p: sm(B.circle, B.circle + .5, tau, x => x) * .97, al: cA }); });
  // L12：水位晃来晃去——两道铅笔虚线 + 两个「?」
  const sA = sm(B.deal12[1], B.deal12[1] + .3, tau) * (1 - sm(B.settle[1], B.settle[1] + .4, tau));
  if (sA > 0) s2In(c, S2NC, () => { for (const [v, sd] of [[.51, 0], [.91, 1]]) { const [lx, ly] = netLevel('pred', v);
    rline(c, [[lx - 34, ly], [lx + 34, ly]], { w: 2.4, color: S2PEN, dash: [7, 6], seed: 3775 + sd, amp: .3, al: sA }); zh(c, '?', lx - 50, ly + 10, { size: 34, color: S2PEN, align: 'center', al: sA }); } });
}
function s2CharsC(c, tau, L, cam) {
  const B = S2B;
  // 帕秋莉坐在书堆上
  const pch = s2Pch(c, tau, L, { x: S2RF.x + S2RF.w / 2 + 10, y: S2RF.y + 250, h: 440, pose: 'sit', mood: moodOf(L, 'patchouli', tau > S2T(8) && tau < S2E(8) ? 'annoyed' : 'normal') });
  // 琪露诺：站在课本旁；L8 扛着巨大的荧光笔飞着涂；L9 想、发牌
  const inHL = tau > B.hl[0] && tau < B.hl[3];
  let pos = [1060, 885], pose = 'stand', facing = -1, g = .6, mood = 'normal';
  if (inHL) { const hd = s2HlHead(tau), k = sm(B.hl[0], B.hl[1], tau) * (1 - sm(B.hl[2], B.hl[3], tau)), tip = tau < B.hl[1] || tau > B.hl[2] ? [lerp(1000, S2TBL[0][0][0], k), lerp(620, S2TBL[0][0][1], k)] : hd.pt;
    pos = [lerp(1060, tip[0] + 250, k), lerp(885, tip[1] + 330, k)]; pose = k > .05 ? 'fly' : 'stand'; mood = 'proud';
    const hs = 2.4 * k; if (hs > .05) { c.save(); s2Marker(c, tip[0], tip[1], -.95, hs); c.restore(); } }
  else if (tau > B.proud8[0] && tau < B.proud8[1]) { pose = 'proud'; g = .85; mood = 'proud'; }
  else if (tau > B.think[0] && tau < B.think[1]) pose = 'think';
  else if ((tau > B.deal9[0] - .1 && tau < B.deal9[1]) || (tau > B.deal12[0] - .1 && tau < B.deal12[1]) || (tau > B.r9.flip - .35 && tau < B.r9.flip + .5)) { pose = 'point'; g = .85; facing = 1; }
  else if (tau > S2T(10) && tau < S2E(10)) { pose = 'proud'; g = .8; }
  if (tau > B.dots && tau < S2T(9) + .3) mood = 'confused';
  if (tau > S2T(11) && tau < S2E(11)) mood = 'pout';
  if (tau > B.r12.sp[0] && tau < B.r12.sp[5]) mood = 'happy';
  s2Cir(c, tau, L, { x: pos[0], y: pos[1], h: 400, pose, facing, gesture: g, mood });
  // 画在最上层的荧光笔已在上面画过（笔在人前面会挡脸，所以笔先画、人后画）
}

// ===================== D：横向长镜头（L13–L15） =====================
const S2CAL = [['一周后', 1920], ['两周后', 2680], ['三周后', 3440]];      // 日历页：字、世界 x 起点（宽 700）
const S2SCORE = [3790, 530];                                            // 三周后那张成绩卡（世界坐标 = 网络坐标）
function s2CamD(tau) {
  const B = S2B, far = S2SCORE[0] - 1150, fogX = 2600;
  if (tau < B.pan[1]) return far * sm(B.pan[0], B.pan[1], tau, easeIO);
  if (tau < B.sp14[1]) return far;
  if (tau < B.sp14[2]) return lerp(far, fogX - 900, sm(B.sp14[1], B.sp14[2], tau, easeSine));
  return (fogX - 900) * (1 - sm(B.back[0], B.back[1], tau, easeIO));
}
// L14 的长火花：从成绩卡出发往左跑，跑到两周后那页散成雾
function s2LongSpark(tau) {
  const B = S2B; if (tau < B.sp14[0] || tau > B.back[1]) return null;
  const x0 = S2SCORE[0] - 120, x1 = 2600, u = sm(B.sp14[1], B.sp14[2], tau, easeSine), fog = sm(.45, 1, u, x => x);
  return { x: lerp(x0, x1, u), y: lerp(S2SCORE[1], 470, u) + Math.sin(u * 9) * 26, burst: sm(B.sp14[0], B.sp14[1], tau, x => x), fog, gone: sm(B.sp14[2] - .2, B.back[0] + .6, tau) };
}
function s2NetD(tau) {
  const B = S2B, o = netRest(), wt = s2Weights(tau), R = [B.r13, B.r15];
  const flows = [B.r13.flow, B.guess14[0]];
  o.lines.forEach((l, i) => { l.w = wt[i]; l.pulse = s2Pulse(tau, flows); l.flow = s2Flow(tau, flows); });
  o.node = { pulse: s2Pulse(tau, flows.map(f => f + S2FD)) };
  // 预测牌：L13 出来；L14 换一个新猜的水位，三周后褪色；L15 恢复；段末收回
  const kP = sm(B.r13.out, B.r13.out + .45, tau, easeOut) * (1 - sm(B.out, B.out + .7, tau, easeSine));
  if (kP > 0) { const v = lerp(.5, .35, sm(B.guess14[0], B.guess14[1], tau, easeSine));
    o.pred = { v, k: kP, al: 1 - .62 * sm(B.forget[0], B.forget[1], tau) * (1 - sm(B.restore, B.restore + .5, tau)) }; }
  // 现实牌：L13 翻开；L14 开头滑走（翻着滑走，不翻回去）；L15 背面朝上滑回来再翻开；段末滑走
  const kR1 = 1 - sm(B.realOut13, B.realOut13 + .6, tau, easeSine), kR2 = sm(B.realIn15[0], B.realIn15[1], tau, easeOut) * (1 - sm(B.out, B.out + .6, tau, easeSine));
  if (tau < B.realIn15[0]) o.real = { v: S2REAL, flip: sm(B.r13.flip, B.r13.flip + .45, tau, easeSine), k: kR1 };
  else o.real = { v: S2REAL, flip: sm(B.r15.flip, B.r15.flip + .45, tau, easeSine), k: kR2 };
  o.cmp = Math.max(sm(B.r13.cmp, B.r13.cmp + .4, tau) * (1 - sm(B.realOut13 - .2, B.realOut13 + .1, tau)), sm(B.r15.cmp, B.r15.cmp + .4, tau) * (1 - sm(B.out - .2, B.out + .1, tau)));
  o.spark = s2SparkOf(tau, R);
  o.al = 1 - sm(B.fadeNet[0], B.fadeNet[1], tau);
  return o;
}
function s2Calendar(c, name, x0, k) {
  const y0 = 196, w = 700, h = 600;
  cutPaper(c, rectPts(x0 + 16, y0, w - 32, h, 6), '#f3eee4', { seed: 3900 + k, step: 50, blur: 12, sy: 6 });
  cutPaper(c, rectPts(x0 + 10, y0 - 12, w - 20, 44, 5), mix(P.purple, P.ink, .2), { seed: 3905 + k, step: 24, blur: 5 });
  brassPin(c, x0 + 60, y0 + 10, 9); brassPin(c, x0 + w - 60, y0 + 10, 9);
  zh(c, name, x0 + w / 2, y0 + 122, { size: 64, color: k === 2 ? P.red : P.ink2, align: 'center' });
  for (let r = 0; r < 4; r++) for (let q = 0; q < 7; q++) { const cx = x0 + 70 + q * 94, cy = y0 + 200 + r * 92;
    rline(c, rectPts(cx - 36, cy - 30, 72, 64, 3), { w: 1.5, color: alpha(P.ink2, .25), close: true, seed: 3910 + r * 7 + q, amp: .5 });
    zh(c, String((r * 7 + q + k * 7 + 11) % 30 + 1), cx, cy + 10, { size: 24, color: alpha(P.ink2, .45), align: 'center' }); }
}
function s2StageD(c, tau, L, cam, chars = true) {
  const B = S2B, X = cam, st = sm(B.out, B.out + .5, tau);
  desk(c);
  c.save(); c.translate(-X, 0);
  if (X > 10) s2DeskWideD(c, X);
  s2Spread(c);
  // 书页右边接着一串日历页（压在书沿上，像从书里拉出来的折页）
  const cal = 1 - sm(B.out - .1, B.out + .5, tau);
  if (X > 1 || tau < B.pan[0] + .1) S2CAL.forEach(([name, x0], k) => { c.save(); c.globalAlpha *= cal; s2Calendar(c, name, x0, k); c.restore(); });
  // 今天：一小张日历钉在右页上
  const td = sm(S2T(13), S2T(13) + .4, tau, easeOut) * (1 - st);
  if (td > 0) { c.save(); c.globalAlpha *= td; spin(c, 1660, 206, .04, () => { cutPaper(c, rectPts(1580, 160, 160, 110, 4), '#f6f2e8', { seed: 3920, step: 20, blur: 6 });
    cutPaper(c, rectPts(1576, 150, 168, 24, 3), mix(P.purple, P.ink, .2), { seed: 3921, step: 16, blur: 4 }); zh(c, '今天', 1660, 238, { size: 40, color: P.ink2, align: 'center' }); }); c.restore(); }
  // 一条铅笔虚线：成绩要走的路（今天 → 三周后）
  const road = s2Win(tau, B.pan[0], B.back[1] - .2, .5);
  if (road > 0) rline(c, [[1460, 470], [2100, 500], [2800, 450], [3500, 490], [S2SCORE[0] - 110, S2SCORE[1]]], { w: 3, color: alpha(P.ink2, .5), dash: [12, 10], seed: 3925, smooth: true, amp: .8, al: road });
  // 帕秋莉坐的那叠课本（在左页上）
  const stack = 1 - sm(B.home[0], B.home[0] + .5, tau);
  if (stack > 0) { c.save(); c.globalAlpha *= stack; cutPaper(c, rectPts(170, 800, 250, 52, 6), mix(P.green, P.ink, .3), { seed: 3930, step: 20, blur: 8, sy: 4 });
    cutPaper(c, rectPts(186, 752, 222, 50, 6), mix(P.blue, P.ink, .35), { seed: 3931, step: 20, blur: 6, sy: 3 }); c.restore(); }
  netDraw(c, s2NetD(tau), tau);
  // 成绩卡（三周后）
  if (X > 1) s2Card(c, 'real', { x: S2SCORE[0], y: S2SCORE[1], rot: .04, flip: sm(B.score, B.score + .45, tau, easeSine), v: S2REAL, title: '成绩', al: cal });
  // 长火花 + 雾
  const ls = s2LongSpark(tau);
  if (ls) { const clear = 1 - ls.fog, a = 1 - ls.gone;
    if (ls.burst < 1) for (let k = 0; k < 7; k++) { const an = k / 7 * TAU, r0 = 30, r1 = r0 + 34 * easeOut(ls.burst); rline(c, [[S2SCORE[0] - 120 + Math.cos(an) * r0, S2SCORE[1] + Math.sin(an) * r0], [S2SCORE[0] - 120 + Math.cos(an) * r1, S2SCORE[1] + Math.sin(an) * r1]], { w: 3.5, color: P.red, seed: 3500 + k, al: 1 - ls.burst }); }
    netSparkPiece(c, ls.x, ls.y, 34 * (1 - .5 * ls.fog), tau * 3, clear * a, 3935);
    if (ls.fog > 0) { const tt = twos(tau); c.save(); c.globalAlpha *= (.2 + .55 * ls.fog) * a;
      for (let j = 0; j < 34; j++) { const an = hash(j, 941) * TAU + tt * .3 * (hash(j, 942) - .5), rr = (30 + 190 * ls.fog) * Math.sqrt(hash(j, 943));
        const x = ls.x + Math.cos(an) * rr * 1.3 + 10 * noise1(tt * .7 + j, 944), y = ls.y + Math.sin(an) * rr * .7 + 10 * noise1(tt * .7 + j, 945) - 20 * ls.gone, r = 5 + 10 * hash(j, 946);
        c.fillStyle = mix(P.red, P.g2, .3 + .5 * ls.fog); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } c.restore(); } }
  s2OverD(c, tau);
  if (chars) s2CharsD(c, tau, L, X);
  c.restore();
}
function s2DeskWideD(c, X) {   // 书外面的桌面跟着镜头延伸
  c.fillStyle = WOOD; c.fillRect(W - 10, 0, X + 20, H);
  c.save(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let k = 0; k < 14; k++) { const y = 30 + k * 78 + Math.sin(k * 1.7) * 12; c.beginPath(); c.moveTo(W - 10, y + 6); c.bezierCurveTo(W + X * .3, y - 8, W + X * .6, y + 12, W + X + 10, y); c.stroke(); } c.restore();
  grain(c, polyPath(rectPts(W - 10, 0, X + 20, H)), .1);
}
function s2OverD(c, tau) {
  const B = S2B, bx = NET.pred.x + S2TUBE.dx + S2TUBE.hw + 18;
  s2Tag(c, tau, 1258, 676, '错误反馈', B.tagFb2, B.out, { seed: 3754, spark: true, rot: -.02 });
  // 雾回到书上：三根线旁各一个「?」
  const qA = sm(B.back[1] - .5, B.back[1], tau) * (1 - sm(w0(15, .2), w0(15, .2) + .4, tau));
  if (qA > 0) for (let i = 0; i < 3; i++) { const [x, y] = netAt(i, .55); zh(c, '?', x + [-6, 0, -6][i], y + [-26, -24, 44][i], { size: 38, color: S2PEN, align: 'center', al: qA }); }
  // L15：小纸条「我当时是怎么想的」+ 箭头指到差距
  const nA = sm(B.note, B.note + .3, tau, easeOut) * (1 - sm(B.out, B.out + .4, tau));
  if (nA > 0) { const txt = '我当时是怎么想的', nw = zhWidth(c, txt, 30) + 56, nx = 1150, ny = 256;
    fade(c, nA, () => {
      spin(c, nx, ny, -.025, () => { cutPaper(c, rectPts(nx - nw / 2, ny - 32 - 24 * (1 - nA), nw, 64, 3), '#fbf8f0', { seed: 3780, step: 16, blur: 5 });
        brassPin(c, nx - nw / 2 + 18, ny - 24 * (1 - nA), 8);
        zh(c, txt, nx + 14, ny + 11 - 24 * (1 - nA), { size: 30, color: P.ink2, align: 'center', p: writeP(tau, B.write, txt, .2) }); });
      const y0 = netLevel('pred', .35)[1], y1 = netLevel('real', S2REAL)[1];
      arrow(c, [1238, 292], [bx + 12, (y0 + y1) / 2], { w: 2.6, color: S2PEN, head: 12, bend: -26, seed: 3782, p: sm(B.note + .35, B.note + .8, tau, x => x) });
    }); }
}
function s2CharsD(c, tau, L, X) {
  const B = S2B, home = sm(B.home[0], B.home[1], tau, easeIO);
  // 帕秋莉：坐在左页那叠课本上；段末站起来走回标准站位
  if (tau < B.home[0] + .25) s2Pch(c, tau, L, { x: 300, y: 770, h: 470, pose: 'sit', mood: moodOf(L, 'patchouli') });
  else s2Pch(c, tau, L, { ...NET.cast.pch, x: lerp(300, NET.cast.pch.x, home) });
  // 琪露诺：在右页上空飞；L14 跟着镜头飞去三周后，在雾里转晕；L15 飞回来；段末落回标准站位
  const hover = [1700, 560], out = sm(B.pan[0], B.pan[1], tau), back = sm(B.back[0], B.back[1], tau);
  let sx = hover[0], sy = hover[1] + 10 * Math.sin(tau * 2) * sm(B.open[1], B.open[1] + .8, tau), facing = -1, mood = 'normal', pose = 'fly';
  if (tau > B.pan[0] && tau < B.back[1]) { sx = lerp(hover[0], 1350, out); sx = lerp(sx, hover[0], back); facing = tau < B.sp14[1] ? 1 : -1; }
  if (tau > B.sp14[1] && tau < B.restore + .5) mood = 'confused';
  if (tau > B.r13.sp[0] && tau < B.r13.sp[5] + .3) mood = 'happy';
  if (tau > B.r15.sp[0]) mood = 'happy';
  let wx = sx + X;
  if (tau > B.home[0]) { wx = lerp(hover[0], NET.cast.cir.x, home); sy = lerp(sy, NET.cast.cir.y, home); if (home >= 1) { pose = 'stand'; mood = 'normal'; } }
  s2Cir(c, tau, L, { x: wx, y: sy, h: 440, pose, facing, mood, ...(pose === 'stand' ? { gesture: NET.cast.cir.gesture } : {}) });
}

// ===================== 时间线 =====================
scene({ order: 2, key: 'pillars', title: '三根柱子', dur: S2DUR, lines: S2LINES,
  fn(c, tau, L) {
    const B = S2B;
    // A → B：翻页。翻起来的那张纸没翻过书脊前，左页还是 A；翻过去以后，纸还没盖到的左边一截仍是 A
    if (tau < B.fAB[0]) return s2StageA(c, tau, L);
    if (tau < B.fAB[1]) {
      const u = (tau - B.fAB[0]) / (B.fAB[1] - B.fAB[0]), e = easeIO(u), cw = BOOK.R.w * Math.cos(e * Math.PI);
      s2StageB(c, tau, L);                               // 此刻 B 还是一张空白书页（剧场、暗色都在翻完之后才出来）
      const sc = s2Buf(c, b => s2StageA(b, tau, L)), lx = cw > 0 ? CX : CX + cw;
      if (lx > 1) c.drawImage(S2BUF, 0, 0, lx * sc, H * sc, 0, 0, lx, H);
      turnPage(c, u);
      if (cw > 2) { const lift = Math.sin(e * Math.PI) * 36;   // 翻起来的这张纸正面就是 A 的右页（连同上面的东西一起翻走）
        c.drawImage(S2BUF, CX * sc, 0, BOOK.R.w * sc + 30 * sc, H * sc, CX, -lift * .5, cw + 30 * cw / BOOK.R.w, H + lift);
        c.save(); c.globalAlpha *= .18 * Math.sin(e * Math.PI); c.fillStyle = '#3c2814'; c.fillRect(CX, BOOK.R.y - lift, cw, BOOK.R.h + lift * 2); c.restore(); }
      return;
    }
    if (tau < B.close[0]) return s2StageB(c, tau, L);
    // B → C：合上书，镜头拉起来
    if (tau < B.close[1]) {
      s2Fold(c, (tau - B.close[0]) / (B.close[1] - B.close[0]), b => s2StageB(b, tau, L, false));
      return s2Hop(c, tau, L, 'BC');
    }
    if (tau < B.pull[1]) { s2StageC(c, tau, L, sm(B.pull[0], B.pull[1], tau, x => x), false); return s2Hop(c, tau, L, 'BC'); }
    if (tau < B.push[0]) return s2StageC(c, tau, L);
    // C → D：镜头推回魔导书，书翻开
    if (tau < B.push[1]) { s2StageC(c, tau, L, 1 - sm(B.push[0], B.push[1], tau, x => x), false); return s2Hop(c, tau, L, 'CD'); }
    if (tau < B.open[1]) { s2Fold(c, 1 - (tau - B.open[0]) / (B.open[1] - B.open[0]), b => s2StageD(b, tau, L, 0, false)); return s2Hop(c, tau, L, 'CD'); }
    s2StageD(c, tau, L, s2CamD(tau));
  },
});
// 换舞台时两个人从上一个舞台的位置跳到下一个舞台的位置（在最上层画）
function s2Hop(c, tau, L, which) {
  const B = S2B;
  if (which === 'BC') {
    const u = sm(B.close[0], B.pull[1], tau, easeIO);
    const p = s2Arc([470, 885], [S2RF.x + S2RF.w / 2 + 10, S2RF.y + 250], u, 160), q = s2Arc(s2CirTop(tau), [1060, 885], u, 60);
    s2Pch(c, tau, L, { x: p[0], y: p[1], h: lerp(410, 440, u), ...(u > .98 ? { pose: 'sit' } : { pose: 'lecture', gesture: .4 }) });
    s2Cir(c, tau, L, { x: q[0], y: q[1], h: lerp(370, 400, u), pose: 'fly', mood: 'cry' });
  } else {
    const u = sm(B.push[0], B.open[1], tau, easeIO);
    const p = [lerp(S2RF.x + S2RF.w / 2 + 10, 300, u), lerp(S2RF.y + 250, 770, u)], q = s2Arc([1060, 885], [1700, 560], u, 120);
    s2Pch(c, tau, L, { x: p[0], y: p[1], h: lerp(440, 470, u), pose: 'sit' });
    s2Cir(c, tau, L, { x: q[0], y: q[1], h: lerp(400, 440, u), pose: 'fly', facing: u < .85 ? 1 : -1 });
  }
}
