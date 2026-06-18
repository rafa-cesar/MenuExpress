import { FormEvent, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { useMenuExpressStore } from '../../hooks/useMenuExpressStore';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { HorarioFuncionamento, StatusManualFuncionamento } from '../../types/domain';

type SettingsFormState = {
  nomeEmpresa: string;
  descricao: string;
  cidadeUf: string;
  whatsapp: string;
  corPrincipal: string;
  taxaEntrega: string;
  pedidoMinimo: string;
  statusManual: StatusManualFuncionamento;
  mensagemCliente: string;
  horarioFuncionamento: HorarioFuncionamento[];
};

const dayLabels: Record<HorarioFuncionamento['dia'], string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export function AdminSettingsPage() {
  usePageTitle('Admin Configurações');

  const { empresa, setEmpresa } = useMenuExpressStore();
  const [savedMessage, setSavedMessage] = useState('');
  const [form, setForm] = useState<SettingsFormState>({
    nomeEmpresa: empresa.nome,
    descricao: empresa.descricao,
    cidadeUf: empresa.cidade,
    whatsapp: empresa.whatsapp,
    corPrincipal: empresa.corPrincipal,
    taxaEntrega: String(empresa.taxaEntrega),
    pedidoMinimo: String(empresa.pedidoMinimo),
    statusManual: empresa.statusManual,
    mensagemCliente: empresa.mensagemCliente,
    horarioFuncionamento: empresa.horarioFuncionamento,
  });

  function updateSchedule(index: number, schedule: HorarioFuncionamento) {
    setForm((currentForm) => ({
      ...currentForm,
      horarioFuncionamento: currentForm.horarioFuncionamento.map((item, itemIndex) =>
        itemIndex === index ? schedule : item,
      ),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmpresa({
      ...empresa,
      nome: form.nomeEmpresa,
      descricao: form.descricao,
      cidade: form.cidadeUf,
      whatsapp: form.whatsapp,
      statusManual: form.statusManual,
      mensagemCliente: form.mensagemCliente,
      horarioFuncionamento: form.horarioFuncionamento,
      corPrincipal: form.corPrincipal,
      taxaEntrega: Number(form.taxaEntrega),
      pedidoMinimo: Number(form.pedidoMinimo),
    });
    setSavedMessage('Configurações e funcionamento salvos localmente para demonstração.');
  }

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Configure os dados visuais, operacionais e horários da lanchonete antes da futura integração com banco de dados."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border-2 border-brand-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-600">Seção: Funcionamento</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Horário de funcionamento</h2>
              <p className="mt-2 text-sm text-slate-500">
                Defina se a loja deve seguir a agenda automaticamente ou se deve ficar aberta/fechada manualmente.
              </p>
            </div>
            <span className={`w-fit rounded-full px-4 py-2 text-sm font-black ${form.statusManual === 'fechado' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              Status atual: {form.statusManual === 'automatico' ? 'Automático' : form.statusManual === 'aberto' ? 'Forçar aberto' : 'Forçar fechado'}
            </span>
          </div>

          <fieldset className="mt-6 rounded-3xl bg-slate-50 p-4">
            <legend className="text-base font-black text-slate-950">Status da loja:</legend>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { value: 'automatico', label: 'Automático', description: 'Usa os horários abaixo' },
                { value: 'aberto', label: 'Forçar aberto', description: 'Permite pedidos agora' },
                { value: 'fechado', label: 'Forçar fechado', description: 'Bloqueia pedidos agora' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${form.statusManual === option.value ? 'border-brand-500 bg-white text-brand-700 shadow-sm ring-4 ring-brand-100' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'}`}
                >
                  <input
                    type="radio"
                    name="statusManual"
                    value={option.value}
                    checked={form.statusManual === option.value}
                    onChange={() => setForm({ ...form, statusManual: option.value as StatusManualFuncionamento })}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className="mt-1 block text-xs font-bold text-slate-500">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-6 block text-base font-black text-slate-950">Mensagem para clientes:
            <textarea
              value={form.mensagemCliente}
              onChange={(event) => setForm({ ...form, mensagemCliente: event.target.value })}
              rows={4}
              placeholder="Ex.: Estamos atendendo normalmente. Pedidos pelo WhatsApp até 23h."
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:bg-white"
            />
          </label>

          <div className="mt-6">
            <h3 className="text-base font-black text-slate-950">Horário de funcionamento:</h3>
            <p className="mt-1 text-sm text-slate-500">Configure cada dia com ativo, abertura e fechamento.</p>

            <div className="mt-4 space-y-3">
              {form.horarioFuncionamento.map((schedule, index) => (
                <div key={schedule.dia} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[120px_120px_1fr_1fr] sm:items-center">
                  <p className="font-black text-slate-950">{dayLabels[schedule.dia]}:</p>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={schedule.ativo} onChange={(event) => updateSchedule(index, { ...schedule, ativo: event.target.checked })} /> Ativo
                  </label>
                  <label className="text-sm font-bold text-slate-700">Abertura
                    <input type="time" value={schedule.abertura} onChange={(event) => updateSchedule(index, { ...schedule, abertura: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
                  </label>
                  <label className="text-sm font-bold text-slate-700">Fechamento
                    <input type="time" value={schedule.fechamento} onChange={(event) => updateSchedule(index, { ...schedule, fechamento: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-950">Dados da lanchonete</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
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
        </div>



        {savedMessage ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" role="status">{savedMessage}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Esses dados ainda são mockados e salvos localmente no navegador.</p>
          <button type="submit" className="rounded-full bg-brand-600 px-6 py-3 font-black text-white hover:bg-brand-700">Salvar configurações</button>
        </div>
      </form>
    </section>
  );
}
