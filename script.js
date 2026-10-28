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

/* ---------- Aparência (definida no painel) ---------- */
const FONTS = {
  Montserrat: "'Montserrat', system-ui, sans-serif",
  Inter: "'Inter', system-ui, sans-serif",
  Poppins: "'Poppins', system-ui, sans-serif",
  'DM Sans': "'DM Sans', system-ui, sans-serif",
  Manrope: "'Manrope', system-ui, sans-serif"
};
const WEIGHTS = {
  leve: { display: 600, head: 500, label: 600 },
  media: { display: 700, head: 600, label: 600 },
  forte: { display: 900, head: 700, label: 800 }
};
const HERO_SIZES = { p: 'clamp(30px, 8.5vw, 44px)', m: 'clamp(36px, 10vw, 54px)', g: 'clamp(40px, 11.5vw, 68px)' };
const RADII = { reto: '4px', suave: '14px', redondo: '22px' };
function loadFont(name) {
  if (!FONTS[name] || name === 'Montserrat' || document.getElementById('font-' + name)) return;
  const l = document.createElement('link');
  l.id = 'font-' + name; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/ /g, '+') + ':wght@400;500;600;700;800;900&display=swap';
  document.head.append(l);
}
function applyAppearance(a) {
  a = a || {};
  const st = root.style;
  const font = FONTS[a.fonte] ? a.fonte : 'Montserrat';
  loadFont(font);
  st.setProperty('--font', FONTS[font]);
  const w = WEIGHTS[a.peso] || WEIGHTS.media;
  st.setProperty('--w-display', w.display);
  st.setProperty('--w-head', w.head);
  st.setProperty('--w-label', w.label);
  if (/^#[0-9a-f]{6}$/i.test(a.destaque || '')) st.setProperty('--accent-base', a.destaque);
  st.setProperty('--hero-size', HERO_SIZES[a.tituloTopo] || HERO_SIZES.m);
  st.setProperty('--radius', RADII[a.cantos] || RADII.suave);
  try { localStorage.setItem('cc-look', JSON.stringify(a)); } catch (e) {}
}

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
const SVGNS = 'http://www.w3.org/2000/svg';
function icon(paths, size = 22, fill = 'none') {
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', fill); s.setAttribute('stroke', fill === 'none' ? 'currentColor' : 'none');
  s.setAttribute('stroke-width', '1.7'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true');
  paths.forEach((d) => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); s.append(p); });
  return s;
}
const IG = {
  heart: ['M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z'],
  comment: ['M20.5 12a8.5 8.5 0 1 1-3.4-6.8 8.5 8.5 0 0 1 3.4 6.8z', 'M20.5 20.5l-2.7-2.6'],
  repost: ['M17 3.5l3 3-3 3', 'M4 11V9.5a3 3 0 0 1 3-3h13', 'M7 20.5l-3-3 3-3', 'M20 13v1.5a3 3 0 0 1-3 3H4'],
  send: ['M21 3.5L10.5 13.6', 'M21 3.5l-6.6 17-3.9-6.9-6.9-3.9z'],
  save: ['M18.5 20.5L12 15l-6.5 5.5v-16a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1z'],
  more: ['M5 12h.01M12 12h.01M19 12h.01'],
  reel: ['M4 4h16v16H4z', 'M4 8.5h16M9 4l2.5 4.5M14.5 4l2.5 4.5', 'M10.5 12v5l4-2.5z']
};

function igCard(p, handle, avatar) {
  const head = el('span', { class: 'ig-card__head' },
    avatar ? el('img', { class: 'ig-card__avatar', src: avatar, alt: '' }) : el('span', { class: 'ig-card__avatar', text: 'C' }),
    el('span', { class: 'ig-card__user', text: handle }),
    el('span', { class: 'ig-card__follow', text: 'Seguir' }),
    el('span', { class: 'ig-card__more' }, icon(IG.more, 20)));
  const media = el('span', { class: 'ig-card__media' });
  if (p.img) {
    media.append(el('img', { src: p.img, alt: p.legenda || 'Post da Cristo Company no Instagram', loading: 'lazy', draggable: 'false' }));
    if (p.video) media.append(el('span', { class: 'ig-card__play' }, icon(IG.reel, 22)));
  } else {
    media.append(el('span', { class: 'ig-card__empty' }, icon(['M4 4h16v16H4z', 'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z'], 30), el('span', { text: 'VER NO INSTAGRAM' })));
  }
  const actions = el('span', { class: 'ig-card__actions' },
    icon(IG.heart), icon(IG.comment), icon(IG.repost), icon(IG.send), el('span', { class: 'save' }, icon(IG.save)));
  const caption = p.legenda ? el('span', { class: 'ig-card__caption' }, el('b', { text: handle }), document.createTextNode(p.legenda)) : null;
  return el('a', { class: 'ig-card', href: p.url, target: '_blank', rel: 'noopener', draggable: 'false', 'aria-label': 'Ver post de ' + handle + ' no Instagram' + (p.legenda ? ': ' + p.legenda.slice(0, 80) : '') },
    head, media, actions, caption, el('span', { class: 'ig-card__link', text: 'Ver no Instagram' }));
}

