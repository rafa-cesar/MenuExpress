import { Link } from '@tanstack/react-router';
import { usePageTitle } from '../hooks/usePageTitle';

const planos = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 'R$ 49',
    periodo: '/mês',
    descricao: 'Ideal para quem está começando.',
    itens: [
      '1 cardápio digital',
      'Gestão de pedidos',
      'Dashboard financeiro',
      'Exportação CSV',
      'Suporte por e-mail',
    ],
    destaque: false,
    cta: 'Começar grátis por 14 dias',
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 99',
    periodo: '/mês',
    descricao: 'Para quem quer crescer de verdade.',
    itens: [
      'Tudo do Starter',
      'Múltiplos cardápios',
      'Relatórios avançados',
      'Horários por dia da semana',
      'Suporte prioritário',
      'Personalização de cores',
    ],
    destaque: true,
    cta: 'Assinar o Pro',
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'Sob consulta',
    periodo: '',
    descricao: 'Para redes e franquias.',
    itens: [
      'Tudo do Pro',
      'Multi-unidades',
      'API de integração',
      'Gerente de conta dedicado',
      'SLA garantido',
    ],
    destaque: false,
    cta: 'Falar com vendas',
  },
];

export function AssinarPage() {
  usePageTitle('Planos — MenuExpress');

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">M</span>
            <span className="text-lg font-black text-slate-950">MenuExpress</span>
          </Link>
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-slate-900">
            Já tenho conta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pb-12 pt-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Planos e preços</p>
        <h1 className="mt-2 text-5xl font-black text-slate-950">Simples, transparente,<br />sem surpresas.</h1>
        <p className="mx-auto mt-4 max-w-md text-slate-500">
          Todos os planos incluem 14 dias grátis. Sem cartão de crédito para começar.
        </p>
      </section>

      {/* Cards de plano */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {planos.map((p) => (
            <div key={p.id}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                p.destaque
                  ? 'border-slate-950 bg-slate-950 text-white shadow-2xl shadow-slate-300'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}>

              {p.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-black text-white">
                  Mais popular
                </span>
              )}

              <p className={`text-xs font-bold uppercase tracking-widest ${
                p.destaque ? 'text-slate-400' : 'text-slate-400'
              }`}>{p.nome}</p>

              <div className="mt-4 flex items-end gap-1">
                <span className={`text-4xl font-black ${ p.destaque ? 'text-white' : 'text-slate-950' }`}>
                  {p.preco}
                </span>
                {p.periodo && (
                  <span className={`mb-1 text-sm ${ p.destaque ? 'text-slate-400' : 'text-slate-400' }`}>
                    {p.periodo}
                  </span>
                )}
              </div>

              <p className={`mt-2 text-sm ${ p.destaque ? 'text-slate-400' : 'text-slate-500' }`}>
                {p.descricao}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {p.itens.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      p.destaque ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>✓</span>
                    <span className={ p.destaque ? 'text-slate-300' : 'text-slate-600' }>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => alert('Em breve! Sistema de pagamento será integrado aqui.')}
                className={`mt-8 w-full rounded-full py-3 text-sm font-black transition ${
                  p.destaque
                    ? 'bg-white text-slate-950 hover:bg-slate-100'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ rápido */}
        <div className="mx-auto mt-16 max-w-2xl">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Dúvidas frequentes</p>
          <div className="space-y-4">
            {[
              { q: 'Preciso de cartão para testar?', a: 'Não. O trial de 14 dias é 100% grátis, sem cartão.' },
              { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem multa, sem burocracia. Cancele quando quiser.' },
              { q: 'E se eu precisar de mais de uma loja?', a: 'O plano Pro suporta múltiplos cardápios. Para redes grandes, fale com nossa equipe.' },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="font-black text-slate-950">{q}</p>
                <p className="mt-1 text-sm text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
          <Link to="/" className="font-black text-slate-950">MenuExpress</Link>
          <p>© {new Date().getFullYear()} MenuExpress. Todos os direitos reservados.</p>
          <Link to="/login" className="hover:text-slate-700">Entrar na minha conta</Link>
        </div>
      </footer>

    </div>
  );
}
