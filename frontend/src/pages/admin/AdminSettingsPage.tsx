import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useMenuStore } from '../../context/MenuStoreContext';
import { useBrand } from '../../hooks/useBrand';
import { supabase } from '../../lib/supabase';
import type { ConfigEntrega, EstiloVisual } from '../../types/domain';
import type { Empresa } from '../../types/menu';

const EMPRESA_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

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

const ENTREGA_PADRAO: ConfigEntrega = { retiradaAtiva: true, entregaAtiva: false, taxaEntregaFixa: 0, pedidoMinimoEntrega: 0 };

function toMoney(value: unknown): string {
  const n = Number(value);
  return isFinite(n) ? n.toFixed(2) : '0.00';
}

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

// Aceita Empresa | null — usa fallbacks seguros para estado de carregamento
function buildForm(empresa: Empresa | null): SettingsFormState {
  const e: ConfigEntrega = { ...ENTREGA_PADRAO, ...empresa?.entrega };
  return {
    nomeEmpresa: empresa?.nome ?? '',
    descricao: empresa?.descricao ?? '',
    cidadeUf: empresa?.cidade ?? '',
    whatsapp: empresa?.whatsapp ?? '',
    corPrincipal: empresa?.corPrincipal ?? '#f97316',
    logoUrl: empresa?.logoUrl ?? '',
    estiloVisual: empresa?.estiloVisual ?? 'moderno',
    taxaEntrega: toMoney(empresa?.taxaEntrega),
    pedidoMinimo: toMoney(empresa?.pedidoMinimo),
    statusLoja: empresa?.horario?.status ?? 'automatico',
    mensagemCliente: empresa?.horario?.mensagemCliente ?? '',
    dias: empresa?.horario?.dias ?? diasPadrao,
    retiradaAtiva: e.retiradaAtiva ?? true,
    entregaAtiva: e.entregaAtiva ?? false,
    taxaEntregaFixa: toMoney(e.taxaEntregaFixa),
    pedidoMinimoEntrega: toMoney(e.pedidoMinimoEntrega),
    endRua: e.endereco?.rua ?? '',
    endNumero: e.endereco?.numero ?? '',
    endBairro: e.endereco?.bairro ?? '',
    endCidade: e.endereco?.cidade ?? empresa?.cidade ?? '',
    endComplemento: e.endereco?.complemento ?? '',
  };
}

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
  const { empresa, loading, setEmpresa } = useMenuStore();
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const initializedRef = useRef(false);
  const [form, setForm] = useState<SettingsFormState>(() => buildForm(empresa));

  // Popula o form UMA ÚNICA VEZ quando os dados reais chegam do Supabase
  useEffect(() => {
    if (!loading && empresa && !initializedRef.current) {
      initializedRef.current = true;
      setForm(buildForm(empresa));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, empresa]);

  const brandPreview = useBrand(form.corPrincipal, form.estiloVisual);

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

    // Usa EMPRESA_ID fixo — nunca depende de empresa.id que pode ser nulo durante carregamento
    const { data: updatedRows, error } = await supabase
      .from('empresas')
      .update({
        nome: form.nomeEmpresa,
        descricao: form.descricao,
        cidade: form.cidadeUf,
        whatsapp: form.whatsapp,
        cor_principal: form.corPrincipal,
        estilo_visual: form.estiloVisual,
        logo_url: form.logoUrl,
        taxa_entrega: Number(form.taxaEntrega.replace(',', '.')) || 0,
        pedido_minimo: Number(form.pedidoMinimo.replace(',', '.')) || 0,
        horario_status: form.statusLoja,
        horario_mensagem_cliente: form.mensagemCliente,
        horario_dias: form.dias,
        entrega: entregaObj,
      })
      .eq('id', EMPRESA_ID)
      .select('id');

    setSaving(false);

    if (error) {
      setErrorMessage('Erro ao salvar: ' + error.message);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      setErrorMessage('Nenhuma linha atualizada — verifique permissões no banco.');
      return;
    }

    // Atualiza o contexto com os dados confirmados pelo banco
    const empresaAtualizada: Empresa = {
      ...(empresa ?? { id: EMPRESA_ID, slug: '', status: 'ativa' as const }),
      id: EMPRESA_ID,
      nome: form.nomeEmpresa, descricao: form.descricao, cidade: form.cidadeUf,
      whatsapp: form.whatsapp, corPrincipal: form.corPrincipal,
      logoUrl: form.logoUrl, estiloVisual: form.estiloVisual,
      taxaEntrega: Number(form.taxaEntrega.replace(',', '.')) || 0,
      pedidoMinimo: Number(form.pedidoMinimo.replace(',', '.')) || 0,
      horario: { status: form.statusLoja, mensagemCliente: form.mensagemCliente, dias: form.dias },
      entrega: entregaObj,
    };
    setEmpresa(empresaAtualizada);

    setSavedMessage('Configurações salvas! O cardápio público já reflete as mudanças.');
    setTimeout(() => setSavedMessage(''), 4000);
  }

  const inputClass = 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400';

  // Mostra carregando enquanto os dados do banco não chegam
  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-500">Carregando configurações...</p>
        </div>
      </section>
    );
  }

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
              <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." className={inputClass} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Nome da empresa
              <input value={form.nomeEmpresa} onChange={(e) => setForm((f) => ({ ...f, nomeEmpresa: e.target.value }))} placeholder="Ex: Burger House" className={inputClass} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Cidade / UF
              <input value={form.cidadeUf} onChange={(e) => setForm((f) => ({ ...f, cidadeUf: e.target.value }))} placeholder="Ex: São Paulo, SP" className={inputClass} />
            </label>
            <label className="block text-sm font-bold text-slate-700 lg:col-span-2">
              Descrição
              <textarea rows={3} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Apresente seu negócio em poucas palavras" className={`${inputClass} resize-none`} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              WhatsApp
              <input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="5511999999999" className={inputClass} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Cor principal
              <div className="mt-2 flex items-center gap-3">
                <input type="color" value={form.corPrincipal} onChange={(e) => setForm((f) => ({ ...f, corPrincipal: e.target.value }))} className="h-12 w-12 cursor-pointer rounded-xl border border-slate-200 p-1" />
                <input value={form.corPrincipal} onChange={(e) => setForm((f) => ({ ...f, corPrincipal: e.target.value }))} placeholder="#f97316" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
              </div>
            </label>
          </div>
        </div>

        {/* Estilo visual */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-lg font-black text-slate-950">Estilo visual</h2>
          <p className="mb-5 text-sm text-slate-500">Define o clima do cardápio. Sua cor principal sempre prevalece sobre o estilo.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {estilos.map((est) => (
              <label key={est.value} className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition ${
                form.estiloVisual === est.value ? 'border-slate-950 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input type="radio" name="estilo" value={est.value} checked={form.estiloVisual === est.value} onChange={() => setForm((f) => ({ ...f, estiloVisual: est.value }))} className="sr-only" />
                <span className="mt-0.5 text-2xl">{est.emoji}</span>
                <div>
                  <p className="font-black text-slate-900">{est.label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{est.descricao}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl" style={{ background: brandPreview.heroGradient }}>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Preview do hero</p>
              <p className={`mt-2 text-3xl text-white ${brandPreview.titleClass}`}>{form.nomeEmpresa || 'Seu restaurante'}</p>
              <button type="button" className="mt-4 px-5 py-2.5 text-sm font-black"
                style={{ backgroundColor: brandPreview.primary, color: brandPreview.onPrimary, borderRadius: brandPreview.buttonRadius }}>
                Fazer Pedido
              </button>
            </div>
          </div>
        </div>

        {/* Taxas e pedido mínimo */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-lg font-black text-slate-950">Taxas e pedido mínimo</h2>
          <p className="mb-5 text-sm text-slate-500">Valores exibidos no cardápio e usados no cálculo do pedido.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Taxa de entrega (R$)
              <input type="number" min="0" step="0.01" value={form.taxaEntrega} onChange={(e) => setForm((f) => ({ ...f, taxaEntrega: e.target.value }))} className={inputClass} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Pedido mínimo (R$)
              <input type="number" min="0" step="0.01" value={form.pedidoMinimo} onChange={(e) => setForm((f) => ({ ...f, pedidoMinimo: e.target.value }))} className={inputClass} />
            </label>
          </div>
        </div>

        {/* Modalidades de entrega */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-lg font-black text-slate-950">Modalidades de entrega</h2>
          <p className="mb-5 text-sm text-slate-500">Ative as modalidades disponíveis e configure detalhes de cada uma.</p>
          <div className="space-y-5">
            <Toggle checked={form.retiradaAtiva} onChange={(v) => setForm((f) => ({ ...f, retiradaAtiva: v }))} label="Retirada no local" description="Cliente retira o pedido no endereço da loja" />
            {form.retiradaAtiva && (
              <div className="ml-14 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                  Rua
                  <input value={form.endRua} onChange={(e) => setForm((f) => ({ ...f, endRua: e.target.value }))} placeholder="Rua dos Sabores" className={inputClass} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Número
                  <input value={form.endNumero} onChange={(e) => setForm((f) => ({ ...f, endNumero: e.target.value }))} placeholder="123" className={inputClass} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Complemento
                  <input value={form.endComplemento} onChange={(e) => setForm((f) => ({ ...f, endComplemento: e.target.value }))} placeholder="Sala 2" className={inputClass} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Bairro
                  <input value={form.endBairro} onChange={(e) => setForm((f) => ({ ...f, endBairro: e.target.value }))} placeholder="Centro" className={inputClass} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Cidade
                  <input value={form.endCidade} onChange={(e) => setForm((f) => ({ ...f, endCidade: e.target.value }))} placeholder="São Paulo" className={inputClass} />
                </label>
              </div>
            )}
            <Toggle checked={form.entregaAtiva} onChange={(v) => setForm((f) => ({ ...f, entregaAtiva: v }))} label="Entrega em domicílio" description="Cliente recebe o pedido no endereço informado" />
            {form.entregaAtiva && (
              <div className="ml-14 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  Taxa de entrega (R$)
                  <input type="number" min="0" step="0.01" value={form.taxaEntregaFixa} onChange={(e) => setForm((f) => ({ ...f, taxaEntregaFixa: e.target.value }))} className={inputClass} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Pedido mínimo entrega (R$)
                  <input type="number" min="0" step="0.01" value={form.pedidoMinimoEntrega} onChange={(e) => setForm((f) => ({ ...f, pedidoMinimoEntrega: e.target.value }))} className={inputClass} />
                </label>
              </div>
            )}
            {nenhumaModalidade && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">⚠️ Ative ao menos uma modalidade para aceitar pedidos.</p>
            )}
          </div>
        </div>

        {/* Status e horários */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-lg font-black text-slate-950">Status e horários</h2>
          <p className="mb-5 text-sm text-slate-500">Controle quando a loja aceita pedidos.</p>
          <label className="block text-sm font-bold text-slate-700">
            Modo de operação
            <select value={form.statusLoja} onChange={(e) => setForm((f) => ({ ...f, statusLoja: e.target.value as StatusLoja }))} className={inputClass}>
              {Object.entries(statusLojaLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Mensagem para o cliente (opcional)
            <input value={form.mensagemCliente} onChange={(e) => setForm((f) => ({ ...f, mensagemCliente: e.target.value }))} placeholder="Ex: Voltamos em breve!" className={inputClass} />
          </label>
          <div className="mt-5 space-y-3">
            {diasSemana.map(({ key, label }) => (
              <div key={key} className="flex flex-wrap items-center gap-3">
                <Toggle checked={form.dias[key].ativo} onChange={(v) => updateDay(key, 'ativo', v)} label={label} />
                {form.dias[key].ativo && (
                  <div className="ml-auto flex items-center gap-2">
                    <input type="time" value={form.dias[key].abertura} onChange={(e) => updateDay(key, 'abertura', e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
                    <span className="text-sm text-slate-400">até</span>
                    <input type="time" value={form.dias[key].fechamento} onChange={(e) => updateDay(key, 'fechamento', e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback e botão salvar */}
        {savedMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-black text-emerald-700">✅ {savedMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-black text-red-700">❌ {errorMessage}</p>
          </div>
        )}

        <button type="submit" disabled={saving || nenhumaModalidade}
          className="w-full rounded-2xl bg-slate-950 px-6 py-4 font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>

      </form>
    </section>
  );
}
