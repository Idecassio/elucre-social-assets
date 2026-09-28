// host.mjs — escolhe a camada de upload conforme IMAGE_HOST (github | r2).
// Etapa 1 = github (padrão); Etapa 2 (produção) = r2.
import { loadEnv } from './env.mjs';
loadEnv();

const host = (process.env.IMAGE_HOST || 'github').toLowerCase();
const mod = host === 'r2'
  ? await import('../upload-r2.mjs')
  : await import('../upload-github.mjs');

export const uploadFile = mod.uploadFile;
export const IMAGE_HOST = host;
