import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MenuCard } from '../components/MenuCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useStoreStatus } from '../hooks/useStoreStatus';
import { useBrand } from '../hooks/useBrand';
import { useMenuStore } from '../context/MenuStoreContext';
import { useCart } from '../context/CartContext';
import { useClienteAuth } from '../context/ClienteAuthContext';
import type { MenuCategory, MenuItem } from '../types/menu';
import { getDeliveryFee } from '../services/delivery';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MOTIVO_LABEL: Record<string, string> = {
  forcar_fechado: 'A loja está temporariamente fechada.',
  horario_fechado: 'A loja está fechada no momento.',
  dia_inativo: 'Não abrimos neste dia da semana.',
};

function EmpresaAvatar({ logoUrl, nome }: { logoUrl?: string | null; nome: string }) {
  const initials = nome.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  if (logoUrl) {
    return (
      <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
        <div className="absolute inset-0 rounded-[1.15rem] shadow-[0_10px_30px_rgba(0,0,0,0.28)]" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }} />
        <img src={logoUrl} alt={`Logo ${nome}`} width={96} height={96} loading="lazy"
          className="relative h-full w-full rounded-[1.15rem] border-2 border-white/40 bg-white object-cover shadow-lg" />
      </div>
    );
  }
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.15rem] border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.35)] sm:h-20 sm:w-20 lg:h-24 lg:w-24"
      style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }} aria-label={`Logomarca de ${nome}`}>
      <span className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">{initials}</span>
    </div>
  );
}

