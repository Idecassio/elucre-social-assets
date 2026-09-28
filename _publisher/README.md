# social-publisher

Skill/pipeline para **gerar, publicar e agendar posts no Instagram** via **Instagram Graph API**,
durante uma sessão do Claude Code (ou pela linha de comando). A marca é **configuração**, então
serve para qualquer conta própria.

- Gera criativo (HTML/CSS → JPG) **ou** aceita imagem pronta (Canva/Figma/IA).
- Publica **imagem única** e **carrossel**.
- **Agenda** e mantém um **ledger** (fila + status + permalink).
- Hoje: **imagem (JPEG)**. Vídeo/Reels e Stories: ver `ROADMAP.md`.

## Comece por aqui
👉 **[SETUP.md](SETUP.md)** — instalação (clone), conexão do Instagram no Meta (passo a passo
testado, com os atalhos e a seção de erros comuns) e a primeira publicação.
👉 **[ROADMAP.md](ROADMAP.md)** — possíveis evoluções (R2, runner na nuvem, Stories/Reels, multi-marca, etc.).

## Instalação rápida
```bash
git clone <url-deste-repo> social-publisher
cd social-publisher
npm install
cp .env.example .env      # preencha seguindo o SETUP.md
```

## Como operar (via sessão do Claude)
Coloque imagens prontas na pasta **`inbox/`** e peça, por exemplo:
- *"Sobe a `inbox/arte.jpg` e publica agora, legenda: …"*
- *"Agenda a `inbox/arte.jpg` pra 01/10 às 19h, legenda: …"*
- *"Monta um carrossel com `inbox/1.jpg`, `inbox/2.jpg`, `inbox/3.jpg` pras 19h."*
- *"Mostra a fila."*

## Comandos
```bash
node scripts/validate.mjs        # testa conexões (sem publicar)
node scripts/render.mjs --html <x.html> --out out/arte.jpg
node scripts/enqueue.mjs --brand <marca> --type image --asset <jpg> --caption-file <txt> --at <ISO>
node scripts/run-due.mjs         # publica os vencidos (o agendador chama isto)
node scripts/ledger.mjs list     # fila e status
```

## Segurança
- `.env`, `node_modules/`, imagens e `inbox/*` são ignorados pelo Git (ver `.gitignore`).
- **Tokens nunca vão para o repositório.** Em produção, use os Secrets do host (ex.: GitHub Actions).
- Escopo **first-party** (contas próprias). Ver SETUP.md §14.
