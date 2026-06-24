import { FormEvent, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';
import { usePageTitle } from '../hooks/usePageTitle';

type Step = 'conta' | 'loja' | 'sucesso';

export function CadastroPage() {
  usePageTitle('Criar conta — MenuExpress');
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('conta');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // campos
  const [nome, setNome]           = useState('');
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [nomeLoja, setNomeLoja]   = useState('');

  async function handleConta(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (senha.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (senha !== confirmar) { setError('As senhas não coincidem.'); return; }
    setStep('loja');
  }

  async function handleLoja(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_completo: nome, nome_loja: nomeLoja } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'Este e-mail já está cadastrado. Faça login.'
        : 'Não foi possível criar sua conta. Tente novamente.');
      setStep('conta');
      return;
    }

    // Se Supabase já tem sessão (email confirm desabilitado), vai direto pro admin
    if (data.session) {
      navigate({ to: '/admin' });
    } else {
      setStep('sucesso');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-xl font-black tracking-tight">
            <span className="text-slate-950">Menu</span><span className="text-brand-600">Express</span>
          </Link>
          <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900">
            Já tenho conta
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Indicador de etapas */}
          {step !== 'sucesso' && (
            <div className="mb-8 flex items-center gap-3">
              {(['conta', 'loja'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${
                    step === s ? 'bg-brand-600 text-white'
                    : i < (['conta','loja'] as const).indexOf(step) ? 'bg-brand-100 text-brand-700'
                    : 'bg-slate-100 text-slate-400'
                  }`}>{i + 1}</div>
                  <span className={`text-sm font-bold ${ step === s ? 'text-slate-900' : 'text-slate-400' }`}>
                    {{ conta: 'Sua conta', loja: 'Sua loja' }[s]}
                  </span>
                  {i < 1 && <span className="h-px w-8 bg-slate-200" />}
                </div>
              ))}
            </div>
          )}

          {/* STEP 1 — Dados da conta */}
          {step === 'conta' && (
            <form onSubmit={handleConta} className="space-y-5">
              <div>
                <h1 className="text-3xl font-black text-slate-950">Crie sua conta</h1>
                <p className="mt-1 text-slate-500">Preencha seus dados de acesso.</p>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nome completo</span>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">E-mail</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Senha</span>
                <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Confirmar senha</span>
                <input type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </label>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

              <button type="submit"
                className="w-full rounded-full bg-brand-600 py-3.5 font-black text-white transition hover:bg-brand-700">
                Continuar →
              </button>

              <p className="text-center text-sm text-slate-400">
                Já tem uma conta?{' '}
                <Link to="/login" className="font-bold text-brand-600 hover:underline">Fazer login</Link>
              </p>
            </form>
          )}

          {/* STEP 2 — Dados da loja */}
          {step === 'loja' && (
            <form onSubmit={handleLoja} className="space-y-5">
              <div>
                <h1 className="text-3xl font-black text-slate-950">Sobre sua loja</h1>
                <p className="mt-1 text-slate-500">Você pode editar isso depois nas configurações.</p>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nome da loja</span>
                <input type="text" required value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)}
                  placeholder="Ex: Hamburgueria do Zeé"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </label>

              <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
                <p className="text-xs font-bold text-brand-700">Você terá 14 dias grátis para experimentar.</p>
                <p className="mt-0.5 text-xs text-brand-600">Sem cartão de crédito necessário agora.</p>
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full rounded-full bg-brand-600 py-3.5 font-black text-white transition hover:bg-brand-700 disabled:opacity-60">
                {loading ? 'Criando sua conta...' : 'Criar minha conta grátis →'}
              </button>

              <button type="button" onClick={() => setStep('conta')}
                className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-700">
                ← Voltar
              </button>
            </form>
          )}

          {/* STEP 3 — Sucesso / confirmar e-mail */}
          {step === 'sucesso' && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">✅</div>
              <h1 className="mt-6 text-3xl font-black text-slate-950">Conta criada!</h1>
              <p className="mt-3 text-slate-500">
                Enviamos um link de confirmação para <strong>{email}</strong>.<br />
                Confirme seu e-mail e depois faça login.
              </p>
              <Link to="/login"
                className="mt-8 inline-flex rounded-full bg-brand-600 px-8 py-3.5 font-black text-white hover:bg-brand-700">
                Fazer login →
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
