-- Cria o bucket 'logos' para armazenar logomarcas dos tenants.
-- Arquivos ficam públicos (leitura aberta) porque a URL é usada diretamente
-- na tag <img> do cardápio público sem autenticação.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  2097152,  -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Política de leitura: qualquer pessoa pode ler (cardápio público)
create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Política de escrita: apenas usuários autenticados podem fazer upload
-- A RLS do Supabase Auth garante que só o tenant logado acessa sua empresa.
create policy "logos_auth_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );

create policy "logos_auth_update"
  on storage.objects for update
  using (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );

create policy "logos_auth_delete"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );
