# Handoff: Content AI Studio

## Overview

SaaS de geração de conteúdo. O usuário informa um **tema** e o sistema entrega um
carrossel completo para Instagram: estrutura, copy por slide, imagens, legenda,
hashtags, CTA e PNGs prontos em 1080×1350 — vestidos com o Brand Kit do cliente.

Cliente-piloto: **@trafegodigitalad** (AD Tráfego Digital). Brand Kit real em
`design/AD Trafego Digital - Carrossel.dc.html` e no repositório
`andredeveza/ADTrafegoDigital_DesignSystem`.

## About the Design Files

Os arquivos em `design/` são **referências de design criadas em HTML** —
protótipos que mostram aparência e comportamento pretendidos. **Não são código de
produção para copiar.** A tarefa é implementar o sistema em Next.js 15 + React 19
+ TypeScript, recriando esses designs com os padrões do codebase que você vai
criar.

Cada `.dc.html` abre direto no navegador (precisa de `support.js` ao lado). Abra
antes de escrever qualquer linha — eles respondem a maioria das dúvidas de UX.

Dois protótipos rodam lógica **real** e valem como especificação executável:

- `Acervo Inteligente.dc.html` — leitura de imagem (canvas: luminância por faixa,
  cor dominante), PDF (pdf.js: texto, termos, trechos), fonte (FontFace API), e o
  algoritmo de pontuação que escolhe qual arquivo usar em cada slide. **A função
  de score deve ser portada quase literalmente.**
- `Biblioteca de Blueprints.dc.html` — os 8 arquétipos de layout com geometria
  exata e a tabela de regras de seleção automática.

## Fidelity

**Alta fidelidade (hifi).** Cores, tipografia, espaçamento e geometria dos slides
são finais e devem ser reproduzidos exatamente. Nada de arredondar para grid de
4/8px: se um valor é 90/110px ou 1246px, é esse valor.

O **chrome do produto** (sidebar, gerador, editor, agenda) é hifi em layout e
tokens, mas você pode usar shadcn/ui como base dos primitivos.

O **canvas do slide** é hifi absoluto — é o produto que o cliente publica.

---

## Arquitetura

Clean Architecture. Dependências apontam para dentro. `core/domain` não conhece
Next.js, Supabase nem provedor de IA.

```
src/
├── app/                        rotas, server actions, route handlers
│   ├── (auth)/ · (dashboard)/ · api/
├── core/
│   ├── domain/                 entidades, value objects, erros de domínio
│   │   ├── client/ brandkit/ template/ project/ slide/ publication/ asset/
│   │   └── ports/              AIProvider, Repository, Publisher, Storage, Queue
│   └── application/
│       ├── use-cases/          1 arquivo = 1 caso de uso
│       ├── services/           Research, Copy, Prompt, Image, Render, Retrieval, Layout
│       └── dto/                schemas Zod de entrada e saída
├── infra/
│   ├── ai/
│   │   ├── gateway.ts · registry.ts · fallback.ts · logger.ts
│   │   └── providers/          openrouter/ kimi/ gemini/ hf/ replicate/ fal/
│   ├── publishing/
│   │   ├── gateway.ts
│   │   └── channels/           export/ postiz/ instagram/
│   ├── render/                 puppeteer runner, html builder, export
│   ├── db/                     supabase client, repositories, migrations
│   ├── queue/                  adapter trigger.dev | inline
│   └── storage/
├── templates/                  blueprints HTML+CSS, sem identidade visual
├── design-system/              tokens, primitivos shadcn, composições
├── config/                     ai.ts · publishing.ts · queue.ts · features.ts
└── shared/                     result, logger, errors, utils tipados
```

### Regras não negociáveis

1. **Template ≠ Brand Kit.** Template guarda estrutura (grid, slots, escala).
   Brand Kit injeta cor, fonte, logo, estilo. Nunca se misturam. O template
   consome CSS custom properties; o Brand Kit as define.
2. **Nenhum componente fala com API de IA.** Tudo passa pelo `AIGateway`.
3. **Renderização é HTML.** DOM real + CSS vars, foto tirada com Puppeteer.
   **Zero Canvas para desenhar slide.**
4. **Toda resposta de IA passa por schema Zod** antes de tocar o domínio.
5. **Gratuito primeiro.** Free tier maduro tem prioridade; pago é fallback.

---

## AI Gateway

