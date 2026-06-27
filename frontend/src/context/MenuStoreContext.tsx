import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { demoCategorias, demoEmpresa, demoMenuItems } from '../data/menu';
import type { Categoria, Empresa, MenuItem } from '../types/menu';
import type { ConfigEntrega, EmpresaStatus } from '../types/domain';
import type { MenuCategory } from '../types/menu';
import type { EstiloVisual } from '../types/domain';

const EMPRESA_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export type MenuStoreState = {
  empresa: Empresa;
  categorias: Categoria[];
  produtos: MenuItem[];
  loading: boolean;
};

export type MenuStoreContextValue = MenuStoreState & {
  setEmpresa: (empresa: Empresa) => void;
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
  setProdutos: React.Dispatch<React.SetStateAction<MenuItem[]>>;
};

const MenuStoreContext = createContext<MenuStoreContextValue | undefined>(undefined);

function mapEmpresa(row: Record<string, unknown>): Empresa {
  const entregaRaw = row.entrega as ConfigEntrega | null;
  return {
    id: row.id as string,
    nome: row.nome as string,
    slug: (row.slug as string) ?? '',
    status: (row.status as EmpresaStatus) ?? 'ativa',
    descricao: row.descricao as string,
    cidade: row.cidade as string,
    whatsapp: row.whatsapp as string,
    corPrincipal: row.cor_principal as string,
    estiloVisual: (row.estilo_visual as EstiloVisual) ?? 'moderno',
    taxaEntrega: Number(row.taxa_entrega),
    pedidoMinimo: Number(row.pedido_minimo),
    logoUrl: row.logo_url as string ?? '',
    horario: {
      status: row.horario_status as Empresa['horario']['status'],
      mensagemCliente: row.horario_mensagem_cliente as string,
      dias: row.horario_dias as Empresa['horario']['dias'],
    },
    entrega: entregaRaw ?? { retiradaAtiva: true, entregaAtiva: false, taxaEntregaFixa: 0, pedidoMinimoEntrega: 0 },
  };
}

function mapCategoria(row: Record<string, unknown>): Categoria {
  return {
    id: row.id as string,
    empresaId: row.empresa_id as string,
    nome: row.nome as string,
    slug: row.slug as string,
    ordem: Number(row.ordem),
    ativa: Boolean(row.ativa),
  };
}

function mapProduto(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    empresaId: row.empresa_id as string,
    categoriaId: (row.categoria_id as string) ?? '',
    nome: row.nome as string,
    descricao: row.descricao as string,
    preco: Number(row.preco),
    categoria: row.categoria as MenuCategory,
    imagem: row.imagem as string,
    destaque: Boolean(row.destaque),
    disponivel: Boolean(row.disponivel),
  };
}

export function MenuStoreProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa>(demoEmpresa);
  const [categorias, setCategorias] = useState<Categoria[]>(demoCategorias);
  const [produtos, setProdutos] = useState<MenuItem[]>(demoMenuItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [{ data: empresaData }, { data: categoriasData }, { data: produtosData }] =
          await Promise.all([
            supabase.from('empresas').select('*').eq('id', EMPRESA_ID).single(),
            supabase.from('categorias').select('*').eq('empresa_id', EMPRESA_ID).eq('ativa', true).order('ordem'),
            supabase.from('produtos').select('*').eq('empresa_id', EMPRESA_ID).eq('disponivel', true).order('criado_em'),
          ]);

        if (empresaData) setEmpresa(mapEmpresa(empresaData as Record<string, unknown>));
        if (categoriasData?.length) setCategorias(categoriasData.map(mapCategoria));
        if (produtosData?.length) setProdutos(produtosData.map(mapProduto));
      } catch (error) {
        console.error('[MenuStore] Falha ao carregar dados do Supabase, usando dados locais.', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const value = useMemo<MenuStoreContextValue>(
    () => ({ empresa, categorias, produtos, loading, setEmpresa, setCategorias, setProdutos }),
    [empresa, categorias, produtos, loading],
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
