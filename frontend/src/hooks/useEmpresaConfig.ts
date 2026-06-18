import { useMenuExpressStore } from './useMenuExpressStore';

export function useEmpresaConfig() {
  const { empresa, setEmpresa } = useMenuExpressStore();

  return { empresa, setEmpresa };
}
