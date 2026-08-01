import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useClienteAuth } from '../context/ClienteAuthContext';
import { useMenuStore } from '../context/MenuStoreContext';
import { useBrand } from '../hooks/useBrand';
import { clienteService } from '../services/clienteService';
import type { Pedido, PedidoStatus } from '../types/domain';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_STEPS: { key: PedidoStatus; label: string; icon: string }[] = [
  { key: 'aguardando',      label: 'Aguardando',       icon: '⏳' },
  { key: 'em_preparo',      label: 'Em preparo',        icon: '👨‍🍳' },
  { key: 'pronto_retirada', label: 'Pronto p/ retirada', icon: '✅' },
  { key: 'saiu_entrega',    label: 'Saiu p/ entrega',   icon: '🚚' },
  { key: 'finalizado',      label: 'Finalizado',         icon: '🎉' },
];

const STATUS_COLOR: Partial<Record<PedidoStatus, string>> = {
  aguardando:       'bg-amber-100 text-amber-700',
  em_preparo:       'bg-blue-100 text-blue-700',
  pronto_retirada:  'bg-emerald-100 text-emerald-700',
  saiu_entrega:     'bg-purple-100 text-purple-700',
  finalizado:       'bg-slate-100 text-slate-600',
  cancelado:        'bg-red-100 text-red-600',
};

