-- Estilos de composição ligados na geração (README, "Estilos de
-- composição"). Até aqui a camada existia só como catálogo em código
-- alimentando a barra de cobertura da tela Marca — nunca tocava o
-- pipeline, e por isso todo carrossel saía com o mesmo esqueleto.
--
-- O catálogo dos 8 estilos continua em TypeScript
-- (core/domain/template/composition-styles.catalog.ts): `slide_recipes`
-- referencia ArchetypeId e uniões de eixo que só existem em código, onde
-- um typo é erro de compilação em vez de falha de runtime dentro do
-- worker. O que varia POR PROJETO é o que entra aqui.

-- Estilo escolhido no Gerador. Sem check constraint de propósito: a
-- lista de slugs válidos vive no catálogo e é validada por Zod em
-- StartProjectSchema — duplicá-la em SQL só criaria duas fontes de
-- verdade que divergem na primeira mudança.
alter table public.projects
  add column if not exists style_id text not null default 'nevoa-suave';

-- README: o estilo 08 ("capa de campanha") é `single` — "o corpo do
-- conteúdo vive na legenda, não em slides", e o gerador precisa oferecer
-- post único e carrossel como caminhos distintos.
alter table public.projects
  add column if not exists format text not null default 'carousel'
  check (format in ('carousel', 'single'));

-- De onde veio a imagem dos slides: acervo do cliente, gerada por IA, ou
-- nenhuma. Alimenta o aviso honesto na tela quando o cliente ainda não
-- tem acervo — "nunca silenciosamente ausente".
alter table public.projects
  add column if not exists media_source text
  check (media_source in ('acervo', 'ai', 'none'));

-- Post único tem exatamente 1 slide; carrossel segue 6 a 8.
alter table public.projects drop constraint if exists projects_slide_count_check;
alter table public.projects add constraint projects_slide_count_check check (
  (format = 'single' and slide_count = 1)
  or (format = 'carousel' and slide_count between 6 and 8)
);

-- Papel editorial e variante escolhidos pelo planejador. Persistir os
-- dois é obrigatório: a geometria do slide agora depende deles, então
-- sem isso o preview do editor e o PNG do Puppeteer divergem, e regerar
-- um projeto mudaria o layout debaixo do usuário.
alter table public.slides add column if not exists role text;
alter table public.slides add column if not exists variant jsonb;
