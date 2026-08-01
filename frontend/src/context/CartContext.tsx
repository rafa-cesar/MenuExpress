import { createContext, ReactNode, useContext, useEffect, useState, useMemo } from 'react';
import type { CartItem } from '../types/menu';
import type { ModalidadeEntrega, FormaPagamento } from '../types/domain';

export interface CartContextValue {
  items: CartItem[];
  modalidade: ModalidadeEntrega;
  formaPagamento: FormaPagamento;
  observacao: string;
  add: (item: import('../types/menu').MenuItem) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  rem: (id: string) => void;
  clear: () => void;
  setModalidade: (m: ModalidadeEntrega) => void;
  setFormaPagamento: (f: FormaPagamento) => void;
  setObservacao: (o: string) => void;
  qty: (id: string) => number;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const CART_STORAGE_KEY = 'menuexpress:carrinho';

function carregarCarrinho(): CartItem[] {
  try {
    const salvo = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!salvo) return [];
    const itens = JSON.parse(salvo) as unknown;
    if (!Array.isArray(itens)) return [];
    return itens.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') return false;
      const candidato = item as Partial<CartItem>;
      return Boolean(
        candidato.product &&
        typeof candidato.product.id === 'string' &&
        typeof candidato.product.preco === 'number' &&
        Number.isInteger(candidato.quantity) &&
        Number(candidato.quantity) > 0
      );
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(carregarCarrinho);
  const [modalidade, setModalidade] = useState<ModalidadeEntrega>('retirada');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    try {
      if (items.length) window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      else window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // O carrinho continua funcional mesmo se o navegador bloquear o armazenamento.
    }
  }, [items]);

  const add = (product: import('../types/menu').MenuItem) =>
    setItems(cur =>
      cur.some(i => i.product.id === product.id)
        ? cur.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...cur, { product, quantity: 1 }]
    );
  const inc = (id: string) => setItems(cur => cur.map(i => i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  const dec = (id: string) => setItems(cur => cur.map(i => i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  const rem = (id: string) => setItems(cur => cur.filter(i => i.product.id !== id));
  const clear = () => { setItems([]); setObservacao(''); };
  const qty = (id: string) => items.find(i => i.product.id === id)?.quantity ?? 0;

  const subtotal = useMemo(() => items.reduce((t, i) => t + i.product.preco * i.quantity, 0), [items]);
  const totalItems = useMemo(() => items.reduce((t, i) => t + i.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(() => ({
    items, modalidade, formaPagamento, observacao,
    add, inc, dec, rem, clear, setModalidade, setFormaPagamento, setObservacao,
    qty, subtotal, totalItems,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [items, modalidade, formaPagamento, observacao, subtotal, totalItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
