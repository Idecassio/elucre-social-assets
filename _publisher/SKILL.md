---
name: social-publisher
description: Gera criativos (HTML/CSS → JPG) e publica/agenda posts no Instagram (imagem única e carrossel) via Instagram Graph API, com fila e registro (ledger) dos envios. A marca é configuração, não código. Use para publicar, agendar ou controlar posts de Instagram de qualquer conta própria. Setup completo em SETUP.md.
---

# social-publisher

Pipeline reutilizável de **conteúdo social**. Faz três coisas:

1. **Gerar** o JPG do post a partir de um HTML/CSS (ou aceita um JPG pronto). Formato exigido pela Graph API: JPEG.
2. **Publicar / agendar** no Instagram (imagem única e carrossel) via **Instagram Graph API**.
3. **Registrar** cada envio num **ledger** (fila + status + media id + permalink).

> A marca é **configuração** (`config/brands/<marca>.json`), não código.

## Primeiro uso
Leia e siga o **[SETUP.md](SETUP.md)** — instala, conecta o Instagram (Meta) e faz a 1ª publicação.
Ideias de evolução em **[ROADMAP.md](ROADMAP.md)**.

## Quando usar
- "Publica esse post no Instagram", "agenda pra amanhã 19h", "o que está na fila?", "gera o criativo X em JPG".

## Como funciona (resumo)
```
render.mjs   HTML/CSS → Chrome headless → JPG (ex.: 1080x1350, 4:5)
enqueue.mjs  adiciona um item à fila (assets + legenda + horário) em content/ledger.json
run-due.mjs  para cada item vencido: sobe o JPG num host público → Graph API (container → publish) → grava status/permalink
             (é o que o agendador — Task Scheduler no Windows, cron no Mac/Linux/nuvem — chama de tempos em tempos)
```

## Comandos
```bash
node scripts/validate.mjs                         # testa conexões (sem publicar)
node scripts/render.mjs --html <x.html> --out out/post.jpg
node scripts/enqueue.mjs --brand <marca> --type image --asset out/post.jpg --caption-file <txt> --at <ISO8601>
node scripts/run-due.mjs                          # publica os vencidos (o agendador chama isto)
node scripts/ledger.mjs list                      # fila e status
```

## Segurança
- Token e chaves ficam em `.env` (git-ignored) ou variáveis de ambiente — **nunca** no código, no ledger ou no chat.
- Escopo **first-party**: publica só em contas próprias (sem App Review). Contas de terceiros exigiriam App Review + Verificação de Negócio. Ver SETUP.md §14.
