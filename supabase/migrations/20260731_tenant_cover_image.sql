-- Cada tenant escolhe a própria imagem principal do cardápio.
alter table public.empresas
  add column if not exists capa_url text;

comment on column public.empresas.capa_url is
  'Imagem de capa do cardápio público, configurada pelo proprietário do tenant.';
