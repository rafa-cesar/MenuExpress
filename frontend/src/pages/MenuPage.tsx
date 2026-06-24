import { useMemo, useState } from 'react';
import { MenuCard } from '../components/MenuCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useStoreStatus } from '../hooks/useStoreStatus';
import { useBrand } from '../hooks/useBrand';
import { buildWhatsAppOrderUrl, menuCatalogService } from '../services';
import type { CartItem, MenuCategory, MenuItem } from '../types/menu';
import { useMenuStore } from '../context/MenuStoreContext';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MOTIVO_LABEL: Record<string, string> = {
  forcar_fechado: 'A loja está temporariamente fechada.',
  horario_fechado: 'A loja está fechada no momento. Confira nosso horário de funcionamento.',
  dia_inativo: 'Não abrimos neste dia da semana.',
};

export function MenuPage() {
  usePageTitle('Cardápio');

  const menuCatalog = menuCatalogService.getDemoCatalog();
  const { categoriasNomes: menuCategories } = menuCatalog;
  const { empresa, produtos } = useMenuStore();
  const storeStatus = useStoreStatus();
  const brand = useBrand(empresa.corPrincipal, empresa.estiloVisual);

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('Promoções');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const filteredItems = useMemo(
    () => produtos.filter((item) => item.categoria === selectedCategory),
    [produtos, selectedCategory],
  );
  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.product.preco * item.quantity, 0),
    [cartItems],
  );
  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  function getProductQuantity(productId: string) {
    return cartItems.find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  function addProduct(product: MenuItem) {
    if (!storeStatus.aberta) return;
    setCartItems((cur) => {
      const exists = cur.some((i) => i.product.id === product.id);
      if (exists) return cur.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...cur, { product, quantity: 1 }];
    });
  }
  function incrementProduct(id: string) {
    setCartItems((cur) => cur.map((i) => i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  }
  function decrementProduct(id: string) {
    setCartItems((cur) => cur.map((i) => i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0));
  }
  function removeProduct(id: string) {
    setCartItems((cur) => cur.filter((i) => i.product.id !== id));
  }

  function buildCheckoutMessage() {
    const formattedItems = cartItems.map((item) =>
      [`* Produto: ${item.product.nome}`, `* Quantidade: ${item.quantity}`, `* Subtotal: ${currencyFormatter.format(item.product.preco * item.quantity)}`].join('\n')
    ).join('\n\n');
    return ['Olá! Gostaria de fazer um pedido.', '', 'Itens:', '', formattedItems, '', 'Observação:', orderNote.trim() || 'Sem observações.', '', 'Total:', currencyFormatter.format(subtotal), '', 'Dados para finalizar:', 'Nome:', 'Endereço:', 'Forma de pagamento:', 'Troco para:'].join('\n');
  }

  function handleCheckout() {
    if (!storeStatus.aberta) { setCheckoutMessage(MOTIVO_LABEL[storeStatus.motivo] ?? 'A loja está fechada no momento.'); return; }
    if (cartItems.length === 0) { setCheckoutMessage('Adicione pelo menos um produto ao carrinho antes de finalizar o pedido.'); return; }
    setCheckoutMessage('');
    window.open(buildWhatsAppOrderUrl(empresa.whatsapp, buildCheckoutMessage()), '_blank', 'noopener,noreferrer');
  }

  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };
  const btnStyleDark = { backgroundColor: brand.primaryDark, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  return (
    <section className="bg-slate-50 pb-72 lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {!storeStatus.aberta && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-black text-red-700">🔴 {MOTIVO_LABEL[storeStatus.motivo] ?? 'Loja fechada no momento.'}</p>
            {storeStatus.mensagem && <p className="mt-1 text-sm text-red-600">{storeStatus.mensagem}</p>}
          </div>
        )}
        {storeStatus.aberta && storeStatus.mensagem && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-black text-amber-700">⚠️ Aviso</p>
            <p className="mt-1 text-sm text-amber-600">{storeStatus.mensagem}</p>
          </div>
        )}

        {/* Hero com gradiente e identidade da marca */}
        <div className="overflow-hidden rounded-[2rem] text-white shadow-2xl" style={{ background: brand.heroGradient }}>
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {empresa.logoUrl ? (
                  <img src={empresa.logoUrl} alt={`Logo ${empresa.nome}`} className="h-14 w-14 rounded-2xl bg-white object-cover p-1 shadow-lg" />
                ) : null}
                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: `${brand.primary}33`, color: '#ffffff' }}>
                  Cardápio digital
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${ storeStatus.aberta ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100' }`}>
                  {storeStatus.aberta ? '🟢 Aberta' : '🔴 Fechada'}
                </span>
              </div>
              <h1 className={`mt-4 text-4xl sm:text-5xl ${brand.titleClass}`}>{empresa.nome}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{empresa.descricao}</p>
              <p className="mt-4 text-sm font-semibold text-white/75">📍 {empresa.cidade}</p>
            </div>
            <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <p className="text-sm font-semibold text-white/80">Seu pedido agora</p>
              <p className="mt-3 text-3xl font-black">{currencyFormatter.format(subtotal)}</p>
              <p className="mt-2 text-sm text-white/75">{totalItems} item(ns) selecionado(s)</p>
              <button type="button" onClick={handleCheckout} disabled={!storeStatus.aberta} className="mt-5 w-full px-5 py-3 text-center text-sm font-black disabled:cursor-not-allowed disabled:opacity-50" style={storeStatus.aberta ? btnStyle : { ...btnStyle, opacity: 0.5 }}>
                {storeStatus.aberta ? 'Finalizar Pedido' : 'Loja Fechada'}
              </button>
            </div>
          </div>
        </div>

        {/* Barra de categorias com cor da marca */}
        <div className="sticky top-0 z-20 -mx-4 mt-6 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:justify-center sm:pb-0">
            {menuCategories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button key={category} type="button" onClick={() => setSelectedCategory(category)}
                  className="shrink-0 px-4 py-2 text-sm font-black transition"
                  style={isActive
                    ? { ...btnStyle, boxShadow: `0 4px 20px ${brand.primary}44` }
                    : { backgroundColor: '#ffffff', color: '#334155', borderRadius: brand.buttonRadius }
                  }
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide" style={{ color: brand.primary }}>Categoria</p>
                <h2 className="text-2xl font-black text-slate-950">{selectedCategory}</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">{filteredItems.length} produto(s)</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} quantity={getProductQuantity(item.id)}
                  onAdd={storeStatus.aberta ? addProduct : () => {}}
                  onIncrement={incrementProduct} onDecrement={decrementProduct} disabled={!storeStatus.aberta}
                />
              ))}
            </div>
          </div>

          <aside className="hidden h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl lg:sticky lg:top-24 lg:block">
            <CartSummary cartItems={cartItems} subtotal={subtotal} orderNote={orderNote} checkoutMessage={checkoutMessage}
              storeAberta={storeStatus.aberta} brand={brand}
              onOrderNoteChange={setOrderNote} onCheckout={handleCheckout}
              onIncrement={incrementProduct} onDecrement={decrementProduct} onRemove={removeProduct}
            />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.16)] lg:hidden">
        <CartSummary cartItems={cartItems} subtotal={subtotal} orderNote={orderNote} checkoutMessage={checkoutMessage}
          storeAberta={storeStatus.aberta} brand={brand}
          onOrderNoteChange={setOrderNote} onCheckout={handleCheckout}
          onIncrement={incrementProduct} onDecrement={decrementProduct} onRemove={removeProduct} compact
        />
      </div>

      <div className="px-4 pb-6 pt-8 text-center text-xs text-slate-400">
        Powered by <strong>Yellow Tech</strong> &mdash; MenuExpress
      </div>
    </section>
  );
}

