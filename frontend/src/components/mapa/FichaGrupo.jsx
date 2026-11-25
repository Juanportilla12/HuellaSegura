import { ChevronRight, ZoomIn } from 'lucide-react';
import { HojaMapa } from './FichaReporte';
import { tiempoLegible } from './filtrosMapa';
import IconoEspecie from '../ui/IconoEspecie';
import { focoVisible } from '../auth/AuthUI';

// Varias mascotas en el mismo punto o en una zona (mapa alejado): se listan para elegir cuál ver
export default function FichaGrupo({ grupo, onCerrar, onElegir, onAcercar }) {
  const total = grupo.reportes.length;
  const lugar = grupo.mismoPunto ? 'en este lugar' : 'en esta zona';
  return (
    <HojaMapa etiqueta={`${total} mascotas ${lugar}`} onCerrar={onCerrar}>
      <h2 className="font-poppins font-bold text-[20px] leading-tight text-dark-900 dark:text-white pr-10">
        {total} mascotas perdidas {lugar}
      </h2>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[13px] text-gray-500 dark:text-white/50">Toca una para ver su ficha.</p>
        {!grupo.mismoPunto && onAcercar && (
          <button type="button" onClick={onAcercar}
            className={`shrink-0 h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-primary-700
                        bg-primary-50 dark:bg-white/10 dark:text-primary-400 ${focoVisible}`}>
            <ZoomIn size={15} aria-hidden="true" /> Acercar
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-2 max-h-[45dvh] overflow-y-auto -mx-1 px-1" data-testid="lista-grupo">
        {grupo.reportes.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => onElegir(r)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left border border-warm-border
                          dark:border-white/10 hover:bg-warm-50 dark:hover:bg-white/5 ${focoVisible}`}>
              <span className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center">
                {r.mascota?.foto_principal
                  ? <img src={r.mascota.foto_principal} alt="" className="h-full w-full object-cover" loading="lazy" />
                  : <IconoEspecie especie={r.mascota?.especie} size={26} className="text-primary-300" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-poppins font-semibold text-[16px] truncate text-dark-900 dark:text-white">
                  {r.mascota?.nombre ?? 'Mascota'}
                </span>
                <span className="block text-[13px] truncate text-gray-500 dark:text-white/50">
                  {[r.mascota?.raza, r.mascota?.color].filter(Boolean).join(' · ') || r.mascota?.especie}
                  {r.created_at ? ` · reportada ${tiempoLegible(r.created_at)}` : ''}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </HojaMapa>
  );
}
