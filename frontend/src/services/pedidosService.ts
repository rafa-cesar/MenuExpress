import { supabase } from '../lib/supabase';
import type { Pedido, PedidoItem, PedidoStatus, ModalidadeEntrega } from '../types/domain';

// Nenhum EMPRESA_ID fixo — empresaId é sempre passado pelo chamador

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
    estimativaMinutos: row.estimativa_minutos as number | undefined,
    previsaoEm: row.previsao_em as string | undefined,
    criadoEm: row.criado_em as string,
    atualizadoEm: row.atualizado_em as string,
  };
}

export const pedidosService = {
  async criar(empresaId: string, pedido: {
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
        empresa_id: empresaId,
        status: 'aguardando',
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

  async listar(empresaId: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('empresa_id', empresaId)
      .not('status', 'in', '("finalizado","cancelado")')
      .order('criado_em', { ascending: true });

    if (error) { console.error('[pedidosService.listar]', error); return []; }
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

    if (error) { console.error('[pedidosService.listarHistorico]', error); return []; }
    return (data as Record<string, unknown>[]).map(mapPedido);
  },

  async iniciarPreparo(id: string, estimativaMinutos: number): Promise<boolean> {
    const previsaoEm = new Date(Date.now() + estimativaMinutos * 60_000).toISOString();
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'em_preparo', estimativa_minutos: estimativaMinutos, previsao_em: previsaoEm })
      .eq('id', id);
    if (error) { console.error('[pedidosService.iniciarPreparo]', error); return false; }
    return true;
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
