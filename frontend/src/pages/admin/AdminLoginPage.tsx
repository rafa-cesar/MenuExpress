import { FormEvent, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';

export function AdminLoginPage() {
  usePageTitle('Entrar — MenuExpress');
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError(
        authError.code === 'email_not_confirmed'
          ? 'Confirme seu e-mail antes de entrar.'
          : 'E-mail ou senha inválidos. Verifique e tente novamente.'
      );
      return;
    }
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
              <span className="flex items-center justify-between text-sm font-bold text-slate-300">
                Senha
                <Link to="/admin/esqueci-senha" className="text-xs text-brand-400 hover:text-brand-300">
                  Esqueci minha senha
                </Link>
              </span>
              <div className="relative mt-1.5">
                <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                >
                  {showPassword ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.9 10.9 0 0112 4c5.5 0 9 5 9 5a17.2 17.2 0 01-2.1 2.6M6.2 6.2C4.2 7.5 3 9 3 9s3.5 5 9 5c1 0 2-.2 2.8-.5" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </div>
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
      </div>
    </div>
  );
}
