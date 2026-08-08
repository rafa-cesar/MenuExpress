import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, requiredEnv } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ error: 'Não autenticado' }, 401);
    const body = await req.json().catch(() => ({}));
    if (body?.confirmar !== true) return json({ error: 'Confirmação obrigatória' }, 400);

    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const userClient = createClient(supabaseUrl, requiredEnv('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Sessão inválida' }, 401);

    const admin = createClient(supabaseUrl, requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: empresa } = await admin.from('empresas')
      .select('id').eq('user_id', user.id).maybeSingle();
    if (!empresa) return json({ error: 'Restaurante não encontrado' }, 404);

    const { error } = await admin.from('integracoes_pagamento')
      .delete().eq('empresa_id', empresa.id).eq('provedor', 'mercado_pago');
    if (error) throw error;
    return json({ desconectado: true });
  } catch (error) {
    console.error(error);
    return json({ error: 'Não foi possível desconectar a conta' }, 500);
  }
});
