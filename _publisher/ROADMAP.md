# ROADMAP — possíveis evoluções

Ideias de evolução da skill. Não são obrigatórias para usar o básico (instalar → publicar →
agendar). Marque/adapte conforme sua necessidade e contribua com as suas.

## Confiabilidade (recomendado antes de rodar sem supervisão)
- **Idempotência + trava:** marcar o item como `publishing` **antes** de publicar e usar um
  lockfile, para evitar (a) publicar o mesmo post duas vezes se o processo cair após publicar e
  antes de gravar o status, e (b) duas execuções simultâneas do `run-due` pegarem o mesmo item.
- **Retry + alerta:** repetir item com erro (com limite) e avisar em caso de falha (e-mail,
  WhatsApp, webhook ou log), para um post agendado que falha não passar despercebido.

## Hospedagem
- **Cloudflare R2** (`IMAGE_HOST=r2`): já há o `upload-r2.mjs`. Trocar quando quiser sair do
  GitHub (exige cartão na Cloudflare, mesmo no plano gratuito). Vantagem: mais robusto que o
  raw do GitHub e o PAT do GitHub não expira mais no caminho.

## Agendamento em produção (sem depender do PC)
- Rodar o `run-due.mjs` num **runner na nuvem**: **GitHub Actions** com `schedule` (cron) num
  repositório privado, ou um **Cron Job** em algum PaaS. Atenção: nesse cenário o **ledger** e os
  **assets** precisam viver na nuvem também (o ledger local não é compartilhado com o runner) —
  considerar mover o ledger para um banco/objeto remoto.

## Formatos e mídias
- **Stories** (1080×1920) via `media_type=STORIES` (endpoint diferente do feed).
- **Reels / vídeo** (`media_type=REELS`, upload de vídeo por URL pública).
- Validação automática de proporção/tamanho do JPG antes de enfileirar.

## Multi-marca de verdade
- Fazer o `run-due`/`publish` **lerem `config/brands/<marca>.json`** e resolverem o
  `igUserId`/token por marca (hoje o publish usa o `IG_USER_ID`/`IG_ACCESS_TOKEN` globais do
  `.env`, então uma 2ª marca publicaria na conta errada). Sugestão: um env de token por marca
  (ex.: `IG_ACCESS_TOKEN_<MARCA>`).

## Geração de criativos (módulo generativo)
- Módulo que **cria** os criativos a partir da identidade da marca e de boas práticas de design,
  não só converte HTML existente em JPG. (Hoje o `render.mjs` só converte.)

## Escalar para contas de terceiros (clientes)
- Publicar em contas de clientes exige **App Review** de `instagram_content_publish` +
  **Verificação de Negócio**. Muda o modelo de permissão (deixa de ser first-party).

## Operação e observabilidade
- `ledger.mjs` com filtros (por status/marca/período) e um resumo (quantos pendentes, próximos).
- Relatório pós-publicação (permalink, horário real, erros) exportável.
