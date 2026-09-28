# SETUP — social-publisher

Guia de instalação e conexão do zero. Siga na ordem. Ao final você terá o pipeline
publicando e agendando posts no **seu** Instagram via Instagram Graph API.

> Este guia é genérico: serve para qualquer marca/conta. Onde aparecer algo entre
> `<colchetes>`, troque pelo seu valor. **Nunca** cole tokens no chat nem faça commit do `.env`.

---

## 0. O que esta skill faz

1. **Gera** o JPG do post a partir de um HTML/CSS (ou você já traz o JPG pronto).
2. **Publica / agenda** no Instagram (imagem única e carrossel) via Graph API.
3. **Registra** cada envio num arquivo de fila/histórico (`content/ledger.json`).

A Graph API **não aceita upload local**: ela busca a imagem por uma **URL pública**. Por isso o
passo de hospedagem (GitHub, neste guia). A Graph API também **não agenda** nativamente: o
agendamento é feito por um script (`run-due.mjs`) chamado de tempos em tempos.

---

## 1. Pré-requisitos

- **Node 18+** (usa `fetch` nativo) e **Google Chrome** instalado (o render usa Chrome headless).
- Uma conta **Instagram Business** (ou Creator) conectada a uma **Página do Facebook**, ambas
  sob uma **Business Manager (Meta Business Suite / Configurações do negócio)**. Conta pessoal
  **não** publica pela API.
- Conta no **GitHub** (para hospedar as imagens — etapa sem custo).

---

## 2. Instalação

```bash
git clone <url-do-repositorio> social-publisher
cd social-publisher
npm install
cp .env.example .env      # depois preencha o .env (passos abaixo)
```

---

## 3. Meta — base social  *(uma vez)*

Objetivo: ter **IG Business ↔ Página do Facebook ↔ Business Manager** no mesmo lugar.

1. No **Meta Business Suite** (business.facebook.com), crie/for use o **portfólio (Business Manager)** da marca.
2. Adicione a **Página do Facebook** da marca ao portfólio.
3. Conecte o **Instagram** (Business/Creator) a essa Página (Configurações do negócio → Contas → Instagram → conectar).
4. Confirme o vínculo: nas configurações da Página deve aparecer a conta do Instagram conectada.

> Guarde à mão: o **nome da Página**, o **@ do Instagram**. Os IDs você captura no passo 6.

---

## 4. Meta — criar o App  *(uma vez)*

1. Acesse **developers.facebook.com → Meus Apps → Criar app**.
2. Tipo de app: **Empresa (Business)** e vincule ao **portfólio** do passo 3.
3. Nome do app: `<Nome> Publisher`.
4. No painel do app → **Adicionar produto** → **Instagram** → escolha **"API com login do Facebook"**.
   ⚠️ **NÃO** escolha "Instagram Login" — só a opção **"API com login do Facebook"** funciona com o
   **Usuário do Sistema** (passo 5). Esse detalhe é o que mais atrasa quem configura pela 1ª vez.
5. Deixe o app em **modo de desenvolvimento** (basta para publicar na própria conta; não precisa de App Review).
6. Anote o **App ID** (não é segredo).

---

## 5. Meta — token (Usuário do Sistema, não expira)  *(uma vez)*

Use **Usuário do Sistema** para ter um token que **não vence** (evita o vencimento de ~60 dias
dos tokens comuns).

1. **Configurações do negócio → Usuários → Usuários do sistema → Adicionar**: nome `publisher-bot`, função **Admin**.
2. Nesse usuário → **Atribuir ativos** → dê **controle total** sobre: **o App** (passo 4), **a Página** e **o Instagram**.
3. **Gerar novo token** → selecione o App → marque os escopos:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
4. **Copie o token** (aparece uma vez). Ele é **segredo** → vai só no `.env`.

---

## 6. Meta — pegar o ig-user-id

Com o token em mãos, rode (troque `TOKEN`):

```bash
# 1) descobre o PAGE_ID da sua Página
curl "https://graph.facebook.com/v21.0/me/accounts?fields=name,id&access_token=TOKEN"

# 2) descobre o IG_USER_ID a partir do PAGE_ID
curl "https://graph.facebook.com/v21.0/<PAGE_ID>?fields=instagram_business_account&access_token=TOKEN"
```

O `instagram_business_account.id` é o seu **IG_USER_ID**. (IDs não são segredo.)

---

## 7. Hospedagem das imagens — GitHub  *(uma vez)*

1. Crie um repositório **público** só para as imagens, ex.: `<seu-usuario>/social-assets`.
2. **Developer settings → Personal access tokens → Fine-grained tokens → Generate**:
   - Repository access: **Only select repositories → social-assets**
   - Permissions → **Contents: Read and write**
   - Gere e **copie** o token.
   - ⚠️ **Atenção: o PAT do GitHub EXPIRA** (o token do Meta não). Anote a data de validade e
     renove antes de vencer, senão os agendamentos param de funcionar. (Alternativa: token clássico.)

