-- Expõe apenas um booleano seguro para o checkout público, nunca credenciais.
create or replace function public.pagamento_online_disponivel(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.empresas e
      join public.integracoes_pagamento i on i.empresa_id = e.id
     where e.id = p_empresa_id
       and e.status = 'ativa'
       and i.ativo = true
       and i.provedor = 'mercadopago'
  );
$$;

revoke all on function public.pagamento_online_disponivel(uuid) from public;
grant execute on function public.pagamento_online_disponivel(uuid) to anon, authenticated;

create or replace function public.validar_pagamento_online_empresa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((new.pagamentos->>'onlineAntecipadoAtivo')::boolean, false)
     and not public.pagamento_online_disponivel(new.id) then
    raise exception 'Conecte uma conta Mercado Pago antes de ativar o pagamento online';
  end if;
  return new;
end;
$$;

drop trigger if exists empresas_validar_pagamento_online on public.empresas;
create trigger empresas_validar_pagamento_online
  before insert or update of pagamentos on public.empresas
  for each row execute function public.validar_pagamento_online_empresa();

revoke all on function public.validar_pagamento_online_empresa() from public, anon, authenticated;
