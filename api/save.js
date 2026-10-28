import { put } from '@vercel/blob';
import { CONTENT_PATH, BLOB_ACCESS, checkPin, hasStorage, json, readJson } from './_lib/util.js';

const MAX_BYTES = 1024 * 1024; // 1 MB de texto é muito mais que suficiente

// POST /api/save -> grava o conteúdo do site
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  if (!(await checkPin(req, res))) return;
  if (!hasStorage()) return json(res, 503, { ok: false, error: 'ARMAZENAMENTO_NAO_CONFIGURADO' });

  let content;
  try {
    content = await readJson(req, MAX_BYTES);
  } catch (e) {
    return json(res, 400, { ok: false, error: e.code === 'TOO_LARGE' ? 'MUITO_GRANDE' : 'JSON_INVALIDO' });
  }
  if (!content || typeof content !== 'object' || !content.pagina || !Array.isArray(content.devocionais)) {
    return json(res, 400, { ok: false, error: 'FORMATO_INVALIDO' });
  }
  content.updatedAt = new Date().toISOString();
  const body = JSON.stringify(content);
  if (Buffer.byteLength(body) > MAX_BYTES) return json(res, 400, { ok: false, error: 'MUITO_GRANDE' });

  try {
    await put(CONTENT_PATH, body, {
      access: BLOB_ACCESS,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60
    });
    return json(res, 200, { ok: true, updatedAt: content.updatedAt }, { 'Cache-Control': 'no-store' });
  } catch (err) {
    console.error('save error', err);
    return json(res, 500, { ok: false, error: 'GRAVACAO_FALHOU' });
  }
}
