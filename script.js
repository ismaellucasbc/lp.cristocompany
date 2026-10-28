/* =========================================================
   Cristo Company — interações
   ========================================================= */

/* ---- LINKS: troque aqui e todos os botões atualizam ---- */
const LINKS = {
  loja: '#colecao',                                          // [LINK DA LOJA]
  comunidade: 'https://www.instagram.com/cristocompanyofc/',  // [LINK DO GRUPO]
  oracao: 'https://ig.me/m/cristocompanyofc'                  // direct do Instagram
};

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

document.documentElement.classList.add('js');

/* Aplica os links configurados */
document.querySelectorAll('[data-link]').forEach((el) => {
  const url = LINKS[el.dataset.link];
  if (!url) return;
  el.setAttribute('href', url);
  if (/^https?:/.test(url)) { el.target = '_blank'; el.rel = 'noopener'; }
  else { el.removeAttribute('target'); }
});

/* Menu */
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');
function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

/* Versículo do dia */
const now = new Date();
const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
let offset = 0;
const elText = document.getElementById('verse-text');
const elRef = document.getElementById('verse-ref');
const elShare = document.getElementById('verse-share');
const elCopy = document.getElementById('verse-copy');

function currentVerse() { return VERSES[(dayOfYear + offset) % VERSES.length]; }
function renderVerse() {
  const v = currentVerse();
  elText.textContent = v.t;
  elRef.textContent = v.r;
  const msg = '“' + v.t + '” — ' + v.r + '\n\nVersículo do dia · Cristo Company\n' + location.origin;
  elShare.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
  elCopy.classList.remove('is-copied');
  elCopy.setAttribute('aria-label', 'Copiar versículo');
}
try {
  document.getElementById('verse-date').textContent =
    now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase();
} catch (e) { /* sem data */ }
renderVerse();

document.getElementById('verse-next').addEventListener('click', () => { offset = (offset + 1) % VERSES.length; renderVerse(); });

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

/* Devocional: ler completo */
const devBtn = document.getElementById('dev-toggle');
const devMore = document.getElementById('dev-more');
devBtn.addEventListener('click', () => {
  const open = devMore.hidden;
  devMore.hidden = !open;
  devBtn.setAttribute('aria-expanded', String(open));
  devBtn.querySelector('span').textContent = open ? 'FECHAR' : 'LER COMPLETO';
});

/* Barra inferior: marca a aba da seção visível */
const tabs = Array.from(document.querySelectorAll('.tab'));
const tabTargets = tabs.map((t) => document.querySelector(t.getAttribute('href'))).filter(Boolean);
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
  tabTargets.forEach((el) => tabObs.observe(el));

  /* Animação de entrada */
  const revObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); revObs.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => revObs.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

document.getElementById('year').textContent = now.getFullYear();
