# Passo a passo — o que VOCÊ faz para o Claude Code construir o sistema

Este arquivo é para você, não para o desenvolvedor. Ele lista, na ordem, o que
você precisa fazer com as próprias mãos. Nada aqui exige saber programar.

**Tempo total: cerca de 2 horas**, divididas em duas partes:

- **Parte 1 — Preparar (40 min).** Criar contas e pegar chaves.
- **Parte 2 — Construir (o resto).** Rodar o Claude Code e acompanhar.

Faça a Parte 1 inteira antes de começar a Parte 2. Se começar a construir sem as
chaves, você vai travar no meio.

---

# PARTE 1 — PREPARAR

## Passo 0 — Revogue a chave do Kimi (faça agora)

Você colou uma chave do Kimi no chat no início do projeto. Chave que aparece em
conversa está queimada — qualquer pessoa com acesso ao histórico pode usar, e o
gasto cai na sua conta.

1. Entre no painel do Kimi / Moonshot
2. Vá em **API Keys**
3. Apague a chave que começa com `sk-IZJC1PQ...`

Não precisa criar outra. O sistema começa com OpenRouter.

**Regra para o resto do projeto:** chave nunca vai para chat, e-mail, WhatsApp ou
documento compartilhado. Só para gerenciador de senhas e para o painel do serviço.

---

## Passo 1 — Um lugar para guardar as chaves

Antes de criar qualquer conta, decida onde vai guardar. Se guardar em bloco de
notas solto, você vai perder ou vazar.

Escolha um:

- **Bitwarden** (<https://bitwarden.com>) — gratuito, é o que eu recomendo
- **1Password** — pago, mais fácil de usar
- **Apple Senhas / Chaves do Google** — serve se você já usa

Crie uma anotação segura chamada `Content AI Studio — chaves`. Cada chave que
você pegar nos próximos passos vai colada ali, com o nome do serviço ao lado.

---

## Passo 2 — Supabase (o banco de dados)

É onde ficam clientes, projetos, slides e imagens.

1. Acesse <https://supabase.com> → **Start your project**
2. Entre com GitHub (se não tem conta GitHub, crie primeiro — leva 2 min)
3. **New project**
   - Name: `content-ai-studio`
   - Database Password: clique em **Generate a password** e **salve no
     gerenciador** — ela não aparece de novo
   - Region: `South America (São Paulo)`
4. Espere uns 2 minutos até ficar verde
5. Vá em **Project Settings → API** e copie os três valores:

```
SUPABASE_URL=            (aparece como "Project URL")
SUPABASE_ANON_KEY=       (aparece como "anon public")
SUPABASE_SERVICE_KEY=    (aparece como "service_role" — clique em Reveal)
DATABASE_PASSWORD=       (a que você gerou no item 3)
```

> ⚠️ A `service_role` é a chave mestra do banco. Ela nunca vai para o navegador,
> nunca para o front-end, nunca para chat. Só para o painel da Vercel.

**Custo:** gratuito. O plano free pausa o banco após 7 dias sem uso — basta
entrar no painel e reativar.

---

## Passo 3 — OpenRouter (a IA que escreve os textos)

1. Acesse <https://openrouter.ai> → **Sign in** (GitHub ou Google)
2. Vá em **Credits** → adicione **US$ 5** (cartão de crédito)
3. Vá em **Keys** → **Create Key**
   - Name: `content-ai-studio`
   - Credit limit: coloque **5** — isso impede qualquer surpresa na fatura
4. Copie:

```
OPENROUTER_API_KEY=
```

**Custo:** US$ 5, uma vez. Não é assinatura. Dá para uns 300 a 500 carrosséis.

**Por que OpenRouter e não outro:** uma conta só dá acesso a dezenas de modelos,
incluindo gratuitos. Se um modelo sair do ar, o sistema troca sozinho sem você
criar conta nova.

---

## Passo 4 — Render (o servidor que gera as imagens dos slides)

O sistema monta cada slide como página e tira uma foto em alta resolução. Isso
precisa de um servidor próprio.

1. Acesse <https://render.com> → **Get Started** (entre com GitHub)
2. **Não cadastre cartão.** Se a tela pedir cartão, você está no lugar errado
3. Não crie nenhum serviço — o Claude Code faz isso
4. Vá em **Account Settings → API Keys → Create API Key** e copie:

```
RENDER_API_KEY=
```

**Custo:** gratuito.

**A pegadinha:** no plano gratuito o servidor dorme depois de 15 minutos sem uso e
leva uns 40 segundos para acordar. Isso não incomoda, porque a geração roda em
segundo plano — ninguém fica olhando a tela esperando. O primeiro carrossel do dia
demora um pouco mais e pronto.

---

## Passo 5 — Vercel (onde o sistema fica no ar)

1. Acesse <https://vercel.com> → **Sign Up** → entre com GitHub
2. Só isso. Não crie projeto, não importe nada

O projeto na Vercel nasce no primeiro deploy, que o Claude Code faz. **É por isso
que você ainda não consegue colar as chaves lá** — o campo só existe depois que o
projeto existe. Isso acontece no Passo 11.

**Custo:** gratuito.

---

## Passo 6 — Prepare a conta do Instagram (5 min, faça agora)

A publicação automática não entra no começo — o sistema entrega os PNGs e você
posta. Mas quando você quiser automatizar, a conta precisa estar preparada, e é
melhor resolver isso agora do que descobrir depois.

No app do Instagram:

1. **Configurações → Tipo de conta → Mudar para conta profissional**
2. **Configurações → Compartilhamento com outros apps → Conectar Página do
   Facebook**

Sem esses dois passos, nenhuma forma de publicação automática funciona depois.

---

## Passo 7 — Instale as ferramentas no seu computador

Três instalações. Todas gratuitas, todas com instalador normal.

### 7.1 — Node.js

1. Acesse <https://nodejs.org>
2. Baixe a versão **LTS**
3. Instale clicando Avançar até o fim

### 7.2 — Git

- **Mac:** abra o Terminal (⌘+Espaço, digite "Terminal") e rode `git --version`.
  Se pedir para instalar, aceite
- **Windows:** baixe em <https://git-scm.com> e instale com as opções padrão

### 7.3 — Claude Code

Abra o Terminal (Mac) ou o **PowerShell** (Windows) e cole:

```
npm install -g @anthropic-ai/claude-code
```

Espere terminar. Para confirmar que deu certo:

```
claude --version
```

Se aparecer um número, está pronto.

### 7.4 — Assinatura Claude

O Claude Code precisa de plano **Pro ou Max** (<https://claude.ai>). Se você já
tem, está resolvido.

---

## Passo 8 — Descompacte o pacote de handoff

1. Baixe o arquivo `design_handoff_content_ai_studio.zip` que eu te entreguei
2. Descompacte
3. Mova a pasta para um lugar fácil de achar. Sugestão:
   - Mac: `/Users/seunome/Projetos/content-ai-studio`
   - Windows: `C:\Users\seunome\Projetos\content-ai-studio`

Evite Documentos e Desktop sincronizados no iCloud ou OneDrive — a sincronização
briga com o Node e causa erro estranho.

---

## ✅ Checkpoint da Parte 1

Antes de seguir, confirme que você tem, salvos no gerenciador de senhas:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
DATABASE_PASSWORD=
OPENROUTER_API_KEY=
RENDER_API_KEY=
```

E instalados: Node.js, Git, Claude Code. E a pasta do handoff no lugar.

Faltando algum? Volte. Seguir sem isso trava no meio.

---

# PARTE 2 — CONSTRUIR

## Passo 9 — Abra o Claude Code na pasta certa

Este é o único passo que dá medo. É mais simples do que parece.

**No Mac:**

1. Abra o Terminal
2. Digite `cd ` (com espaço depois do `cd`)
3. **Arraste a pasta do handoff para a janela do Terminal** — o caminho aparece
   sozinho
4. Aperte Enter
5. Digite `claude` e Enter

**No Windows:**

1. Abra a pasta do handoff no Explorador de Arquivos
2. Clique na barra de endereço, apague o que está lá, digite `powershell` e Enter
3. Na janela que abrir, digite `claude` e Enter

Deu certo se aparecer a interface do Claude na janela.

---

## Passo 10 — O primeiro comando

Cole exatamente isto:

```
Leia o README.md desta pasta por completo. Depois abra no navegador os arquivos
marcados com ★ na seção Files. Em seguida implemente APENAS o bloco 1 da seção
"Ordem de implementação" — fundação: Next.js 15, React 19, TypeScript estrito,
Tailwind, shadcn, Supabase com migrations e RLS por org_id, auth, config e shared.
Pare ao terminar o bloco 1 e me mostre o que fez antes de continuar.
```

**Por que um bloco por vez:** se você pedir tudo de uma vez, ele constrói dez
blocos e um erro no começo contamina todos. Parando a cada bloco, você corrige
cedo e barato.

Ele vai pedir permissão para criar arquivos e rodar comandos. **Aceite.** É o
trabalho dele.

Quando pedir as chaves do Supabase, cole. Aqui é seguro — está no seu computador,
não em chat.

---

## Passo 11 — Repita bloco por bloco

Terminado o bloco 1, mande:

```
Agora o bloco 2.
```

E assim por diante, até o 10. A ordem no README é:

| Bloco | O que entrega | Como você confere |
|---|---|---|
| 1 | Fundação e banco | O site abre em `localhost:3000` |
| 2 | AI Gateway | Ele derruba um provedor e o outro assume |
| 3 | Cliente + Brand Kit | A AD Tráfego Digital aparece cadastrada |
| 4 | Os 8 layouts de slide | Textos gigantes não invadem o rodapé |
| 5 | Gerador de PNG | O PNG bate com o protótipo |
| 6 | Pipeline completo | A barra de progresso vai de 5% a 100% |
| 7 | Acervo e RAG | Sua foto aparece escolhida no slide |
| 8 | Editor | Você edita texto e imagem do slide |
| 9 | Exportação | Baixa um zip com PNGs e legenda |
| 10 | Agenda | Calendário editorial |

**Depois do bloco 5** já dá para pedir o deploy:

```
Faça o deploy na Vercel e no Render, e me diga exatamente quais variáveis de
ambiente eu preciso colar em cada painel.
```

Aí sim você entra na Vercel, vai em **Settings → Environment Variables** e cola
cada chave. É o momento que faltava do Passo 5.

**Do bloco 6 em diante você já consegue usar o sistema de verdade** enquanto os
outros blocos são construídos.

---

## Passo 12 — Quando der erro

Vai dar erro. É normal, não é culpa sua.

**O que fazer:** copie a mensagem de erro inteira, cole no Claude Code e escreva:

```
Deu este erro. Resolva.
```

Não tente entender o erro. Não tente consertar. Só passe para ele.

**Se ele ficar em círculos** (tenta a mesma coisa três vezes sem sair do lugar):

```
Pare. Explique em português simples qual é o problema e quais são as duas ou três
opções de solução, com o custo de cada uma. Não escreva código ainda.
```

**Se travar de vez:** feche a janela, abra de novo, rode `claude` e escreva
`continue de onde paramos`. Ele lê o próprio trabalho e retoma.

---

## Passo 13 — Guarde o trabalho no GitHub

Não deixe o projeto só no seu computador. Peça a ele:

```
Crie um repositório privado no GitHub para este projeto e faça o primeiro commit.
Confirme que o .env está no .gitignore antes de commitar.
```

Essa última frase é a que importa: garante que suas chaves não vão para a
internet.

---

## O que você NUNCA faz

- Colar chave de API em chat, e-mail, WhatsApp ou documento compartilhado
- Commitar o arquivo `.env`
- Colocar a chave `service_role` do Supabase em qualquer lugar que o navegador
  alcance
- Aceitar assinatura mensal sem checar se existe versão gratuita — é princípio do
  projeto

---

## Quanto custa, ao todo

| Serviço | Custo |
|---|---|
| Supabase | R$ 0 |
| OpenRouter | US$ 5, uma vez |
| Render | R$ 0 |
| Vercel | R$ 0 |
| Publicação | R$ 0 (você posta) |
| Claude Code | sua assinatura Claude |

**Fora a assinatura do Claude, o projeto custa US$ 5 uma única vez.**

---

## Como saber que terminou

O critério é um só: **você digita um tema no sistema e recebe de volta 6 a 8 PNGs
em 1080×1350 com a identidade da AD Tráfego Digital, mais legenda, hashtags e CTA
— com pelo menos uma imagem vinda do seu próprio acervo, e nenhum texto invadindo
o rodapé do slide.**

Se isso acontece, o sistema está pronto. O resto é melhoria.

---

## Quando me chamar de volta

Volte aqui quando precisar de:

- ajuste de layout, cor, tipografia ou espaçamento em qualquer tela
- novo blueprint de slide, ou variação dos oito existentes
- brand kit de um cliente novo
- tela nova que não estava previsto
- carrossel montado à mão, para você publicar sem esperar o sistema

O que **não** resolvo: erro de código, deploy, banco de dados, servidor. Isso é do
Claude Code.
