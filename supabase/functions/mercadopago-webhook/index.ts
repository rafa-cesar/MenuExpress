import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requiredEnv } from '../_shared/http.ts';

async function validSignature(req: Request, paymentId: string): Promise<boolean> {
  const secret = requiredEnv('MP_WEBHOOK_SECRET');
  const signature = req.headers.get('x-signature') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';
  const parts = Object.fromEntries(signature.split(',').map((p) => p.trim().split('=')));
  if (!parts.ts || !parts.v1 || !requestId) return false;
  const manifest = `id:${paymentId};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const expected = [...new Uint8Array(signed)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== parts.v1.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i += 1) {
    difference |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  }
  return difference === 0;
}

function validWebhookToken(url: URL): boolean {
  const expected = requiredEnv('MP_WEBHOOK_SECRET');
  const provided = url.searchParams.get('hook_token') ?? '';
  if (expected.length !== provided.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i += 1) {
    difference |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return difference === 0;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const empresaId = url.searchParams.get('empresa_id');
    const payload = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const paymentId = String(payload?.data?.id ?? url.searchParams.get('data.id') ?? '');
    const authenticated = validWebhookToken(url) || await validSignature(req, paymentId);
    if (!empresaId || !paymentId || !authenticated) {
      return new Response('invalid', { status: 401 });
    }

    const admin = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: integracao } = await admin.from('integracoes_pagamento')
      .select('token_acesso').eq('empresa_id', empresaId).eq('ativo', true).maybeSingle();
    if (!integracao) return new Response('ok');

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${integracao.token_acesso}` },
    });
    const payment = await mpResponse.json();
    if (!mpResponse.ok || !payment.external_reference) return new Response('ok');

    const { data: pedido } = await admin.from('pedidos')
      .select('id,empresa_id,total,status,status_pagamento,pagamento_expira_em')
      .eq('id', payment.external_reference).eq('empresa_id', empresaId).maybeSingle();
    if (!pedido || Number(payment.transaction_amount) !== Number(pedido.total)) {
      console.error('Pagamento não corresponde ao pedido', { paymentId, empresaId });
      return new Response('ok');
    }

    const approvedAt = payment.date_approved ? new Date(payment.date_approved) : new Date();
    const expiredAt = pedido.pagamento_expira_em ? new Date(pedido.pagamento_expira_em) : null;
    const lateApproval = payment.status === 'approved' && (expiredAt
      ? approvedAt > expiredAt
      : pedido.status === 'cancelado' || pedido.status_pagamento === 'expirado');

    if (lateApproval) {
      const refundResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}/refunds`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${integracao.token_acesso}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `menu-express-estorno-${paymentId}`,
          },
          body: '{}',
        },
      );
      const refundStatus = refundResponse.ok ? 'estornado' : 'estorno_pendente';
      if (!refundResponse.ok) console.error('Estorno automático pendente', { paymentId, empresaId });
      await admin.from('pedidos').update({
        status: 'cancelado',
        status_pagamento: refundStatus,
        pagamento_externo_id: paymentId,
        pago_em: payment.date_approved ?? new Date().toISOString(),
      }).eq('id', pedido.id).eq('empresa_id', empresaId);
      return new Response('ok');
    }

    const status = payment.status === 'approved' ? 'pago'
      : payment.status === 'refunded' ? 'estornado'
      : payment.status === 'cancelled' || payment.status === 'rejected' ? 'falhou'
      : 'aguardando';
    await admin.from('pedidos').update({
      ...(status === 'pago' && pedido.status === 'cancelado' ? { status: 'aguardando' } : {}),
      status_pagamento: status,
      pagamento_externo_id: paymentId,
      pago_em: status === 'pago' ? (payment.date_approved ?? new Date().toISOString()) : null,
    }).eq('id', pedido.id).eq('empresa_id', empresaId);
    return new Response('ok');
  } catch (error) {
    console.error(error);
    return new Response('error', { status: 500 });
  }
});
