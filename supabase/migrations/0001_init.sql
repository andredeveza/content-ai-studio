-- Bloco 1: fundação multi-tenant. orgs + users, RLS por org_id, e o
-- trigger que cria org + linha em public.users no primeiro signup.
-- Demais tabelas do modelo de dados (clients, brandkits, projects, ...)
-- entram nas migrations dos blocos que as usam.

create extension if not exists "pgcrypto";

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now()
);

create index users_org_id_idx on public.users (org_id);

alter table public.orgs enable row level security;
alter table public.users enable row level security;

-- org_id do usuário autenticado, via subquery em public.users (não
-- depende de custom JWT claim, evita configuração extra no MVP).
create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.users where id = auth.uid();
$$;

create policy "select own org" on public.orgs
  for select
  using (id = public.current_org_id());

create policy "select users in own org" on public.users
  for select
  using (org_id = public.current_org_id());

create policy "update own user row" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Um usuário novo ganha uma org própria no cadastro. Convite para orgs
-- existentes é um caso futuro (fora do bloco 1).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into public.orgs (name)
  values (coalesce(new.raw_user_meta_data ->> 'org_name', split_part(new.email, '@', 1)))
  returning id into new_org_id;

  insert into public.users (id, org_id, email, role)
  values (new.id, new_org_id, new.email, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
