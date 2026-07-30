-- Bloco 5: Render. Cada PNG de slide (e, mais adiante, cada imagem gerada
-- por IA) vira uma linha aqui. `slides.media_id` (bloco 6) referencia
-- esta tabela — como `slides`/`projects` ainda não existem, `media` é
-- escopada direto por `org_id` por enquanto.
--
-- `kind` não tem check constraint: novos valores chegam a cada bloco que
-- gera mídia (7: imagem de IA; import de site: logo/foto) e travar a
-- lista aqui obrigaria uma migration por bloco. `prompt_id` fica sem FK —
-- `prompt_history` só existe quando um bloco futuro a criar.

create table public.media (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  path text not null,
  kind text not null,
  width integer not null,
  height integer not null,
  provider text,
  prompt_id uuid,
  created_at timestamptz not null default now()
);

create index media_org_id_created_at_idx on public.media (org_id, created_at);

alter table public.media enable row level security;

create policy "select own org media" on public.media
  for select
  using (org_id = public.current_org_id());

-- Escrita é feita pelo RenderSlideUseCase com service_role (mesmo
-- raciocínio de ai_logs em 0002_ai_logs.sql) — sem policy de insert para
-- o role authenticated de propósito.

-- Bucket público: o PNG renderizado é o próprio conteúdo publicado no
-- Instagram do cliente, não é dado sensível (mesmo raciocínio do bucket
-- brand-logos em 0003_clients_brandkits.sql).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects
  for select
  using (bucket_id = 'media');
