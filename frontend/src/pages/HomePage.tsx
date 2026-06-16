import { Link } from '@tanstack/react-router';
import { usePageTitle } from '../hooks/usePageTitle';

const benefits = [
  'Cardápios públicos responsivos',
  'Base preparada para múltiplas empresas',
  'Fluxo futuro de pedidos via WhatsApp',
];

export function HomePage() {
  usePageTitle('Home');

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
      <div className="flex flex-col justify-center">
        <span className="mb-4 w-fit rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
          SaaS para cardápios digitais
        </span>
        <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Publique cardápios digitais e receba pedidos pelo WhatsApp.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          O MenuExpress nasce com uma arquitetura organizada para crescer como uma plataforma multiempresa, mantendo uma experiência simples para clientes e restaurantes.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/cardapio" className="rounded-full bg-brand-600 px-6 py-3 text-center font-bold text-white shadow-lg shadow-orange-200 hover:bg-brand-700">
            Acessar cardápio demo
          </Link>
          <a href="https://wa.me/5511999999999" className="rounded-full border border-slate-300 px-6 py-3 text-center font-bold text-slate-800 hover:border-brand-600 hover:text-brand-600">
            Simular WhatsApp
          </a>
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
          <p className="text-sm font-semibold text-brand-100">MenuExpress Demo</p>
          <h2 className="mt-3 text-3xl font-black">Cardápio pronto para qualquer tela</h2>
          <ul className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-500 font-black">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
