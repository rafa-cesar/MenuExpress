export const futureTenantMenuRoutePattern = '/$empresaSlug/cardapio';

export const tenantMenuRouteExamples = [
  '/burger-house/cardapio',
  '/acai-central/cardapio',
  '/pizzaria-italia/cardapio',
];

export function buildTenantMenuPath(empresaSlug: string) {
  return `/cardapio/${encodeURIComponent(empresaSlug)}`;
}
