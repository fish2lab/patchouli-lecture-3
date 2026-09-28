'use strict';
// 第 3 段：预测就是压缩（第三稿，短段约 25 秒）。把第 1 段的猜字和第 2 段的比特接起来，大模型只一句旁证。
//   L0 ★ 左页上角的八音盒先后送出两条纸带（第 1 段那两句话，格宽和孔数按实测比特）：第一条送完挪到上面，第二条在下面。
//        「霜」那格几乎没宽度（紫字 + 引线），「青蛙」一串孔、红晕。说到「预测」时左页手写「预测 = 压缩」，句后停住。
//   L1   纸带和字淡到背景；右页立起一本小魔导书，羽毛笔在它右页写一个「霜」（说到「猜下一个字」时落笔）。琪露诺走近看。
//   L2   前面的全收掉（小书淡到背景）；上方送出一截 16 个孔的纸带，写「16 比特」；说到「3.5 比特」时它被压成 3.5 个孔，
//        原长留一道虚线框，旁边一行小字「本机实测，Qwen3-1.7B」。帕秋莉走到左页中间指着它。
//   段末：全部收掉，两人走回 EP3 站位；开头和最后 0.8 秒只有书页、页眉和两人。
// 站位区：帕秋莉包围框 x 205–455（L2 走到 x 540：415–665），y 380–880；琪露诺 x 1446–1754（L1 走到 x 1470：1316–1624），y 440–880。
//         道具和字只放在 y < 375 的上带、左页 x 480–930 的中带、右页 x 970–1310 的中下带。
// 顶层名字一律带本段前缀 S3 / s3。
const S3LINES = seq(1.5, [
  ['反过来说：猜得越准，要记的就越少。预测，就是压缩。', { hold: 1.3 }],
  ['现在的大语言模型，训练时也只练这一件事：猜下一个字。', { pause: .5, hold: .4 }],
  ['一个汉字在电脑里占 16 比特。让它来猜，只要 3.5 比特左右。', { pause: .5, hold: 1.1 }],
]);
const S3T = i => S3LINES[i][0], S3E = i => S3LINES[i][1];
// S3W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S3W = (i, f) => { const l = S3LINES[i], v = voiceOf(l[2]), h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S3END = seqEnd(S3LINES), S3DUR = S3END + 1.5;

// ===================== 数据（全部从 BITS 来） =====================
const S3U = 22, S3MINW = 10, S3TH = 64;
function s3Geo(key) {
  const d = BITS.lines[key], ws = d.bits.map(b => Math.max(S3MINW, b * S3U)), xs = []; let acc = 0;
  for (const w of ws) { xs.push(acc + w / 2); acc += w; }
  return { chars: d.chars, bits: d.bits, ws, xs, len: acc };
}
const S3GA = s3Geo('床前明月光，疑是地上霜。'), S3GB = s3Geo('今天的晚饭是冰冻青蛙！');
// 只标关键的字：[格子序号, 颜色, 标签相对格子中心的横向偏移（窄格子用引线拉开）]
const S3KA = [[S3GA.chars.indexOf('床'), 'ink', 0], [S3GA.chars.indexOf('霜'), 'purple', 46]];
const S3KB = [[S3GB.chars.indexOf('青'), 'red', 0], [S3GB.chars.indexOf('蛙'), 'red', 0]];
const S3GBK = BITS.dial.new.gbk, S3LM = BITS.dial.new.model;        // 16、3.46 比特 / 字
const s3Round = b => String(Math.round(b * 10) / 10);

// ===================== 布局 =====================
const S3BOX = { x: 150, s: .7 };                                     // 八音盒（左页左上角），纸带从它右边的缝出来
const S3X0 = S3BOX.x + TAPE.box.x * S3BOX.s;                          // 纸带左端
const S3YA = 228, S3YB = 350;                                        // 第一条（送完挪上去）、第二条
const S3EQ = { x: 490, y: 640, size: 78 };                            // 「预测 = 压缩」
const S3BK = { x: 1142, y: 728, s: .48, hw: 340, hh: 185 };           // 小魔导书：中心、缩放、本地半宽半高
const S3BIG = { x: 520, y: 222, unit: 50, h: 60 };                    // 16 → 3.5 的纸带
const S3PCH = { home: EP3.pch.x, near: 540 }, S3CIR = { home: EP3.cir.x, near: 1470 };

