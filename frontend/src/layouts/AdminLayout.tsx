import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const navigationItems = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/configuracoes', label: 'Configurações' },
];

export function AdminLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: '/admin/login' });
    }
  }, [session, loading, navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: '/admin/login' });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm font-bold text-slate-400">Verificando acesso...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/5 bg-slate-950 px-5 py-6 text-white lg:block">
        <Link to="/admin" className="block">
          <p className="text-2xl font-black tracking-tight">
            Yellow<span className="text-yellow-400">Tech</span>
          </p>
          <p className="mt-0.5 text-xs font-bold text-slate-400 tracking-widest uppercase">MenuExpress</p>
        </Link>

        <nav className="mt-8 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={item.exact ? { exact: true } : undefined}
              className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              activeProps={{ className: 'block rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-yellow-900/20' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-5 bottom-6 space-y-3">
          <Link
            to="/cardapio"
            className="block rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-black text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400"
          >
            Ver cardápio público ↗
          </Link>
          <div className="rounded-3xl bg-white/5 p-4">
            <p className="text-sm font-bold text-white">Conectado como</p>
            <p className="mt-1 truncate text-xs text-slate-400">{session.user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-full border border-white/10 px-4 py-2 text-sm font-black text-slate-300 hover:border-white/20 hover:text-white"
          >
            Sair
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link to="/admin" className="text-xl font-black tracking-tight text-slate-950">
            Yellow<span className="text-yellow-400">Tech</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/cardapio" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">
              Ver cardápio
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:text-slate-900"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white p-2 shadow-[0_-12px_40px_rgba(15,23,42,0.14)] lg:hidden">
        {navigationItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={item.exact ? { exact: true } : undefined}
            className="rounded-2xl px-2 py-3 text-center text-xs font-black text-slate-500"
            activeProps={{ className: 'rounded-2xl bg-yellow-100 px-2 py-3 text-center text-xs font-black text-yellow-700' }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
