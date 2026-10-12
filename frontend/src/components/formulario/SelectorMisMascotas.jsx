import { Plus, Check } from 'lucide-react';
import IconoEspecie from '../ui/IconoEspecie';
import { focoVisible } from '../auth/AuthUI';

// HU-09 paso 1: el dueño elige cuál de sus mascotas se perdió
export default function SelectorMisMascotas({ mascotas, cargando, valor, onCambio, onRegistrar, error }) {
  if (cargando) {
    return (
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => <div key={i} className="h-[116px] w-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  if (mascotas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="text-sm text-gray-500 dark:text-white/50">Primero registra a tu mascota para poder reportarla.</p>
        <button type="button" onClick={onRegistrar}
          className={`h-11 px-5 rounded-2xl flex items-center gap-1.5 text-[15px] font-semibold text-white bg-primary-700
                      hover:bg-primary-800 ${focoVisible}`}>
          <Plus size={18} aria-hidden="true" /> Registrar mascota
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
           role="radiogroup" aria-label="Mascota">
        {mascotas.map((m) => {
          const activo = String(m.id) === String(valor);
          return (
            <button key={m.id} type="button" role="radio" aria-checked={activo}
              data-testid={`mascota-opcion-${m.id}`}
              onClick={() => onCambio(String(m.id))}
              className={`relative shrink-0 w-24 flex flex-col items-center gap-2 p-2 rounded-2xl border-[1.5px] transition-colors ${focoVisible}
                          ${activo ? 'border-primary-700 bg-primary-50 dark:bg-white/10'
                                   : 'border-warm-border bg-white hover:bg-warm-50 dark:border-white/10 dark:bg-white/5'}`}>
              <span className="h-16 w-16 rounded-xl overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center">
                {m.foto_principal
                  ? <img src={m.foto_principal} alt="" className="w-full h-full object-cover" />
                  : <IconoEspecie especie={m.especie} size={28} strokeWidth={1.6} className="text-primary-300" />}
              </span>
              <span className="text-[13px] font-semibold truncate w-full text-center text-dark-900 dark:text-white">{m.nombre}</span>
              {activo && (
                <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary-700 text-white flex items-center justify-center"
                      aria-hidden="true">
                  <Check size={12} strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs font-medium mt-2 text-red-600 dark:text-red-400">{error}</p>}
    </>
  );
}
