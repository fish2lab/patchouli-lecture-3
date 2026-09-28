'use strict';
// 第 1 段：暗号（3B1B《Reinventing Entropy》月球机器人那一段的剪纸版）。信息论第一课：码长 = −log₂p，熵是下限。
//   四句暗号：我是最强的 1/2、肚子饿了 1/4、来玩 1/8、考试没及格 1/8。等长暗号 00/01/10/11（每句 2 比特），
//   聪明暗号 0/10/110/111（平均 1.75 比特 = 熵）。画面上所有长度、面积都由 S1MSG 算出来，不写死。
//   A 书页（L0–L6）
//     L0 右页右下角贴一张冰面剪纸，琪露诺站在上面敲冰；冰裂纹沿书页一路爬过书脊，爬到左页图书馆的窗台，
//        每敲一下，一粒冰光顺着裂纹跑过去，窗台下垂着的纸带就多打一个孔。
//     L1–L2 冰面、窗户收掉，两人退到页边。左页四行：每句话一张纸条、它的概率、一周 8 次里出现几张小卡（4、2、1、1）。
//     L3 右页顶上：一格纸带「回答一个是或否 = 1 比特」。
//     L4 右页每行送出一段两格纸带（00/01/10/11），「2 比特」。
//     L5 纸带一行行抽回去，换成聪明暗号（0/10/110/111），长短不一。
//     L6 一周 8 次接成两条长纸带：等长 16 比特、聪明 14 比特，短了 1/8；右页手写「平均 2」「平均 1.75」。
//   B 俯拍桌面（L7）  镜头往右平移出书，书只剩左边一窄条，帕秋莉站在那一条上。桌上一张方纸（面积 = 1）：
//     对折（有厚度、有透视、有投影）→ 打开留下折痕 → 剪刀沿折痕剪开：半张 =「我是最强的」对折 1 次 = 1 比特；
//     剩下的再折、再剪：1/4 =「肚子饿了」2 次；再折、再剪：两张 1/8 = 3 次。纸片面积就是概率，折几次就是几比特。
//   C 书架（L8–L11）  镜头移回书页，左右两页各立起一排书（立体书）：书的厚度 = 概率，书的高度 = 比特数。
//     L8 一张硫酸纸把每排书「摊平」：等长那排平均 2，聪明那排平均 1.75；淡墨「熵」线画在 1.75。
//     L9 聪明那排刚好贴着熵线：盖定理蜡封，手写「香农 1948」。L10 琪露诺指着最矮（也最厚）的那本「我是最强的」。
//     L11 那本书上方一道括号「一半都是它」；帕秋莉抱臂得意。
//   段末：书架折平收掉，两人回 EP3 站位；右页右上角淡淡出现 H = Σ p·(−log₂p) 约 1 秒；最后 0.8 秒只剩 spread + 两人 + 页眉。
// 顶层名字一律带本段前缀 S1 / s1。
const S1LINES = seq(1.0, [
  ['琪露诺每天往图书馆传话，来来回回就四句。', { hold: .5 }],
  '一半是「我是最强的」，四分之一是「肚子饿了」，',
  ['「来玩」和「考试没及格」各占八分之一。', { hold: .2 }],
  ['每回答一个是或否，就是 1 比特。', { hold: .2 }],
  ['四句话，每句两个比特，刚好够分。', { hold: .2 }],
  ['聪明一点：最常说的那句只给 1 比特，越少见的话暗号越长。', { hold: .4 }],
  ['平均下来，每句只要 1.75 比特。', { hold: 1.0 }],
  ['概率每砍一半，就多 1 比特。越难猜的消息，越值钱。', { pause: .8, hold: 2.3 }],
  ['把每句话的比特数按出现次数平均，叫作「熵」。', { pause: .8 }],
  ['1948 年香农证明：不管暗号怎么编，平均都短不过熵。', { hold: .7 }],
  ['所以「我是最强的」……只值 1 比特？', { who: 'cirno', mood: 'surprised' }],
  ['全幻想乡都猜得到的话，本来就不值钱。', { mood: 'smug', hold: .2 }],
]);
const S1T = i => S1LINES[i][0], S1E = i => S1LINES[i][1];
// S1W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S1W = (i, f) => { const v = voiceOf(S1LINES[i][2]), l = S1LINES[i], h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S1END = seqEnd(S1LINES), S1DUR = S1END + 2.3;

