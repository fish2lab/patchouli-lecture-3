'use strict';
// 第 1 段：猜字——什么是信息（第三稿，给零基础观众；慢、空、先问再揭晓）。
//   L0 玩个游戏      书页上画出一行作文格（左页 6 格、右页 5 格，书脊处空开）；帕秋莉走到格子左边，琪露诺退到右边。
//   L1 床前明月光    帕秋莉一字一字写（跟语音走），最后一格画「——」；停约 1 秒让观众猜；上方立起候选条（BITS.next 前 4 名）。
//   L2 霜！          琪露诺跳起来抢答；「霜」写进空格，候选条上「霜」那根变紫。
//   L3 不用说        候选条收起；说到「不用说」时「霜」变成浅灰虚线字。
//   L4 再来          第一行淡到 .3；第二行格子画出，写「今天的晚饭是冰冻」+「——」；停一下；候选条（的、鸡、虾、三，没有「青」）。
//   L5 冰冻什么      琪露诺歪头、冒问号。
//   L6 青蛙          候选条收起；「青蛙」用压暗的红写进格子，炸开红色小星火。
//   L7 这谁猜得到    琪露诺鼓腮跺脚。
//   L8 ★ 猜不到的字  说到「猜不到的字」时两行里猜得到的字全部淡掉，只剩「青蛙」亮着；停约 1.4 秒。
//   段末：格子收掉，两人走回 EP3 标准站位；最后 0.8 秒只剩书页 + 页眉 + 两人。
// 所有节拍由 S1LINES 和语音进度推出；候选字和概率从 BITS.next 读。顶层名字一律带本段前缀 S1 / s1。
const S1LINES = seq(1.0, [
  ['玩个游戏。我说上半句，你猜下一个字。', { hold: .5 }],
  ['床前明月光，疑是地上——', { hold: 2.5 }],
  ['霜！', { who: 'cirno', mood: 'proud', hold: .5 }],
  ['猜中了。所以这个字，我其实不用说。', { mood: 'smug', hold: .9 }],
  ['再来。今天的晚饭是冰冻——', { pause: .3, hold: 2.5 }],
  ['……冰冻什么？', { who: 'cirno', mood: 'confused', hold: .5 }],
  ['青蛙。', { mood: 'smug', hold: 1.1 }],
  ['这谁猜得到啊！', { who: 'cirno', mood: 'pout', hold: .3 }],
  ['对。猜不到的字，才真正带来了消息。', { hold: 1.4 }],
]);
const S1T = i => S1LINES[i][0], S1E = i => S1LINES[i][1];
// S1W：第 i 句说到 f（0..1）处的时间（按语音长度，不含句尾 hold）
const S1W = (i, f) => { const l = S1LINES[i], v = voiceOf(l[2]), h = (l[3] && l[3].hold) || 0; return l[0] + f * (v ? v.d : Math.max(.6, l[1] - l[0] - h - .3)); };
const S1END = seqEnd(S1LINES);
const S1DUR = S1END + 2.5;

// ===================== 格子（作文格） =====================
// 两行共用一套格子：左页 6 格（340..928），右页 5 格（992..1482），书脊 CX±32 空着。人物站位区：帕秋莉 x≤325，琪露诺 x≥1536。
const S1C = 98, S1GX = [340, 992], S1RY = [380, 540];               // 格子边长、左右两组的起点、两行格子的上沿
const S1ROWS = [
  { l: '床前明月光，', r: '疑是地上', blank: 1, key: '床前明月光，疑是地上', ans: '霜' },
  { l: '今天的晚饭是', r: '冰冻', blank: 2, key: '今天的晚饭是冰冻', ans: '青蛙' },
];
// 第 r 行第 k 个格子（0 起，左页在前）的左上角
function s1Cell(r, k) { const left = k < 6; return [left ? S1GX[0] + k * S1C : S1GX[1] + (k - 6) * S1C, S1RY[r]]; }
const s1Chars = r => [...S1ROWS[r].l, ...S1ROWS[r].r];                  // 上半句的字
const s1NCells = r => 6 + [...S1ROWS[r].r].length + S1ROWS[r].blank;   // 这一行画几格

