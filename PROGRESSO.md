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
  (não confirmado ainda qual plano está ativo). Verificado com geração
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

## Pendências conhecidas

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
