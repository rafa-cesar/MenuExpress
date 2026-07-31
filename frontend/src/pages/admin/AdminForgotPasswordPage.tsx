import { FormEvent, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';

export function AdminForgotPasswordPage() {
  usePageTitle('Recuperar senha — MenuExpress');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/redefinir-senha`,
    });

    setLoading(false);
    if (resetError) {
      setError('Não foi possível enviar o e-mail agora. Aguarde um pouco e tente novamente.');
      return;
    }

    // A mesma resposta é exibida mesmo se o e-mail não existir, evitando
    // revelar quais endereços possuem conta no sistema.
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center text-2xl font-black tracking-tight">
          <span className="text-white">Menu</span><span className="text-brand-500">Express</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <h1 className="text-xl font-black text-white">Recuperar senha</h1>

          {sent ? (
            <div className="mt-5">
              <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
                Se esse e-mail estiver cadastrado, você receberá um link para definir uma nova senha.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Confira também as pastas de spam e lixo eletrônico.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-400">
                Informe o e-mail usado no cadastro para receber o link de recuperação.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-300">E-mail</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          )}

          <Link
            to="/admin/login"
            className="mt-6 block text-center text-sm font-bold text-brand-400 hover:text-brand-300"
          >
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
