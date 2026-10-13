import { Phone, Clock, MapPin, Navigation } from 'lucide-react';
import { HojaMapa } from './FichaReporte';
import { focoVisible } from '../auth/AuthUI';

const TIPOS = { veterinaria: 'Veterinaria', albergue: 'Albergue', otro: 'Entidad aliada' };

// HU-27: ficha de una entidad aliada (veterinaria, albergue) seleccionada en el mapa
export default function FichaEntidad({ entidad, onCerrar }) {
  const comoLlegar = `https://www.google.com/maps/dir/?api=1&destination=${entidad.latitud},${entidad.longitud}`;
  return (
    <HojaMapa etiqueta={entidad.nombre} onCerrar={onCerrar}>
      <div className="pr-8 mb-4">
        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
          {TIPOS[entidad.tipo] ?? TIPOS.otro}
        </span>
        <h2 className="mt-1 font-poppins font-bold text-xl leading-tight text-dark-900 dark:text-white">
          {entidad.nombre}
        </h2>
      </div>

      <ul className="flex flex-col gap-2.5 mb-5 text-sm text-gray-600 dark:text-white/70">
        {entidad.direccion && (
          <li className="flex items-start gap-2.5"><MapPin size={18} className="shrink-0 text-gray-400" aria-hidden="true" />{entidad.direccion}</li>
        )}
        {entidad.horario && (
          <li className="flex items-start gap-2.5"><Clock size={18} className="shrink-0 text-gray-400" aria-hidden="true" />{entidad.horario}</li>
        )}
      </ul>

      <div className="flex gap-3">
        {entidad.telefono && (
          <a href={`tel:${entidad.telefono}`}
             className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-[15px]
                         border-[1.5px] border-gray-300 text-dark-900 hover:bg-gray-50
                         dark:border-white/15 dark:text-white dark:hover:bg-white/5 ${focoVisible}`}>
            <Phone size={18} aria-hidden="true" /> Llamar
          </a>
        )}
        <a href={comoLlegar} target="_blank" rel="noopener noreferrer"
           className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold
                       text-[15px] text-white bg-emerald-700 hover:bg-emerald-800 ${focoVisible}`}>
          <Navigation size={18} aria-hidden="true" /> Cómo llegar
        </a>
      </div>
    </HojaMapa>
  );
}
