import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, requiredEnv } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ error: 'Não autenticado' }, 401);
    const body = await req.json();
    if (!body.pedidoId) return json({ error: 'Pedido obrigatório' }, 400);

    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const userClient = createClient(supabaseUrl, requiredEnv('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Sessão inválida' }, 401);

    const admin = createClient(supabaseUrl, requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: pedido } = await admin.from('pedidos').select('*').eq('id', body.pedidoId).maybeSingle();
    if (!pedido || pedido.forma_pagamento !== 'online' || pedido.status_pagamento !== 'aguardando') {
      return json({ error: 'Pedido indisponível para pagamento' }, 409);
    }
    const { data: cliente } = await admin.from('clientes').select('auth_id,email')
      .eq('id', pedido.cliente_id).maybeSingle();
    if (!cliente || cliente.auth_id !== user.id) return json({ error: 'Acesso negado' }, 403);

    const { data: integracao } = await admin.from('integracoes_pagamento')
      .select('token_acesso').eq('empresa_id', pedido.empresa_id).eq('ativo', true).maybeSingle();
    if (!integracao) return json({ error: 'Este restaurante ainda não ativou o pagamento online' }, 409);

    const now = new Date();
    const existingExpiration = pedido.pagamento_expira_em ? new Date(pedido.pagamento_expira_em) : null;
    if (existingExpiration && existingExpiration <= now) {
      await admin.from('pedidos').update({ status: 'cancelado', status_pagamento: 'expirado' })
        .eq('id', pedido.id).eq('status_pagamento', 'aguardando');
      return json({ error: 'O prazo deste pedido terminou. Faça um novo pedido.' }, 409);
    }
    const expiresAt = existingExpiration ?? new Date(now.getTime() + 15 * 60_000);

    const appUrl = requiredEnv('APP_URL');
    const webhookUrl = new URL(requiredEnv('MP_WEBHOOK_URL'));
    webhookUrl.searchParams.set('empresa_id', pedido.empresa_id);
    const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
    const preference = {
      items: itens.map((item: Record<string, unknown>) => ({
        id: String(item.produtoId ?? ''),
        title: String(item.nome ?? 'Item'),
        quantity: Number(item.quantidade ?? 1),
        unit_price: Number(item.precoUnitario ?? 0),
        currency_id: 'BRL',
      })).concat(Number(pedido.taxa_entrega) > 0 ? [{
        id: 'taxa-entrega', title: 'Taxa de entrega', quantity: 1,
        unit_price: Number(pedido.taxa_entrega), currency_id: 'BRL',
      }] : []),
      payer: { email: cliente.email ?? user.email },
      external_reference: pedido.id,
      notification_url: webhookUrl.toString(),
      back_urls: {
        success: `${appUrl}/minha-area?pedido=${pedido.id}&pagamento=sucesso`,
        pending: `${appUrl}/minha-area?pedido=${pedido.id}&pagamento=pendente`,
        failure: `${appUrl}/checkout/resumo?pedido=${pedido.id}&pagamento=falhou`,
      },
      auto_return: 'approved',
      expires: true,
      expiration_date_from: now.toISOString(),
      expiration_date_to: expiresAt.toISOString(),
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
      },
      statement_descriptor: 'MENU PEDIDO',
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${integracao.token_acesso}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pedido-${pedido.id}`,
      },
      body: JSON.stringify(preference),
    });
    const mp = await mpResponse.json();
    if (!mpResponse.ok || !mp.init_point) {
      console.error('Checkout Mercado Pago:', mp);
      return json({ error: 'Não foi possível abrir o pagamento' }, 502);
    }
    await admin.from('pedidos').update({
      pagamento_url: mp.init_point,
      pagamento_expira_em: expiresAt.toISOString(),
    }).eq('id', pedido.id).eq('status_pagamento', 'aguardando');
    return json({ url: mp.init_point, expiraEm: expiresAt.toISOString() });
  } catch (error) {
    console.error(error);
    return json({ error: 'Falha ao iniciar pagamento' }, 500);
  }
});