// ===================== 数（画面上的长度、面积、字全从这里算） =====================
const S1MSG = [
  { t: '我是最强的', d: 2, n: 4, fix: '00', code: '0' },
  { t: '肚子饿了', d: 4, n: 2, fix: '01', code: '10' },
  { t: '来玩', d: 8, n: 1, fix: '10', code: '110' },
  { t: '考试没及格', d: 8, n: 1, fix: '11', code: '111' },
];
const S1WEEK = [0, 1, 0, 2, 0, 1, 0, 3];                                        // 一周 8 次传话（4、2、1、1）
const S1AVG = k => S1MSG.reduce((a, m) => a + m[k].length / m.d, 0);             // 平均码长：fix 2、code 1.75
const S1ENT = S1MSG.reduce((a, m) => a + Math.log2(m.d) / m.d, 0);               // 熵 1.75
const S1SUM = k => S1WEEK.reduce((a, i) => a + S1MSG[i][k].length, 0);          // 一周总比特：16、14
const s1Num = x => String(+x.toFixed(2));
const S1COL = [mix(P.purple, P.ink, .12), mix(P.blue, P.ink, .12), mix(P.moon, P.ink, .38), mix(P.g3, P.hairDark, .25)];
const S1TINT = S1COL.map(col => mix(col, P.cap, .68));
const S1PAN = 1400;                                                              // 出书俯拍桌面：镜头右移多少
const S1ROWY = [292, 402, 512, 622];

// ===================== 节拍（全部由台词时间算出） =====================
const S1B = (() => { const t = S1T, e = S1E, w = S1W, B = {};
  B.in = .85;                                                                    // 前 0.8 秒是标准画面
  B.taps = [w(0, .06), w(0, .28), w(0, .5), w(0, .72)]; B.run = 1.1;             // 敲冰；冰光沿裂纹跑多久
  B.out0 = [t(1) - .1, t(1) + .4]; B.walk = [t(1), t(1) + .9]; B.head = t(1) + .3;
  B.row = [w(1, .05), w(1, .55), w(2, .05), w(2, .5)];
  B.yn = w(3, .1); B.fix = [0, 1, 2, 3].map(k => w(4, .12) + k * .28);
  B.code = [0, 1, 2, 3].map(k => w(5, .22) + k * .45);
  B.wk = [w(6, .02), w(6, .3)]; B.gap = w(6, .75);
  B.toDesk = [e(6) + .05, e(6) + 1.05];
  B.fold0 = t(7) + .3; B.FC = 2.0;
  B.toBook = [e(7), e(7) + 1.0];
  B.pop = B.toBook[1] - .15; B.fill = [w(8, .45), w(8, .78)]; B.ent = w(8, .8);
  B.seal = w(9, .28); B.shannon = w(9, .36);
  B.point = t(10); B.pick = w(10, .45); B.brace = w(11, .15);
  B.fold = [S1END + .05, S1END + .65]; B.home = [S1END, S1END + .9]; B.egg = [S1END + .25, S1END + 1.4];
  return B; })();

// ===================== 小画具 =====================
// 分数：分子、横线、分母，(x, y) 是横线中心
function s1Frac(c, n, d, x, y, size = 30, o = {}) {
  const { color = P.ink2, al = 1 } = o; if (al <= 0) return;
  c.save(); c.globalAlpha *= al;
  zh(c, String(n), x, y - size * .18, { size, color, align: 'center' });
  rline(c, [[x - size * .45, y], [x + size * .45, y]], { w: 2, color, seed: 3611 + d, amp: .3 });
  zh(c, String(d), x, y + size * .88, { size, color, align: 'center' });
  c.restore();
}
// 竖排字（窄书脊上用）
function s1Vert(c, text, x, cy, size, color) { const ch = [...text]; ch.forEach((s, i) => zh(c, s, x, cy + (i - (ch.length - 1) / 2) * size * 1.02 + size * .36, { size, color, align: 'center' })); }
// 折线上第 u（0..1，按长度）处的点
function s1Along(pts, u) {
  const L = pathLen(pts), end = L * clamp(u, 0, 1); let acc = 0;
  for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); if (acc + d >= end) { const f = (end - acc) / (d || 1); return [lerp(pts[k - 1][0], pts[k][0], f), lerp(pts[k - 1][1], pts[k][1], f)]; } acc += d; }
  return pts.at(-1);
}
const s1Hop = (tau, a, b, n = 3, amp = 16) => tau > a && tau < b ? amp * Math.abs(Math.sin((tau - a) / (b - a) * Math.PI * n)) : 0;