// ===================== 节拍（全部由台词时间算出） =====================
const S1B = (() => { const t = S1T, e = S1E, w = S1W, B = {};
  const vEnd = i => w(i, 1);
  // L0：两人让位，格子画出
  B.move = [t(0) + .1, t(0) + 1.3];
  B.grid0 = [w(0, .15), w(0, .55)];
  // L1：逐字写（语音里约 88% 处说完上半句，「——」在句尾）；停 1 秒；候选条立起
  const n0 = s1Chars(0).length;
  B.write0 = s1Chars(0).map((ch, i) => w(1, .02 + .8 * i / n0));
  B.dash0 = w(1, .86);
  B.panel0 = [vEnd(1) + 1.0, t(3) + .1];
  // L2：霜
  B.ans0 = t(2) + .05; B.jump = [t(2) - .05, t(2) + .5];
  // L3：说到「不用说」时变虚线（「不用说」从第 13 个字开始）
  B.hollow = w(3, 13 / 17);
  // L4：第一行淡掉，第二行
  B.dim0 = [t(4), t(4) + .5];
  B.grid1 = [t(4) + .1, w(4, .22)];
  const n1 = s1Chars(1).length;
  B.write1 = s1Chars(1).map((ch, i) => w(4, (3 + i) / 13 * .92));
  B.dash1 = w(4, .88);
  B.panel1 = [vEnd(4) + 1.0, t(6) + .05];
  // L5：歪头；L6：青蛙；L7：跺脚
  B.ans1 = [t(6) + .02, t(6) + .24];
  // L8 ★：说到「猜不到的字」淡掉其余的字
  B.fade = [w(8, .1), w(8, .38)];
  // 段末：格子收掉、走回站位，最后 0.8 秒是标准画面
  B.clear = [S1END + .05, S1END + .55];
  B.home = [S1END + .3, S1DUR - .9];
  return B; })();

