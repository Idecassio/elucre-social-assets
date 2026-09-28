// render.mjs — HTML/CSS -> Chrome headless -> JPG no tamanho exato.
// Uso: node scripts/render.mjs --html <arquivo.html> [--w 1080] [--h 1350] --out <saida.jpg> [--quality 92]
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';
import { loadEnv } from './lib/env.mjs';

loadEnv();

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const htmlArg = arg('html');
const out = arg('out');
const w = parseInt(arg('w', '1080'), 10);
const h = parseInt(arg('h', '1350'), 10);
const quality = parseInt(arg('quality', '92'), 10);

if (!htmlArg || !out) {
  console.error('uso: node scripts/render.mjs --html <arquivo.html> --out <saida.jpg> [--w 1080 --h 1350 --quality 92]');
  process.exit(1);
}

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const htmlPath = isAbsolute(htmlArg) ? htmlArg : resolve(process.cwd(), htmlArg);
const outPath = isAbsolute(out) ? out : resolve(process.cwd(), out);
mkdirSync(dirname(outPath), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars', '--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
try { await page.evaluate(() => document.fonts.ready); } catch {}
await new Promise(r => setTimeout(r, 400)); // folga p/ fontes/emoji
await page.screenshot({ path: outPath, type: 'jpeg', quality, clip: { x: 0, y: 0, width: w, height: h } });
await browser.close();
console.log('JPG gerado:', outPath, `(${w}x${h}, q${quality})`);
