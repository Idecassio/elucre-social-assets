// enqueue.mjs — adiciona um post à fila (ledger).
// Uso:
//   node scripts/enqueue.mjs --brand resvy --type image --asset out/institucional.jpg \
//        --caption-file captions/institucional.txt --at "2026-09-16T19:00:00-03:00"
//   node scripts/enqueue.mjs --brand resvy --type carousel \
//        --asset out/s1.jpg --asset out/s2.jpg --asset out/s3.jpg --caption "..." --at "..."
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { addItem } from './lib/ledger.mjs';

function args() {
  const a = process.argv.slice(2);
  const out = { assets: [] };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '--asset') out.assets.push(a[++i]);
    else if (k === '--brand') out.brand = a[++i];
    else if (k === '--type') out.type = a[++i];
    else if (k === '--caption') out.caption = a[++i];
    else if (k === '--caption-file') out.captionFile = a[++i];
    else if (k === '--at') out.at = a[++i];
  }
  return out;
}

const o = args();
if (!o.brand || o.assets.length === 0) {
  console.error('uso: --brand <marca> --type image|carousel --asset <jpg> [--asset ...] (--caption "..." | --caption-file <txt>) --at <ISO8601>');
  process.exit(1);
}

let caption = o.caption || '';
if (o.captionFile) {
  const p = resolve(process.cwd(), o.captionFile);
  if (!existsSync(p)) { console.error('legenda não encontrada:', p); process.exit(1); }
  caption = readFileSync(p, 'utf8').trim();
}

const type = o.type || (o.assets.length > 1 ? 'carousel' : 'image');
const scheduledAt = o.at ? new Date(o.at).toISOString() : new Date().toISOString();

const entry = addItem({ brand: o.brand, type, assets: o.assets, caption, scheduledAt });
console.log('enfileirado:', entry.id, '|', type, '|', new Date(scheduledAt).toLocaleString('pt-BR'));
console.log('assets:', entry.assets.join(', '));
