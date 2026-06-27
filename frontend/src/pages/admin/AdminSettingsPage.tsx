import { FormEvent, useEffect, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useMenuStore } from '../../context/MenuStoreContext';
import { useBrand } from '../../hooks/useBrand';
import { supabase } from '../../lib/supabase';
import type { ConfigEntrega, EstiloVisual } from '../../types/domain';

type StatusLoja = 'automatico' | 'forcar_aberto' | 'forcar_fechado';
type DiaSemanaKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
interface HorarioDia { ativo: boolean; abertura: string; fechamento: string; }
type HorarioDias = Record<DiaSemanaKey, HorarioDia>;

const diasSemana: { key: DiaSemanaKey; label: string }[] = [
  { key: 'seg', label: 'Segunda' }, { key: 'ter', label: 'Terça' }, { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' }, { key: 'sex', label: 'Sexta' }, { key: 'sab', label: 'Sábado' }, { key: 'dom', label: 'Domingo' },
];

const horarioPadrao: HorarioDia = { ativo: true, abertura: '18:00', fechamento: '23:00' };
const diasPadrao: HorarioDias = {
  seg: { ...horarioPadrao }, ter: { ...horarioPadrao }, qua: { ...horarioPadrao }, qui: { ...horarioPadrao },
  sex: { ativo: true, abertura: '18:00', fechamento: '23:59' },
  sab: { ativo: true, abertura: '18:00', fechamento: '23:59' },
  dom: { ativo: true, abertura: '18:00', fechamento: '22:30' },
};

const statusLojaLabels: Record<StatusLoja, string> = {
  automatico: 'Automático (segue horários)',
  forcar_aberto: '🟢 Forçar Aberto (ignora horário)',
  forcar_fechado: '🔴 Forçar Fechado (bloqueia pedidos)',
};

const estilos: { value: EstiloVisual; label: string; descricao: string; emoji: string }[] = [
  { value: 'moderno',  label: 'Moderno',  emoji: '🔥', descricao: 'Hero escuro, botões arredondados, visual energético' },
  { value: 'clean',    label: 'Clean',    emoji: '✨', descricao: 'Minimalista, muito espaço, elegante e direto' },
  { value: 'vibrante', label: 'Vibrante', emoji: '🌈', descricao: 'Gradiente intenso, muito contraste, cheio de energia' },
  { value: 'classico', label: 'Clássico', emoji: '🏛️', descricao: 'Tons sombrios, botões quadrados, clima sofisticado' },
];

type SettingsFormState = {
  nomeEmpresa: string; descricao: string; cidadeUf: string; whatsapp: string;
  corPrincipal: string; logoUrl: string; estiloVisual: EstiloVisual;
  taxaEntrega: string; pedidoMinimo: string;
  statusLoja: StatusLoja; mensagemCliente: string; dias: HorarioDias;
  retiradaAtiva: boolean; entregaAtiva: boolean;
  taxaEntregaFixa: string; pedidoMinimoEntrega: string;
  endRua: string; endNumero: string; endBairro: string; endCidade: string; endComplemento: string;
};

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-4">
      <div className="relative mt-0.5">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`h-6 w-11 rounded-full transition ${checked ? 'bg-slate-950' : 'bg-slate-200'}`} />
        <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <div>
        <p className="font-black text-slate-900">{label}</p>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
    </label>
  );
}