```ts
type Capability = 'text' | 'image' | 'vision' | 'embed';

interface AIProvider {
  id: string;
  capabilities: Capability[];
  generateText(i: TextInput): Promise<TextOutput>;
  generateImage(i: ImageInput): Promise<ImageOutput>;
  analyzeImage(i: VisionInput): Promise<VisionOutput>;
  embed(i: EmbedInput): Promise<EmbedOutput>;
  healthcheck(): Promise<boolean>;
}

class AIGateway {
  constructor(
    private registry: ProviderRegistry,
    private policy: FallbackPolicy,
    private logger: AILogger,
    private limiter: RateLimiter,
  ) {}
  run<T>(task: Task): Promise<Result<T>>;
}
```

Ordem de fallback (em `config/ai.ts`, sobrescrevível por cliente):

| Tarefa | Ordem |
|---|---|
| texto | Kimi → OpenRouter → Gemini |
| imagem | Hugging Face → Replicate → Fal.ai |
| visão | Gemini → Qwen VL → Florence |

Dispara o próximo provedor em: timeout, 5xx, quota, ou resposta que falha o
schema Zod. Circuit breaker por provedor com reabertura progressiva. Cada
tentativa grava em `ai_logs`: provider, model, task, tokens, custo, latência,
`fallback_from`.

**No MVP só OpenRouter é obrigatório.** Os outros ficam registrados e desligados
por feature flag.

---

## Pipeline de geração

Sete steps idempotentes com checkpoint persistido. Falha no step 4 retoma do 4,
não do zero. Progresso vai ao cliente por Supabase Realtime.

| % | Step | Serviço |
|---|---|---|
| 5 | Criando estrutura | ResearchService |
| 20 | Escrevendo conteúdo | CopyService |
| 40 | Gerando prompts | PromptService |
| 60 | Criando imagens | ImageService (+ RetrievalService antes) |
| 80 | Renderizando slides | RenderService |
| 95 | Publicando | PublishingGateway |
| 100 | Concluído | job.completed |

Dois steps novos, cabeados desde já:

- **RetrieveAssets** (antes de gerar imagem) — busca no acervo do cliente a
  melhor imagem para cada slide. Se o score passa do limite, usa a foto real; se
  não passa, **então** gera com IA.
- **SelectLayout** (antes de renderizar) — escolhe o blueprint por forma do
  conteúdo.

---

## Modelo de dados

Postgres no Supabase. Multi-tenant por `org_id` com **Row Level Security em todas
as tabelas**. Chaves de API nunca no banco.

| Tabela | Colunas principais |
|---|---|
| `users` | id · org_id · email · role · created_at |
| `clients` | id · org_id · name · handles · persona · tone · goals · specialties · site |
| `brandkits` | id · client_id · palette(jsonb) · fonts(jsonb) · logo_id · style · cta · image_style |
| `templates` | id · blueprint(jsonb) · slots · variants · ratio · source_ref · version |
| `projects` | id · client_id · theme · goal · status · progress · template_id |
| `slides` | id · project_id · index · variant · content(jsonb) · media_id · overrides |
| `posts` | id · project_id · scheduled_at · status · channel_targets |
| `captions` | id · post_id · body · cta · variant |
| `hashtags` | id · post_id · tags[] · score · source |
| `publications` | id · post_id · channel · external_id · status · error · published_at |
| `media` | id · path · kind · width · height · provider · prompt_id |
| `assets` | id · client_id · path · mime · kind · status · analyzed_at |
| `asset_embeddings` | id · asset_id · kind · embedding(vector) · meta(jsonb) |
| `uploads` | id · path · mime · purpose · analyzed_at |
| `prompt_history` | id · scope · template · vars · rendered · hash |
| `ai_logs` | id · provider · model · task · tokens · cost · latency · fallback_from |
| `jobs` | id · project_id · step · progress · attempts · payload · state |
| `blueprints` | id · archetype · canvas · safe_band · slots(jsonb) · scale(jsonb) |
| `layout_variants` | id · blueprint_id · axis · value |
| `post_metrics` | id · publication_id · reach · saves · collected_at |

`asset_embeddings` usa **pgvector** (extensão nativa do Supabase, gratuita).

---

## Telas

Referência viva: `design/Content AI Studio - Protótipo AD Mobile.dc.html`.
**Mobile-first** — o desktop é adaptação, não o contrário.

### Chrome do produto (tokens)

