# Cristo Company — site

Site estático (HTML, CSS e JS) com um painel em `/painel` e funções em `api/` que guardam o conteúdo no Vercel Blob. Publicado na Vercel: cada alteração na branch `main` vai ao ar sozinha.

## Painel

- Endereço: `/painel` (ou toque 5 vezes em "CRISTO COMPANY ©..." no rodapé do site).
- Entra com o PIN definido na variável `ADMIN_PIN` da Vercel.
- Abas: Devocionais, Vídeos, Feed (produtos ou posts do Instagram) e Página (textos do topo, links, tema padrão, ordem e visibilidade das seções).
- "Salvar e publicar" grava tudo; o site atualiza em alguns segundos.

## Configuração na Vercel (uma vez)

1. Storage → Create → **Blob** (acesso público) → conectar ao projeto. Isso cria `BLOB_READ_WRITE_TOKEN`.
2. Settings → Environment Variables → `ADMIN_PIN` com o PIN (use 6 dígitos ou mais).
3. Fazer um novo deploy para as variáveis valerem.

## Arquivos

- `index.html`, `styles.css`, `script.js` — o site.
- `painel.html`, `painel.css`, `painel.js` — o painel.
- `api/content.js` (lê), `api/auth.js` (confere PIN), `api/save.js` (grava), `api/upload.js` (fotos).
- `api/_lib/defaults.js` — conteúdo inicial, usado até o primeiro salvamento.
- Versículos do dia: lista `VERSES` em `script.js`.