// ===================== 节拍（全部由台词时间推出） =====================
const S3B = (() => {
  const T = S3T, E = S3E, w = S3W, B = {};
  B.box = [.8, 1.25];
  B.feedA = [1.2, w(0, .17)];                         // 「反过来说」时送第一条
  B.frost = w(0, .22);                                // 「猜得越准」：霜那格点亮
  B.up = [w(0, .3), w(0, .3) + .45];                  // 第一条挪上去
  B.feedB = [w(0, .36), w(0, .63)];                   // 「要记的就越少」时送第二条（对照：猜不到的一串孔）
  B.eq = w(0, .71);                                   // 「预测」
  B.dim1 = [T(1) - .2, T(1) + .3];                    // L1：纸带和字淡到背景
  B.book = [T(1) + .05, T(1) + .55];                  // 小魔导书立起
  B.cwalk = [T(1) + .3, T(1) + 1.5];                  // 琪露诺走近
  B.write = w(1, .82);                                // 「猜下一个字」落笔
  B.clear2 = [T(2) - .35, T(2) + .05];                // L2：前面的收掉
  B.dimBook = [T(2) - .2, T(2) + .3];
  B.pwalk = [T(2) - .1, T(2) + 1.1];                  // 帕秋莉走到左页中间
  B.big = [T(2) + .1, w(2, .28)];                     // 16 个孔的纸带送出来
  B.l16 = w(2, .3);                                   // 「16 比特」
  B.squeeze = [w(2, .7), w(2, .7) + .8];              // 「只要 3.5 比特」：压短
  B.l35 = w(2, .76); B.note = w(2, .88);
  B.clearEnd = [S3END - .15, S3END + .3];
  B.home = [S3END, S3END + .65];
  return B;
})();

// ===================== 小画具 =====================
// 纸带送出：进度 0..1 → tape 的 p、punch（按格子逐格打孔）
function s3Feed(tau, [a, b], n) { const u = clamp((tau - a) / (b - a), 0, 1); return { p: u, punch: Math.floor(u * n + 1e-6) / n, u }; }
// 一条句子纸带 + 关键字（引线指到格子）
function s3Sentence(c, G, keys, y, f, o = {}) {
  const hot = o.hot || [], cells = G.bits.map((b, i) => ({ bits: b, hot: hot.includes(i) && f.u * G.len > G.xs[i] + G.ws[i] / 2 ? 1 : 0 }));
  tape(c, { x: S3X0, y, cells, unit: S3U, minW: S3MINW, h: S3TH, p: f.p, punch: f.punch });
  for (const [i, col, dx] of keys) {
    const cx = S3X0 + G.xs[i], shown = f.u * G.len > G.xs[i] + G.ws[i] / 2; if (!shown) continue;
    const lit = col === 'purple' ? (o.lit ?? 1) : 1, color = col === 'purple' ? mix(P.ink, P.purple, lit) : col === 'red' ? P.red : P.ink;
    const lx = cx + dx, ly = y - S3TH / 2 - 16;
    zh(c, G.chars[i], lx, ly, { size: 36, color, align: 'center' });
    if (dx) rline(c, [[lx - 12, ly - 12], [cx + 1, y - S3TH / 2 + 2]], { w: 1.6, color: alpha(color, .7), seed: 3811 + i, amp: .3 });
    if (col === 'purple' && lit > 0) {   // 霜那格：一圈淡紫小圈，指出它几乎没有宽度
      c.save(); c.globalAlpha *= lit; c.strokeStyle = alpha(P.purple, .8); c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, y, 13, S3TH / 2 + 6, 0, 0, TAU); c.stroke(); c.restore();
    }
  }
}

