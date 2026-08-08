import { supabase } from '../lib/supabase';
import type { Pedido, PedidoItem, PedidoStatus, ModalidadeEntrega, FormaPagamento, StatusPagamento } from '../types/domain';

function mapPedido(row: Record<string, unknown>): Pedido {
  return {
    id: row.id as string,
    empresaId: row.empresa_id as string,
    clienteId: row.cliente_id as string | undefined,
    numero: row.numero as number,
    status: row.status as PedidoStatus,
    modalidade: row.modalidade as ModalidadeEntrega,
    formaPagamento: row.forma_pagamento as FormaPagamento | undefined,
    statusPagamento: row.status_pagamento as StatusPagamento | undefined,
    provedorPagamento: row.provedor_pagamento as string | undefined,
    pagamentoUrl: row.pagamento_url as string | undefined,
    pagamentoExpiraEm: row.pagamento_expira_em as string | undefined,
    pagoEm: row.pago_em as string | undefined,
    clienteNome: row.cliente_nome as string | undefined,
    clienteTel: row.cliente_tel as string | undefined,
    clienteEnd: row.cliente_end as string | undefined,
    itens: row.itens as PedidoItem[],
    observacao: row.observacao as string | undefined,
    subtotal: Number(row.subtotal),
    taxaEntrega: Number(row.taxa_entrega),
    total: Number(row.total),
    estimativaMinutos: row.estimativa_minutos as number | undefined,
    previsaoEm: row.previsao_em as string | undefined,
    agendadoPara: row.agendado_para as string | undefined,
    criadoEm: row.criado_em as string,
    atualizadoEm: row.atualizado_em as string,
  };
}

export const pedidosService = {
  async criar(empresaId: string, pedido: {
    modalidade: ModalidadeEntrega;
    formaPagamento: FormaPagamento;
    clienteNome: string;
    clienteTel: string;
    clienteEnd: string;
    clienteId?: string;
    itens: Array<{ produtoId: string; quantidade: number }>;
    observacao: string;
    agendadoPara?: string;
  }): Promise<Pedido | null> {
    const { data, error } = await supabase.rpc('criar_pedido_seguro', {
      p_empresa_id: empresaId,
      p_modalidade: pedido.modalidade,
      p_forma_pagamento: pedido.formaPagamento,
      p_cliente_nome: pedido.clienteNome,
      p_cliente_tel: pedido.clienteTel,
      p_cliente_end: pedido.clienteEnd,
      p_cliente_id: pedido.clienteId ?? null,
      p_itens: pedido.itens,
      p_observacao: pedido.observacao || null,
      p_agendado_para: pedido.agendadoPara ?? null,
    });

    if (error) {
      console.error('[pedidosService.criar] Erro ao inserir pedido:', error.message, error.details);
      return null;
    }
    if (!data) {
      console.error('[pedidosService.criar] Insert executado mas nenhuma linha retornada.');
      return null;
    }
    return mapPedido(data as Record<string, unknown>);
  },

  async listar(empresaId: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('empresa_id', empresaId)
      .not('status', 'in', '("finalizado","cancelado")')
      .or('forma_pagamento.neq.online,status_pagamento.eq.pago')
      .order('criado_em', { ascending: true });

    if (error) { console.error('[pedidosService.listar]', error.message); return []; }
    return (data as Record<string, unknown>[]).map(mapPedido);
  },

  async listarHistorico(empresaId: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('empresa_id', empresaId)
      .in('status', ['finalizado', 'cancelado'])
      .order('criado_em', { ascending: false })
      .limit(50);

    if (error) { console.error('[pedidosService.listarHistorico]', error.message); return []; }
    return (data as Record<string, unknown>[]).map(mapPedido);
  },

  async iniciarPreparo(id: string, estimativaMinutos: number): Promise<boolean> {
    const previsaoEm = new Date(Date.now() + estimativaMinutos * 60_000).toISOString();
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'em_preparo', estimativa_minutos: estimativaMinutos, previsao_em: previsaoEm })
      .eq('id', id);
    if (error) { console.error('[pedidosService.iniciarPreparo]', error.message); return false; }
    return true;
  },

  async atualizarStatus(id: string, status: PedidoStatus): Promise<boolean> {
    const { error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('[pedidosService.atualizarStatus]', error.message, '— pedido id:', id); return false; }
    return true;
  },
};
