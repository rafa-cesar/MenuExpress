import type { MenuItem } from '../types/menu';

type MenuCardProps = {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  disabled?: boolean;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function MenuCard({ item, quantity, onAdd, onIncrement, onDecrement, disabled = false }: MenuCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-40 bg-slate-200">
        <img src={item.imagem} alt={item.nome} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        {item.destaque ? (
          <span className="absolute left-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-lg">
            Destaque
          </span>
        ) : null}
      </div>

      <div className="p-5">
        <span className="text-xs font-bold uppercase tracking-wide text-brand-600">{item.categoria}</span>
        <h3 className="mt-2 text-xl font-black text-slate-950">{item.nome}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{item.descricao}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-2xl font-black text-slate-950">{currencyFormatter.format(item.preco)}</p>

          {quantity > 0 ? (
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => onDecrement(item.id)}
                disabled={disabled}
                className="flex size-9 items-center justify-center rounded-full bg-white text-lg font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remover uma unidade de ${item.nome}`}
              >
                −
              </button>
              <span className="w-9 text-center text-sm font-black text-slate-950">{quantity}</span>
              <button
                type="button"
                onClick={() => onIncrement(item.id)}
                disabled={disabled}
                className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-lg font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label={`Adicionar mais uma unidade de ${item.nome}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(item)}
              disabled={disabled}
              className="rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {disabled ? 'Loja fechada' : 'Adicionar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
