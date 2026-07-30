# Content AI Studio — como colocar no ar

Guia para quem **não é programador**. Você vai criar contas, copiar algumas
senhas e colar num arquivo. Nada de escrever código.

Tempo: **1h a 1h30** de trabalho seu. Depois disso o desenvolvedor assume.

> **Se você quer só começar a usar hoje**, faça os passos 0, 1, 2, 6 e 7.
> Isso já entrega tema → carrossel em PNG com legenda pronta. Uns 40 minutos.
> Os passos 3, 4 e 5 são para quando houver volume.

---

## Antes de começar

Tenha aberto:

- Seu e-mail (para confirmar as contas)
- Um **arquivo de texto vazio** no computador para ir colando as senhas
- Cartão de crédito — só para os US$ 5 de crédito do passo 2. Nenhum outro
serviço pede cartão.

> **Regra de ouro:** as chaves que você vai copiar são senhas.
> Não mande por WhatsApp, não cole em chat, não poste em nenhum lugar.
> Guarde só nesse arquivo de texto e entregue ao desenvolvedor por um meio seguro
> (gerenciador de senhas ou pessoalmente).

---

## Passo 0 — Revogar a chave que foi exposta

Uma chave do Kimi foi colada no chat durante o projeto. Ela precisa morrer.

1. Entre em <https://platform.moonshot.ai>
2. Vá em **API Keys**
3. Encontre a chave que começa com `sk-IZJC...` e clique em **Delete / Revoke**

Pronto. Ela não serve mais para ninguém.

---

## Passo 1 — Supabase (banco de dados)

É onde ficam os clientes, os textos e as imagens do sistema.

1. Acesse <https://supabase.com> e clique em **Start your project**
2. Entre com Google ou GitHub
3. Clique em **New project**
   - **Name:** `content-ai-studio`
   - **Database Password:** clique em **Generate a password** e **copie**
   - **Region:** `South America (São Paulo)`
4. Clique em **Create new project** e espere ~2 minutos
5. No menu lateral: **Project Settings → API**
6. Copie os três valores abaixo para o seu arquivo de texto:

```
SUPABASE_URL=            (campo "Project URL")
SUPABASE_ANON_KEY=       (campo "anon public")
SUPABASE_SERVICE_KEY=    (campo "service_role" — clique em Reveal)
DATABASE_PASSWORD=       (a senha gerada no passo 3)
```

**Custo:** gratuito. Só passa a custar acima de 500 MB de dados — muito além do início.

---

## Passo 2 — OpenRouter (o texto dos carrosséis)

É quem escreve os títulos, os slides e a legenda.

1. Acesse <https://openrouter.ai> e clique em **Sign in**
2. Vá em **Keys** → **Create Key**
   - **Name:** `content-ai-studio`
3. Copie a chave (começa com `sk-or-v1-...`) para o arquivo:

```
OPENROUTER_API_KEY=
```

4. Vá em **Credits** e coloque **US$ 5**

**Por quê pagar aqui:** essa é a única despesa realmente necessária.
US$ 5 dão para algumas centenas de carrosséis. O sistema tenta primeiro os
modelos gratuitos e só usa crédito quando eles estão fora do ar.

---

## Passo 3 — Hugging Face (as imagens)

1. Acesse <https://huggingface.co/join> e crie a conta
2. Confirme o e-mail
3. Vá em **Settings → Access Tokens** → **New token**
   - **Name:** `content-ai-studio`
   - **Type:** `Read`
4. Copie para o arquivo:

```
HUGGINGFACE_API_KEY=
```

**Custo:** gratuito. A fila é lenta em horário de pico; se incomodar,
trocamos por um serviço pago depois — sem mexer no resto do sistema.

---

## Passo 4 — Trigger.dev (a fila de trabalho)

É o que faz a barra de progresso andar e permite retomar de onde parou.

1. Acesse <https://trigger.dev> → **Get started free**
2. Entre com GitHub
3. Crie uma organização: `AD Comunicação`
4. Crie um projeto: `content-ai-studio`
5. Em **API Keys**, copie a chave de **DEV** e a de **PROD**:

```
TRIGGER_SECRET_KEY_DEV=
TRIGGER_SECRET_KEY_PROD=
```

**Custo:** gratuito até 10 mil execuções por mês.

---

## Passo 5 — Publicação: NÃO FAÇA NADA AGORA

O Postiz hospedado só é gratuito por 7 dias, então saiu do plano. A publicação
automática também é a única parte do sistema que depende de aprovação de
terceiro — é onde um projeto trava por semanas sem necessidade.

A decisão: **começar sem publicação automática.** O sistema entrega os PNGs e a
legenda prontos; você posta pelo Instagram normalmente. Leva 30 segundos por
post e não custa nada. Nada a cadastrar neste passo.

Quando o volume justificar, existem três caminhos — todos gratuitos:

**Opção A — Postiz auto-hospedado (recomendado depois)**
O Postiz é open-source (licença AGPL). O que custa é a versão hospedada por
eles; rodando no seu próprio servidor é gratuito e sem limite de tempo. Sobe
via Docker no mesmo Render do passo 6, custo próximo de zero. Vantagem: já é
multicanal (Instagram, LinkedIn, Facebook, TikTok, Threads).

