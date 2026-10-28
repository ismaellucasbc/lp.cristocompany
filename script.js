/* =========================================================
   Cristo Company — interações e conteúdo do site
   O conteúdo (devocionais, vídeos, feed, textos e links) vem
   do painel em /painel, via /api/content.
   ========================================================= */

/* ---- VERSÍCULOS (tradução Almeida) — um por dia, em rodízio ---- */
const VERSES = [
  { t: 'O Senhor é o meu pastor; nada me faltará.', r: 'SALMOS 23:1' },
  { t: 'Portanto, ide, ensinai todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo.', r: 'MATEUS 28:19' },
  { t: 'Vós sois a luz do mundo; não se pode esconder uma cidade edificada sobre um monte.', r: 'MATEUS 5:14' },
  { t: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.', r: 'SALMOS 119:105' },
  { t: 'Posso todas as coisas naquele que me fortalece.', r: 'FILIPENSES 4:13' },
  { t: 'Esforça-te e tem bom ânimo; não temas, nem te espantes, porque o Senhor, teu Deus, é contigo por onde quer que andares.', r: 'JOSUÉ 1:9' },
  { t: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', r: 'JOÃO 3:16' },
  { t: 'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.', r: 'ISAÍAS 40:31' },
  { t: 'Oh! Quão bom e quão suave é que os irmãos vivam em união!', r: 'SALMOS 133:1' },
  { t: 'Ide por todo o mundo, pregai o evangelho a toda criatura.', r: 'MARCOS 16:15' }
];

const root = document.documentElement;
root.classList.add('js');
const $ = (id) => document.getElementById(id);

/* ---------- utilitários seguros (nada de innerHTML com conteúdo do painel) ---------- */
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
}
const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//i.test(u.trim()) ? u.trim() : '');
const safeLink = (u) => {
  if (typeof u !== 'string') return '';
  const s = u.trim();
  if (/^https?:\/\//i.test(s) || /^#[\w-]+$/.test(s) || /^mailto:/i.test(s)) return s;
  return '';
};
function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => el('p', { text: p }));
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d)) return '';
  try { return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase(); } catch (e) { return ''; }
}
const playIcon = () => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('width', '16'); s.setAttribute('height', '16'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'M8 5.5l11 6.5-11 6.5z'); s.append(p);
  return s;
};

/* ---------- Tema claro / escuro ---------- */
const themeBtn = $('theme-btn');
function applyTheme(t, save) {
  root.setAttribute('data-theme', t);
  themeBtn.setAttribute('aria-label', t === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'light' ? '#F6F4F0' : '#0A0A0A');
  if (save) { try { localStorage.setItem('cc-theme', t); } catch (e) {} }
}
let userTheme = null;
try { userTheme = localStorage.getItem('cc-theme'); } catch (e) {}
applyTheme(root.getAttribute('data-theme') || 'dark', false);
themeBtn.addEventListener('click', () => {
  userTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(userTheme, true);
});

/* ---------- Menu ---------- */
const menuBtn = $('menu-btn');
const menu = $('menu');
function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

/* ---------- Versículo do dia ---------- */
const now = new Date();
const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
let offset = 0;
const elCopy = $('verse-copy');
function currentVerse() { return VERSES[(dayOfYear + offset) % VERSES.length]; }
function renderVerse() {
  const v = currentVerse();
  $('verse-text').textContent = v.t;
  $('verse-ref').textContent = v.r;
  const msg = '“' + v.t + '” — ' + v.r + '\n\nVersículo do dia · Cristo Company\n' + location.origin;
  $('verse-share').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
  elCopy.classList.remove('is-copied');
  elCopy.setAttribute('aria-label', 'Copiar versículo');
}
$('verse-date').textContent = fmtDate(now.toISOString().slice(0, 10));
renderVerse();
$('verse-next').addEventListener('click', () => { offset = (offset + 1) % VERSES.length; renderVerse(); });
let copyTimer;
elCopy.addEventListener('click', async () => {
  const v = currentVerse();
  try {
    await navigator.clipboard.writeText('“' + v.t + '” — ' + v.r);
    elCopy.classList.add('is-copied');
    elCopy.setAttribute('aria-label', 'Versículo copiado');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { elCopy.classList.remove('is-copied'); elCopy.setAttribute('aria-label', 'Copiar versículo'); }, 2000);
  } catch (e) { /* cópia indisponível */ }
});

