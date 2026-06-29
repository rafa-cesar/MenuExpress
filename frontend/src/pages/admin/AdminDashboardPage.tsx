import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useMenuStore } from '../../context/MenuStoreContext';
import { useStoreStatus } from '../../hooks/useStoreStatus';
import { pedidosService } from '../../services/pedidosService';
import type { Pedido } from '../../types/domain';

const fmt     = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

function startOfDay(d: Date) { const r = new Date(d); r.setHours(0,0,0,0); return r; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isoDay(d: Date) { return d.toISOString().slice(0,10); }

function exportCSV(pedidos: Pedido[], label: string) {
  const header = 'Numero,Data,Status,Modalidade,Cliente,Subtotal,Taxa,Total';
  const rows = pedidos.map((p) =>
    [p.numero, new Date(p.criadoEm).toLocaleString('pt-BR'), p.status, p.modalidade,
     p.clienteNome ?? '', p.subtotal.toFixed(2), p.taxaEntrega.toFixed(2), p.total.toFixed(2)].join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `pedidos_${label}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-black ${accent ?? 'text-slate-950'}`}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d) => {
        const pct = d.value / max;
        return (
          <div key={d.label} className="group flex flex-1 flex-col items-center gap-1">
            <div className="relative w-full">
              {d.value > 0 && (
                <div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
                  {fmt.format(d.value)}
                </div>
              )}
              <div
                className="w-full rounded-t-lg bg-brand-500 transition-all"
                style={{ height: `${Math.max(pct * 112, d.value > 0 ? 4 : 2)}px`, opacity: pct > 0 ? 0.6 + pct * 0.4 : 0.15 }}
              />
            </div>
            <p className="text-[9px] font-semibold capitalize text-slate-400">{d.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function AlertCard({ title, body, to, cta }: { title: string; body: string; to: string; cta: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-black text-amber-900">{title}</p>
        <p className="mt-0.5 text-xs text-amber-700">{body}</p>
        <Link to={to} className="mt-2 inline-flex text-xs font-black text-amber-800 underline underline-offset-2 hover:text-amber-900">{cta} →</Link>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  usePageTitle('Dashboard — MenuExpress');
  const { empresa, produtos, categorias } = useMenuStore();
  const storeStatus = useStoreStatus();

  const [pedidos, setPedidos]     = useState<Pedido[]>([]);
  const [loading, setLoading]     = useState(true);
  const [exportando, setExportando] = useState(false);
  const [periodo, setPeriodo]     = useState<'hoje' | '7d' | '30d'>('7d');

  // Só busca pedidos quando empresa estiver carregada (empresa !== null)
  useEffect(() => {
    if (!empresa) return;
    const empresaId = empresa.id;
    async function load() {
      const [ativos, historico] = await Promise.all([
        pedidosService.listar(empresaId),
        pedidosService.listarHistorico(empresaId),
      ]);
      setPedidos([...ativos, ...historico]);
      setLoading(false);
    }
    load();
  }, [empresa]);

  const pedidosFiltrados = useMemo(() => {
    const agora  = new Date();
    const inicio = periodo === 'hoje' ? startOfDay(agora)
      : periodo === '7d' ? startOfDay(addDays(agora, -6))
      : startOfDay(addDays(agora, -29));
    return pedidos.filter((p) => new Date(p.criadoEm) >= inicio && p.status !== 'cancelado');
  }, [pedidos, periodo]);

  const faturamento  = useMemo(() => pedidosFiltrados.reduce((s, p) => s + p.total, 0), [pedidosFiltrados]);
  const numPedidos   = pedidosFiltrados.length;
  const ticketMedio  = numPedidos > 0 ? faturamento / numPedidos : 0;
  const pedidosHoje  = useMemo(() => pedidos.filter(
    (p) => new Date(p.criadoEm) >= startOfDay(new Date()) && p.status !== 'cancelado'
  ), [pedidos]);
  const faturadoHoje = pedidosHoje.reduce((s, p) => s + p.total, 0);

  const chartData = useMemo(() => {
    const dias = periodo === 'hoje' ? 1 : periodo === '7d' ? 7 : 30;
    return Array.from({ length: dias }, (_, i) => {
      const day   = startOfDay(addDays(new Date(), -(dias - 1 - i)));
      const key   = isoDay(day);
      const total = pedidos
        .filter((p) => isoDay(new Date(p.criadoEm)) === key && p.status !== 'cancelado')
        .reduce((s, p) => s + p.total, 0);
      const label = dias <= 7
        ? fmtDate.format(day).split(',')[0]
        : String(day.getDate()).padStart(2, '0');
      return { label, value: total };
    });
  }, [pedidos, periodo]);

  const topProdutos = useMemo(() => {
    const mapa: Record<string, { nome: string; qtd: number; total: number }> = {};
    for (const p of pedidosFiltrados)
      for (const item of p.itens) {
        if (!mapa[item.nome]) mapa[item.nome] = { nome: item.nome, qtd: 0, total: 0 };
        mapa[item.nome].qtd   += item.quantidade;
        mapa[item.nome].total += item.subtotal;
      }
    return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [pedidosFiltrados]);

  const horarioPico = useMemo(() => {
    const contagem: Record<number, number> = {};
    for (const p of pedidosFiltrados) {
      const h = new Date(p.criadoEm).getHours();
      contagem[h] = (contagem[h] ?? 0) + 1;
    }
    const entries = Object.entries(contagem);
    if (!entries.length) return null;
    const [hora, qtd] = entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    return { hora: `${hora}h–${Number(hora) + 1}h`, qtd: Number(qtd) };
  }, [pedidosFiltrados]);

  const produtosInativos      = produtos.filter((p) => !p.disponivel).length;
  const destaques             = produtos.filter((p) => p.destaque && p.disponivel).length;
  const categoriasSemProdutos = categorias.filter(
    (c) => c.ativa && !produtos.some((p) => p.categoriaId === c.id && p.disponivel)
  ).length;

  // empresa?.horario — guard necessário pois empresa pode ser null durante carregamento
  const alerts = [
    produtosInativos > 0      && { title: `${produtosInativos} produto(s) pausado(s)`,    body: 'Não aparecem no cardápio.',      to: '/admin/produtos',      cta: 'Revisar' },
    empresa?.horario?.status === 'forcar_fechado' && { title: 'Loja forçada como fechada', body: 'Clientes não conseguem pedir.', to: '/admin/configuracoes', cta: 'Abrir config.' },
    categoriasSemProdutos > 0 && { title: `${categoriasSemProdutos} categoria(s) vazia(s)`, body: 'Ficam ocultas no cardápio.',   to: '/admin/categorias',    cta: 'Ver categorias' },
    destaques === 0           && { title: 'Nenhum produto em destaque',                   body: 'Destaques aumentam conversões.',  to: '/admin/produtos',      cta: 'Destacar' },
  ].filter(Boolean) as { title: string; body: string; to: string; cta: string }[];

  async function handleExport() {
    setExportando(true);
    exportCSV(pedidosFiltrados, periodo);
    setTimeout(() => setExportando(false), 800);
  }

  const periodoLabel = { hoje: 'Hoje', '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias' }[periodo];

  return (
    <section className="space-y-8">

      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Visão geral</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-xs font-black ${
            storeStatus.aberta ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
              storeStatus.aberta ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
            {storeStatus.aberta ? 'Loja aberta' : 'Loja fechada'}
          </span>
          <a href="/cardapio" target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600">
            Ver cardápio ↗
          </a>
        </div>
      </div>

      {/* Seletor de período + Exportar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {(['hoje', '7d', '30d'] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPeriodo(p)}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition ${
                periodo === p ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}>
              {{ hoje: 'Hoje', '7d': '7 dias', '30d': '30 dias' }[p]}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleExport} disabled={exportando || pedidosFiltrados.length === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
          {exportando ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={`Faturamento — ${periodoLabel}`} value={fmt.format(faturamento)}
            sub={`Hoje: ${fmt.format(faturadoHoje)}`} accent="text-brand-600" />
          <KpiCard label="Pedidos" value={String(numPedidos)} sub={`${pedidosHoje.length} hoje`} />
          <KpiCard label="Ticket médio" value={fmt.format(ticketMedio)} sub="Por pedido no período" />
          <KpiCard label="Horário de pico" value={horarioPico?.hora ?? '—'}
            sub={horarioPico ? `${horarioPico.qtd} pedidos nessa faixa` : 'Sem dados ainda'} />
        </div>
      )}

      {/* Gráfico + Top produtos */}
      {!loading && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Faturamento</p>
                <p className="mt-1 text-lg font-black text-slate-950">{periodoLabel}</p>
              </div>
              <p className="text-2xl font-black text-brand-600">{fmt.format(faturamento)}</p>
            </div>
            <div className="mt-6">
              {chartData.every((d) => d.value === 0) ? (
                <div className="flex h-32 items-center justify-center rounded-xl bg-slate-50">
                  <p className="text-sm text-slate-400">Nenhum pedido no período</p>
                </div>
              ) : (
                <BarChart data={chartData} />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Mais vendidos</p>
            <p className="mt-1 text-lg font-black text-slate-950">{periodoLabel}</p>
            {topProdutos.length === 0 ? (
              <div className="mt-4 flex items-center justify-center py-8">
                <p className="text-sm text-slate-400">Sem dados no período</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {topProdutos.map((p, i) => (
                  <li key={p.nome} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      i === 0 ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                    }`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{p.nome}</p>
                      <p className="text-xs text-slate-400">{p.qtd} un. vendidas</p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-slate-950">{fmt.format(p.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Alertas operacionais */}
      {alerts.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Requer atenção</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {alerts.map((a) => <AlertCard key={a.title} {...a} />)}
          </div>
        </div>
      )}

      {/* Atalhos */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Gerenciar</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Pedidos',       sub: 'Kanban em tempo real',  to: '/admin/pedidos',      icon: '🛒' },
            { label: 'Produtos',      sub: 'Adicionar ou pausar',   to: '/admin/produtos',     icon: '🍔' },
            { label: 'Categorias',    sub: 'Organizar o cardápio',  to: '/admin/categorias',   icon: '📋' },
            { label: 'Configurações', sub: 'Loja, horário, entrega', to: '/admin/configuracoes', icon: '⚙️' },
          ].map((item) => (
            <Link key={item.to} to={item.to}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl group-hover:bg-brand-50">{item.icon}</span>
              <div>
                <p className="text-sm font-black text-slate-950">{item.label}</p>
                <p className="text-xs text-slate-400">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </section>
  );
}
