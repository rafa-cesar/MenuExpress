-- Adiciona colunas de estimativa e novos status ao fluxo de pedidos
-- Execute no Supabase SQL Editor

alter table pedidos
  add column if not exists estimativa_minutos integer,
  add column if not exists previsao_em timestamptz;

-- Atualiza constraint de status para o novo fluxo
alter table pedidos drop constraint if exists pedidos_status_check;
alter table pedidos
  add constraint pedidos_status_check
  check (status in (
    'aguardando',    -- pedido novo, aguardando inicio
    'em_preparo',    -- em preparo/separacao
    'pronto_retirada', -- pronto, cliente vem buscar
    'saiu_entrega',  -- despachado para entrega
    'finalizado',    -- entregue ou retirado
    'cancelado'
  ));

-- Atualiza default
alter table pedidos alter column status set default 'aguardando';

-- Index para estimativa
create index if not exists pedidos_previsao_idx on pedidos(previsao_em asc) where previsao_em is not null;
