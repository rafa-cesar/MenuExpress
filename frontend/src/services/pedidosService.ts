import { supabase } from '../lib/supabase';
import type { Pedido, PedidoItem, PedidoStatus, ModalidadeEntrega } from '../types/domain';

const EMPRESA_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function mapPedido(row: Record<string, unknown>): Pedido {
  return {
    id: row.id as string,
    empresaId: row.empresa_id as string,
    numero: row.numero as number,
    status: row.status as PedidoStatus,
    modalidade: row.modalidade as ModalidadeEntrega,
    clienteNome: row.cliente_nome as string | undefined,
    clienteTel: row.cliente_tel as string | undefined,
    clienteEnd: row.cliente_end as string | undefined,
    itens: row.itens as PedidoItem[],
    observacao: row.observacao as string | undefined,
    subtotal: Number(row.subtotal),
    taxaEntrega: Number(row.taxa_entrega),
    total: Number(row.total),
    criadoEm: row.criado_em as string,
    atualizadoEm: row.atualizado_em as string,
  };
}

export const pedidosService = {
  async criar(pedido: {
    modalidade: ModalidadeEntrega;
    clienteNome: string;
    clienteTel: string;
    clienteEnd: string;
    itens: PedidoItem[];
    observacao: string;
    subtotal: number;
    taxaEntrega: number;
    total: number;
  }): Promise<Pedido | null> {
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        empresa_id: EMPRESA_ID,
        status: 'novo',
        modalidade: pedido.modalidade,
        cliente_nome: pedido.clienteNome || null,
        cliente_tel: pedido.clienteTel || null,
        cliente_end: pedido.clienteEnd || null,
        itens: pedido.itens,
        observacao: pedido.observacao || null,
        subtotal: pedido.subtotal,
        taxa_entrega: pedido.taxaEntrega,
        total: pedido.total,
      })
      .select()
      .single();

    if (error) { console.error('[pedidosService.criar]', error); return null; }
    return mapPedido(data as Record<string, unknown>);
  },

  async listar(): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('empresa_id', EMPRESA_ID)
      .not('status', 'eq', 'entregue')
      .not('status', 'eq', 'cancelado')
      .order('criado_em', { ascending: true });

    if (error) { console.error('[pedidosService.listar]', error); return []; }
    return (data as Record<string, unknown>[]).map(mapPedido);
  },

  async listarHistorico(): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('empresa_id', EMPRESA_ID)
      .in('status', ['entregue', 'cancelado'])
      .order('criado_em', { ascending: false })
      .limit(50);

    if (error) { console.error('[pedidosService.listarHistorico]', error); return []; }
    return (data as Record<string, unknown>[]).map(mapPedido);
  },

  async atualizarStatus(id: string, status: PedidoStatus): Promise<boolean> {
    const { error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id);

    if (error) { console.error('[pedidosService.atualizarStatus]', error); return false; }
    return true;
  },
};
