import { get } from '@vercel/blob';
import defaults from './_lib/defaults.js';
import { CONTENT_PATH, BLOB_ACCESS, hasStorage, json } from './_lib/util.js';

// GET /api/content -> conteúdo atual do site (do armazenamento ou o padrão)
export default async function handler(req, res) {
  const fresh = (req.url || '').includes('fresh=1');
  const cache = fresh
    ? { 'Cache-Control': 'no-store' }
    : { 'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=60' };

  if (!hasStorage()) {
    return json(res, 200, { storage: false, content: defaults }, cache);
  }
  try {
    const result = await get(CONTENT_PATH, { access: BLOB_ACCESS, useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return json(res, 200, { storage: true, content: defaults }, cache);
    }
    const text = await new Response(result.stream).text();
    const content = JSON.parse(text);
    return json(res, 200, { storage: true, content }, cache);
  } catch (err) {
    console.error('content error', err);
    return json(res, 200, { storage: true, error: 'LEITURA_FALHOU', content: defaults }, { 'Cache-Control': 'no-store' });
  }
}