// ===================== A：冰面、裂纹、窗台 =====================
const S1CRACK = [[1540, 846], [1450, 800], [1392, 742], [1290, 712], [1204, 650], [1110, 628], [1020, 580], [CX, 560], [900, 522], [862, 470], [826, 424]];
const S1BRANCH = [[2, -.9, 46], [4, .8, 52], [5, -1.1, 38], [8, .9, 44], [9, -1.6, 30]];
const S1SILL = { x: 690, y: 414 };
function s1Lake(c, al) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al;
  cutPaper(c, ellPts(1592, 864, 262, 58, 40), EP2_ICE, { seed: 3620, step: 22, blur: 6, smooth: true });
  cutPaper(c, ellPts(1610, 866, 170, 32, 30), mix(EP2_ICE, EP2_FROST, .55), { seed: 3621, step: 18, shadow: false });
  for (let k = 0; k < 4; k++) rline(c, [[1352 + k * 12, 866], [1344 + k * 15, 800 - k * 9]], { w: 3, color: alpha(P.g3, .7), seed: 3622 + k, amp: .8 });
  zh(c, '雾之湖', 1788, 830, { size: 26, color: alpha(P.ink2, .7), align: 'center' });
  c.restore();
}
function s1Window(c, al) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al;
  const x = 580, y = 150, w = 220, h = 250, arch = [];
  for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; arch.push([x + w / 2 + Math.cos(a) * w / 2, y + w / 2 + Math.sin(a) * w / 2]); }
  const outer = [...arch, [x + w, y + h], [x, y + h]];
  cutPaper(c, outer.map(([px, py]) => [px + (px - (x + w / 2)) * .09, py - 10]), P.shelf2, { seed: 3630, step: 18 });
  cutPaper(c, outer, P.night2, { seed: 3631, step: 18, shadow: false });
  drawMoonIcon(c, x + 150, y + 90, 22, P.moon, -.4);
  for (const [a, b] of [[[x + w / 2, y + 4], [x + w / 2, y + h]], [[x, y + 150], [x + w, y + 150]]]) rline(c, [a, b], { w: 6, color: P.shelf2, seed: 3632, amp: .4 });
  cutPaper(c, rectPts(x - 40, y + h, w + 80, 20, 3), P.shelf, { seed: 3633, step: 20 });
  zh(c, '图书馆', x + w / 2, y - 22, { size: 26, color: alpha(P.ink2, .7), align: 'center' });
  c.restore();
}
function s1Crack(c, tau, al) {
  const B = S1B; if (al <= 0) return 0;
  const grow = sm(B.taps[0], B.taps[0] + B.run, tau, x => x);
  c.save(); c.globalAlpha *= al;
  rline(c, S1CRACK, { w: 6, color: mix(EP2_ICE_DEEP, P.blue, .35), p: grow, seed: 3640, amp: .8 });
  rline(c, S1CRACK, { w: 1.6, color: EP2_FROST, p: grow, seed: 3640, amp: .8 });
  const L = pathLen(S1CRACK); let acc = 0;
  for (let k = 1; k < S1CRACK.length; k++) {
    acc += Math.hypot(S1CRACK[k][0] - S1CRACK[k - 1][0], S1CRACK[k][1] - S1CRACK[k - 1][1]);
    const br = S1BRANCH.find(b => b[0] === k); if (!br) continue;
    const bp = clamp((grow - acc / L) * 6, 0, 1), [bx, by] = S1CRACK[k];
    rline(c, [[bx, by], [bx + Math.cos(br[1] - 2) * br[2], by + Math.sin(br[1] - 2) * br[2]]], { w: 3.5, color: mix(EP2_ICE_DEEP, P.blue, .35), p: bp, seed: 3650 + k, amp: .6 });
  }
  // 冰光：每敲一下，一粒光从湖面沿裂纹跑到窗台
  let arrived = 0;
  B.taps.forEach((t0, i) => {
    const u = (tau - t0) / B.run; if (u >= 1) arrived += sm(t0 + B.run, t0 + B.run + .25, tau); if (u <= 0 || u >= 1) return;
    const [px, py] = s1Along(S1CRACK, easeSine(u)); sparkle(c, px, py, 16, { color: EP2_FROST, rot: u * 3 }); sparkle(c, px, py, 7, { color: '#ffffff' });
  });
  // 敲下去的那一刻，脚边迸出冰屑
  B.taps.forEach((t0, i) => { const k = (tau - t0) / .35; if (k <= 0 || k >= 1) return;
    for (let j = 0; j < 5; j++) { const a = -Math.PI * (.15 + j * .17), r = 20 + 50 * easeOut(k); sparkle(c, 1540 + Math.cos(a) * r, 850 + Math.sin(a) * r * .6, 8 * (1 - k), { color: EP2_FROST }); } });
  c.restore();
  return arrived;
}

