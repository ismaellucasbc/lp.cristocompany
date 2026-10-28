/* =========================================================
   Painel da Cristo Company
   Entra com PIN, edita o conteúdo e publica em /api/save.
   ========================================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  let pin = '';
  let state = null;
  let dirty = false;
  let saving = false;
  let storageOk = true;

  /* ---------- utilitários ---------- */
  function el(tag, attrs, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) n.append(c);
    return n;
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const fmtDate = (iso) => {
    if (!iso) return 'Sem data';
    const d = new Date(iso + 'T12:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const svg = (d, size = 18) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.append(p);
    return s;
  };
  const ICON = { up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', chev: 'M6 9l6 6 6-6', plus: 'M12 5v14M5 12h14' };

  const ERR = {
    PIN_INVALIDO: 'PIN incorreto.',
    PIN_NAO_CONFIGURADO: 'O PIN ainda não foi configurado na Vercel (variável ADMIN_PIN).',
    ARMAZENAMENTO_NAO_CONFIGURADO: 'O armazenamento ainda não foi ligado na Vercel. Dá para editar, mas não publicar.',
    MUITO_GRANDE: 'Arquivo grande demais.',
    TIPO_NAO_SUPORTADO: 'Use foto em JPG, PNG ou WEBP.',
    GRAVACAO_FALHOU: 'Não foi possível salvar agora. Tente de novo.',
    UPLOAD_FALHOU: 'Não foi possível enviar a foto. Tente de novo.',
    LINK_INVALIDO: 'Esse link não parece de um post do Instagram.',
    INSTAGRAM_RECUSOU: 'O Instagram não liberou este post agora. Tente de novo em alguns minutos ou envie a foto abaixo.',
    INSTAGRAM_INDISPONIVEL: 'Não consegui falar com o Instagram. Tente de novo ou envie a foto abaixo.',
    FOTO_NAO_ENCONTRADA: 'Não achei a foto desse post (ele é público?). Envie a foto abaixo.',
    FOTO_NAO_BAIXOU: 'Não consegui baixar a foto. Tente de novo ou envie a foto abaixo.'
  };
  const errMsg = (code) => ERR[code] || 'Algo deu errado. Tente de novo.';

  async function api(path, opts = {}) {
    const res = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), 'x-admin-pin': pin } });
    let body = null;
    try { body = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, body: body || {} };
  }

  /* ---------- estado e salvar ---------- */
  function markDirty() {
    dirty = true;
    const s = $('save-status');
    s.textContent = 'Alterações não publicadas';
    s.className = 'pn-savebar__status is-dirty';
    $('save-btn').disabled = saving;
  }
  async function save() {
    if (saving) return;
    saving = true;
    const btn = $('save-btn');
    const status = $('save-status');
    btn.disabled = true;
    btn.textContent = 'Publicando...';
    const r = await api('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }).catch(() => ({ ok: false, body: {} }));
    saving = false;
    btn.textContent = 'Salvar e publicar';
    if (r.ok) {
      dirty = false;
      state.updatedAt = r.body.updatedAt;
      const t = new Date(r.body.updatedAt || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      status.textContent = 'Publicado às ' + t + '. O site atualiza em alguns segundos.';
      status.className = 'pn-savebar__status';
      btn.disabled = true;
    } else {
      status.textContent = errMsg(r.body.error);
      status.className = 'pn-savebar__status is-error';
      btn.disabled = false;
      if (r.status === 401) logout();
    }
  }
  $('save-btn').addEventListener('click', save);
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- componentes de formulário ---------- */
  function field(label, value, onInput, opt = {}) {
    const id = 'f-' + uid();
    const input = opt.type === 'textarea'
      ? el('textarea', { id, class: 'pn-textarea', rows: opt.rows || 6, placeholder: opt.placeholder || '' })
      : el('input', { id, class: 'pn-input', type: opt.type || 'text', placeholder: opt.placeholder || '', inputmode: opt.inputmode || null });
    input.value = value || '';
    input.addEventListener('input', () => { onInput(input.value); markDirty(); });
    return el('div', { class: 'pn-field' }, el('label', { class: 'pn-label', for: id, text: label }), input, opt.hint ? el('p', { class: 'pn-hint', text: opt.hint }) : null);
  }

  async function resizeImage(file, maxSide = 1600) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
      return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
    } finally { URL.revokeObjectURL(url); }
  }

  function imageField(label, value, onChange, nameHint) {
    const wrap = el('div', { class: 'pn-field' });
    const fileId = 'file-' + uid();
    const msg = el('p', { class: 'pn-hint', 'aria-live': 'polite' });
    function draw(url) {
      const preview = url ? el('img', { class: 'pn-image__preview', src: url, alt: '' }) : el('div', { class: 'pn-image__empty', text: 'Sem foto' });
      const file = el('input', { id: fileId, class: 'pn-file', type: 'file', accept: 'image/jpeg,image/png,image/webp' });
      file.addEventListener('change', async () => {
        const f = file.files && file.files[0];
        if (!f) return;
        if (!storageOk) { msg.textContent = errMsg('ARMAZENAMENTO_NAO_CONFIGURADO'); return; }
        msg.textContent = 'Enviando foto...';
        try {
          const blob = await resizeImage(f);
          const r = await api('/api/upload?nome=' + encodeURIComponent(nameHint ? nameHint() : 'imagem'), { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
          if (!r.ok) { msg.textContent = errMsg(r.body.error); return; }
          onChange(r.body.url); markDirty(); msg.textContent = 'Foto enviada. Lembre de publicar.';
          draw(r.body.url);
        } catch (e) { msg.textContent = errMsg('UPLOAD_FALHOU'); }
      });
      const pick = el('label', { class: 'pn-btn pn-btn--sm', for: fileId, tabindex: '0', role: 'button', text: url ? 'Trocar foto' : 'Enviar foto' });
      pick.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
      const remove = url ? el('button', { type: 'button', class: 'pn-btn pn-btn--sm pn-btn--danger', text: 'Remover', onclick: () => { onChange(''); markDirty(); msg.textContent = ''; draw(''); } }) : null;
      wrap.replaceChildren(el('span', { class: 'pn-label', text: label }), el('div', { class: 'pn-image' }, preview, el('div', { class: 'pn-image__btns' }, file, pick, remove)), msg);
    }
    draw(value);
    return wrap;
  }

  /* Lista de itens com abrir/fechar, subir/descer e excluir */
  function itemList(container, arr, opts) {
    const openIds = new Set();
    function draw() {
      container.replaceChildren();
      if (!arr.length) { container.append(el('p', { class: 'pn-empty', text: opts.empty })); return; }
      arr.forEach((item, i) => {
        const det = el('details', { class: 'pn-item' });
        if (openIds.has(item.id)) det.open = true;
        det.addEventListener('toggle', () => { if (det.open) openIds.add(item.id); else openIds.delete(item.id); });
        const thumbUrl = opts.thumb ? opts.thumb(item) : '';
        const titleEl = el('span', { class: 'pn-item__title', text: opts.title(item) });
        const metaEl = el('span', { class: 'pn-item__meta', text: opts.meta ? opts.meta(item) : '' });
        const summary = el('summary', null,
          opts.thumb ? (thumbUrl ? el('img', { class: 'pn-item__thumb', src: thumbUrl, alt: '' }) : el('span', { class: 'pn-item__thumb' })) : null,
          el('span', { class: 'pn-item__info' }, titleEl, metaEl),
          el('span', { class: 'pn-item__chev' }, svg(ICON.chev)));
        const refresh = () => { titleEl.textContent = opts.title(item); metaEl.textContent = opts.meta ? opts.meta(item) : ''; };
        let confirmTimer;
        const del = el('button', { type: 'button', class: 'pn-btn pn-btn--sm pn-btn--danger', text: 'Excluir' });
        del.addEventListener('click', () => {
          if (!del.classList.contains('is-confirm')) {
            del.classList.add('is-confirm'); del.textContent = 'Confirmar exclusão';
            confirmTimer = setTimeout(() => { del.classList.remove('is-confirm'); del.textContent = 'Excluir'; }, 4000);
            return;
          }
          clearTimeout(confirmTimer);
          arr.splice(i, 1); markDirty(); draw();
        });
        const move = (dir) => { const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; markDirty(); draw(); };
        const moveBtns = opts.sortable === false ? null : el('div', { class: 'pn-item__move' },
          el('button', { type: 'button', class: 'pn-btn pn-btn--sm pn-icon', 'aria-label': 'Subir', disabled: i === 0, onclick: () => move(-1) }, svg(ICON.up)),
          el('button', { type: 'button', class: 'pn-btn pn-btn--sm pn-icon', 'aria-label': 'Descer', disabled: i === arr.length - 1, onclick: () => move(1) }, svg(ICON.down)));
        const body = el('div', { class: 'pn-item__body' }, opts.fields(item, refresh), el('div', { class: 'pn-item__actions' }, moveBtns || el('span'), del));
        det.append(summary, body);
        container.append(det);
      });
    }
    draw();
    return {
      redraw: draw,
      add(item) { arr.unshift(item); openIds.add(item.id); markDirty(); draw(); container.querySelector('details') && container.querySelector('details').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    };
  }

  /* ---------- Abas ---------- */
  function renderDevocionais() {
    const panel = $('tab-devocionais');
    const list = el('div', { class: 'pn-panel' });
    const sorted = state.devocionais;
    const ctl = itemList(list, sorted, {
      empty: 'Nenhum devocional ainda. Toque em "Novo devocional".',
      title: (d) => d.titulo || 'Sem título',
      meta: (d) => fmtDate(d.data),
      thumb: (d) => d.imagem,
      sortable: false,
      fields: (d, refresh) => [
        el('div', { class: 'pn-row pn-row--2' },
          field('Título', d.titulo, (v) => { d.titulo = v; refresh(); }),
          field('Data', d.data, (v) => { d.data = v; refresh(); }, { type: 'date', hint: 'O site mostra o devocional com a data mais recente.' })),
        field('Versículo base (opcional)', d.versiculo, (v) => { d.versiculo = v; }, { placeholder: 'Ex.: Mateus 6:34' }),
        field('Texto', d.texto, (v) => { d.texto = v; }, { type: 'textarea', rows: 10, hint: 'Deixe uma linha em branco entre os parágrafos. O primeiro parágrafo aparece antes do "Ler completo".' }),
        field('Pergunta para refletir (opcional)', d.reflexao, (v) => { d.reflexao = v; }),
        imageField('Imagem (opcional)', d.imagem, (v) => { d.imagem = v; refresh(); }, () => d.titulo)
      ]
    });
    panel.replaceChildren(
      el('div', { class: 'pn-head' },
        el('h2', { text: 'Devocionais' }),
        el('button', { type: 'button', class: 'pn-btn pn-btn--primary pn-btn--sm', onclick: () => ctl.add({ id: uid(), titulo: '', data: today(), versiculo: '', texto: '', reflexao: '', imagem: '' }) }, svg(ICON.plus, 16), 'Novo devocional'),
        el('p', { text: 'O mais recente fica em destaque no site; os outros aparecem em "Devocionais anteriores".' })),
      list);
  }

  function renderVideos() {
    const panel = $('tab-videos');
    const list = el('div', { class: 'pn-panel' });
    const ctl = itemList(list, state.videos, {
      empty: 'Nenhum vídeo. Toque em "Novo vídeo".',
      title: (v) => v.titulo || 'Sem título',
      meta: (v) => v.link ? 'Com link' : 'Sem link',
      thumb: (v) => v.capa,
      fields: (v, refresh) => [
        field('Título', v.titulo, (x) => { v.titulo = x; refresh(); }),
        field('Link do vídeo', v.link, (x) => { v.link = x.trim(); refresh(); }, { type: 'url', placeholder: 'https://www.instagram.com/reel/...', hint: 'Pode ser Reels, YouTube ou qualquer link.' }),
        imageField('Capa', v.capa, (x) => { v.capa = x; refresh(); }, () => v.titulo)
      ]
    });
    panel.replaceChildren(
      el('div', { class: 'pn-head' },
        el('h2', { text: 'Vídeos' }),
        el('button', { type: 'button', class: 'pn-btn pn-btn--primary pn-btn--sm', onclick: () => ctl.add({ id: uid(), titulo: '', link: '', capa: '' }) }, svg(ICON.plus, 16), 'Novo vídeo'),
        el('p', { text: 'Aparecem em "Palavras para o seu momento", na ordem desta lista.' })),
      list);
  }

  function renderFeed() {
    const panel = $('tab-feed');
    const f = state.feed;
    f.produtos = f.produtos || []; f.instagram = f.instagram || [];
    const modeBox = el('div', { class: 'pn-choice', role: 'radiogroup', 'aria-label': 'O que o feed mostra' });
    const listWrap = el('div', { class: 'pn-panel' });
    [['produtos', 'Produtos da loja'], ['instagram', 'Posts do Instagram']].forEach(([val, label]) => {
      const r = el('input', { type: 'radio', name: 'feed-mode', value: val });
      r.checked = (f.modo || 'produtos') === val;
      r.addEventListener('change', () => { f.modo = val; markDirty(); drawList(); });
      modeBox.append(el('label', null, r, label));
    });
    function drawList() {
      if ((f.modo || 'produtos') === 'instagram') {
        const list = el('div', { class: 'pn-panel' });
        const validUrl = (u) => /instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/[A-Za-z0-9_-]+/i.test(u || '');
        async function importPost(p) {
          const r = await api('/api/instagram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: p.url }) }).catch(() => ({ ok: false, body: {} }));
          if (!r.ok) return { ok: false, msg: errMsg(r.body.error) };
          p.url = r.body.url || p.url;
          p.imagem = r.body.imagem;
          if (r.body.legenda) p.legenda = r.body.legenda;
          p.video = Boolean(r.body.video);
          if (!f.perfilFoto && r.body.avatar) f.perfilFoto = r.body.avatar;
          if (!f.perfilUsuario && r.body.usuario) f.perfilUsuario = r.body.usuario;
          markDirty();
          return { ok: true };
        }
        const ctl = itemList(list, f.instagram, {
          empty: 'Nenhum post. Toque em "Adicionar post" e cole o link.',
          title: (p) => (p.legenda || '').split('\n')[0] || (p.url ? p.url.replace(/^https?:\/\/(www\.)?/, '') : 'Link do post'),
          meta: (p) => !validUrl(p.url) ? 'Cole o link do post' : (p.imagem ? (p.video ? 'Vídeo · pronto' : 'Foto · pronto') : 'Falta a foto'),
          thumb: (p) => p.imagem,
          fields: (p, refresh) => {
            const status = el('p', { class: 'pn-hint', 'aria-live': 'polite' });
            const fetchBtn = el('button', { type: 'button', class: 'pn-btn pn-btn--sm' }, 'Buscar foto e legenda do Instagram');
            async function run() {
              if (!validUrl(p.url)) { status.textContent = 'Cole primeiro o link do post.'; return; }
              fetchBtn.disabled = true; status.textContent = 'Buscando no Instagram...';
              const r = await importPost(p);
              fetchBtn.disabled = false;
              if (r.ok) { status.textContent = 'Pronto! Confira e publique.'; ctl.redraw(); }
              else status.textContent = r.msg;
            }
            fetchBtn.addEventListener('click', run);
            const linkField = field('Link do post', p.url, (x) => { p.url = x.trim(); refresh(); }, { type: 'url', placeholder: 'https://www.instagram.com/p/...', hint: 'No Instagram: três pontinhos do post → "Copiar link". Ao colar, o painel busca a foto e a legenda sozinho.' });
            linkField.querySelector('input').addEventListener('change', () => { if (validUrl(p.url) && !p.imagem) run(); });
            return [
              linkField,
              el('div', { class: 'pn-field' }, fetchBtn, status),
              imageField('Foto do post', p.imagem, (x) => { p.imagem = x; refresh(); }, () => 'instagram'),
              field('Legenda', p.legenda, (x) => { p.legenda = x; refresh(); }, { type: 'textarea', rows: 3, hint: 'No site aparecem as duas primeiras linhas.' })
            ];
          }
        });
        const allStatus = el('p', { class: 'pn-hint', 'aria-live': 'polite' });
        const allBtn = el('button', { type: 'button', class: 'pn-btn pn-btn--sm' }, 'Buscar fotos que faltam');
        allBtn.addEventListener('click', async () => {
          const pending = f.instagram.filter((p) => validUrl(p.url) && !p.imagem);
          if (!pending.length) { allStatus.textContent = 'Todos os posts já têm foto.'; return; }
          allBtn.disabled = true;
          let ok = 0;
          for (let i = 0; i < pending.length; i++) {
            allStatus.textContent = 'Buscando ' + (i + 1) + ' de ' + pending.length + '...';
            const r = await importPost(pending[i]);
            if (r.ok) ok++;
          }
          allBtn.disabled = false;
          allStatus.textContent = ok === pending.length ? 'Pronto! ' + ok + ' post(s) atualizados. Agora é só publicar.' : ok + ' de ' + pending.length + ' atualizados. Nos que faltaram, envie a foto manualmente.';
          ctl.redraw();
          drawProfile();
        });
        const profileBox = el('div', { class: 'pn-box' });
        function drawProfile() {
          profileBox.replaceChildren(
            el('p', { class: 'pn-sub', text: 'PERFIL NOS CARDS' }),
            el('div', { class: 'pn-row pn-row--2' },
              imageField('Foto do perfil', f.perfilFoto, (x) => { f.perfilFoto = x; }, () => 'perfil'),
              field('Nome de usuário', f.perfilUsuario, (x) => { f.perfilUsuario = x.replace(/^@/, '').trim(); }, { placeholder: 'cristocompanyofc' })));
        }
        drawProfile();
        listWrap.replaceChildren(
          el('div', { class: 'pn-head' }, el('p', { class: 'pn-sub', text: 'POSTS DO INSTAGRAM' }),
            el('div', { class: 'pn-image__btns' }, allBtn,
              el('button', { type: 'button', class: 'pn-btn pn-btn--primary pn-btn--sm', onclick: () => ctl.add({ id: uid(), url: '', imagem: '', legenda: '' }) }, svg(ICON.plus, 16), 'Adicionar post')),
            allStatus),
          list,
          profileBox);
      } else {
        const list = el('div', { class: 'pn-panel' });
        const ctl = itemList(list, f.produtos, {
          empty: 'Nenhum produto. Toque em "Novo produto".',
          title: (p) => p.nome || 'Sem nome',
          meta: (p) => p.preco || 'Sem preço',
          thumb: (p) => p.imagem,
          fields: (p, refresh) => [
            el('div', { class: 'pn-row pn-row--2' },
              field('Nome', p.nome, (x) => { p.nome = x; refresh(); }),
              field('Preço', p.preco, (x) => { p.preco = x; refresh(); }, { placeholder: 'R$ 129,90' })),
            field('Link para comprar', p.link, (x) => { p.link = x.trim(); }, { type: 'url', placeholder: 'https://...', hint: 'Se ficar vazio, o botão leva para o link da loja (aba Página).' }),
            imageField('Foto', p.imagem, (x) => { p.imagem = x; refresh(); }, () => p.nome)
          ]
        });
        listWrap.replaceChildren(
          el('div', { class: 'pn-head' }, el('p', { class: 'pn-sub', text: 'PRODUTOS' }),
            el('button', { type: 'button', class: 'pn-btn pn-btn--primary pn-btn--sm', onclick: () => ctl.add({ id: uid(), nome: '', preco: '', link: '', imagem: '' }) }, svg(ICON.plus, 16), 'Novo produto')),
          list);
      }
    }
    drawList();
    panel.replaceChildren(
      el('div', { class: 'pn-head' }, el('h2', { text: 'Feed' }), el('p', { text: 'Bloco no fim da página. Escolha o que ele mostra; os dois cadastros ficam guardados.' })),
      el('div', { class: 'pn-box' },
        el('span', { class: 'pn-label', text: 'O feed mostra' }), modeBox,
        field('Título do bloco', f.titulo, (x) => { f.titulo = x; }),
        field('Texto do bloco', f.texto, (x) => { f.texto = x; })),
      listWrap);
  }

  function renderPagina() {
    const panel = $('tab-pagina');
    const p = state.pagina; const l = state.links;
    const themeSel = el('select', { id: 'f-tema', class: 'pn-select' },
      el('option', { value: 'escuro', text: 'Escuro' }), el('option', { value: 'claro', text: 'Claro' }));
    themeSel.value = p.temaPadrao === 'claro' ? 'claro' : 'escuro';
    themeSel.addEventListener('change', () => { p.temaPadrao = themeSel.value; markDirty(); });

    const secList = el('ul', { class: 'pn-sections' });
    function drawSections() {
      secList.replaceChildren(...p.secoes.map((s, i) => {
        const cb = el('input', { type: 'checkbox' }); cb.checked = s.visivel !== false;
        cb.addEventListener('change', () => { s.visivel = cb.checked; markDirty(); });
        const move = (dir) => { const j = i + dir; if (j < 0 || j >= p.secoes.length) return; [p.secoes[i], p.secoes[j]] = [p.secoes[j], p.secoes[i]]; markDirty(); drawSections(); };
        return el('li', null,
          el('label', null, cb, s.nome || s.id),
          el('button', { type: 'button', class: 'pn-btn pn-btn--sm pn-icon', 'aria-label': 'Subir ' + (s.nome || s.id), disabled: i === 0, onclick: () => move(-1) }, svg(ICON.up)),
          el('button', { type: 'button', class: 'pn-btn pn-btn--sm pn-icon', 'aria-label': 'Descer ' + (s.nome || s.id), disabled: i === p.secoes.length - 1, onclick: () => move(1) }, svg(ICON.down)));
      }));
    }
    drawSections();

    panel.replaceChildren(
      el('div', { class: 'pn-head' }, el('h2', { text: 'Página' }), el('p', { text: 'Textos do topo, links, tema e a ordem das seções.' })),
      el('div', { class: 'pn-box' },
        el('p', { class: 'pn-sub', text: 'TOPO DA PÁGINA' }),
        el('div', { class: 'pn-row pn-row--2' },
          field('Linha 1', p.heroLinha1, (x) => { p.heroLinha1 = x; }),
          field('Linha 2', p.heroLinha2, (x) => { p.heroLinha2 = x; })),
        field('Palavra em destaque (rosa)', p.heroDestaque, (x) => { p.heroDestaque = x; }),
        field('Texto de apoio', p.heroTexto, (x) => { p.heroTexto = x; }, { type: 'textarea', rows: 3 }),
        imageField('Foto do topo (opcional — substitui a ilustração da cruz)', p.heroImagem, (x) => { p.heroImagem = x; }, () => 'topo')),
      el('div', { class: 'pn-box' },
        el('p', { class: 'pn-sub', text: 'SEÇÕES' }),
        el('p', { class: 'pn-hint', text: 'Desmarque para esconder. Use as setas para mudar a ordem.' }),
        secList),
      el('div', { class: 'pn-box' },
        el('p', { class: 'pn-sub', text: 'LINKS' }),
        field('Loja', l.loja, (x) => { l.loja = x.trim(); }, { type: 'url', placeholder: 'https://...' }),
        field('Grupo da comunidade', l.comunidade, (x) => { l.comunidade = x.trim(); }, { type: 'url', placeholder: 'https://chat.whatsapp.com/...' }),
        field('Pedido de oração', l.oracao, (x) => { l.oracao = x.trim(); }, { type: 'url', placeholder: 'https://wa.me/55...' }),
        field('Instagram', l.instagram, (x) => { l.instagram = x.trim(); }, { type: 'url' })),
      el('div', { class: 'pn-box' },
        el('p', { class: 'pn-sub', text: 'TEMA' }),
        el('div', { class: 'pn-field' }, el('label', { class: 'pn-label', for: 'f-tema', text: 'Tema padrão para quem visita' }), themeSel,
          el('p', { class: 'pn-hint', text: 'Quem trocar o tema no botão do site continua vendo o que escolheu.' }))));
  }

  function renderAll() { renderDevocionais(); renderVideos(); renderFeed(); renderPagina(); }

  document.querySelectorAll('.pn-tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.pn-tab').forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
    document.querySelectorAll('.pn-panel[id^="tab-"]').forEach((p) => { p.hidden = p.id !== 'tab-' + t.dataset.tab; });
    window.scrollTo({ top: 0 });
  }));

  /* ---------- normaliza o conteúdo recebido ---------- */
  function normalize(c) {
    c = c || {};
    c.pagina = c.pagina || {};
    c.pagina.secoes = Array.isArray(c.pagina.secoes) ? c.pagina.secoes : [];
    c.links = c.links || {};
    c.devocionais = Array.isArray(c.devocionais) ? c.devocionais : [];
    c.videos = Array.isArray(c.videos) ? c.videos : [];
    c.feed = c.feed || { modo: 'produtos', produtos: [], instagram: [] };
    [c.devocionais, c.videos, c.feed.produtos || [], c.feed.instagram || []].forEach((arr) => arr.forEach((x) => { if (!x.id) x.id = uid(); }));
    c.devocionais.sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
    return c;
  }

  /* ---------- login ---------- */
  async function enter(p) {
    pin = p;
    const r = await api('/api/auth', { method: 'POST' }).catch(() => ({ ok: false, body: {} }));
    if (!r.ok) { pin = ''; return r; }
    try { sessionStorage.setItem('cc-pin', p); } catch (e) {}
    storageOk = r.body.storage !== false;
    const c = await fetch('/api/content?fresh=1', { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
    state = normalize(c && c.content);
    if (c && c.storage === false) storageOk = false;
    const notice = $('notice');
    notice.hidden = storageOk;
    notice.textContent = storageOk ? '' : 'O armazenamento ainda não foi ligado na Vercel. Você pode explorar o painel, mas só vai conseguir publicar e enviar fotos depois de ligar o Blob ao projeto.';
    renderAll();
    $('login').hidden = true;
    $('app').hidden = false;
    return r;
  }
  function logout() {
    try { sessionStorage.removeItem('cc-pin'); } catch (e) {}
    pin = ''; state = null; dirty = false;
    $('app').hidden = true; $('login').hidden = false;
    $('pin').value = ''; $('pin').focus();
  }
  $('logout').addEventListener('click', () => {
    if (dirty && !window.confirm('Há alterações não publicadas. Sair mesmo assim?')) return;
    logout();
  });
  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('login-btn'); const msg = $('login-msg');
    const p = $('pin').value.trim();
    if (!p) return;
    btn.disabled = true; btn.textContent = 'Entrando...'; msg.textContent = '';
    const r = await enter(p);
    btn.disabled = false; btn.textContent = 'Entrar';
    if (!r.ok) { msg.textContent = errMsg(r.body.error); $('pin').select(); }
  });

  let saved = '';
  try { saved = sessionStorage.getItem('cc-pin') || ''; } catch (e) {}
  if (saved) enter(saved).then((r) => { if (!r.ok) logout(); });
  else $('pin').focus();
})();