```css
--bg:        #FAFAFA;   /* fundo do app */
--surface:   #FFFFFF;   /* cards, painéis */
--surface-2: #F4F4F2;   /* superfície recuada */
--canvas-bg: #EDEDEB;   /* desk atrás do slide */
--border:    #E4E4E2;   /* toda borda de card */
--divider:   #EDEDEB;   /* divisor interno */
--ink:       #0A0A0A;   /* texto primário, botão primário */
--text:      #585853;   /* texto secundário */
--muted:     #9A9A95;   /* rótulos, meta */
--faint:     #B8B8B4;   /* ícone inativo */
--ok:        #3A9A48;   /* publicado, sucesso */
```

Tipografia do produto: **Space Grotesk** 400/500/600/700 (UI) e **JetBrains
Mono** 400/500 (rótulos, meta, logs). Rótulos de seção: Mono 10px,
`letter-spacing:.16em`, uppercase, cor `--muted`.

Raio: 7px botão pequeno · 8–10px card pequeno · 11–14px card grande · 999px pill.
Alvo de toque **mínimo 44px, sem exceção**.

### 1. Gerador

Prompt em destaque com `>` verde (`#3A9A48`), input 16px, cursor piscando
(`@keyframes blink`, 1.1s steps(1)). Abaixo: chips de sugestão em carrossel
horizontal (Mono 11px, pill, 44px de altura). Depois: objetivo (radio, 4 opções),
número de slides (stepper com botões 44×44), CTA (input), template (3 cards de
84px). Botão primário fixo no rodapé, 52px, `--ink`.

### 2. Geração

Cabeçalho com tema e `job #id`. Percentual em Mono 46px peso 700, barra de 4px
com `transition:width 400ms cubic-bezier(.2,.6,.2,1)`. Lista dos 7 steps com
bolinha de estado (`●` feito verde, `◐` atual preto, `○` pendente cinza). Terminal
preto (`#080808`, raio 11px) com log em Mono 10.5px e cursor piscando.

**Importante:** no protótipo o progresso é derivado de `Date.now() - runStart`,
não de um contador em `setState`. Em produção vem do Realtime — mas mantenha a
lição: nunca dependa de intervalo que possa ser recriado pelo remount.

### 3. Editor

Preview 4:5 no topo (280×350 mostrando um palco de 1080×1350 em `scale(0.2593)`),
rail horizontal de miniaturas (52×65, borda 1.5px, selecionada `--ink`), depois
inspector em coluna: título, corpo, variante (grid 2×2), brand kit, mídia.

O canvas usa `transform: scale()` sobre um palco de tamanho real — **não**
recalcule tipografia para caber na tela.

### 4. Agenda

Strip horizontal dos 31 dias (52px de largura, pontinhos de status embaixo),
clique filtra; segundo clique limpa. Lista de posts com barra lateral de 3px
colorida por status. Estado vazio quando o dia não tem nada.

### 5. Marca (Cliente & Brand Kit)

Cabeçalho do cliente, paleta (linhas selecionáveis com 3 swatches), tipografia
(cada linha renderiza na própria fonte), tom de voz (chips), e o dropzone de
referência visual com três estados: idle, analisando (barra + step), concluído.

### 6. Projetos

Lista com miniatura 44×55, título, meta e pill de status.

### Navegação

Tab bar inferior fixa, 5 itens, `backdrop-filter:blur(10px)`, ícone 20px
(lucide) + rótulo Mono 9.5px. Ativo `--ink`, inativo `--faint`.

---

## Blueprints — geometria exata

Canvas 1080 × 1350 (4:5) ou 1080 × 1080 (1:1). **Margem 80px.**

**Faixas reservadas ao chrome:** topo `80..160`, base `H-190..H-80`.
Todo conteúdo vive entre `TOP = 200` e `BOT = H - 230`. Toda posição vertical é
derivada de `H` — nunca absoluta — para o mesmo blueprint refluir em 1080 e 1350.

```ts
function band(H: number) {
  const TOP = 200, BOT = H - 230;
  return { TOP, BOT, CH: BOT - TOP };
}
function mid(TOP: number, CH: number, blockH: number) {
  return TOP + Math.max(0, (CH - blockH) / 2);
}
```

### Escala tipográfica

| Papel | Tamanho | Line-height | Tracking |
|---|---|---|---|
| hero | 175 | 185 | −0.04em |
| display | 110 | 118 | −0.03em |
| heading | 90 | 110 | −0.02em |
| lead | 48 | 62 | — |
| body | 36 | 44 | — |
| micro | 32 | 40 | 0.14em |