export function AdminSettingsPage() {
  usePageTitle('Admin Configurações');
  const { empresa, setEmpresa } = useMenuStore();
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const entregaInicial: ConfigEntrega = empresa.entrega ?? { retiradaAtiva: true, entregaAtiva: false, taxaEntregaFixa: 0, pedidoMinimoEntrega: 0 };

  const [form, setForm] = useState<SettingsFormState>({
    nomeEmpresa: empresa.nome, descricao: empresa.descricao, cidadeUf: empresa.cidade,
    whatsapp: empresa.whatsapp, corPrincipal: empresa.corPrincipal ?? '#f97316',
    logoUrl: empresa.logoUrl ?? '', estiloVisual: empresa.estiloVisual ?? 'moderno',
    taxaEntrega: empresa.taxaEntrega?.toFixed(2) ?? '0.00',
    pedidoMinimo: empresa.pedidoMinimo?.toFixed(2) ?? '0.00',
    statusLoja: empresa.horario?.status ?? 'automatico',
    mensagemCliente: empresa.horario?.mensagemCliente ?? '',
    dias: empresa.horario?.dias ?? diasPadrao,
    retiradaAtiva: entregaInicial.retiradaAtiva,
    entregaAtiva: entregaInicial.entregaAtiva,
    taxaEntregaFixa: entregaInicial.taxaEntregaFixa.toFixed(2),
    pedidoMinimoEntrega: entregaInicial.pedidoMinimoEntrega.toFixed(2),
    endRua: entregaInicial.endereco?.rua ?? '',
    endNumero: entregaInicial.endereco?.numero ?? '',
    endBairro: entregaInicial.endereco?.bairro ?? '',
    endCidade: entregaInicial.endereco?.cidade ?? empresa.cidade,
    endComplemento: entregaInicial.endereco?.complemento ?? '',
  });

  const brandPreview = useBrand(form.corPrincipal, form.estiloVisual);

  useEffect(() => {
    const e = empresa.entrega ?? { retiradaAtiva: true, entregaAtiva: false, taxaEntregaFixa: 0, pedidoMinimoEntrega: 0 };
    setForm((cur) => ({
      ...cur,
      nomeEmpresa: empresa.nome, descricao: empresa.descricao, cidadeUf: empresa.cidade,
      whatsapp: empresa.whatsapp, corPrincipal: empresa.corPrincipal ?? cur.corPrincipal,
      logoUrl: empresa.logoUrl ?? cur.logoUrl, estiloVisual: empresa.estiloVisual ?? cur.estiloVisual,
      taxaEntrega: empresa.taxaEntrega?.toFixed(2) ?? cur.taxaEntrega,
      pedidoMinimo: empresa.pedidoMinimo?.toFixed(2) ?? cur.pedidoMinimo,
      statusLoja: empresa.horario?.status ?? cur.statusLoja,
      mensagemCliente: empresa.horario?.mensagemCliente ?? cur.mensagemCliente,
      dias: empresa.horario?.dias ?? cur.dias,
      retiradaAtiva: e.retiradaAtiva, entregaAtiva: e.entregaAtiva,
      taxaEntregaFixa: e.taxaEntregaFixa.toFixed(2),
      pedidoMinimoEntrega: e.pedidoMinimoEntrega.toFixed(2),
      endRua: e.endereco?.rua ?? cur.endRua,
      endNumero: e.endereco?.numero ?? cur.endNumero,
      endBairro: e.endereco?.bairro ?? cur.endBairro,
      endCidade: e.endereco?.cidade ?? cur.endCidade,
      endComplemento: e.endereco?.complemento ?? cur.endComplemento,
    }));
  }, [empresa]);

  function updateDay(day: DiaSemanaKey, field: keyof HorarioDia, value: boolean | string) {
    setForm((cur) => ({ ...cur, dias: { ...cur.dias, [day]: { ...cur.dias[day], [field]: value } } }));
  }

  const nenhumaModalidade = !form.retiradaAtiva && !form.entregaAtiva;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nenhumaModalidade) return;

    setSaving(true);
    setErrorMessage('');

    const entregaObj: ConfigEntrega = {
      retiradaAtiva: form.retiradaAtiva,
      entregaAtiva: form.entregaAtiva,
      taxaEntregaFixa: Number(form.taxaEntregaFixa.replace(',', '.')) || 0,
      pedidoMinimoEntrega: Number(form.pedidoMinimoEntrega.replace(',', '.')) || 0,
      endereco: form.retiradaAtiva ? {
        rua: form.endRua, numero: form.endNumero, bairro: form.endBairro,
        cidade: form.endCidade, complemento: form.endComplemento,
      } : undefined,
    };

    const { error } = await supabase
      .from('empresas')
      .update({
        nome: form.nomeEmpresa,
        descricao: form.descricao,
        cidade: form.cidadeUf,
        whatsapp: form.whatsapp,
        cor_principal: form.corPrincipal,
        logo_url: form.logoUrl,
        taxa_entrega: Number(form.taxaEntrega.replace(',', '.')) || 0,
        pedido_minimo: Number(form.pedidoMinimo.replace(',', '.')) || 0,
        horario_status: form.statusLoja,
        horario_mensagem_cliente: form.mensagemCliente,
        horario_dias: form.dias,
        entrega: entregaObj,
      })
      .eq('id', empresa.id);

    setSaving(false);

    if (error) {
      setErrorMessage('Erro ao salvar: ' + error.message);
      return;
    }

    setEmpresa({
      ...empresa,
      nome: form.nomeEmpresa, descricao: form.descricao, cidade: form.cidadeUf,
      whatsapp: form.whatsapp, corPrincipal: form.corPrincipal,
      logoUrl: form.logoUrl, estiloVisual: form.estiloVisual,
      taxaEntrega: Number(form.taxaEntrega.replace(',', '.')) || 0,
      pedidoMinimo: Number(form.pedidoMinimo.replace(',', '.')) || 0,
      horario: { status: form.statusLoja, mensagemCliente: form.mensagemCliente, dias: form.dias },
      entrega: entregaObj,
    });

    setSavedMessage('Configurações salvas! O cardápio público já reflete as mudanças.');
    setTimeout(() => setSavedMessage(''), 4000);
  }

  const inputClass = 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400';

  return (
    <section>
      <AdminSectionHeader eyebrow="Preferências" title="Configurações"
        description="Configure a identidade visual, formas de entrega e horário de funcionamento."
      />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Identidade da marca */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-lg font-black text-slate-950">Identidade da marca</h2>
          <p className="mb-5 text-sm text-slate-500">Sua cor e logo aparecem em destaque no cardápio. O estilo define o clima visual sem sobrepor suas cores.</p>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700 lg:col-span-2">
              URL da logo <span className="font-normal text-slate-400">(upload real disponível após deploy)</span>
              <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://.../sua-logo.png" className={inputClass} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Cor principal da marca
              <div className="mt-2 flex items-center gap-3">
                <input type="color" value={form.corPrincipal} onChange={(e) => setForm({ ...form, corPrincipal: e.target.value })} className="h-12 w-16 cursor-pointer rounded-2xl border border-slate-200 p-1 outline-none" />
                <span className="rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-600">{form.corPrincipal}</span>
              </div>
            </label>
            <div className="rounded-2xl border border-dashed border-slate-200 p-4">
              <p className="mb-3 text-sm font-bold text-slate-700">Prévia ao vivo</p>
              <div className="overflow-hidden rounded-2xl shadow-md" style={{ background: brandPreview.heroGradient }}>
                <div className="flex items-center gap-3 p-4">
                  {form.logoUrl ? <img src={form.logoUrl} alt="logo" className="h-10 w-10 rounded-xl bg-white object-cover p-0.5" /> : <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xs font-black text-white">Logo</div>}
                  <div>
                    <p className={`text-sm text-white ${brandPreview.titleClass}`}>{form.nomeEmpresa || 'Seu restaurante'}</p>
                    <p className="text-xs text-white/70">{form.cidadeUf || 'Cidade, UF'}</p>
                  </div>
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: brandPreview.primary, color: brandPreview.onPrimary, borderRadius: brandPreview.buttonRadius }}>Categoria</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">Categoria</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-slate-700">Estilo visual do cardápio</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {estilos.map((estilo) => {
                const isActive = form.estiloVisual === estilo.value;
                return (
                  <button key={estilo.value} type="button" onClick={() => setForm({ ...form, estiloVisual: estilo.value })}
                    className={`rounded-2xl border-2 p-4 text-left transition ${isActive ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                    <p className="text-2xl">{estilo.emoji}</p>
                    <p className="mt-2 font-black">{estilo.label}</p>
                    <p className={`mt-1 text-xs leading-snug ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{estilo.descricao}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Formas de entrega */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-lg font-black text-slate-950">Formas de entrega</h2>
          <p className="mb-5 text-sm text-slate-500">Ative ao menos uma modalidade. O cliente verá as opções disponíveis antes de finalizar o pedido.</p>

          {nenhumaModalidade && (
            <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">⚠️ Ative ao menos uma modalidade para salvar.</p>
          )}

          <div className="space-y-6">
            {/* Retirada */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <Toggle checked={form.retiradaAtiva} onChange={(v) => setForm({ ...form, retiradaAtiva: v })} label="Retirada no local" description="O cliente retira o pedido no seu endereço. Recomendado sempre ativo." />
              {form.retiradaAtiva && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <p className="text-sm font-bold text-slate-700 sm:col-span-2">Endereço da loja <span className="font-normal text-slate-400">(exibido ao cliente)</span></p>
                  <label className="block text-sm font-bold text-slate-700">
                    Rua / Avenida
                    <input value={form.endRua} onChange={(e) => setForm({ ...form, endRua: e.target.value })} placeholder="Rua das Flores" className={inputClass} />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Número
                    <input value={form.endNumero} onChange={(e) => setForm({ ...form, endNumero: e.target.value })} placeholder="123" className={inputClass} />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Bairro
                    <input value={form.endBairro} onChange={(e) => setForm({ ...form, endBairro: e.target.value })} placeholder="Centro" className={inputClass} />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Cidade
                    <input value={form.endCidade} onChange={(e) => setForm({ ...form, endCidade: e.target.value })} placeholder="São Paulo" className={inputClass} />
                  </label>
                  <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                    Complemento <span className="font-normal text-slate-400">(opcional)</span>
                    <input value={form.endComplemento} onChange={(e) => setForm({ ...form, endComplemento: e.target.value })} placeholder="Loja 2, ao lado da farmácia" className={inputClass} />
                  </label>
                </div>
              )}
            </div>

            {/* Entrega */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <Toggle checked={form.entregaAtiva} onChange={(v) => setForm({ ...form, entregaAtiva: v })} label="Entrega em domicílio" description="O cliente informa o endereço e a taxa fixa é adicionada ao total." />
              {form.entregaAtiva && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Taxa de entrega (R$)
                    <input type="number" min="0" step="0.01" value={form.taxaEntregaFixa} onChange={(e) => setForm({ ...form, taxaEntregaFixa: e.target.value })} className={inputClass} />
                    <span className="mt-1 block text-xs text-slate-400">Valor fixo cobrado em toda entrega.</span>
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Pedido mínimo para entrega (R$)
                    <input type="number" min="0" step="0.01" value={form.pedidoMinimoEntrega} onChange={(e) => setForm({ ...form, pedidoMinimoEntrega: e.target.value })} className={inputClass} />
                    <span className="mt-1 block text-xs text-slate-400">Pedidos abaixo deste valor não podem escolher entrega.</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dados da empresa */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-black text-slate-950">Dados da empresa</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">Nome da empresa<input value={form.nomeEmpresa} onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })} className={inputClass} /></label>
            <label className="block text-sm font-bold text-slate-700">Cidade/UF<input value={form.cidadeUf} onChange={(e) => setForm({ ...form, cidadeUf: e.target.value })} className={inputClass} /></label>
            <label className="block text-sm font-bold text-slate-700 lg:col-span-2">Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} className={inputClass} /></label>
            <label className="block text-sm font-bold text-slate-700">Telefone WhatsApp<input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputClass} /></label>
          </div>
        </div>

        {/* Horário */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black text-slate-950">Horário de funcionamento</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">Com status "Automático", o sistema verifica os horários abaixo.</p>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">Status da loja
              <select value={form.statusLoja} onChange={(e) => setForm({ ...form, statusLoja: e.target.value as StatusLoja })} className={inputClass}>
                {(Object.entries(statusLojaLabels) as [StatusLoja, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">Mensagem ao cliente
              <input value={form.mensagemCliente} onChange={(e) => setForm({ ...form, mensagemCliente: e.target.value })} placeholder="Ex: Hoje com atraso de 20 minutos." className={inputClass} />
            </label>
          </div>
          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${ form.statusLoja === 'forcar_aberto' ? 'bg-emerald-50 text-emerald-700' : form.statusLoja === 'forcar_fechado' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600' }`}>
            {form.statusLoja === 'forcar_aberto' && '🟢 Loja ficará ABERTA independente do horário'}
            {form.statusLoja === 'forcar_fechado' && '🔴 Loja ficará FECHADA — clientes não podem fazer pedidos'}
            {form.statusLoja === 'automatico' && '🕐 Loja abre e fecha automaticamente conforme os horários abaixo'}
          </div>
          <div className="mt-6 space-y-3">
            {diasSemana.map((dia) => (
              <div key={dia.key} className={`grid gap-3 rounded-2xl border p-4 ${ form.dias[dia.key].ativo ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50' } md:grid-cols-[140px_100px_1fr_1fr] md:items-center`}>
                <span className={`font-black ${form.dias[dia.key].ativo ? 'text-slate-900' : 'text-slate-400'}`}>{dia.label}</span>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.dias[dia.key].ativo} onChange={(e) => updateDay(dia.key, 'ativo', e.target.checked)} className="h-4 w-4" />{form.dias[dia.key].ativo ? 'Ativo' : 'Fechado'}</label>
                <label className="block text-sm font-bold text-slate-700">Abertura<input type="time" value={form.dias[dia.key].abertura} onChange={(e) => updateDay(dia.key, 'abertura', e.target.value)} disabled={!form.dias[dia.key].ativo} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100" /></label>
                <label className="block text-sm font-bold text-slate-700">Fechamento<input type="time" value={form.dias[dia.key].fechamento} onChange={(e) => updateDay(dia.key, 'fechamento', e.target.value)} disabled={!form.dias[dia.key].ativo} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100" /></label>
              </div>
            ))}
          </div>
        </div>

        {savedMessage && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" role="status">✅ {savedMessage}</p>}
        {errorMessage && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600" role="alert">❌ {errorMessage}</p>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">As alterações são aplicadas imediatamente no cardápio público.</p>
          <button type="submit" disabled={nenhumaModalidade || saving} className="rounded-full bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>
    </section>
  );
}
