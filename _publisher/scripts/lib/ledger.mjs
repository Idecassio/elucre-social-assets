// Ledger = fila + registro dos envios. Um arquivo JSON simples em content/ledger.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT } from './env.mjs';

const FILE = join(ROOT, 'content', 'ledger.json');

// Esquema de um item:
// {
//   id, brand, type: "image"|"carousel", assets: [caminhoLocalJpg,...],
//   caption, scheduledAt (ISO 8601), status: "pending"|"published"|"error",
//   mediaId, permalink, publishedAt, error
// }

export function readLedger() {
  if (!existsSync(FILE)) return [];
  try { return JSON.parse(readFileSync(FILE, 'utf8')); } catch { return []; }
}

export function writeLedger(items) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(items, null, 2) + '\n');
}

export function addItem(item) {
  const items = readLedger();
  const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const entry = {
    id,
    brand: item.brand,
    type: item.type || 'image',
    assets: item.assets || [],        // FEED (imagem única ou carrossel)
    story: item.story || [],          // STORY(s) — opcional
    day: item.day || null,            // data-alvo YYYY-MM-DD (fusão eLucre)
    caption: item.caption || '',
    scheduledAt: item.scheduledAt || new Date().toISOString(),
    status: 'pending',
    mediaId: null,
    permalink: null,
    storyMediaIds: null,
    publishedAt: null,
    error: null,
  };
  items.push(entry);
  writeLedger(items);
  return entry;
}

export function updateItem(id, patch) {
  const items = readLedger();
  const i = items.findIndex(x => x.id === id);
  if (i === -1) throw new Error('item não encontrado no ledger: ' + id);
  items[i] = { ...items[i], ...patch };
  writeLedger(items);
  return items[i];
}

// Itens pendentes cujo horário já venceu (scheduledAt <= agora).
export function dueItems(now = new Date()) {
  return readLedger().filter(x => x.status === 'pending' && new Date(x.scheduledAt) <= now);
}