// ===================== A：四行暗号 =====================
function s1Row(c, tau, k, al) {
  const B = S1B, m = S1MSG[k], y = S1ROWY[k], u = sm(B.row[k], B.row[k] + .5, tau, easeOut); if (u <= 0 || al <= 0) return;
  c.save(); c.globalAlpha *= al * Math.min(1, u * 1.6);
  c.save(); c.translate(500 - 70 * (1 - u), y); c.rotate([-.02, .015, -.01, .02][k] - (1 - u) * .12);
  cutPaper(c, rectPts(-122, -32, 244, 64, 4), S1TINT[k], { seed: 3660 + k, step: 16 });
  zh(c, m.t, 0, 11, { size: 32, color: P.ink, align: 'center' });
  c.restore();
  s1Frac(c, 1, m.d, 672, y, 30, { al: sm(B.row[k] + .2, B.row[k] + .5, tau) });
  for (let j = 0; j < m.n; j++) { const uj = sm(B.row[k] + .35 + j * .12, B.row[k] + .65 + j * .12, tau, easeOutBack); if (uj <= 0) continue;
    c.save(); c.translate(752 + j * 36, y - 18 * (1 - uj)); c.rotate((hash(j, 3670 + k) - .5) * .16); c.globalAlpha *= Math.min(1, uj);
    cutPaper(c, rectPts(-14, -21, 28, 42, 3), S1TINT[k], { seed: 3671 + k * 5 + j, step: 10, blur: 3 }); rline(c, [[-7, -6], [7, -6]], { w: 1.5, color: alpha(P.ink2, .5), seed: 3680 + j });
    rline(c, [[-7, 3], [4, 3]], { w: 1.5, color: alpha(P.ink2, .5), seed: 3681 + j }); c.restore(); }
  c.restore();
}
// 一行的暗号纸带：每格 1 比特，格子上方写 0 / 1。先等长，再换成聪明暗号
function s1RowTape(c, tau, k, al) {
  const B = S1B, m = S1MSG[k], y = S1ROWY[k];
  const f1 = sm(B.fix[k], B.fix[k] + .45, tau, x => x), back = sm(B.code[k], B.code[k] + .3, tau, x => x), f2 = sm(B.code[k] + .3, B.code[k] + .75, tau, x => x);
  if (f1 <= 0 || al <= 0) return;
  const smart = back >= 1, code = smart ? m.code : m.fix, p = smart ? f2 : f1 * (1 - back);
  const o = tape(c, { x: 1030, y, cells: [...code].map(ch => ({ bits: 1, ch })), unit: 56, h: 44, rows: 1, p, punch: p, al });
  const la = smart ? sm(B.code[k] + .6, B.code[k] + .9, tau) : sm(B.fix[k] + .3, B.fix[k] + .6, tau) * (1 - back);
  if (la > 0) zh(c, `${code.length} 比特`, 1030 + o.len * p + 26, y + 11, { size: 30, color: P.ink2, al: al * la });
}
// 一周 8 次接成一条纸带
function s1Week(c, tau, key, y, t0, al) {
  const p = sm(t0, t0 + 1.0, tau, x => x); if (p <= 0 || al <= 0) return null;
  return tape(c, { x: 372, y, cells: S1WEEK.map(i => ({ bits: S1MSG[i][key].length, ch: S1MSG[i][key] })), unit: 32, h: 34, rows: 1, p, punch: p, al });
}

function s1PageA(c, tau) {
  const B = S1B; if (tau > B.toDesk[1] + .05) return;
  // L0：冰面、窗户、裂纹、窗台下的纸带
  const a0 = sm(B.in, B.in + .45, tau) * (1 - sm(B.out0[0], B.out0[1], tau));
  s1Window(c, a0); s1Lake(c, a0);
  const got = s1Crack(c, tau, a0);
  if (got > 0) tape(c, { x: S1SILL.x, y: S1SILL.y + 22, rot: Math.PI / 2, cells: [1, 1, 1, 1].map(b => ({ bits: b })), unit: 40, h: 46, rows: 1, p: got / 4, punch: Math.floor(got + 1e-3) / 4, al: a0 });
  // L1–L2：一周 8 次
  const hk = sm(B.head, B.head + .4, tau);
  if (hk > 0) zh(c, '一周传话 8 次', 380, 218, { size: 34, color: P.ink2, p: writeP(tau, B.head, '一周传话 8 次'), al: hk });
  for (let k = 0; k < 4; k++) s1Row(c, tau, k, 1);
  // L3：一个是或否 = 1 比特
  const yk = sm(B.yn, B.yn + .4, tau);
  if (yk > 0) { tape(c, { x: 1030, y: 172, cells: [{ bits: 1 }], unit: 56, h: 44, rows: 1, p: yk, punch: yk });
    zh(c, '回答一个是或否 = 1 比特', 1110, 184, { size: 32, color: P.ink2, p: writeP(tau, B.yn + .2, '回答一个是或否 = 1 比特', .05) }); }
  for (let k = 0; k < 4; k++) s1RowTape(c, tau, k, 1);
  // L6：一周的两条纸带
  const fa = s1Week(c, tau, 'fix', 752, B.wk[0], 1), fb = s1Week(c, tau, 'code', 858, B.wk[1], 1);
  const l1 = `等长：${S1SUM('fix')} 比特，平均 ${s1Num(S1AVG('fix'))}`, l2 = `聪明：${S1SUM('code')} 比特，平均 ${s1Num(S1AVG('code'))}`;
  if (fa) zh(c, l1, 1030, 764, { size: 32, color: P.ink2, p: writeP(tau, B.wk[0] + .8, l1, .05) });
  if (fb) zh(c, l2, 1030, 870, { size: 32, color: P.ink, p: writeP(tau, B.wk[1] + .8, l2, .05) });
  const gk = sm(B.gap, B.gap + .4, tau);
  if (gk > 0 && fa && fb) { const x0 = 372 + fb.len, x1 = 372 + fa.len, good = mix(P.green, P.ink, .3);
    rline(c, rectPts(x0 + 3, 858 - 17, x1 - x0 - 6, 34), { w: 2.5, color: good, close: true, dash: [7, 6], seed: 3690, al: gk });
    zh(c, `省 ${S1SUM('fix') - S1SUM('code')}`, (x0 + x1) / 2, 869, { size: 24, color: good, align: 'center', al: gk }); }
}