### Os 8 arquétipos

| id | Papel | Slots |
|---|---|---|
| `cover-centro` | Abertura de alto impacto, manchete no eixo central | heading · kicker · chrome |
| `numerada` | Item de lista com número gigante acima da manchete | number · heading · chrome |
| `citacao` | Cartão translúcido sobre foto, com marca de aspas | media · quote · author |
| `dado` | Manchete no topo, área de gráfico no corpo | heading · chart |
| `foto-total` | Imagem sangrando, manchete ancorada na base | media · heading |
| `lista-icone` | Itens curtos com marcador à esquerda | heading · items[] |
| `evento` | Bloco de data destacado + título + detalhe | date · heading · detail |
| `fecho` | Chamada final com ação clara | heading · cta · chrome |

Geometria de cada um: leia as funções `body(H)` em
`design/Biblioteca de Blueprints.dc.html`. São a especificação.

### Seleção automática de layout (determinística, roda antes de renderizar)

| Sinal | Condição | Blueprint |
|---|---|---|
| Papel do slide | `índice === 0` | `cover-centro` |
| Papel do slide | `índice === último` | `fecho` |
| Estrutura em passos | slide tem número de ordem | `numerada` |
| Citação detectada | corpo entre aspas ou com autor | `citacao` |
| Número no corpo | regex de valor, % ou série | `dado` |
| Itens curtos | 3 a 5 linhas de ≤ 9 palavras | `lista-icone` |
| Data no corpo | dia, mês e hora presentes | `evento` |
| Foto forte disponível | acervo tem imagem com faixa escura | `foto-total` |
| Nenhum sinal | fallback | `cover-centro` |

Dentro do blueprint escolhido, sorteie entre eixos permitidos (posição do bloco
de texto, alinhamento, degrau da escala, logo topo/base, rodapé pill/limpo).
Cada eixo tem valores validados — nenhuma combinação pode produzir texto
ilegível.

### Regra de clamp obrigatória

Texto gerado por IA tem comprimento imprevisível. **Todo slot de texto precisa de
altura máxima e clamp de linhas**, ou o corpo invade o rodapé:

```css
max-height: 99px;              /* capa/fecho: 2 linhas a 44px */
overflow: hidden;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
```

Isso foi bug real duas vezes nos protótipos. Restrinja o container — não confie
no prompt para limitar palavras.

---

## Brand Kit — cliente-piloto

Lido de `andredeveza/ADTrafegoDigital_DesignSystem` (`BRAND.md`).

```css
/* escuro (padrão) */
--ink:        #06070A;
--graphite:   #101319;
--slate:      #1B212B;
--gray:       #8B94A3;
--title:      #EEF1F6;
/* marca */
--blue-deep:  #0A47A8;
--blue:       #1C7ED6;
--neon:       #57A8FF;   /* só detalhe, glow, microelemento */
--loud:       #1C4FE0;   /* painel editorial de cor sólida */
/* claro */
--bg-light:   #FFFFFF;
--panel-light:#F4F6FA;
--title-light:#0A0C10;
--text-light: #5A6474;
--brand-gradient: linear-gradient(135deg, #0A47A8, #1C7ED6 55%, #57A8FF);
```

Fontes: **Satoshi** 700/900 (display), **General Sans** 400/500 (corpo),
**JetBrains Mono** 400/500 (chrome/dados), **Instrument Serif** (frase
editorial). Satoshi e General Sans **não são Google Fonts** — carregue via
Fontshare (`https://api.fontshare.com/v2/css?f[]=satoshi@700,900&f[]=general-sans@400,500&display=swap`)
ou hospede os arquivos.

Chrome do carrossel:
- topo: `@trafegodigitalad · AD TRÁFEGO DIGITAL · ©2026`, Mono 19px,
  `letter-spacing:.20em`, uppercase, em `y=74`, largura 920 a partir de `x=80`
- rodapé: logo 46px à esquerda + `✦ ARRASTE PARA O LADO →` à direita, Mono 21px,
  em `y=1214`

Regras da marca a respeitar no código:
- neon nunca como fundo de área grande
- o feed **alterna claro e escuro de propósito** — o seletor de layout deve
  distribuir modos, não sortear
- blur só em brilho de fundo, nunca em texto
- último slide troca o rodapé para `SALVE ESTE POST`

