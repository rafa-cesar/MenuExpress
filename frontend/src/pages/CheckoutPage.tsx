import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCart } from '../context/CartContext';
import { useClienteAuth } from '../context/ClienteAuthContext';
import { useMenuStore } from '../context/MenuStoreContext';
import { useBrand } from '../hooks/useBrand';
import { pedidosService } from '../services/pedidosService';
import { buildWhatsAppOrderUrl } from '../services';
import type { FormaPagamento, Pedido } from '../types/domain';
import { getDeliveryFee, getDeliveryMinimum } from '../services/delivery';
import { paymentService } from '../services/paymentService';
import { buildTenantMenuPath } from '../services/tenantRoutes';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const PAGAMENTOS: { value: FormaPagamento; label: string; icon: string }[] = [
  { value: 'online',         label: 'Pagar agora',       icon: '🔒' },
  { value: 'dinheiro',       label: 'Dinheiro na retirada', icon: '💵' },
  { value: 'pix',            label: 'Pix direto na hora',    icon: '⚡' },
  { value: 'cartao_credito', label: 'Crédito na retirada',  icon: '💳' },
  { value: 'cartao_debito',  label: 'Débito na retirada',   icon: '💳' },
];

const STATUS_LABEL: Record<string, string> = {
  aguardando:      '⏳ Aguardando confirmação',
  em_preparo:      '👨‍🍳 Em preparo',
  pronto_retirada: '✅ Pronto para retirada',
  saiu_entrega:    '🚚 Saiu para entrega',
  finalizado:      '🎉 Finalizado',
  cancelado:       '❌ Cancelado',
};

