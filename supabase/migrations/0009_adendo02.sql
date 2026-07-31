-- ADENDO-02-CORRECOES-URGENTES.md:
-- 1) Formato do Gerador tinha só 2 opções (4:5, 1:1) em vez dos 3 do
--    README (4:5, 1:1, 9:16 Story) — o check constraint precisa aceitar
--    o novo valor antes do domínio/DTO poderem gravá-lo.
-- 2) Importador de site (ADENDO-01, "Importar acervo a partir do site
--    do cliente"): README pede `assets.source_url` e
--    `assets.imported_by` para sustentar a autorização depois — não
--    existiam ainda porque nenhum importador tinha sido escrito.

alter table public.projects drop constraint projects_ratio_check;
alter table public.projects add constraint projects_ratio_check
  check (ratio in ('4:5', '1:1', '9:16'));

alter table public.assets add column source_url text;
alter table public.assets add column imported_by uuid references public.users (id) on delete set null;
