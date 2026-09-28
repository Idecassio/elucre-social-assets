# eLucre · Operação de Social Media (automática)

Claude atua como social media do eLucre. Este diretório (`_social`) é o cérebro da operação.

## Arquivos
- `config.json` — webhook do Discord (MC-monitor) + raiz dos posts + horário. **SENSÍVEL.**
- `calendario_AAAA-MM.json` — o plano do mês (1 item por dia útil). Campos: `data, pilar, tema, tipo, nicho, status(pronto|planejado), feed_glob, story_glob, legenda, hashtags, ideia`.
- `ledger.md` — histórico anti-repetição (ler antes de planejar o próximo mês).
- `post_do_dia.ps1` — entregador: lê o item de hoje e posta feed+legenda no Discord.
- `_kit.css` — CSS-kit compartilhado (tokens + componentes) de todos os posts.
- `src/*.html` — conteúdo (markup dos slides) de cada post; o render combina `_kit.css` + `src` e fatia por `<!-- ===== SN ===== -->`.
- `dashboard.html` / `dashboard.hta` — painel de acompanhamento (feed/story/status/postado no IG). Dados em `dashboard_data.js` (compartilhado; regerar após criar/editar posts). **`dashboard.hta`** roda no Windows (mshta) e **abre a pasta do post no Explorer** ao clicar na miniatura ou no chip "📂 pasta"; o `dashboard.html` (navegador) só copia o caminho da pasta (limitação de segurança do browser).

## Ciclo
1. **Mensal (Claude, no Claude Code):** pesquisa referência (Behance) + lê o `ledger` → monta `calendario_AAAA-MM.json` → apresenta ao Idecássio pra aprovar (1×) → gera os assets (feed+story de cada peça, seguindo o playbook) → marca `status:pronto` e preenche `feed_glob/story_glob/legenda`.
2. **Diário 09:00 (tarefa agendada local):** `post_do_dia.ps1` posta no MC-monitor a "publicação do dia" (imagens do feed + legenda + hashtags) pra **aprovação diária**.
3. **Refino (Idecássio → Claude):** responde no Claude Code; Claude identifica a peça pelo calendário, regenera, atualiza o manifesto/ledger.

## Diretrizes fixas de conteúdo
- Produto = **loja online** (site próprio, PC + celular, carrinho + painel). WhatsApp só **recebe o pedido**. Atende **todo negócio** (pequeno ou grande).
- **Nunca "full texto"** — sempre elemento gráfico (mockup/comparativo/selo/bento/chat). Ver `../eLucre_Posts_Playbook.md`.
- **Toda peça sai em feed (1080×1350) + story (1080×1920).**
- Rotação de pilares p/ não repetir: Institucional · Dor & educação · Demonstração/Produto · Direcionado por nicho · Prova & resultado · Conversão.
- **Alternância de tema na grade (3 em 3):** a cada linha de 3 posts de feed o tema alterna dark ↔ claro (linha 1 dark, linha 2 claro, linha 3 dark…). Ativar com a classe `tema-claro` na raiz do slide; override no `_kit.css`. Detalhes e o que não inverte: `../eLucre_Posts_Playbook.md` §2.4. Marcar no calendário via `tema_visual: "dark"|"claro"`.

## Como refinar/gerar (frases que o Idecássio pode mandar no Claude Code)
- "Gera a publicação de 16/09 (delivery)." → Claude cria feed+story, atualiza calendário/ledger.
- "Refina o slide 3 do post de 14/09." → Claude regenera.
- "Monta o calendário de outubro." → Claude planeja o próximo mês (lendo o ledger).