Modelo de dados do Brand Kit:

```ts
type BrandKit = {
  palette: { ink; graphite; slate; gray; title; brand; primary; accent; loud;
             bgLight; panelLight; titleLight; textLight };
  gradient: string;
  fonts: { display: FontRef; body: FontRef; mono: FontRef; editorial?: FontRef };
  logo: { assetId: string; radius: number };
  chrome: { top: string[]; footer: string; footerLast: string };
  rules: { neonMaxArea: 'detail'; alternateModes: boolean; blurTextForbidden: true };
  imageStyle: string;
  cta: string;
};
```

---

## Acervo / RAG

Fluxo: **ingestão → extração → indexação → recuperação**.

1. **Ingestão** — PNG, JPG, WEBP, PDF, TTF/OTF/WOFF2. Entra em `assets` com
   status `pending`.
2. **Extração** por tipo:
   - imagem: cor dominante (quantização em buckets de 32), **luminância média em
     três faixas verticais** (topo/meio/base, fórmula
     `0.2126r + 0.7152g + 0.0722b`), proporção, tamanho
   - PDF: texto das primeiras páginas, termos por frequência, trechos entre 40 e
     320 caracteres
   - fonte: registra no Brand Kit
3. **Indexação** — pgvector: embedding visual (CLIP via Hugging Face) + descrição
   gerada para imagens; embedding semântico dos trechos para texto.
4. **Recuperação** — para cada slide, pontua cada asset:

```
ratioFit    = 1 - min(1, |aspect - 0.8| / 1.2)
contrastFit = 1 - luminância da faixa onde o título vai
topicFit    = similaridade semântica com o tema
penalty     = 0.12 se o asset já foi usado neste carrossel
illegible   = 0.40 se contrastFit < 0.30

total = ratioFit*0.34 + contrastFit*0.46 + topicFit*0.20 - penalty - illegible
```

Se `total` passa do limite, usa a foto real do cliente; se não, gera com IA.
`illegible` existe para que legibilidade vença variedade — sem ele o sistema
escolhe foto clara e o título desaparece. **Não remova.**

No protótipo `topicFit` usa nome de arquivo e termos do PDF; em produção é
embedding visual. O resto do algoritmo porta literalmente.

O véu (scrim) é calculado, não fixo:
`scrim = min(0.96, 0.55 + luminânciaDaFaixa * 0.5)`.

---

## Estilos de composição (`composition_styles`)

O template define **onde** as coisas ficam; o estilo define **como aquilo se
compõe**. Sem essa camada, todo carrossel sai com o mesmo esqueleto e a única
diferença entre dois clientes vira cor e fonte — que é exatamente o que mata o
potencial viral. O estilo é dado, não código: acrescentar o oitavo é inserir uma
linha, nenhum componente muda.

```sql
composition_styles (
  id, slug, name, source_ref,
  margin, type_scale jsonb,       -- min/max por papel de slide
  photo_treatment,                -- bleed | card | column | none
  band_rule, chrome jsonb,
  slide_recipes jsonb,            -- papel -> receita de layout
  requires jsonb,                 -- pré-requisitos, ver abaixo
  format                          -- carousel | single
)
```

| # | Estilo | Origem | Assinatura | Exige |
|---|---|---|---|---|
| 01 | Manchete sangrada | Content Machine · Principal | margem 36px, título 128–148px, foto sangrada | foto de alto impacto |
| 02 | Noite futurista | Content Machine · Futurista | fundo noturno fixo, cartão de vidro, glow só no fundo | — |
| 03 | Revista autoral | Content Machine · Autoral | divisão 800/550, serifada no título interno | foto de retrato |
| 04 | Fio de thread | Content Machine · Twitter | cartão 968×1170 r=34, avatar + handle no topo | — |
| 05 | Canto escuro | RLVNT Studios · Dark | filetes a 130/1200, coluna estreita, numeral 180px | foto vertical |
| 06 | Névoa suave | theshubhamdhage | 3 manchas blur 60px, opacidade ≤ .42 | — |
| 07 | Grade silenciosa | Shu Ha Ri | 4 colunas fixas 96·392·688·984, título ≤ 92px | — |
| 08 | Capa de campanha | PDF Canva · HS Endoscopia | **post único**, margem 50–70px, selo "conteúdo na legenda" | — |

