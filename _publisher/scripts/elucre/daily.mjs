// daily.mjs (fusão eLucre) — rodar às 09:00 pelo agendador.
// 1) acha o post do dia no calendário (status "pronto"); 2) resolve feed+story;
// 3) posta a PRÉVIA no Discord (MC-monitor) com a janela de veto; 4) enfileira no publisher
//    com scheduledAt = hoje às hora_publicacao (o run-due publica nesse horário se não for vetado).
// Uso: node scripts/elucre/daily.mjs [--date YYYY-MM-DD]
import { socialCfg, calendarItemForDate, resolveGlob, postDiscord, todayLocal, atLocalISO } from './lib.mjs';
import { addItem, readLedger } from '../lib/ledger.mjs';

const cfg = socialCfg();
const iDate = process.argv.indexOf('--date');
const date = iDate !== -1 ? process.argv[iDate + 1] : todayLocal();

async function notify(msg) { try { await postDiscord(cfg.discord_webhook, { content: msg, files: [] }); } catch {} console.log(msg); }

const item = calendarItemForDate(date);
if (!item) { await notify(`ℹ️ eLucre: sem item no calendário para ${date}. Nada a publicar.`); process.exit(0); }
if (item.status !== 'pronto') {
  await notify(`⚠️ eLucre ${date}: o post "${item.tema}" ainda não está PRONTO (status: ${item.status}). Não enfileirei — peça ao Claude pra gerar/finalizar.`);
  process.exit(0);
}

const feed = resolveGlob(cfg.posts_root, item.feed_glob);
const story = resolveGlob(cfg.posts_root, item.story_glob);
if (feed.length === 0) { await notify(`⚠️ eLucre ${date}: não encontrei os JPGs do FEED (glob: ${item.feed_glob}).`); process.exit(1); }
if (story.length === 0) { await notify(`⚠️ eLucre ${date}: não encontrei o STORY (glob: ${item.story_glob}). Vou seguir só com o feed? Abortei por segurança — gere o story.`); process.exit(1); }

// evita enfileirar 2x o mesmo dia
const dup = readLedger().find(x => x.brand === (cfg.brand || 'elucre') && x.day === date && (x.status === 'pending' || x.status === 'published'));
if (dup) { console.log(`já existe item para ${date} (${dup.id}, ${dup.status}). Nada a fazer.`); process.exit(0); }

const caption = [item.legenda, item.hashtags].filter(Boolean).join('\n\n').slice(0, 2200);
const hora = cfg.hora_publicacao || '13:00';
const publishAt = atLocalISO(date, hora);

const entry = addItem({
  brand: cfg.brand || 'elucre',
  type: feed.length > 1 ? 'carousel' : 'image',
  assets: feed,
  story,
  caption,
  scheduledAt: publishAt,
  day: date,
});

const preview = [
  `🟣 **eLucre — publicação de ${date}** · ${item.pilar}`,
  `**${item.tema}**  ·  feed(${feed.length}) + story(${story.length})`,
  ``,
  `🕐 Publica **automaticamente às ${hora}** no Instagram (feed + story).`,
  `🛑 Para **VETAR** (não publicar): rode \`node scripts/elucre/veto.mjs today\` ou me peça no Claude — antes das ${hora}.`,
  ``,
  `— Legenda —`,
  item.legenda || '',
  item.hashtags || '',
].join('\n');

try {
  await postDiscord(cfg.discord_webhook, { content: preview, files: feed });
  console.log(`✓ prévia postada no Discord + enfileirado ${entry.id} | publica ${publishAt}`);
} catch (e) {
  console.error('preview no Discord falhou (item continua enfileirado):', e.message);
}
