export function corsHeaders(req?: Request) {
  const appOrigin = Deno.env.get('APP_URL') ?? '';
  const configured = (Deno.env.get('CORS_ALLOWED_ORIGINS') ?? '')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  const allowed = new Set([appOrigin, ...configured].filter(Boolean));
  const requestedOrigin = req?.headers.get('Origin') ?? '';
  const origin = allowed.has(requestedOrigin) ? requestedOrigin : appOrigin;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Secret obrigatório não configurado: ${name}`);
  return value;
}

