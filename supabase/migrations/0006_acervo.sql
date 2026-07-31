-- Bloco 7: Acervo + RAG (README, "Acervo / RAG"). Fluxo: ingestão →
-- extração → indexação → recuperação. `org_id` direto em `assets` (não
-- só via join com `clients`), mesmo raciocínio de `media`/`projects`/`jobs`.
--
-- Dimensão do vetor (384): nenhum provedor de embedding está ligado de
-- verdade ainda (Hugging Face é feature-flag desligada por padrão — só
-- OpenRouter é obrigatório no MVP). 384 é a dimensão de um modelo
-- sentence-transformers comum e gratuito (ex.: all-MiniLM-L6-v2);
-- ajuste esta migration quando o modelo real for escolhido no bloco de
-- ligar Hugging Face de verdade.
create extension if not exists vector;

-- Sem check constraint em `kind`/`status`: a extração ganha campos novos
-- por tipo (imagem/pdf/fonte) sem exigir migration nova a cada ajuste,
-- mesmo raciocínio de `media.kind` em 0004_media.sql.
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  path text not null,
  mime text not null,
  kind text not null check (kind in ('image', 'pdf', 'font')),
  status text not null default 'pending' check (status in ('pending', 'analyzed', 'failed')),
  -- imagem: dimensão real + extração (README, "Extração" > imagem)
  width integer,
  height integer,
  dominant_color text,
  luminance_top real,
  luminance_mid real,
  luminance_bottom real,
  -- imagem: tokens do nome do arquivo (topicFit-fallback); pdf: termos
  -- por frequência (README, "Extração" > PDF)
  terms text[] not null default '{}',
  -- pdf: trechos entre 40 e 320 caracteres
  excerpts text[] not null default '{}',
  -- fonte: nome de família derivado do arquivo
  family text,
  error text,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_org_id_idx on public.assets (org_id);
create index assets_client_id_kind_status_idx on public.assets (client_id, kind, status);

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

alter table public.assets enable row level security;

create policy "select own org assets" on public.assets
  for select using (org_id = public.current_org_id());
create policy "insert own org assets" on public.assets
  for insert with check (org_id = public.current_org_id());
create policy "update own org assets" on public.assets
  for update using (org_id = public.current_org_id());
create policy "delete own org assets" on public.assets
  for delete using (org_id = public.current_org_id());

-- Indexação (README, "Extração" > passo 3): embedding visual (CLIP) ou
-- semântico (trechos de PDF) por asset. Populado só quando um provedor
-- de embedding real estiver ligado — até lá a tabela existe e fica
-- vazia, RetrieveAssetsService cai no fallback por termos.
create table public.asset_embeddings (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  kind text not null check (kind in ('visual', 'semantic')),
  embedding vector(384) not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index asset_embeddings_asset_id_idx on public.asset_embeddings (asset_id);
create index asset_embeddings_embedding_idx on public.asset_embeddings using hnsw (embedding vector_cosine_ops);

alter table public.asset_embeddings enable row level security;

create policy "select own org asset_embeddings" on public.asset_embeddings
  for select using (exists (
    select 1 from public.assets a
    where a.id = asset_embeddings.asset_id and a.org_id = public.current_org_id()
  ));

-- Busca por similaridade (cosseno) escopada por cliente — usada quando
-- a indexação semântica/visual estiver populada.
create or replace function public.match_asset_embeddings(
  p_client_id uuid,
  p_kind text,
  p_query vector(384),
  p_match_count int default 5
)
returns table (asset_id uuid, similarity float)
language sql
stable
as $$
  select e.asset_id, 1 - (e.embedding <=> p_query) as similarity
  from public.asset_embeddings e
  join public.assets a on a.id = e.asset_id
  where a.client_id = p_client_id and e.kind = p_kind
  order by e.embedding <=> p_query
  limit p_match_count;
$$;

-- Escrita (assets e asset_embeddings) é feita pelos use-cases de
-- ingestão/análise com service_role — sem policy de insert/update para
-- o role authenticated de propósito, mesmo raciocínio de media/jobs.

-- Bucket público: mesmo raciocínio de brand-logos/media — o acervo do
-- cliente vira fundo de slide publicado, não é dado sensível.
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

create policy "public read assets" on storage.objects
  for select
  using (bucket_id = 'assets');
