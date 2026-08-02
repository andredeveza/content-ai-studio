# Progresso da construção

> Peça ao Claude Code para atualizar este arquivo ao fim de CADA bloco.
> É o que permite dar `/clear` sem perder o fio.

## Estado atual

Todos os 10 blocos do README estão implementados e no ar (Vercel + Render),
mais o ADENDO-01 (ingestão de acervo, parcial — ver pendências) e o
ADENDO-02 (correções urgentes) completos.

## Blocos concluídos

- [x] Bloco 1 — fundação (Next.js, TS, Tailwind, shadcn, Supabase, auth, RLS)
- [x] Bloco 2 — AI Gateway (OpenRouter obrigatório real; Hugging Face de
      imagem real e ligado; Kimi/Gemini/Replicate/Fal continuam stub)
- [x] Bloco 3 — Cliente + Brand Kit (CRUD, upload de logo)
- [x] Bloco 4 — Template engine (8 arquétipos, SelectLayout, clamp)
- [x] Bloco 5 — Render (Puppeteer no Render.com, Storage)
- [x] Bloco 6 — Pipeline (7 steps, checkpoint, fila inline)
- [x] Bloco 7 — Acervo + RAG (ingestão, extração, pgvector, RetrieveAssets)
- [x] Bloco 8 — Editor (rail, canvas, inspector, overrides por slide)
- [x] Bloco 9 — Exportação (canal `export`: zip + legenda)
- [x] Bloco 10 — Agenda (calendário editorial)
- [x] ADENDO-02 — Correções urgentes (layout desktop, ingestão na tela
      Marca, seletor de Formato)
- [x] Correção pós-ADENDO-02 — Progresso em tempo real + acervo
      realmente usado na geração (ver decisões abaixo)
- [x] FASE A da auditoria — estilos de composição ligados na geração
      (papel do slide, variantes, distribuição de modos, garantia de
      foto real, post único). Ver "Auditoria" abaixo.
- [x] FASE B da auditoria — chrome reconstruído a partir dos protótipos
      (shell duplo, Gerador terminal, Progresso com console).

## Auditoria contra o handoff de design (fases A e B)

O usuário reportou "o app não responde ao que criamos". A auditoria
confirmou, e achou duas causas independentes:

1. **Os protótipos nunca foram usados.** `design_handoff_content_ai_studio/`
   tem 9 arquivos `.dc.html` (~300KB) que o README declara
   **especificação executável**, mais o README real de 28KB. O
   `README.md` na raiz é o boilerplate intocado do create-next-app —
   ou seja, a spec de verdade nunca foi a fonte da implementação.
   Corrigido na FASE B (ver abaixo).
2. **A camada de estilos de composição era decorativa.**
   `COMPOSITION_STYLES` era importado por exatamente 1 arquivo
   (`style-coverage.service.ts`, a barra de cobertura da tela Marca) e
   nunca tocava o pipeline. O README é explícito: *"Sem essa camada,
   todo carrossel sai com o mesmo esqueleto... é exatamente o que mata o
   potencial viral."* Corrigido nesta fase.

Consequência objetiva que a fase A fechou: o app **falhava o próprio
critério de pronto do README** — "com pelo menos uma imagem vinda do
acervo do cliente". Só 2 dos 8 blueprints têm slot de mídia e
`foto-total` era o último critério do `selectLayout`, então o carrossel
podia terminar com zero fotos do cliente mesmo com o acervo cheio. Foi
exatamente o caso da HS Endoscopia.

### O que mudou

- **`Blueprint.slots(canvas)` virou `slots(ctx: BlueprintContext)`** —
  margem, faixa de conteúdo, escala tipográfica e variante deixam de ser
  constantes de módulo. Golden test dos 8 arquétipos × 3 formatos
  escrito ANTES do refactor (24 snapshots) prova que a geometria default
  não mudou nada.
- **Alturas de caixa derivam da escala**, não são mais literais: um
  estilo que sobe a display (01: 128–148px) precisa da caixa crescendo
  junto, senão o clamp corta a manchete no meio.
