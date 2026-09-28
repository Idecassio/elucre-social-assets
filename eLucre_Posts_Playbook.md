# eLucre — Playbook de Posts (design system + pipeline)

> Como montar posts do eLucre no mesmo padrão premium (dark índigo + glass + mockups) e
> exportar em JPG no tamanho certo. Fonte da verdade dos criativos sociais.
> **TUDO vive dentro de `Desktop\eLucre_Posts\` — nunca criar arquivo eLucre fora dessa pasta.**
> Arquivos-fonte (em `Desktop\eLucre_Posts\`): `eLucre_QuemSomos_Carrossel.html`,
> `eLucre_Carrossel_Pilar1.html`, `eLucre_Stories_Sequencia3.html`, `eLucre_Card_Feed.html`,
> `eLucre_Capa_Facebook.html`. Saídas: `Desktop\eLucre_Posts\<categoria>\` (+ `\Stories\`).

---

## 1. Regra de ouro do conteúdo (o que dizer)

- **O produto é a LOJA ONLINE** — um *site de verdade* (carrinho + painel de admin), acessível
  **no computador e no celular**. O **WhatsApp é só onde o pedido cai**, não é o produto.
  → Nunca escrever "transformamos seu WhatsApp em loja". Escrever "criamos sua loja online".
- **Atende TODO negócio** — pequeno **ou grande**. Não restringir a "pequenos negócios".
- **Frases-âncora** (usar sempre alguma): `0% de comissão · 100% da venda é sua` ·
  `no ar em minutos, sem programador` · `pedido pronto no seu WhatsApp` ·
  `mais barato que sua internet` · `Monte sua loja e lucre em minutos`.
- **CTA padrão:** `Teste 7 dias grátis` + `elucre.net`.
- **SHOW, DON'T TELL** — imagem full-texto é feia. **Todo post tem ≥1 elemento gráfico**:
  mockup de loja (browser/celular), comparativo, selo "0%", bento de ícones, chips de nicho.
  Texto **apoia** o visual, não é o visual.
- **Logo > ícone genérico**: onde couber um ícone de destaque, usar o **mark da eLucre**
  (carrinho no squircle), não um ícone abstrato.

---

## 2. Identidade / tokens (colar no `:root`)

```css
:root{
  --indigo:#4F46E5; --indigo-deep:#4338CA; --indigo-bright:#9A94F5;
  --hl:#B9C0FF;              /* destaque claro sobre índigo (headline) */
  --green:#39E08A; --green-soft:#8BF3BE; --wpp:#25D366;   /* "dinheiro/ganho" + WhatsApp */
  --ink:#171310; --cream:#FAF9F7; --surface2:#EFEDE7;     /* UI clara dentro dos mockups */
  --font:"Inter",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
}
```
- Fonte **Inter** (Google Fonts), pesos 800/900 em títulos, 400/500 no corpo.
- Destaque de headline em `--hl` (periwinkle); números de "ganho" (100%, R$100) em `--green-soft`.

---

## 2.1 REGRA PERMANENTE — feed + stories, sempre

**Toda publicação de post existe em DUAS versões: feed (1080×1350) E stories (1080×1920)** —
gerar as duas sempre, nos dois sentidos (nasceu feed → gerar story; nasceu story → gerar feed),
sem precisar pedir. Do mesmo HTML fonte, override de altura + esconder affordances que não cabem
no destino (`.pnum,.swipe,.foot` some no story; `.swipeup` some no feed). Organização:
**feed na raiz da categoria, stories em subpasta `Stories\`**. (Capas de Facebook/perfil não contam.)

**Local (regra rígida):** TODA criação do eLucre — fontes `.html`, este playbook, exports `.jpg`,
assets — fica **dentro de `Desktop\eLucre_Posts\`**. Nunca gerar/salvar arquivo eLucre solto no Desktop.

## 2.2 Operação de social media automática

Claude atua como social media do eLucre. Motor em `Desktop\eLucre_Posts\_social\` (ver `README_social.md`):
`calendario_AAAA-MM.json` (plano do mês) · `ledger.md` (anti-repetição) · `post_do_dia.ps1` (entregador)
· `config.json` (webhook Discord [[SENSÍVEL]]). **Tarefa agendada do Windows** "eLucre Social - Publicacao
do dia" roda o script **todo dia 09:00** → posta a publicação do dia no Discord **MC-monitor** p/ aprovação.
Ciclo: 1×/mês Claude planeja+gera e apresenta o calendário; diário o script entrega; refino via Claude Code
(`"Gera a publicacao de AAAA-MM-DD"` / `"Refina o slide X de DD/MM"`). Preview manual: `post_do_dia.ps1 -Date AAAA-MM-DD`.

## 2.3 Zona segura do FEED (grade do Instagram) — REGRA ESCOLHIDA (opção 3)

Feed = **1080×1350 (4:5)** — aparece inteiro no feed (é o mais alto que o IG mostra sem corte). Mas a
**grade do perfil pode recortar pro quadrado central 1080×1080**. Regra: **logo, título, mockup e CTA sempre
dentro da zona segura central de 1080×1080** (y de 135 a 1215 num canvas de 1350).
- Layouts com `.in{justify-content:center}` já ficam seguros (conteúdo centralizado) — não mudar.
- Afordâncias de carrossel (`.pnum` "N/6", `.swipe` "arraste →", `.foot`) PODEM ficar na borda: são cortadas
  na grade e tudo bem (não precisam aparecer na grade). Não puxar pra dentro (poluiria a miniatura).
- Composição cheia com elementos nas bordas extremas (ex.: card "0% comissão" com logo no topo + CTA na base):
  envolver o conteúdo num `<div class="stage">` e **escalar ~0,86 centralizado** (`.stage{transform:scale(.86);
  transform-origin:center}`), deixando o fundo preencher as bordas. Feito no `eLucre_Card_Feed.html`.
- Stories (9:16) não seguem essa regra.

## 2.4 Alternância de tema na grade — REGRA PERMANENTE (dark ↔ claro, de 3 em 3)

A grade do perfil do IG é lida em **linhas de 3**. Para dar ritmo visual, o tema **alterna a
cada linha de 3 publicações** (contando só posts de feed, na ordem de publicação — capas de
FB/perfil não contam):

- **Linha ímpar (1ª, 3ª, 5ª…): TEMA DARK** — padrão índigo (o `.slide`/`.story` normal). Texto branco.
- **Linha par (2ª, 4ª…): TEMA CLARO (invertido)** — fundo cream/periwinkle, texto `--ink`, destaque
  em `--indigo` (em vez do periwinkle `--hl`), cards de vidro viram cartões brancos, balão do
  cliente ganha `--surface2` + contorno, enquete/CTA em índigo sólido.

**Como aplicar (mecanismo):** adicionar a classe **`tema-claro`** na raiz de cada slide
(`<div class="slide tema-claro">` / `<div class="story tema-claro">`). O override vive no
`_social/_kit.css` (bloco "TEMA CLARO"), **escopado em `.tema-claro`** — sem a classe nada muda.
Posts legados com `<style>` próprio (sem `_kit.css`) recebem o mesmo bloco injetado no render.

**O que NÃO inverte** (mantêm-se como no dark, de propósito, pois já têm contraste próprio):
mockups de loja (`.browser`/celular), `.mk`/`.disc`, selos (`.seal`), `.gpill`/`.worder`/`.cartbar`
e o verde de "dinheiro".

> No calendário, marcar o tema por post (campo `tema_visual: "dark" | "claro"`) para o pipeline
> saber qual linha renderizar. A regra de alternância é da **posição na grade**, não do conteúdo.

---

## 3. Formatos e escala

| Peça | Tamanho | Proporção |
|---|---|---|
| Card de feed | **1080 × 1350** | 4:5 |
| Story / Destaque | **1080 × 1920** | 9:16 |
| Capa Facebook (padrão) | **1640 × 624** | ~2,63:1 |
| Capa Facebook (artboard grande) | 10182,76 × 3769,18 | ~2,70:1 |

- Capas usam **unidades `cqw`** (container queries) → escala perfeita em qualquer resolução.
- Posts (feed/story) usam **px fixos** no tamanho nativo.
- **Escala de tipo (feed 1080):** headline hero 84–104px/900 · título de slide 62–70px ·
  corpo 26–30px · eyebrow 22px · marca pequena 28–32px.
- **Padding do conteúdo:** ~64–84px nas laterais.

---

## 4. Linguagem visual — blocos de CSS reutilizáveis

### 4.1 Fundo (gradiente + glow + vinheta + estrelinhas)
```css
.bg{
  position:relative; color:#fff; isolation:isolate;
  background:
    radial-gradient(85% 55% at 84% 4%, rgba(124,120,255,.55), transparent 55%),
    radial-gradient(80% 55% at 8% 100%, rgba(28,24,88,.92), transparent 62%),
    linear-gradient(160deg, #241F63 0%, #35309C 48%, #4F46E5 82%, #4A41D6 100%);
}
.bg::before{content:"";position:absolute;inset:0;z-index:0;
  background:radial-gradient(32% 26% at 90% 8%, rgba(150,150,255,.5), transparent 60%);}
.bg::after{content:"";position:absolute;inset:0;z-index:0;
  background:radial-gradient(120% 120% at 50% 45%, transparent 58%, rgba(12,10,40,.5) 100%);}
.dots{position:absolute;inset:0;z-index:0;opacity:.5;
  background-image:
    radial-gradient(2px 2px at 14% 18%, rgba(255,255,255,.5), transparent),
    radial-gradient(2px 2px at 82% 12%, rgba(255,255,255,.4), transparent),
    radial-gradient(2px 2px at 26% 92%, rgba(255,255,255,.35), transparent),
    radial-gradient(2px 2px at 92% 70%, rgba(255,255,255,.4), transparent);}
```
> Conteúdo vai em camada `z-index:2+`. Sempre incluir `<div class="dots"></div>`.

### 4.2 Logo mark (squircle + carrinho) — o ícone da marca
```css
.mark{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;
  background:linear-gradient(150deg,#8B84FF,#5B4FE6 60%,#4338CA);
  box-shadow:0 10px 24px rgba(38,30,120,.5), inset 0 1px 0 rgba(255,255,255,.35)}
.mark svg{width:30px;height:30px;stroke:#fff;fill:none;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round}
/* versão grande (herói): 150px, border-radius:40px, +glow 0 0 60px rgba(124,120,255,.4) */
```
```html
<!-- carrinho (lucide-like) -->
<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/>
<path d="M1.5 2.5h3l2.2 12.4a1.6 1.6 0 0 0 1.6 1.3h8.8a1.6 1.6 0 0 0 1.6-1.3L22 6.5H6"/></svg>
```

### 4.3 Card de vidro (glassmorphism) + chip flutuante
```css
.glass{background:rgba(18,16,52,.6);border:1px solid rgba(255,255,255,.16);
  backdrop-filter:blur(9px);border-radius:22px;box-shadow:0 30px 60px rgba(8,6,30,.5)}
.chip{position:absolute;background:rgba(18,16,52,.66);border:1px solid rgba(255,255,255,.18);
  backdrop-filter:blur(9px);border-radius:18px;box-shadow:0 22px 46px rgba(8,6,30,.5)}
/* chips ganham vida com transform:rotate(-6deg / 3deg) */
```

### 4.4 Selo "0%" (carimbo redondo)
```css
.seal{width:172px;height:172px;border-radius:50%;display:grid;place-items:center;
  text-align:center;color:#08351F;transform:rotate(9deg);
  background:radial-gradient(circle at 35% 30%, #8BF3BE, #39E08A 60%, #17B368);
  box-shadow:0 24px 50px rgba(20,160,90,.45), inset 0 2px 0 rgba(255,255,255,.5);
  border:3px solid rgba(255,255,255,.55)}
```

### 4.5 Mockup de LOJA — navegador (site) e celular
- **Browser** (mostra que é um site real): barra com 3 dots + URL `elucre.net/minha-loja`
  (cadeado verde), corpo claro (`--cream`) com header "Minha Loja" + carrinho, grade de
  produtos, e uma **cartbar preta** com total + botão verde "Finalizar".
- **Celular**: moldura `#0C0A26`, `border-radius:52px`, tela clara com app bar, busca,
  grade 2×2 de produtos e botão verde WhatsApp "Pedido pronto no WhatsApp".
- **Produtos = emoji** em blocos com tint suave (comunica nicho): 👗 👟 🍔 📱 💄 🧁.
  Preço em `--indigo`, negrito.

### 4.6 Bento de diferenciais + chips de nicho
```css
.feat{background:rgba(20,18,58,.5);border:1px solid rgba(255,255,255,.14);
  border-radius:24px;padding:34px 30px;backdrop-filter:blur(8px)}
.feat .ic{width:76px;height:76px;border-radius:20px;display:grid;place-items:center;
  background:linear-gradient(150deg,#8B84FF,#4F46E5)}     /* .gr = verde p/ "0%" */
.nchip{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.16);border-radius:99px;padding:18px 28px;
  font-weight:800;backdrop-filter:blur(6px)}
```

### 4.7 CTA padrão
```css
.btn{font-weight:800;color:var(--indigo-deep);background:#fff;padding:20px 34px;
  border-radius:99px;box-shadow:0 16px 40px rgba(10,8,40,.4)}
.site{display:flex;align-items:center;gap:11px;font-weight:700}
.site .s-dot{width:9px;height:9px;border-radius:50%;background:var(--green)}
```

---

## 5. Estrutura de um slide/carrossel

- Cada slide é `<div class="slide">` **1080×1350**, com `.dots` e um `.in` (`position:absolute;
  inset:0; padding:84px 80px; display:flex; flex-direction:column`).
- **Centralizar vertical:** `.in` precisa de `justify-content:center` (senão o conteúdo cola
  no topo e sobra buraco embaixo). Todos os slides devem ter isso.
- Delimitar slides com comentários `<!-- ===== S1 ===== -->` … `<!-- ===== S6 ===== -->`
  (o pipeline fatia por eles).
- Sequência "Quem somos" que funcionou: **1** Capa (logo herói) · **2** O que fazemos
  (mockup de browser/loja) · **3** Por que existimos (logo + missão) · **4** Diferenciais
  (bento 2×2) · **5** Pra quem é (chips de nicho) · **6** Chamada (CTA).
- Títulos preferir **one-line**.

---

## 6. Pipeline de exportação (HTML → JPG) — Windows/PowerShell

Renderiza cada peça no Chrome **headless** no tamanho exato e converte pra JPG.
Não dá pra "fotografar" arquivo local pelo painel do app (ele abre como snapshot estático).

```powershell
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
$prof   = Join-Path $scratch 'chrome_prof'   # user-data-dir próprio evita travar com o Chrome aberto
$url    = ([System.Uri]$htmlFile).AbsoluteUri
& $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars `
  --force-device-scale-factor=1 --window-size=1080,1350 --virtual-time-budget=6000 `
  --user-data-dir="$prof" --screenshot="$png" "$url" | Out-Null

# PNG -> JPG (qualidade 92) via GDI+
Add-Type -AssemblyName System.Drawing
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{$_.MimeType -eq 'image/jpeg'}
$eps=New-Object System.Drawing.Imaging.EncoderParameters(1)
$eps.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[int64]92)
$img=[System.Drawing.Image]::FromFile($png); $img.Save($jpg,$codec,$eps); $img.Dispose()
```

**Fatiar o carrossel em arquivos por slide:**
```powershell
$html  = Get-Content -Raw -Encoding UTF8 $src
$style = [regex]::Match($html,'(?s)<style>.*?</style>').Value
$body  = $html.Substring($html.IndexOf('</style>')+8)
$parts = [regex]::Split($body,'<!--\s*=====\s*S\d\s*=====\s*-->')   # parts[1..6] = slides
$chunk = [regex]::Replace($parts[$i],'(?s)<div class="slabel">.*?</div>','').Trim()
$doc   = $style + "`n<body style=""margin:0;background:#0F0D2A"">`n" + $chunk + "`n</body>"
[System.IO.File]::WriteAllText($file,$doc,(New-Object System.Text.UTF8Encoding($false)))
```

**Story (1080×1920) a partir do mesmo HTML:**
- Slides (conteúdo centralizado): injetar override e renderizar em `--window-size=1080,1920`:
  ```
  <style>.slide{height:1920px!important}.pnum,.swipe{display:none!important}</style>
  ```
  (esconder "arraste →" e "N/6" — não fazem sentido em Destaque).
- Peças com posições absolutas (ex.: card do feed): **não** reposicionar tudo — só recentralizar
  o conjunto empurrando os filhos, sem mexer no fundo:
  ```
  .card{height:1920px!important}
  .card>div:not(.dots){transform:translateY(285px)}   /* (1920-1350)/2 = 285 */
  ```

**Organização das saídas:** `Desktop\eLucre_Posts\<categoria>\` (feed) e
`Desktop\eLucre_Posts\<categoria>\Stories\` (9:16). Nomes descritivos, sem número solto.

---

## 7. Perrengues aprendidos (não repetir)

- **Painel do app não fotografa arquivo local** (`file://` vira snapshot estático) → usar Chrome headless.
- **Fontes/emoji:** Inter vem do Google Fonts (precisa de rede); `--virtual-time-budget=6000`
  garante que carrega antes do print. Emoji renderiza nativo (Segoe UI Emoji).
- **Guard do PowerShell** bloqueia `Remove-Item` e o token `-replace '\\','/'` (interpreta como
  path de sistema). → **não usar `Remove-Item`** (o Chrome sobrescreve o PNG) e montar a URL com
  **`([System.Uri]$path).AbsoluteUri`** em vez de `-replace`.
- **`--user-data-dir` próprio** evita conflito se o usuário estiver com o Chrome aberto.
- **`position:sticky/absolute` quebra ao mudar de altura** — por isso o story recentraliza via
  `translateY`, não reescrevendo coordenadas.
- **Fade com `translateY` quebra `position:sticky`** (aprendido no painel) — usar fade sem transform.
- Conferir sempre o resultado abrindo o JPG (a ferramenta Read exibe imagem) antes de entregar.
- **Comparativo de 2 colunas: usar FLEX, não grid.** `grid-template-columns:1fr 1fr` com `white-space:nowrap`
  nos números pode colapsar a largura de uma coluna (vira tira fina + texto vazando). Use
  `.cmp{display:flex;gap:24px;align-items:stretch}` + `.col{flex:1 1 0;min-width:0}` (larguras iguais garantidas).

---

## 8. Checklist de um post novo

1. Escolher formato (feed 1080×1350 / story 1080×1920) e colar `:root` + `.bg` + `.dots`.
2. Definir a **mensagem-âncora** e um **elemento gráfico** (mockup / comparativo / selo / bento).
3. Montar conteúdo em `.in` centralizado (`justify-content:center`), títulos one-line.
4. Logo mark onde precisar de ícone de destaque.
5. CTA `Teste 7 dias grátis` + `elucre.net` quando fizer sentido.
6. Renderizar via pipeline (§6) → conferir JPG → salvar em `eLucre_Posts\...`.
7. Se for pra Destaque, gerar também a versão story (esconder affordances de carrossel).
