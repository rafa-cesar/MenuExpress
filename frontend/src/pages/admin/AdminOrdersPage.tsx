import { useEffect, useRef, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { pedidosService } from '../../services/pedidosService';
import { supabase } from '../../lib/supabase';
import type { Pedido, PedidoStatus } from '../../types/domain';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const TEMPO_PADRAO_MIN = 30;

const COLUNAS: {
  status: PedidoStatus;
  label: string;
  acento: string;   // cor da barra superior
  dot: string;      // cor do dot no header
  contador: string; // bg do contador
}[] = [
  { status: 'aguardando',      label: 'Aguardando',       acento: 'bg-blue-500',    dot: 'bg-blue-500',    contador: 'bg-blue-50 text-blue-700' },
  { status: 'em_preparo',      label: 'Em preparação',    acento: 'bg-amber-400',   dot: 'bg-amber-400',   contador: 'bg-amber-50 text-amber-700' },
  { status: 'pronto_retirada', label: 'Pronto — retirada', acento: 'bg-emerald-500', dot: 'bg-emerald-500', contador: 'bg-emerald-50 text-emerald-700' },
  { status: 'saiu_entrega',    label: 'Saiu p/ entrega',  acento: 'bg-violet-500',  dot: 'bg-violet-500',  contador: 'bg-violet-50 text-violet-700' },
  { status: 'finalizado',      label: 'Finalizados',      acento: 'bg-slate-300',   dot: 'bg-slate-400',   contador: 'bg-slate-100 text-slate-500' },
];

function proximoStatus(pedido: Pedido): PedidoStatus | null {
  switch (pedido.status) {
    case 'aguardando':      return 'em_preparo';
    case 'em_preparo':      return pedido.modalidade === 'entrega' ? 'saiu_entrega' : 'pronto_retirada';
    case 'pronto_retirada': return 'finalizado';
    case 'saiu_entrega':    return 'finalizado';
    default: return null;
  }
}

function btnAvancarLabel(pedido: Pedido): string {
  switch (pedido.status) {
    case 'aguardando':      return 'Iniciar preparação';
    case 'em_preparo':      return pedido.modalidade === 'entrega' ? 'Despachar para entrega' : 'Pronto para retirada';
    case 'pronto_retirada': return 'Confirmar retirada';
    case 'saiu_entrega':    return 'Confirmar entrega';
    default: return '';
  }
}

function buildWhatsAppMsg(pedido: Pedido): string {
  const num = `#${String(pedido.numero).padStart(4, '0')}`;
  const nome = pedido.clienteNome || 'cliente';
  const previsao = pedido.previsaoEm ? ` Previsão: ${fmtHora.format(new Date(pedido.previsaoEm))}.` : '';
  switch (pedido.status) {
    case 'em_preparo':      return `Olá ${nome}! Seu pedido ${num} foi confirmado e está em preparação.${previsao} Em breve estará pronto!`;
    case 'pronto_retirada': return `Olá ${nome}! Seu pedido ${num} está pronto. Pode vir buscar!`;
    case 'saiu_entrega':    return `Olá ${nome}! Seu pedido ${num} saiu para entrega. Chegando em breve!`;
    case 'finalizado':      return `Olá ${nome}! Pedido ${num} finalizado. Obrigado pela preferência!`;
    default:                return `Olá ${nome}! Atualização sobre seu pedido ${num}.`;
  }
}

function minutosDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function UrgenciaBadge({ criadoEm, status }: { criadoEm: string; status: PedidoStatus }) {
  const min = minutosDesde(criadoEm);
  const ativo = status !== 'finalizado' && status !== 'cancelado';
  if (!ativo)   return <span className="text-xs text-slate-400">há {min} min</span>;
  if (min < 5)  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />há {min} min</span>;
  if (min < 15) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />há {min} min</span>;
  return <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />há {min} min</span>;
}

function EstimativaModal({ pedido, tempoPadrao, onConfirm, onCancel }: {
  pedido: Pedido; tempoPadrao: number;
  onConfirm: (min: number) => void; onCancel: () => void;
}) {
  const [minutos, setMinutos] = useState(tempoPadrao);
  const previsao = new Date(Date.now() + minutos * 60_000);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pedido #{String(pedido.numero).padStart(4, '0')}</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Tempo estimado</h2>
        <p className="mt-1 text-sm text-slate-500">Ajuste se necessário.</p>

        <div className="mt-6 flex items-center justify-center gap-5">
          <button type="button" onClick={() => setMinutos((m) => Math.max(5, m - 5))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-xl font-black text-slate-700 hover:bg-slate-50">−</button>
          <div className="text-center">
            <p className="text-5xl font-black tabular-nums text-slate-950">{minutos}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">minutos</p>
          </div>
          <button type="button" onClick={() => setMinutos((m) => Math.min(120, m + 5))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white hover:bg-slate-800">+</button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 py-3 text-center">
          <p className="text-xs text-slate-400">Previsão de conclusão</p>
          <p className="mt-0.5 text-2xl font-black text-slate-950">{fmtHora.format(previsao)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={() => onConfirm(minutos)}
            className="rounded-2xl bg-slate-950 py-3 text-sm font-black text-white hover:bg-slate-800">Iniciar</button>
        </div>
      </div>
    </div>
  );
}

function PedidoCard({ pedido, tempoPadrao, onAvancar, onCancelar }: {
  pedido: Pedido; tempoPadrao: number;
  onAvancar: (estimativa?: number) => void; onCancelar: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const proximo  = proximoStatus(pedido);
  const btnLabel = btnAvancarLabel(pedido);
  const urgente  = pedido.status === 'aguardando' && minutosDesde(pedido.criadoEm) >= 15;
  const whatsappUrl = pedido.clienteTel
    ? `https://wa.me/55${pedido.clienteTel.replace(/\D/g, '')}?text=${encodeURIComponent(buildWhatsAppMsg(pedido))}`
    : null;

  return (
    <>
      {showModal && (
        <EstimativaModal pedido={pedido} tempoPadrao={tempoPadrao}
          onConfirm={(min) => { setShowModal(false); onAvancar(min); }}
          onCancel={() => setShowModal(false)} />
      )}

      <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        urgente ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
      }`}>

        {/* Topo do card */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pedido</p>
            <p className="text-2xl font-black leading-none text-slate-950">#{String(pedido.numero).padStart(4, '0')}</p>
          </div>
          <UrgenciaBadge criadoEm={pedido.criadoEm} status={pedido.status} />
        </div>

        {/* Previsão de conclusão */}
        {pedido.previsaoEm && pedido.status === 'em_preparo' && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
            <div>
              <p className="text-[10px] font-semibold text-amber-500">Previsão</p>
              <p className="text-sm font-black text-amber-800">{fmtHora.format(new Date(pedido.previsaoEm))}</p>
            </div>
          </div>
        )}

        {/* Cliente */}
        <div className="mt-3 px-4">
          {pedido.clienteNome && <p className="font-bold text-slate-900">{pedido.clienteNome}</p>}
          {pedido.clienteTel  && <p className="text-xs text-slate-400">{pedido.clienteTel}</p>}
        </div>

        {/* Itens */}
        <ul className="mt-3 space-y-1 border-t border-slate-100 px-4 pt-3">
          {pedido.itens.map((item, i) => (
            <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-slate-600"><span className="font-bold text-slate-800">{item.quantidade}×</span> {item.nome}</span>
              <span className="shrink-0 font-bold text-slate-900">{fmt.format(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        {/* Observação */}
        {pedido.observacao && (
          <p className="mx-4 mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{pedido.observacao}</p>
        )}

        {/* Rodapé do card */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
          <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {pedido.modalidade === 'entrega' ? '🚚 Entrega' : '🏠 Retirada'}
          </span>
          <span className="text-sm font-black text-slate-950">{fmt.format(pedido.total)}</span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 border-t border-slate-100 px-4 pb-4 pt-3">
          {proximo && btnLabel && (
            <button type="button"
              onClick={() => pedido.status === 'aguardando' ? setShowModal(true) : onAvancar()}
              className="flex-1 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white transition hover:bg-slate-800">
              {btnLabel}
            </button>
          )}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              title="Enviar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.054 23.25a.75.75 0 00.916.99l5.582-1.461A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.695 9.695 0 01-4.95-1.355l-.355-.213-3.674.962.983-3.589-.232-.371A9.698 9.698 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
            </a>
          )}
          {pedido.status !== 'finalizado' && pedido.status !== 'cancelado' && (
            <button type="button" onClick={onCancelar}
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              title="Cancelar pedido">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminOrdersPage() {
  usePageTitle('Pedidos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef   = useRef<AudioContext | null>(null);
  const prevCount  = useRef(0);
  const tempoPadrao = TEMPO_PADRAO_MIN;

  function playBeep() {
    try {
      const ctx  = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch { /* silently fail */ }
  }

  async function carregar() {
    const data = await pedidosService.listar();
    const n = data.filter((p) => p.status === 'aguardando').length;
    if (n > prevCount.current) playBeep();
    prevCount.current = n;
    setPedidos(data);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    const ch = supabase.channel('pedidos-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, carregar)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, carregar)
      .subscribe();
    const t = setInterval(carregar, 30_000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  async function avancar(pedido: Pedido, estimativa?: number) {
    if (pedido.status === 'aguardando' && estimativa !== undefined) {
      setPedidos((cur) => cur.map((p) => p.id === pedido.id ? { ...p, status: 'em_preparo' } : p));
      await pedidosService.iniciarPreparo(pedido.id, estimativa);
      return;
    }
    const prox = proximoStatus(pedido);
    if (!prox) return;
    setPedidos((cur) => cur.map((p) => p.id === pedido.id ? { ...p, status: prox } : p));
    await pedidosService.atualizarStatus(pedido.id, prox);
  }

  async function cancelar(pedido: Pedido) {
    if (!confirm(`Cancelar pedido #${String(pedido.numero).padStart(4, '0')}?`)) return;
    setPedidos((cur) => cur.filter((p) => p.id !== pedido.id));
    await pedidosService.atualizarStatus(pedido.id, 'cancelado');
  }

  const cols = COLUNAS.map((col) => pedidos.filter((p) => p.status === col.status));
  const aguardando = cols[0].length;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-sm text-slate-400">Carregando pedidos...</p>
    </div>
  );

  return (
    <section className="space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Gestão em tempo real</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Pedidos</h1>
        </div>
        <div className="flex items-center gap-2">
          {aguardando > 0 && (
            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {aguardando} aguardando
            </span>
          )}
          <button type="button" onClick={carregar}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700">
            Atualizar
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid gap-3 lg:grid-cols-5">
        {COLUNAS.map((col, idx) => (
          <div key={col.status} className="flex flex-col gap-3">

            {/* Cabeçalho da coluna */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className={`h-1 w-full ${col.acento}`} />
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <p className="text-sm font-bold text-slate-700">{col.label}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-black ${col.contador}`}>
                  {cols[idx].length}
                </span>
              </div>
            </div>

            {/* Cards */}
            {cols[idx].length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <p className="text-xs text-slate-400">Nenhum pedido</p>
              </div>
            ) : cols[idx].map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} tempoPadrao={tempoPadrao}
                onAvancar={(est) => avancar(pedido, est)}
                onCancelar={() => cancelar(pedido)} />
            ))}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-300">Atualização automática via Supabase Realtime</p>
    </section>
  );
}