// ===================== B：桌面上的对折剪纸 =====================
const S1SQ = { x: 920, y: 196, s: 520 }, S1CAM = { cx: 1180, cy: 456, F: 1500 };
const S1CYC = (() => { const { x, y, s } = S1SQ; return [
  { reg: [x, y, s, s], ax: 'v', a: x + s / 2, flap: 0, sep: [26, 0] },
  { reg: [x, y, s / 2, s], ax: 'h', a: y + s / 2, flap: 1, sep: [0, -26] },
  { reg: [x, y + s / 2, s / 2, s / 2], ax: 'v', a: x + s / 4, flap: 3, stay: 2, sep: [14, 0], stSep: [-14, 0] },
]; })();
const S1PAPER = P.cap, S1PAPERB = mix(P.cap, P.paperEdge, .38);
// 把对折的一半切成 flap（翻起来的那半）和 stay（留在桌上那半）
function s1Halves(cy) { const [rx, ry, rw, rh] = cy.reg, a = cy.a;
  return cy.ax === 'v' ? { flap: [a, ry, rx + rw - a, rh], stay: [rx, ry, a - rx, rh], cut: [[a, ry - 10], [a, ry + rh + 10]] }
    : { flap: [rx, ry, rw, a - ry], stay: [rx, a, rw, ry + rh - a], cut: [[rx - 10, a], [rx + rw + 10, a]] }; }
