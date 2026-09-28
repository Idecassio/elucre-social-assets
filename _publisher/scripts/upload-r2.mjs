// upload-r2.mjs — envia um arquivo para o bucket R2 e devolve a URL pública.
// Uso direto: node scripts/upload-r2.mjs <arquivoLocal> [chaveDestino]
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { loadEnv, required } from './lib/env.mjs';

loadEnv();

function client() {
  const accountId = required('R2_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required('R2_ACCESS_KEY_ID'),
      secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
    },
  });
}

const CONTENT_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

// Sobe um arquivo local e devolve { key, url } (url pública, pronta p/ a Graph API).
export async function uploadFile(localPath, key) {
  const bucket = required('R2_BUCKET');
  const publicBase = required('R2_PUBLIC_BASE').replace(/\/$/, '');
  const finalKey = key || `${Date.now()}-${basename(localPath)}`;
  const ext = finalKey.slice(finalKey.lastIndexOf('.')).toLowerCase();
  await client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: finalKey,
    Body: readFileSync(localPath),
    ContentType: CONTENT_TYPES[ext] || 'application/octet-stream',
  }));
  return { key: finalKey, url: `${publicBase}/${finalKey}` };
}

// Execução direta pela linha de comando
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('upload-r2.mjs')) {
  const local = process.argv[2];
  const key = process.argv[3];
  if (!local) { console.error('uso: node scripts/upload-r2.mjs <arquivoLocal> [chaveDestino]'); process.exit(1); }
  uploadFile(local, key).then(r => console.log('OK:', r.url)).catch(e => { console.error('ERRO:', e.message); process.exit(1); });
}