// 小魔导书（立起的剪纸书）：inner 在书的本地坐标里画
function s3Book(c, k, inner) {
  const { x, y, s, hw, hh } = S3BK;
  popup(c, y + hh * s, clamp(k, 0, 1.2), () => {
    c.save(); c.translate(x, y); c.scale(s, s);
    cutPaper(c, rectPts(-hw - 16, -hh - 12, hw * 2 + 32, hh * 2 + 26, 8), mix(P.purple, P.ink, .45), { seed: 3601, step: 30, blur: 12, sy: 6 });
    for (let k = 4; k >= 1; k--) cutPaper(c, rectPts(-hw + 4 - k * 2, -hh + 4 + k * 3, hw * 2 - 8 + k * 4, hh * 2, 3), mix(BOOK.page2, '#000000', .05 * k), { seed: 3602 + k, step: 50, shadow: false, grain: 0 });
    for (const sd of [-1, 1]) {
      const path = cutPaper(c, rectPts(sd < 0 ? -hw : 2, -hh, hw - 2, hh * 2, 3), '#efe6d2', { seed: 3610 + sd, step: 50, shadow: false, grain: .12, edge: false });
      c.save(); c.clip(path); const g = c.createLinearGradient(0, 0, sd * 90, 0); g.addColorStop(0, 'rgba(60,40,20,.28)'); g.addColorStop(1, 'rgba(60,40,20,0)'); c.fillStyle = g; c.fillRect(-hw, -hh, hw * 2, hh * 2); c.restore();
    }
    // 左页：几行已经写过的字，只画成淡墨线（不写具体的字）
    for (let r = 0; r < 4; r++) rline(c, [[-hw + 40, -110 + r * 62], [-40 - (r === 3 ? 140 : hash(r, 3801) * 40), -110 + r * 62]], { w: 5, color: alpha(P.ink2, .28), seed: 3620 + r, amp: 2.2 });
    inner(c);
    c.restore();
  }, [x - (hw + 16) * s, x + (hw + 16) * s]);
}
// 羽毛笔：笔尖在 (x, y)，杆往右上斜（本地坐标）
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

