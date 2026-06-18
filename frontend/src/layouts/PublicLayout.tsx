import { Link, Outlet } from '@tanstack/react-router';

export function PublicLayout() {
  const isAdminArea = window.location.pathname.startsWith('/admin');

  if (isAdminArea) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-black tracking-tight text-slate-950">
            Menu<span className="text-brand-600">Express</span>
          </Link>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 sm:gap-4">
            <Link to="/" className="hover:text-brand-600" activeProps={{ className: 'text-brand-600' }}>
              Home
            </Link>
            <Link to="/admin" className="hover:text-brand-600" activeProps={{ className: 'text-brand-600' }}>
              Admin
            </Link>
            <Link to="/cardapio" className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-700" activeProps={{ className: 'rounded-full bg-slate-950 px-4 py-2 text-white' }}>
              Ver cardápio
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-sm text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} MenuExpress. Base SaaS multiempresa em evolução.
        </div>
      </footer>
    </div>
  );
}