O estilo 08 é o único com `format = 'single'`: o corpo do conteúdo vive na
legenda, não em slides. O gerador precisa oferecer "post único" e "carrossel"
como caminhos distintos — não são o mesmo pipeline com contagem diferente.

**Recomendação automática.** `requires` é avaliado contra o acervo do cliente
antes de listar as opções. Sem foto boa indexada, os estilos 01, 03 e 05 aparecem
desabilitados com o motivo à mostra ("precisa de uma foto vertical no acervo") —
nunca silenciosamente ausentes.

**Papel do slide, não índice.** O gerador decide o papel de cada slide (capa ·
argumento · dado · citação · prova · fecho) e o estilo resolve a composição
daquele papel. Trocar de estilo remonta o carrossel sem reescrever texto.

**Só estrutura vem da referência.** Dos arquivos originais saem grid, proporção,
escala e ritmo. Cor, fonte, logo e imagem de terceiros nunca são reaproveitados —
o Brand Kit do cliente preenche tudo isso.

---

## Importar acervo a partir do site do cliente

Funcionalidade do Brand Kit: o usuário cola a URL do site do cliente e o sistema
monta o acervo inicial sozinho. Elimina a fricção de pedir logo e fotos por
e-mail — que é o que trava o cadastro de cliente novo na prática.

`SiteImportService` (em `core/application/services`), rodando no worker do Render
(precisa de Chromium para páginas que montam por script):

1. **Fetch + render.** Puppeteer abre a URL e espera a rede ficar ociosa. Sem
   isso, imagens lazy-loaded não aparecem — foi exatamente o caso do site da HS
   Endoscopia, onde as fotos de procedimento e equipe não estão no HTML servido.
2. **Coleta.** Extrai de `<img src|srcset>`, `<source>`, `background-image` do
   CSS computado, `<link rel=icon>`, `og:image` e o `sitemap.xml` para descobrir
   as outras páginas.
3. **Filtra.** Descarta menos de 200px em qualquer lado, ícone de rede social,
   pixel de tracking, sprite e data-URI minúsculo. Deduplica por hash do arquivo,
   não por URL — CDN de construtor de site serve a mesma imagem em vários
   tamanhos.
4. **Classifica** com o AIGateway (visão): `logo` · `equipe` · `estrutura` ·
   `procedimento` · `decorativo`. Alimenta `assets.kind`.
5. **Extrai identidade.** Cores dominantes das áreas de marca, `font-family`
   dos títulos e do corpo via CSS computado, e texto de `<h1>/<h2>` para tom de
   voz. Vira sugestão de Brand Kit — **sempre em tela de revisão, nunca aplicado
   direto.**
6. **Ingere** no pipeline normal do acervo (extração → pgvector), já com
   `client_id`.

Enquadramento e limites:

- Só site que o cliente comprove ser dele. Registre em `assets.source_url` e
  `assets.imported_by` — é o que sustenta a autorização depois.
- Respeite `robots.txt`, um request por segundo, `User-Agent` identificando o
  sistema.
- Nada de scraping de rede social (Instagram/Facebook bloqueiam e proíbem em
  termos de uso). Para Instagram, o caminho é a Graph API na conta do próprio
  cliente.
- A imagem importada nasce com `status = 'review'`. O usuário aprova antes de
  entrar em carrossel — foto de site costuma ter marca d'água, texto embutido ou
  resolução ruim.

A mesma rota serve para PDF institucional e apresentação: `SiteImportService` e
o upload manual desembocam no mesmo pipeline de ingestão.

---

## Renderização

1. `RenderService` monta o HTML do slide: template + Brand Kit como CSS custom
   properties + conteúdo.
2. Puppeteer abre, espera fontes (`document.fonts.ready`) e imagens, tira o
   screenshot em 1080×1350.
3. PNG vai para Supabase Storage; `media` recebe o registro.

**Roda em serviço separado no Render** (a Vercel não sustenta Chromium). Plano
gratuito do Render dorme após 15min e tem 512MB — aceitável porque a renderização
é assíncrona. Use `@sparticuz/chromium` + `puppeteer-core`, e
`--no-sandbox --single-process` para caber na memória.

---

## Publicação

`PublishingGateway` com canais plugáveis. **No MVP só o canal `export`**: gera um
zip com os PNGs + `legenda.txt`. Isso remove a única dependência de aprovação de
terceiro do projeto.

Depois, na ordem de preferência: Postiz auto-hospedado (AGPL, Docker no mesmo
Render), Mixpost, ou API do Instagram direto (exige revisão da Meta).