/* ---------- Devocional ---------- */
const devBtn = $('dev-toggle');
const devMore = $('dev-more');
function setDevOpen(open) {
  devMore.hidden = !open;
  devBtn.setAttribute('aria-expanded', String(open));
  devBtn.querySelector('span').textContent = open ? 'FECHAR' : 'LER COMPLETO';
}
devBtn.addEventListener('click', () => setDevOpen(devMore.hidden));

let devList = [];
function showDevotional(index) {
  const d = devList[index];
  if (!d) return;
  $('dev-title').textContent = d.titulo || '';
  $('dev-date').textContent = fmtDate(d.data);
  const verse = $('dev-verse');
  verse.textContent = (d.versiculo || '').toUpperCase();
  verse.hidden = !d.versiculo;
  const img = $('dev-img');
  const src = safeUrl(d.imagem);
  img.hidden = !src;
  if (src) { img.src = src; img.alt = d.titulo || ''; } else img.removeAttribute('src');

  const paras = paragraphs(d.texto);
  $('dev-preview').replaceChildren(...paras.slice(0, 1));
  $('dev-rest').replaceChildren(...paras.slice(1));
  $('dev-rest').hidden = paras.length < 2;
  $('dev-reflect-q').textContent = d.reflexao || '';
  $('dev-reflect').hidden = !d.reflexao;

  const older = devList.map((x, i) => ({ x, i })).filter((o) => o.i !== index);
  $('dev-older').hidden = older.length === 0;
  $('dev-older-list').replaceChildren(...older.map(({ x, i }) => {
    const b = el('button', { type: 'button' }, el('span', { text: x.titulo || 'Devocional' }), el('span', { text: fmtDate(x.data) }));
    b.addEventListener('click', () => { showDevotional(i); setDevOpen(true); $('devocional').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    return el('li', null, b);
  }));
  const hasMore = paras.length > 1 || Boolean(d.reflexao) || older.length > 0;
  devBtn.hidden = !hasMore;
}

/* ---------- Vídeos ---------- */
function renderVideos(videos) {
  const list = (videos || []).filter((v) => v && v.titulo);
  if (!list.length) return;
  $('vid-row').replaceChildren(...list.map((v) => {
    const link = safeLink(v.link) || '#videos';
    const thumb = el('div', { class: 'vid__thumb' });
    const cover = safeUrl(v.capa);
    if (cover) thumb.append(el('img', { src: cover, alt: '', loading: 'lazy' }));
    thumb.append(el('span', { class: 'vid__play' }, playIcon()));
    const ext = /^https?:/i.test(link);
    return el('a', { class: 'vid', href: link, target: ext ? '_blank' : null, rel: ext ? 'noopener' : null, 'aria-label': 'Assistir: ' + v.titulo },
      thumb, el('span', { class: 'vid__title', text: v.titulo }), el('span', { class: 'vid__cta', text: 'ASSISTIR' }));
  }));
}

/* ---------- Feed: produtos ou Instagram ---------- */
let igScriptLoaded = false;
function loadInstagramEmbeds() {
  if (window.instgrm && window.instgrm.Embeds) { window.instgrm.Embeds.process(); return; }
  if (igScriptLoaded) return;
  igScriptLoaded = true;
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.instagram.com/embed.js';
  document.body.append(s);
}
function renderFeed(feed, links) {
  feed = feed || {};
  const mode = feed.modo === 'instagram' ? 'instagram' : 'produtos';
  $('t-feed').textContent = feed.titulo || 'VISTA A MENSAGEM.';
  $('feed-text').textContent = feed.texto || '';
  $('feed-text').hidden = !feed.texto;
  $('feed-eyebrow').textContent = mode === 'instagram' ? 'NO INSTAGRAM' : 'COLEÇÃO';

  const cta = $('feed-cta');
  const prodGrid = $('prod-grid');
  const igRow = $('ig-row');

  if (mode === 'instagram') {
    $('feed-cta-label').textContent = 'SEGUIR NO INSTAGRAM';
    cta.href = safeLink(links.instagram) || 'https://www.instagram.com/cristocompanyofc/';
    cta.target = '_blank'; cta.rel = 'noopener';
    prodGrid.hidden = true;
    const posts = (feed.instagram || []).map((p) => safeUrl(p && p.url)).filter((u) => /instagram\.com\/(p|reel|tv)\//i.test(u));
    igRow.hidden = posts.length === 0;
    igRow.replaceChildren(...posts.map((u) => {
      const clean = u.split('?')[0];
      return el('div', null,
        el('blockquote', { class: 'instagram-media', 'data-instgrm-permalink': clean, 'data-instgrm-version': '14' },
          el('a', { href: clean, target: '_blank', rel: 'noopener', text: 'Ver esta publicação no Instagram' })));
    }));
    if (posts.length) loadInstagramEmbeds();
  } else {
    $('feed-cta-label').textContent = 'VER COLEÇÃO';
    const loja = safeLink(links.loja);
    cta.href = loja || '#feed';
    if (/^https?:/i.test(loja)) { cta.target = '_blank'; cta.rel = 'noopener'; } else { cta.removeAttribute('target'); }
    igRow.hidden = true;
    const prods = (feed.produtos || []).filter((p) => p && p.nome);
    prodGrid.hidden = prods.length === 0;
    prodGrid.replaceChildren(...prods.map((p) => {
      const link = safeLink(p.link) || loja || '#feed';
      const ext = /^https?:/i.test(link);
      const img = safeUrl(p.imagem);
      const media = el('a', { class: 'prod__img', href: link, target: ext ? '_blank' : null, rel: ext ? 'noopener' : null, 'aria-label': 'Ver ' + p.nome });
      if (img) media.append(el('img', { src: img, alt: p.nome, loading: 'lazy' }));
      return el('article', { class: 'prod' },
        media,
        el('h3', { class: 'prod__name', text: p.nome }),
        p.preco ? el('p', { class: 'prod__price', text: p.preco }) : null,
        el('a', { class: 'prod__btn', href: link, target: ext ? '_blank' : null, rel: ext ? 'noopener' : null, text: 'VER PRODUTO' }));
    }));
  }
}

/* ---------- Links ---------- */
function applyLinks(links) {
  document.querySelectorAll('[data-link]').forEach((a) => {
    if (a.id === 'feed-cta') return;
    const url = safeLink(links[a.dataset.link]);
    if (!url) return;
    a.setAttribute('href', url);
    if (/^https?:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); }
  });
}

/* ---------- Ordem e visibilidade das seções ---------- */
function applySections(sections) {
  if (!Array.isArray(sections)) return;
  const main = $('main');
  const nodes = {};
  main.querySelectorAll(':scope > [data-section]').forEach((n) => { nodes[n.dataset.section] = n; });
  sections.forEach((s) => {
    const n = nodes[s.id];
    if (!n) return;
    n.hidden = s.visivel === false;
    main.append(n);
  });
  // atalhos e menu escondem itens de seções ocultas
  const hiddenIds = new Set(sections.filter((s) => s.visivel === false).map((s) => s.id));
  const map = { '#versiculo': 'destaques', '#devocional': 'destaques', '#videos': 'videos', '#oracao': 'oracao', '#comunidade': 'comunidade', '#feed': 'feed' };
  document.querySelectorAll('.menu a, .tab').forEach((a) => {
    const sec = map[a.getAttribute('href')];
    if (sec) a.hidden = hiddenIds.has(sec);
  });
}

/* ---------- Hero ---------- */
function applyHero(p) {
  if (p.heroLinha1) $('hero-l1').textContent = p.heroLinha1;
  if (p.heroLinha2) $('hero-l2').textContent = p.heroLinha2;
  if (p.heroDestaque) $('hero-l3').textContent = p.heroDestaque;
  if (p.heroTexto) $('hero-text').textContent = p.heroTexto;
  const src = safeUrl(p.heroImagem);
  const img = $('hero-img');
  if (src) { img.src = src; img.hidden = false; img.parentElement.classList.add('has-photo'); }
}

/* ---------- Carrega o conteúdo do painel ---------- */
function render(c) {
  const p = c.pagina || {};
  const links = c.links || {};
  if (!userTheme && (p.temaPadrao === 'claro' || p.temaPadrao === 'escuro')) applyTheme(p.temaPadrao === 'claro' ? 'light' : 'dark', false);
  applyHero(p);
  applyLinks(links);
  devList = (c.devocionais || []).filter((d) => d && d.titulo).sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
  if (devList.length) showDevotional(0);
  renderVideos(c.videos);
  renderFeed(c.feed, links);
  applySections(p.secoes);
}
fetch('/api/content')
  .then((r) => (r.ok ? r.json() : null))
  .then((data) => { if (data && data.content) render(data.content); })
  .catch(() => { /* sem API: fica o conteúdo padrão da página */ });

/* ---------- Barra inferior: marca a aba da seção visível ---------- */
const tabs = Array.from(document.querySelectorAll('.tab'));
function setActiveTab(id) {
  tabs.forEach((t) => {
    const on = t.getAttribute('href') === '#' + id;
    t.classList.toggle('is-active', on);
    if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
  });
}
if ('IntersectionObserver' in window) {
  const tabObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActiveTab(en.target.id); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  tabs.map((t) => document.querySelector(t.getAttribute('href'))).filter(Boolean).forEach((n) => tabObs.observe(n));

  const revObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); revObs.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((n) => revObs.observe(n));
} else {
  document.querySelectorAll('.reveal').forEach((n) => n.classList.add('is-visible'));
}

/* ---------- Acesso do administrador: cadeado discreto no rodapé ---------- */
const adminDialog = $('admin-dialog');
const adminPin = $('admin-pin');
const adminMsg = $('admin-msg');
const adminEnter = $('admin-enter');
function openAdmin() {
  // já entrou nesta aba? vai direto para o painel
  try { if (sessionStorage.getItem('cc-pin')) { location.href = '/painel'; return; } } catch (e) {}
  adminMsg.textContent = '';
  adminPin.value = '';
  if (typeof adminDialog.showModal === 'function') adminDialog.showModal(); else location.href = '/painel';
  adminPin.focus();
}
$('admin-btn').addEventListener('click', openAdmin);
$('admin-cancel').addEventListener('click', () => adminDialog.close());
$('admin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = adminPin.value.trim();
  if (!pin) return;
  adminEnter.disabled = true; adminEnter.textContent = 'Entrando...'; adminMsg.textContent = '';
  try {
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'x-admin-pin': pin } });
    if (r.ok) {
      try { sessionStorage.setItem('cc-pin', pin); } catch (err) {}
      location.href = '/painel';
      return;
    }
    const body = await r.json().catch(() => ({}));
    adminMsg.textContent = body.error === 'PIN_NAO_CONFIGURADO' ? 'O PIN ainda não foi configurado.' : 'PIN incorreto.';
    adminPin.select();
  } catch (err) {
    adminMsg.textContent = 'Sem conexão. Tente de novo.';
  }
  adminEnter.disabled = false; adminEnter.textContent = 'Entrar';
});

$('year').textContent = now.getFullYear();
