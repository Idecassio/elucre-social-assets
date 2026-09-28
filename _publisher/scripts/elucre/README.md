# Fusão eLucre × social-publisher

Liga o **motor social do eLucre** (`../../../_social`) ao **publisher** (Instagram Graph API).
Publica **feed + story** com **janela de veto** (aprovação por silêncio).

## Fluxo
```
DIA 1 (09:05)   skeleton.mjs  -> cria esqueleto do calendário do mês + avisa no Discord p/ Claude planejar
DIÁRIO (09:00)  daily.mjs     -> acha o post "pronto" do dia, posta PRÉVIA no Discord, enfileira c/ scheduledAt = hoje às hora_publicacao
A CADA 15 min   run-due.mjs   -> no horário de publicação, sobe os JPGs -> publica FEED + STORY no @eLucre (pula 'vetoed')
VETO            veto.mjs today-> marca o item como 'vetoed' antes do horário; run-due ignora
```

## Config (em `../../../_social/config.json`)
- `discord_webhook` (SENSÍVEL), `posts_root`, `hora_disparo` (prévia, 09:00), `hora_publicacao` (publica, 13:00), `brand` (elucre).
- A **janela de veto** = de `hora_disparo` até `hora_publicacao` (hoje: 09:00 → 13:00).

## Segredos (em `../../.env`)
`IG_USER_ID`, `IG_ACCESS_TOKEN` (System User, não expira), `GITHUB_REPO`, `GITHUB_TOKEN` (PAT, EXPIRA). Ver `../../SETUP.md`.

## Comandos
```bash
node scripts/validate.mjs                    # testa conexões (após preencher o .env)
node scripts/elucre/daily.mjs --date 2026-10-01   # gera prévia+fila de uma data (teste)
node scripts/elucre/veto.mjs today           # veta o post de hoje
node scripts/elucre/skeleton.mjs --month 2026-10  # cria esqueleto do mês
node scripts/run-due.mjs                      # publica os vencidos (o agendador chama isto)
node scripts/ledger.mjs list                  # fila e status
```

## Ativar / desativar a operação
```powershell
./scripts/elucre/schedule.ps1            # registra as 3 tarefas (após validate verde)
./scripts/elucre/schedule.ps1 -Remove    # desliga tudo
```

## Notas
- **Calendário do mês é criativo** → o `skeleton` só cria o esqueleto; o preenchimento (temas, legendas, assets feed+story) é feito pelo Claude ("monta o calendário de <mês>").
- **PC ligado:** o agendador é local; se o PC estiver desligado no horário, o run-due seguinte pega o atrasado (scheduledAt no passado ainda vence).
- **1 conta (eLucre):** o publish usa `IG_USER_ID`/token globais do `.env`. Multi-marca real = ver `../../ROADMAP.md`.
