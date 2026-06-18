import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { demoCategorias, demoEmpresa, demoMenuItems } from '../data/menu';
import type { Categoria, Empresa, MenuItem } from '../types/menu';

export type MenuStoreState = {
  empresa: Empresa;
  categorias: Categoria[];
  produtos: MenuItem[];
};

export type MenuStoreContextValue = MenuStoreState & {
  setEmpresa: (empresa: Empresa) => void;
  setCategorias: (categorias: Categoria[]) => void;
  setProdutos: (produtos: MenuItem[]) => void;
};

const MenuStoreContext = createContext<MenuStoreContextValue | undefined>(undefined);

export function MenuStoreProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa>(demoEmpresa);
  const [categorias, setCategorias] = useState<Categoria[]>(demoCategorias);
  const [produtos, setProdutos] = useState<MenuItem[]>(demoMenuItems);

  const value = useMemo<MenuStoreContextValue>(
    () => ({ empresa, categorias, produtos, setEmpresa, setCategorias, setProdutos }),
    [empresa, categorias, produtos],
  );

  return <MenuStoreContext.Provider value={value}>{children}</MenuStoreContext.Provider>;
}

export function useMenuStore() {
  const context = useContext(MenuStoreContext);

  if (!context) {
    throw new Error('useMenuStore deve ser usado dentro de MenuStoreProvider');
  }

  return context;
}
