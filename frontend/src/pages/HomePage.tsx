import { Link } from '@tanstack/react-router';
import { usePageTitle } from '../hooks/usePageTitle';

// ─── dados ────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: '🔗',
    title: 'Link do cardápio pronto em minutos',
    body: 'Crie sua conta, cadastre seus produtos e já tenha um cardápio digital público e profissional para compartilhar com seus clientes.',
  },
  {
    icon: '📦',
    title: 'Gestão de pedidos em tempo real',
    body: 'Painel Kanban para acompanhar cada pedido do recebimento até a entrega. Sem papel, sem confusão.',
  },
  {
    icon: '📊',
    title: 'Dashboard financeiro completo',
    body: 'Acompanhe faturamento, ticket médio, produtos mais vendidos e horário de pico. Exporte relatórios em CSV a qualquer momento.',
  },
  {
    icon: '📱',
    title: '100% responsivo e rápido',
    body: 'Cardápio otimizado para celular. Seus clientes navegam e pedem sem instalar nenhum aplicativo.',
  },
  {
    icon: '⏰',
    title: 'Horário de funcionamento inteligente',
    body: 'Configure os dias e horários da sua loja. O sistema abre e fecha automaticamente, sem precisár ficar lembrando.',
  },
  {
    icon: '🛫',
    title: 'Taxa de entrega por zona',
    body: 'Defina áreas de entrega com valores diferentes. O cliente vê o custo exato antes de finalizar o pedido.',
  },
];

const steps = [
  { n: '01', title: 'Crie sua conta', body: 'Cadastro rápido, sem cartão de crédito para começar.' },
  { n: '02', title: 'Monte seu cardápio', body: 'Adicione categorias, produtos, fotos e preços em minutos.' },
  { n: '03', title: 'Compartilhe o link', body: 'Envie para clientes pelo WhatsApp, Instagram ou onde quiser.' },
  { n: '04', title: 'Gerencie e cresça', body: 'Acompanhe pedidos e financeiro pelo painel admin.' },
];

const testimonials = [
  {
    name: 'Ana Paula',
    role: 'Dona da Pizzaria Belle Epoque',
    text: '\u201cAntes eu anotava pedido no papel e vivia perdendo. Hoje tudo é no sistema. Meu faturamento cresceu 30% no primeiro mês.\u201d',
    avatar: 'AP',
  },
  {
    name: 'Carlos Mendes',
    role: 'Hamburgueria Artesanal CM',
    text: '\u201cO cardápio ficou muito mais bonito do que o que eu tinha antes. Clientes elogiam bastante. Super recomendo.\u201d',
    avatar: 'CM',
  },
  {
    name: 'Fernanda Lopes',
    role: 'Acai & Cia',
    text: '\u201cFinal de mês eu exporto o relatório e já tenho tudo pra fazer minha contabilidade. Economizo horas toda semana.\u201d',
    avatar: 'FL',
  },
];

// ─── componentes ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">{icon}</span>
      <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

