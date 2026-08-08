import { supabase } from '../lib/supabase';

export interface PaymentConnectionStatus {
  provedor: string;
  conta_externa_id: string;
  conta_nome: string | null;
  conta_email: string | null;
  ativo: boolean;
  conectado_em: string;
}

export const paymentService = {
  async status(): Promise<PaymentConnectionStatus | null> {
    const { data, error } = await supabase.rpc('status_integracao_pagamento');
    if (error) throw error;
    return (data?.[0] as PaymentConnectionStatus | undefined) ?? null;
  },

  async iniciarConexao(): Promise<string> {
    const { data, error } = await supabase.functions.invoke('mercadopago-connect');
    if (error || !data?.url) throw new Error(data?.error ?? error?.message ?? 'Falha ao conectar');
    return data.url as string;
  },

  async desconectar(): Promise<void> {
    const { data, error } = await supabase.functions.invoke('mercadopago-disconnect', {
      body: { confirmar: true },
    });
    if (error || !data?.desconectado) {
      throw new Error(data?.error ?? error?.message ?? 'Falha ao desconectar');
    }
  },

  async iniciarCheckout(pedidoId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('mercadopago-checkout', { body: { pedidoId } });
    if (error || !data?.url) throw new Error(data?.error ?? error?.message ?? 'Falha ao iniciar pagamento');
    return data.url as string;
  },
};

