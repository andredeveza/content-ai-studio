# Como testar 100% e o que falta para completar

Este arquivo é o retrato honesto do que existe, do que foi validado de
verdade e do que ainda falta no Content AI Studio, depois dos blocos 1
a 10 do `design_handoff_content_ai_studio/README.md`. Escrito para você
(e para uma sessão futura do Claude Code) usar como checklist.

## 0. Estado atual — leia isto primeiro

- **O banco (Supabase) está atualizado**: todas as migrations (0001 a
  0008) rodaram no projeto remoto de verdade.
- **O deploy da Vercel está desatualizado.** O último `vercel deploy
  --prod` foi feito logo depois do bloco 6. Os blocos 7 (Acervo/RAG), 8
  (Editor), 9 (Exportação) e 10 (Agenda) **existem só no código local**
  — nunca foram commitados nem deployados. Se você abrir a URL da
  Vercel hoje, não vai ver `/agenda` nem `/projects/.../editor`.
- **O git também está atrasado**: só existem 4 commits (blocos 1–6 +
  3 correções). Tudo dos blocos 7–10 está sem commit (`git status`
  mostra ~74 arquivos novos/alterados).
- **O serviço de Render (Puppeteer) está atualizado** — nada mudou lá
  desde o deploy inicial, então não precisa redeploy.

Antes de qualquer teste "no site publicado", ou você redeploya (seção
1 abaixo), ou testa localmente (`npm run dev`) — os dois caminhos estão
descritos abaixo.

---

## 1. Colocar os blocos 7–10 no ar (se você quiser testar no site publicado)

Peça isso ao Claude Code, nesta ordem:

1. `"Revise o que está pendente de commit, crie um commit dos blocos 7 a 10 e dê push."`
2. `"Rode o deploy de produção na Vercel de novo (vercel deploy --prod)."`

O serviço do Render **não** precisa de redeploy (nada mudou lá). As
migrations já estão aplicadas no banco remoto, então não precisa rodar
nada de banco de novo.

---

## 2. Testes automatizados (sempre rode isto primeiro)

Na raiz do projeto:

```bash
npm install
npx tsc --noEmit        # typecheck — tem que sair limpo, sem output
npx eslint src/          # lint — tem que sair limpo
npm test                 # vitest — 132 testes, todos passando
npm run build             # build de produção do Next.js
```

Se qualquer um desses falhar, pare aqui — os testes manuais abaixo não
vão funcionar direito com o build quebrado.

**O que isso cobre:** a lógica de negócio inteira (score do acervo,
template engine, pipeline com retomada após falha, editor, exportação,
agendamento) — tudo com testes unitários usando fakes, sem depender de
rede. **O que isso NÃO cobre:** se as chaves de API reais funcionam, se
o Supabase/Render em produção respondem, se a tela renderiza direito
num navegador de verdade. Para isso, seção 3.

---

## 3. Teste manual ponta a ponta (local, com dados reais)

### 3.1 — Preparar o ambiente

```bash
npm run dev
```

Abra `http://localhost:3000` (ou a porta que aparecer no terminal).

### 3.2 — Criar uma conta e logar

1. Vá em `/signup`, crie uma conta com um e-mail qualquer.
2. Confirme que consegue logar em `/login` depois.
3. **Isto cria uma org nova, vazia** — sem cliente, sem brand kit, sem
   projeto. Para testar as telas de verdade, você precisa ligar seu
   usuário à org da AD Tráfego Digital (que já tem o seed do bloco 3) ou
   criar seu próprio cliente/brand kit à mão no banco, porque **não
   existe tela para cadastrar cliente ainda** (ver pendência #3 abaixo).

   Caminho mais rápido pra testar: peça ao Claude Code:
   `"Crie um usuário de teste ligado à org da AD Tráfego Digital pra eu
   poder logar e ver o /agenda e o /editor com dados reais."` — é
   exatamente o que foi feito pra validar os blocos 8, 9 e 10 durante o
   desenvolvimento.

### 3.3 — Testar o pipeline de geração (blocos 6+7) — ⚠️ **vai falhar às vezes, leia a pendência #1**

Não existe tela "Gerador" ainda (pendência #2). Para gerar um
carrossel de verdade hoje, é preciso rodar o `GenerateCarouselUseCase`
via script. Peça ao Claude Code:

> "Rode um carrossel de verdade pro cliente semeado (AD Tráfego
> Digital), com o tema '<seu tema aqui>', e me mostre o resultado."

**O que observar:**
- Se o job terminar com `status: completed` e 6–8 PNGs no Storage:
  funcionou ponta a ponta (Research → Copy → Prompt → Image →
  Render → Publish/Export).
- Se o job falhar no step `image`: é a pendência #1 (nenhum provedor
  de geração de imagem está ligado). Não é bug do pipeline — é
  configuração faltando.

### 3.4 — Testar o Editor (bloco 8)

