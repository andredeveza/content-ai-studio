-- Bloco 2: AI Gateway. Cada tentativa de chamada a um provedor de IA vira
-- uma linha aqui — sucesso ou falha — para dar suporte a fallback,
-- circuit breaker e rate limit por orçamento mensal (README, seções
-- "AI Gateway" e "Segurança").

create table public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  provider text not null,
  model text,
  task text not null check (task in ('text', 'image', 'vision', 'embed')),
  status text not null check (status in ('success', 'error')),
  tokens_input integer,
  tokens_output integer,
  cost_usd numeric(10, 6) not null default 0,
  latency_ms integer not null,
  fallback_from text,
  error text,
  created_at timestamptz not null default now()
);

create index ai_logs_org_id_created_at_idx on public.ai_logs (org_id, created_at);
create index ai_logs_user_id_created_at_idx on public.ai_logs (user_id, created_at);
create index ai_logs_provider_created_at_idx on public.ai_logs (provider, created_at);

alter table public.ai_logs enable row level security;

create policy "select own org ai_logs" on public.ai_logs
  for select
  using (org_id = public.current_org_id());

-- Gravação é feita pelo servidor com a service_role key (AILogger), que
-- ignora RLS por design — não existe policy de insert para o role
-- authenticated de propósito.
