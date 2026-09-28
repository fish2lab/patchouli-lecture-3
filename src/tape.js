'use strict';
// 八音盒纸带和证据蜡封：第 3 集全片共用的两件画具（T 包负责实现，接口由主会话定，其他包只调用、不改）。
// 骨架里是能跑的简版，T 包按同一接口做成成品；场景只依赖下面写明的参数和返回值。
//
// tape(c, o)  画一条八音盒打孔纸带（一个孔 = 1 比特）。o 全是纯数据：
//   x, y        纸带左端中线的位置；rot 转角（弧度）
//   cells       格子数组，每格 { bits: 比特数（可以是小数）, ch: 格子上方手写的字（可选）, hot: 0..1 红色强调（惊讶火花那一格） }
//               一格的宽度按 bits 伸缩：w = max(minW, bits × unit)；孔按 bits 取整打在格子里（小数部分画成半透明的孔）
//   unit        每比特多宽（像素），默认 22；minW 一格最窄，默认 10
//   h           纸带高，默认 64；rows 孔排成几行，默认 2
//   p           0..1 纸带从左往右「送出来」的比例（按总长）；punch 0..1 孔打出来的比例（按格子顺序）
//   roll        0..1 右端卷成一卷的程度（0 平摊，1 全部卷起，只剩一个纸卷）
//   al          整体透明度
//   返回 { len 纸带总长, at(i) 第 i 格中心的 [x, y] }，场景拿它对准火花、字、手指
// tapeBox(c, x, y, s, t)  八音盒本体（一个小木盒 + 摇柄 + 梳齿），纸带从它右侧的缝里出来；t 让摇柄转
// seal(c, x, y, kind, o)  证据蜡封：kind = 'thm' 定理 | 'exp' 实验 | 'corr' 相关 | 'hyp' 假说，盖一枚圆蜡印，中间一个字（定、实、相、假）。
//   o = { r 半径（默认 26）, k 0..1 盖下去的动画（从上方落下、压扁、回弹）, al }
// 顶层名字带 TAPE / tape / seal 前缀。

const TAPE = { unit: 22, minW: 10, h: 64, rows: 2 };
const SEAL = { thm: ['定', '#6b4a7a'], exp: ['实', '#3f6b56'], corr: ['相', '#8a6a2e'], hyp: ['假', '#8a3a36'] };

function tape(c, o = {}) {
  const { x = 0, y = 0, rot = 0, cells = [], unit = TAPE.unit, minW = TAPE.minW, h = TAPE.h, rows = TAPE.rows, p = 1, punch = 1, al = 1 } = o;
  const ws = cells.map(q => Math.max(minW, (q.bits || 0) * unit)), len = ws.reduce((a, b) => a + b, 0), xs = [];
  let acc = 0; for (const w of ws) { xs.push(acc + w / 2); acc += w; }
  const at = i => { const u = xs[i] ?? 0; return [x + Math.cos(rot) * u, y + Math.sin(rot) * u]; };
  if (al > 0 && len > 0) {
    c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot);
    const shown = len * clamp(p, 0, 1);
    c.fillStyle = EP3_TAPE_COL.paper; c.strokeStyle = EP3_TAPE_COL.edge; c.lineWidth = 2;
    c.fillRect(0, -h / 2, shown, h); c.strokeRect(0, -h / 2, shown, h);
    const nPunch = punch * cells.length;
    cells.forEach((q, i) => {
      const x0 = xs[i] - ws[i] / 2; if (x0 > shown) return;
      if (q.hot) { c.fillStyle = alpha(P.red, .25 * q.hot); c.fillRect(x0, -h / 2, ws[i], h); }
      c.strokeStyle = alpha(EP3_TAPE_COL.edge, .8); c.beginPath(); c.moveTo(x0, -h / 2); c.lineTo(x0, h / 2); c.stroke();
      if (i < nPunch) {
        const b = q.bits || 0, n = Math.ceil(b), cols = Math.ceil(n / rows) || 1, r = Math.min(7, (ws[i] - 6) / (2 * cols + 1) * 1.2, h / (rows * 2 + 1));
        for (let k = 0; k < n; k++) {
          const col = Math.floor(k / rows), row = k % rows, frac = k === n - 1 && b % 1 ? b % 1 : 1;
          c.fillStyle = alpha(EP3_TAPE_COL.hole, .85 * frac); c.beginPath();
          c.arc(x0 + ws[i] * (col + .5) / cols, -h / 2 + h * (row + .5) / rows, Math.max(1.5, r), 0, TAU); c.fill();
        }
      }
      if (q.ch) zh(c, q.ch, xs[i], -h / 2 - 14, { size: 34, color: P.ink, align: 'center' });
    });
    c.restore();
  }
  return { len, at };
}

function tapeBox(c, x, y, s = 1, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  cutPaper(c, rectPts(-70, -50, 140, 100, 8), '#6b4a36', { seed: 3401 });
  cutPaper(c, rectPts(-58, -38, 116, 18, 3), '#8a6a4e', { seed: 3402 });
  const a = t * 3; rline(c, [[-70, 0], [-100 + Math.cos(a) * 18, Math.sin(a) * 18]], { w: 5, color: '#b08a45' });
  c.restore();
}

function seal(c, x, y, kind, o = {}) {
  const { r = 26, k = 1, al = 1 } = o, [ch, col] = SEAL[kind] || SEAL.hyp; if (k <= 0 || al <= 0) return;
  const drop = (1 - sm(0, .6, k)) * -40, sq = 1 + .25 * Math.sin(sm(.55, 1, k) * Math.PI);
  c.save(); c.globalAlpha *= al * sm(0, .3, k); c.translate(x, y + drop); c.scale(sq, 1 / sq);
  cutPaper(c, circPts(0, 0, r, 20), col, { seed: 3450 + ch.charCodeAt(0) % 17, step: 6, blur: 4 });
  c.strokeStyle = alpha('#fff', .35); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * .72, 0, TAU); c.stroke();
  zh(c, ch, 0, r * .36, { size: r * 1.05, color: '#f3e6d6', align: 'center' });
  c.restore();
}
