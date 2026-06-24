import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const navItems = [
  { to: '/admin',               label: 'Dashboard',  exact: true,  icon: '📊' },
  { to: '/admin/pedidos',       label: 'Pedidos',    exact: false, icon: '🛒' },
  { to: '/admin/produtos',      label: 'Produtos',   exact: false, icon: '🍔' },
  { to: '/admin/categorias',    label: 'Categorias', exact: false, icon: '📋' },
  { to: '/admin/configuracoes', label: 'Config.',    exact: false, icon: '⚙️' },
];

function Logo() {
  return (
    <span className="text-xl font-black tracking-tight select-none">
      <span className="text-slate-950">Menu</span><span className="text-brand-600">Express</span>
    </span>
  );
}

export function AdminLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: '/admin/login' });
  }, [session, loading, navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: '/admin/login' });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <p className="text-sm text-slate-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="shrink-0 py-4">
            <Logo />
          </Link>

          <span className="hidden h-5 w-px bg-slate-200 lg:block" />
          <span className="hidden text-xs font-bold uppercase tracking-widest text-slate-400 lg:block">Painel admin</span>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}
                activeOptions={item.exact ? { exact: true } : undefined}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                activeProps={{ className: 'rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-brand-200' }}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <a href="/cardapio" target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600">
              Ver cardápio ↗
            </a>
            <div className="h-5 w-px bg-slate-200" />
            <p className="max-w-[160px] truncate text-xs text-slate-400">{session.user.email}</p>
            <button type="button" onClick={handleLogout}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
              Sair
            </button>
          </div>

          {/* Mobile right */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <a href="/cardapio" target="_blank" rel="noopener noreferrer"
              className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-black text-white">Cardápio ↗</a>
            <button type="button" onClick={() => setMenuOpen((o) => !o)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Menu">
              {menuOpen
                ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 lg:hidden">
            <nav className="mt-3 space-y-1">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to}
                  activeOptions={item.exact ? { exact: true } : undefined}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  activeProps={{ className: 'flex items-center gap-3 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white' }}
                >
                  <span>{item.icon}</span>{item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="truncate text-xs text-slate-400">{session.user.email}</p>
              <button type="button" onClick={handleLogout}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">Sair</button>
            </div>
          </div>
        )}
      </header>

      {/* CONTEÚDO */}
      <main className="pb-24 lg:pb-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* BOTTOM NAV MOBILE */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white shadow-[0_-8px_32px_rgba(15,23,42,0.10)] lg:hidden">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to}
            activeOptions={item.exact ? { exact: true } : undefined}
            className="flex flex-col items-center gap-0.5 px-1 py-3 text-slate-400 transition"
            activeProps={{ className: 'flex flex-col items-center gap-0.5 px-1 py-3 text-brand-600' }}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[9px] font-black">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
