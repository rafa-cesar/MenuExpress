import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MenuCard } from '../components/MenuCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useStoreStatus } from '../hooks/useStoreStatus';
import { useBrand } from '../hooks/useBrand';
import { useMenuStore } from '../context/MenuStoreContext';
import { useCart } from '../context/CartContext';
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
  const navigate = useNavigate();

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
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_55%,#f8fafc_100%)] pb-24 lg:pb-12">
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        {!storeStatus.aberta && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-black text-red-700">🔴 {MOTIVO_LABEL[storeStatus.motivo] ?? 'Loja fechada.'}</p>
            {storeStatus.mensagem && <p className="mt-1 text-sm text-red-600">{storeStatus.mensagem}</p>}
          </div>
        )}

        {/* Hero */}
        <div className="relative isolate overflow-hidden rounded-[2rem] text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]" style={{ background: brand.heroGradient }}>
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/15 bg-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-black/15 blur-2xl" />
          <div className="relative grid gap-4 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
            <div>
              <div className="mb-3 flex items-center gap-3 sm:mb-5 sm:items-end sm:gap-4">
                <EmpresaAvatar logoUrl={empresaData.logoUrl} nome={empresaData.nome} />
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur sm:px-3 sm:text-xs">Cardápio digital</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                    storeStatus.aberta ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'
                  }`}>{storeStatus.aberta ? '🟢 Aberta' : '🔴 Fechada'}</span>
                </div>
              </div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl ${brand.titleClass}`}>{empresaData.nome}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:mt-4 sm:text-base sm:leading-7">{empresaData.descricao}</p>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur">📍 {empresaData.cidade}</span>
                {cfg?.retiradaAtiva && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90">🏠 Retirada disponível</span>}
                {cfg?.entregaAtiva  && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90">🚚 Entrega — {fmt.format(getDeliveryFee(empresaData))}</span>}
              </div>
            </div>

            {/* Mini carrinho no hero */}
            <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 p-4 sm:p-5 lg:block" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55 sm:text-xs">Seu pedido</p>
                <p className="mt-1 text-2xl font-black sm:text-3xl lg:mt-3">{fmt.format(subtotal)}</p>
                <p className="text-[11px] text-white/55 lg:mt-1">{totalItems} item(ns) · sem taxa</p>
              </div>
              <button type="button"
                onClick={() => storeStatus.aberta && items.length > 0 && navigate({ to: '/checkout/carrinho' })}
                disabled={!storeStatus.aberta || items.length === 0}
                className="shrink-0 px-4 py-3 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm lg:mt-5 lg:w-full"
                style={btnStyle}>
                {!storeStatus.aberta ? 'Loja Fechada' : items.length === 0 ? 'Adicione produtos' : `Ver carrinho (${totalItems})`}
              </button>
            </div>
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: brand.primary }}>Explore o cardápio</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{activeCategory ?? ''}</h2>
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