- **`shrinkToBand`** — quando a escala do estilo faz o bloco passar da
  faixa, corta LINHA do bloco mais alto em vez de deixar o texto invadir
  o rodapé. Mesma filosofia da regra de clamp obrigatória ("restrinja o
  container"). Pego pelo teste de blindagem, não por revisão.
- **`selectLayout` virou `planCarouselLayout`**, com entrada no nível do
  carrossel: distribuição de modo claro/escuro e garantia de foto não
  são decisões que se possam tomar slide a slide. As regexes de sinal do
  SelectLayout original ficaram verbatim, mas devolvem PAPEL; o estilo
  resolve a composição daquele papel.
- **Especializações por sinal** (`SlideRecipe.specializations`) mantêm a
  expressividade dos 8 arquétipos — "passo 2" continua virando
  `numerada`, data com hora continua virando `evento` — só que como DADO
  do estilo, não `if` hardcoded.
- **Garantia de foto real em 3 camadas**: viés no planejamento (promove
  um slide do miolo, nunca capa/fecho), piso de recuperação 0.30 no
  `runImage` quando o carrossel fecharia sem nenhum asset, e
  `projects.media_source` (`acervo`/`ai`/`none`) para o caso "cliente
  sem acervo" virar aviso honesto. `illegible` barra o match em QUALQUER
  piso — legibilidade vence variedade, como o README manda.
- **`titleBandForArchetype`** (hardcoded `"bottom"`, com comentário
  admitindo) virou `titleBandFor(variant)`: o contraste passa a ser
  medido na faixa onde o título realmente cai.
- **Ornamento declarativo (`DecorSpec`)** resolve a geometria que nenhum
  arquétipo expressa (cartão do 04, filetes do 05, manchas do 06, guias
  do 07, selo do 08), mantendo a promessa de "acrescentar o oitavo é
  inserir uma linha".
- **Gerador com seletor de estilo**: estilo sem foto no acervo aparece
  desabilitado **com o motivo à mostra**, nunca silenciosamente ausente.
- **Post único (estilo 08)** é caminho distinto, não contagem diferente:
  some o slider, o botão muda, e os prompts de research/copy passam a
  tratar a legenda como o conteúdo principal.

### Verificado contra infraestrutura real (não só vitest)

Geração ponta a ponta com usuário/cliente descartáveis e uma foto real
ingerida no acervo, estilo "canto escuro", 7 slides:

| idx | papel | arquétipo | modo | mídia |
|---|---|---|---|---|
| 0 | capa | foto-total | dark | **acervo** |
| 1 | argumento | numerada | light | — |
| 2 | argumento | numerada | dark | — |
| 3 | dado | dado | light | — |
| 4 | citacao | citacao | dark | **acervo** |
| 5 | prova | foto-total | dark | **acervo** |
| 6 | fecho | fecho | light | — |

`media_source = 'acervo'`, duração real **56,6s**. Compare com o bug
relatado: 7 slides, todos `cover-centro`, zero fotos.

Cobertura de estilos conferida na tela com dois clientes: sem acervo, os
estilos 01/03/05 aparecem bloqueados com o motivo literal ("precisa de
uma foto vertical com faixa inferior escura no acervo"); com uma foto
vertical escura ingerida, os 8 liberam.

**Bug real pego só nessa validação** (não pelos testes): o estilo "canto
escuro" fixa `dark` em capa e prova, e o reparo de corrida de modos só
tentava virar o slide do MEIO — vendo que era fixo, desistia, e o feed
saía com três escuros seguidos. Corrigido para cair nos vizinhos, com
teste de regressão.

## Decisões tomadas durante a construção

- **Migration do Acervo (0006_acervo.sql) nunca tinha sido aplicada de
  verdade no banco remoto.** Só descoberto ao implementar o ADENDO-02: as
  tabelas `assets`/`asset_embeddings` não existiam no Supabase real,
  apesar do código do bloco 7 estar todo escrito e testado (só com fakes
  em vitest, nunca contra o banco de verdade). Aplicada agora via
  conexão direta (`pg`) — `supabase db push` não serve porque este
  projeto nunca usou o CLI com migration tracking, só SQL aplicado
  manualmente.
- **`pdf-parse` e `sharp` não podem ser importados estaticamente em
  nenhum módulo alcançável a partir de uma `page.tsx`** — nem
  transitivamente, nem só por causa de uma server action *bindada* lá
  (ex.: `<MarcaDetailScreen ingestAssetAction={ingestAsset.bind(...)} />`
  já basta para o Next tentar empacotar `actions.ts` inteiro, incluindo
  `getAnalyzeAssetUseCase` → `pdf-extraction.service.ts` → `pdf-parse`,
  no grafo de Server Components). Isso quebra o dev server com
  `TypeError: Object.defineProperty called on non-object` — mensagem
  genérica e sem stack útil por padrão; só apareceu com
  `NODE_OPTIONS="--stack-trace-limit=200"`. Corrigido trocando os
  imports estáticos de `pdf-parse` (em `pdf-extraction.service.ts`) e
  `sharp` (em `image-analysis.service.ts`) por `await import(...)`
  dentro da própria função — adia a avaliação do pacote pra quando a
  função roda de verdade (dentro de uma server action), nunca durante o
  carregamento da página. Também foi adicionado
  `serverExternalPackages: ["sharp", "pdf-parse"]` no `next.config.ts`
  como reforço (não resolveu sozinho o problema do RSC, mas é a
  configuração correta e documentada pelo Next para pacotes nativos).
- **Tipos compartilhados entre Client Component e server action ("use
  server") só podem fluir numa direção: do Client Component para o
  arquivo de actions, nunca o contrário** — mesma convenção já usada em
  `editor-screen.tsx`/`editor/actions.ts` (`EditorSlideData` nasce no
  componente). `AssetWithUrl`, `IngestAssetActionResult` e
  `ImportSiteActionResult` foram movidos para dentro de
  `marca-detail-screen.tsx` (que os define e exporta) — `actions.ts`
  importa de lá. Um `import type` na direção contrária (Client Component
  importando de um arquivo "use server") também disparou o mesmo bug do
  item acima, porque o Next processa o arquivo de origem antes de apagar
  os tipos.
- **`getAcervoRepositories()` foi separado em dois bootstraps**:
  `infra/acervo/bootstrap.ts` (só repositórios — seguro para
  `page.tsx`) e `infra/acervo/ingestion-bootstrap.ts` (use-cases de
  ingestão/análise/importação — só para arquivos "use server").
- **Site importer implementado sem Puppeteer.** O README descreve um
  crawler com navegador real (JS renderizado, CSS computado), mas
  Puppeteer só roda no serviço separado do Render — trazer isso pra cá
  seria escopo bem maior que "correção urgente". `SiteImportService`
  usa `fetch` + regex para extrair `<title>`/`og:title`/`<h1>`/meta
  description e `theme-color`; se não houver `theme-color`, baixa o
  favicon/apple-touch-icon e usa `analyzeImageBuffer` (mesma função do
  Acervo) pra tirar a cor dominante. Cobre literalmente o que o teste de
  aceite do ADENDO-02 pede ("preenche ao menos cor e um texto"), sem
  precisar do serviço de render. Guarda contra SSRF (`assertPublicHttpUrl`)
  incluída por conta própria — o README não pede, mas "cole uma URL e o
  servidor busca" é o vetor clássico.
- **Cobertura de estilos (`composition_styles`) é um catálogo estático em
  código** (`src/core/domain/template/composition-style.ts`), não uma
  tabela no banco. Os 8 estilos do README só têm `requires` reais em 3
  deles (manchete sangrada, revista autoral, canto escuro — todos
  pedindo foto); os outros 5 ficam sempre disponíveis. "Foto vertical"/
  "foto de retrato" são aproximados por aspecto (`width/height ≤ 0.95`)
  já que não há classificação por visão computacional ainda; "faixa
  escura" usa o mesmo threshold de legibilidade do `asset-scoring.service.ts`.
- **Sugestão do site aplica em campos existentes, não em campos novos**:
  cor sugerida vai pro `palette.primary` do Brand Kit, texto sugerido
  vai pro campo `style` (observações livres) do Brand Kit — ambos só
  depois de um clique explícito ("usar esta cor"/"usar este texto"),
  nunca automático. Fonte real do site (via CSS computado) fica de fora
  pela mesma razão do item Puppeteer acima.
- **Formato do Gerador virou `<input type="radio">` de verdade** (antes
  eram botões com `onClick` — já eram mutuamente exclusivos no estado,
  mas visualmente pareciam checkboxes independentes, que era exatamente
  o bug reportado). `role=radiogroup` implícito via `<fieldset>`/`<legend>`.

- **Fila passou de `inline` pra `after`** (`config/queue.ts`,
  `infra/queue/after-queue.ts`) — bug relatado por usuário: a tela de
  Progresso nunca mostrava avanço real, só "completed" já na primeira
  renderização, porque `InlineQueueAdapter.enqueue` esperava o pipeline
  inteiro (7 steps) rodar antes da server action de `/gerador`
  retornar/redirecionar. `AfterQueueAdapter` usa `after()` (Next 15,
  `next/server`) pra agendar `worker.run(jobId)` sem esperar — a action
  redireciona assim que `project`+`job` são criados, e o Realtime que já
  existia na tabela `jobs` (migration 0005) passa a ter algo incremental
  pra mostrar de verdade. `export const maxDuration = 300` adicionado em
  `app/(dashboard)/gerador/page.tsx` (Route Segment Config vale pras
  server actions vinculadas à page) — 300s é o teto do plano Pro; no
  Hobby a Vercel limita a execução real a 60s independente deste valor
  (confirmado em produção: 124s rodaram sem corte). Verificado com geração
  real ponta a ponta: a tela de Progresso capturou o job no meio do
  pipeline (step "prompt") antes de completar — antes da correção isso
  era estruturalmente impossível de acontecer. Duração real medida de
  ponta a ponta pra um carrossel de 7 slides: **56,7s** (client→job
  completed), com apenas 1 chamada de IA de texto e 0 chamadas de IA de
  imagem (nenhum slide daquele tema específico bateu num arquétipo com
  slot de mídia — ver decisão abaixo sobre prioridade de `foto-total`).
- **`hasStrongPhoto` estava hardcoded em `false`** no step "copy" do
  `PipelineWorker` (comentário dizia "sem RetrieveAssets real" —
  desatualizado desde que o bloco 7 foi ligado de verdade no
  ADENDO-02). Bug relatado por usuário: subiu várias fotos reais no
  acervo do cliente HS Endoscopia e o carrossel gerado saiu só com
  texto. Corrigido: `PipelineWorkerDeps` ganhou `assets:
  AssetRepository`, e `runCopy` agora chama
  `assets.listAnalyzedImagesByClient(project.clientId)` uma vez por
  carrossel (não por slide) pra decidir `hasStrongPhoto` de verdade.
  Testado (unitário: um slide sem nenhum outro sinal vira `foto-total`
  quando há acervo analisado; nenhuma regressão nos 154 testes).
  **Ressalva importante, descoberta rodando uma geração real de ponta a
  ponta**: `hasStrongPhoto` é o ÚLTIMO critério em `selectLayout`
  (`layout.service.ts`) — perde pra citação, número, lista e evento, e o
  slide 0 (capa) e o último (fecho) são forçados por posição,
  independente de foto disponível. Isso significa que o `cover-centro`
  (exatamente o arquétipo do screenshot que o usuário reportou como
  "resultado de merda") NUNCA vai usar uma foto, mesmo com a correção —
  por design, é uma capa só de texto/gradiente. E como copy gerado por
  IA tende a bater em número/lista/data com frequência, uma foto real só
  aparece quando sobra algum slide sem nenhum desses sinais — na geração
  de teste (tema "5 sinais de que sua clínica precisa de um novo site"),
  nenhum dos 7 slides caiu nesse caso. Isso é uma tensão de produto real
  — se o usuário quiser fotos aparecendo com mais frequência, a opção é
  subir `hasStrongPhoto` na ordem de prioridade do `selectLayout` (ou
  dar um slot de mídia opcional pro `cover-centro`), mas isso não foi
  decidido/feito aqui — fica como pendência a validar com o usuário.

### Fase B — o chrome, agora vindo dos protótipos

Os valores abaixo são literais do handoff, não aproximações.

- **Shell duplo.** Desktop ganhou a sidebar sticky de **236px**
  (`grid-template-columns:236px 1fr`) com marca + cursor piscando,
  navegação e rodapé "provedores" mostrando o estado REAL das
  capabilities de `config/ai.ts`. Mobile ganhou a top bar sticky
  (blur 8px) com botão de pasta 44×44 para Projetos. Antes existia só a
  tab bar mobile, esticada em qualquer largura.
- **Tab bar com os 5 itens certos**: `gerador`(terminal) ·
  `geração`(workflow) · `editor`(shapes) · `agenda`(calendar-days) ·
  `marca`(palette), rótulos **minúsculos** em Mono 9.5px, inativo
  `--chrome-faint`, `backdrop-blur(10px)`. Antes: 4 itens capitalizados,
  ícone de sparkles no Gerador e uma aba "Projetos" que não existe em
  protótipo nenhum (Projetos é o botão de pasta do topo).
- **Rotas-índice `/progresso` e `/editor`** resolvem para o trabalho
  mais recente da org — no protótipo, que é demo de cliente único, essas
  telas sempre existem; aqui precisavam de um alvo.
- **LogoMark** virou o triângulo do handoff (viewBox 0 0 220 168,
  `#7A7A7A` + `#0A0A0A`). O quadrado com gradiente azul e ícone de
  sparkles não estava em lugar nenhum do design.
- **Gerador virou o terminal do protótipo**: `>` verde `#3A9A48` Mono
  17px com cursor piscando, chips de sugestão em carrossel horizontal,
  objetivo como lista de rádio com bolinha desenhada (anel 15px, miolo
  8px), **stepper 44×44** no lugar do `<input type=range>`, **campo CTA**
  (que simplesmente não existia), cards de formato de 84px e botão de
  52px.
- **Progresso** ganhou o percentual **Mono 46px/700**, barra de **4px**
  com `cubic-bezier(.4,0,.2,1)`, os 7 steps com `●`/`◐`/`○` + nome do
  serviço + porcentagem, e o **console preto** `#080808` r=11px Mono
  10.5px com cursor branco piscando — alimentado pelo estado real do
  job, sem número inventado.
- **`globals.css`** ganhou o keyframe `blink` e a classe **`noscroll`**,
  que já era aplicada em `agenda-screen` e `editor-screen` mas **nunca
  tinha sido definida** — ou seja, a barra de rolagem aparecia.
- **Marca**: dropzone com os três estados do protótipo (ocioso ·
  analisando com barra e passo · concluído — o terceiro faltava, então
  não havia confirmação de sucesso) e tipografia renderizando cada linha
  na própria fonte.
- Alvo de toque mínimo de 44px aplicado nos controles interativos.

Conferido em navegador real a 430px e a 1280px contra os protótipos
abertos lado a lado.

### Verificado em PRODUÇÃO depois do deploy

URL pública: **`https://content-ai-studio-chi.vercel.app`**. Atenção: a
URL org-scoped (`content-ai-studio-criadoresambiciosos-7112s-projects
.vercel.app`) está atrás do Deployment Protection da Vercel e devolve a
parede de login SSO — não serve para teste automatizado. E
`content-ai-studio.vercel.app` (citada no User-Agent do site importer)
**não existe**: dá 404.

Medido no ar, com usuário e cliente descartáveis: sidebar renderizando
em **236px** exatos, prompt do Gerador em `rgb(58,154,72)` = `#3A9A48`,
campo CTA e stepper presentes.

Geração real em produção (estilo "canto escuro", 7 slides): concluiu com
`media_source = 'acervo'`, 4 slides carregando foto do cliente, papéis
variados e modos distribuídos sem três iguais seguidos.

- **Redirect para o Progresso em 1,9s** — o `after()` está funcionando:
  a tela abre com o job ainda em movimento, que era o ponto.
- **Duração total: 124s**, contra 56s local. A diferença é o serviço de
  render no Render.com acordando do sono do plano gratuito (~40s, o
  README já prevê e aceita isso justamente porque a geração é assíncrona).
- **Resolve a dúvida em aberto sobre o plano da Vercel**: o pipeline
  rodou 124s dentro do `after()` e terminou sem ser cortado, ou seja, o
  teto real é maior que os 60s do plano Hobby — o `maxDuration = 300`
  declarado em `gerador/page.tsx` está sendo respeitado.

- **Catálogo de estilos ficou em TypeScript, não em tabela** — desvio
  deliberado da spec, que pede `composition_styles` no banco.
  `slideRecipes` referencia `ArchetypeId` e uniões de eixo que só
  existem em código: no catálogo um typo é erro de compilação com
  exaustividade `never`; numa tabela seria falha Zod em runtime dentro
  do worker, descoberta pelo cliente. Estilos são produto versionado,
  não dado de tenant — uma linha antiga apontando para um arquétipo
  removido quebraria produção com CI verde. O requisito real do README
  ("acrescentar o oitavo é inserir uma linha, nenhum componente muda") é
  satisfeito literalmente por um array congelado, e há teste de
  invariantes fazendo o papel das constraints do banco. O que varia por
  projeto (`projects.style_id`, `slides.role`, `slides.variant`) esse
  sim está persistido (migration 0010). Escape futuro, se aparecer
  customização por org: `composition_style_overrides (org_id, style_id,
  patch jsonb)`.
- **Estilo default é `nevoa-suave`, não o 01** — o 01 exige foto, e
  cliente recém-cadastrado não tem acervo; cair num estilo bloqueado
  travaria o gerador logo no primeiro uso.

## Pendências conhecidas

- **Fidelidade que a Fase B NÃO cobriu.** O shell, o Gerador e o
  Progresso vieram dos protótipos; Editor, Agenda e Projetos ainda usam
  a linguagem visual anterior (funcionam, mas não foram remontados a
  partir do handoff). O Editor em particular continua sem o rail de
  52×65 e o inspector na proporção do protótipo.
- **Tabelas da spec ainda ausentes** (não bloqueiam o que está no ar):
  `templates`, `captions`, `hashtags`, `publications`, `uploads`,
  `prompt_history`, `post_metrics`, `blueprints`, `layout_variants`.
  Também falta `assets.status = 'review'` com aprovação do usuário antes
  de uma foto importada entrar em carrossel — hoje o site importer já
  ingere direto.
- **Flakiness do `sharp` no dev server Windows, fora do Next.** Rodando
  `next dev` neste Windows, `sharp` às vezes falha com
  `ERR_DLOPEN_FAILED` especificamente quando carregado a partir de uma
  server action (nunca via script Node direto, nunca nos testes
  vitest). Não é um bug do código — é uma interação conhecida do
  Next.js dev server com binários nativos no Windows. Não acontece no
  build de produção (testado, 100% limpo) nem deve acontecer no Render/
  Vercel (Linux). Se voltar a aparecer localmente, restart do
  `next dev` resolve.
- **ADENDO-01 só parcialmente coberto.** O que o ADENDO-02 pedia como
  urgente está feito (dropzone + 1 importador em massa real + cobertura
  de estilos + campos de conferência). Ainda faltam do ADENDO-01
  completo: importador de Instagram (Graph API na conta do cliente —
  arquitetura ainda não desenhada), importador de ZIP/pasta (roteamento
  por tipo dentro do zip), suporte a DOCX/PPTX/XLSX/vídeo na ingestão,
  embedding visual real (CLIP via Hugging Face — a capability "embed"
  está desligada em `config/ai.ts` até um provider real ser ligado), e a
  extração de fonte/cor "de verdade" do site via CSS computado (precisa
  de Puppeteer, ver decisão acima).
- **Estado da tela "Pronto"/"Parcial"/"Recusado" do ADENDO-01 não é tão
  rico quanto o protótipo especifica** — o inventário mostra fatos por
  asset (dimensão, cor, termos, família) mas não replica os 5 estados
  exatos do adendo (ex.: mensagem de rejeição explicando por que um
  arquivo foi recusado não existe ainda; hoje um arquivo não suportado
  só falha com uma mensagem genérica do `IngestAssetUseCase`).
- **`npm audit`** ainda reporta as mesmas 12 vulnerabilidades "high"
  transitivas (dependências do próprio Next.js/ESLint) documentadas na
  sessão anterior — sem fix seguro disponível, não reavaliado aqui.
