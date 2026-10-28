import { checkPin, hasStorage, json } from './_lib/util.js';

// POST /api/auth -> confere o PIN (cabeçalho x-admin-pin)
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  if (!(await checkPin(req, res))) return;
  return json(res, 200, { ok: true, storage: hasStorage() }, { 'Cache-Control': 'no-store' });
}
