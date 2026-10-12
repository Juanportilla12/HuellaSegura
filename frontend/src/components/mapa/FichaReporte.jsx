import { motion } from 'framer-motion';
import { X, Clock, MapPin, ArrowRight, Eye } from 'lucide-react';
import { distanciaKm } from '../../utils/distancia';
import { tiempoLegible } from './filtrosMapa';
import IconoEspecie from '../ui/IconoEspecie';
import { focoVisible } from '../auth/AuthUI';

// Hoja inferior compartida por las fichas del mapa (reportes y entidades aliadas)
export function HojaMapa({ etiqueta, onCerrar, children }) {
  return (
    <motion.div role="dialog" aria-label={etiqueta}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 340 }}
      className="absolute bottom-0 inset-x-0 z-[1500] rounded-t-[28px] bg-white dark:bg-dark-800
                 shadow-[0_-12px_40px_rgba(26,26,46,0.18)] px-5 pt-3
                 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
      onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-center pb-3" aria-hidden="true">
        <span className="h-1 w-10 rounded-full bg-gray-200 dark:bg-white/15" />
      </div>
      <button type="button" onClick={onCerrar} aria-label="Cerrar"
              className={`absolute right-3 top-3 h-10 w-10 rounded-full flex items-center justify-center text-gray-500
                          hover:bg-gray-100 dark:hover:bg-white/10 ${focoVisible}`}>
        <X size={20} aria-hidden="true" />
      </button>
      {children}
    </motion.div>
  );
}

function Dato({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
                     bg-warm-100 text-dark-700 dark:bg-white/10 dark:text-white/80">
      <Icon size={12} aria-hidden="true" /> {children}
    </span>
  );
}

// HU-15: ficha emergente del reporte seleccionado en el mapa
export default function FichaReporte({ reporte, ubicacionUsuario, onCerrar, onVerDetalles, onReportarAvistamiento }) {
  const m = reporte.mascota;
  const distancia = ubicacionUsuario
    ? distanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, parseFloat(reporte.latitud), parseFloat(reporte.longitud))
    : null;

  return (
    <HojaMapa etiqueta={`Reporte de ${m?.nombre ?? 'mascota'}`} onCerrar={onCerrar}>
      <div className="flex gap-4 items-center mb-4 pr-8">
        <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-primary-50 dark:bg-white/5
                        flex items-center justify-center">
          {m?.foto_principal
            ? <img src={m.foto_principal} alt="" className="w-full h-full object-cover" />
            : <IconoEspecie especie={m?.especie} size={36} strokeWidth={1.5} className="text-primary-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-700 text-white">
            Se busca
          </span>
          <h2 className="mt-1 font-poppins font-bold text-xl leading-tight truncate text-dark-900 dark:text-white">
            {m?.nombre ?? `Mascota #${reporte.mascota_id}`}
          </h2>
          <p className="text-sm truncate capitalize text-gray-500 dark:text-white/50">
            {[m?.especie, m?.raza, m?.sexo].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <Dato icon={Clock}>Reportada {tiempoLegible(reporte.created_at)}</Dato>
        {distancia !== null && (
          <Dato icon={MapPin}>A {distancia < 1 ? `${Math.round(distancia * 1000)} m` : `${distancia.toFixed(1)} km`} de ti</Dato>
        )}
      </div>

      {reporte.descripcion && (
        <p className="mb-5 text-sm leading-relaxed text-gray-600 dark:text-white/70 line-clamp-3">
          {reporte.descripcion}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onReportarAvistamiento}
          className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-[15px]
                      border-[1.5px] border-gray-300 text-dark-900 hover:bg-gray-50
                      dark:border-white/15 dark:text-white dark:hover:bg-white/5 ${focoVisible}`}>
          <Eye size={18} aria-hidden="true" /> La vi
        </button>
        <button type="button" onClick={onVerDetalles}
          className={`flex-[1.4] h-12 rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold
                      text-[15px] text-white bg-primary-700 hover:bg-primary-800
                      shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
          Ver detalles <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </HojaMapa>
  );
}
