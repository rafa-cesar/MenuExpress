import { Link, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function PublicLayout() {
  const isAdminArea = window.location.pathname.startsWith('/admin');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

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
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-brand-600">
              Home
            </Link>
            <Link
              to="/cardapio"
              className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              Ver meu cardápio
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:border-brand-600 hover:text-brand-600"
              >
                ← Voltar ao Admin
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} <strong className="text-slate-700">Yellow Tech</strong>. Todos os direitos reservados.</span>
          <span className="text-xs text-slate-400">MenuExpress &mdash; plataforma de cardápios digitais</span>
        </div>
      </footer>
    </div>
  );
}
