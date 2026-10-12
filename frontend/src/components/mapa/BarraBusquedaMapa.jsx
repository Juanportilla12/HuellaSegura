import { Search, SlidersHorizontal, X } from 'lucide-react';
import { FILTRO_ESPECIE } from './filtrosMapa';
import { focoVisible } from '../auth/AuthUI';

const flotante = 'bg-white/95 dark:bg-dark-800/95 backdrop-blur-md shadow-[0_4px_16px_rgba(26,26,46,0.12)]';

function Chip({ activo, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo}
      className={`shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${focoVisible}
                  ${activo ? 'bg-primary-700 text-white shadow-[0_4px_12px_rgba(204,74,52,0.35)]'
                           : `${flotante} text-dark-700 dark:text-white/80`}`}>
      {children}
    </button>
  );
}

// Búsqueda, botón de filtros y chips rápidos de especie sobre el mapa
export default function BarraBusquedaMapa({ texto, onTexto, resultados, especie, onEspecie, tiempoActivo, filtrosActivos, onAbrirFiltros }) {
  return (
    <div className="absolute top-0 inset-x-0 z-[1000] pt-[max(env(safe-area-inset-top),0.75rem)] px-4 flex flex-col gap-2.5 pointer-events-none">
      <div className="flex gap-2 pointer-events-auto">
        <label className={`flex-1 flex items-center gap-2.5 h-12 rounded-2xl px-4 ${flotante}
                           focus-within:ring-4 focus-within:ring-primary/20`}>
          <Search size={18} className="shrink-0 text-gray-500 dark:text-white/50" aria-hidden="true" />
          <input value={texto} onChange={(e) => onTexto(e.target.value)} type="search" enterKeyHint="search"
            placeholder="Buscar por nombre o raza" aria-label="Buscar mascota perdida"
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-dark-900 dark:text-white
                       placeholder:text-gray-500 dark:placeholder:text-white/40 [&::-webkit-search-cancel-button]:hidden" />
          {texto.trim() && (
            <>
              <span className="text-xs font-semibold text-gray-500 dark:text-white/50 shrink-0" aria-live="polite">
                {resultados} {resultados === 1 ? 'resultado' : 'resultados'}
              </span>
              <button type="button" onClick={() => onTexto('')} aria-label="Borrar búsqueda"
                      className={`-mr-2 h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-gray-500
                                  hover:bg-gray-100 dark:hover:bg-white/10 ${focoVisible}`}>
                <X size={16} aria-hidden="true" />
              </button>
            </>
          )}
        </label>

        <button type="button" onClick={onAbrirFiltros}
          aria-label={filtrosActivos > 0 ? `Abrir filtros, ${filtrosActivos} activos` : 'Abrir filtros'}
          className={`relative h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center ${focoVisible}
                      ${filtrosActivos > 0 ? 'bg-primary-700 text-white shadow-[0_6px_16px_rgba(204,74,52,0.4)]'
                                           : `${flotante} text-dark-900 dark:text-white`}`}>
          <SlidersHorizontal size={19} strokeWidth={2} aria-hidden="true" />
          {filtrosActivos > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full text-[11px] font-bold
                             bg-dark-900 text-white ring-2 ring-white flex items-center justify-center" aria-hidden="true">
              {filtrosActivos}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pointer-events-auto -mx-4 px-4 pb-2
                      [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTRO_ESPECIE.slice(0, 4).map((f) => (
          <Chip key={f.id} activo={especie === f.id} onClick={() => onEspecie(f.id)}>{f.label}</Chip>
        ))}
        <Chip activo={tiempoActivo} onClick={onAbrirFiltros}>Fecha</Chip>
      </div>
    </div>
  );
}