function TestimonialCard({ name, role, text, avatar }: { name: string; role: string; text: string; avatar: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">{avatar}</span>
        <div>
          <p className="text-sm font-black text-slate-950">{name}</p>
          <p className="text-xs text-slate-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ─── página ────────────────────────────────────────────────────────────────────
export function HomePage() {
  usePageTitle('MenuExpress — Cardápio digital e gestão de pedidos');

  return (
    <div className="min-h-screen bg-white">

      {/* ─────────────────── NAV ─────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">M</span>
            <span className="text-lg font-black text-slate-950">MenuExpress</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/login"
              className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-slate-900">
              Já tenho conta
            </Link>
            <Link to="/assinar"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800">
              Começar agora
            </Link>
          </nav>
        </div>
      </header>

      {/* ─────────────────── HERO ─────────────────── */}
      <section className="relative overflow-hidden bg-white px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        {/* decorativo */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-72 w-[600px] rounded-full bg-brand-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-bold text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Cardápio digital para restaurantes e lancherias
          </span>

          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Seu cardápio online
            <span className="block text-brand-600"> em menos de 10 minutos.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
            Crie um cardápio digital profissional, receba pedidos e acompanhe seu financeiro — tudo em um só lugar.
            Sem mensalidade cara, sem comissão por pedido.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/assinar"
              className="w-full rounded-full bg-slate-950 px-8 py-4 text-center font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 sm:w-auto">
              Criar minha conta grátis →
            </Link>
            <Link to="/login"
              className="w-full rounded-full border border-slate-200 px-8 py-4 text-center font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto">
              Já sou cliente
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-400">Sem cartão de crédito. Sem contrato. Cancele quando quiser.</p>
        </div>

        {/* mockup fake */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200">
            {/* barra do browser */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-300" />
              <div className="h-3 w-3 rounded-full bg-yellow-300" />
              <div className="h-3 w-3 rounded-full bg-green-300" />
              <div className="ml-3 flex-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-400">menuexpress.com.br/cardapio</div>
            </div>
            {/* conteúdo fake */}
            <div className="grid grid-cols-3 gap-3 p-5">
              {['🍔 X-Bacon', '🍕 Quatro Queijos', '🥤 Açaí 500ml', '🍲 Porción de Fritas', '🥤 Smoothie', '🍔 X-Tudo'].map((item) => (
                <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="h-12 w-full rounded-lg bg-slate-200" />
                  <p className="mt-2 truncate text-xs font-bold text-slate-700">{item}</p>
                  <p className="mt-1 text-xs text-slate-400">R$ 00,00</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────── SOCIAL PROOF (números) ────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            { n: '+500',  label: 'Restaurantes ativos' },
            { n: '+80k',  label: 'Pedidos processados' },
            { n: '10min', label: 'Para estar no ar' },
            { n: '4.9★',  label: 'Avaliação média' },
          ].map((s) => (
            <div key={s.n}>
              <p className="text-4xl font-black text-slate-950">{s.n}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── FEATURES ────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Funcionalidades</p>
            <h2 className="mt-2 text-4xl font-black text-slate-950">Tudo que você precisa para vender mais</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">Sem integrações complicadas. Tudo já está incluso.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ────────────────── COMO FUNCIONA ────────────────── */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Como funciona</p>
            <h2 className="mt-2 text-4xl font-black text-slate-950">4 passos para estar vendendo online</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col gap-3">
                <span className="text-4xl font-black text-slate-200">{s.n}</span>
                <h3 className="font-black text-slate-950">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── DEPOIMENTOS ────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Depoimentos</p>
            <h2 className="mt-2 text-4xl font-black text-slate-950">Quem usa, não volta atrás</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => <TestimonialCard key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* ────────────────── CTA FINAL ────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-slate-950 px-8 py-16 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-black leading-tight">
            Pronto para vender mais?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-slate-400">
            Crie sua conta hoje e tenha seu cardápio digital ao vivo ainda hoje.
            Seus concorrentes já estão usando.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/assinar"
              className="w-full rounded-full bg-white px-8 py-4 text-center font-black text-slate-950 shadow transition hover:bg-slate-100 sm:w-auto">
              Quero criar minha conta →
            </Link>
            <Link to="/login"
              className="w-full rounded-full border border-white/20 px-8 py-4 text-center font-bold text-white/80 transition hover:border-white/40 hover:text-white sm:w-auto">
              Já tenho conta
            </Link>
          </div>
          <p className="mt-5 text-xs text-slate-500">Sem cartão de crédito. Cancele quando quiser.</p>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="border-t border-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
          <span className="font-black text-slate-950">MenuExpress</span>
          <p>© {new Date().getFullYear()} MenuExpress. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-slate-700">Login</Link>
            <Link to="/assinar" className="hover:text-slate-700">Assinar</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
