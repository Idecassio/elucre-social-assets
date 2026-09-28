# eLucre — Execução na nuvem (GitHub Actions)

Roda a automação **sem depender do PC**. O repo PRIVADO guarda código + calendário + ledger + assets;
os workflows do GitHub Actions fazem prévia (Discord), publicação (Instagram) e o esqueleto do mês.
As imagens continuam subindo no repo PÚBLICO `elucre-social-assets` (a Graph API busca por URL).

## Arquivos já prontos (neste repo)
- `.github/workflows/daily.yml` — 09:00 BRT: prévia no Discord + enfileira.
- `.github/workflows/publish.yml` — 13:00 BRT: publica feed+story (se não vetado).
- `.github/workflows/skeleton.yml` — dia 1: cria o esqueleto do calendário.
- `.github/workflows/veto.yml` — manual: veta uma data.
- `_social/vetos.json` — datas vetadas (editável direto no GitHub).

## Passo 1 — Criar o repo PRIVADO
No GitHub: **New repository** → nome `elucre-social-publisher` → **Private** → Create.
(NÃO usar o `elucre-social-assets`, que é público.)

## Passo 2 — Enviar o código (primeiro push)
No PC, dentro de `Desktop\eLucre_Posts`:
```
git init
git add .
git commit -m "eLucre publisher — cloud"
git branch -M main
git remote add origin https://github.com/Idecassio/elucre-social-publisher.git
git push -u origin main
```
> O `.gitignore` já exclui os segredos (`.env` e `_social/config.json`). Confira que eles NÃO foram enviados.

## Passo 3 — Adicionar os Secrets
No repo → **Settings → Secrets and variables → Actions → New repository secret**, crie:
| Secret | Valor |
|---|---|
| `IG_USER_ID` | `17841435197554548` |
| `IG_ACCESS_TOKEN` | (o token de System User do Instagram — o mesmo do `.env`) |
| `DISCORD_WEBHOOK` | (o webhook do canal MC-monitor — o mesmo do `_social/config.json`) |
| `ASSETS_GITHUB_TOKEN` | (o PAT do repo `elucre-social-assets` — o mesmo do `.env`) |

## Passo 4 — Testar manualmente (antes de confiar no cron)
Em **Actions**, rode cada um por **"Run workflow"** (workflow_dispatch), nesta ordem:
1. **daily** → deve cair uma prévia no Discord.
2. **publish** → deve publicar o(s) item(ns) vencido(s) no @elucre.oficial.
Se der erro, abra o log do passo e me mande o texto.

## Passo 5 — DESLIGAR o agendador local (importante!)
Pra não publicar em DOBRO (PC + nuvem), no PC rode:
```
./scripts/elucre/schedule.ps1 -Remove
```

## Operação no dia a dia
- **Aprovar:** não fazer nada (janela de veto 09:00→13:00).
- **Vetar:** Actions → "eLucre · vetar publicação" → Run (data vazia = hoje) — ou editar `_social/vetos.json` no GitHub adicionando a data.
- **Montar o mês:** o Claude preenche o calendário e sobe os assets por push; o resto é automático.

## Observações
- Cron do Actions pode **atrasar** alguns minutos e **desliga** se o repo ficar 60 dias sem atividade (os commits diários mantêm ativo).
- Tudo roda em **America/Sao_Paulo** (TZ setado nos workflows).
- O `run-due` **não usa Chrome** (só sobe JPGs prontos + chama a API); a renderização das artes é feita localmente pelo Claude.
