import { useEffect, useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';
import { listarReportesActivos } from '../../services/reporteService';

const EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };

/**
 * R7 / R11: el ciudadano elige, entre las mascotas reportadas como perdidas,
 * la que vio (con foto y datos), en lugar de escribir un número de ID.
 */
export default function SelectorMascotaPerdida({ valor, onCambio, error }) {
  const t = useTokens();
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

  if (cargando) return <div className="h-24 rounded-2xl animate-pulse" style={{ background: t.skeletonBg }} />;
  if (fallo) {
    return <p role="alert" className="text-sm" style={{ color: t.primary }}>No se pudo cargar la lista de mascotas perdidas.</p>;
  }
  if (reportes.length === 0) {
    return (
      <p className="text-sm" style={{ color: t.textMuted }} data-testid="sin-mascotas-perdidas">
        En este momento no hay mascotas reportadas como perdidas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reportes.length > 4 && (
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
             style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={15} style={{ color: t.textMuted }} aria-hidden="true" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, raza o color" aria-label="Buscar mascota perdida"
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
        </div>
      )}

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto" role="radiogroup" aria-label="Mascota que viste">
        {visibles.map((r) => {
          const m = r.mascota;
          const activo = String(m.id) === String(valor);
          return (
            <button key={r.id} type="button" role="radio" aria-checked={activo}
              data-testid={`opcion-mascota-${m.id}`}
              onClick={() => onCambio(String(m.id))}
              className="flex items-center gap-3 p-2.5 rounded-2xl text-left"
              style={{
                background: activo ? t.secondaryBg : t.surface2,
                border: `1.5px solid ${activo ? t.secondary : 'transparent'}`,
              }}>
              <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center text-2xl shrink-0"
                   style={{ background: t.surface }}>
                {m.foto_principal
                  ? <img src={m.foto_principal} alt="" className="w-full h-full object-cover" />
                  : EMOJIS[m.especie] || '🐾'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: t.text }}>{m.nombre}</p>
                <p className="text-xs truncate" style={{ color: t.textMuted }}>
                  {[m.especie, m.raza, m.color].filter(Boolean).join(' · ')}
                </p>
                <p className="text-[11px]" style={{ color: t.textMuted }}>Perdida desde {r.fecha_perdida}</p>
              </div>
              {activo && <CheckCircle size={18} style={{ color: t.secondary }} aria-hidden="true" />}
            </button>
          );
        })}
        {visibles.length === 0 && (
          <p className="text-xs py-2" style={{ color: t.textMuted }}>Ninguna mascota coincide con la búsqueda.</p>
        )}
      </div>
      {error && <p className="text-xs font-medium" style={{ color: t.primary }}>{error}</p>}
    </div>
  );
}
