import { Link } from '@tanstack/react-router';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { demoCategorias, demoMenuItems } from '../../data/menu';
import { buildTenantMenuPath } from '../../services';
import { useEmpresaConfig } from '../../hooks/useEmpresaConfig';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getStoreOpenStatus } from '../../utils/openingHours';

export function AdminDashboardPage() {
  usePageTitle('Admin');

  const { empresa } = useEmpresaConfig();
  const storeStatus = getStoreOpenStatus(empresa);
  const totalProducts = demoMenuItems.length;
  const activeCategories = demoCategorias.filter((category) => category.ativa).length;
  const featuredProducts = demoMenuItems.filter((product) => product.destaque).length;
  const publicMenuPath = buildTenantMenuPath(empresa.slug);

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Administração"
        title="Dashboard"
        description="Acompanhe os principais dados do cardápio e acesse rapidamente as áreas de gestão da lanchonete."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className={`rounded-3xl border p-5 shadow-sm ${storeStatus.isOpen ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`text-sm font-bold ${storeStatus.isOpen ? 'text-emerald-700' : 'text-red-700'}`}>Funcionamento</p>
          <p className="mt-3 text-2xl font-black text-slate-950">{storeStatus.isOpen ? 'Aberta' : 'Fechada'}</p>
          <p className="mt-2 text-sm text-slate-600">{storeStatus.todayScheduleLabel}</p>
          <Link to="/admin/configuracoes" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
            Abrir/fechar loja
          </Link>
        </article>
        <AdminStatCard title="Total de produtos" value={totalProducts} description="Produtos cadastrados no catálogo mockado." />
        <AdminStatCard title="Categorias ativas" value={activeCategories} description="Categorias visíveis no cardápio público." />
        <AdminStatCard title="Produtos em destaque" value={featuredProducts} description="Itens destacados como promocionais." />
        <article className="rounded-3xl border border-brand-200 bg-brand-50 p-5 shadow-sm">
          <p className="text-sm font-bold text-brand-700">Link do cardápio público</p>
          <p className="mt-3 break-all text-sm font-black text-slate-950">{publicMenuPath}</p>
          <Link to="/cardapio" className="mt-4 inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-black text-white hover:bg-brand-700">
            Abrir MVP atual
          </Link>
        </article>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Link to="/admin/produtos" className="rounded-3xl bg-white p-5 font-black text-slate-950 shadow-sm hover:shadow-lg">
          Gerenciar produtos →
        </Link>
        <Link to="/admin/categorias" className="rounded-3xl bg-white p-5 font-black text-slate-950 shadow-sm hover:shadow-lg">
          Gerenciar categorias →
        </Link>
        <Link to="/admin/configuracoes" className="rounded-3xl bg-white p-5 font-black text-slate-950 shadow-sm hover:shadow-lg">
          Editar configurações →
        </Link>
      </div>
    </section>
  );
}
