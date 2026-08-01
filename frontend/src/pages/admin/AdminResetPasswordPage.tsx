import { FormEvent, useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';

export function AdminResetPasswordPage() {
  usePageTitle('Redefinir senha — MenuExpress');
  const nextPath = new URLSearchParams(window.location.search).get('next') === '/checkout/auth'
    ? '/checkout/auth'
    : '/admin/login';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [checkingLink, setCheckingLink] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setValidLink(Boolean(data.session));
      setCheckingLink(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setValidLink(true);
      setCheckingLink(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError('O link expirou ou a senha não pôde ser atualizada. Solicite um novo link.');
      return;
    }

    await supabase.auth.signOut();
    window.location.replace(nextPath);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center text-2xl font-black tracking-tight">
          <span className="text-white">Menu</span><span className="text-brand-500">Express</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <h1 className="text-xl font-black text-white">Definir nova senha</h1>

          {checkingLink ? (
            <p className="mt-4 text-sm text-slate-400">Validando link de recuperação...</p>
          ) : !validLink ? (
            <div className="mt-4">
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                Este link é inválido ou expirou.
              </p>
              <a
                href={`/admin/esqueci-senha?next=${encodeURIComponent(nextPath)}`}
                className="mt-5 block text-center text-sm font-bold text-brand-400 hover:text-brand-300"
              >
                Solicitar um novo link
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-300">Nova senha</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-300">Confirmar nova senha</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-brand-600 py-3.5 font-black text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
