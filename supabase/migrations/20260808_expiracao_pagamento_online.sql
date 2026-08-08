alter table public.pedidos add column if not exists pagamento_expira_em timestamptz;

alter table public.pedidos drop constraint if exists pedidos_status_pagamento_check;
alter table public.pedidos add constraint pedidos_status_pagamento_check
  check (status_pagamento in (
    'nao_aplicavel', 'aguardando', 'pago', 'falhou', 'cancelado',
    'expirado', 'estorno_pendente', 'estornado'
  ));

create index if not exists pedidos_pagamento_expiracao_idx
  on public.pedidos (pagamento_expira_em)
  where forma_pagamento = 'online' and status_pagamento = 'aguardando';

create or replace function public.expirar_pagamentos_pendentes()
returns integer language plpgsql security definer set search_path = public as $$
declare v_total integer;
begin
  update public.pedidos
     set status = 'cancelado', status_pagamento = 'expirado', atualizado_em = now()
   where forma_pagamento = 'online' and status_pagamento = 'aguardando'
     and pagamento_expira_em is not null and pagamento_expira_em <= now();
  get diagnostics v_total = row_count;
  return v_total;
end;
$$;
revoke all on function public.expirar_pagamentos_pendentes() from public;

create extension if not exists pg_cron with schema extensions;
do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job
   where jobname = 'menu-express-expirar-pagamentos' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule('menu-express-expirar-pagamentos', '* * * * *',
    'select public.expirar_pagamentos_pendentes();');
end;
$$;
