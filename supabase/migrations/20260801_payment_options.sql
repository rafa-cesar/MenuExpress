-- Cada restaurante escolhe quais formas de pagamento deseja oferecer.
alter table public.empresas
  add column if not exists pagamentos jsonb not null default
    '{"onlineAntecipadoAtivo":false,"dinheiroNaHoraAtivo":true,"cartaoNaHoraAtivo":true,"pixNaHoraAtivo":false,"chavePix":"","nomeBeneficiarioPix":""}'::jsonb;

create or replace function public.validar_forma_pagamento_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_config jsonb;
begin
  select pagamentos into v_config from public.empresas where id = new.empresa_id;

  if new.forma_pagamento = 'online' then
    if not coalesce((v_config->>'onlineAntecipadoAtivo')::boolean, false) then
      raise exception 'Pagamento antecipado não habilitado pelo restaurante';
    end if;
    if not exists (
      select 1 from public.integracoes_pagamento
       where empresa_id = new.empresa_id and ativo = true
    ) then
      raise exception 'Conta de pagamento do restaurante ainda não conectada';
    end if;
  elsif new.forma_pagamento = 'dinheiro' then
    if not coalesce((v_config->>'dinheiroNaHoraAtivo')::boolean, true) then
      raise exception 'Pagamento em dinheiro não habilitado pelo restaurante';
    end if;
  elsif new.forma_pagamento in ('cartao_credito', 'cartao_debito') then
    if not coalesce((v_config->>'cartaoNaHoraAtivo')::boolean, true) then
      raise exception 'Pagamento presencial em cartão não habilitado pelo restaurante';
    end if;
  elsif new.forma_pagamento = 'pix' then
    if not coalesce((v_config->>'pixNaHoraAtivo')::boolean, false)
       or nullif(trim(v_config->>'chavePix'), '') is null then
      raise exception 'Pix direto não habilitado ou sem chave cadastrada';
    end if;
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
     where tgname = 'pedidos_validar_forma_pagamento_empresa'
       and tgrelid = 'public.pedidos'::regclass
  ) then
    create trigger pedidos_validar_forma_pagamento_empresa
      before insert on public.pedidos
      for each row execute function public.validar_forma_pagamento_empresa();
  end if;
end;
$$;