function StatusTracker({ pedido }: { pedido: Pedido }) {
  const steps = pedido.modalidade === 'entrega'
    ? STATUS_STEPS.filter(s => s.key !== 'pronto_retirada')
    : STATUS_STEPS.filter(s => s.key !== 'saiu_entrega');
  const currentIdx = steps.findIndex(s => s.key === pedido.status);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition ${
              idx < currentIdx ? 'bg-emerald-500 text-white' :
              idx === currentIdx ? 'bg-slate-950 text-white ring-4 ring-slate-200' :
              'bg-slate-100 text-slate-400'
            }`}>
              {idx < currentIdx ? '✓' : step.icon}
            </div>
            <p className={`mt-1 text-center text-[10px] font-bold leading-tight ${
              idx === currentIdx ? 'text-slate-900' : 'text-slate-400'
            }`}>{step.label}</p>
            {idx < steps.length - 1 && (
              <div className="absolute" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MinhaAreaPage() {
  const { user, perfil, loading: authLoading, logout } = useClienteAuth();
  const { empresa } = useMenuStore();
  const navigate = useNavigate();
  const brand = useBrand(empresa?.corPrincipal ?? '#f97316', empresa?.estiloVisual ?? 'moderno');
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const pedidosAtivos = useMemo(
    () => pedidos.filter((pedido) => !['finalizado', 'cancelado'].includes(pedido.status)),
    [pedidos],
  );

  useEffect(() => {
    if (!user || !perfil) { setLoading(false); return; }
    clienteService.listarPedidos(perfil.id).then(rows => {
      const mapped = rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        empresaId: r.empresa_id as string,
        clienteId: r.cliente_id as string | undefined,
        numero: r.numero as number,
        status: r.status as PedidoStatus,
        modalidade: r.modalidade as 'retirada' | 'entrega',
        formaPagamento: r.forma_pagamento as Pedido['formaPagamento'],
        statusPagamento: r.status_pagamento as Pedido['statusPagamento'],
        provedorPagamento: r.provedor_pagamento as string | undefined,
        pagamentoUrl: r.pagamento_url as string | undefined,
        pagoEm: r.pago_em as string | undefined,
        clienteNome: r.cliente_nome as string | undefined,
        clienteTel: r.cliente_tel as string | undefined,
        clienteEnd: r.cliente_end as string | undefined,
        itens: r.itens as Pedido['itens'],
        observacao: r.observacao as string | undefined,
        subtotal: Number(r.subtotal),
        taxaEntrega: Number(r.taxa_entrega),
        total: Number(r.total),
        estimativaMinutos: r.estimativa_minutos as number | undefined,
        previsaoEm: r.previsao_em as string | undefined,
        criadoEm: r.criado_em as string,
        atualizadoEm: r.atualizado_em as string,
      }));
      setPedidos(mapped);
      setLoading(false);
    });
  }, [user, perfil]);

  // Assina tempo real para pedidos ativos
  useEffect(() => {
    const subs = pedidosAtivos.map(p =>
      clienteService.subscribePedido(p.id, (row) => {
        setPedidos(cur => cur.map(existing =>
          existing.id === row.id ? {
            ...existing,
            status: row.status as PedidoStatus,
            statusPagamento: row.status_pagamento as Pedido['statusPagamento'],
            estimativaMinutos: row.estimativa_minutos as number | undefined,
          } : existing
        ));
      })
    );
    return () => { subs.forEach(s => s.unsubscribe()); };
  }, [pedidosAtivos]);

  if (authLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="text-5xl">👤</div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Minha Área</h1>
          <p className="mt-2 text-slate-500">Faça login para ver seus pedidos.</p>
          <button onClick={() => navigate({ to: '/checkout/auth' })} className="mt-6 w-full rounded-full py-4 font-black text-white" style={btnStyle}>
            Entrar
          </button>
        </div>
      </section>
    );
  }

  const ativos = pedidos.filter(p => !['finalizado', 'cancelado'].includes(p.status));
  const historico = pedidos.filter(p => ['finalizado', 'cancelado'].includes(p.status));

  return (
    <section className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} className="h-10 w-10 rounded-full" alt="foto" />
              : <div className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-black" style={{ backgroundColor: brand.primary }}>{perfil?.nome?.[0]?.toUpperCase()}</div>
            }
            <div>
              <h1 className="font-black text-slate-950">{perfil?.nome}</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 font-bold">Sair</button>
        </div>

        <button onClick={() => navigate({ to: '/cardapio' })} className="mb-6 w-full rounded-full py-3.5 font-black text-white" style={btnStyle}>
          🛒 Fazer novo pedido
        </button>

        {loading && (
          <div className="text-center py-10"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" /></div>
        )}

        {/* Pedidos ativos */}
        {ativos.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Pedidos em andamento</h2>
            <div className="space-y-4">
              {ativos.map(pedido => (
                <div key={pedido.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-950">Pedido #{String(pedido.numero).padStart(4, '0')}</p>
                      <p className="text-xs text-slate-400">{new Date(pedido.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${STATUS_COLOR[pedido.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {pedido.status.replace('_', ' ')}
                    </span>
                  </div>
                  {pedido.formaPagamento === 'online' && pedido.statusPagamento !== 'pago' ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3">
                      <p className="text-sm font-black text-amber-800">Pagamento ainda não confirmado</p>
                      <p className="mt-1 text-xs text-amber-700">O restaurante só receberá o pedido para preparo depois da confirmação.</p>
                      {pedido.pagamentoUrl && (
                        <a href={pedido.pagamentoUrl} className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white">
                          Continuar pagamento
                        </a>
                      )}
                    </div>
                  ) : <StatusTracker pedido={pedido} />}
                  {pedido.estimativaMinutos && (
                    <p className="mt-3 text-xs font-bold text-emerald-600">⏱ Previsão: ~{pedido.estimativaMinutos} min</p>
                  )}
                  <div className="mt-3 border-t border-slate-100 pt-3 flex justify-between text-sm">
                    <span className="text-slate-500">{pedido.modalidade === 'entrega' ? '🚚 Entrega' : '🏠 Retirada'}</span>
                    <span className="font-black" style={{ color: brand.primary }}>{fmt.format(pedido.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Histórico de pedidos</h2>
            <div className="space-y-3">
              {historico.map(pedido => (
                <div key={pedido.id} className="rounded-2xl border border-slate-100 bg-white p-4 flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-800">Pedido #{String(pedido.numero).padStart(4, '0')}</p>
                    <p className="text-xs text-slate-400">{new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-slate-500 mt-1">{pedido.itens.length} item(ns)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{fmt.format(pedido.total)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLOR[pedido.status] ?? ''}`}>
                      {pedido.status === 'finalizado' ? '✅ Finalizado' : '❌ Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && pedidos.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <div className="text-5xl">📦</div>
            <p className="mt-4 font-bold text-slate-700">Nenhum pedido ainda</p>
            <p className="mt-1 text-sm text-slate-400">Seus pedidos aparecem aqui em tempo real.</p>
          </div>
        )}
      </div>
    </section>
  );
}
