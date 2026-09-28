# Instagram Graph API — referência de publicação

> Confirme a **versão da API** e os **nomes exatos de permissão** na doc oficial ao configurar
> (mudam com frequência). Esta referência descreve o fluxo estável de publicação de conteúdo.

## O que o usuário precisa fazer no Meta (a IA não loga nem cria conta)

1. **Conta**: Instagram **Business** conectada a uma **Página do Facebook**, ambas sob a **Business Manager** da marca.
2. **App**: em developers.facebook.com → criar app (tipo Business), sob o negócio da marca → adicionar o produto **Instagram Graph API**. Deixar em **modo de desenvolvimento** (basta para publicar na própria conta — first-party, sem App Review).
3. **Token** (preferir **System User** da BM → token que **não expira**):
   - Business Manager → Configurações → Usuários → **Usuários do sistema** → criar → dar acesso ao **app** e ao **ativo Instagram/Página**.
   - Gerar token com os escopos:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_show_list`
     - `pages_read_engagement`
4. **ig-user-id** (ID da conta IG Business):
   - `GET https://graph.facebook.com/v21.0/me/accounts?access_token=TOKEN` → pega o **page id**.
   - `GET .../{page-id}?fields=instagram_business_account&access_token=TOKEN` → devolve o **instagram_business_account.id** = **IG_USER_ID**.
5. Preencher `IG_ACCESS_TOKEN` e `IG_USER_ID` no `.env`. **Nunca** commitar o `.env`.

## Fluxo de publicação (o que os scripts fazem)

**Imagem única**
1. `POST /{ig-user-id}/media` com `image_url` (URL pública HTTPS, JPEG) + `caption` → devolve `creation_id`.
2. (opcional) `GET /{creation_id}?fields=status_code` até `FINISHED`.
3. `POST /{ig-user-id}/media_publish` com `creation_id` → devolve `media_id`.

**Carrossel (2–10)**
1. Para cada imagem: `POST /{ig-user-id}/media` com `image_url` + `is_carousel_item=true` → `child_id`.
2. `POST /{ig-user-id}/media` com `media_type=CAROUSEL` + `children=<ids>` + `caption` → `creation_id`.
3. `POST /{ig-user-id}/media_publish` com `creation_id`.

## Regras e limites
- **Imagem por URL pública** — a API busca o arquivo; não há upload local. (Por isso o R2.)
- **JPEG**; proporção **4:5 a 1.91:1** (nosso 1080×1350 = 4:5 ok); ≤ 8 MB.
- Legenda ≤ **2200** caracteres, ≤ **30** hashtags.
- **25 publicações / 24h** por conta via API.
- **Agendamento não é nativo** — a API publica na hora. O agendamento é feito por quem chama `run-due.mjs` (Task Scheduler no teste, cron em produção).

## Escalar para clientes (futuro)
Publicar em contas de **terceiros** (restaurantes-clientes) exige **App Review** de `instagram_content_publish` + **Verificação de Negócio** da Forux. Fora do escopo do laboratório first-party.
