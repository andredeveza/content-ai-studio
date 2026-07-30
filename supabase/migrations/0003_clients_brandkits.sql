-- Bloco 3: Cliente + Brand Kit (README, seções "Modelo de dados" e "Ordem
-- de implementação"). Um cliente tem no máximo um brand kit no MVP —
-- `variants` por cliente é um caso futuro, fora deste bloco.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  handles text[] not null default '{}',
  persona text,
  tone text[] not null default '{}',
  goals text[] not null default '{}',
  specialties text[] not null default '{}',
  site text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_org_id_idx on public.clients (org_id);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy "select own org clients" on public.clients
  for select
  using (org_id = public.current_org_id());

create policy "insert own org clients" on public.clients
  for insert
  with check (org_id = public.current_org_id());

create policy "update own org clients" on public.clients
  for update
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "delete own org clients" on public.clients
  for delete
  using (org_id = public.current_org_id());

-- Um brand kit por cliente (unique em client_id). `logo_path` guarda o
-- caminho no bucket de storage `brand-logos` — vira `logo_id` apontando
-- para `media` quando a tabela de mídia entrar (bloco 5/7); até lá, o
-- caminho de storage direto é suficiente e não antecipa schema alheio.
create table public.brandkits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients (id) on delete cascade,
  palette jsonb not null,
  gradient text not null,
  fonts jsonb not null,
  logo_path text,
  logo_radius integer not null default 0,
  chrome jsonb not null,
  rules jsonb not null,
  image_style text,
  cta text not null,
  style text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brandkits_set_updated_at
  before update on public.brandkits
  for each row execute function public.set_updated_at();

alter table public.brandkits enable row level security;

create policy "select own org brandkits" on public.brandkits
  for select
  using (exists (
    select 1 from public.clients c
    where c.id = brandkits.client_id and c.org_id = public.current_org_id()
  ));

create policy "insert own org brandkits" on public.brandkits
  for insert
  with check (exists (
    select 1 from public.clients c
    where c.id = brandkits.client_id and c.org_id = public.current_org_id()
  ));

create policy "update own org brandkits" on public.brandkits
  for update
  using (exists (
    select 1 from public.clients c
    where c.id = brandkits.client_id and c.org_id = public.current_org_id()
  ))
  with check (exists (
    select 1 from public.clients c
    where c.id = brandkits.client_id and c.org_id = public.current_org_id()
  ));

create policy "delete own org brandkits" on public.brandkits
  for delete
  using (exists (
    select 1 from public.clients c
    where c.id = brandkits.client_id and c.org_id = public.current_org_id()
  ));

-- Bucket público: logo é ativo de marca que já aparece nos PNGs
-- publicados, não é dado sensível. Upload só acontece via service_role
-- (UploadBrandLogo roda no servidor), então nenhuma policy de insert é
-- necessária para o role authenticated — mesmo raciocínio de ai_logs
-- em 0002_ai_logs.sql.
insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true)
on conflict (id) do nothing;

create policy "public read brand-logos" on storage.objects
  for select
  using (bucket_id = 'brand-logos');
