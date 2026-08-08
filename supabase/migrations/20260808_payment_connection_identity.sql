alter table public.integracoes_pagamento
  add column if not exists conta_nome text,
  add column if not exists conta_email text;

drop function if exists public.status_integracao_pagamento();

create or replace function public.status_integracao_pagamento()
returns table (
  provedor text,
  conta_externa_id text,
  conta_nome text,
  conta_email text,
  ativo boolean,
  conectado_em timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.provedor, i.conta_externa_id, i.conta_nome, i.conta_email,
         i.ativo, i.conectado_em
    from public.integracoes_pagamento i
    join public.empresas e on e.id = i.empresa_id
   where e.user_id = auth.uid();
$$;

revoke all on function public.status_integracao_pagamento() from public;
grant execute on function public.status_integracao_pagamento() to authenticated;
