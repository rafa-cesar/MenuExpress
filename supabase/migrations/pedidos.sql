-- Tabela de pedidos
-- Execute este SQL no painel do Supabase: SQL Editor > New query

create table if not exists pedidos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  numero       serial,                          -- número sequencial legível
  status       text not null default 'novo'     -- novo | em_preparo | pronto | entregue | cancelado
                check (status in ('novo','em_preparo','pronto','entregue','cancelado')),
  modalidade   text not null default 'retirada' -- retirada | entrega
                check (modalidade in ('retirada','entrega')),
  cliente_nome text,
  cliente_tel  text,
  cliente_end  text,
  itens        jsonb not null default '[]',     -- [{nome, quantidade, precoUnitario, subtotal}]
  observacao   text,
  subtotal     numeric(10,2) not null default 0,
  taxa_entrega numeric(10,2) not null default 0,
  total        numeric(10,2) not null default 0,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Index para busca por empresa + status + ordem
create index if not exists pedidos_empresa_status_idx
  on pedidos(empresa_id, status, criado_em asc);

-- Trigger para atualizar atualizado_em automaticamente
create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger pedidos_atualizado_em
  before update on pedidos
  for each row execute function set_atualizado_em();

-- Habilitar Realtime para a tabela
alter publication supabase_realtime add table pedidos;

-- RLS: somente usuários autenticados da empresa podem ver/editar
alter table pedidos enable row level security;

create policy "Dono lê seus pedidos"
  on pedidos for select
  using (auth.role() = 'authenticated');

create policy "Dono atualiza seus pedidos"
  on pedidos for update
  using (auth.role() = 'authenticated');

create policy "Qualquer um insere pedido" -- cliente não está autenticado
  on pedidos for insert
  with check (true);
