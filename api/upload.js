import { put } from '@vercel/blob';
import { checkPin, hasStorage, json, readRaw } from './_lib/util.js';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (o painel reduz as fotos antes de enviar)
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// POST /api/upload?nome=... (corpo = imagem) -> grava a imagem e devolve a URL pública
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  if (!(await checkPin(req, res))) return;
  if (!hasStorage()) return json(res, 503, { ok: false, error: 'ARMAZENAMENTO_NAO_CONFIGURADO' });

  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  const ext = TYPES[type];
  if (!ext) return json(res, 415, { ok: false, error: 'TIPO_NAO_SUPORTADO' });

  let buf;
  try {
    buf = await readRaw(req, MAX_BYTES);
  } catch (e) {
    return json(res, 413, { ok: false, error: 'MUITO_GRANDE' });
  }
  if (!buf.length) return json(res, 400, { ok: false, error: 'VAZIO' });

  const url = new URL(req.url, 'http://x');
  const base = (url.searchParams.get('nome') || 'imagem')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'imagem';

  try {
    // Imagens são sempre públicas para aparecer no site
    const blob = await put(`img/${base}.${ext}`, buf, {
      access: 'public',
      addRandomSuffix: true,
      contentType: type
    });
    return json(res, 200, { ok: true, url: blob.url }, { 'Cache-Control': 'no-store' });
  } catch (err) {
    console.error('upload error', err);
    return json(res, 500, { ok: false, error: 'UPLOAD_FALHOU' });
  }
}