const s1Proj = (x, y, z) => { const k = S1CAM.F / (S1CAM.F - z); return [S1CAM.cx + (x - S1CAM.cx) * k, S1CAM.cy + (y - S1CAM.cy) * k]; };
// 平放的一片纸：先画一道厚边，再贴上去
function s1Sheet(c, r, color, seed, dx = 0, dy = 0) {
  const [x, y, w, h] = r;
  c.fillStyle = mix(P.paperEdge, P.ink, .12); c.fillRect(x + dx + 2, y + dy + 5, w, h);
  return cutPaper(c, rectPts(x + dx, y + dy, w, h), color, { seed, step: 34, blur: 8, sy: 6, grain: .12 });
}
// 翻起来的那半：绕折线转 th，按透视投影；背面略暗；桌上有它的影子
function s1Flap(c, r, cy, th) {
  const [x, y, w, h] = r, pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const p3 = pts.map(([px, py]) => { const d = cy.ax === 'v' ? px - cy.a : py - cy.a, z = Math.abs(d) * Math.sin(th), m = cy.a + d * Math.cos(th);
    return cy.ax === 'v' ? [m, py, z] : [px, m, z]; });
  const sh = p3.map(([px, py, z]) => [px + z * .28, py + z * .38]), st = Math.sin(th);
  c.save(); c.fillStyle = alpha(P.ink, .16 * st); c.fill(polyPath(sh)); c.restore();
  const scr = p3.map(q => s1Proj(...q)), path = polyPath(scr);
  c.save(); c.translate(0, 4); c.fillStyle = mix(P.paperEdge, P.ink, .12); c.fill(path); c.restore();
  c.fillStyle = th < Math.PI / 2 ? S1PAPER : S1PAPERB; c.fill(path); grain(c, path, .12);
  c.fillStyle = alpha(P.ink, .10 * Math.abs(Math.cos(th)) * (th > Math.PI / 2 ? 1 : .4)); c.fill(path);
  c.strokeStyle = alpha(P.paperEdge, .9); c.lineWidth = 1.5; c.stroke(path);
}
// 剪刀：(x, y) 是刀口，ang 朝前方向，open 张开角
function s1Scissors(c, x, y, ang, open, al = 1) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(ang); c.scale(1.35, 1.35);
  const steel = mix(P.g1, P.g2, .45), grip = mix(P.purple, P.ink, .1);
  for (const s of [-1, 1]) { c.save(); c.rotate(s * open);
    cutPaper(c, [[0, 0], [-8, -6 * s], [-150, -4 * s], [-150, 3 * s]].map(([a, b]) => [a + 70, b]), steel, { seed: 3700 + s, step: 12, blur: 4 });
    rline(c, circPts(-104, 26 * s, 24, 20), { w: 9, color: grip, close: true, seed: 3702 + s, amp: .5 });
    rline(c, [[-80, 10 * s], [-40, 2 * s]], { w: 9, color: grip, seed: 3704 + s, amp: .4 });
    c.restore(); }
  brassPin(c, -40, 0, 7);
  c.restore();
}
// 剪下来的一片上写：哪句话、概率、对折几次、几比特
function s1PieceLabel(c, k, r, al, tau, t0) {
  if (al <= 0) return; const m = S1MSG[k], [x, y, w, h] = r, cx = x + w / 2, cy = y + h / 2, bits = Math.log2(m.d);
  c.save(); c.globalAlpha *= al;
  const ns = Math.min(32, (w - 16) / [...m.t].length);
  zh(c, m.t, cx, cy - 58, { size: ns, color: P.ink, align: 'center', p: writeP(tau, t0, m.t, .05) });
  s1Frac(c, 1, m.d, cx, cy - 8, 30, { color: P.ink2 });
  zh(c, `对折 ${bits} 次`, cx, cy + 66, { size: 24, color: P.ink2, align: 'center' });
  zh(c, `${bits} 比特`, cx, cy + 104, { size: 32, color: P.ink, align: 'center' });
  c.restore();
}
function s1Fold(c, tau) {
  const B = S1B, t0 = k => B.fold0 + k * B.FC;
  // 桌上的注释
  const nk = sm(t0(0) + 1.8, t0(0) + 2.3, tau);
  if (nk > 0) zh(c, '纸片面积 = 概率　　对折几次 = 几比特', 1180, 862, { size: 34, color: alpha(P.cap, .9), align: 'center', al: nk });
  // 已经剪下来的纸片
  const pieces = [];
  S1CYC.forEach((cy, k) => { const tc = t0(k) + 1.45; if (tau < tc) return; const hv = s1Halves(cy), u = sm(tc, tc + .3, tau, easeOut);
    pieces.push([cy.flap, hv.flap, cy.sep, u, tc]); if (cy.stay != null) pieces.push([cy.stay, hv.stay, cy.stSep, u, tc]); });
  // 还没剪完的那一块
  const act = S1CYC.findIndex((cy, k) => tau < t0(k) + 1.45);
  for (const [k, r, sp, u, tc] of pieces) { s1Sheet(c, r, mix(S1PAPER, S1TINT[k], u), 3720 + k, sp[0] * u, sp[1] * u); }
  if (act >= 0) {
    const cy = S1CYC[act], a = t0(act), hv = s1Halves(cy);
    const th = Math.PI * (sm(a, a + .4, tau) - sm(a + .5, a + .8, tau)) * .985;
    if (th > .002) { s1Sheet(c, hv.stay, S1PAPER, 3730 + act); s1Flap(c, hv.flap, cy, th); }
    else {
      s1Sheet(c, cy.reg, S1PAPER, 3740 + act);
      if (tau > a + .4) rline(c, hv.cut, { w: 1.5, color: alpha(P.ink2, .45), dash: [8, 7], seed: 3745 });
      const cu = sm(a + .85, a + 1.45, tau, x => x);
      if (cu > 0) rline(c, hv.cut, { w: 2.5, color: P.ink2, p: cu, seed: 3746, amp: .3 });
    }
    if (act === 0 && tau < a + .3) { const wk = 1 - sm(a - .1, a + .3, tau), { x, y, s } = S1SQ;
      zh(c, '所有的话', x + s / 2, y + s / 2 - 20, { size: 40, color: P.ink2, align: 'center', al: wk });
      zh(c, '= 1', x + s / 2, y + s / 2 + 40, { size: 40, color: P.ink2, align: 'center', al: wk }); }
    // 剪刀：沿折痕剪过去
    const sa = win(a + .7, a + 1.6, tau, .15);
    if (sa > 0) { const [p0, p1] = hv.cut, cu = sm(a + .85, a + 1.45, tau, x => x), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const pos = [lerp(p0[0], p1[0], cu) - Math.cos(ang) * 40 * (1 - sm(a + .7, a + .85, tau)), lerp(p0[1], p1[1], cu) - Math.sin(ang) * 40 * (1 - sm(a + .7, a + .85, tau))];
      s1Scissors(c, pos[0], pos[1], ang, .05 + .22 * Math.abs(Math.sin((tau - a) * 16)), sa); }
  }
  for (const [k, r, sp, u, tc] of pieces) s1PieceLabel(c, k, [r[0] + sp[0], r[1] + sp[1], r[2], r[3]], sm(tc + .1, tc + .45, tau), tau, tc + .1);
}

