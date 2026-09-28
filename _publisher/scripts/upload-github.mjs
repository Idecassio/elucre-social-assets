// upload-github.mjs — sobe um arquivo para um repositório GitHub PÚBLICO via Contents API
// e devolve a URL raw pública (usada como image_url pela Graph API).
// Etapa 1 do laboratório (sem cartão). Etapa 2 = upload-r2.mjs.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { loadEnv, required } from './lib/env.mjs';

loadEnv();

// Sobe um arquivo local e devolve { key, url }. `key` é o caminho dentro do repo.
export async function uploadFile(localPath, key) {
  // Na nuvem (GitHub Actions), "GITHUB_TOKEN" é reservado p/ o repo atual (privado). Por isso o
  // repo PÚBLICO de imagens usa ASSETS_GITHUB_* quando presente; local segue com GITHUB_*.
  const repo = process.env.ASSETS_GITHUB_REPO || required('GITHUB_REPO');
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.ASSETS_GITHUB_TOKEN || required('GITHUB_TOKEN');
  const path = (key || `${Date.now()}-${basename(localPath)}`).replace(/^\/+/, '');
  const content = readFileSync(localPath).toString('base64');

  const api = `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}`;
  // Se o arquivo já existir nesse caminho, precisa do sha para atualizar.
  let sha;
  const head = await fetch(`${api}?ref=${branch}`, { headers: ghHeaders(token) });
  if (head.ok) { try { sha = (await head.json()).sha; } catch {} }

  const res = await fetch(api, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `add ${path}`, content, branch, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub ${res.status}: ${t}`);
  }
  const [owner, name] = repo.split('/');
  return { key: path, url: `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${encodeURI(path)}` };
}

function ghHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'social-publisher' };
}

// Execução direta: node scripts/upload-github.mjs <arquivoLocal> [chaveDestino]
if (process.argv[1]?.endsWith('upload-github.mjs')) {
  const local = process.argv[2], key = process.argv[3];
  if (!local) { console.error('uso: node scripts/upload-github.mjs <arquivoLocal> [chaveDestino]'); process.exit(1); }
  uploadFile(local, key).then(r => console.log('OK:', r.url)).catch(e => { console.error('ERRO:', e.message); process.exit(1); });
}
