import { useEffect, useRef, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { pedidosService } from '../../services/pedidosService';
import { supabase } from '../../lib/supabase';
import type { Pedido, PedidoStatus } from '../../types/domain';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const COLUNAS: { status: PedidoStatus; label: string; emoji: string; cor: string }[] = [
  { status: 'novo',       label: 'Novos',       emoji: '🔔', cor: 'border-blue-300 bg-blue-50' },
  { status: 'em_preparo', label: 'Em preparo',  emoji: '👨\u200d🍳', cor: 'border-amber-300 bg-amber-50' },
  { status: 'pronto',     label: 'Prontos',     emoji: '✅', cor: 'border-emerald-300 bg-emerald-50' },
  { status: 'entregue',   label: 'Entregues',   emoji: '📦', cor: 'border-slate-200 bg-slate-50' },
];

const PROXIMOS: Partial<Record<PedidoStatus, PedidoStatus>> = {
  novo: 'em_preparo',
  em_preparo: 'pronto',
  pronto: 'entregue',
};

const BTN_LABEL: Partial<Record<PedidoStatus, string>> = {
  novo: 'Iniciar preparo',
  em_preparo: 'Marcar pronto',
  pronto: 'Confirmar entrega',
};

function minutosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function UrgenciaBadge({ criadoEm }: { criadoEm: string }) {
  const min = minutosDesde(criadoEm);
  if (min < 5)  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">🟢 há {min} min</span>;
  if (min < 15) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">🟡 há {min} min</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700 animate-pulse">🔴 há {min} min</span>;
}

function PedidoCard({ pedido, onAvancar, onCancelar }: { pedido: Pedido; onAvancar?: () => void; onCancelar?: () => void }) {
  const proximo = PROXIMOS[pedido.status];
  const btnLabel = BTN_LABEL[pedido.status];
  const whatsappUrl = pedido.clienteTel
    ? `https://wa.me/55${pedido.clienteTel.replace(/\D/g, '')}`
    : null;

  return (
    <div className={`rounded-3xl border bg-white p-4 shadow-sm ${ pedido.status === 'novo' && minutosDesde(pedido.criadoEm) >= 15 ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200' }`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Pedido</p>
          <p className="text-xl font-black text-slate-950">#{String(pedido.numero).padStart(4, '0')}</p>
        </div>
        <UrgenciaBadge criadoEm={pedido.criadoEm} />
      </div>

      {/* Cliente */}
      <div className="mt-3 space-y-1">
        {pedido.clienteNome && <p className="font-black text-slate-900">{pedido.clienteNome}</p>}
        {pedido.clienteTel && <p className="text-sm text-slate-500">📱 {pedido.clienteTel}</p>}
      </div>

      {/* Itens */}
      <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
        {pedido.itens.map((item, i) => (
          <li key={i} className="flex justify-between text-sm">
            <span className="text-slate-700">{item.quantidade}x {item.nome}</span>
            <span className="font-bold text-slate-900">{fmt.format(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      {/* Observação */}
      {pedido.observacao && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          📝 {pedido.observacao}
        </p>
      )}

      {/* Modalidade + total */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {pedido.modalidade === 'entrega' ? `🚚 ${pedido.clienteEnd || 'Entrega'}` : '🏠 Retirada'}
        </span>
        <p className="font-black text-slate-950">{fmt.format(pedido.total)}</p>
      </div>

      {/* Ações */}
      <div className="mt-3 flex gap-2">
        {proximo && btnLabel && (
          <button type="button" onClick={onAvancar}
            className="flex-1 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">
            {btnLabel}
          </button>
        )}
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100">
            💬 WhatsApp
          </a>
        )}
        {pedido.status !== 'entregue' && pedido.status !== 'cancelado' && (
          <button type="button" onClick={onCancelar}
            className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminOrdersPage() {
  usePageTitle('Pedidos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);
  const prevCountRef = useRef(0);

  function playBeep() {
    try {
      const ctx = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* silently fail */ }
  }

  async function carregar() {
    const data = await pedidosService.listar();
    const novosCount = data.filter((p) => p.status === 'novo').length;
    if (novosCount > prevCountRef.current) playBeep();
    prevCountRef.current = novosCount;
    setPedidos(data);
    setLoading(false);
  }

  useEffect(() => {
    carregar();

    // Realtime: escuta INSERT e UPDATE na tabela pedidos
    const channel = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, () => carregar())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => carregar())
      .subscribe();

    // Refresh a cada 30s como fallback
    const interval = setInterval(carregar, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function avancar(pedido: Pedido) {
    const proximo = PROXIMOS[pedido.status];
    if (!proximo) return;
    setPedidos((cur) => cur.map((p) => p.id === pedido.id ? { ...p, status: proximo } : p));
    await pedidosService.atualizarStatus(pedido.id, proximo);
  }

  async function cancelar(pedido: Pedido) {
    if (!confirm(`Cancelar pedido #${String(pedido.numero).padStart(4, '0')}?`)) return;
    setPedidos((cur) => cur.filter((p) => p.id !== pedido.id));
    await pedidosService.atualizarStatus(pedido.id, 'cancelado');
  }

  const novos     = pedidos.filter((p) => p.status === 'novo');
  const emPreparo = pedidos.filter((p) => p.status === 'em_preparo');
  const prontos   = pedidos.filter((p) => p.status === 'pronto');
  const entregues = pedidos.filter((p) => p.status === 'entregue');

  const colunasPedidos = [novos, emPreparo, prontos, entregues];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm font-bold text-slate-400">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Gestão</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Pedidos</h1>
        </div>
        <div className="flex items-center gap-3">
          {novos.length > 0 && (
            <span className="animate-pulse rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white">
              {novos.length} novo{novos.length > 1 ? 's' : ''}
            </span>
          )}
          <button type="button" onClick={carregar} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-slate-300">
            Atualizar
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid gap-4 lg:grid-cols-4">
        {COLUNAS.map((col, idx) => (
          <div key={col.status}>
            <div className={`mb-3 flex items-center justify-between rounded-2xl border px-4 py-3 ${col.cor}`}>
              <p className="font-black text-slate-900">{col.emoji} {col.label}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-600 shadow-sm">
                {colunasPedidos[idx].length}
              </span>
            </div>
            <div className="space-y-3">
              {colunasPedidos[idx].length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-8 text-center">
                  <p className="text-sm text-slate-400">Nenhum pedido</p>
                </div>
              ) : (
                colunasPedidos[idx].map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onAvancar={() => avancar(pedido)}
                    onCancelar={() => cancelar(pedido)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">Atualização em tempo real via Supabase Realtime</p>
    </section>
  );
}
