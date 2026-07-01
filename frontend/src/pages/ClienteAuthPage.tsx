import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useClienteAuth } from '../context/ClienteAuthContext';
import { useMenuStore } from '../context/MenuStoreContext';
import { useBrand } from '../hooks/useBrand';
import type { EnderecoCliente } from '../types/domain';

export function ClienteAuthPage() {
  const { user, perfil, loading, loginComGoogle, salvarPerfil, perfilCompleto } = useClienteAuth();
  const { empresa } = useMenuStore();
  const navigate = useNavigate();
  const brand = useBrand(empresa?.corPrincipal ?? '#f97316', empresa?.estiloVisual ?? 'moderno');
  const btnStyle = { backgroundColor: brand.primary, color: brand.onPrimary, borderRadius: brand.buttonRadius };

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState(empresa?.cidade ?? '');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (user && perfil) {
      setNome(perfil.nome ?? '');
      setWhatsapp(perfil.whatsapp ?? '');
      setDataNasc(perfil.dataNasc ?? '');
      if (perfil.endereco) {
        setRua(perfil.endereco.rua ?? '');
        setNumero(perfil.endereco.numero ?? '');
        setBairro(perfil.endereco.bairro ?? '');
        setCidade(perfil.endereco.cidade ?? empresa?.cidade ?? '');
      }
    } else if (user && !perfil) {
      setNome(user.user_metadata?.full_name ?? '');
    }
  }, [user, perfil, empresa]);

  // Se já logado e perfil completo, redireciona direto pro checkout
  useEffect(() => {
    if (!loading && user && perfilCompleto) {
      navigate({ to: '/checkout/resumo' });
    }
  }, [loading, user, perfilCompleto, navigate]);

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </section>
    );
  }

  // Não logado — tela de login
  if (!user) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {empresa?.logoUrl && (
            <img src={empresa.logoUrl} alt={empresa.nome} className="mx-auto mb-5 h-16 w-16 rounded-2xl object-cover" />
          )}
          <h1 className="text-center text-2xl font-black text-slate-950">Entrar na sua conta</h1>
          <p className="mt-2 text-center text-sm text-slate-500">Faça login para finalizar seu pedido e acompanhá-lo.</p>

          <button onClick={loginComGoogle}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-sm font-black text-slate-800 transition hover:bg-slate-50">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="mt-4 text-center">
            <button onClick={() => navigate({ to: '/checkout/resumo' })} className="text-xs text-slate-400 hover:text-slate-600 underline">
              Continuar sem conta (pedido anônimo)
            </button>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-400">Powered by <strong>YellowTech</strong></p>
      </section>
    );
  }

  // Logado mas perfil incompleto — completar perfil
  async function salvar() {
    if (!nome.trim() || !whatsapp.trim()) return;
    setSalvando(true);
    const endereco: EnderecoCliente | undefined = rua
      ? { rua, numero, bairro, cidade, complemento: '' }
      : undefined;
    await salvarPerfil({
      empresaId: empresa?.id ?? '',
      nome, whatsapp, dataNasc: dataNasc || undefined, endereco,
    });
    setSalvando(false);
  }

  return (
    <section className="min-h-screen bg-slate-50 pb-32">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} className="h-full w-full rounded-full object-cover" alt="foto" />
              : <span className="text-sm font-black text-slate-600">{user.email?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950">Complete seu perfil</h1>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Nome completo *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">WhatsApp * <span className="text-slate-400 normal-case font-normal">(para receber atualizações)</span></label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(81) 99999-9999" type="tel"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Data de nascimento</label>
            <input value={dataNasc} onChange={e => setDataNasc(e.target.value)} type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Endereço (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input value={rua} onChange={e => setRua(e.target.value)} placeholder="Rua"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="Número"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              <input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              <div className="col-span-2">
                <input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4">
        <button onClick={salvar} disabled={salvando || !nome.trim() || !whatsapp.trim()} className="w-full rounded-full py-4 font-black text-white disabled:opacity-50" style={btnStyle}>
          {salvando ? 'Salvando...' : 'Salvar e continuar →'}
        </button>
      </div>
    </section>
  );
}
