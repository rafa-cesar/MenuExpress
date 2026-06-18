import type { Categoria, Empresa, Produto } from './domain';

export type MenuCategory = 'Promoções' | 'Hambúrgueres' | 'Combos' | 'Bebidas' | 'Adicionais';

export type MenuItem = Produto & {
  categoria: MenuCategory;
};

export type CartItem = {
  product: MenuItem;
  quantity: number;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  whatsapp: string;
  city: string;
};

export type MenuCatalog = {
  empresa: Empresa;
  restaurant: Restaurant;
  categorias: Categoria[];
  categoriasNomes: MenuCategory[];
  produtos: MenuItem[];
};

export type { Categoria, Cliente, Empresa, Pedido, Produto } from './domain';