// ===================== 小画具 =====================
const s1Pct = p => (p * 100 < 1 ? (p * 100).toFixed(2) : (p * 100).toFixed(1)) + '%';
// 一个格子里的字：写出时从上方 8 像素落下并淡入（手写一笔的感觉）。hollow 0..1 变成浅灰虚线字
function s1Glyph(c, ch, r, k, u, o = {}) {
  if (u <= 0) return;
  const [x, y] = s1Cell(r, k), cx = x + S1C / 2, by = y + S1C / 2 + 26, dy = (1 - easeOut(clamp(u, 0, 1))) * -8;
  const { color = P.ink, hollow = 0, al = 1 } = o, a = clamp(u, 0, 1) * al;
  if (hollow < 1) zh(c, ch, cx, by + dy, { size: 72, color, align: 'center', al: a * (1 - hollow) });
  if (hollow > 0) { c.save(); c.globalAlpha *= a * hollow; c.font = `400 72px ${ZH_STACK}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = alpha(P.g1, .6); c.fillText(ch, cx, by + dy);
    c.setLineDash([7, 6]); c.lineWidth = 1.4; c.strokeStyle = alpha(P.g2, .8); c.strokeText(ch, cx, by + dy); c.restore(); }
}
// 一行格子：p 0..1 画出比例（一格接一格），al 整行透明度
function s1Grid(c, r, p, al) {
  if (p <= 0 || al <= 0) return;
  const n = s1NCells(r);
  fade(c, al, () => { for (let k = 0; k < n; k++) { const u = clamp(p * n - k, 0, 1); if (u <= 0) break;
    const [x, y] = s1Cell(r, k);
    rline(c, rectPts(x + 3, y + 3, S1C - 6, S1C - 6), { w: 2, color: alpha(P.g2, .75), close: true, seed: 4100 + r * 20 + k, amp: .5, p: u }); } });
}
// 空格里的「——」
function s1Dash(c, r, k, u, al = 1) {
  if (u <= 0) return;
  const [x, y] = s1Cell(r, k), m = y + S1C / 2;
  rline(c, [[x + 16, m], [x + S1C - 16, m]], { w: 4, color: alpha(P.ink2, al), seed: 4150 + r, amp: .6, p: u });
}
// 候选条：底边中心 (cx, base)，从书页上立起来（popup）。list = [[字, 概率]]，hi = 被猜中的那个字
function s1Panel(c, cx, base, list, k, grow, hi = null) {
  if (k <= .001) return;
  const cw = 92, w = list.length * cw + 40, h = 238, x = cx - w / 2, y = base - h, maxH = 128, bot = base - 58;
  popup(c, base, k, () => {
    cutPaper(c, rectPts(x, y, w, h, 6), '#f4efe2', { seed: 4200, step: 24, blur: 6, sy: 3, grain: .08 });
    list.forEach(([ch, p], j) => {
      const bx = x + 20 + cw * (j + .5), u = sm(j * .08, j * .08 + .6, grow), bh = Math.max(3, p * maxH) * u, on = ch === hi;
      if (u > 0) cutPaper(c, rectPts(bx - 20, bot - bh, 40, bh), on ? P.purple : P.g2, { seed: 4210 + j, step: 10, blur: 2, sx: 1, sy: 1.5, grain: .05 });
      zh(c, ch, bx, base - 16, { size: 38, color: on ? P.purple : P.ink, align: 'center' });
      zh(c, s1Pct(p), bx, bot - bh - 10, { size: 22, color: on ? P.purple : P.ink2, align: 'center', al: u });
    });
  }, [x, x + w]);
}
// 红色惊讶火花（第 2 集的小星火）
function s1Spark(c, x, y, r, rot, a) {
  if (r <= .5 || a <= 0) return;
  c.save(); c.globalAlpha *= a; c.fillStyle = P.red; c.fill(polyPath(starPts(x, y, r, 7, .42, rot)));
  c.fillStyle = mix(P.red, '#fff4e0', .45); c.beginPath(); c.arc(x, y, r * .26, 0, TAU); c.fill(); c.restore();
}
const S1FROG = mix(P.red, P.ink, .18);   // 压暗的红

// ===================== 书页内容 =====================
function s1Page(c, tau) {
  const B = S1B, gone = 1 - sm(B.clear[0], B.clear[1], tau);
  if (gone <= 0) return;
  // 各行透明度：第二行出现时第一行淡到 .3；★ 句除「青蛙」外都淡到 .22
  const fd = sm(B.fade[0], B.fade[1], tau);
  const al0 = lerp(lerp(1, .3, sm(B.dim0[0], B.dim0[1], tau)), .22, fd) * gone;
  const al1 = lerp(1, .22, fd) * gone;
  fade(c, 1, () => {
    // 第一行
    s1Grid(c, 0, sm(B.grid0[0], B.grid0[1], tau, x => x), al0);
    const ch0 = s1Chars(0), bk0 = ch0.length;
    ch0.forEach((ch, i) => s1Glyph(c, ch, 0, i, (tau - B.write0[i]) / .18, { al: al0 }));
    const ans0 = clamp((tau - B.ans0) / .2, 0, 1);
    s1Dash(c, 0, bk0, sm(B.dash0, B.dash0 + .3, tau), (1 - ans0) * al0);
    s1Glyph(c, '霜', 0, bk0, ans0, { al: al0, hollow: sm(B.hollow, B.hollow + .5, tau) });
    // 第二行
    s1Grid(c, 1, sm(B.grid1[0], B.grid1[1], tau, x => x), al1);
    const ch1 = s1Chars(1), bk1 = ch1.length;
    ch1.forEach((ch, i) => s1Glyph(c, ch, 1, i, (tau - B.write1[i]) / .18, { al: al1 }));
    const a1 = clamp((tau - B.ans1[0]) / .2, 0, 1);
    const a2 = clamp((tau - B.ans1[1]) / .2, 0, 1);   // 「——」占两格：青、蛙各盖掉一格
    s1Dash(c, 1, bk1, sm(B.dash1, B.dash1 + .3, tau), (1 - a1) * al1);
    s1Dash(c, 1, bk1 + 1, sm(B.dash1 + .15, B.dash1 + .45, tau), (1 - a2) * al1);
    [...'青蛙'].forEach((ch, j) => s1Glyph(c, ch, 1, bk1 + j, (tau - B.ans1[j]) / .2, { color: S1FROG, al: gone }));
  });
  // 青蛙：写进格子那一刻炸开一圈红色小星火，之后格子上方留一颗
  [0, 1].forEach(j => { const t0 = B.ans1[j] + .1, u = (tau - t0) / .9; if (tau < t0) return;
    const [x, y] = s1Cell(1, s1Chars(1).length + j), cx = x + S1C / 2, cy = y + S1C / 2;
    if (u < 1) for (let k = 0; k < 7; k++) { const an = k / 7 * TAU + j * .45, rr = 40 + 50 * easeOut(u);
      s1Spark(c, cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * .85, 9 * (1 - .5 * u), tau * 4 + k, 1 - sm(.6, 1, u)); }
    if (j === 1) netSparkPiece(c, cx + 34, y - 18, 16 * (u < .3 ? easeOutBack(clamp(u / .3, 0, 1)) : 1), tau * 2, gone, 4250);
  });
  // 候选条：立在这一行空格的正上方（第一行空格在右页第 5 格；第二行在右页第 3 格，这时第一行已淡）
  const pan = (r, P0, hi) => { const [a, b] = P0, k = Math.min(sm(a, a + .45, tau, easeOut), 1 - sm(b, b + .35, tau)); if (k <= 0) return;
    const [x] = s1Cell(r, s1Chars(r).length), cx = clamp(x + S1C / 2, BOOK.R.x + 230, 1480);
    s1Panel(c, cx, S1RY[0] - 28, BITS.next[S1ROWS[r].key].slice(0, 4), k, sm(a + .2, a + 1.1, tau, x => x), hi); };
  pan(0, B.panel0, tau >= B.ans0 ? '霜' : null);
  pan(1, B.panel1, null);
}

// ===================== 角色 =====================
// 帕秋莉：标准站位 330 → 格子左边 212；琪露诺：1600 → 格子右边 1680（包围框都留在书页里，不碰格子）。段末走回。
const S1PX = [330, 212], S1CXS = [1600, 1680];
function s1Bob(tau, a, b, n = 4) { const u = (tau - a) / (b - a); return u > 0 && u < 1 ? Math.abs(Math.sin(u * Math.PI * n)) * 12 : 0; }
function s1Cast(c, tau, L) {
  const B = S1B, t = S1T, e = S1E, go = sm(B.move[0], B.move[1], tau), back = sm(B.home[0], B.home[1], tau);
  const u = go * (1 - back), px = lerp(S1PX[0], S1PX[1], u), cxp = lerp(S1CXS[0], S1CXS[1], u);
  const walking = (tau > B.move[0] && tau < B.move[1]) || (tau > B.home[0] && tau < B.home[1]);
  const std = tau < B.move[0] || tau >= B.home[1];
  const bob = s1Bob(tau, B.move[0], B.move[1]) + s1Bob(tau, B.home[0], B.home[1]);
  // 帕秋莉
  let po = { pose: 'lecture' }, pm = moodOf(L, 'patchouli');
  if (walking) po = { pose: 'stand', facing: tau < B.move[1] ? -1 : 1 };
  else if (!std) {
    if (tau >= t(1) && tau < B.panel0[0]) po = { pose: 'point', gesture: .55 };                 // 写字
    else if (tau >= B.panel0[0] && tau < t(2)) { po = { pose: 'cross' }; pm = 'smug'; }        // 等观众猜
    else if (tau >= t(4) && tau < B.panel1[0]) po = { pose: 'point', gesture: .55 };
    else if (tau >= B.panel1[0] && tau < t(6)) { po = { pose: 'cross' }; pm = 'smug'; }
    else if (tau >= t(6) && tau < e(6)) po = { pose: 'point', gesture: .75 };
    else if (tau >= t(7) && tau < e(7)) { po = { pose: 'stand' }; pm = 'smug'; }
    else po = { pose: 'lecture', gesture: .4 };
  }
  // 走到左边时朝左走，站定后转身朝右（面向格子）
  drawPatchouli(c, { ...EP3.pch, x: px, y: EP3.pch.y - bob, ...po, mood: pm, mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau });
  // 琪露诺
  let co = { pose: 'stand' }, cm = moodOf(L, 'cirno'), tilt = 0, hop = 0;
  if (!std && !walking) {
    if (tau >= B.panel0[0] && tau < t(2)) { co = { pose: 'think' }; cm = 'normal'; }
    else if (tau >= t(2) && tau < t(3)) { co = { pose: 'proud', gesture: .9 }; hop = Math.sin(clamp((tau - B.jump[0]) / (B.jump[1] - B.jump[0]), 0, 1) * Math.PI) * 70; }
    else if (tau >= t(3) && tau < t(4)) cm = 'happy';
    else if (tau >= B.panel1[0] && tau < t(5)) { co = { pose: 'think' }; }
    else if (tau >= t(5) && tau < t(6)) { co = { pose: 'think' }; cm = 'confused'; tilt = .22 * sm(t(5), t(5) + .3, tau); }
    else if (tau >= t(6) && tau < t(7)) cm = 'surprised';
    else if (tau >= t(7) && tau < e(7)) { cm = 'pout'; hop = Math.abs(Math.sin((tau - t(7)) * Math.PI * 3.2)) * 16 * (1 - sm(e(7) - .4, e(7), tau)); }
    else if (tau >= t(8)) cm = tau > B.fade[1] ? 'surprised' : 'normal';
  }
  drawCirno(c, { ...EP3.cir, x: cxp, y: EP3.cir.y - bob * .8 - hop, ...co, tilt, mood: cm, mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau });
}

function s1Draw(c, tau, L) {
  spread(c, tau);
  pageHeader(c, '第一页 · 猜字', tau, .9);
  s1Page(c, tau);
  s1Cast(c, tau, L);
}

scene({ order: 1, key: 'guess', title: '猜字', dur: S1DUR, lines: S1LINES, fn: s1Draw });
