import type { MenuItem } from '../types/menu';

type MenuCardProps = {
  item: MenuItem;
  quantity: number;
  disabled?: boolean;
  onAdd: (item: MenuItem) => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  accentColor?: string;
  accentOnColor?: string;
  buttonRadius?: string;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function MenuCard({
  item, quantity, disabled = false, onAdd, onIncrement, onDecrement,
  accentColor = '#0f172a', accentOnColor = '#ffffff', buttonRadius = '9999px',
}: MenuCardProps) {
  return (
    <article className={`group grid min-h-36 grid-cols-[7rem_1fr] overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:grid-cols-[9rem_1fr] md:block ${
      disabled ? 'opacity-60' : ''
    }`}>
      <div className="relative h-full min-h-36 bg-slate-100 md:h-44 md:min-h-0">
        <img src={item.imagem} alt={item.nome} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        {item.destaque ? (
          <span className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-lg md:left-4 md:top-4 md:px-3 md:text-xs"
            style={{ backgroundColor: accentColor, color: accentOnColor }}>
            ★ Destaque
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col p-4 sm:p-5">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] md:text-xs" style={{ color: accentColor }}>{item.categoria}</span>
        <h3 className="mt-1 truncate text-lg font-black text-slate-950 md:mt-2 md:text-xl">{item.nome}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 md:mt-2 md:min-h-12 md:text-sm md:leading-6">{item.descricao}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 md:pt-5">
          <p className="whitespace-nowrap text-base font-black text-slate-950 sm:text-lg md:text-2xl">{currencyFormatter.format(item.preco)}</p>

          {quantity > 0 && !disabled ? (
            <div className="flex items-center border border-slate-200 bg-slate-50 p-1" style={{ borderRadius: buttonRadius }}>
              <button
                type="button"
                onClick={() => onDecrement(item.id)}
                className="flex size-8 items-center justify-center rounded-full bg-white text-lg font-black text-slate-700 shadow-sm md:size-9"
                aria-label={`Remover uma unidade de ${item.nome}`}
              >
                −
              </button>
              <span className="w-7 text-center text-sm font-black text-slate-950 md:w-9">{quantity}</span>
              <button
                type="button"
                onClick={() => onIncrement(item.id)}
                className="flex size-8 items-center justify-center text-lg font-black shadow-sm md:size-9"
                style={{ backgroundColor: accentColor, color: accentOnColor, borderRadius: buttonRadius }}
                aria-label={`Adicionar mais uma unidade de ${item.nome}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !disabled && onAdd(item)}
              disabled={disabled}
              className="px-3 py-2 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:px-4 sm:text-sm md:py-3"
              style={!disabled ? { backgroundColor: accentColor, color: accentOnColor, borderRadius: buttonRadius } : { borderRadius: buttonRadius }}
            >
              {disabled ? 'Fechado' : 'Adicionar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
