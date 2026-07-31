-- Bloco 10: Agenda (README, "Ordem de implementação" > "10 · Agenda":
-- "calendário editorial"). `caption`/`hashtags`/`cta` já vivem em
-- `projects` desde o bloco 6 (README's `captions`/`hashtags` tables
-- normalizadas não fazem sentido enquanto um projeto só publica uma
-- legenda fixa) — só o agendamento em si é conceito novo.
--
-- Sem `publications` (README): isso rastrearia o resultado de uma
-- publicação automática de verdade (Postiz/Instagram), que o MVP não
-- tem — só o canal `export` (bloco 9) existe. `posts.status` já cobre o
-- que o MVP precisa: agendado → publicado (marcado à mão) ou falhou.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  project_id uuid not null unique references public.projects (id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'published', 'failed')),
  -- README: "channel_targets" — no MVP só 'export' existe (bloco 9);
  -- fica como array pra quando Postiz/Instagram entrarem sem migration nova.
  channel_targets text[] not null default '{export}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_org_id_scheduled_at_idx on public.posts (org_id, scheduled_at);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

create policy "select own org posts" on public.posts
  for select using (org_id = public.current_org_id());
create policy "insert own org posts" on public.posts
  for insert with check (org_id = public.current_org_id());
create policy "update own org posts" on public.posts
  for update using (org_id = public.current_org_id());
create policy "delete own org posts" on public.posts
  for delete using (org_id = public.current_org_id());
