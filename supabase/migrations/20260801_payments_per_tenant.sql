-- MenuExpress Essencial: cada restaurante conecta e recebe em sua própria conta.
-- Tokens nunca são expostos ao navegador; somente Edge Functions com service role
-- podem acessar public.integracoes_pagamento.

alter table public.pedidos
  add column if not exists status_pagamento text not null default 'nao_aplicavel',
  add column if not exists provedor_pagamento text,
  add column if not exists pagamento_externo_id text,
  add column if not exists pagamento_url text,
  add column if not exists pago_em timestamptz;

alter table public.pedidos drop constraint if exists pedidos_status_pagamento_check;
alter table public.pedidos add constraint pedidos_status_pagamento_check
  check (status_pagamento in (
    'nao_aplicavel', 'aguardando', 'pago', 'falhou', 'cancelado', 'estornado'
  ));

alter table public.pedidos drop constraint if exists pedidos_forma_pagamento_check;
alter table public.pedidos add constraint pedidos_forma_pagamento_check
  check (forma_pagamento is null or forma_pagamento in (
    'online', 'dinheiro', 'pix', 'cartao_credito', 'cartao_debito'
  ));

create index if not exists pedidos_pagamento_externo_idx
  on public.pedidos (provedor_pagamento, pagamento_externo_id)
  where pagamento_externo_id is not null;

create table if not exists public.integracoes_pagamento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas(id) on delete cascade,
  provedor text not null check (provedor in ('mercado_pago')),
  conta_externa_id text not null,
  token_acesso text not null,
  token_atualizacao text,
  token_expira_em timestamptz,
  ativo boolean not null default true,
  conectado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.integracoes_pagamento enable row level security;
revoke all on public.integracoes_pagamento from anon, authenticated;

create table if not exists public.estados_oauth_pagamento (
  estado text primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '10 minutes')
);

alter table public.estados_oauth_pagamento enable row level security;
revoke all on public.estados_oauth_pagamento from anon, authenticated;

-- Retorna ao dono somente metadados seguros, nunca os tokens OAuth.
create or replace function public.status_integracao_pagamento()
returns table (
  provedor text,
  conta_externa_id text,
  ativo boolean,
  conectado_em timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.provedor, i.conta_externa_id, i.ativo, i.conectado_em
    from public.integracoes_pagamento i
    join public.empresas e on e.id = i.empresa_id
   where e.user_id = auth.uid();
$$;

revoke all on function public.status_integracao_pagamento() from public;
grant execute on function public.status_integracao_pagamento() to authenticated;

-- Só pedidos pagos online podem ser marcados como aguardando pagamento.
create or replace function public.aplicar_status_pagamento_inicial()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.forma_pagamento = 'online' then
    new.status_pagamento := 'aguardando';
    new.provedor_pagamento := 'mercado_pago';
  else
    new.status_pagamento := 'nao_aplicavel';
    new.provedor_pagamento := null;
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_status_pagamento_inicial on public.pedidos;
create trigger pedidos_status_pagamento_inicial
  before insert on public.pedidos
  for each row execute function public.aplicar_status_pagamento_inicial();

-- A cozinha não pode iniciar um pedido online sem confirmação do provedor.
create or replace function public.bloquear_preparo_sem_pagamento()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'em_preparo'
     and old.forma_pagamento = 'online'
     and old.status_pagamento <> 'pago' then
    raise exception 'Pagamento ainda não confirmado';
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_bloquear_preparo_sem_pagamento on public.pedidos;
create trigger pedidos_bloquear_preparo_sem_pagamento
  before update of status on public.pedidos
  for each row execute function public.bloquear_preparo_sem_pagamento();

-- Atualiza a RPC existente para admitir o checkout online.
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
  v_minimo numeric(10,2) := 0;
  v_pedido public.pedidos%rowtype;
begin
  select * into v_empresa from public.empresas
   where id = p_empresa_id and status = 'ativa';
  if not found then raise exception 'Empresa inválida ou inativa'; end if;

  if p_modalidade not in ('retirada', 'entrega') then raise exception 'Modalidade inválida'; end if;
  if p_forma_pagamento not in ('online', 'dinheiro', 'pix', 'cartao_credito', 'cartao_debito') then
    raise exception 'Forma de pagamento inválida';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0
     or jsonb_array_length(p_itens) > 50 then raise exception 'Carrinho inválido'; end if;

  if p_cliente_id is not null then
    select * into v_cliente from public.clientes where id = p_cliente_id;
    if not found or v_cliente.empresa_id <> p_empresa_id
       or v_cliente.auth_id is distinct from auth.uid() then raise exception 'Cliente inválido'; end if;
  end if;

  with requested as (
    select (item->>'produtoId')::uuid as produto_id,
           greatest(1, least(99, (item->>'quantidade')::integer)) as quantidade
      from jsonb_array_elements(p_itens) item
  ), normalized as (
    select produto_id, sum(quantidade)::integer as quantidade from requested group by produto_id
  ), priced as (
    select p.id, p.nome, n.quantidade, p.preco::numeric(10,2) as preco
      from normalized n join public.produtos p on p.id = n.produto_id
     where p.empresa_id = p_empresa_id and p.disponivel = true
  )
  select jsonb_agg(jsonb_build_object(
           'produtoId', id, 'nome', nome, 'quantidade', quantidade,
           'precoUnitario', preco, 'subtotal', round(preco * quantidade, 2)
         )), round(sum(preco * quantidade), 2)
    into v_itens, v_subtotal from priced;

  if v_itens is null or jsonb_array_length(v_itens) <>
     (select count(distinct (item->>'produtoId')::uuid) from jsonb_array_elements(p_itens) item) then
    raise exception 'Um ou mais produtos são inválidos ou indisponíveis';
  end if;

  if p_modalidade = 'entrega' then
    if coalesce((v_empresa.entrega->>'entregaAtiva')::boolean, false) is false then
      raise exception 'Entrega indisponível';
    end if;
    if nullif(trim(p_cliente_end), '') is null then raise exception 'Endereço obrigatório'; end if;
    v_taxa := coalesce(nullif((v_empresa.entrega->>'taxaEntregaFixa')::numeric, 0), v_empresa.taxa_entrega, 0);
    v_minimo := coalesce(nullif((v_empresa.entrega->>'pedidoMinimoEntrega')::numeric, 0), v_empresa.pedido_minimo, 0);
    if v_subtotal < v_minimo then raise exception 'Pedido abaixo do mínimo para entrega'; end if;
  end if;

  insert into public.pedidos (
    empresa_id, cliente_id, status, modalidade, forma_pagamento,
    cliente_nome, cliente_tel, cliente_end, itens, observacao,
    subtotal, taxa_entrega, total
  ) values (
    p_empresa_id, p_cliente_id, 'aguardando', p_modalidade, p_forma_pagamento,
    left(nullif(trim(p_cliente_nome), ''), 120), left(nullif(trim(p_cliente_tel), ''), 30),
    left(nullif(trim(p_cliente_end), ''), 300), v_itens,
    left(nullif(trim(p_observacao), ''), 1000), v_subtotal, v_taxa, v_subtotal + v_taxa
  ) returning * into v_pedido;
  return v_pedido;
end;
$$;

revoke all on function public.criar_pedido_seguro(
  uuid, text, text, text, text, text, uuid, jsonb, text
) from public;
grant execute on function public.criar_pedido_seguro(
  uuid, text, text, text, text, text, uuid, jsonb, text
) to authenticated;
