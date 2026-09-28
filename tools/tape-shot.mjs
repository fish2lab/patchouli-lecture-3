// 纸带 / 八音盒 / 蜡封样张截图：打开 tape.html?t=2 → out/frames/tape.png；--zoom 另存放大两倍的 tape-zoom.png。
// 顺带打印每帧画「两条 40 格纸带 + 八音盒 + 四枚蜡封」的平均毫秒。页面有报错时退出码 1。
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { ROOT } from './browser.mjs';
const outDir = resolve(ROOT, 'out/frames'); mkdirSync(outDir, { recursive: true });
const exe = process.env.CHROMIUM && existsSync(process.env.CHROMIUM) ? process.env.CHROMIUM : undefined;
const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1920, height: 1500 } });
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const shots = [['t=2', 'tape.png']];
if (process.argv.includes('--zoom')) shots.push(['t=2&zoom', 'tape-zoom.png']);
for (const [q, name] of shots) {
  await page.goto(pathToFileURL(resolve(ROOT, 'tape.html')).href + '?' + q);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
  const f = resolve(outDir, name);
  (await import('node:fs')).writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', f);
}
console.log('ms/frame (2 tapes × 40 cells + box + 4 seals):', await page.evaluate(() => __tapeBench(120)));
await browser.close();
if (errors.length) { console.error('page errors:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