**Opção B — Mixpost auto-hospedado**
Mesma ideia, alternativa madura. Também open-source, também Docker.

**Opção C — API do Instagram direto**
Gratuita para sempre e sem intermediário, mas exige conta Profissional ligada a
uma Página do Facebook, criar um app na Meta e passar por revisão da Meta para a
permissão de publicação — de uma a três semanas de espera. Vale quando o
Instagram for o único canal e você quiser zero dependência.

O sistema já é construído com uma camada `Publishing Gateway`, então trocar
entre exportar, Postiz, Mixpost ou API direta é configuração — não é reescrita.

### O que você PODE adiantar agora, de graça

Independente da opção escolhida depois, a conta do Instagram precisa estar
preparada. Faça isso hoje, leva 5 minutos:

1. No app do Instagram: **Configurações → Tipo de conta → Mudar para conta profissional**
2. Depois: **Configurações → Compartilhamento com outros apps → Conectar Página do Facebook**

Sem esses dois passos, nenhuma das três opções funciona.

---

## Passo 6 — Render (gerador de imagem dos slides)

O sistema monta o slide como página e tira uma "foto" dele em alta resolução.
Isso precisa de um servidor próprio — a Vercel do passo 7 não dá conta.

1. Acesse <https://render.com> → **Get Started** (entre com GitHub)
2. **Não precisa cadastrar cartão.** Se a tela pedir, você está no lugar errado
3. Não crie nada além da conta — o desenvolvedor sobe o serviço
4. Em **Account Settings → API Keys → Create API Key**, copie:

```
RENDER_API_KEY=
```

**Custo:** gratuito.

**A pegadinha do plano gratuito:** o serviço "dorme" após 15 minutos sem uso e
leva ~40 segundos para acordar. No nosso caso não importa — a renderização roda
em fila, em segundo plano, ninguém fica esperando na tela. O primeiro carrossel
do dia demora um pouco mais e pronto.

**Se um dia não der conta:** o plano gratuito tem 512 MB de memória, apertado
para o Chromium. Se falhar com volume alto, as saídas são o plano de US$ 7/mês
no próprio Render ou migrar para o Google Cloud Run (gratuito por uso, mas exige
cartão e mais configuração). O desenvolvedor troca sem mexer no resto.

> Descartados: Railway não tem mais free tier — o crédito de US$ 1/mês cobre
> poucas horas de execução. Fly.io exige cartão e encerrou o free tier para
> novos usuários.

---

## Passo 7 — Vercel (onde o site fica)

1. Acesse <https://vercel.com> → **Sign up** com GitHub
2. Pare aqui. O desenvolvedor publica o projeto.

**Custo:** gratuito para uso interno da agência.

---

## Passo 8 — Entregar as chaves

Seu arquivo de texto deve estar assim (com os valores preenchidos):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
DATABASE_PASSWORD=
OPENROUTER_API_KEY=
HUGGINGFACE_API_KEY=
TRIGGER_SECRET_KEY_DEV=
TRIGGER_SECRET_KEY_PROD=
RENDER_API_KEY=
```

(Não há chave de publicação — esse passo entra depois.)

Entregue por gerenciador de senhas (1Password, Bitwarden) ou pessoalmente.
**Nunca por e-mail, WhatsApp ou chat.**

---

## Passo 9 — Material do primeiro cliente

O sistema só produz bem se souber com o que está trabalhando. Junte, para o
primeiro cliente que vai usar:

- **Logo** em PNG com fundo transparente (e em SVG, se existir)
- **Cores da marca** — os códigos, tipo `#E63946`. Se não souber, mande o
  manual de marca ou um post antigo que a gente extrai
- **Fontes** — os arquivos ou o nome delas
- **@ do Instagram** e **site**
- **CTA padrão** — a frase de fechamento (ex.: "Agende sua visita")
- **Tom de voz** em uma linha (ex.: "técnico e direto, sem gíria")
- **10 a 20 fotos boas** do cliente, do produto ou do ambiente

> As fotos são o que mais muda a percepção de qualidade. A IA cobre o genérico;
> produto e pessoa reais, não.

---

## O que acontece depois

| Semana | O que fica pronto |
|--------|-------------------|
| 1 | Login funcionando, banco no ar |
| 2 | Camada de IA com troca automática de provedor |
| 3 | Cadastro de cliente e Brand Kit |
| 4–5 | Geração completa: tema → carrossel em PNG |
| 6 | Editor de slides e exportação dos PNGs + legenda |

Você recebe um link para testar **no fim de cada semana** — não precisa esperar
o fim para dar opinião.

---

## Resumo de custos

| Serviço | Mensal |
|---------|--------|
| Supabase | R$ 0 |
| Trigger.dev | R$ 0 |
| Hugging Face | R$ 0 |
| Vercel | R$ 0 |
| Publicação | R$ 0 (exportar e postar à mão) |
| Render | R$ 0 (dorme quando ocioso) |
| OpenRouter | ~US$ 5 (crédito, não assinatura) |

**Total para começar: US$ 5 únicos de crédito de IA. Nenhuma assinatura mensal.**

---

## Se travar em algum passo

Manda print da tela onde parou. Não tente adivinhar configuração —
errar em "tipo de conta do Instagram" custa semana de retrabalho depois.
