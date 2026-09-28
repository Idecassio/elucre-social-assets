// ledger.mjs — CLI de leitura/gestão da fila.
// Uso:
//   node scripts/ledger.mjs list                 (lista tudo)
//   node scripts/ledger.mjs list pending         (filtra por status)
//   node scripts/ledger.mjs show <id>            (detalha um item)
import { readLedger } from './lib/ledger.mjs';

const [cmd, arg] = process.argv.slice(2);
const items = readLedger();

if (cmd === 'show') {
  const it = items.find(x => x.id === arg);
  if (!it) { console.error('não encontrado:', arg); process.exit(1); }
  console.log(JSON.stringify(it, null, 2));
} else { // list
  const filtered = arg ? items.filter(x => x.status === arg) : items;
  if (filtered.length === 0) { console.log('(fila vazia)'); process.exit(0); }
  const ic = { pending: '•', published: '✓', error: '✗' };
  for (const x of filtered) {
    const when = new Date(x.scheduledAt).toLocaleString('pt-BR');
    const extra = x.permalink ? ' ' + x.permalink : x.error ? ' ERRO: ' + x.error : '';
    console.log(`${ic[x.status] || '?'} ${x.id}  [${x.brand}/${x.type}]  ${x.status}  ${when}${extra}`);
  }
}
