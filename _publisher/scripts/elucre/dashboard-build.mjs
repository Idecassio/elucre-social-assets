// dashboard-build.mjs (fusão eLucre) — regenera _social/dashboard_data.js a partir das FONTES VIVAS:
//   calendario_<mes>.json (posts do mês) + ledger.json (o que já foi publicado) + postado_manual.json
//   (posts publicados fora do pipeline). Assim o dashboard.html/.hta sempre refletem a realidade:
//   posts novos aparecem e os publicados ficam checados — sem editar à mão.
// É chamado automaticamente pelo run-due (após publicar) e quando montamos o mês.
// Uso: node scripts/elucre/dashboard-build.mjs [--month AAAA-MM]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { socialCfg, resolveGlob, SOCIAL_DIR } from './lib.mjs';
import { readLedger } from '../lib/ledger.mjs';

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function readJSON(f) { let s = readFileSync(f, 'utf8'); if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); return JSON.parse(s); }

export function buildDashboard(monthArg) {
  const cfg = socialCfg();
  const now = new Date();
  const month = monthArg || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const calFile = join(SOCIAL_DIR, `calendario_${month}.json`);
  if (!existsSync(calFile)) { console.log('dashboard-build: sem calendário para', month, '— nada a fazer.'); return false; }
  const cal = readJSON(calFile);

  // "Postado no IG" = publicados no ledger (deste mês) ∪ postado_manual (fora do pipeline)
  const posted = new Set();
  for (const it of readLedger()) {
    if (it.status === 'published' && it.day && String(it.day).slice(0, 7) === month) posted.add(it.day);
  }
  const manualFile = join(SOCIAL_DIR, 'postado_manual.json');
  if (existsSync(manualFile)) { try { for (const d of readJSON(manualFile)) if (String(d).slice(0, 7) === month) posted.add(String(d)); } catch {} }
  const POSTED_IG = [...posted].sort();

  const CLARO = {};
  const DASH_DATA = cal.map(it => {
    const [Y, Mo, D] = it.data.split('-').map(Number);
    const dow = DOW[new Date(Y, Mo - 1, D).getDay()];
    const feedFiles = resolveGlob(cfg.posts_root, it.feed_glob);
    const storyFiles = resolveGlob(cfg.posts_root, it.story_glob);
    const thumb = feedFiles.length ? '../' + relative(cfg.posts_root, feedFiles[0]).replace(/\\/g, '/') : '';
    if ((it.tema_visual || '') === 'claro') CLARO[D] = 1;
    return {
      data: it.data, dia: D, dow, pilar: it.pilar || '', tema: it.tema || '', tipo: it.tipo || '',
      nicho: it.nicho || 'geral', status: it.status || 'planejado',
      feed: feedFiles.length, story: storyFiles.length, thumb,
      leg: it.legenda || '', hs: it.hashtags || '',
    };
  });

  const label = `${MESES[parseInt(month.slice(5, 7), 10) - 1]} ${month.slice(0, 4)}`;
  const out =
`/* eLucre — dados do painel. GERADO por _publisher/scripts/elucre/dashboard-build.mjs
   Fonte: calendario_${month}.json + ledger.json + postado_manual.json. NÃO editar à mão. */
var DASH_MONTH=${JSON.stringify(month)};
var DASH_MONTH_LABEL=${JSON.stringify(label)};
var POSTED_IG=${JSON.stringify(POSTED_IG)};
var DASH_CLARO=${JSON.stringify(CLARO)};
var DASH_DATA=${JSON.stringify(DASH_DATA)};
`;
  writeFileSync(join(SOCIAL_DIR, 'dashboard_data.js'), out);
  console.log(`dashboard-build: dashboard_data.js atualizado — ${DASH_DATA.length} posts, ${POSTED_IG.length} publicados (${month}).`);
  return true;
}

const isDirect = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('dashboard-build.mjs');
if (isDirect) {
  const i = process.argv.indexOf('--month');
  buildDashboard(i !== -1 ? process.argv[i + 1] : undefined);
}
