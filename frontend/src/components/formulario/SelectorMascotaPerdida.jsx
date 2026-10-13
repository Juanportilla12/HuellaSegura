import { useEffect, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { listarReportesActivos } from '../../services/reporteService';
import IconoEspecie from '../ui/IconoEspecie';
import { focoVisible } from '../auth/AuthUI';

function fechaCorta(fecha) {
  if (!fecha) return '';
  const [a, m, d] = String(fecha).slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

/**
 * R7 / R11: el ciudadano elige, entre las mascotas reportadas como perdidas,
 * la que vio (con foto y datos), en lugar de escribir un número de ID.
 */
export default function SelectorMascotaPerdida({ valor, onCambio, error }) {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fallo,    setFallo]    = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    listarReportesActivos()
      .then(({ data }) => setReportes((data.reportes || []).filter((r) => r.mascota)))
      .catch(() => setFallo(true))
      .finally(() => setCargando(false));
  }, []);

  const q = busqueda.trim().toLowerCase();
  const visibles = reportes.filter((r) => !q
    || r.mascota.nombre.toLowerCase().includes(q)
    || (r.mascota.raza || '').toLowerCase().includes(q)
    || (r.mascota.color || '').toLowerCase().includes(q));

  if (cargando) {
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        {[0, 1].map((i) => <div key={i} className="h-[72px] rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
      </div>
    );
  }
  if (fallo) {
    return <p className="text-sm text-red-700 dark:text-red-300">No se pudo cargar la lista de mascotas perdidas.</p>;
  }
  if (reportes.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-white/50" data-testid="sin-mascotas-perdidas">
        En este momento no hay mascotas reportadas como perdidas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reportes.length > 4 && (
        <label className="flex items-center gap-2.5 h-11 rounded-2xl px-3.5 bg-[#F6F2F0] border-[1.5px] border-[#E3DCD8]
                          focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15
                          dark:bg-white/5 dark:border-white/10">
          <Search size={17} className="text-gray-500" aria-hidden="true" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} type="search"
            placeholder="Buscar por nombre, raza o color" aria-label="Buscar mascota perdida"
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-dark-900 placeholder:text-gray-500 dark:text-white" />
        </label>
      )}

      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto -mx-1 px-1 py-1" role="radiogroup" aria-label="Mascota que viste">
        {visibles.map((r) => {
          const m = r.mascota;
          const activo = String(m.id) === String(valor);
          return (
            <button key={r.id} type="button" role="radio" aria-checked={activo}
              data-testid={`opcion-mascota-${m.id}`}
              onClick={() => onCambio(String(m.id), m.codigo_publico)}
              className={`flex items-center gap-3 p-2.5 rounded-2xl text-left border-[1.5px] transition-colors ${focoVisible}
                          ${activo ? 'border-primary-700 bg-primary-50 dark:bg-white/10'
                                   : 'border-warm-border bg-white hover:bg-warm-50 dark:border-white/10 dark:bg-white/5'}`}>
              <span className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center">
                {m.foto_principal
                  ? <img src={m.foto_principal} alt="" className="w-full h-full object-cover" />
                  : <IconoEspecie especie={m.especie} size={26} strokeWidth={1.6} className="text-primary-300" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-[15px] truncate text-dark-900 dark:text-white">{m.nombre}</span>
                <span className="block text-[13px] truncate text-gray-500 dark:text-white/50">
                  {[m.raza, m.color].filter(Boolean).join(' · ') || m.especie}
                </span>
                <span className="block text-xs text-gray-500 dark:text-white/40">Se perdió el {fechaCorta(r.fecha_perdida)}</span>
              </span>
              <span className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center
                                ${activo ? 'bg-primary-700 text-white' : 'border-[1.5px] border-gray-300 dark:border-white/20'}`}
                    aria-hidden="true">
                {activo && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
        {visibles.length === 0 && (
          <p className="text-sm py-2 text-gray-500 dark:text-white/50">Ninguna mascota coincide con la búsqueda.</p>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
