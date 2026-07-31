import type { Empresa } from '../types/domain';

/** Compatibilidade com lojas que ainda usam apenas os campos gerais. */
export function getDeliveryFee(empresa?: Empresa | null): number {
  const specificFee = Number(empresa?.entrega?.taxaEntregaFixa ?? 0);
  return specificFee > 0 ? specificFee : Number(empresa?.taxaEntrega ?? 0);
}

export function getDeliveryMinimum(empresa?: Empresa | null): number {
  const specificMinimum = Number(empresa?.entrega?.pedidoMinimoEntrega ?? 0);
  return specificMinimum > 0 ? specificMinimum : Number(empresa?.pedidoMinimo ?? 0);
}