/* Carrossel em loop infinito: avança sozinho a cada 4 segundos */
const carousel = (() => {
  const wrap = $('ig-carousel');
  const viewport = $('ig-viewport');
  const track = $('ig-track');
  const pauseBtn = $('ig-pause');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DELAY = 4000;
  let n = 0, index = 0, timer = null, userPaused = false, hover = false, focusIn = false, onScreen = true, busy = false;

  const step = () => {
    const first = track.children[0];
    if (!first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return first.getBoundingClientRect().width + gap;
  };
  function place(animate) {
    track.classList.toggle('no-anim', !animate || reduceMotion);
    track.style.transform = 'translate3d(' + (-index * step()) + 'px,0,0)';
  }
  function go(dir) {
    if (n < 2 || busy) return;
    busy = true;
    if (reduceMotion) {
      // Quem pediu menos movimento no aparelho vê uma troca suave por esmaecimento, sem deslizar
      viewport.style.opacity = '0';
      setTimeout(() => { index += dir; place(false); normalize(); viewport.style.opacity = '1'; }, 350);
      return;
    }
    index += dir;
    place(true);
    setTimeout(() => { if (busy) normalize(); }, 1100);
  }
  function normalize() {
    busy = false;
    if (index >= 2 * n) { index -= n; place(false); }
    else if (index < n) { index += n; place(false); }
  }
  track.addEventListener('transitionend', (e) => { if (e.target === track) normalize(); });

  const running = () => !userPaused && !hover && !focusIn && onScreen && !document.hidden && n > 1;
  function schedule() {
    clearInterval(timer); timer = null;
    if (running()) timer = setInterval(() => go(1), DELAY);
  }
  function setPaused(p) {
    userPaused = p;
    pauseBtn.classList.toggle('is-paused', p);
    pauseBtn.setAttribute('aria-label', p ? 'Continuar carrossel' : 'Pausar carrossel');
    schedule();
  }
  pauseBtn.addEventListener('click', () => setPaused(!userPaused));
  $('ig-next').addEventListener('click', () => { go(1); schedule(); });
  $('ig-prev').addEventListener('click', () => { go(-1); schedule(); });
  wrap.addEventListener('mouseenter', () => { hover = true; schedule(); });
  wrap.addEventListener('mouseleave', () => { hover = false; schedule(); });
  wrap.addEventListener('focusin', () => { focusIn = true; schedule(); });
  wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget)) { focusIn = false; schedule(); } });
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; schedule(); }, { threshold: 0.2 }).observe(wrap);
  }
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => place(false), 120); });

  // Arrastar com o dedo / mouse
  let startX = 0, dx = 0, dragging = false, moved = false;
  viewport.addEventListener('pointerdown', (e) => {
    if (n < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    dragging = true; moved = false; startX = e.clientX; dx = 0;
    track.classList.add('no-anim');
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    if (Math.abs(dx) > 8) moved = true;
    if (moved) track.style.transform = 'translate3d(' + (-index * step() + dx) + 'px,0,0)';
  });
  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); else place(true);
    schedule();
  });
  viewport.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  return {
    render(cards) {
      n = cards.length;
      wrap.hidden = n === 0;
      wrap.classList.toggle('is-single', n < 2);
      if (n < 2) { track.replaceChildren(...cards); index = 0; place(false); schedule(); return; }
      const clone = (c) => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.setAttribute('tabindex', '-1'); k.inert = true; return k; };
      // [cópias] [originais] [cópias] — permite girar sem fim nos dois sentidos
      track.replaceChildren(...cards.map(clone), ...cards, ...cards.map(clone));
      index = n;
      requestAnimationFrame(() => place(false));
      setPaused(userPaused);
    },
    hide() { n = 0; wrap.hidden = true; schedule(); }
  };
})();

function renderFeed(feed, links) {
  feed = feed || {};
  const mode = feed.modo === 'instagram' ? 'instagram' : 'produtos';
  $('t-feed').textContent = feed.titulo || 'VISTA A MENSAGEM.';
  $('feed-text').textContent = feed.texto || '';
  $('feed-text').hidden = !feed.texto;
  $('feed-eyebrow').textContent = mode === 'instagram' ? 'NO INSTAGRAM' : 'COLEÇÃO';

  const cta = $('feed-cta');
  const prodGrid = $('prod-grid');

  if (mode === 'instagram') {
    const igLink = safeLink(links.instagram) || 'https://www.instagram.com/cristocompanyofc/';
    $('feed-cta-label').textContent = 'SEGUIR NO INSTAGRAM';
    cta.href = igLink; cta.target = '_blank'; cta.rel = 'noopener';
    prodGrid.hidden = true;
    const handle = feed.perfilUsuario || ((igLink.match(/instagram\.com\/([^/?#]+)/i) || [])[1]) || 'cristocompanyofc';
    const avatar = safeUrl(feed.perfilFoto);
    const posts = (feed.instagram || [])
      .map((p) => ({ url: safeUrl(p && p.url).split('?')[0], img: safeUrl(p && p.imagem), legenda: (p && p.legenda) || '', video: Boolean(p && p.video) }))
      .filter((p) => /instagram\.com\/(p|reel|tv)\//i.test(p.url));
    carousel.render(posts.map((p) => igCard(p, handle, avatar)));
  } else {
    $('feed-cta-label').textContent = 'VER COLEÇÃO';
    const loja = safeLink(links.loja);
    cta.href = loja || '#feed';
    if (/^https?:/i.test(loja)) { cta.target = '_blank'; cta.rel = 'noopener'; } else { cta.removeAttribute('target'); }
    carousel.hide();
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
  applyAppearance(p.aparencia);
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
