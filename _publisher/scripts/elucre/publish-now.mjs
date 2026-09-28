// publish-now.mjs (fusão eLucre) — enfileira o post de uma data com vencimento IMEDIATO.
// Para teste / publicação manual sob demanda: NÃO posta prévia no Discord nem espera janela de veto.
// Depois rode `node scripts/run-due.mjs` para publicar de fato.
// Uso: node scripts/elucre/publish-now.mjs --date YYYY-MM-DD
import { socialCfg, calendarItemForDate, resolveGlob } from './lib.mjs';
import { addItem } from '../lib/ledger.mjs';

const cfg = socialCfg();
const i = process.argv.indexOf('--date');
const date = i !== -1 ? process.argv[i + 1] : null;
if (!date) { console.error('uso: node scripts/elucre/publish-now.mjs --date YYYY-MM-DD'); process.exit(1); }

const item = calendarItemForDate(date);
if (!item) { console.error('sem item no calendário para', date); process.exit(1); }

const feed = resolveGlob(cfg.posts_root, item.feed_glob);
const story = resolveGlob(cfg.posts_root, item.story_glob);
if (feed.length === 0) { console.error('FEED não encontrado (glob:', item.feed_glob + ')'); process.exit(1); }
if (feed.length > 10) { console.error('carrossel > 10 imagens (' + feed.length + ') — a Graph API não aceita'); process.exit(1); }

console.log('tema:', item.tema, '| tipo:', feed.length > 1 ? 'carousel' : 'image', '| feed:', feed.length, '| story:', story.length);
const caption = [item.legenda, item.hashtags].filter(Boolean).join('\n\n').slice(0, 2200);
const past = new Date(Date.now() - 60000).toISOString(); // vence já

const e = addItem({
  brand: cfg.brand || 'elucre',
  type: feed.length > 1 ? 'carousel' : 'image',
  assets: feed,
  story,
  caption,
  scheduledAt: past,
  day: date,
});
console.log('enfileirado IMEDIATO:', e.id, '— agora rode: node scripts/run-due.mjs');
