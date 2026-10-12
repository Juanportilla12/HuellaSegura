import { Search } from 'lucide-react';
import { focoVisible } from '../auth/AuthUI';

// Piezas compartidas por las listas del panel de administración

export function BuscadorAdmin({ valor, onCambio, placeholder }) {
  return (
    <label className="flex items-center gap-2.5 h-11 rounded-2xl px-3.5 bg-white border-[1.5px] border-warm-border
                      focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15
                      dark:bg-white/5 dark:border-white/10">
      <Search size={17} className="shrink-0 text-gray-500" aria-hidden="true" />
      <input type="search" value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-dark-900 placeholder:text-gray-500 dark:text-white" />
    </label>
  );
}

export function FiltrosAdmin({ opciones, activo, onCambio }) {
  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
      {opciones.map(({ id, label, cuenta }) => {
        const sel = activo === id;
        return (
          <button key={id} type="button" role="tab" aria-selected={sel} onClick={() => onCambio(id)}
            className={`shrink-0 h-9 pl-4 pr-2 rounded-full flex items-center gap-2 text-[13px] font-semibold transition-colors ${focoVisible}
                        ${sel ? 'bg-primary-700 text-white'
                              : 'bg-white text-dark-700 border border-warm-border dark:bg-white/5 dark:border-white/10 dark:text-white/80'}`}>
            {label}
            <span className={`min-w-6 h-6 px-1.5 rounded-full text-[12px] font-bold flex items-center justify-center
                              ${sel ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60'}`}>
              {cuenta}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function VacioAdmin({ titulo, children }) {
  return (
    <div className="py-14 text-center">
      <p className="font-poppins font-semibold text-dark-900 dark:text-white">{titulo}</p>
      <p className="mt-1 text-[14px] text-gray-500 dark:text-white/50">{children}</p>
    </div>
  );
}
