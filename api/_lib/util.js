import { createHash, timingSafeEqual } from 'node:crypto';

export const CONTENT_PATH = 'site/content.json';
export const BLOB_ACCESS = process.env.BLOB_ACCESS === 'private' ? 'private' : 'public';

export function hasStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (s) => createHash('sha256').update(String(s)).digest();

/** Confere o PIN enviado no cabeçalho x-admin-pin. Retorna true/false e já responde em caso de erro. */
export async function checkPin(req, res) {
  const expected = process.env.ADMIN_PIN;
  if (!expected) {
    json(res, 503, { ok: false, error: 'PIN_NAO_CONFIGURADO' });
    return false;
  }
  const given = req.headers['x-admin-pin'] || '';
  const ok = timingSafeEqual(hash(given), hash(expected));
  if (!ok) {
    await sleep(1200); // atrasa tentativas erradas
    json(res, 401, { ok: false, error: 'PIN_INVALIDO' });
    return false;
  }
  return true;
}

export async function readRaw(req, limitBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw Object.assign(new Error('TOO_LARGE'), { code: 'TOO_LARGE' });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req, limitBytes) {
  let parsed;
  try { parsed = req.body; } catch (e) { throw Object.assign(new Error('BAD_JSON'), { code: 'BAD_JSON' }); }
  if (parsed && typeof parsed === 'object' && !Buffer.isBuffer(parsed)) return parsed;
  if (typeof parsed === 'string') return JSON.parse(parsed || '{}');
  if (Buffer.isBuffer(parsed)) return JSON.parse(parsed.toString('utf8') || '{}');
  const buf = await readRaw(req, limitBytes);
  return JSON.parse(buf.toString('utf8') || '{}');
}
