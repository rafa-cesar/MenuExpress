-- Compatibilidade para lojas que ainda guardam taxa e mínimo nos campos
-- gerais. O banco permanece como fonte autoritativa do total do pedido.
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
  if p_forma_pagamento not in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito') then
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

    v_taxa := coalesce(
      nullif((v_empresa.entrega->>'taxaEntregaFixa')::numeric, 0),
      v_empresa.taxa_entrega,
      0
    );
    v_minimo := coalesce(
      nullif((v_empresa.entrega->>'pedidoMinimoEntrega')::numeric, 0),
      v_empresa.pedido_minimo,
      0
    );
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
