import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, requiredEnv } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ error: 'Não autenticado' }, 401);

    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const anonKey = requiredEnv('SUPABASE_ANON_KEY');
    const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Sessão inválida' }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: empresa } = await admin
      .from('empresas').select('id').eq('user_id', user.id).maybeSingle();
    if (!empresa) return json({ error: 'Restaurante não encontrado' }, 404);

    const state = crypto.randomUUID().replaceAll('-', '');
    const { error: stateError } = await admin.from('estados_oauth_pagamento').insert({
      estado: state, empresa_id: empresa.id, usuario_id: user.id,
    });
    if (stateError) throw stateError;

    const url = new URL('https://auth.mercadopago.com.br/authorization');
    url.searchParams.set('client_id', requiredEnv('MP_CLIENT_ID'));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('platform_id', 'mp');
    url.searchParams.set('redirect_uri', requiredEnv('MP_REDIRECT_URI'));
    url.searchParams.set('state', state);
    return json({ url: url.toString() });
  } catch (error) {
    console.error(error);
    return json({ error: 'Não foi possível iniciar a conexão' }, 500);
  }
});

