-- Mantém o catálogo compatível com o perfil social configurável da empresa.
alter table public.empresas
  add column if not exists instagram text;