export function MenuPage() {
  usePageTitle('Cardápio');
  const { empresa, produtos, categorias, loading, erro } = useMenuStore();
  const storeStatus = useStoreStatus();
  const { add, dec, qty, items, subtotal, totalItems } = useCart();
  const { user, perfil, loading: authLoading, logout } = useClienteAuth();
  const navigate = useNavigate();
  const isAdminPreview = window.location.pathname.startsWith('/admin');

  const menuCategories = categorias.map(c => c.nome) as MenuCategory[];
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);

  const brand = useBrand(empresa?.corPrincipal ?? '#f97316', empresa?.estiloVisual ?? 'moderno');
  const cfg = empresa?.entrega;

  useEffect(() => {
    if (menuCategories.length > 0 && selectedCategory === null) setSelectedCategory(menuCategories[0]);
  }, [menuCategories, selectedCategory]);

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Carregando cardápio...</p>
        </div>
      </section>
    );
  }

  if (erro || !empresa) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
          <h1 className="mt-5 text-xl font-black text-slate-900">Cardápio indisponível</h1>
          <p className="mt-2 text-sm text-slate-500">{erro ?? 'Não foi possível carregar os dados da loja.'}</p>
          <button type="button" onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-700">
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  const empresaData = empresa;
  const activeCategory = selectedCategory ?? menuCategories[0] ?? null;
  const filteredItems = produtos.filter(item => item.categoria === activeCategory);
  const featuredItem = produtos.find(item => item.destaque) ?? produtos[0];
  const coverImage = empresaData.capaUrl || featuredItem?.imagem;
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_55%,#f8fafc_100%)] pb-24 lg:pb-12">
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        {!isAdminPreview && !authLoading && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm sm:px-4">
            {user ? (
              <>
                <div className="flex min-w-0 items-center gap-2.5">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Foto da conta" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black"
                      style={{ backgroundColor: brand.primary, color: brand.onPrimary }}>
                      {(perfil?.nome || user.email || 'C')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Conectado como</p>
                    <p className="truncate text-xs font-black text-slate-800 sm:text-sm">{perfil?.nome || user.user_metadata?.full_name || user.email}</p>
                    {perfil?.nome && <p className="truncate text-[10px] text-slate-400">{user.email}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => navigate({ to: '/minha-area' })}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-200">
                    Minha área
                  </button>
                  <button type="button" onClick={() => void logout()}
                    className="rounded-xl px-3 py-2 text-[11px] font-black text-red-500 hover:bg-red-50">
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-black text-slate-800">Você ainda não está conectado</p>
                  <p className="text-[10px] text-slate-400">Entre para acompanhar seus pedidos.</p>
                </div>
                <button type="button" onClick={() => navigate({ to: '/checkout/auth' })}
                  className="shrink-0 px-4 py-2 text-xs font-black"
                  style={btnStyle}>
                  Entrar
                </button>
              </>
            )}
          </div>
        )}
        {!storeStatus.aberta && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-black text-red-700">🔴 {MOTIVO_LABEL[storeStatus.motivo] ?? 'Loja fechada.'}</p>
            {storeStatus.mensagem && <p className="mt-1 text-sm text-red-600">{storeStatus.mensagem}</p>}
          </div>
        )}

        {/* Hero */}
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[#fffdfa] shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[43%] bg-slate-100 sm:w-[46%]">
            {coverImage && <img src={coverImage} alt={`Capa de ${empresaData.nome}`} className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-[#fffdfa] via-[#fffdfa]/20 to-transparent" />
          </div>
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[18px] opacity-80" style={{ borderColor: brand.primary }} />
          <div className="relative max-w-[72%] p-5 pb-4 sm:max-w-[68%] sm:p-8 lg:max-w-[62%] lg:p-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <EmpresaAvatar logoUrl={empresaData.logoUrl} nome={empresaData.nome} />
              <div className="min-w-0">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black sm:text-xs ${storeStatus.aberta ? 'text-emerald-700' : 'text-red-600'}`}>
                  <span className={`h-2 w-2 rounded-full ${storeStatus.aberta ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {storeStatus.aberta ? 'Aberta agora' : 'Fechada'}
                </span>
              </div>
            </div>

            <div className="my-5 h-px w-14 sm:my-6" style={{ backgroundColor: brand.primary }} />
            <h1 className="max-w-sm font-serif text-[2rem] font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{empresaData.nome}</h1>
            <p className="mt-4 line-clamp-3 max-w-md text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6 lg:text-base">{empresaData.descricao}</p>
            <div className="mt-4 flex flex-col items-start gap-1 text-[10px] font-bold text-slate-500 sm:flex-row sm:flex-wrap sm:gap-3 sm:text-xs">
              <span>📍 {empresaData.cidade}</span>
              {cfg?.retiradaAtiva && <span>Retirada disponível</span>}
              {cfg?.entregaAtiva && <span>Entrega · {fmt.format(getDeliveryFee(empresaData))}</span>}
            </div>
          </div>

          <div className="relative mx-4 mb-4 flex items-center gap-3 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur sm:mx-8 sm:mb-7 sm:p-4 lg:absolute lg:bottom-8 lg:right-8 lg:m-0 lg:w-72 lg:block">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Seu pedido</p>
              <p className="mt-0.5 text-xl font-black text-slate-950 sm:text-2xl">{fmt.format(subtotal)}</p>
              <p className="text-[10px] text-slate-400">{totalItems} item(ns) · sem taxa</p>
            </div>
            <button type="button"
              onClick={() => storeStatus.aberta && items.length > 0 && navigate({ to: '/checkout/carrinho' })}
              disabled={!storeStatus.aberta || items.length === 0}
              className="shrink-0 px-4 py-2.5 text-[11px] font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:text-xs lg:mt-3 lg:w-full"
              style={btnStyle}>
              {!storeStatus.aberta ? 'Loja Fechada' : items.length === 0 ? 'Escolha um item' : `Ver carrinho (${totalItems})`}
            </button>
          </div>
        </div>

        {/* Categorias */}
        {menuCategories.length > 0 && (
          <div className="sticky top-0 z-20 -mx-3 mt-4 border-y border-slate-200/70 bg-white/90 px-3 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:mx-0 sm:mt-6 sm:rounded-full sm:border sm:px-4">
            <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:pb-0">
              {menuCategories.map(category => {
                const isActive = activeCategory === category;
                return (
                  <button key={category} type="button" onClick={() => setSelectedCategory(category)}
                    className="shrink-0 snap-start px-4 py-2.5 text-sm font-black transition active:scale-95"
                    style={isActive ? { ...btnStyle, boxShadow: `0 6px 22px ${brand.primary}35` } : { backgroundColor: '#f1f5f9', color: '#475569', borderRadius: brand.buttonRadius }}>
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Produtos */}
        <div className="mt-5 sm:mt-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{activeCategory ?? ''}</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">{filteredItems.length} produto(s)</span>
          </div>
          {filteredItems.length === 0 && !loading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm text-slate-500">Nenhum produto disponível nesta categoria.</p>
            </div>
          )}
          <div className="grid gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => (
              <MenuCard key={item.id} item={item} quantity={qty(item.id)}
                onAdd={storeStatus.aberta ? (p: MenuItem) => add(p) : () => {}}
                onIncrement={id => { const i = items.find(x => x.product.id === id); if (i) add(i.product); }}
                onDecrement={id => dec(id)}
                disabled={!storeStatus.aberta}
                accentColor={brand.primary}
                accentOnColor={brand.onPrimary}
                buttonRadius={brand.buttonRadius}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FAB mobile — Ver carrinho */}
      {items.length > 0 && storeStatus.aberta && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/85 p-3 shadow-[0_-16px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:hidden">
          <button onClick={() => navigate({ to: '/checkout/carrinho' })}
            className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-3.5 text-sm font-black transition active:scale-[0.98]"
            style={btnStyle}>
            <span>Ver carrinho <span className="ml-1 rounded-full bg-black/10 px-2 py-1 text-xs">{totalItems}</span></span>
            <span>{fmt.format(subtotal)} →</span>
          </button>
        </div>
      )}

      <div className="px-4 pb-6 pt-10 text-center">
        <p className="text-xs text-slate-400">Cardápio digital por <strong className="text-slate-500">YellowTech</strong></p>
      </div>
    </section>
  );
}
