import { FormEvent, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';

export function AdminLoginPage() {
  usePageTitle('Entrar — MenuExpress');
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError('E-mail ou senha inválidos. Verifique e tente novamente.'); return; }
    navigate({ to: '/admin' });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">

      {/* Logo */}
      <Link to="/" className="mb-8 text-2xl font-black tracking-tight">
        <span className="text-white">Menu</span><span className="text-brand-500">Express</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <h1 className="text-xl font-black text-white">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-400">Entre com seu e-mail e senha para acessar o painel.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-300">E-mail</span>
              <input type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-300">Senha</span>
              <input type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </label>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-brand-600 py-3.5 font-black text-white transition hover:bg-brand-700 disabled:opacity-60">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="font-bold text-brand-500 hover:text-brand-400">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
}
