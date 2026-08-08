import { useNavigate } from '@tanstack/react-router';
import { useCart } from '../context/CartContext';
import { useMenuStore } from '../context/MenuStoreContext';
import { useBrand } from '../hooks/useBrand';
import { getDeliveryFee, getDeliveryMinimum } from '../services/delivery';
import { buildTenantMenuPath } from '../services/tenantRoutes';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function CartPage() {
  const { items, modalidade, setModalidade, inc, dec, rem, subtotal, totalItems, observacao, setObservacao } = useCart();
  const { empresa } = useMenuStore();
  const navigate = useNavigate();
  const brand = useBrand(empresa?.corPrincipal ?? '#f97316', empresa?.estiloVisual ?? 'moderno');
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  const cfg = empresa?.entrega;
  const taxa = modalidade === 'entrega' && cfg?.entregaAtiva ? getDeliveryFee(empresa) : 0;
  const minimoEntrega = getDeliveryMinimum(empresa);
  const total = subtotal + taxa;
  const abaixoDoMinimo = modalidade === 'entrega' && subtotal < minimoEntrega;
  const ambasAtivas = Boolean(cfg?.retiradaAtiva && cfg?.entregaAtiva);
  const voltarAoCardapio = () => window.location.assign(empresa?.slug ? buildTenantMenuPath(empresa.slug) : '/cardapio');

  if (items.length === 0) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="text-6xl">🛒</div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Carrinho vazio</h1>
          <p className="mt-2 text-slate-500">Adicione produtos para continuar.</p>
          <button onClick={voltarAoCardapio} className="mt-6 rounded-full px-8 py-3 font-black text-white" style={btnStyle}>
            Ver cardápio
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 pb-32">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={voltarAoCardapio} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-slate-600 hover:bg-slate-100">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-950">Carrinho</h1>
            <p className="text-sm text-slate-500">{totalItems} item(ns)</p>
          </div>
        </div>

        {/* Modalidade */}
        {ambasAtivas && (
          <div className="mb-5 grid grid-cols-2 gap-2">
            {(['retirada', 'entrega'] as const).map(m => (
              <button key={m} onClick={() => setModalidade(m)}
                className={`rounded-2xl border-2 py-3 text-sm font-black transition ${
                  modalidade === m ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'
                }`}>
                {m === 'retirada' ? '🏠 Retirada' : '🚚 Entrega'}
              </button>
            ))}
          </div>
        )}
        {!ambasAtivas && (
          <div className="mb-5 rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
            {modalidade === 'retirada' ? '🏠 Retirada no local' : '🚚 Entrega em domicílio'}
          </div>
        )}

        {/* Itens */}
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.product.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between gap-3">
                <div className="flex-1">
                  <p className="font-black text-slate-950">{item.product.nome}</p>
                  <p className="text-sm text-slate-500">{fmt.format(item.product.preco)} cada</p>
                </div>
                <button onClick={() => rem(item.product.id)} className="text-xs font-bold text-red-400 hover:text-red-600">Remover</button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                  <button onClick={() => dec(item.product.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm">−</button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => inc(item.product.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm">+</button>
                </div>
                <p className="font-black text-slate-950">{fmt.format(item.product.preco * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Observação */}
        <div className="mt-5">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Observações</label>
          <textarea rows={2} placeholder="Alguma observação?" value={observacao} onChange={e => setObservacao(e.target.value)}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
        </div>

        {/* Totais */}
        <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{fmt.format(subtotal)}</span></div>
          {taxa > 0 && <div className="flex justify-between text-sm text-slate-500"><span>Taxa de entrega</span><span>{fmt.format(taxa)}</span></div>}
          <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-950">
            <span>Total</span><span style={{ color: brand.primary }}>{fmt.format(total)}</span>
          </div>
        </div>
        {abaixoDoMinimo && (
          <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            Pedido mínimo para entrega: {fmt.format(minimoEntrega)}.
          </p>
        )}
      </div>

      {/* CTA fixo */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4">
        <button onClick={() => navigate({ to: '/checkout/resumo' })} disabled={abaixoDoMinimo} className="w-full rounded-full py-4 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50" style={btnStyle}>
          Continuar → Resumo do pedido
        </button>
      </div>
    </section>
  );
}
