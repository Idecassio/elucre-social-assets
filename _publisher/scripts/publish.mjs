// publish.mjs — publica no Instagram via Graph API (imagem única e carrossel).
// Exporta publishImage() e publishCarousel(). Requer Node 18+ (fetch global).
import { loadEnv, required } from './lib/env.mjs';

loadEnv();

function base() {
  const v = process.env.GRAPH_VERSION || 'v21.0';
  return `https://graph.facebook.com/${v}`;
}

async function graph(path, params) {
  const token = required('IG_ACCESS_TOKEN');
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${base()}/${path}`, { method: 'POST', body });
  const json = await res.json();
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`Graph API ${res.status}: ${e.message || JSON.stringify(json)} (code ${e.code ?? '?'})`);
  }
  return json;
}

async function containerStatus(creationId) {
  const token = required('IG_ACCESS_TOKEN');
  const res = await fetch(`${base()}/${creationId}?fields=status_code,status&access_token=${token}`);
  return res.json();
}

// Espera o container ficar FINISHED (necessário às vezes; imagens costumam ser rápidas).
async function waitReady(creationId, { tries = 10, delayMs = 2000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const s = await containerStatus(creationId);
    if (s.status_code === 'FINISHED') return true;
    if (s.status_code === 'ERROR') throw new Error('container em ERROR: ' + JSON.stringify(s));
    await new Promise(r => setTimeout(r, delayMs));
  }
  return true; // segue e tenta publicar mesmo assim
}

// Publica UMA imagem. imageUrl = URL pública HTTPS (JPEG).
export async function publishImage({ igUserId, imageUrl, caption }) {
  const ig = igUserId || required('IG_USER_ID');
  const c = await graph(`${ig}/media`, { image_url: imageUrl, caption: caption || '' });
  await waitReady(c.id);
  const pub = await graph(`${ig}/media_publish`, { creation_id: c.id });
  return await withPermalink(pub.id);
}

// Publica um CARROSSEL. imageUrls = array de URLs públicas (2 a 10).
export async function publishCarousel({ igUserId, imageUrls, caption }) {
  const ig = igUserId || required('IG_USER_ID');
  if (!Array.isArray(imageUrls) || imageUrls.length < 2) throw new Error('carrossel precisa de 2 a 10 imagens');
  const children = [];
  for (const url of imageUrls) {
    const item = await graph(`${ig}/media`, { image_url: url, is_carousel_item: 'true' });
    children.push(item.id);
  }
  const container = await graph(`${ig}/media`, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption: caption || '',
  });
  await waitReady(container.id);
  const pub = await graph(`${ig}/media_publish`, { creation_id: container.id });
  return await withPermalink(pub.id);
}

// Publica um STORY (imagem). imageUrl = URL pública HTTPS (JPEG). Story não tem permalink fixo.
export async function publishStory({ igUserId, imageUrl }) {
  const ig = igUserId || required('IG_USER_ID');
  const c = await graph(`${ig}/media`, { image_url: imageUrl, media_type: 'STORIES' });
  await waitReady(c.id);
  const pub = await graph(`${ig}/media_publish`, { creation_id: c.id });
  return { mediaId: pub.id };
}

async function withPermalink(mediaId) {
  const token = required('IG_ACCESS_TOKEN');
  try {
    const res = await fetch(`${base()}/${mediaId}?fields=permalink&access_token=${token}`);
    const j = await res.json();
    return { mediaId, permalink: j.permalink || null };
  } catch {
    return { mediaId, permalink: null };
  }
}