type CartSummaryProps = {
  cartItems: CartItem[]; subtotal: number; orderNote: string; checkoutMessage: string;
  storeAberta: boolean; brand: ReturnType<typeof useBrand>; compact?: boolean;
  onOrderNoteChange: (v: string) => void; onCheckout: () => void;
  onIncrement: (id: string) => void; onDecrement: (id: string) => void; onRemove: (id: string) => void;
};

function CartSummary({ cartItems, subtotal, orderNote, checkoutMessage, storeAberta, brand, compact = false, onOrderNoteChange, onCheckout, onIncrement, onDecrement, onRemove }: CartSummaryProps) {
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Carrinho</h2>
          <p className="text-sm text-slate-500">Subtotal e total geral</p>
        </div>
        <p className="text-xl font-black" style={{ color: brand.primary }}>{currencyFormatter.format(subtotal)}</p>
      </div>

      {!compact ? (
        <div className="mt-5 space-y-4">
          {cartItems.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              {storeAberta ? 'Seu carrinho está vazio. Adicione produtos para montar o pedido.' : '🔴 A loja está fechada no momento.'}
            </p>
          ) : (
            cartItems.map((item) => (
              <div key={item.product.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.product.nome}</p>
                    <p className="text-sm text-slate-500">{currencyFormatter.format(item.product.preco)}</p>
                  </div>
                  <button type="button" onClick={() => onRemove(item.product.id)} className="text-xs font-bold text-red-500 hover:text-red-600">Remover</button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                    <button type="button" onClick={() => onDecrement(item.product.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-slate-700 shadow-sm">−</button>
                    <span className="w-6 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                    <button type="button" onClick={() => onIncrement(item.product.id)} className="flex h-7 w-7 items-center justify-center text-sm font-black shadow-sm" style={{ backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: '50%' }}>+</button>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{currencyFormatter.format(item.product.preco * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Itens</span><span className="font-bold text-slate-900">{cartItems.length}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-bold" style={{ color: brand.primary }}>{currencyFormatter.format(subtotal)}</span></div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {!compact ? (
          <label className="block text-sm font-bold text-slate-700">
            Observação do pedido
            <textarea value={orderNote} onChange={(e) => onOrderNoteChange(e.target.value)} disabled={!storeAberta}
              placeholder={storeAberta ? 'Ex: Tirar a cebola, maionese à parte...' : 'Loja fechada no momento.'}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400"
              style={{ ['--tw-ring-color' as string]: brand.primary }}
            />
          </label>
        ) : null}
        {checkoutMessage ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{checkoutMessage}</p> : null}
        <button type="button" onClick={onCheckout} disabled={!storeAberta} className="w-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50" style={btnStyle}>
          {storeAberta ? 'Finalizar Pedido no WhatsApp' : '🔴 Loja Fechada'}
        </button>
      </div>
    </div>
  );
}
