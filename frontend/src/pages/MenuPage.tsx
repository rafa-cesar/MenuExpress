import { useMemo, useState } from 'react';
import { MenuCard } from '../components/MenuCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useStoreStatus } from '../hooks/useStoreStatus';
import { useBrand } from '../hooks/useBrand';
import { buildWhatsAppOrderUrl, menuCatalogService } from '../services';
import { pedidosService } from '../services/pedidosService';
import type { CartItem, MenuCategory, MenuItem } from '../types/menu';
import type { ModalidadeEntrega, Pedido } from '../types/domain';
import { useMenuStore } from '../context/MenuStoreContext';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MOTIVO_LABEL: Record<string, string> = {
  forcar_fechado: 'A loja está temporariamente fechada.',
  horario_fechado: 'A loja está fechada no momento.',
  dia_inativo: 'Não abrimos neste dia da semana.',
};

// ─── Tela de confirmação pós-pedido ─────────────────────────────────────
function ConfirmacaoScreen({
  pedido, empresa, whatsappMsg, whatsapp, brand, onNovoPedido,
}: {
  pedido: Pedido;
  empresa: ReturnType<typeof useMenuStore>['empresa'];
  whatsappMsg: string;
  whatsapp: string;
  brand: ReturnType<typeof useBrand>;
  onNovoPedido: () => void;
}) {
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">✅</div>
        <h1 className="mt-6 text-3xl font-black text-slate-950">Pedido recebido!</h1>
        <p className="mt-2 text-slate-500">Seu pedido foi registrado com sucesso.</p>

        <div className="mt-6 rounded-2xl border-2 border-dashed px-6 py-5" style={{ borderColor: brand.primary }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Número do pedido</p>
          <p className="mt-1 text-5xl font-black" style={{ color: brand.primary }}>
            #{String(pedido.numero).padStart(4, '0')}
          </p>
        </div>

        <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 px-5 py-4 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Modalidade</span>
            <span className="font-bold text-slate-800">{pedido.modalidade === 'entrega' ? '🚚 Entrega' : '🏠 Retirada'}</span>
          </div>
          {pedido.clienteNome && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Nome</span>
              <span className="font-bold text-slate-800">{pedido.clienteNome}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
            <span className="font-black text-slate-900">Total</span>
            <span className="font-black" style={{ color: brand.primary }}>{fmt.format(pedido.total)}</span>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-400">
          Acompanhe seu pedido com o número acima.
          <br /><strong className="text-slate-600">{empresa.nome}</strong> já foi notificado.
        </p>

        {whatsapp && (
          <a
            href={buildWhatsAppOrderUrl(whatsapp, whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.528 5.855L0 24l6.335-1.508A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.371l-.36-.214-3.724.887.924-3.619-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            Confirmar pelo WhatsApp (opcional)
          </a>
        )}

        <button type="button" onClick={onNovoPedido} className="mt-3 w-full rounded-full py-3.5 font-black text-white transition" style={btnStyle}>
          Fazer novo pedido
        </button>
      </div>

      {/* Crédito YellowTech */}
      <p className="mt-8 text-xs text-slate-400">
        Powered by <strong className="text-slate-500">YellowTech</strong>
      </p>
    </section>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────
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
  const [cartItems, setCartItems]               = useState<CartItem[]>([]);
  const [orderNote, setOrderNote]               = useState('');
  const [checkoutMessage, setCheckoutMessage]   = useState('');
  const [modalidade, setModalidade]             = useState<ModalidadeEntrega>(defaultModalidade);
  const [clienteNome, setClienteNome]           = useState('');
  const [clienteTel, setClienteTel]             = useState('');
  const [clienteEnd, setClienteEnd]             = useState('');
  const [salvando, setSalvando]                 = useState(false);
  const [pedidoFeito, setPedidoFeito]           = useState<Pedido | null>(null);

  const filteredItems  = useMemo(() => produtos.filter((item) => item.categoria === selectedCategory), [produtos, selectedCategory]);
  const subtotal       = useMemo(() => cartItems.reduce((t, i) => t + i.product.preco * i.quantity, 0), [cartItems]);
  const taxa           = modalidade === 'entrega' && cfg.entregaAtiva ? cfg.taxaEntregaFixa : 0;
  const total          = subtotal + taxa;
  const totalItems     = useMemo(() => cartItems.reduce((t, i) => t + i.quantity, 0), [cartItems]);
  const abaixoDoMinimo = modalidade === 'entrega' && cfg.pedidoMinimoEntrega > 0 && subtotal < cfg.pedidoMinimoEntrega;

  function getQty(id: string) { return cartItems.find((i) => i.product.id === id)?.quantity ?? 0; }
  function addProduct(product: MenuItem) {
    if (!storeStatus.aberta) return;
    setCartItems((cur) =>
      cur.some((i) => i.product.id === product.id)
        ? cur.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...cur, { product, quantity: 1 }]
    );
  }
  function inc(id: string) { setCartItems((cur) => cur.map((i) => i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i)); }
  function dec(id: string) { setCartItems((cur) => cur.map((i) => i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0)); }
  function rem(id: string) { setCartItems((cur) => cur.filter((i) => i.product.id !== id)); }

  function buildMsg() {
    const itens = cartItems.map((i) => `• ${i.product.nome} x${i.quantity} — ${fmt.format(i.product.preco * i.quantity)}`).join('\n');
    const endLoja = cfg.endereco
      ? `${cfg.endereco.rua}, ${cfg.endereco.numero}${cfg.endereco.complemento ? ` (${cfg.endereco.complemento})` : ''} — ${cfg.endereco.bairro}, ${cfg.endereco.cidade}`
      : 'Consultar endereço';
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
    if (!storeStatus.aberta)   { setCheckoutMessage(MOTIVO_LABEL[storeStatus.motivo] ?? 'A loja está fechada.'); return; }
    if (cartItems.length === 0) { setCheckoutMessage('Adicione pelo menos um produto ao carrinho.'); return; }
    if (abaixoDoMinimo)        { setCheckoutMessage(`Pedido mínimo para entrega é ${fmt.format(cfg.pedidoMinimoEntrega)}.`); return; }
    setCheckoutMessage('');
    setSalvando(true);

    const pedido = await pedidosService.criar({
      modalidade, clienteNome, clienteTel, clienteEnd,
      itens: cartItems.map((i) => ({
        nome: i.product.nome,
        quantidade: i.quantity,
        precoUnitario: i.product.preco,
        subtotal: i.product.preco * i.quantity,
      })),
      observacao: orderNote,
      subtotal, taxaEntrega: taxa, total,
    });

    setSalvando(false);

    if (!pedido) { setCheckoutMessage('Erro ao registrar pedido. Tente novamente.'); return; }
    setPedidoFeito(pedido);
  }

  function handleNovoPedido() {
    setPedidoFeito(null);
    setCartItems([]);
    setOrderNote('');
    setClienteNome('');
    setClienteTel('');
    setClienteEnd('');
    setCheckoutMessage('');
    setSelectedCategory('Promoções');
  }

  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  if (pedidoFeito) {
    return (
      <ConfirmacaoScreen
        pedido={pedidoFeito} empresa={empresa}
        whatsappMsg={buildMsg()} whatsapp={empresa.whatsapp}
        brand={brand} onNovoPedido={handleNovoPedido}
      />
    );
  }

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
                {cfg.entregaAtiva  && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90">🚚 Entrega — {fmt.format(cfg.taxaEntregaFixa)}</span>}
              </div>
            </div>
            <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <p className="text-sm font-semibold text-white/80">Seu pedido</p>
              <p className="mt-3 text-3xl font-black">{fmt.format(total)}</p>
              <p className="mt-1 text-xs text-white/60">{totalItems} item(ns) · {taxa > 0 ? `+ ${fmt.format(taxa)} entrega` : 'sem taxa'}</p>
              <button type="button" onClick={handleCheckout} disabled={!storeStatus.aberta || salvando}
                className="mt-5 w-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                style={btnStyle}>
                {salvando ? 'Registrando pedido...' : storeStatus.aberta ? 'Fazer Pedido' : 'Loja Fechada'}
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
                <button key={category} type="button" onClick={() => setSelectedCategory(category)}
                  className="shrink-0 px-4 py-2 text-sm font-black transition"
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
            <CartPanel
              cartItems={cartItems} subtotal={subtotal} taxa={taxa} total={total}
              orderNote={orderNote} checkoutMessage={checkoutMessage}
              storeAberta={storeStatus.aberta} brand={brand} modalidade={modalidade}
              ambasAtivas={ambasAtivas} cfg={cfg} abaixoDoMinimo={abaixoDoMinimo}
              salvando={salvando} clienteNome={clienteNome} clienteTel={clienteTel} clienteEnd={clienteEnd}
              onModalidade={setModalidade} onNome={setClienteNome} onTel={setClienteTel} onEnd={setClienteEnd}
              onOrderNoteChange={setOrderNote} onCheckout={handleCheckout}
              onIncrement={inc} onDecrement={dec} onRemove={rem}
            />
          </aside>
        </div>
      </div>

      {/* Mobile cart */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.16)] lg:hidden">
        <CartPanel compact
          cartItems={cartItems} subtotal={subtotal} taxa={taxa} total={total}
          orderNote={orderNote} checkoutMessage={checkoutMessage}
          storeAberta={storeStatus.aberta} brand={brand} modalidade={modalidade}
          ambasAtivas={ambasAtivas} cfg={cfg} abaixoDoMinimo={abaixoDoMinimo}
          salvando={salvando} clienteNome={clienteNome} clienteTel={clienteTel} clienteEnd={clienteEnd}
          onModalidade={setModalidade} onNome={setClienteNome} onTel={setClienteTel} onEnd={setClienteEnd}
          onOrderNoteChange={setOrderNote} onCheckout={handleCheckout}
          onIncrement={inc} onDecrement={dec} onRemove={rem}
        />
      </div>

      {/* Rodapé do cardápio */}
      <div className="px-4 pb-6 pt-10 text-center">
        <p className="text-xs text-slate-400">
          Cardápio digital por <strong className="text-slate-500">YellowTech</strong>
        </p>
      </div>
    </section>
  );
}

// ─── CartPanel ───────────────────────────────────────────────────────────────────
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
              className={`rounded-2xl border-2 py-3 text-sm font-black transition ${
                modalidade === m ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}>
              {m === 'retirada' ? '🏠 Retirada' : '🚚 Entrega'}
            </button>
          ))}
        </div>
      )}
      {!ambasAtivas && (
        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
          {modalidade === 'retirada' ? '🏠 Retirada no local' : '🚚 Entrega em domicílio'}
        </div>
      )}
      {abaixoDoMinimo && (
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
          ⚠️ Mínimo para entrega: {fmt.format(cfg.pedidoMinimoEntrega)}. Faltam {fmt.format(cfg.pedidoMinimoEntrega - subtotal)}.
        </p>
      )}
      {!compact && (
        <>
          <div className="mt-4 space-y-3">
            {cartItems.length === 0
              ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{storeAberta ? 'Seu carrinho está vazio.' : '🔴 Loja fechada.'}</p>
              : cartItems.map((item) => (
                <div key={item.product.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{item.product.nome}</p>
                      <p className="text-sm text-slate-500">{fmt.format(item.product.preco)}</p>
                    </div>
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
            <label className="block text-sm font-bold text-slate-600">Nome
              <input value={clienteNome} onChange={(e) => onNome(e.target.value)} placeholder="Seu nome" className={inputClass} />
            </label>
            <label className="block text-sm font-bold text-slate-600">Telefone
              <input value={clienteTel} onChange={(e) => onTel(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
            </label>
            {modalidade === 'entrega' && (
              <label className="block text-sm font-bold text-slate-600">Endereço de entrega
                <input value={clienteEnd} onChange={(e) => onEnd(e.target.value)} placeholder="Rua, número, bairro" className={inputClass} />
              </label>
            )}
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
      {checkoutMessage && (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{checkoutMessage}</p>
      )}
      <button type="button" onClick={onCheckout} disabled={!storeAberta || abaixoDoMinimo || salvando}
        className="mt-4 w-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
        style={btnStyle}>
        {salvando ? 'Registrando pedido...' : storeAberta ? 'Fazer Pedido' : '🔴 Loja Fechada'}
      </button>
    </div>
  );
}
