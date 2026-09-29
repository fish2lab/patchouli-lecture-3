// 导出第 3 集视频封面：cover.html → out/cover/cover-16x9.png（1920×1080）、cover-4x3.png（1440×1080，?ar=43 单独排版）
//   node tools/cover.mjs
// 页面有报错时退出码 1。浏览器同 browser.mjs（CHROMIUM=可执行文件路径，不设用 Playwright 自带的）。
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { ROOT } from './browser.mjs';
const exe = process.env.CHROMIUM && existsSync(process.env.CHROMIUM) ? process.env.CHROMIUM : undefined;
const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }), errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const outDir = resolve(ROOT, 'out/cover'); mkdirSync(outDir, { recursive: true });
for (const [ar, name] of [['169', 'cover-16x9.png'], ['43', 'cover-4x3.png']]) {
  await page.goto(pathToFileURL(resolve(ROOT, 'cover.html')).href + '?ar=' + ar);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  const f = resolve(outDir, name); writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', f);
}
await browser.close();
if (errors.length) { console.error('page errors:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
