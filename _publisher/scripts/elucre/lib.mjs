// lib.mjs (fusão eLucre) — ponte entre o motor social do eLucre (_social) e o publisher.
// Lê o config e o calendário do eLucre, resolve os globs de feed/story em arquivos JPG,
// e posta no Discord (webhook de mão única) com anexos.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { ROOT } from '../lib/env.mjs';

// _publisher fica DENTRO de eLucre_Posts; _social é irmão dele.
export const SOCIAL_DIR = join(ROOT, '..', '_social');

// Lê JSON tolerando BOM (o PowerShell costuma salvar UTF-8 com BOM, que quebra o JSON.parse).
function readJSON(f) {
  let s = readFileSync(f, 'utf8');
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  return JSON.parse(s);
}

export function socialCfg() {
  const f = join(SOCIAL_DIR, 'config.json');
  const cfg = existsSync(f) ? readJSON(f) : {};
  // Portável (local + nuvem): posts_root é DERIVADO (não o caminho fixo do Windows),
  // e o webhook pode vir de env (GitHub Secret) — nunca precisa estar no arquivo na nuvem.
  cfg.posts_root = process.env.POSTS_ROOT || join(ROOT, '..');
  cfg.discord_webhook = process.env.DISCORD_WEBHOOK || cfg.discord_webhook || '';
  cfg.hora_disparo = cfg.hora_disparo || '09:00';
  cfg.hora_publicacao = cfg.hora_publicacao || '13:00';
  cfg.brand = cfg.brand || 'elucre';
  return cfg;
}

// Datas vetadas (não publicar). Fonte: _social/vetos.json (array de "YYYY-MM-DD").
// Na nuvem, vetar = adicionar a data nesse arquivo pelo GitHub.
export function vetoedDates() {
  const f = join(SOCIAL_DIR, 'vetos.json');
  if (!existsSync(f)) return [];
  try { const a = readJSON(f); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}

// Adiciona uma data ao vetos.json (idempotente) e devolve a lista atualizada.
export function addVeto(date) {
  const f = join(SOCIAL_DIR, 'vetos.json');
  const cur = vetoedDates();
  if (!cur.includes(date)) cur.push(date);
  cur.sort();
  writeFileSync(f, JSON.stringify(cur, null, 2) + '\n');
  return cur;
}

// Item do calendário para uma data YYYY-MM-DD (ou null).
export function calendarItemForDate(dateStr) {
  const ym = dateStr.slice(0, 7);
  const f = join(SOCIAL_DIR, `calendario_${ym}.json`);
  if (!existsSync(f)) return null;
  const cal = readJSON(f);
  return cal.find(x => x.data === dateStr) || null;
}

// Resolve um glob "dir/prefixo_*.jpg" (relativo ao posts_root) em caminhos absolutos, ordenados.
export function resolveGlob(root, glob) {
  if (!glob) return [];
  const full = join(root, glob);
  const dir = dirname(full);
  const pat = basename(full);
  if (!existsSync(dir)) return [];
  const rx = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
  return readdirSync(dir)
    .filter(f => rx.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(f => join(dir, f));
}

// Posta no Discord via webhook, com anexos (até 10 imagens). content <= 2000 chars.
export async function postDiscord(webhook, { content, files = [] }) {
  if (!webhook) throw new Error('discord_webhook ausente no config.json');
  const fd = new FormData();
  fd.append('payload_json', JSON.stringify({ content: (content || '').slice(0, 1999) }));
  let i = 0;
  for (const p of files.slice(0, 10)) {
    fd.append(`files[${i}]`, new Blob([readFileSync(p)], { type: 'image/jpeg' }), basename(p));
    i++;
  }
  const res = await fetch(webhook, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Discord ' + res.status + ': ' + (await res.text()).slice(0, 300));
  return true;
}

// Data local YYYY-MM-DD.
export function todayLocal() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ISO de "dateStr HH:MM" no fuso LOCAL da máquina (BRT).
export function atLocalISO(dateStr, hhmm) {
  const [h, m] = (hhmm || '13:00').split(':').map(Number);
  const [Y, Mo, D] = dateStr.split('-').map(Number);
  return new Date(Y, Mo - 1, D, h, m, 0, 0).toISOString();
}