// ===================== C：书架 =====================
const S1SH = [{ x: 380, key: 'fix', title: '等长暗号', dt: 0 }, { x: 1030, key: 'code', title: '聪明暗号', dt: .3 }];
const S1SW = 520, S1HU = 120, S1BASE = 790, S1ORDER = [3, 2, 1, 0];
function s1Books(sh) { let x = sh.x; return S1ORDER.map(k => { const m = S1MSG[k], w = S1SW / m.d, b = m[sh.key].length, r = { k, x, w, b, h: b * S1HU }; x += w; return r; }); }
function s1Shelf(c, tau, sh, k) {
  const B = S1B, books = s1Books(sh), good = mix(P.green, P.ink, .3), bad = mix(P.red, P.ink, .25), avg = S1AVG(sh.key);
  popup(c, S1BASE, k, () => {
    zh(c, `${sh.title} · 平均 ${s1Num(avg)} 比特`, sh.x, 362, { size: 32, color: P.ink });
    cutPaper(c, rectPts(sh.x - 18, S1BASE, S1SW + 36, 18, 3), P.shelf2, { seed: 3760 + sh.dt * 10, step: 24, blur: 6 });
    const pick = sh.key === 'code' ? sm(B.pick, B.pick + .35, tau, easeOutBack) * (1 - sm(B.fold[0], B.fold[0] + .3, tau)) : 0;
    for (const bk of books) {
      const lift = bk.k === 0 ? pick * 14 : 0, y0 = S1BASE - bk.h - lift;
      cutPaper(c, rectPts(bk.x + 1.5, y0, bk.w - 3, bk.h, 3), S1COL[bk.k], { seed: 3770 + bk.k + sh.dt * 10, step: 26, blur: 5 + lift });
      for (const yy of [y0 + 14, y0 + bk.h - 14]) rline(c, [[bk.x + 6, yy], [bk.x + bk.w - 6, yy]], { w: 2, color: alpha(P.cap, .45), seed: 3780 + bk.k, amp: .3 });
      const cy = y0 + bk.h / 2, name = S1MSG[bk.k].t;
      if (bk.w >= 120) zh(c, name, bk.x + bk.w / 2, cy + 10, { size: Math.min(30, (bk.w - 20) / [...name].length), color: P.cap, align: 'center' });
      else s1Vert(c, name, bk.x + bk.w / 2, cy, Math.min(26, (bk.h - 34) / [...name].length), P.cap);
      zh(c, String(bk.b), bk.x + bk.w / 2, y0 - 12, { size: 28, color: P.ink2, align: 'center', al: sh.key === 'code' && bk.k === 0 ? 1 - sm(B.brace, B.brace + .3, tau) : 1 });
      s1Frac(c, 1, S1MSG[bk.k].d, bk.x + bk.w / 2, S1BASE + 46, 22);
    }
    // 硫酸纸：把这一排书的面积摊平，高度 = 平均比特
    const f = sm(B.fill[0] + sh.dt, B.fill[1] + sh.dt, tau), ly = S1BASE - avg * S1HU * f, ey = S1BASE - S1ENT * S1HU;
    if (f > 0) { vellum(c, rectPts(sh.x, ly, S1SW, S1BASE - ly), { seed: 3790 + sh.dt * 10, al: .7, shadow: false });
      rline(c, [[sh.x, ly], [sh.x + S1SW, ly]], { w: 3, color: P.ink2, seed: 3791, amp: .5 }); }
    // 熵线
    const ek = sm(B.ent, B.ent + .5, tau);
    if (ek > 0) { rline(c, [[sh.x - 10, ey], [sh.x + S1SW + 10, ey]], { w: 2.5, color: alpha(P.ink, .6), dash: [10, 7], p: ek, seed: 3795, amp: .3 });
      zh(c, '熵', sh.x + S1SW + 16, ey + 10, { size: 28, color: P.ink2, al: ek });
      const over = avg - S1ENT, gk = ek * f;
      if (over > 1e-6) { c.save(); c.fillStyle = alpha(bad, .35 * gk); c.fillRect(sh.x, ly, S1SW, ey - ly); c.restore();
        zh(c, `多 ${s1Num(over)}`, sh.x + S1SW, ly - 12, { size: 26, color: bad, align: 'right', al: gk }); }
      else if (gk > 0) rline(c, [[sh.x + S1SW - 70, ey - 22], [sh.x + S1SW - 58, ey - 10], [sh.x + S1SW - 36, ey - 38]], { w: 4, color: good, p: sm(B.ent + .3, B.ent + .7, tau), seed: 3797 });
    }
    if (sh.key === 'code') {
      // 定理蜡封 + 香农 1948
      const sk = sm(B.seal, B.seal + .6, tau, x => x);
      if (sk > 0) { seal(c, 1522, 503, 'thm', { k: sk });
        zh(c, '香农 1948', 1488, 514, { size: 30, color: P.ink, align: 'right', p: writeP(tau, B.shannon, '香农 1948', .08) }); }
      // 那本最矮（也最厚）的书：一半都是它
      const bb = books.find(b => b.k === 0), bk2 = sm(B.brace, B.brace + .4, tau);
      if (bk2 > 0) { const y = S1BASE - bb.h - 20;
        rline(c, [[bb.x + 6, y + 8], [bb.x + 6, y], [bb.x + bb.w - 6, y], [bb.x + bb.w - 6, y + 8]], { w: 2.5, color: P.ink2, p: bk2, seed: 3799, amp: .4 });
        zh(c, '一半的时候都是它', bb.x + bb.w / 2, y - 12, { size: 26, color: P.ink2, align: 'center', al: bk2 }); }
      if (pick > 0) sparkle(c, bb.x + bb.w - 14, S1BASE - bb.h - 14, 16 * win(B.pick, B.pick + 1.2, tau, .3), { color: P.moon });
    }
  }, [sh.x - 18, sh.x + S1SW + 18]);
}
function s1PageC(c, tau) {
  const B = S1B; if (tau < B.toBook[0]) return;
  for (const sh of S1SH) { const k = sm(B.pop + sh.dt, B.pop + sh.dt + .6, tau, easeOutBack) * (1 - sm(B.fold[0], B.fold[1], tau)); if (k > .001) s1Shelf(c, tau, sh, Math.min(1.04, k)); }
}
// 彩蛋：H = Σ p·(−log₂p)
function s1Egg(c, tau) {
  const a = win(S1B.egg[0], S1B.egg[1], tau, .3) * .6; if (a <= 0) return;
  const x = 1500, y = 132, s = 34, A = 'H = Σ p·(−log', Bs = 'p)';
  const wa = zhWidth(c, A, s);
  zh(c, A, x, y, { size: s, color: P.ink2, al: a }); zh(c, '2', x + wa + 1, y + 10, { size: 22, color: P.ink2, al: a }); zh(c, Bs, x + wa + 16, y, { size: s, color: P.ink2, al: a });
}

