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

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-950">Funcionamento</h2>
          <p className="mt-2 text-sm text-slate-500">Controle se a loja segue o horário automaticamente ou se deve ser aberta/fechada manualmente.</p>

          <div className="mt-5 rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">Abrir ou fechar manualmente</p>
            <p className="mt-1 text-sm text-slate-500">Use estes botões para deixar claro no cardápio se a loja pode receber pedidos agora.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { value: 'automatico', label: 'Automático pelo horário', description: 'Segue a agenda semanal' },
                { value: 'aberto', label: 'Abrir agora', description: 'Força loja aberta' },
                { value: 'fechado', label: 'Fechar agora', description: 'Bloqueia pedidos' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, statusManual: option.value as StatusManualFuncionamento })}
                  className={`rounded-2xl border p-4 text-left transition ${form.statusManual === option.value ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'}`}
                >
                  <span className="block text-sm font-black">{option.label}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 block text-sm font-bold text-slate-700">Mensagem para clientes no cardápio
            <textarea value={form.mensagemCliente} onChange={(event) => setForm({ ...form, mensagemCliente: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          </label>

          <div className="mt-5 space-y-3">
            {form.horarioFuncionamento.map((schedule, index) => (
              <div key={schedule.dia} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_120px_120px_120px] sm:items-center">
                <p className="font-black text-slate-950">{dayLabels[schedule.dia]}</p>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={schedule.ativo} onChange={(event) => updateSchedule(index, { ...schedule, ativo: event.target.checked })} /> Ativo
                </label>
                <label className="text-sm font-bold text-slate-700">Abertura
                  <input type="time" value={schedule.abertura} onChange={(event) => updateSchedule(index, { ...schedule, abertura: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </label>
                <label className="text-sm font-bold text-slate-700">Fechamento
                  <input type="time" value={schedule.fechamento} onChange={(event) => updateSchedule(index, { ...schedule, fechamento: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </label>
              </div>
            ))}
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
