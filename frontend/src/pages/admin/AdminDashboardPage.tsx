import { Link } from '@tanstack/react-router';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useMenuStore } from '../../context/MenuStoreContext';
import { useStoreStatus } from '../../hooks/useStoreStatus';

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: 'green' | 'red' | 'yellow' }) {
  const accentClass = accent === 'green' ? 'text-emerald-600' : accent === 'red' ? 'text-red-500' : accent === 'yellow' ? 'text-yellow-500' : 'text-slate-950';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-3 text-4xl font-black ${accentClass}`}>{value}</p>
      {sub && <p className="mt-2 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

function AlertCard({ emoji, title, body, to, cta }: { emoji: string; title: string; body: string; to: string; cta: string }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <p className="font-black text-amber-900">{title}</p>
        <p className="mt-1 text-sm text-amber-700">{body}</p>
        <Link to={to} className="mt-3 inline-flex rounded-full bg-amber-900 px-4 py-2 text-xs font-black text-white hover:bg-amber-800">{cta} →</Link>
      </div>
    </div>
  );
}

function ActionCard({ emoji, title, description, to }: { emoji: string; title: string; description: string; to: string }) {
  return (
    <Link to={to} className="group flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl group-hover:bg-slate-200">{emoji}</span>
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

export function AdminDashboardPage() {
  usePageTitle('Dashboard');
  const { empresa, produtos, categorias } = useMenuStore();
  const storeStatus = useStoreStatus();

  const produtosAtivos = produtos.filter((p) => p.disponivel).length;
  const produtosInativos = produtos.filter((p) => !p.disponivel).length;
  const destaques = produtos.filter((p) => p.destaque && p.disponivel).length;
  const categoriasAtivas = categorias.filter((c) => c.ativa).length;
  const categoriasSemProdutos = categorias.filter(
    (c) => c.ativa && !produtos.some((p) => p.categoriaId === c.id && p.disponivel)
  ).length;

  const alerts: { emoji: string; title: string; body: string; to: string; cta: string }[] = [];

  if (produtosInativos > 0)
    alerts.push({ emoji: '⚠️', title: `${produtosInativos} produto${produtosInativos > 1 ? 's' : ''} pausado${produtosInativos > 1 ? 's'  : ''}`, body: 'Produtos pausados não aparecem no cardápio para os clientes.', to: '/admin/produtos', cta: 'Revisar produtos' });

  if (empresa.horario?.status === 'forcar_fechado')
    alerts.push({ emoji: '🔴', title: 'Loja forçada como fechada', body: 'Clientes não conseguem fazer pedidos enquanto a loja estiver neste modo.', to: '/admin/configuracoes', cta: 'Abrir configurações' });

  if (categoriasSemProdutos > 0)
    alerts.push({ emoji: '📂', title: `${categoriasSemProdutos} categoria${categoriasSemProdutos > 1 ? 's' : ''} vazia${categoriasSemProdutos > 1 ? 's' : ''}`, body: 'Categorias sem produtos disponíveis ficam ocultas no cardápio.', to: '/admin/categorias', cta: 'Ver categorias' });

  if (destaques === 0)
    alerts.push({ emoji: '🌟', title: 'Nenhum produto em destaque', body: 'Produtos em destaque aparecem em primeiro no cardápio e aumentam as conversões.', to: '/admin/produtos', cta: 'Destacar produtos' });

  return (
    <section className="space-y-8">

      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Visão geral</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-4 py-2 text-sm font-black ${ storeStatus.aberta ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700' }`}>
            {storeStatus.aberta ? '🟢 Loja aberta' : '🔴 Loja fechada'}
          </span>
          <a href="/cardapio" target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-600 hover:border-slate-400 hover:text-slate-900">
            Ver cardápio ↗
          </a>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Produtos ativos" value={produtosAtivos} sub={`${produtos.length} no total`} accent="green" />
        <StatCard label="Produtos pausados" value={produtosInativos} sub="Fora do cardápio" accent={produtosInativos > 0 ? 'red' : undefined} />
        <StatCard label="Categorias ativas" value={categoriasAtivas} sub={`${categorias.length} no total`} />
        <StatCard label="Em destaque" value={destaques} sub="Itens promocionais" accent={destaques > 0 ? 'yellow' : undefined} />
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Requer atenção</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.map((a) => <AlertCard key={a.title} {...a} />)}
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Gerenciar</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard emoji="🍔" title="Produtos" description="Adicione, edite, pause ou destaque itens do cardápio." to="/admin/produtos" />
          <ActionCard emoji="📋" title="Categorias" description="Organize o cardápio em seções e defina a ordem de exibição." to="/admin/categorias" />
          <ActionCard emoji="⚙️" title="Configurações" description="Identidade visual, horário de funcionamento e dados da loja." to="/admin/configuracoes" />
        </div>
      </div>

      {/* Rodapé informativo */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-black text-slate-700">📍 Seu cardápio público</p>
        <p className="mt-1 font-mono text-sm text-slate-500">/cardapio</p>
        <p className="mt-3 text-sm text-slate-500">
          Empresa: <strong className="text-slate-700">{empresa.nome}</strong> &nbsp;·&nbsp; Cidade: <strong className="text-slate-700">{empresa.cidade}</strong>
        </p>
      </div>

    </section>
  );
}
