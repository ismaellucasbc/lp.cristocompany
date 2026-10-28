import { put } from '@vercel/blob';
import { checkPin, hasStorage, json, readJson } from './_lib/util.js';

// POST /api/instagram  { url }  -> busca foto, legenda e @ de um post público
// e guarda a foto no armazenamento do site (os links de foto do Instagram expiram).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function decode(s) {
  return String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}
const stripTags = (s) => decode(String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
const attr = (tag, name) => { const m = tag.match(new RegExp(name + '="([^"]*)"')); return m ? decode(m[1]) : ''; };

function parseEmbed(html) {
  const imgTag = (html.match(/<img[^>]*class="EmbeddedMediaImage"[^>]*>/) || [])[0] || '';
  let image = attr(imgTag, 'src');
  const srcset = attr(imgTag, 'srcset');
  if (srcset) {
    // pega a maior versão disponível
    const best = srcset.split(',').map((s) => s.trim().split(/\s+/)).map(([u, w]) => ({ u, w: parseInt(w, 10) || 0 })).sort((a, b) => b.w - a.w)[0];
    if (best && best.u) image = best.u;
  }
  const user = stripTags((html.match(/class="UsernameText"[^>]*>([^<]*)</) || [])[1]).trim();

  let caption = '';
  const ci = html.indexOf('class="Caption"');
  if (ci > -1) {
    const end = html.indexOf('class="CaptionComments"', ci);
    let block = html.slice(ci, end > ci ? end : ci + 4000);
    block = block.replace(/^[^>]*>/, '').replace(/<[^>]*$/, '').replace(/<a[^>]*class="CaptionUsername"[^>]*>[\s\S]*?<\/a>/, '');
    caption = stripTags(block).replace(/\s*(Ver todo|Ver tudo|See all|mais)\s*$/i, '').replace(/[ \t]+\n/g, '\n').trim();
  }

  let avatar = '';
  const hi = html.indexOf('class="Header"');
  if (hi > -1) {
    const headerEnd = html.indexOf('class="HeaderText"', hi);
    const header = html.slice(hi, headerEnd > hi ? headerEnd : hi + 3000);
    const av = (header.match(/<img[^>]*>/) || [])[0];
    if (av) avatar = attr(av, 'src');
  }
  const video = /PlayButtonSprite|WatchOnInstagram/.test(html);
  return { image, user, caption, avatar, video };
}

async function saveImage(url, name) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.instagram.com/' } });
  if (!r.ok) throw new Error('IMG_' + r.status);
  const type = (r.headers.get('content-type') || 'image/jpeg').split(';')[0];
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) throw new Error('IMG_TOO_LARGE');
  const blob = await put(`img/${name}.${ext}`, buf, { access: 'public', addRandomSuffix: true, contentType: type });
  return blob.url;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  if (!(await checkPin(req, res))) return;
  if (!hasStorage()) return json(res, 503, { ok: false, error: 'ARMAZENAMENTO_NAO_CONFIGURADO' });

  let body;
  try { body = await readJson(req, 10 * 1024); } catch (e) { return json(res, 400, { ok: false, error: 'JSON_INVALIDO' }); }
  const m = String(body.url || '').match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return json(res, 400, { ok: false, error: 'LINK_INVALIDO' });
  const kind = m[1].toLowerCase() === 'reels' ? 'reel' : m[1].toLowerCase();
  const code = m[2];

  let html = '';
  try {
    const r = await fetch(`https://www.instagram.com/${kind}/${code}/embed/captioned/`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', Accept: 'text/html' },
      redirect: 'follow'
    });
    if (!r.ok) return json(res, 502, { ok: false, error: 'INSTAGRAM_RECUSOU', status: r.status });
    html = await r.text();
  } catch (e) {
    return json(res, 502, { ok: false, error: 'INSTAGRAM_INDISPONIVEL' });
  }

  const data = parseEmbed(html);
  if (!data.image) return json(res, 422, { ok: false, error: 'FOTO_NAO_ENCONTRADA' });

  try {
    const imagem = await saveImage(data.image, 'ig-' + code.toLowerCase());
    let avatar = '';
    if (data.avatar) { try { avatar = await saveImage(data.avatar, 'ig-perfil'); } catch (e) { /* opcional */ } }
    return json(res, 200, {
      ok: true,
      url: `https://www.instagram.com/${kind}/${code}/`,
      imagem,
      legenda: data.caption.slice(0, 600),
      usuario: data.user,
      avatar,
      video: data.video
    }, { 'Cache-Control': 'no-store' });
  } catch (e) {
    console.error('instagram import', e);
    return json(res, 502, { ok: false, error: 'FOTO_NAO_BAIXOU' });
  }
}
