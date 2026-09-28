// Carregador mínimo de .env (sem dependência). Lê <raiz>/.env e popula process.env.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..'); // scripts/lib -> raiz da skill

export function loadEnv() {
  const path = join(ROOT, '.env');
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

// Lê uma variável obrigatória; lança erro claro se faltar.
export function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name} (preencha o .env — veja .env.example)`);
  return v;
}
