import { supabase } from '../lib/supabase';
import type { ClientePerfil, EnderecoCliente } from '../types/domain';

function mapCliente(row: Record<string, unknown>): ClientePerfil {
  return {
    id: row.id as string,
    authId: row.auth_id as string,
    empresaId: row.empresa_id as string,
    nome: row.nome as string,
    email: row.email as string | undefined,
    whatsapp: row.whatsapp as string | undefined,
    dataNasc: row.data_nasc as string | undefined,
    endereco: row.endereco as EnderecoCliente | undefined,
    fotoUrl: row.foto_url as string | undefined,
  };
}

export const clienteService = {
  async buscarPorAuthId(authId: string): Promise<ClientePerfil | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();
    if (error) { console.error('[clienteService.buscarPorAuthId]', error.message); return null; }
    if (!data) return null;
    return mapCliente(data as Record<string, unknown>);
  },

  async criar(payload: {
    authId: string;
    empresaId: string;
    nome: string;
    email?: string;
    whatsapp?: string;
    dataNasc?: string;
    endereco?: EnderecoCliente;
    fotoUrl?: string;
  }): Promise<ClientePerfil | null> {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        auth_id: payload.authId,
        empresa_id: payload.empresaId,
        nome: payload.nome,
        email: payload.email ?? null,
        whatsapp: payload.whatsapp ?? null,
        data_nasc: payload.dataNasc ?? null,
        endereco: payload.endereco ?? null,
        foto_url: payload.fotoUrl ?? null,
      })
      .select()
      .single();
    if (error) { console.error('[clienteService.criar]', error.message); return null; }
    return mapCliente(data as Record<string, unknown>);
  },

  async atualizar(id: string, payload: {
    nome?: string;
    whatsapp?: string;
    dataNasc?: string;
    endereco?: EnderecoCliente;
  }): Promise<ClientePerfil | null> {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...(payload.nome      !== undefined && { nome: payload.nome }),
        ...(payload.whatsapp  !== undefined && { whatsapp: payload.whatsapp }),
        ...(payload.dataNasc  !== undefined && { data_nasc: payload.dataNasc }),
        ...(payload.endereco  !== undefined && { endereco: payload.endereco }),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('[clienteService.atualizar]', error.message); return null; }
    return mapCliente(data as Record<string, unknown>);
  },

  async listarPedidos(clienteId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })
      .limit(30);
    if (error) { console.error('[clienteService.listarPedidos]', error.message); return []; }
    return data ?? [];
  },

  async buscarPedido(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();
    if (error) { console.error('[clienteService.buscarPedido]', error.message); return null; }
    return data;
  },

  // Assina atualizações em tempo real de um pedido específico
  subscribePedido(pedidoId: string, onUpdate: (row: Record<string, unknown>) => void) {
    return supabase
      .channel(`pedido-${pedidoId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
        filter: `id=eq.${pedidoId}`,
      }, (payload) => onUpdate(payload.new as Record<string, unknown>))
      .subscribe();
  },
};
