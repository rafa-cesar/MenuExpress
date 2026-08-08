import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Categoria, Empresa, MenuItem } from '../types/menu';
import type { ConfigEntrega, ConfigPagamento, EmpresaStatus } from '../types/domain';
import type { MenuCategory } from '../types/menu';
import type { EstiloVisual } from '../types/domain';

export type MenuStoreState = {
  empresa: Empresa | null;
  categorias: Categoria[];
  produtos: MenuItem[];
  loading: boolean;
  erro: string | null;
};

export type MenuStoreContextValue = MenuStoreState & {
  setEmpresa: (empresa: Empresa) => void;
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
  setProdutos: React.Dispatch<React.SetStateAction<MenuItem[]>>;
};

const MenuStoreContext = createContext<MenuStoreContextValue | undefined>(undefined);

// ─── helpers de cor ─────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount;
  const h = (v: number) => Math.round(Math.max(0, v * f)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const h = (v: number) => Math.round(Math.min(255, v + (255 - v) * amount)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Injeta as CSS variables de marca no :root para que TODO o app as use */
function applyBrandVars(cor: string) {
  const primary = cor || '#f97316';
  const [r, g, b] = hexToRgb(primary);
  const lum = luminance(r, g, b);
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-primary-dark', darken(primary, 0.18));
  root.style.setProperty('--brand-primary-light', lighten(primary, 0.82));
  root.style.setProperty('--brand-on-primary', lum > 0.35 ? '#0f172a' : '#ffffff');
}
// ─────────────────────────────────────────────────────────────────────────────

function mapEmpresa(row: Record<string, unknown>): Empresa {
  const entregaRaw = row.entrega as ConfigEntrega | null;
  const pagamentosRaw = row.pagamentos as ConfigPagamento | null;
  return {
    id: row.id as string,
    nome: row.nome as string,
    slug: (row.slug as string) ?? '',
    status: (row.status as EmpresaStatus) ?? 'ativa',
    descricao: (row.descricao as string) ?? '',
    cidade: (row.cidade as string) ?? '',
    // instagram mapeado explicitamente para evitar campo ausente no objeto
    instagram: (row.instagram as string) ?? '',
    whatsapp: (row.whatsapp as string) ?? '',
    corPrincipal: (row.cor_principal as string) ?? '#f97316',
    estiloVisual: (row.estilo_visual as EstiloVisual) ?? 'moderno',
    taxaEntrega: Number(row.taxa_entrega ?? 0),
    pedidoMinimo: Number(row.pedido_minimo ?? 0),
    logoUrl: (row.logo_url as string) ?? '',
    capaUrl: (row.capa_url as string) ?? '',
    horario: {
      status: (row.horario_status as Empresa['horario']['status']) ?? 'automatico',
      mensagemCliente: (row.horario_mensagem_cliente as string) ?? '',
      dias: row.horario_dias as Empresa['horario']['dias'],
    },
    entrega: entregaRaw ?? { retiradaAtiva: true, entregaAtiva: false, taxaEntregaFixa: 0, pedidoMinimoEntrega: 0 },
    pagamentos: pagamentosRaw ?? {
      onlineAntecipadoAtivo: false,
      dinheiroNaHoraAtivo: true,
      cartaoNaHoraAtivo: true,
      pixNaHoraAtivo: false,
    },
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
    descricao: (row.descricao as string) ?? '',
    preco: Number(row.preco ?? 0),
    categoria: row.categoria as MenuCategory,
    imagem: (row.imagem as string) ?? '',
    destaque: Boolean(row.destaque),
    disponivel: Boolean(row.disponivel),
  };
}

export function MenuStoreProvider({ children }: { children: ReactNode }) {
  // Estado inicial null/[] — nenhum dado demo em produção
  const [empresa, setEmpresaState] = useState<Empresa | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Sempre que a cor da empresa mudar, injeta no :root
  useEffect(() => {
    if (empresa?.corPrincipal) {
      applyBrandVars(empresa.corPrincipal);
    }
  }, [empresa?.corPrincipal]);

  // Wrapper que injeta vars imediatamente ao setar empresa (ex: após salvar no admin)
  const setEmpresa = (e: Empresa) => {
    applyBrandVars(e.corPrincipal ?? '#f97316');
    setEmpresaState(e);
  };

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setErro(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const ownerId = sessionData.session?.user.id;
        const defaultSlug = import.meta.env.VITE_DEFAULT_EMPRESA_SLUG as string | undefined;
        const defaultId = import.meta.env.VITE_DEFAULT_EMPRESA_ID as string | undefined;
        const publicSlugMatch = window.location.pathname.match(/^\/cardapio\/([^/]+)\/?$/);
        const publicSlug = publicSlugMatch ? decodeURIComponent(publicSlugMatch[1]) : null;
        const checkoutPath = window.location.pathname.startsWith('/checkout') || window.location.pathname === '/minha-area';
        const rememberedSlug = checkoutPath ? sessionStorage.getItem('menuexpress_tenant_slug') : null;
        const requestedSlug = publicSlug ?? rememberedSlug;

        if (publicSlug) sessionStorage.setItem('menuexpress_tenant_slug', publicSlug);

        let empresaQuery = supabase.from('empresas').select(
          'id,nome,slug,status,descricao,cidade,instagram,whatsapp,cor_principal,estilo_visual,taxa_entrega,pedido_minimo,logo_url,capa_url,horario_status,horario_mensagem_cliente,horario_dias,entrega,pagamentos'
        );
        if (requestedSlug) {
          empresaQuery = empresaQuery.eq('slug', requestedSlug).eq('status', 'ativa');
        } else if (ownerId) {
          empresaQuery = empresaQuery.eq('user_id', ownerId);
        } else if (defaultSlug) {
          empresaQuery = empresaQuery.eq('slug', defaultSlug).eq('status', 'ativa');
        } else if (defaultId) {
          empresaQuery = empresaQuery.eq('id', defaultId).eq('status', 'ativa');
        } else {
          throw new Error('Configure VITE_DEFAULT_EMPRESA_SLUG para o cardápio público.');
        }

        const { data: empresaData, error: empresaError } = await empresaQuery.maybeSingle();
        if (empresaError || !empresaData) {
          throw new Error(empresaError?.message ?? 'Empresa não encontrada.');
        }
        const empresaId = empresaData.id as string;

        const [{ data: categoriasData }, { data: produtosData }] = await Promise.all([
          supabase.from('categorias').select('id,empresa_id,nome,slug,ordem,ativa').eq('empresa_id', empresaId).order('ordem'),
          supabase.from('produtos').select('id,empresa_id,categoria_id,nome,descricao,preco,categoria,imagem,destaque,disponivel').eq('empresa_id', empresaId).order('criado_em'),
        ]);

        setEmpresa(mapEmpresa(empresaData as Record<string, unknown>));
        // Sempre sobrescreve o estado — array vazio é resultado válido (sem categorias/produtos cadastrados)
        setCategorias((categoriasData ?? []).map(mapCategoria));
        setProdutos((produtosData ?? []).map(mapProduto));
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido.';
        console.error('[MenuStore] Falha ao carregar dados do Supabase:', msg);
        setErro('Falha de conexão ao carregar o cardápio. Tente recarregar a página.');
      } finally {
        setLoading(false);
      }
    }
    void fetchAll();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void fetchAll();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<MenuStoreContextValue>(
    () => ({ empresa, categorias, produtos, loading, erro, setEmpresa, setCategorias, setProdutos }),
    [empresa, categorias, produtos, loading, erro],
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
