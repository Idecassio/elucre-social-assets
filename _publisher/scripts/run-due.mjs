// run-due.mjs — processa os itens vencidos da fila: sobe JPGs num host público -> publica
// FEED (imagem/carrossel) e, se houver, STORY(s) -> grava status.
// Pula automaticamente itens 'vetoed'/'error' (dueItems só pega 'pending').
// É o script chamado pelo Task Scheduler (teste) e pelo cron (produção).
import { resolve, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';
import { dueItems, updateItem } from './lib/ledger.mjs';
import { uploadFile } from './lib/host.mjs';
import { publishImage, publishCarousel, publishStory } from './publish.mjs';
import { buildDashboard } from './elucre/dashboard-build.mjs';
import { vetoedDates } from './elucre/lib.mjs';

const now = new Date();
const due = dueItems(now); // status 'pending' && scheduledAt <= now
if (due.length === 0) { console.log(`[${now.toISOString()}] nada vencido na fila.`); process.exit(0); }

console.log(`[${now.toISOString()}] ${due.length} item(ns) para publicar.`);

const vetos = vetoedDates();

for (const item of due) {
  if (item.day && vetos.includes(item.day)) {
    updateItem(item.id, { status: 'vetoed', error: 'vetado (vetos.json)' });
    console.log(`  ⏭ ${item.id} vetado — ${item.day} (não publicado)`);
    continue;
  }
  try {
    const resolveAll = arr => (arr || []).map(a => (isAbsolute(a) ? a : resolve(process.cwd(), a)));
    const feed = resolveAll(item.assets);
    const story = resolveAll(item.story);
    if (feed.length === 0) throw new Error('item sem FEED (assets vazio)');
    for (const p of [...feed, ...story]) if (!existsSync(p)) throw new Error('asset não encontrado: ' + p);

    // 1. FEED — sobe cada JPG e publica (imagem única ou carrossel)
    const feedUrls = [];
    for (const p of feed) {
      const { url } = await uploadFile(p, `${item.brand}/${item.id}/feed_${feedUrls.length + 1}.jpg`);
      feedUrls.push(url);
    }
    const feedRes = item.type === 'carousel'
      ? await publishCarousel({ imageUrls: feedUrls, caption: item.caption })
      : await publishImage({ imageUrl: feedUrls[0], caption: item.caption });

    // 2. STORY(s) — opcional (um publish por imagem de story)
    const storyMediaIds = [];
    for (const p of story) {
      const { url } = await uploadFile(p, `${item.brand}/${item.id}/story_${storyMediaIds.length + 1}.jpg`);
      const r = await publishStory({ imageUrl: url });
      storyMediaIds.push(r.mediaId);
    }

    // 3. grava sucesso no ledger
    updateItem(item.id, {
      status: 'published',
      mediaId: feedRes.mediaId,
      permalink: feedRes.permalink,
      storyMediaIds: storyMediaIds.length ? storyMediaIds : null,
      publishedAt: new Date().toISOString(),
      error: null,
    });
    console.log(`  ✓ ${item.id} publicado — feed ${feedRes.permalink || feedRes.mediaId}` +
      (storyMediaIds.length ? ` + ${storyMediaIds.length} story` : ''));
  } catch (e) {
    updateItem(item.id, { status: 'error', error: String(e.message || e) });
    console.error(`  ✗ ${item.id} erro: ${e.message || e}`);
  }
}

// Atualiza o dashboard (posts do mês + checks "Postado no IG") a partir do calendário + ledger.
try { buildDashboard(); } catch (e) { console.error('dashboard-build falhou (não afeta a publicação):', e.message); }
