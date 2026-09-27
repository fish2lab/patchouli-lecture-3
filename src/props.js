'use strict';
// 第 2 集几段共用的道具和交接位置（主会话维护；场景包只调用，不改。觉得缺东西写进汇报）。
//   EP2        段与段交接时的标准站位：试卷、帕秋莉、琪露诺、水滴落点
//   examPaper  琪露诺的试卷：9 分或 90 分，可以结霜（frost 0..1）
//   waterDrop  一滴水（第 3 段末网络化成的水滴，落到结尾的书页上）
// 顶层名字带 EP2 / ep2 前缀，或是这里列出的三个函数名。

const EP2 = {
  exam: { x: CX, y: 470, w: 440, h: 580, rot: -.045 },   // 试卷中心、宽高、转角：跨在书脊上，像被拍在摊开的书上
  pch: { x: 330, y: 880, h: 500 },                        // 帕秋莉：左页左侧，脚底
  cir: { x: 1600, y: 880, h: 440, facing: -1 },           // 琪露诺：右页，脚底，朝左
  drop: { x: CX, y: 470 },                                // 第 3 段末水滴落点 = 结尾试卷中心
};
const EP2_ICE = '#cfe2ee', EP2_ICE_DEEP = '#9fc3da', EP2_FROST = '#f4fafd';

// examPaper(c, o)：o = { x, y, w, h, rot, score: 9 | 90, frost 0..1, ink 0..1（卷面内容写出比例）, seed }
function examPaper(c, o = {}) {
  const E = { ...EP2.exam, ...o }, { x, y, w, h, rot, score = 9, frost = 0, ink = 1, seed = 3301 } = E;
  c.save(); c.translate(x, y); c.rotate(rot);
  const pts = rectPts(-w / 2, -h / 2, w, h, 4), path = cutPaper(c, pts, '#f6f2e8', { seed, step: 36, blur: 10, sy: 5 });
  c.save(); c.clip(path);
  // 卷头
  zh(c, '期中测验', -w / 2 + 40, -h / 2 + 70, { size: 40, color: P.ink2, p: clamp(ink * 3, 0, 1) });
  zh(c, '姓名：琪露诺', -w / 2 + 40, -h / 2 + 122, { size: 30, color: P.ink2, p: clamp(ink * 3 - .3, 0, 1) });
  // 分数：红笔大字 + 圈
  const good = score >= 60, sx = w / 2 - 92, sy = -h / 2 + 96;
  zh(c, String(score), sx, sy + 40, { size: good ? 96 : 120, color: P.red, align: 'center', p: clamp(ink * 2 - .4, 0, 1) });
  rline(c, ellPts(sx, sy + 4, good ? 82 : 66, 58, 40, -.2), { w: 5, color: P.red, seed: seed + 5, p: clamp(ink * 2 - .6, 0, 1) });
  // 题目：几行墨线，行尾红笔 ✗ / ✓
  for (let k = 0; k < 6; k++) {
    const ly = -h / 2 + 200 + k * 58, len = w * (.5 + .3 * hash(k, seed));
    rline(c, [[-w / 2 + 40, ly], [-w / 2 + 40 + len, ly]], { w: 3, color: alpha(P.ink2, .55), seed: seed + 10 + k, p: clamp(ink * 2 - k * .12, 0, 1) });
    const right = good ? k !== 3 : k === 4, mx = w / 2 - 60, mk = clamp(ink * 2 - 1, 0, 1);
    if (mk > 0) (right ? check : cross)(c, mx, ly - 10, 34, { seed: seed + 20 + k, p: mk });
  }
  // 霜：先蒙一层冰色，再从四个角长出枝状霜花
  if (frost > 0) {
    c.fillStyle = alpha(EP2_ICE, .6 * frost); c.fillRect(-w, -h, w * 2, h * 2);
    for (let k = 0; k < 4; k++) ep2Frost(c, (k % 2 ? 1 : -1) * w / 2, (k < 2 ? -1 : 1) * h / 2, Math.atan2(-(k < 2 ? -1 : 1), -(k % 2 ? 1 : -1)), Math.min(w, h) * .5, frost, seed + 40 + k);
  }
  c.restore(); c.restore();
  return path;
}
// ep2Frost：从 (x, y) 朝 a 方向长一丛枝状霜花，长度 len，长出比例 p
function ep2Frost(c, x, y, a, len, p, seed = 1, depth = 0) {
  if (p <= 0 || depth > 2) return;
  const L = len * Math.min(1, p * (1 + depth * .4)), ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
  rline(c, [[x, y], [ex, ey]], { w: Math.max(1.5, 5 - depth * 1.2), color: alpha(EP2_FROST, .9), seed: seed + depth, amp: .6 });
  const n = 3 - depth;
  for (let i = 1; i <= n; i++) {
    const u = i / (n + 1), bx = x + Math.cos(a) * L * u, by = y + Math.sin(a) * L * u, bp = clamp((p - u * .5) * 1.6, 0, 1);
    for (const s of [-1, 1]) ep2Frost(c, bx, by, a + s * (.7 + .3 * hash(i * 2 + (s > 0), seed)), len * .38 * (1 - u * .4), bp, seed * 3 + i, depth + 1);
  }
}
// waterDrop(c, x, y, r, o)：一滴水（尖朝上），o = { squash 0..1 落地压扁, al }
function waterDrop(c, x, y, r, o = {}) {
  const { squash = 0, al = 1 } = o; if (r <= .5 || al <= 0) return;
  const pts = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, tipk = Math.pow(Math.max(0, -Math.sin(a)), 3);
    pts.push([x + Math.cos(a) * r * (1 - tipk * .85) * (1 + squash * .6), y + Math.sin(a) * r * (1 + tipk * 1.1) * (1 - squash * .55) + squash * r * .4]); }
  c.save(); c.globalAlpha *= al;
  cutPaper(c, pts, EP2_ICE_DEEP, { seed: 3350, step: 10, blur: 6, grain: .05 });
  c.fillStyle = alpha('#ffffff', .75); c.beginPath(); c.ellipse(x - r * .32, y - r * .15, r * .16, r * .28, -.4, 0, TAU); c.fill();
  c.restore();
}
