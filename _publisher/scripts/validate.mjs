// validate.mjs — checa as conexões (GitHub + Instagram Graph API) SEM publicar nada.
import { loadEnv } from './lib/env.mjs';
loadEnv();

const mask = v => (v ? v.slice(0, 6) + '…(' + v.length + ' chars)' : '(vazio)');
let ok = true;

console.log('== GitHub ==');
try {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error('GITHUB_REPO/GITHUB_TOKEN ausente');
  const r = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'social-publisher' },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status}: ${j.message}`);
  console.log(`  repo: ${j.full_name} | público: ${!j.private} | escrita(push): ${j.permissions?.push}`);
  if (!j.permissions?.push) { ok = false; console.log('  ⚠️  token SEM permissão de escrita nesse repo'); }
  else console.log('  ✓ token OK para escrever nesse repo');
} catch (e) { ok = false; console.log('  ✗ ' + e.message); }

console.log('== Instagram Graph API ==');
try {
  const v = process.env.GRAPH_VERSION || 'v21.0';
  const token = process.env.IG_ACCESS_TOKEN;
  const ig = process.env.IG_USER_ID;
  if (!token || !ig) throw new Error('IG_ACCESS_TOKEN/IG_USER_ID ausente');
  console.log('  token:', mask(token));

  const acc = await fetch(`https://graph.facebook.com/${v}/me/accounts?fields=name,id,instagram_business_account&access_token=${token}`);
  const aj = await acc.json();
  if (aj.error) throw new Error('me/accounts: ' + aj.error.message);
  const pages = aj.data || [];
  console.log(`  páginas visíveis: ${pages.length}`);
  for (const p of pages) console.log(`    - ${p.name} (${p.id}) IG=${p.instagram_business_account?.id || '—'}`);

  const me = await fetch(`https://graph.facebook.com/${v}/${ig}?fields=username,name&access_token=${token}`);
  const mj = await me.json();
  if (mj.error) throw new Error('ig-user: ' + mj.error.message);
  console.log(`  ✓ IG_USER_ID ${ig} = @${mj.username} (${mj.name || ''})`);
} catch (e) { ok = false; console.log('  ✗ ' + e.message); }

console.log(ok ? '\nRESULTADO: tudo verde ✅' : '\nRESULTADO: há pendências ⚠️ (veja acima)');
process.exit(ok ? 0 : 1);
