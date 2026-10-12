import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { FILTRO_ESPECIE, FILTRO_TIEMPO, filtrarReportes } from './filtrosMapa';
import { focoVisible } from '../auth/AuthUI';

// Panel inferior para elegir especie y antigüedad; los cambios se aplican al confirmar
export default function PanelFiltrosMapa({ reportes, inicial, texto, onAplicar, onCerrar }) {
  const [especie, setEspecie] = useState(inicial.especie);
  const [tiempo, setTiempo] = useState(inicial.tiempo);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  // El conteo refleja los filtros que se están eligiendo, no los ya aplicados
  const resultados = filtrarReportes(reportes, { especie, tiempo, texto }).length;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-[2000] bg-black/40" onClick={onCerrar} aria-hidden="true" />
      <motion.div role="dialog" aria-modal="true" aria-labelledby="titulo-filtros"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="absolute bottom-0 inset-x-0 z-[2100] rounded-t-[28px] bg-white dark:bg-dark-800 px-5 pt-3
                   pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-[0_-8px_40px_rgba(26,26,46,0.2)]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pb-3" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-gray-200 dark:bg-white/15" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 id="titulo-filtros" className="font-poppins font-bold text-xl text-dark-900 dark:text-white">Filtrar mapa</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar filtros"
            className={`-mr-2 h-10 w-10 rounded-full flex items-center justify-center text-gray-500
                        hover:bg-gray-100 dark:hover:bg-white/10 ${focoVisible}`}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <fieldset className="mb-6">
          <legend className="text-sm font-semibold mb-3 text-dark-700 dark:text-white/80">Tipo de animal</legend>
          <div className="flex flex-wrap gap-2">
            {FILTRO_ESPECIE.map((f) => {
              const activo = especie === f.id;
              return (
                <button key={f.id} type="button" onClick={() => setEspecie(f.id)} aria-pressed={activo}
                  className={`h-10 px-4 rounded-full text-sm font-semibold flex items-center gap-1.5 border-[1.5px]
                              transition-colors ${focoVisible}
                              ${activo ? 'bg-primary-700 border-primary-700 text-white'
                                       : 'border-gray-300 text-dark-700 hover:bg-gray-50 dark:border-white/15 dark:text-white/80'}`}>
                  {activo && <Check size={14} strokeWidth={3} aria-hidden="true" />} {f.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className="text-sm font-semibold mb-3 text-dark-700 dark:text-white/80">Fecha del reporte</legend>
          <div className="flex flex-col rounded-2xl border border-warm-border dark:border-white/10 overflow-hidden">
            {FILTRO_TIEMPO.map((op, i) => {
              const activo = tiempo === op.id;
              return (
                <button key={op.id} type="button" onClick={() => setTiempo(op.id)} aria-pressed={activo}
                  className={`h-12 px-4 flex items-center justify-between text-[15px] text-left ${focoVisible}
                              ${i > 0 ? 'border-t border-warm-border dark:border-white/10' : ''}
                              ${activo ? 'font-semibold text-primary-700 dark:text-primary-400 bg-primary-50/60 dark:bg-white/5'
                                       : 'text-dark-700 dark:text-white/80'}`}>
                  {op.label}
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center
                                    ${activo ? 'bg-primary-700 text-white' : 'border-[1.5px] border-gray-300 dark:border-white/20'}`}
                        aria-hidden="true">
                    {activo && <Check size={12} strokeWidth={3.5} />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button type="button" onClick={() => { setEspecie('todos'); setTiempo('todos'); }}
            className={`flex-1 h-12 rounded-2xl text-[15px] font-semibold text-dark-700 dark:text-white/80
                        hover:bg-gray-100 dark:hover:bg-white/5 ${focoVisible}`}>
            Limpiar
          </button>
          <button type="button" onClick={() => onAplicar({ especie, tiempo })}
            className={`flex-[2] h-12 rounded-2xl font-poppins font-semibold text-[15px] text-white bg-primary-700
                        hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
            Ver {resultados} {resultados === 1 ? 'resultado' : 'resultados'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
