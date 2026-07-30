-- Bloco 6: Pipeline de geração — 7 steps em fila, checkpoint, retomada,
-- progresso por Realtime (README, "Pipeline de geração"). `org_id` é
-- coluna direta em `projects` e `jobs` (não só via join com `clients`)
-- de propósito: o PipelineWorker roda com service_role e precisa
-- escopar consultas sem depender de RLS — mesma razão de `media` e
-- `ai_logs` terem `org_id` direto.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  theme text not null,
  -- opções do rádio "objetivo" no Gerador (design/Content AI Studio -
  -- Protótipo AD Mobile.dc.html): educar, autoridade, converter, mito.
  goal text not null check (goal in ('educar', 'autoridade', 'converter', 'mito')),
  status text not null default 'draft' check (status in ('draft', 'running', 'completed', 'failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  slide_count integer not null check (slide_count between 6 and 8),
  ratio text not null default '4:5' check (ratio in ('4:5', '1:1')),
  caption text,
  hashtags text[] not null default '{}',
  cta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_org_id_idx on public.projects (org_id);
create index projects_client_id_idx on public.projects (client_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "select own org projects" on public.projects
  for select using (org_id = public.current_org_id());
create policy "insert own org projects" on public.projects
  for insert with check (org_id = public.current_org_id());
create policy "update own org projects" on public.projects
  for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "delete own org projects" on public.projects
  for delete using (org_id = public.current_org_id());

create table public.slides (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  index integer not null check (index >= 0),
  archetype_id text not null,
  content jsonb not null default '{"texts":{}}',
  media_id uuid references public.media (id) on delete set null,
  overrides jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, index)
);

create index slides_project_id_idx on public.slides (project_id);

create trigger slides_set_updated_at
  before update on public.slides
  for each row execute function public.set_updated_at();

alter table public.slides enable row level security;

create policy "select own org slides" on public.slides
  for select using (exists (
    select 1 from public.projects p
    where p.id = slides.project_id and p.org_id = public.current_org_id()
  ));
create policy "insert own org slides" on public.slides
  for insert with check (exists (
    select 1 from public.projects p
    where p.id = slides.project_id and p.org_id = public.current_org_id()
  ));
create policy "update own org slides" on public.slides
  for update using (exists (
    select 1 from public.projects p
    where p.id = slides.project_id and p.org_id = public.current_org_id()
  ));
create policy "delete own org slides" on public.slides
  for delete using (exists (
    select 1 from public.projects p
    where p.id = slides.project_id and p.org_id = public.current_org_id()
  ));

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  step text not null check (step in ('research', 'copy', 'prompt', 'image', 'render', 'publish', 'completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  attempts integer not null default 0,
  payload jsonb not null default '{}',
  state text not null default 'pending' check (state in ('pending', 'running', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_org_id_idx on public.jobs (org_id);
create index jobs_project_id_created_at_idx on public.jobs (project_id, created_at);

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;

create policy "select own org jobs" on public.jobs
  for select using (org_id = public.current_org_id());

-- Escrita é feita pelo PipelineWorker com service_role (mesmo raciocínio
-- de ai_logs/media) — sem policy de insert/update para o role
-- authenticated de propósito.

-- Progresso por Realtime (README): o cliente assina mudanças em `jobs`
-- direto — sem isso, updates na tabela não chegam ao browser mesmo com
-- `[realtime] enabled = true` no config.toml.
alter publication supabase_realtime add table public.jobs;
