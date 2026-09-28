// skeleton.mjs (fusão eLucre) — rodar no DIA 1 pelo agendador.
// Cria o ESQUELETO do calendário do mês (dias úteis, rotação de pilares, tema dark/claro
// alternando a cada 3) e avisa no Discord pra você pedir ao Claude o preenchimento criativo.
// NÃO sobrescreve um calendário já existente. Uso: node scripts/elucre/skeleton.mjs [--month YYYY-MM]
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/env.mjs';
import { SOCIAL_DIR, socialCfg, postDiscord } from './lib.mjs';

const now = new Date();
const iM = process.argv.indexOf('--month');
const ym = iM !== -1 ? process.argv[iM + 1] : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const [Y, Mo] = ym.split('-').map(Number);

const file = join(SOCIAL_DIR, `calendario_${ym}.json`);
if (existsSync(file)) { console.log('calendário já existe, não sobrescrevo:', file); process.exit(0); }

const pilares = ['Institucional', 'Dor & educação', 'Demonstração/Produto', 'Direcionado por nicho', 'Prova & resultado', 'Conversão'];
const daysInMonth = new Date(Y, Mo, 0).getDate();
const cal = [];
let idx = 0, feedCount = 0;
for (let d = 1; d <= daysInMonth; d++) {
  const dt = new Date(Y, Mo - 1, d), dow = dt.getDay();
  if (dow === 0 || dow === 6) continue; // só dias úteis
  const dateStr = `${ym}-${String(d).padStart(2, '0')}`;
  const tema_visual = (Math.floor(feedCount / 3) % 2 === 0) ? 'dark' : 'claro'; // alterna a cada linha de 3
  cal.push({
    data: dateStr, pilar: pilares[idx % pilares.length], tema: '', tipo: 'carrossel',
    nicho: 'geral', status: 'planejado', feed_glob: '', story_glob: '',
    legenda: '', hashtags: '', tema_visual,
  });
  idx++; feedCount++;
}

writeFileSync(file, JSON.stringify(cal, null, 2) + '\n');
console.log(`✓ esqueleto criado: ${file} (${cal.length} dias úteis)`);

try {
  const cfg = socialCfg();
  await postDiscord(cfg.discord_webhook, {
    content: `📅 **eLucre — calendário de ${ym} criado** (esqueleto: ${cal.length} dias úteis, pilares e temas alternando).\n`
      + `➡️ Hora de planejar: peça ao Claude **"monta o calendário de ${ym}"** pra preencher temas, legendas e gerar os assets (feed + story) de cada dia.`,
    files: [],
  });
} catch {}
