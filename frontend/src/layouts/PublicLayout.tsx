import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Rotas que renderizam sozinhas, sem header/footer do PublicLayout
const STANDALONE_ROUTES = ['/', '/assinar', '/login', '/cadastro', '/cardapio'];

export function PublicLayout() {
  const { pathname } = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsAdmin(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setIsAdmin(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (pathname.startsWith('/admin')) return <Outlet />;
  if (STANDALONE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) return <Outlet />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-black tracking-tight">
            <span className="text-slate-950">Menu</span><span className="text-brand-600">Express</span>
          </Link>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-brand-600">Home</Link>
            {isAdmin && (
              <Link to="/admin" className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:border-brand-600 hover:text-brand-600">
                ← Admin
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} <strong className="text-slate-700">MenuExpress</strong>. Todos os direitos reservados.</span>
          <span>Powered by <strong className="text-slate-600">YellowTech</strong></span>
        </div>
      </footer>
    </div>
  );
}