export function CheckoutPage() {
  const { items, modalidade, formaPagamento, setFormaPagamento, observacao, subtotal, clear } = useCart();
  const { empresa } = useMenuStore();
  const { perfil, user, loading: authLoading } = useClienteAuth();
  const navigate = useNavigate();
  const brand = useBrand(empresa?.corPrincipal ?? '#f97316', empresa?.estiloVisual ?? 'moderno');
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [pedidoFeito, setPedidoFeito] = useState<Pedido | null>(null);
  const antecedenciaMinutos = Math.max(0, ...items.map((item) => item.product.antecedenciaMinutos ?? 0));
  const pedidoAgendado = antecedenciaMinutos > 0;
  const primeiroHorario = useMemo(() => new Date(Date.now() + antecedenciaMinutos * 60_000), [antecedenciaMinutos]);
  const toLocalInput = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  };
  const [agendadoPara, setAgendadoPara] = useState('');
  const [pagamentoOnlineConectado, setPagamentoOnlineConectado] = useState(false);
  const [clienteEnd, setClienteEnd] = useState(
    perfil?.endereco ? `${perfil.endereco.rua}, ${perfil.endereco.numero} — ${perfil.endereco.bairro}` : ''
  );
  const enderecoInputRef = useRef<HTMLInputElement>(null);

  const cfg = empresa?.entrega;
  const taxa = modalidade === 'entrega' && cfg?.entregaAtiva ? getDeliveryFee(empresa) : 0;
  const minimoEntrega = getDeliveryMinimum(empresa);
  const total = subtotal + taxa;
  const pagamentos = empresa?.pagamentos;
  const paymentOptions = useMemo(() => PAGAMENTOS.filter((option) => {
    if (option.value === 'online') return Boolean(pagamentos?.onlineAntecipadoAtivo && pagamentoOnlineConectado);
    if (option.value === 'dinheiro') return pagamentos?.dinheiroNaHoraAtivo ?? true;
    if (option.value === 'pix') return pagamentos?.pixNaHoraAtivo ?? false;
    return pagamentos?.cartaoNaHoraAtivo ?? true;
  }), [pagamentos, pagamentoOnlineConectado]);

  useEffect(() => {
    if (!empresa?.id) return;
    paymentService.disponivel(empresa.id)
      .then(setPagamentoOnlineConectado)
      .catch(() => setPagamentoOnlineConectado(false));
  }, [empresa?.id]);

  useEffect(() => {
    if (paymentOptions.length > 0 && !paymentOptions.some((option) => option.value === formaPagamento)) {
      setFormaPagamento(paymentOptions[0].value);
    }
  }, [formaPagamento, paymentOptions, setFormaPagamento]);

  useEffect(() => {
    if (authLoading) return;
    if (items.length === 0) { navigate({ to: '/cardapio' }); return; }
    if (!user) { navigate({ to: '/checkout/auth' }); return; }
    if (!perfil) { navigate({ to: '/checkout/auth' }); return; }
  }, [authLoading, items.length, user, perfil, navigate]);

  // Spinner enquanto auth resolve
  if (authLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </section>
    );
  }

  // Early return — TypeScript agora sabe que perfil != null abaixo deste ponto
  if (!perfil) return null;

  if (pedidoFeito) {
    const msg = [
      `Olá! Gostaria de confirmar meu pedido 🛒`,
      ``,
      `👤 ${pedidoFeito.clienteNome}`,
      `📱 ${pedidoFeito.clienteTel || '—'}`,
      modalidade === 'entrega' ? `📍 Entrega: ${pedidoFeito.clienteEnd ?? clienteEnd}` : `🏠 Retirada no local`,
      ``,
      ...items.map(i => `• ${i.product.nome} x${i.quantity} — ${fmt.format(i.product.preco * i.quantity)}`),
      ``,
      `💰 Total: ${fmt.format(pedidoFeito.total)}`,
      `💳 Pagamento: ${PAGAMENTOS.find(p => p.value === pedidoFeito.formaPagamento)?.label ?? '—'}`,
      ``,
      `Pedido #${String(pedidoFeito.numero).padStart(4, '0')}`,
    ].join('\n');

    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">✅</div>
          <h1 className="mt-6 text-3xl font-black text-slate-950">Pedido recebido!</h1>
          <p className="mt-2 text-slate-500">Seu pedido foi registrado com sucesso.</p>

          <div className="mt-6 rounded-2xl border-2 border-dashed px-6 py-5" style={{ borderColor: brand.primary }}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Número do pedido</p>
            <p className="mt-1 text-5xl font-black" style={{ color: brand.primary }}>#{String(pedidoFeito.numero).padStart(4, '0')}</p>
          </div>

          <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 px-5 py-4 text-left text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-bold">{STATUS_LABEL[pedidoFeito.status]}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Modalidade</span><span className="font-bold">{modalidade === 'entrega' ? '🚚 Entrega' : '🏠 Retirada'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pagamento</span><span className="font-bold">{PAGAMENTOS.find(p => p.value === pedidoFeito.formaPagamento)?.label}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-black text-slate-900">Total</span><span className="font-black" style={{ color: brand.primary }}>{fmt.format(pedidoFeito.total)}</span></div>
          </div>

          {pedidoFeito.formaPagamento === 'pix' && empresa?.pagamentos?.chavePix && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Pix direto para o restaurante</p>
              <p className="mt-2 break-all font-black text-blue-950">{empresa.pagamentos.chavePix}</p>
              {empresa.pagamentos.nomeBeneficiarioPix && <p className="mt-1 text-xs text-blue-700">Beneficiário: {empresa.pagamentos.nomeBeneficiarioPix}</p>}
              <button type="button" onClick={() => navigator.clipboard.writeText(empresa.pagamentos?.chavePix ?? '')}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white">Copiar chave Pix</button>
              <p className="mt-3 text-xs text-blue-700">Apresente o comprovante na entrega ou retirada. A confirmação é feita pelo restaurante.</p>
            </div>
          )}

          <p className="mt-5 text-sm text-slate-400">Acompanhe seu pedido pelo número acima ou clique abaixo.</p>

          <div className="mt-4 space-y-3">
            <button onClick={() => navigate({ to: '/minha-area', search: { pedido: pedidoFeito.id } })} className="w-full rounded-full py-3.5 font-black text-white" style={btnStyle}>
              📦 Acompanhar na Minha Área
            </button>
            {empresa?.whatsapp && (
              <a href={buildWhatsAppOrderUrl(empresa.whatsapp, msg)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.528 5.855L0 24l6.335-1.508A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.371l-.36-.214-3.724.887.924-3.619-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Confirmar / Acompanhar pelo WhatsApp
              </a>
            )}
            <button onClick={() => { clear(); window.location.assign(empresa?.slug ? buildTenantMenuPath(empresa.slug) : '/cardapio'); }} className="w-full rounded-full border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Fazer novo pedido
            </button>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-400">Powered by <strong className="text-slate-500">YellowTech</strong></p>
      </section>
    );
  }

  async function confirmar() {
    if (!empresa || !perfil) { navigate({ to: '/checkout/auth' }); return; }
    const enderecoEntrega = modalidade === 'entrega'
      ? (enderecoInputRef.current?.value ?? clienteEnd).trim()
      : '';
    if (modalidade === 'entrega' && !enderecoEntrega) {
      setErro('Informe o endereço completo para entrega.');
      enderecoInputRef.current?.focus();
      return;
    }
    if (modalidade === 'entrega' && subtotal < minimoEntrega) {
      setErro(`O pedido mínimo para entrega é ${fmt.format(minimoEntrega)}.`);
      return;
    }
    if (pedidoAgendado) {
      const escolhido = new Date(agendadoPara);
      if (!agendadoPara || Number.isNaN(escolhido.getTime()) || escolhido.getTime() < primeiroHorario.getTime()) {
        setErro(`Escolha uma data e um horário com pelo menos ${antecedenciaMinutos / 60} horas de antecedência.`);
        return;
      }
    }
    setSalvando(true); setErro('');
    const pedido = await pedidosService.criar(empresa.id, {
      modalidade,
      formaPagamento,
      clienteNome: perfil.nome,
      clienteTel: perfil.whatsapp ?? '',
      clienteEnd: enderecoEntrega,
      clienteId: perfil.id,
      itens: items.map(i => ({ produtoId: i.product.id, quantidade: i.quantity })),
      observacao,
      agendadoPara: pedidoAgendado ? new Date(agendadoPara).toISOString() : undefined,
    });
    if (!pedido) { setSalvando(false); setErro('Erro ao registrar pedido. Tente novamente.'); return; }
    if (formaPagamento === 'online') {
      try {
        const pagamentoUrl = await paymentService.iniciarCheckout(pedido.id);
        clear();
        window.location.assign(pagamentoUrl);
        return;
      } catch (cause) {
        setSalvando(false);
        setErro(cause instanceof Error ? cause.message : 'Não foi possível abrir o pagamento.');
        return;
      }
    }
    setSalvando(false);
    setPedidoFeito(pedido);
  }

  return (
    <section className="min-h-screen bg-slate-50 pb-32">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate({ to: '/checkout/carrinho' })} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-slate-600 hover:bg-slate-100">←</button>
          <h1 className="text-2xl font-black text-slate-950">Resumo do pedido</h1>
        </div>

        {/* Cliente */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            {perfil.fotoUrl
              ? <img src={perfil.fotoUrl} className="h-10 w-10 rounded-full" alt="foto" />
              : <div className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-black" style={{ backgroundColor: brand.primary }}>{perfil.nome?.[0]?.toUpperCase()}</div>
            }
            <div>
              <p className="font-black text-slate-900">{perfil.nome}</p>
              <p className="text-xs text-slate-500">{perfil.whatsapp ?? user?.email}</p>
            </div>
          </div>
        </div>

        {/* Endereço de entrega */}
        {modalidade === 'entrega' && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Endereço de entrega</label>
            <input ref={enderecoInputRef} type="text" required value={clienteEnd} onChange={e => setClienteEnd(e.target.value)}
              placeholder="Rua, número, bairro"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
            {perfil.endereco && (
              <p className="mt-2 text-xs text-slate-500">Endereço preenchido com os dados salvos. Edite se a entrega for para outro local.</p>
            )}
          </div>
        )}

        {/* Itens resumo */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Itens</h2>
          <div className="space-y-2">
            {items.map(i => (
              <div key={i.product.id} className="flex justify-between text-sm">
                <span className="text-slate-700">{i.product.nome} × {i.quantity}</span>
                <span className="font-bold text-slate-900">{fmt.format(i.product.preco * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
            <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{fmt.format(subtotal)}</span></div>
            {taxa > 0 && <div className="flex justify-between text-sm text-slate-500"><span>Taxa de entrega</span><span>{fmt.format(taxa)}</span></div>}
            <div className="flex justify-between font-black text-slate-950"><span>Total</span><span style={{ color: brand.primary }}>{fmt.format(total)}</span></div>
          </div>
        </div>

        {/* Forma de pagamento */}
        {pedidoAgendado && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-black uppercase tracking-wide text-amber-800">Pedido com agendamento</h2>
            <p className="mt-2 text-sm leading-6 text-amber-700">
              Este pedido precisa ser solicitado com pelo menos {antecedenciaMinutos / 60} horas de antecedência.
            </p>
            <label className="mt-4 block text-sm font-bold text-slate-700">
              Quando deseja receber ou retirar?
              <input
                type="datetime-local"
                required
                min={toLocalInput(primeiroHorario)}
                value={agendadoPara}
                onChange={(event) => setAgendadoPara(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none focus:border-amber-500"
              />
            </label>
            <p className="mt-2 text-xs text-amber-700">Primeiro horário possível: {primeiroHorario.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.</p>
          </div>
        )}

        {/* Forma de pagamento */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-2">
            {paymentOptions.map(p => (
              <button key={p.value} onClick={() => setFormaPagamento(p.value)}
                className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition ${
                  formaPagamento === p.value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}>
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>
          {paymentOptions.length === 0 && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">Este restaurante ainda não habilitou uma forma de pagamento.</p>
          )}
        </div>

        {erro && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{erro}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4">
        <button onClick={confirmar} disabled={salvando || paymentOptions.length === 0} className="w-full rounded-full py-4 font-black text-white disabled:opacity-50" style={btnStyle}>
          {salvando ? 'Preparando...' : `${formaPagamento === 'online' ? 'Ir para pagamento seguro' : 'Confirmar pedido'} • ${fmt.format(total)}`}
        </button>
      </div>
    </section>
  );
}
