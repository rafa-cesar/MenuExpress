-- Endurecimento de permissões e prevenção de pedidos automatizados.

-- Helpers usados por RLS não precisam executar com privilégios do criador.
alter function public.is_empresa_owner(uuid) security invoker;
alter function public.is_cliente_owner(uuid) security invoker;

revoke all on function public.is_empresa_owner(uuid) from public, anon, authenticated;
revoke all on function public.is_cliente_owner(uuid) from public, anon, authenticated;
grant execute on function public.is_empresa_owner(uuid) to anon, authenticated;
grant execute on function public.is_cliente_owner(uuid) to authenticated;

-- Somente clientes autenticados podem criar pedidos.
create or replace function public.validar_cliente_autenticado_pedido()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedidos_minuto integer;
  v_pedidos_hora integer;
begin
  if auth.uid() is null or new.cliente_id is null then
    raise exception 'Cliente autenticado obrigatório';
  end if;

  if not exists (
    select 1 from public.clientes c
     where c.id = new.cliente_id
       and c.empresa_id = new.empresa_id
       and c.auth_id = auth.uid()
  ) then
    raise exception 'Cliente não pertence ao usuário autenticado';
  end if;

  select count(*) filter (where p.criado_em >= now() - interval '1 minute'),
         count(*) filter (where p.criado_em >= now() - interval '1 hour')
    into v_pedidos_minuto, v_pedidos_hora
    from public.pedidos p
   where p.cliente_id = new.cliente_id
     and p.criado_em >= now() - interval '1 hour';

  if v_pedidos_minuto >= 5 or v_pedidos_hora >= 30 then
    raise exception 'Limite de pedidos atingido. Aguarde antes de tentar novamente';
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_validar_cliente_autenticado on public.pedidos;
create trigger pedidos_validar_cliente_autenticado
  before insert on public.pedidos
  for each row execute function public.validar_cliente_autenticado_pedido();

revoke all on function public.validar_cliente_autenticado_pedido() from public, anon, authenticated;

-- O checkout seguro é o único caminho de criação para usuários autenticados.
revoke all on function public.criar_pedido_seguro(
  uuid, text, text, text, text, text, uuid, jsonb, text
) from public, anon, authenticated;
grant execute on function public.criar_pedido_seguro(
  uuid, text, text, text, text, text, uuid, jsonb, text
) to authenticated;

-- A rotina de expiração pertence ao cron/service role, nunca ao cliente.
revoke all on function public.expirar_pagamentos_pendentes()
  from public, anon, authenticated;
grant execute on function public.expirar_pagamentos_pendentes() to service_role;

-- Metadados seguros da integração continuam disponíveis somente ao dono logado.
revoke all on function public.status_integracao_pagamento()
  from public, anon, authenticated;
grant execute on function public.status_integracao_pagamento() to authenticated;

-- Pedidos não podem ser alterados diretamente em campos financeiros.
revoke all on table public.pedidos from anon, authenticated;
grant select on table public.pedidos to authenticated;
grant update (status, estimativa_minutos, previsao_em) on public.pedidos to authenticated;

-- Arquivos continuam publicamente acessíveis pela URL do bucket, sem listagem ampla.
drop policy if exists "logos_public_read" on storage.objects;

-- Elimina avisos de search_path mutável em funções legadas de trigger.
alter function public.set_atualizado_em() set search_path = public;
do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = public';
  end if;
end;
$$;
