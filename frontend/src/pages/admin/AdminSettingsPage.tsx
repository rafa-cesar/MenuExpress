import { FormEvent, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { demoEmpresa } from '../../data/menu';
import { usePageTitle } from '../../hooks/usePageTitle';

type SettingsFormState = {
  nomeEmpresa: string;
  descricao: string;
  cidadeUf: string;
  whatsapp: string;
  corPrincipal: string;
  taxaEntrega: string;
  pedidoMinimo: string;
};

export function AdminSettingsPage() {
  usePageTitle('Admin Configurações');

  const [savedMessage, setSavedMessage] = useState('');
  const [form, setForm] = useState<SettingsFormState>({
    nomeEmpresa: demoEmpresa.nome,
    descricao: demoEmpresa.descricao,
    cidadeUf: demoEmpresa.cidade,
    whatsapp: demoEmpresa.whatsapp,
    corPrincipal: '#f97316',
    taxaEntrega: '7.00',
    pedidoMinimo: '25.00',
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedMessage('Configurações salvas localmente para demonstração.');
  }

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Configure os dados visuais e operacionais da lanchonete antes da futura integração com banco de dados."
      />

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">Nome da empresa
            <input value={form.nomeEmpresa} onChange={(event) => setForm({ ...form, nomeEmpresa: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Cidade/UF
            <input value={form.cidadeUf} onChange={(event) => setForm({ ...form, cidadeUf: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-bold text-slate-700 lg:col-span-2">Descrição
            <textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Telefone WhatsApp
            <input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Cor principal
            <input type="color" value={form.corPrincipal} onChange={(event) => setForm({ ...form, corPrincipal: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Taxa de entrega padrão
            <input type="number" min="0" step="0.01" value={form.taxaEntrega} onChange={(event) => setForm({ ...form, taxaEntrega: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-bold text-slate-700">Pedido mínimo
            <input type="number" min="0" step="0.01" value={form.pedidoMinimo} onChange={(event) => setForm({ ...form, pedidoMinimo: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          </label>
        </div>

        {savedMessage ? (
          <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" role="status">{savedMessage}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Esses dados ainda são mockados e não usam backend.</p>
          <button type="submit" className="rounded-full bg-brand-600 px-6 py-3 font-black text-white hover:bg-brand-700">Salvar configurações</button>
        </div>
      </form>
    </section>
  );
}
