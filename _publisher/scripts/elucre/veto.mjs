// veto.mjs (fusão eLucre) — VETA a publicação de uma data (não vai ao ar).
// Grava a data em _social/vetos.json (fonte de verdade, funciona local E na nuvem) e, se já houver
// item pendente na fila, marca como 'vetoed'.
// Uso:
//   node scripts/elucre/veto.mjs today            (veta hoje)
//   node scripts/elucre/veto.mjs 2026-10-03       (veta uma data)
import { readLedger, updateItem } from '../lib/ledger.mjs';
import { todayLocal, socialCfg, postDiscord, addVeto } from './lib.mjs';

const arg = process.argv[2] || 'today';
const date = arg === 'today' ? todayLocal() : arg;

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error('uso: node scripts/elucre/veto.mjs [today|YYYY-MM-DD]');
  process.exit(1);
}

// 1) registra o veto (vetos.json)
addVeto(date);
console.log('🛑 vetado:', date, '(adicionado a vetos.json)');

// 2) se já houver item pendente na fila dessa data, marca vetado
for (const it of readLedger().filter(x => x.status === 'pending' && x.day === date)) {
  updateItem(it.id, { status: 'vetoed', error: 'vetado manualmente' });
  console.log('   fila:', it.id, '→ vetoed');
}

// 3) avisa no Discord (se configurado)
try {
  const cfg = socialCfg();
  if (cfg.discord_webhook) await postDiscord(cfg.discord_webhook, { content: `🛑 eLucre: publicação de **${date}** foi **VETADA** — não vai ao ar.`, files: [] });
} catch {}
