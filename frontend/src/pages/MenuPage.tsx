import { useMemo, useState } from 'react';
import { MenuCard } from '../components/MenuCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { buildWhatsAppOrderUrl, menuCatalogService } from '../services';
import type { CartItem, MenuCategory, MenuItem } from '../types/menu';
import { useMenuStore } from '../context/MenuStoreContext';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function MenuPage() {
  usePageTitle('Cardápio');

  const menuCatalog = menuCatalogService.getDemoCatalog();
  const { categoriasNomes: menuCategories, restaurant: demoRestaurant } = menuCatalog;

  const { produtos } = useMenuStore();

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
                className="mt-5 w-full rounded-full bg-brand-500 px-5 py-3 text-center text-sm font-black text-white hover:bg-brand-600"
              >
                Finalizar Pedido
              </button>
            </div>
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
          compact
        />
      </div>
    </section>
  );
}

// CartSummary igual ao original

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
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => onDecrement(item.product.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-slate-700"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onIncrement(item.product.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {currencyFormatter.format(item.product.preco * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Itens</span>
            <span className="font-bold text-slate-900">{cartItems.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-bold text-slate-900">{currencyFormatter.format(subtotal)}</span>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {!compact ? (
          <label className="block text-sm font-bold text-slate-700">
            Observação do pedido
            <textarea
              value={orderNote}
              onChange={(event) => onOrderNoteChange(event.target.value)}
              placeholder="Ex: Tirar a cebola, maionese à parte, ponto da carne..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            />
          </label>
        ) : null}

        {checkoutMessage ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{checkoutMessage}</p>
        ) : null}

        <button
          type="button"
          onClick={onCheckout}
          className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white hover:bg-brand-700"
        >
          Finalizar Pedido no WhatsApp
        </button>
      </div>
    </div>
  );
}
