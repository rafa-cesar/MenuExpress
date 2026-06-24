import { useMemo, useState } from 'react';
import { MenuCard } from '../components/MenuCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useStoreStatus } from '../hooks/useStoreStatus';
import { useBrand } from '../hooks/useBrand';
import { buildWhatsAppOrderUrl, menuCatalogService } from '../services';
import { pedidosService } from '../services/pedidosService';
import type { CartItem, MenuCategory, MenuItem } from '../types/menu';
import type { ModalidadeEntrega } from '../types/domain';
import { useMenuStore } from '../context/MenuStoreContext';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MOTIVO_LABEL: Record<string, string> = {
  forcar_fechado: 'A loja está temporariamente fechada.',
  horario_fechado: 'A loja está fechada no momento.',
  dia_inativo: 'Não abrimos neste dia da semana.',
};

export function MenuPage() {
  usePageTitle('Cardápio');
  const menuCatalog = menuCatalogService.getDemoCatalog();
  const { categoriasNomes: menuCategories } = menuCatalog;
  const { empresa, produtos } = useMenuStore();
  const storeStatus = useStoreStatus();
  const brand = useBrand(empresa.corPrincipal, empresa.estiloVisual);

  const cfg = empresa.entrega ?? { retiradaAtiva: true, entregaAtiva: false, taxaEntregaFixa: 0, pedidoMinimoEntrega: 0 };
  const ambasAtivas = cfg.retiradaAtiva && cfg.entregaAtiva;
  const defaultModalidade: ModalidadeEntrega = cfg.entregaAtiva && !cfg.retiradaAtiva ? 'entrega' : 'retirada';

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('Promoções');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [modalidade, setModalidade] = useState<ModalidadeEntrega>(defaultModalidade);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTel, setClienteTel] = useState('');
  const [clienteEnd, setClienteEnd] = useState('');
  const [salvando, setSalvando] = useState(false);

  const filteredItems = useMemo(() => produtos.filter((item) => item.categoria === selectedCategory), [produtos, selectedCategory]);
  const subtotal = useMemo(() => cartItems.reduce((t, i) => t + i.product.preco * i.quantity, 0), [cartItems]);
  const taxa = modalidade === 'entrega' && cfg.entregaAtiva ? cfg.taxaEntregaFixa : 0;
  const total = subtotal + taxa;
  const totalItems = useMemo(() => cartItems.reduce((t, i) => t + i.quantity, 0), [cartItems]);
  const abaixoDoMinimo = modalidade === 'entrega' && cfg.pedidoMinimoEntrega > 0 && subtotal < cfg.pedidoMinimoEntrega;

  function getQty(id: string) { return cartItems.find((i) => i.product.id === id)?.quantity ?? 0; }
  function addProduct(product: MenuItem) {
    if (!storeStatus.aberta) return;
    setCartItems((cur) => cur.some((i) => i.product.id === product.id) ? cur.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...cur, { product, quantity: 1 }]);
  }
  function inc(id: string) { setCartItems((cur) => cur.map((i) => i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i)); }
  function dec(id: string) { setCartItems((cur) => cur.map((i) => i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0)); }
  function rem(id: string) { setCartItems((cur) => cur.filter((i) => i.product.id !== id)); }

  function buildMsg() {
    const itens = cartItems.map((i) => `• ${i.product.nome} x${i.quantity} — ${fmt.format(i.product.preco * i.quantity)}`).join('\n');
    const endLoja = cfg.endereco ? `${cfg.endereco.rua}, ${cfg.endereco.numero}${cfg.endereco.complemento ? ` (${cfg.endereco.complemento})` : ''} — ${cfg.endereco.bairro}, ${cfg.endereco.cidade}` : 'Consultar endereço';
    const linhasEntrega = modalidade === 'entrega'
      ? [`📍 Endereço de entrega: ${clienteEnd || '(não informado)'}`, `🚚 Taxa de entrega: ${fmt.format(taxa)}`]
      : [`🏠 Modalidade: Retirada no local`, `📌 Endereço da loja: ${endLoja}`];
    return [
      `Olá! Gostaria de fazer um pedido. 🛒`,
      ``,
      `👤 Nome: ${clienteNome || '(não informado)'}`,
      `📱 Telefone: ${clienteTel || '(não informado)'}`,
      ``,
      ...linhasEntrega,
      ``,
      `📋 Itens do pedido:`,
      itens,
      ``,
      orderNote.trim() ? `📝 Observação: ${orderNote.trim()}` : null,
      ``,
      `💰 Subtotal: ${fmt.format(subtotal)}`,
      taxa > 0 ? `🚚 Taxa de entrega: ${fmt.format(taxa)}` : null,
      `✅ Total: ${fmt.format(total)}`,
    ].filter(Boolean).join('\n');
  }

  async function handleCheckout() {
    if (!storeStatus.aberta) { setCheckoutMessage(MOTIVO_LABEL[storeStatus.motivo] ?? 'A loja está fechada.'); return; }
    if (cartItems.length === 0) { setCheckoutMessage('Adicione pelo menos um produto ao carrinho.'); return; }
    if (abaixoDoMinimo) { setCheckoutMessage(`Pedido mínimo para entrega é ${fmt.format(cfg.pedidoMinimoEntrega)}.`); return; }
    setCheckoutMessage('');
    setSalvando(true);

    // Salva no banco antes de abrir o WhatsApp
    await pedidosService.criar({
      modalidade,
      clienteNome,
      clienteTel,
      clienteEnd,
      itens: cartItems.map((i) => ({ nome: i.product.nome, quantidade: i.quantity, precoUnitario: i.product.preco, subtotal: i.product.preco * i.quantity })),
      observacao: orderNote,
      subtotal,
      taxaEntrega: taxa,
      total,
    });

    setSalvando(false);
    window.open(buildWhatsAppOrderUrl(empresa.whatsapp, buildMsg()), '_blank', 'noopener,noreferrer');
  }

  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  return (
    <section className="bg-slate-50 pb-72 lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {!storeStatus.aberta && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-black text-red-700">🔴 {MOTIVO_LABEL[storeStatus.motivo] ?? 'Loja fechada.'}</p>
            {storeStatus.mensagem && <p className="mt-1 text-sm text-red-600">{storeStatus.mensagem}</p>}
          </div>
        )}

        {/* Hero */}
        <div className="overflow-hidden rounded-[2rem] text-white shadow-2xl" style={{ background: brand.heroGradient }}>
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {empresa.logoUrl && <img src={empresa.logoUrl} alt={empresa.nome} className="h-14 w-14 rounded-2xl bg-white object-cover p-1 shadow-lg" />}
                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: `${brand.primary}33`, color: '#fff' }}>Cardápio digital</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${storeStatus.aberta ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}`}>
                  {storeStatus.aberta ? '🟢 Aberta' : '🔴 Fechada'}
                </span>
              </div>
              <h1 className={`mt-4 text-4xl sm:text-5xl ${brand.titleClass}`}>{empresa.nome}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{empresa.descricao}</p>
              <p className="mt-4 text-sm font-semibold text-white/75">📍 {empresa.cidade}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {cfg.retiradaAtiva && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90">🏠 Retirada disponível</span>}
                {cfg.entregaAtiva && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90">🚚 Entrega — {fmt.format(cfg.taxaEntregaFixa)}</span>}
              </div>
            </div>
            <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <p className="text-sm font-semibold text-white/80">Seu pedido</p>
              <p className="mt-3 text-3xl font-black">{fmt.format(total)}</p>
              <p className="mt-1 text-xs text-white/60">{totalItems} item(ns) · {taxa > 0 ? `+ ${fmt.format(taxa)} entrega` : 'sem taxa'}</p>
              <button type="button" onClick={handleCheckout} disabled={!storeStatus.aberta || salvando} className="mt-5 w-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50" style={btnStyle}>
                {salvando ? 'Registrando...' : storeStatus.aberta ? 'Finalizar Pedido' : 'Loja Fechada'}
              </button>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="sticky top-0 z-20 -mx-4 mt-6 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:justify-center sm:pb-0">
            {menuCategories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button key={category} type="button" onClick={() => setSelectedCategory(category)} className="shrink-0 px-4 py-2 text-sm font-black transition"
                  style={isActive ? { ...btnStyle, boxShadow: `0 4px 20px ${brand.primary}44` } : { backgroundColor: '#fff', color: '#334155', borderRadius: brand.buttonRadius }}>
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
                <MenuCard key={item.id} item={item} quantity={getQty(item.id)}
                  onAdd={storeStatus.aberta ? addProduct : () => {}}
                  onIncrement={inc} onDecrement={dec} disabled={!storeStatus.aberta}
                />
              ))}
            </div>
          </div>
          <aside className="hidden h-fit lg:sticky lg:top-24 lg:block">
            <CartPanel cartItems={cartItems} subtotal={subtotal} taxa={taxa} total={total} orderNote={orderNote} checkoutMessage={checkoutMessage} storeAberta={storeStatus.aberta} brand={brand} modalidade={modalidade} ambasAtivas={ambasAtivas} cfg={cfg} abaixoDoMinimo={abaixoDoMinimo} salvando={salvando} clienteNome={clienteNome} clienteTel={clienteTel} clienteEnd={clienteEnd} onModalidade={setModalidade} onNome={setClienteNome} onTel={setClienteTel} onEnd={setClienteEnd} onOrderNoteChange={setOrderNote} onCheckout={handleCheckout} onIncrement={inc} onDecrement={dec} onRemove={rem} />
          </aside>
        </div>
      </div>

      {/* Mobile cart */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.16)] lg:hidden">
        <CartPanel compact cartItems={cartItems} subtotal={subtotal} taxa={taxa} total={total} orderNote={orderNote} checkoutMessage={checkoutMessage} storeAberta={storeStatus.aberta} brand={brand} modalidade={modalidade} ambasAtivas={ambasAtivas} cfg={cfg} abaixoDoMinimo={abaixoDoMinimo} salvando={salvando} clienteNome={clienteNome} clienteTel={clienteTel} clienteEnd={clienteEnd} onModalidade={setModalidade} onNome={setClienteNome} onTel={setClienteTel} onEnd={setClienteEnd} onOrderNoteChange={setOrderNote} onCheckout={handleCheckout} onIncrement={inc} onDecrement={dec} onRemove={rem} />
      </div>

      <div className="px-4 pb-6 pt-8 text-center text-xs text-slate-400">
        Powered by <strong>Yellow Tech</strong> — MenuExpress
      </div>
    </section>
  );
}

type CartPanelProps = {
  cartItems: CartItem[]; subtotal: number; taxa: number; total: number;
  orderNote: string; checkoutMessage: string; storeAberta: boolean;
  brand: ReturnType<typeof useBrand>; compact?: boolean; salvando: boolean;
  modalidade: ModalidadeEntrega; ambasAtivas: boolean;
  cfg: NonNullable<ReturnType<typeof useMenuStore>['empresa']['entrega']>;
  abaixoDoMinimo: boolean;
  clienteNome: string; clienteTel: string; clienteEnd: string;
  onModalidade: (v: ModalidadeEntrega) => void;
  onNome: (v: string) => void; onTel: (v: string) => void; onEnd: (v: string) => void;
  onOrderNoteChange: (v: string) => void; onCheckout: () => void;
  onIncrement: (id: string) => void; onDecrement: (id: string) => void; onRemove: (id: string) => void;
};

function CartPanel({ cartItems, subtotal, taxa, total, orderNote, checkoutMessage, storeAberta, brand, compact = false, salvando, modalidade, ambasAtivas, cfg, abaixoDoMinimo, clienteNome, clienteTel, clienteEnd, onModalidade, onNome, onTel, onEnd, onOrderNoteChange, onCheckout, onIncrement, onDecrement, onRemove }: CartPanelProps) {
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };
  const inputClass = 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400';
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="text-lg font-black text-slate-950">Carrinho</h2><p className="text-sm text-slate-500">{cartItems.length} item(ns)</p></div>
        <p className="text-xl font-black" style={{ color: brand.primary }}>{fmt.format(total)}</p>
      </div>
      {ambasAtivas && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(['retirada', 'entrega'] as ModalidadeEntrega[]).map((m) => (
            <button key={m} type="button" onClick={() => onModalidade(m)}
              className={`rounded-2xl border-2 py-3 text-sm font-black transition ${modalidade === m ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
              {m === 'retirada' ? '🏠 Retirada' : '🚚 Entrega'}
            </button>
          ))}
        </div>
      )}
      {!ambasAtivas && <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">{modalidade === 'retirada' ? '🏠 Retirada no local' : '🚚 Entrega em domicílio'}</div>}
      {abaixoDoMinimo && <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">⚠️ Mínimo para entrega: {fmt.format(cfg.pedidoMinimoEntrega)}. Faltam {fmt.format(cfg.pedidoMinimoEntrega - subtotal)}.</p>}
      {!compact && (
        <>
          <div className="mt-4 space-y-3">
            {cartItems.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{storeAberta ? 'Seu carrinho está vazio.' : '🔴 Loja fechada.'}</p>
              : cartItems.map((item) => (
                <div key={item.product.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex justify-between gap-3">
                    <div><p className="font-black text-slate-950">{item.product.nome}</p><p className="text-sm text-slate-500">{fmt.format(item.product.preco)}</p></div>
                    <button type="button" onClick={() => onRemove(item.product.id)} className="text-xs font-bold text-red-500 hover:text-red-600">Remover</button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                      <button type="button" onClick={() => onDecrement(item.product.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm">−</button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button type="button" onClick={() => onIncrement(item.product.id)} className="flex h-7 w-7 items-center justify-center text-sm font-black shadow-sm" style={{ backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: '50%' }}>+</button>
                    </div>
                    <p className="text-sm font-bold">{fmt.format(item.product.preco * item.quantity)}</p>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-sm font-black text-slate-700">Seus dados</p>
            <label className="block text-sm font-bold text-slate-600">Nome<input value={clienteNome} onChange={(e) => onNome(e.target.value)} placeholder="Seu nome" className={inputClass} /></label>
            <label className="block text-sm font-bold text-slate-600">Telefone<input value={clienteTel} onChange={(e) => onTel(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} /></label>
            {modalidade === 'entrega' && <label className="block text-sm font-bold text-slate-600">Endereço de entrega<input value={clienteEnd} onChange={(e) => onEnd(e.target.value)} placeholder="Rua, número, bairro" className={inputClass} /></label>}
            {modalidade === 'retirada' && cfg.endereco && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-black text-slate-600">📌 Endereço para retirada</p>
                <p className="mt-1 text-sm text-slate-700">{cfg.endereco.rua}, {cfg.endereco.numero} — {cfg.endereco.bairro}, {cfg.endereco.cidade}</p>
                {cfg.endereco.complemento && <p className="text-xs text-slate-500">{cfg.endereco.complemento}</p>}
              </div>
            )}
          </div>
          <div className="mt-4 space-y-1 rounded-2xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-bold">{fmt.format(subtotal)}</span></div>
            {taxa > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Taxa de entrega</span><span className="font-bold">{fmt.format(taxa)}</span></div>}
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-black text-slate-900">Total</span><span className="font-black" style={{ color: brand.primary }}>{fmt.format(total)}</span></div>
          </div>
          <label className="mt-4 block text-sm font-bold text-slate-600">Observação
            <textarea value={orderNote} onChange={(e) => onOrderNoteChange(e.target.value)} disabled={!storeAberta} rows={2} placeholder="Ex: tirar a cebola..." className={`${inputClass} resize-none`} />
          </label>
        </>
      )}
      {compact && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div className="text-center"><p className="text-xs text-slate-400">Itens</p><p className="font-black">{cartItems.length}</p></div>
          <div className="text-center"><p className="text-xs text-slate-400">Taxa</p><p className="font-black">{fmt.format(taxa)}</p></div>
          <div className="text-center"><p className="text-xs text-slate-400">Total</p><p className="font-black" style={{ color: brand.primary }}>{fmt.format(total)}</p></div>
        </div>
      )}
      {checkoutMessage && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{checkoutMessage}</p>}
      <button type="button" onClick={onCheckout} disabled={!storeAberta || abaixoDoMinimo || salvando} className="mt-4 w-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50" style={btnStyle}>
        {salvando ? 'Registrando...' : storeAberta ? 'Finalizar no WhatsApp' : '🔴 Loja Fechada'}
      </button>
    </div>
  );
}