> Por que público: a Graph API precisa buscar a imagem por URL pública. Os posts já são públicos.
> Em produção você pode migrar para Cloudflare R2 (`IMAGE_HOST=r2`) — ver ROADMAP.

---

## 8. Preencher o `.env`

```ini
# Instagram Graph API
GRAPH_VERSION=v21.0
IG_USER_ID=<seu ig-user-id do passo 6>
IG_ACCESS_TOKEN=<token do passo 5>

# Host das imagens: "github" (este guia) ou "r2" (produção)
IMAGE_HOST=github

# GitHub (host etapa 1)
GITHUB_REPO=<seu-usuario>/social-assets
GITHUB_BRANCH=main
GITHUB_TOKEN=<PAT do passo 7>

# Chrome (render). Windows padrão abaixo; no Mac/Linux ver observação.
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

- **Mac:** `CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Linux:** `CHROME_PATH=/usr/bin/google-chrome`

---

## 9. Validar as conexões (sem publicar)

```bash
node scripts/validate.mjs
```

Deve mostrar o repo do GitHub com **escrita OK** e, no Meta, a sua Página listada em
`me/accounts` apontando para o seu IG. Se algo estiver vermelho, veja "Erros comuns" abaixo.

---

## 10. Primeira publicação (teste)

```bash
# 1) gerar um JPG a partir de um HTML (ou pule se já tem o JPG)
node scripts/render.mjs --html <arquivo.html> --w 1080 --h 1350 --out out/post.jpg

# 2) enfileirar "para agora" (data no passado = vence já)
node scripts/enqueue.mjs --brand <marca> --type image --asset out/post.jpg \
  --caption "Meu primeiro post via API" --at "2000-01-01T00:00:00-03:00"

# 3) processar a fila (publica)
node scripts/run-due.mjs

# 4) conferir
node scripts/ledger.mjs list
```

Carrossel: passe 2 a 10 `--asset` e `--type carousel`.

---

## 11. Agendamento

O `run-due.mjs` publica o que estiver **vencido** na fila. Basta chamá-lo de tempos em tempos.

- **Windows (teste local, PC ligado):**
  ```powershell
  ./scripts/schedule-local.ps1            # registra tarefa a cada 5 min
  ./scripts/schedule-local.ps1 -Remove    # remove
  ```
- **Mac/Linux (cron):**
  ```cron
  */5 * * * * cd /caminho/social-publisher && /usr/bin/node scripts/run-due.mjs >> run.log 2>&1
  ```
- **Sem depender do PC (produção):** rode o `run-due.mjs` num runner na nuvem (ex.: GitHub
  Actions com cron, ou um Cron Job em algum PaaS). Ver ROADMAP.

Enfileirar para um horário futuro:
```bash
node scripts/enqueue.mjs --brand <marca> --type image --asset out/post.jpg \
  --caption-file captions/post.txt --at "2026-10-01T19:00:00-03:00"
```

---

## 12. Marca como configuração

A marca é um arquivo em `config/brands/<marca>.json`. Copie o modelo:

```bash
cp config/brands/_template.json config/brands/<marca>.json
```

Preencha `handle`, `igUserId` e as cores/`tokens` de identidade. O `igUserId` real e o token
ficam no `.env` (segredo/id de conta); o JSON guarda identidade e regras de copy.

---

## 13. Erros comuns / onde validar no Meta  *(o que mais atrasa)*

| Sintoma | Causa provável | Solução |
|---|---|---|
| Token não publica / não enxerga a conta | App criado com **"Instagram Login"** em vez de **"API com login do Facebook"** | Recriar o produto Instagram na opção certa (passo 4) |
| `me/accounts` não lista a Página | Página/IG **não atribuídos** ao Usuário do Sistema, ou falta `pages_show_list` | Atribuir ativos ao system user (passo 5.2) e conferir escopos |
| `instagram_business_account` volta vazio | IG **não vinculado** à Página, ou não é Business/Creator | Reconectar IG↔Página (passo 3); converter conta para Business |
| Erro ao buscar `image_url` | URL não é **HTTPS pública** / não é JPEG | Usar o host (GitHub/R2); render em JPG |
| Publicava e parou depois de semanas | **PAT do GitHub expirou** | Gerar novo PAT (passo 7) e atualizar o `.env` |
| Container fica em `ERROR` | Proporção/tamanho fora do aceito | JPEG, 4:5 a 1.91:1 (1080×1350 ok), ≤ 8 MB |

Limites da API: 25 publicações / 24h por conta; legenda ≤ 2200 caracteres, ≤ 30 hashtags.

---

## 14. Segurança

- Segredos **só** no `.env` (git-ignored) ou variáveis de ambiente. Nunca no código, no ledger,
  no chat ou em memória. IDs (page id, ig-user-id, app id) não são segredo.
- Escopo **first-party**: publica só em contas próprias. Publicar em contas de terceiros
  (clientes) exigiria **App Review** de `instagram_content_publish` + **Verificação de Negócio**.

---

## 15. Possíveis evoluções

Veja **[ROADMAP.md](ROADMAP.md)**.