// ===================== 两个人 =====================
function s1Cast(c, tau, L) {
  const B = S1B, T = S1T, E = S1E;
  const side = sm(B.walk[0], B.walk[1], tau) * (1 - sm(B.home[0], B.home[1], tau));
  const dk = sm(B.toDesk[0], B.toDesk[1], tau) - sm(B.toBook[0], B.toBook[1], tau);
  const hop = t => s1Hop(t, B.walk[0], B.walk[1], 3) + s1Hop(t, B.toDesk[0], B.toDesk[1], 2) + s1Hop(t, B.toBook[0], B.toBook[1], 2) + s1Hop(t, B.home[0], B.home[1], 3);
  // 帕秋莉
  let pp = 'lecture', pm = moodOf(L, 'patchouli'), pg;
  if (tau >= T(3) && tau < E(4)) { pp = 'point'; pg = .55; }
  if (dk > .5) { pp = 'point'; pg = .7; }
  if (tau >= T(9) && tau < E(9)) { pp = 'point'; pg = .8; }
  if (tau >= T(11) && tau < B.home[0]) pp = 'cross';
  drawPatchouli(c, { ...EP3.pch, x: lerp(lerp(EP3.pch.x, 210, side), 290, dk), y: EP3.pch.y - hop(tau), pose: pp, gesture: pg, mood: pm, mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  // 琪露诺
  let cp = 'stand', cm = moodOf(L, 'cirno'), cg, look;
  if (tau > B.taps[0] - .25 && tau < E(0)) { cp = 'point'; cg = .3 + .7 * Math.max(0, ...B.taps.map(t0 => win(t0 - .2, t0 + .15, tau, .12))); look = -.3; }
  if (tau >= T(3) && tau < T(4)) cp = 'think';
  if (tau >= T(6) && tau < B.toDesk[0]) cm = 'happy';
  if (dk > .5) { cp = 'think'; const a0 = B.fold0 + 1.5; if (tau > a0 && tau < a0 + 1.2) { cp = 'proud'; cm = 'proud'; } if (tau > B.fold0 + 2 * B.FC + 1.6) cm = 'surprised'; }
  if (tau >= B.point && tau < E(10) + .2) { cp = 'point'; cg = .9; }
  if (tau >= T(11) && tau < B.home[0]) cm = 'pout';
  drawCirno(c, { ...EP3.cir, x: lerp(lerp(EP3.cir.x, 1750, side), 1720, dk), y: EP3.cir.y - hop(tau + .2), pose: cp, gesture: cg, look, mood: cm, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

function s1Draw(c, tau, L) {
  const B = S1B, px = S1PAN * (sm(B.toDesk[0], B.toDesk[1], tau) - sm(B.toBook[0], B.toBook[1], tau));
  if (px > 0) { c.save(); c.translate(W - px, 0); desk(c); c.restore(); }
  if (px < W) { c.save(); c.translate(-px, 0);
    spread(c, tau); pageHeader(c, '第一页 · 暗号', tau, .9);
    s1PageA(c, tau); s1PageC(c, tau); s1Egg(c, tau);
    c.restore(); }
  if (px > 0) { c.save(); c.globalAlpha *= 1 - sm(B.toBook[0], B.toBook[0] + .45, tau); c.translate(S1PAN - px, 0); s1Fold(c, tau); c.restore(); }
  s1Cast(c, tau, L);
}

scene({ order: 1, key: 'code', title: '暗号', dur: S1DUR, lines: S1LINES, fn: s1Draw });
