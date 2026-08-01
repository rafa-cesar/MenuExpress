-- MenuExpress: baseline multi-tenant, authorization and secure checkout.
-- Apply after the existing schema. Review/back up production data before running.

create extension if not exists pgcrypto;

-- Every store belongs to exactly one Supabase Auth user.
alter table public.empresas
  add column if not exists user_id uuid references auth.users(id) on delete restrict;

create unique index if not exists empresas_user_id_uidx
  on public.empresas(user_id) where user_id is not null;
create unique index if not exists empresas_slug_uidx on public.empresas(slug);

-- Customer profiles are scoped to a store and an authenticated customer.
alter table public.clientes
  add column if not exists auth_id uuid references auth.users(id) on delete cascade;
create unique index if not exists clientes_empresa_auth_uidx
  on public.clientes(empresa_id, auth_id);

alter table public.pedidos
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null,
  add column if not exists forma_pagamento text;

alter table public.pedidos drop constraint if exists pedidos_forma_pagamento_check;
alter table public.pedidos
  add constraint pedidos_forma_pagamento_check
  check (forma_pagamento is null or forma_pagamento in
    ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito'));

-- Ownership helpers centralize all tenant checks.
create or replace function public.is_empresa_owner(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.empresas e
     where e.id = target_empresa_id
       and e.user_id = auth.uid()
  );
$$;

create or replace function public.is_cliente_owner(target_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.clientes c
     where c.id = target_cliente_id
       and c.auth_id = auth.uid()
  );
$$;

revoke all on function public.is_empresa_owner(uuid) from public;
revoke all on function public.is_cliente_owner(uuid) from public;
grant execute on function public.is_empresa_owner(uuid) to anon, authenticated;
grant execute on function public.is_cliente_owner(uuid) to authenticated;

-- RLS: public users only see active catalog data; owners manage only their store.
alter table public.empresas enable row level security;
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;

-- Replace every legacy policy on tenant tables. Keeping an old permissive
-- policy would OR it with the new policies and silently bypass isolation.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in ('empresas', 'categorias', 'produtos', 'clientes', 'pedidos')
  loop
    execute format('drop policy if exists %I on %I.%I',
      p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

drop policy if exists "empresas_public_read" on public.empresas;
drop policy if exists "empresas_owner_all" on public.empresas;
create policy "empresas_public_read" on public.empresas
  for select using (status = 'ativa' or user_id = auth.uid());
create policy "empresas_owner_update" on public.empresas
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "categorias_public_read" on public.categorias;
drop policy if exists "categorias_owner_all" on public.categorias;
create policy "categorias_public_read" on public.categorias
  for select using (
    (
      ativa = true
      and exists (
        select 1 from public.empresas e
         where e.id = empresa_id and e.status = 'ativa'
      )
    )
    or public.is_empresa_owner(empresa_id)
  );
create policy "categorias_owner_insert" on public.categorias
  for insert with check (public.is_empresa_owner(empresa_id));
create policy "categorias_owner_update" on public.categorias
  for update using (public.is_empresa_owner(empresa_id))
  with check (public.is_empresa_owner(empresa_id));
create policy "categorias_owner_delete" on public.categorias
  for delete using (public.is_empresa_owner(empresa_id));

drop policy if exists "produtos_public_read" on public.produtos;
drop policy if exists "produtos_owner_all" on public.produtos;
create policy "produtos_public_read" on public.produtos
  for select using (
    (
      disponivel = true
      and exists (
        select 1 from public.empresas e
         where e.id = empresa_id and e.status = 'ativa'
      )
    )
    or public.is_empresa_owner(empresa_id)
  );
create policy "produtos_owner_insert" on public.produtos
  for insert with check (public.is_empresa_owner(empresa_id));
create policy "produtos_owner_update" on public.produtos
  for update using (public.is_empresa_owner(empresa_id))
  with check (public.is_empresa_owner(empresa_id));
create policy "produtos_owner_delete" on public.produtos
  for delete using (public.is_empresa_owner(empresa_id));

drop policy if exists "clientes_self_select" on public.clientes;
drop policy if exists "clientes_self_insert" on public.clientes;
drop policy if exists "clientes_self_update" on public.clientes;
create policy "clientes_self_select" on public.clientes
  for select using (auth_id = auth.uid() or public.is_empresa_owner(empresa_id));
create policy "clientes_self_insert" on public.clientes
  for insert with check (auth_id = auth.uid());
create policy "clientes_self_update" on public.clientes
  for update using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- Remove the broad policies shipped by the MVP.
drop policy if exists "Dono lê seus pedidos" on public.pedidos;
drop policy if exists "Dono atualiza seus pedidos" on public.pedidos;
drop policy if exists "Qualquer um insere pedido" on public.pedidos;
drop policy if exists "pedidos_owner_select" on public.pedidos;
drop policy if exists "pedidos_customer_select" on public.pedidos;
drop policy if exists "pedidos_owner_update" on public.pedidos;
create policy "pedidos_owner_select" on public.pedidos
  for select using (public.is_empresa_owner(empresa_id));
create policy "pedidos_customer_select" on public.pedidos
  for select using (cliente_id is not null and public.is_cliente_owner(cliente_id));
create policy "pedidos_owner_update" on public.pedidos
  for update using (public.is_empresa_owner(empresa_id))
  with check (public.is_empresa_owner(empresa_id));

-- Direct inserts are forbidden. Checkout must use criar_pedido_seguro, which
-- reads current prices from produtos and calculates totals in PostgreSQL.
revoke insert on public.pedidos from anon, authenticated;

create or replace function public.criar_pedido_seguro(
  p_empresa_id uuid,
  p_modalidade text,
  p_forma_pagamento text,
  p_cliente_nome text,
  p_cliente_tel text,
  p_cliente_end text,
  p_cliente_id uuid,
  p_itens jsonb,
  p_observacao text default null
)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa public.empresas%rowtype;
  v_cliente public.clientes%rowtype;
  v_itens jsonb;
  v_subtotal numeric(10,2);
  v_taxa numeric(10,2) := 0;
  v_pedido public.pedidos%rowtype;
begin
  select * into v_empresa
    from public.empresas
   where id = p_empresa_id and status = 'ativa';
  if not found then raise exception 'Empresa inválida ou inativa'; end if;

  if p_modalidade not in ('retirada', 'entrega') then
    raise exception 'Modalidade inválida';
  end if;
  if p_forma_pagamento not in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito') then
    raise exception 'Forma de pagamento inválida';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0
     or jsonb_array_length(p_itens) > 50 then
    raise exception 'Carrinho inválido';
  end if;

  if p_cliente_id is not null then
    select * into v_cliente from public.clientes where id = p_cliente_id;
    if not found
       or v_cliente.empresa_id <> p_empresa_id
       or v_cliente.auth_id is distinct from auth.uid() then
      raise exception 'Cliente inválido';
    end if;
  end if;

  with requested as (
    select
      (item->>'produtoId')::uuid as produto_id,
      greatest(1, least(99, (item->>'quantidade')::integer)) as quantidade
    from jsonb_array_elements(p_itens) item
  ),
  normalized as (
    select produto_id, sum(quantidade)::integer as quantidade
      from requested group by produto_id
  ),
  priced as (
    select p.id, p.nome, n.quantidade, p.preco::numeric(10,2) as preco
      from normalized n
      join public.produtos p on p.id = n.produto_id
     where p.empresa_id = p_empresa_id and p.disponivel = true
  )
  select
    jsonb_agg(jsonb_build_object(
      'produtoId', id,
      'nome', nome,
      'quantidade', quantidade,
      'precoUnitario', preco,
      'subtotal', round(preco * quantidade, 2)
    )),
    round(sum(preco * quantidade), 2)
  into v_itens, v_subtotal
  from priced;

  if v_itens is null
     or jsonb_array_length(v_itens) <>
        (select count(distinct (item->>'produtoId')::uuid)
           from jsonb_array_elements(p_itens) item) then
    raise exception 'Um ou mais produtos são inválidos ou indisponíveis';
  end if;

  if p_modalidade = 'entrega' then
    if coalesce((v_empresa.entrega->>'entregaAtiva')::boolean, false) is false then
      raise exception 'Entrega indisponível';
    end if;
    if nullif(trim(p_cliente_end), '') is null then
      raise exception 'Endereço obrigatório';
    end if;
    v_taxa := coalesce((v_empresa.entrega->>'taxaEntregaFixa')::numeric, 0);
    if v_subtotal < coalesce((v_empresa.entrega->>'pedidoMinimoEntrega')::numeric, 0) then
      raise exception 'Pedido abaixo do mínimo para entrega';
    end if;
  end if;

  insert into public.pedidos (
    empresa_id, cliente_id, status, modalidade, forma_pagamento,
    cliente_nome, cliente_tel, cliente_end, itens, observacao,
    subtotal, taxa_entrega, total
  ) values (
    p_empresa_id, p_cliente_id, 'aguardando', p_modalidade, p_forma_pagamento,
    left(nullif(trim(p_cliente_nome), ''), 120),
    left(nullif(trim(p_cliente_tel), ''), 30),
    left(nullif(trim(p_cliente_end), ''), 300),
    v_itens, left(nullif(trim(p_observacao), ''), 1000),
    v_subtotal, v_taxa, v_subtotal + v_taxa
  )
  returning * into v_pedido;

  return v_pedido;
end;
$$;

revoke all on function public.criar_pedido_seguro(
  uuid, text, text, text, text, text, uuid, jsonb, text
) from public;
grant execute on function public.criar_pedido_seguro(
  uuid, text, text, text, text, text, uuid, jsonb, text
) to authenticated;

-- Logos live under {empresa_id}/file.ext. Only that store owner may mutate.
drop policy if exists "logos_auth_insert" on storage.objects;
drop policy if exists "logos_auth_update" on storage.objects;
drop policy if exists "logos_auth_delete" on storage.objects;
create policy "logos_owner_insert" on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and public.is_empresa_owner(((storage.foldername(name))[1])::uuid)
  );
create policy "logos_owner_update" on storage.objects for update
  using (
    bucket_id = 'logos'
    and public.is_empresa_owner(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'logos'
    and public.is_empresa_owner(((storage.foldername(name))[1])::uuid)
  );
create policy "logos_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'logos'
    and public.is_empresa_owner(((storage.foldername(name))[1])::uuid)
  );