// ===================== 各块画面 =====================
// L0：八音盒 + 两条句子纸带 + 「预测 = 压缩」
function s3Tapes(c, tau) {
  const B = S3B, dim = lerp(1, .3, sm(B.dim1[0], B.dim1[1], tau)) * (1 - sm(B.clear2[0], B.clear2[1], tau));
  if (dim <= 0 || tau < B.box[0]) return;
  const fa = s3Feed(tau, B.feedA, S3GA.bits.length), fb = s3Feed(tau, B.feedB, S3GB.bits.length);
  fade(c, dim, () => {
    const bk = sm(B.box[0], B.box[1], tau, easeOutBack), by = S3YB - TAPE.box.y * S3BOX.s;
    pop(c, S3BOX.x, by, bk, () => tapeBox(c, S3BOX.x, by, S3BOX.s, (fa.u * S3GA.len + fb.u * S3GB.len) / 90, { play: tau < B.feedB[1] ? 1 : 0 }));
    const ya = lerp(S3YB, S3YA, sm(B.up[0], B.up[1], tau));
    if (fa.u > 0) s3Sentence(c, S3GA, S3KA, ya, fa, { lit: sm(B.frost, B.frost + .35, tau) });
    if (fb.u > 0) s3Sentence(c, S3GB, S3KB, S3YB, fb, { hot: S3KB.map(q => q[0]) });
  });
  const eq = '预测 = 压缩', ek = 1 - sm(B.clear2[0], B.clear2[1], tau);
  if (tau > B.eq && ek > 0) fade(c, ek * lerp(1, .3, sm(B.dim1[0], B.dim1[1], tau)), () => {
    zh(c, eq, S3EQ.x, S3EQ.y, { size: S3EQ.size, color: P.ink, p: writeP(tau, B.eq, eq, .12) });
    const u = sm(B.eq + .75, B.eq + 1.1, tau);
    if (u > 0) rline(c, [[S3EQ.x - 4, S3EQ.y + 22], [S3EQ.x + zhWidth(c, eq, S3EQ.size) + 6, S3EQ.y + 18]], { w: 3, color: alpha(P.purple, .7), seed: 3821, p: u, amp: 1.2 });
  });
}
// L1：小魔导书写「霜」
function s3Grimoire(c, tau) {
  const B = S3B, k = easeOutBack(clamp((tau - B.book[0]) / (B.book[1] - B.book[0]), 0, 1), 1.6), al = lerp(1, .3, sm(B.dimBook[0], B.dimBook[1], tau)) * (1 - sm(B.clearEnd[0], B.clearEnd[1], tau));
  if (k <= 0 || al <= 0) return;
  // 羽毛笔：先在右页上方悬着，落笔时划两下写出字，再抬起
  const at = [170, 30], rest = [250, -60], K = [[B.book[1], rest], [B.write - .35, [at[0] - 20, at[1] - 70]], [B.write, [at[0] - 30, at[1] - 30]], [B.write + .25, [at[0] + 20, at[1] - 10]], [B.write + .45, [at[0] + 10, at[1] + 20]], [B.write + 1.0, rest]];
  fade(c, al, () => s3Book(c, k, g => {
    const wk = sm(B.write, B.write + .45, tau, x => x);
    if (wk > 0) { g.save(); g.beginPath(); g.rect(at[0] - 80, at[1] - 120, 160, 160 * wk); g.clip(); zh(g, '霜', at[0], at[1], { size: 120, color: P.ink, align: 'center' }); g.restore(); }
    const [qx, qy] = key(tau, K);
    s3Quill(g, qx, qy + Math.sin(tau * 6) * 3, sm(B.book[1] - .1, B.book[1] + .2, tau));
  }));
}
// L2：16 个孔 → 3.5 个孔
function s3Squeeze(c, tau) {
  const B = S3B, out = 1 - sm(B.clearEnd[0], B.clearEnd[1], tau); if (tau < B.big[0] || out <= 0) return;
  const G = S3BIG, full = S3GBK * G.unit, short = S3LM * G.unit, f = clamp((tau - B.big[0]) / (B.big[1] - B.big[0]), 0, 1);
  const q = sm(B.squeeze[0], B.squeeze[1], tau), cells16 = Array.from({ length: Math.round(S3GBK) }, () => ({ bits: 1 }));
  const cells35 = []; for (let b = S3LM; b > 1e-6; b -= 1) cells35.push({ bits: Math.min(1, b) });
  fade(c, out, () => {
    // 原长：压短以后留一道虚线框
    if (q > 0) rline(c, rectPts(G.x, G.y - G.h / 2, full, G.h, 3), { w: 2, color: alpha(P.ink2, .45 * q), close: true, dash: [8, 7], seed: 3831, amp: .4 });
    // 16 个孔的纸带：压短时整条横向挤扁、同时换成 3.5 个孔那条
    if (q < 1) { c.save(); c.translate(G.x, 0); c.scale(lerp(1, short / full, q), 1); c.translate(-G.x, 0);
      tape(c, { x: G.x, y: G.y, cells: cells16, unit: G.unit, h: G.h, rows: 1, p: f, punch: Math.floor(f * 16 + 1e-6) / 16, al: 1 - sm(.55, 1, q, x => x) }); c.restore(); }
    if (q > .55) tape(c, { x: G.x, y: G.y, cells: cells35, unit: G.unit, h: G.h, rows: 1, p: 1, punch: 1, al: sm(.55, 1, q, x => x) });
    const l16 = '16 比特', a16 = sm(B.l16, B.l16 + .3, tau);
    if (a16 > 0) zh(c, l16, G.x + full + 26, G.y + 20, { size: 56, color: P.ink, p: writeP(tau, B.l16, l16, .08), al: lerp(1, .4, q) });
    const l35 = s3Round(S3LM) + ' 比特';
    // 「3.5 比特」写在短纸带正下方（不压原长的虚线框），小字再下一行；都在帕秋莉包围框顶（y 380）以上
    if (tau > B.l35) zh(c, l35, G.x, G.y + G.h / 2 + 62, { size: 56, color: P.purple, p: writeP(tau, B.l35, l35, .08) });
    const nt = '本机实测，' + BITS.model.split('/').pop().replace(/-Base$/, '');
    zh(c, nt, G.x, G.y + G.h / 2 + 106, { size: 26, color: P.g2, al: sm(B.note, B.note + .4, tau) });
  });
}

// ===================== 角色 =====================
function s3Walk(tau, a, b) { const u = (tau - a) / (b - a); return u > 0 && u < 1 ? Math.abs(Math.sin(u * Math.PI * Math.max(2, Math.round((b - a) * 3.2)))) * 16 : 0; }
function s3Chars(c, tau, L) {
  const B = S3B, T = S3T, E = S3E, home = sm(B.home[0], B.home[1], tau), std = tau < B.box[0] || tau >= B.home[1] - .05;
  // 帕秋莉：L2 走到左页中间，指着上面的纸带；段末走回
  const pgo = sm(B.pwalk[0], B.pwalk[1], tau), px = lerp(lerp(S3PCH.home, S3PCH.near, pgo), S3PCH.home, home);
  const pmove = (tau > B.pwalk[0] && tau < B.pwalk[1]) || (tau > B.home[0] && tau < B.home[1]);
  let po = { pose: 'lecture' }, pm = moodOf(L, 'patchouli');
  if (!std) {
    if (pmove) po = { pose: 'stand', facing: tau < B.pwalk[1] ? 1 : -1 };
    else if (tau > B.eq - .1 && tau < E(0)) po = { pose: 'lecture', gesture: .9 };
    else if (tau > B.l16 && tau < B.home[0]) { po = { pose: 'point', look: .6 }; if (tau > B.l35) pm = 'smug'; }
  }
  const pw = s3Walk(tau, B.pwalk[0], B.pwalk[1]) + s3Walk(tau, B.home[0], B.home[1]);
  drawPatchouli(c, { ...EP3.pch, x: px, y: EP3.pch.y - pw, ...po, mood: pm, mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  // 琪露诺：L1 走近小魔导书看它写字；段末走回
  const cgo = sm(B.cwalk[0], B.cwalk[1], tau), cx = lerp(lerp(S3CIR.home, S3CIR.near, cgo), S3CIR.home, home);
  const cmove = (tau > B.cwalk[0] && tau < B.cwalk[1]) || (tau > B.home[0] && tau < B.home[1]);
  let co = { pose: 'stand' }, cm = moodOf(L, 'cirno');
  if (!std && !cmove) {
    if (tau > B.feedB[0] && tau < E(0)) co = { pose: 'stand', look: .3 };
    else if (tau >= B.cwalk[1] && tau < B.write) { co = { pose: 'think' }; cm = 'confused'; }
    else if (tau >= B.write && tau < T(2)) cm = 'surprised';
    else if (tau >= B.l35 && tau < B.home[0]) cm = 'surprised';
  }
  const cw = s3Walk(tau, B.cwalk[0], B.cwalk[1]) + s3Walk(tau, B.home[0], B.home[1]);
  drawCirno(c, { ...EP3.cir, x: cx, y: EP3.cir.y - cw * .8, ...co, mood: cm, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

// ===================== 主画面 =====================
function s3Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第三页 · 预测就是压缩', tau, .9);
  s3Tapes(c, tau);
  s3Grimoire(c, tau);
  s3Squeeze(c, tau);
  s3Chars(c, tau, L);
}

scene({ order: 3, key: 'compress', title: '压缩', dur: S3DUR, lines: S3LINES, fn: s3Draw });
