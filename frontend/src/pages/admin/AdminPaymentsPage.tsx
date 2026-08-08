import { useEffect, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { paymentService, type PaymentConnectionStatus } from '../../services/paymentService';

export function AdminPaymentsPage() {
  usePageTitle('Pagamentos');
  const [status, setStatus] = useState<PaymentConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
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

  async function disconnect() {
    setDisconnecting(true); setError('');
    try {
      await paymentService.desconectar();
      setStatus(null);
      setConfirmDisconnect(false);
      window.history.replaceState({}, '', '/admin/pagamentos?resultado=desconectado');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível desconectar a conta.');
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Recebimento do restaurante</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Pagamentos</h1>
        <p className="mt-2 text-sm text-slate-500">As vendas caem na sua própria conta. O MenuExpress não recebe nem mistura o dinheiro dos estabelecimentos.</p>
      </div>

      {resultado === 'conectado' && <p className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">Conta conectada com sucesso. Confira abaixo se os dados pertencem ao restaurante.</p>}
      {resultado === 'desconectado' && <p className="rounded-2xl bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">Conta desconectada. O MenuExpress não pode mais criar pagamentos nela.</p>}
      {resultado && !['conectado', 'desconectado'].includes(resultado) && <p className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">A conexão não foi concluída. Tente novamente.</p>}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status?.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <h2 className="text-xl font-black text-slate-950">Mercado Pago</h2>
            </div>
            {loading ? <p className="mt-2 text-sm text-slate-400">Consultando...</p> : status?.ativo ? (
              <div className="mt-3 space-y-1 text-sm text-slate-500">
                <p>Conta conectada: <strong className="text-slate-800">{status.conta_nome || `Mercado Pago nº ${status.conta_externa_id}`}</strong></p>
                {status.conta_email && <p>E-mail: <strong className="text-slate-700">{status.conta_email}</strong></p>}
                <p className="text-xs text-slate-400">Identificador da conta: {status.conta_externa_id}</p>
              </div>
            ) : <p className="mt-2 text-sm text-slate-500">Conecte a conta do próprio restaurante para aceitar Pix e cartão online.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => status?.ativo ? setConfirmDisconnect(true) : void connect()} disabled={connecting || loading || disconnecting}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white disabled:opacity-50">
              {connecting ? 'Abrindo...' : status?.ativo ? 'Trocar conta com segurança' : 'Conectar minha conta'}
            </button>
            {status?.ativo && <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={disconnecting}
              className="rounded-2xl border border-red-200 px-6 py-3 text-sm font-black text-red-700 disabled:opacity-50">
              Desconectar conta
            </button>}
          </div>
        </div>
        <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
          {['Receba na sua conta', 'Confirmação automática', 'Sem dinheiro misturado'].map((label) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs font-bold text-slate-600">✓ {label}</div>
          ))}
        </div>
      </div>

      {confirmDisconnect && (
        <div role="dialog" aria-modal="true" aria-labelledby="disconnect-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 id="disconnect-title" className="text-xl font-black text-slate-950">Trocar a conta do Mercado Pago</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">O Mercado Pago reutiliza automaticamente a conta que já está aberta no navegador. Para conectar outra conta com segurança:</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li><strong>1.</strong> Desconecte a conta atual do MenuExpress.</li>
              <li><strong>2.</strong> Saia da conta atual no site ou aplicativo do Mercado Pago.</li>
              <li><strong>3.</strong> Entre na conta pertencente ao restaurante.</li>
              <li><strong>4.</strong> Volte aqui e clique em <strong>Conectar minha conta</strong>.</li>
            </ol>
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">Conta que será removida deste restaurante: {status?.conta_email || status?.conta_nome || status?.conta_externa_id}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmDisconnect(false)} disabled={disconnecting} className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-600">Cancelar</button>
              <button type="button" onClick={disconnect} disabled={disconnecting} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{disconnecting ? 'Desconectando...' : 'Desconectar para trocar'}</button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</p>}
      <p className="text-xs leading-5 text-slate-400">A mensalidade do MenuExpress é uma cobrança separada. Estornos, taxas e recebíveis das vendas pertencem à conta conectada pelo restaurante.</p>
    </section>
  );
}
