// Lista as publicações já feitas no Instagram (para não repetir tema/ângulo).
import { loadEnv, required } from './lib/env.mjs';
loadEnv();
const v = process.env.GRAPH_VERSION || 'v21.0';
const ig = required('IG_USER_ID');
const t = required('IG_ACCESS_TOKEN');

const res = await fetch(`https://graph.facebook.com/${v}/${ig}/media?fields=id,caption,media_type,permalink,timestamp&limit=50&access_token=${t}`);
const j = await res.json();
if (j.error) throw new Error('Graph: ' + j.error.message);
const data = j.data || [];
console.log(`== ${data.length} publicação(ões) no perfil ==`);
for (const m of data) {
  const cap = (m.caption || '(sem legenda)').replace(/\s+/g, ' ').slice(0, 90);
  console.log(`${(m.timestamp || '').slice(0, 10)} | ${m.media_type.padEnd(13)} | ${m.permalink}`);
  console.log(`   ${cap}`);
}
