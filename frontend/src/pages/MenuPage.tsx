import { useMemo, useState } from 'react';
import { MenuCard } from '../components/MenuCard';
import { useEmpresaConfig } from '../hooks/useEmpresaConfig';
import { usePageTitle } from '../hooks/usePageTitle';
import { buildWhatsAppOrderUrl, menuCatalogService } from '../services';
import type { CartItem, MenuCategory, MenuItem } from '../types/menu';
import { getStoreOpenStatus } from '../utils/openingHours';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function MenuPage() {
  usePageTitle('Cardápio');

  const menuCatalog = menuCatalogService.getDemoCatalog();
  const { categoriasNomes: menuCategories, produtos: demoMenuItems, restaurant: demoRestaurant } = menuCatalog;
  const { empresa } = useEmpresaConfig();
  const storeStatus = getStoreOpenStatus(empresa);

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('Promoções');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const filteredItems = useMemo(
    () => demoMenuItems.filter((item) => item.categoria === selectedCategory),
    [demoMenuItems, selectedCategory],
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
    setCartItems((currentItems) => {
      const productAlreadyInCart = currentItems.some((item) => item.product.id === product.id);

      if (productAlreadyInCart) {
        return currentItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...currentItems, { product, quantity: 1 }];
    });
  }

  function incrementProduct(productId: string) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  function decrementProduct(productId: string) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeProduct(productId: string) {
    setCartItems((currentItems) => currentItems.filter((item) => item.product.id !== productId));
  }

  function buildCheckoutMessage() {
    const formattedItems = cartItems
      .map((item) =>
        [
          `* Produto: ${item.product.nome}`,
          `* Quantidade: ${item.quantity}`,
          `* Subtotal: ${currencyFormatter.format(item.product.preco * item.quantity)}`,
        ].join('\n'),
      )
      .join('\n\n');

    return [
      'Olá! Gostaria de fazer um pedido.',
      '',
      'Itens:',
      '',
      formattedItems,
      '',
      'Observação:',
      orderNote.trim() || 'Sem observações.',
      '',
      'Total:',
      currencyFormatter.format(subtotal),
      '',
      'Dados para finalizar:',
      'Nome:',
      'Endereço:',
      'Forma de pagamento:',
      'Troco para:',
    ].join('\n');
  }

  function handleCheckout() {
    if (!storeStatus.isOpen) {
      setCheckoutMessage('Estamos fechados no momento. Volte no horário de funcionamento.');
      return;
    }

    if (cartItems.length === 0) {
      setCheckoutMessage('Adicione pelo menos um produto ao carrinho antes de finalizar o pedido.');
      return;
    }

    setCheckoutMessage('');
    const whatsappUrl = buildWhatsAppOrderUrl(demoRestaurant.whatsapp, buildCheckoutMessage());
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="bg-slate-50 pb-72 lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-brand-100">Cardápio digital</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{demoRestaurant.name}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">{demoRestaurant.description}</p>
              <p className="mt-4 text-sm font-semibold text-slate-300">📍 {demoRestaurant.city}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-slate-200">Seu pedido agora</p>
              <p className="mt-3 text-3xl font-black">{currencyFormatter.format(subtotal)}</p>
              <p className="mt-2 text-sm text-slate-300">{totalItems} item(ns) selecionado(s)</p>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!storeStatus.isOpen}
                className="mt-5 w-full rounded-full bg-brand-500 px-5 py-3 text-center text-sm font-black text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                Finalizar Pedido
              </button>
            </div>
          </div>
        </div>

        <div className={`mt-6 rounded-[2rem] border p-5 shadow-sm ${
          storeStatus.isOpen ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-lg font-black ${storeStatus.isOpen ? 'text-emerald-700' : 'text-red-700'}`}>
                {storeStatus.isOpen ? 'Loja aberta agora' : 'Loja fechada no momento'}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700">Horário de hoje: {storeStatus.todayScheduleLabel}</p>
              <p className="mt-2 text-sm text-slate-600">{empresa.mensagemCliente}</p>
            </div>
            {!storeStatus.isOpen ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-red-700">
                Estamos fechados no momento. Volte no horário de funcionamento.
              </p>
            ) : null}
          </div>
        </div>

        <div className="sticky top-0 z-20 -mx-4 mt-6 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:justify-center sm:pb-0">
            {menuCategories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                    isActive ? 'bg-slate-950 text-white shadow-lg' : 'bg-white text-slate-700 hover:text-brand-600'
                  }`}
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
                <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Categoria</p>
                <h2 className="text-2xl font-black text-slate-950">{selectedCategory}</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
                {filteredItems.length} produto(s)
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  quantity={getProductQuantity(item.id)}
                  onAdd={addProduct}
                  onIncrement={incrementProduct}
                  onDecrement={decrementProduct}
                  disabled={!storeStatus.isOpen}
                />
              ))}
            </div>
          </div>

          <aside className="hidden h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl lg:sticky lg:top-24 lg:block">
            <CartSummary
              cartItems={cartItems}
              subtotal={subtotal}
              orderNote={orderNote}
              checkoutMessage={checkoutMessage}
              onOrderNoteChange={setOrderNote}
              onCheckout={handleCheckout}
              onIncrement={incrementProduct}
              onDecrement={decrementProduct}
              onRemove={removeProduct}
              isStoreOpen={storeStatus.isOpen}
            />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.16)] lg:hidden">
        <CartSummary
          cartItems={cartItems}
          subtotal={subtotal}
          orderNote={orderNote}
          checkoutMessage={checkoutMessage}
          onOrderNoteChange={setOrderNote}
          onCheckout={handleCheckout}
          onIncrement={incrementProduct}
          onDecrement={decrementProduct}
          onRemove={removeProduct}
          isStoreOpen={storeStatus.isOpen}
          compact
        />
      </div>
    </section>
  );
}

type CartSummaryProps = {
  cartItems: CartItem[];
  subtotal: number;
  orderNote: string;
  checkoutMessage: string;
  compact?: boolean;
  onOrderNoteChange: (value: string) => void;
  onCheckout: () => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  isStoreOpen: boolean;
};

function CartSummary({
  cartItems,
  subtotal,
  orderNote,
  checkoutMessage,
  compact = false,
  onOrderNoteChange,
  onCheckout,
  onIncrement,
  onDecrement,
  onRemove,
  isStoreOpen,
}: CartSummaryProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Carrinho</h2>
          <p className="text-sm text-slate-500">Subtotal e total geral</p>
        </div>
        <p className="text-xl font-black text-slate-950">{currencyFormatter.format(subtotal)}</p>
      </div>

      {!compact ? (
        <div className="mt-5 space-y-4">
          {cartItems.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Seu carrinho está vazio. Adicione produtos para montar o pedido.
            </p>
          ) : (
            cartItems.map((item) => (
              <div key={item.product.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.product.nome}</p>
                    <p className="text-sm text-slate-500">{currencyFormatter.format(item.product.preco)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.product.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-full bg-slate-100 p-1">
                    <button type="button" onClick={() => onDecrement(item.product.id)} className="size-8 rounded-full bg-white font-black">
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                    <button type="button" onClick={() => onIncrement(item.product.id)} className="size-8 rounded-full bg-slate-950 font-black text-white">
                      +
                    </button>
                  </div>
                  <p className="font-black text-slate-950">
                    {currencyFormatter.format(item.product.preco * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{currencyFormatter.format(subtotal)}</span>
        </div>
        <div className="flex justify-between text-base font-black text-slate-950">
          <span>Total geral</span>
          <span>{currencyFormatter.format(subtotal)}</span>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor={compact ? 'order-note-mobile' : 'order-note-desktop'} className="text-sm font-black text-slate-950">
          Observação do pedido
        </label>
        <textarea
          id={compact ? 'order-note-mobile' : 'order-note-desktop'}
          value={orderNote}
          onChange={(event) => onOrderNoteChange(event.target.value)}
          rows={compact ? 2 : 4}
          placeholder="Ex.: sem cebola, ponto da carne, retirar molho..."
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
      </div>

      {checkoutMessage ? (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600" role="alert">
          {checkoutMessage}
        </p>
      ) : null}

      {!isStoreOpen ? (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          Estamos fechados no momento. Volte no horário de funcionamento.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onCheckout}
        disabled={!isStoreOpen}
        className="mt-4 w-full rounded-full bg-brand-600 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-orange-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        Finalizar Pedido
      </button>
    </div>
  );
}
