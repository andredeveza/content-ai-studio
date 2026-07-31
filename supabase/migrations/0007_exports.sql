-- Bloco 9: Exportação (README, "Publicação": "No MVP só o canal
-- export": zip com os PNGs + legenda.txt"). Sem tabela nova — o zip é
-- derivado sob demanda de `projects`/`slides`/`media` e sobrescrito no
-- mesmo caminho a cada exportação (upsert), então não precisa de
-- bookkeeping próprio.
--
-- Bucket público: mesmo raciocínio de brand-logos/media/assets — o zip
-- só embrulha PNGs que já são públicos individualmente, não é dado
-- sensível.
insert into storage.buckets (id, name, public)
values ('exports', 'exports', true)
on conflict (id) do nothing;

create policy "public read exports" on storage.objects
  for select
  using (bucket_id = 'exports');
