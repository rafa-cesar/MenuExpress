import { useEffect, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { paymentService, type PaymentConnectionStatus } from '../../services/paymentService';

export function AdminPaymentsPage() {
  usePageTitle('Pagamentos');
  const [status, setStatus] = useState<PaymentConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const resultado = new URLSearchParams(window.location.search).get('resultado');

  useEffect(() => {
    paymentService.status().then(setStatus).catch(() => setError('Não foi possível consultar a conexão.'))
      .finally(() => setLoading(false));
  }, []);

  async function connect() {
    setConnecting(true); setError('');
    try {
      window.location.assign(await paymentService.iniciarConexao());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a conexão.');
      setConnecting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Recebimento do restaurante</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Pagamentos</h1>
        <p className="mt-2 text-sm text-slate-500">As vendas caem na sua própria conta. O MenuExpress não recebe nem mistura o dinheiro dos estabelecimentos.</p>
      </div>

      {resultado === 'conectado' && <p className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">Conta conectada com sucesso.</p>}
      {resultado && resultado !== 'conectado' && <p className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">A conexão não foi concluída. Tente novamente.</p>}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status?.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <h2 className="text-xl font-black text-slate-950">Mercado Pago</h2>
            </div>
            {loading ? <p className="mt-2 text-sm text-slate-400">Consultando...</p> : status?.ativo ? (
              <p className="mt-2 text-sm text-slate-500">Conta conectada: <strong className="text-slate-700">{status.conta_externa_id}</strong></p>
            ) : <p className="mt-2 text-sm text-slate-500">Conecte a conta do próprio restaurante para aceitar Pix e cartão online.</p>}
          </div>
          <button type="button" onClick={connect} disabled={connecting || loading}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white disabled:opacity-50">
            {connecting ? 'Abrindo...' : status?.ativo ? 'Reconectar conta' : 'Conectar minha conta'}
          </button>
        </div>
        <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
          {['Receba na sua conta', 'Confirmação automática', 'Sem dinheiro misturado'].map((label) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs font-bold text-slate-600">✓ {label}</div>
          ))}
        </div>
      </div>
      {error && <p className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</p>}
      <p className="text-xs leading-5 text-slate-400">A mensalidade do MenuExpress é uma cobrança separada. Estornos, taxas e recebíveis das vendas pertencem à conta conectada pelo restaurante.</p>
    </section>
  );
}

