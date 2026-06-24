import { useEffect, useRef, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { pedidosService } from '../../services/pedidosService';
import { supabase } from '../../lib/supabase';
import type { Pedido, PedidoStatus } from '../../types/domain';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const TEMPO_PADRAO_MIN = 30;

// Colunas do Kanban
const COLUNAS: { status: PedidoStatus; label: string; emoji: string; cor: string }[] = [
  { status: 'aguardando',     label: 'Aguardando',        emoji: '⏳', cor: 'border-blue-300 bg-blue-50' },
  { status: 'em_preparo',     label: 'Em preparação',     emoji: '👨‍🍳', cor: 'border-amber-300 bg-amber-50' },
  { status: 'pronto_retirada',label: 'Pronto p/ retirada',emoji: '✅', cor: 'border-emerald-300 bg-emerald-50' },
  { status: 'saiu_entrega',   label: 'Saiu p/ entrega',   emoji: '🚵', cor: 'border-violet-300 bg-violet-50' },
  { status: 'finalizado',     label: 'Finalizados',       emoji: '📦', cor: 'border-slate-200 bg-slate-50' },
];

// Próximo status por modalidade
function proximoStatus(pedido: Pedido): PedidoStatus | null {
  switch (pedido.status) {
    case 'aguardando': return 'em_preparo';
    case 'em_preparo': return pedido.modalidade === 'entrega' ? 'saiu_entrega' : 'pronto_retirada';
    case 'pronto_retirada': return 'finalizado';
    case 'saiu_entrega': return 'finalizado';
    default: return null;
  }
}

// Label do botão de avançar
function btnAvancarLabel(pedido: Pedido): string {
  switch (pedido.status) {
    case 'aguardando': return 'Iniciar preparação';
    case 'em_preparo': return pedido.modalidade === 'entrega' ? 'Despachar entrega 🚵' : 'Pronto p/ retirada ✅';
    case 'pronto_retirada': return 'Confirmar retirada';
    case 'saiu_entrega': return 'Confirmar entrega';
    default: return '';
  }
}

// Mensagem WhatsApp pré-pronta por status
function buildWhatsAppMsg(pedido: Pedido): string {
  const num = `#${String(pedido.numero).padStart(4, '0')}`;
  const nome = pedido.clienteNome || 'cliente';
  const previsao = pedido.previsaoEm ? ` Previsão: ${fmtHora.format(new Date(pedido.previsaoEm))}.` : '';
  switch (pedido.status) {
    case 'em_preparo':
      return `Olá ${nome}! 👋 Seu pedido ${num} foi confirmado e está em preparação.${previsao} Em breve estará pronto!`;
    case 'pronto_retirada':
      return `Olá ${nome}! ✅ Seu pedido ${num} está pronto para retirada. Pode vir buscar!`;
    case 'saiu_entrega':
      return `Olá ${nome}! 🚵 Seu pedido ${num} saiu para entrega. Chegando em breve!`;
    case 'finalizado':
      return `Olá ${nome}! 📦 Pedido ${num} finalizado. Obrigado pela preferência!`;
    default:
      return `Olá ${nome}! Atualização sobre seu pedido ${num}.`;
  }
}

function minutosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function UrgenciaBadge({ criadoEm, status }: { criadoEm: string; status: PedidoStatus }) {
  const min = minutosDesde(criadoEm);
  const emAndamento = status !== 'finalizado' && status !== 'cancelado';
  if (!emAndamento) return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-400">há {min} min</span>;
  if (min < 5)  return <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">🟢 há {min} min</span>;
  if (min < 15) return <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">🟡 há {min} min</span>;
  return <span className="inline-flex animate-pulse rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">🔴 há {min} min</span>;
}

// Modal de estimativa ao iniciar preparo
function EstimativaModal({
  pedido, tempoPadrao, onConfirm, onCancel,
}: { pedido: Pedido; tempoPadrao: number; onConfirm: (min: number) => void; onCancel: () => void }) {
  const [minutos, setMinutos] = useState(tempoPadrao);
  const previsao = new Date(Date.now() + minutos * 60_000);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Pedido #{String(pedido.numero).padStart(4, '0')}</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">⏱️ Tempo estimado</h2>
        <p className="mt-1 text-sm text-slate-500">Ajuste o tempo para este pedido específico.</p>

        <div className="mt-5 flex items-center gap-3">
          <button type="button" onClick={() => setMinutos((m) => Math.max(5, m - 5))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-black hover:bg-slate-200">−</button>
          <div className="flex-1 text-center">
            <p className="text-4xl font-black text-slate-950">{minutos}</p>
            <p className="text-sm text-slate-400">minutos</p>
          </div>
          <button type="button" onClick={() => setMinutos((m) => Math.min(120, m + 5))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white hover:bg-slate-800">+</button>
        </div>

        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-center">
          <p className="text-xs text-amber-600">Previsão de conclusão</p>
          <p className="text-2xl font-black text-amber-800">{fmtHora.format(previsao)}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel}
            className="rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={() => onConfirm(minutos)}
            className="rounded-2xl bg-slate-950 py-3 text-sm font-black text-white hover:bg-slate-800">Iniciar preparo</button>
        </div>
      </div>
    </div>
  );
}

function PedidoCard({
  pedido, tempoPadrao, onAvancar, onCancelar,
}: { pedido: Pedido; tempoPadrao: number; onAvancar: (estimativa?: number) => void; onCancelar: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const proximo = proximoStatus(pedido);
  const btnLabel = btnAvancarLabel(pedido);
  const urgente = pedido.status === 'aguardando' && minutosDesde(pedido.criadoEm) >= 15;

  const whatsappUrl = pedido.clienteTel
    ? `https://wa.me/55${pedido.clienteTel.replace(/\D/g, '')}?text=${encodeURIComponent(buildWhatsAppMsg(pedido))}`
    : null;

  function handleAvancar() {
    if (pedido.status === 'aguardando') { setShowModal(true); return; }
    onAvancar();
  }

  return (
    <>
      {showModal && (
        <EstimativaModal
          pedido={pedido}
          tempoPadrao={tempoPadrao}
          onConfirm={(min) => { setShowModal(false); onAvancar(min); }}
          onCancel={() => setShowModal(false)}
        />
      )}
      <div className={`rounded-3xl border bg-white p-4 shadow-sm transition ${
        urgente ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
      }`}>
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Pedido</p>
            <p className="text-xl font-black text-slate-950">#{String(pedido.numero).padStart(4, '0')}</p>
          </div>
          <UrgenciaBadge criadoEm={pedido.criadoEm} status={pedido.status} />
        </div>

        {/* Previsão */}
        {pedido.previsaoEm && pedido.status === 'em_preparo' && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
            <span className="text-sm">⏰</span>
            <div>
              <p className="text-xs text-amber-600">Previsão</p>
              <p className="text-sm font-black text-amber-800">{fmtHora.format(new Date(pedido.previsaoEm))}</p>
            </div>
          </div>
        )}

        {/* Cliente */}
        <div className="mt-3 space-y-0.5">
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
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">📝 {pedido.observacao}</p>
        )}

        {/* Modalidade + total */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {pedido.modalidade === 'entrega' ? `🚚 ${pedido.clienteEnd || 'Entrega'}` : '🏠 Retirada'}
          </span>
          <p className="font-black text-slate-950">{fmt.format(pedido.total)}</p>
        </div>

        {/* Ações */}
        <div className="mt-3 flex flex-wrap gap-2">
          {proximo && btnLabel && (
            <button type="button" onClick={handleAvancar}
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
          {pedido.status !== 'finalizado' && pedido.status !== 'cancelado' && (
            <button type="button" onClick={onCancelar}
              className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100">
              Cancelar
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
  const audioRef = useRef<AudioContext | null>(null);
  const prevCountRef = useRef(0);
  const tempoPadrao = TEMPO_PADRAO_MIN; // TODO: buscar de configurações da empresa

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
    const aguardandoCount = data.filter((p) => p.status === 'aguardando').length;
    if (aguardandoCount > prevCountRef.current) playBeep();
    prevCountRef.current = aguardandoCount;
    setPedidos(data);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    const channel = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, () => carregar())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => carregar())
      .subscribe();
    const interval = setInterval(carregar, 30_000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, []);

  async function avancar(pedido: Pedido, estimativa?: number) {
    if (pedido.status === 'aguardando' && estimativa !== undefined) {
      setPedidos((cur) => cur.map((p) => p.id === pedido.id ? { ...p, status: 'em_preparo' } : p));
      await pedidosService.iniciarPreparo(pedido.id, estimativa);
      return;
    }
    const proximo = proximoStatus(pedido);
    if (!proximo) return;
    setPedidos((cur) => cur.map((p) => p.id === pedido.id ? { ...p, status: proximo } : p));
    await pedidosService.atualizarStatus(pedido.id, proximo);
  }

  async function cancelar(pedido: Pedido) {
    if (!confirm(`Cancelar pedido #${String(pedido.numero).padStart(4, '0')}?`)) return;
    setPedidos((cur) => cur.filter((p) => p.id !== pedido.id));
    await pedidosService.atualizarStatus(pedido.id, 'cancelado');
  }

  const cols = COLUNAS.map((col) => pedidos.filter((p) => p.status === col.status));
  const aguardandoCount = cols[0].length;

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
          {aguardandoCount > 0 && (
            <span className="animate-pulse rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white">
              {aguardandoCount} aguardando
            </span>
          )}
          <button type="button" onClick={carregar}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-slate-300">
            Atualizar
          </button>
        </div>
      </div>

      {/* Kanban — 5 colunas */}
      <div className="grid gap-4 lg:grid-cols-5">
        {COLUNAS.map((col, idx) => (
          <div key={col.status}>
            <div className={`mb-3 flex items-center justify-between rounded-2xl border px-4 py-3 ${col.cor}`}>
              <p className="font-black text-slate-900">{col.emoji} {col.label}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-600 shadow-sm">
                {cols[idx].length}
              </span>
            </div>
            <div className="space-y-3">
              {cols[idx].length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-8 text-center">
                  <p className="text-sm text-slate-400">Nenhum pedido</p>
                </div>
              ) : (
                cols[idx].map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    tempoPadrao={tempoPadrao}
                    onAvancar={(est) => avancar(pedido, est)}
                    onCancelar={() => cancelar(pedido)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">Atualização em tempo real · Supabase Realtime</p>
    </section>
  );
}
