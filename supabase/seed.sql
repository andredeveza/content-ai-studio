-- Seed local (supabase/config.toml: db.seed.sql_paths). Carrega o
-- cliente-piloto AD Tráfego Digital com o Brand Kit real do README
-- (seção "Brand Kit — cliente-piloto"), para satisfazer o bloco 3 sem
-- depender de um usuário logado ainda. `persona`, `tone`, `goals`,
-- `specialties` e `site` do cliente, e `imageStyle`/`cta` do brand kit,
-- não vieram especificados no handoff — ficam como placeholder até o
-- cliente real fornecer os valores.

insert into public.orgs (id, name)
values ('00000000-0000-0000-0000-000000000001', 'AD Tráfego Digital')
on conflict (id) do nothing;

insert into public.clients (id, org_id, name, handles, persona, tone, goals, specialties, site)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'AD Tráfego Digital',
  array['@trafegodigitalad'],
  null,
  '{}',
  '{}',
  '{}',
  null
)
on conflict (id) do nothing;

insert into public.brandkits (
  client_id, palette, gradient, fonts, logo_radius, chrome, rules, image_style, cta, style
)
values (
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object(
    'ink', '#06070A',
    'graphite', '#101319',
    'slate', '#1B212B',
    'gray', '#8B94A3',
    'title', '#EEF1F6',
    'brand', '#0A47A8',
    'primary', '#1C7ED6',
    'accent', '#57A8FF',
    'loud', '#1C4FE0',
    'bgLight', '#FFFFFF',
    'panelLight', '#F4F6FA',
    'titleLight', '#0A0C10',
    'textLight', '#5A6474'
  ),
  'linear-gradient(135deg, #0A47A8, #1C7ED6 55%, #57A8FF)',
  jsonb_build_object(
    'display', jsonb_build_object('family', 'Satoshi', 'weights', array[700, 900]),
    'body', jsonb_build_object('family', 'General Sans', 'weights', array[400, 500]),
    'mono', jsonb_build_object('family', 'JetBrains Mono', 'weights', array[400, 500]),
    'editorial', jsonb_build_object('family', 'Instrument Serif', 'weights', array[400])
  ),
  0,
  jsonb_build_object(
    'top', array['@trafegodigitalad', 'AD TRÁFEGO DIGITAL', '©2026'],
    'footer', '✦ ARRASTE PARA O LADO →',
    'footerLast', 'SALVE ESTE POST'
  ),
  jsonb_build_object(
    'neonMaxArea', 'detail',
    'alternateModes', true,
    'blurTextForbidden', true
  ),
  null,
  'Fale com a gente',
  null
)
on conflict (client_id) do nothing;