---

## Segurança

- Chaves só no servidor; nenhuma chamada de IA a partir do browser
- RLS por `org_id` em todas as tabelas, não só na aplicação
- Rate limit em três camadas: usuário, org, provedor — com orçamento mensal de
  custo de IA
- Tokens OAuth de canais cifrados em vault, com rotação
- Toda saída de IA validada por Zod antes de tocar o domínio
- Logs estruturados de ação, geração e publicação

---

## Ordem de implementação

Faça nesta ordem. Cada bloco entrega algo verificável.

**1 · Fundação** — Next.js 15 + React 19 + TS estrito, Tailwind, shadcn.
Supabase: projeto, migrations, RLS por `org_id`, auth. `config/*`. `shared/result`.

**2 · AI Gateway** — `AIProvider`, registry, fallback com circuit breaker,
`ai_logs`, rate limiter. Provedor OpenRouter funcionando; os outros registrados e
desligados por flag. Teste: derrube o provider e veja o fallback assumir.

**3 · Cliente + Brand Kit** — domínio, repositories, CRUD, upload de logo.
Cadastre a AD Tráfego Digital com os valores acima como seed.

**4 · Template engine** — blueprint JSON → HTML + CSS vars. Os 8 arquétipos.
`SelectLayout`. Regra de clamp. Teste: renderize os 8 com textos de comprimento
absurdo e confirme que nada invade o chrome.

**5 · Render** — serviço Puppeteer no Render, screenshot 1080×1350, Storage.
Teste: o PNG gerado tem que bater com o preview do `.dc.html`.

**6 · Pipeline** — os 7 steps na fila, checkpoint, retomada, progresso por
Realtime. No começo pode rodar inline; o adapter é o mesmo.

**7 · Acervo + RAG** — ingestão, extração, pgvector, `RetrieveAssets`.
Porte a função de score do protótipo.

**8 · Editor** — rail, canvas, inspector, overrides por slide.

**9 · Exportação** — canal `export` do PublishingGateway: zip com PNGs +
legenda.

**10 · Agenda** — calendário editorial. Só depois de 1–9 rodando ponta a ponta.

---

## Critério de pronto

Um tema digitado no gerador produz, sem intervenção manual: 6 a 8 PNGs em
1080×1350 no Brand Kit da AD, legenda, hashtags e CTA — com pelo menos uma imagem
vinda do acervo do cliente, e nenhum texto invadindo o chrome do slide.

---

## Assets

| Arquivo | Origem |
|---|---|
| `design/logo-ad.png` | repositório `andredeveza/ADTrafegoDigital_DesignSystem` |
| `design/founder-office.png` | idem |
| `design/founder-window.png` | idem |

`founder-dark.png` é citado no README do repositório mas **não existe** lá.
Os arquivos de fonte (Satoshi, General Sans) também não estão no repositório.

Imagens de placeholder nos protótipos vêm de `picsum.photos` — substitua por
acervo real, nunca deixe em produção.

## Files

```
design/
├── Content AI Studio - Arquitetura.dc.html        arquitetura, banco, pipeline, backlog
├── Content AI Studio - Protótipo AD Mobile.dc.html  ★ o produto navegável (mobile-first)
├── Content AI Studio - Protótipo AD.dc.html       mesma navegação em desktop
├── Biblioteca de Blueprints.dc.html               ★ os 8 arquétipos + regras de seleção
├── Acervo Inteligente.dc.html                    ★ RAG funcional, algoritmo de score
├── AD Trafego Digital - Carrossel.dc.html         ★ Brand Kit real aplicado, 8 slides
├── Template Blueprint - Carrossel.dc.html         molde 1080×1350 com 10 variantes
├── Exemplos de Saída.dc.html                     3 temas entregues por completo
├── Feed Preview.dc.html                          como aparece no feed
├── support.js                                    runtime dos .dc.html (mantenha ao lado)
└── logo-ad.png · founder-office.png · founder-window.png

COLOCAR-NO-AR.md    contas e chaves que o cliente precisa providenciar
.env.example        variáveis de ambiente esperadas
```

★ = leia antes de começar.

## Aviso

Os blueprints carregam apenas **estrutura** derivada de arquivos de referência
(grid, margens, hierarquia, escala). Cor, fonte, logo, imagem e texto dos
arquivos originais de terceiros não foram reaproveitados e não devem ser.