1. Com um projeto `completed` existente (do passo 3.3, ou peça pro
   Claude Code criar um com slides fixos pra teste), acesse
   `/projects/<id>/editor`.
2. Confira: preview grande no topo, rail de miniaturas, inspector com
   campos que mudam conforme o arquétipo do slide selecionado.
3. Clique num slide diferente no rail — o inspector deve trocar de
   campos (ex.: "Citação"/"Autor" pra um slide de citação).
4. Edite um texto, clique **Salvar edição** — confirme que não deu
   erro e que o preview atualizou.
5. Clique num item da grade **variante** — o preview deve mudar de
   layout na hora, antes mesmo de salvar.
6. Se o slide selecionado tiver foto (arquétipos "Citação" ou "Foto
   total"), teste **Regerar imagem** — ⚠️ mesma pendência #1: só
   funciona se um provedor de imagem estiver ligado.

### 3.5 — Testar a Exportação (bloco 9)

No Editor, clique **Exportar PNG**. Uma nova aba deve abrir com o
download de um `.zip`. Abra o zip e confira:
- Um PNG por slide, nomeado `slide-1.png`, `slide-2.png`, etc.
- Um `legenda.txt` com a legenda + hashtags (`#assim`) + CTA.

### 3.6 — Testar a Agenda (bloco 10)

1. No Editor de um projeto `completed`, clique **Agendar publicação**,
   escolha uma data/hora, confirme.
2. Vá em `/agenda`. Confira:
   - O mês certo aparece no título, com um pontinho no dia agendado.
   - Clicar no dia filtra a lista pra só aquele dia; clicar de novo (ou
     em "ver o mês") limpa o filtro.
   - O post aparece com tema, horário, status ("agendado", cor neutra)
     e o handle do cliente.
   - Clicar **marcar como publicado** muda a cor pra verde e o texto
     pra "publicado", e os botões de ação somem.
   - Clicar **cancelar** remove o post da lista.
3. Teste os links de mês anterior/próximo (as setas ao lado do título)
   — a URL muda pra `/agenda?month=AAAA-MM` e a lista atualiza.

### 3.7 — O que passar em branco (ainda não existe)

- Tela de login social, recuperação de senha: não implementado (fora
  do escopo dos 10 blocos).
- Cadastro de cliente novo / edição de brand kit pela UI: não existe
  (pendência #3).
- Upload de acervo (imagens/PDF/fonte) pela UI: o backend existe
  (bloco 7), a tela não (pendência #3).

---

## 4. O que falta para completar (em ordem de prioridade)

### 🔴 Crítico — sem isso o produto não "funciona" de ponta a ponta

**#1 — Nenhum provedor de geração de imagem está ligado.**
`config/features.ts` tem `aiProviderHuggingFace`, `aiProviderReplicate`
e `aiProviderFal` todos em `false`, e os três só existem como
`StubProvider` (sempre lançam erro se chamados). O OpenRouter (único
provedor real) só faz texto. Resultado: **todo slide que precisar de
imagem (arquétipos "Citação" ou "Foto total") derruba o pipeline
inteiro no step `image`**, a não ser que o cliente já tenha uma foto no
acervo com score bom o bastante.

Como resolver — peça ao Claude Code:
> "Implemente um provedor de imagem real via Hugging Face Inference
> API (o próprio protótipo do handoff cita 'hf/flux-schnell' como
> modelo de referência gratuito), ligue a feature flag
> `aiProviderHuggingFace`, e me mostre um carrossel completo gerando
> com sucesso um slide de citação ou foto."

Alternativa mais rápida (rede de segurança, não resolve de vez): pedir
para o `ImageService` cair num fundo sólido do Brand Kit em vez de
falhar quando nenhum provedor de imagem responder — mas isso mascara o
problema, o certo é ligar um provedor de verdade.

**#2 — Deploy desatualizado.** Ver seção 1 acima.

### 🟠 Alto — o produto não é usável por alguém que não seja você mexendo no banco

**#3 — Não existem as telas de "Gerador", "Projetos" e "Marca".**
O README descreve 6 telas (Gerador, Geração/progresso, Editor, Agenda,
Marca, Projetos). Só Editor e Agenda foram construídos (blocos 8 e
10) porque só eles tinham bloco próprio na "Ordem de implementação".
Sem uma tela de Gerador, **o usuário final não tem como digitar um
tema e disparar a geração** — hoje isso só acontece via script/Claude
Code. Sem a tela de Marca, **não dá pra cadastrar um cliente novo** sem
mexer direto no banco.

Peça ao Claude Code, um de cada vez:
> "Construa a tela Gerador (tema, objetivo, número de slides, template)
> que chama o GenerateCarouselUseCase e me leva pra tela de progresso."
> "Construa a tela de progresso (barra 5–100%, lista dos 7 steps,
> terminal de log) assinando os updates de `jobs` via Supabase
> Realtime."
> "Construa a tela Projetos (lista + botão novo carrossel)."
> "Construa a tela Marca (cadastro de cliente + brand kit pela UI, sem
> precisar de SQL)."

**#4 — Sem navegação entre telas.** O `(dashboard)/layout.tsx` é só um
fundo — de propósito, não linkei a tab bar de 5 ícones do design porque
3 das 5 telas não existiam ainda. Depois que a pendência #3 estiver
resolvida, vale pedir a tab bar inferior completa (ícones
gerador/geração/editor/agenda/marca).

### 🟡 Médio — funciona, mas não com a fidelidade visual que o README pede

**#5 — As fontes reais do Brand Kit nunca carregam.** Descoberto no
bloco 8: o `TemplateEngineService` referencia `var(--bk-font-display)`
etc., mas nunca insere `@font-face` nem um `<link>` do Fontshare/Google
Fonts — nem no preview ao vivo do Editor, nem no PNG final gerado pelo
Puppeteer. Isso significa que **todo PNG publicado até hoje saiu com a
fonte de fallback do sistema, não com Satoshi/General Sans reais**, o
que viola a regra de "alta fidelidade" do README.

Peça ao Claude Code:
> "O TemplateEngineService não carrega as fontes reais do Brand Kit.
> Adicione o link do Fontshare (Satoshi/General Sans) e do Google
> Fonts (JetBrains Mono/Instrument Serif) no HTML gerado, e confirme
> que o Puppeteer espera `document.fonts.ready` antes do screenshot."

### 🟢 Baixo — deliberadamente fora do MVP, mencionado no README como "depois"

- **Embedding visual (CLIP) para o Acervo/RAG**: a infraestrutura
  (pgvector, tabela `asset_embeddings`, função de busca por
  similaridade) já existe, mas fica vazia porque nenhum provedor de
  embedding está ligado (mesma causa da pendência #1). Até lá, o
  sistema usa o fallback literal do protótipo (nome de arquivo/termos
  do PDF) — que já funciona, só não é "de produção" ainda.
- **Publicação automática de verdade (Postiz/Instagram)**: o README já
  avisa que isso vem "depois" do MVP. Hoje só existe o canal `export`
  (zip pra postar manualmente).
- **Importar acervo a partir do site do cliente**: descrito no README,
  mas nunca teve bloco numerado — não foi implementado.
- **Tabela `templates`/versionamento de blueprint no banco**: os 8
  arquétipos vivem em código (TypeScript), não no banco. Decisão
  deliberada do bloco 4, documentada no código.

### 🧹 Faxina / housekeeping

- Ainda existe um token da Vercel que você colou no chat durante o
  deploy — se ainda não revogou, revogue em
  `vercel.com/account/tokens`.
- Não existe CI (GitHub Actions) rodando `npm test`/`npm run build` a
  cada push — hoje quem garante que nada quebrou sou eu, manualmente,
  a cada bloco. Vale pedir:
  > "Configure um GitHub Actions que roda typecheck, lint, teste e
  > build em todo push e pull request."
- `package-lock.json` tem `12 high severity vulnerabilities` reportadas
  pelo `npm audit` (arrastadas de dependências transitivas do
  Next.js/Puppeteer/sharp) — vale rodar `npm audit` e avaliar quais
  valem a pena corrigir antes de ir mais a fundo em produção.

---

## 5. Resumo rápido — o que já é seguro dizer que "funciona de verdade"

Validado com dados reais (banco remoto, Puppeteer real, Storage real,
não só testes com fake) durante o desenvolvimento:

- ✅ Login/signup, RLS multi-tenant por `org_id`.
- ✅ AI Gateway com fallback e circuit breaker (testado derrubando
  provider).
- ✅ CRUD de cliente/brand kit (só via backend/script, sem tela).
- ✅ Os 8 arquétipos de slide, com clamp de texto (nunca invade o
  rodapé) — testado com texto absurdamente longo nos 8.
- ✅ Renderização real via Puppeteer (screenshot 1080×1350 e
  1080×1080) rodando local e no serviço deployado no Render.
- ✅ Pipeline de 7 steps com checkpoint — testado derrubando um
  provedor no meio e retomando exatamente do step que falhou.
- ✅ Score do acervo (fórmula do protótipo portada e testada com
  imagens sintéticas reais via `sharp`) e extração de PDF (com PDF real
  gerado via Puppeteer).
- ✅ Editor: preview ao vivo, troca de variante, edição, salvar —
  testado no navegador com Puppeteer.
- ✅ Exportação: zip real baixado do Storage e inspecionado (PNGs +
  legenda corretos).
- ✅ Agenda: agendar, filtrar por dia, marcar como publicado, cancelar
  — testado no navegador com Puppeteer.

**Nunca testado com sucesso, porque depende da pendência #1:** um
carrossel completo, gerado do zero com um tema real, onde pelo menos um
slide precisou de imagem gerada por IA (sem foto no acervo). Esse é o
teste que fecha o "critério de pronto" do README — vale ser o próximo
passo.
