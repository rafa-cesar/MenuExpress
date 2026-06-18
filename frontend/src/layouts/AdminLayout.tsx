import { Link, Outlet } from '@tanstack/react-router';

type NavigationItem = {
  to: string;
  label: string;
  exact?: boolean;
};

const navigationItems: NavigationItem[] = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/configuracoes', label: 'Configurações' },
  { to: '/cardapio', label: 'Ver cardápio' },
];

const desktopLinkClass = 'block rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white';
const desktopActiveLinkClass = 'block rounded-2xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/20';
const mobileLinkClass = 'rounded-2xl px-2 py-3 text-center text-[0.68rem] font-black text-slate-500';
const mobileActiveLinkClass = 'rounded-2xl bg-brand-100 px-2 py-3 text-center text-[0.68rem] font-black text-brand-700';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-slate-950 px-5 py-6 text-white lg:block">
        <Link to="/admin" className="text-2xl font-black tracking-tight">
          Menu<span className="text-brand-500">Express</span>
        </Link>
        <p className="mt-2 text-sm text-slate-400">Painel do restaurante</p>

        <nav className="mt-8 space-y-2" aria-label="Navegação administrativa">
          {navigationItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className={desktopLinkClass}
              activeProps={{ className: desktopActiveLinkClass }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-5 bottom-6 rounded-3xl bg-white/10 p-4">
          <p className="text-sm font-bold text-white">Área administrativa</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Mock local preparado para Supabase e multiempresa.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link to="/admin" className="text-xl font-black tracking-tight text-slate-950">
            Menu<span className="text-brand-600">Express</span>
          </Link>
          <Link to="/cardapio" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">
            Ver cardápio
          </Link>
        </div>
      </header>

      <main className="pb-28 lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 border-t border-slate-200 bg-white p-2 shadow-[0_-12px_40px_rgba(15,23,42,0.14)] lg:hidden" aria-label="Navegação administrativa mobile">
        {navigationItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className={mobileLinkClass}
            activeProps={{ className: mobileActiveLinkClass }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
