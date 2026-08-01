import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requiredEnv } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const appUrl = requiredEnv('APP_URL');
  const redirect = (result: string) => Response.redirect(`${appUrl}/admin/pagamentos?resultado=${result}`, 302);
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return redirect('erro');

    const admin = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: oauthState } = await admin.from('estados_oauth_pagamento')
      .delete().eq('estado', state).gt('expira_em', new Date().toISOString())
      .select('empresa_id').maybeSingle();
    if (!oauthState) return redirect('estado_invalido');

    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: requiredEnv('MP_CLIENT_ID'),
        client_secret: requiredEnv('MP_CLIENT_SECRET'),
        grant_type: 'authorization_code',
        code,
        redirect_uri: requiredEnv('MP_REDIRECT_URI'),
      }),
    });
    const token = await response.json();
    if (!response.ok || !token.access_token || !token.user_id) {
      console.error('OAuth Mercado Pago:', token);
      return redirect('erro');
    }

    const expiraEm = token.expires_in
      ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString()
      : null;
    const { error } = await admin.from('integracoes_pagamento').upsert({
      empresa_id: oauthState.empresa_id,
      provedor: 'mercado_pago',
      conta_externa_id: String(token.user_id),
      token_acesso: token.access_token,
      token_atualizacao: token.refresh_token ?? null,
      token_expira_em: expiraEm,
      ativo: true,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'empresa_id' });
    if (error) throw error;
    return redirect('conectado');
  } catch (error) {
    console.error(error);
    return redirect('erro');
  }
});

