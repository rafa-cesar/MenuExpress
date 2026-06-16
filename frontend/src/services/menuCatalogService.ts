import { demoCategorias, demoEmpresa, demoMenuItems, demoRestaurant, menuCategories } from '../data/menu';
import type { MenuCatalog } from '../types/menu';

export type MenuCatalogService = {
  getDemoCatalog: () => MenuCatalog;
  getCatalogByEmpresaSlug: (empresaSlug: string) => MenuCatalog | null;
};

const demoCatalog: MenuCatalog = {
  empresa: demoEmpresa,
  restaurant: demoRestaurant,
  categorias: demoCategorias,
  categoriasNomes: menuCategories,
  produtos: demoMenuItems,
};

export const menuCatalogService: MenuCatalogService = {
  getDemoCatalog() {
    return demoCatalog;
  },

  getCatalogByEmpresaSlug(empresaSlug) {
    if (empresaSlug === demoEmpresa.slug) {
      return demoCatalog;
    }

    return null;
  },
};
