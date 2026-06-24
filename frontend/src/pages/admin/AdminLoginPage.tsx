import { FormEvent, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';

export function AdminLoginPage() {
  usePageTitle('Entrar no Admin');

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError('E-mail ou senha inválidos. Verifique e tente novamente.');
      return;
    }

    navigate({ to: '/admin' });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-3xl font-black tracking-tight text-white">
            Yellow<span className="text-yellow-400">Tech</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">Painel administrativo &mdash; MenuExpress</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8"
        >
          <h1 className="text-xl font-black text-white">Entrar</h1>
          <p className="mt-1 text-sm text-slate-400">Acesso restrito ao dono do estabelecimento.</p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-slate-300">
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-yellow-400"
                placeholder="seu@email.com"
              />
            </label>

            <label className="block text-sm font-bold text-slate-300">
              Senha
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-yellow-400"
                placeholder="••••••••"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-yellow-400 px-5 py-3 font-black text-slate-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
