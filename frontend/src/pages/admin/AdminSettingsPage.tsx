import { FormEvent, useEffect, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useMenuStore } from '../../context/MenuStoreContext';

type StatusLoja = 'automatico' | 'forcar_aberto' | 'forcar_fechado';
type DiaSemanaKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

interface HorarioDia {
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

type HorarioDias = Record<DiaSemanaKey, HorarioDia>;

const diasSemana: { key: DiaSemanaKey; label: string }[] = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const horarioPadrao: HorarioDia = { ativo: true, abertura: '18:00', fechamento: '23:00' };

const diasPadrao: HorarioDias = {
  seg: { ...horarioPadrao },
  ter: { ...horarioPadrao },
  qua: { ...horarioPadrao },
  qui: { ...horarioPadrao },
  sex: { ativo: true, abertura: '18:00', fechamento: '23:59' },
  sab: { ativo: true, abertura: '18:00', fechamento: '23:59' },
  dom: { ativo: true, abertura: '18:00', fechamento: '22:30' },
};

type SettingsFormState = {
  nomeEmpresa: string;
  descricao: string;
  cidadeUf: string;
  whatsapp: string;
  corPrincipal: string;
  taxaEntrega: string;
  pedidoMinimo: string;
  statusLoja: StatusLoja;
  mensagemCliente: string;
  dias: HorarioDias;
};

const statusLojaLabels: Record<StatusLoja, string> = {
  automatico: 'Automático (segue horários)',
  forcar_aberto: '🟢 Forçar Aberto (ignora horário)',
  forcar_fechado: '🔴 Forçar Fechado (bloqueia pedidos)',
};

export function AdminSettingsPage() {
  usePageTitle('Admin Configurações');

  const { empresa, setEmpresa } = useMenuStore();

  const [savedMessage, setSavedMessage] = useState('');
  const [form, setForm] = useState<SettingsFormState>({
    nomeEmpresa: empresa.nome,
    descricao: empresa.descricao,
    cidadeUf: empresa.cidade,
    whatsapp: empresa.whatsapp,
    corPrincipal: '#f97316',
    taxaEntrega: '7.00',
    pedidoMinimo: '25.00',
    statusLoja: 'automatico',
    mensagemCliente: '',
    dias: diasPadrao,
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      nomeEmpresa: empresa.nome,
      descricao: empresa.descricao,
      cidadeUf: empresa.cidade,
      whatsapp: empresa.whatsapp,
    }));
  }, [empresa]);

  function updateDay(day: DiaSemanaKey, field: keyof HorarioDia, value: boolean | string) {
    setForm((current) => ({
      ...current,
      dias: {
        ...current.dias,
        [day]: { ...current.dias[day], [field]: value },
      },
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
    });

    setSavedMessage('Configurações salvas com sucesso. O cardápio público será atualizado imediatamente.');
    setTimeout(() => setSavedMessage(''), 4000);
  }

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Configure os dados visuais, operacionais e o horário de funcionamento da lanchonete."
      />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Dados da empresa */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-black text-slate-950">Dados da empresa</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Nome da empresa
              <input
                value={form.nomeEmpresa}
                onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Cidade/UF
              <input
                value={form.cidadeUf}
                onChange={(e) => setForm({ ...form, cidadeUf: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700 lg:col-span-2">
              Descrição
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Telefone WhatsApp
              <input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Cor principal
              <input
                type="color"
                value={form.corPrincipal}
                onChange={(e) => setForm({ ...form, corPrincipal: e.target.value })}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Taxa de entrega padrão
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.taxaEntrega}
                onChange={(e) => setForm({ ...form, taxaEntrega: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Pedido mínimo
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pedidoMinimo}
                onChange={(e) => setForm({ ...form, pedidoMinimo: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
          </div>
        </div>

        {/* Horário de funcionamento */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black text-slate-950">Horário de funcionamento</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            Define quando o cardápio aceita pedidos. Com status "Automático", o sistema verifica os horários abaixo.
          </p>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Status da loja
              <select
                value={form.statusLoja}
                onChange={(e) => setForm({ ...form, statusLoja: e.target.value as StatusLoja })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              >
                {(Object.entries(statusLojaLabels) as [StatusLoja, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Mensagem ao cliente
              <input
                value={form.mensagemCliente}
                onChange={(e) => setForm({ ...form, mensagemCliente: e.target.value })}
                placeholder="Ex: Hoje estamos com atraso de 20 minutos."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
          </div>

          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
            form.statusLoja === 'forcar_aberto'
              ? 'bg-emerald-50 text-emerald-700'
              : form.statusLoja === 'forcar_fechado'
              ? 'bg-red-50 text-red-700'
              : 'bg-slate-50 text-slate-600'
          }`}>
            {form.statusLoja === 'forcar_aberto' && '🟢 Loja ficará ABERTA independente do horário'}
            {form.statusLoja === 'forcar_fechado' && '🔴 Loja ficará FECHADA — clientes não podem fazer pedidos'}
            {form.statusLoja === 'automatico' && '🕐 Loja abre e fecha automaticamente conforme os horários abaixo'}
          </div>

          <div className="mt-6 space-y-3">
            {diasSemana.map((dia) => (
              <div
                key={dia.key}
                className={`grid gap-3 rounded-2xl border p-4 transition-colors ${
                  form.dias[dia.key].ativo ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
                } md:grid-cols-[140px_100px_1fr_1fr] md:items-center`}
              >
                <span className={`font-black ${form.dias[dia.key].ativo ? 'text-slate-900' : 'text-slate-400'}`}>
                  {dia.label}
                </span>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.dias[dia.key].ativo}
                    onChange={(e) => updateDay(dia.key, 'ativo', e.target.checked)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {form.dias[dia.key].ativo ? 'Ativo' : 'Fechado'}
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Abertura
                  <input
                    type="time"
                    value={form.dias[dia.key].abertura}
                    onChange={(e) => updateDay(dia.key, 'abertura', e.target.value)}
                    disabled={!form.dias[dia.key].ativo}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-brand-500"
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Fechamento
                  <input
                    type="time"
                    value={form.dias[dia.key].fechamento}
                    onChange={(e) => updateDay(dia.key, 'fechamento', e.target.value)}
                    disabled={!form.dias[dia.key].ativo}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-brand-500"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {savedMessage && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" role="status">
            ✅ {savedMessage}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Dados mockados — prontos para integrar com Supabase.
          </p>
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-3 font-black text-white hover:bg-brand-700"
          >
            Salvar configurações
          </button>
        </div>
      </form>
    </section>
  );
}