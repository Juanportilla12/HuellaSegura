import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeOff, Eye, User, Calendar, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { listarReportesAdmin, moderarReporte } from '../../services/adminService';
import EncabezadoPagina from '../../components/ui/EncabezadoPagina';
import HojaConfirmacion from '../../components/ui/HojaConfirmacion';
import IconoEspecie from '../../components/ui/IconoEspecie';
import { BuscadorAdmin, FiltrosAdmin, VacioAdmin } from '../../components/admin/ListaAdmin';
import { focoVisible } from '../../components/auth/AuthUI';

const ESTADOS = {
  en_busqueda: { label: 'En búsqueda', clase: 'bg-primary-50 text-primary-800 dark:bg-white/10 dark:text-primary-300' },
  encontrada:  { label: 'Encontrada',  clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  cerrado:     { label: 'Cerrado',     clase: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60' },
};

function fecha(f) {
  if (!f) return '';
  const [a, m, d] = String(f).slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TarjetaReporte({ r, onModerar }) {
  const m = r.mascota;
  const foto = m?.foto_urls?.[0];
  const estado = ESTADOS[r.estado] || ESTADOS.cerrado;
  return (
    <article className={`rounded-3xl p-4 bg-white dark:bg-white/5 border
                         ${r.moderado ? 'border-amber-300 dark:border-amber-500/40' : 'border-warm-border dark:border-white/10'}`}>
      <div className="flex gap-3">
        <span className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center">
          {foto ? <img src={foto} alt="" className="w-full h-full object-cover" />
                : <IconoEspecie especie={m?.especie} size={26} strokeWidth={1.6} className="text-primary-300" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-poppins font-semibold text-[16px] leading-tight truncate text-dark-900 dark:text-white">
              {m?.nombre || `Mascota #${r.mascota_id}`}
            </h3>
            <span className={`shrink-0 h-6 px-2 rounded-full text-[11px] font-bold flex items-center ${estado.clase}`}>{estado.label}</span>
          </div>
          {r.reportante && (
            <p className="mt-1 flex items-center gap-1 text-[12px] truncate text-gray-500 dark:text-white/50">
              <User size={12} aria-hidden="true" /> {r.reportante.nombre} · {r.reportante.email}
            </p>
          )}
          <p className="flex items-center gap-1 text-[12px] text-gray-500 dark:text-white/50">
            <Calendar size={12} aria-hidden="true" /> Se perdió el {fecha(r.fecha_perdida)}
          </p>
        </div>
      </div>

      {r.descripcion && (
        <p className="mt-3 text-[14px] leading-relaxed text-gray-700 dark:text-white/70 bg-warm-50 dark:bg-white/5 rounded-2xl px-3 py-2.5">
          {r.descripcion}
        </p>
      )}

      {r.moderado && (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-amber-800 dark:text-amber-300">
          <EyeOff size={15} aria-hidden="true" /> Oculto del mapa por incumplir las normas
        </p>
      )}

      {/* Solo las búsquedas activas aparecen en el mapa; los reportes ya ocultos se pueden volver a mostrar */}
      {(r.estado === 'en_busqueda' || r.moderado) && (
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={() => onModerar(r)} data-testid={`btn-moderar-${r.id}`}
          className={`h-10 px-4 rounded-full flex items-center gap-1.5 text-[13px] font-semibold ${focoVisible}
                      ${r.moderado ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300'
                                   : 'text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300'}`}>
          {r.moderado ? <><Eye size={16} aria-hidden="true" /> Mostrar en el mapa</>
                      : <><EyeOff size={16} aria-hidden="true" /> Ocultar del mapa</>}
        </button>
      </div>
      )}
    </article>
  );
}

export default function ModeracionReportes() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro,   setFiltro]   = useState('todos');
  const [aOcultar, setAOcultar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(false);
    listarReportesAdmin()
      .then(({ data }) => setReportes(data.reportes))
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Solo se actualiza la lista cuando el servidor confirma el cambio
  async function alternar(r) {
    setGuardando(true);
    try {
      const { data } = await moderarReporte(r.id);
      const moderado = data?.moderado ?? !r.moderado;
      setReportes((prev) => prev.map((x) => (x.id === r.id ? { ...x, moderado } : x)));
      toast.success(moderado ? 'Reporte oculto del mapa.' : 'Reporte visible de nuevo en el mapa.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cambiar la moderación del reporte.');
    } finally {
      setGuardando(false);
      setAOcultar(null);
    }
  }

  const cerrarConfirmacion = useCallback(() => setAOcultar(null), []);

  const conteo = {
    todos: reportes.length,
    activos: reportes.filter((r) => r.estado === 'en_busqueda' && !r.moderado).length,
    ocultos: reportes.filter((r) => r.moderado).length,
    resueltos: reportes.filter((r) => r.estado === 'encontrada').length,
  };

  const filtrados = useMemo(() => {
    let lista = reportes;
    if (filtro === 'activos')   lista = lista.filter((r) => r.estado === 'en_busqueda' && !r.moderado);
    if (filtro === 'ocultos')   lista = lista.filter((r) => r.moderado);
    if (filtro === 'resueltos') lista = lista.filter((r) => r.estado === 'encontrada');
    const q = busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter((r) => [r.mascota?.nombre, r.reportante?.nombre, r.reportante?.email, r.descripcion]
        .some((v) => v?.toLowerCase().includes(q)));
    }
    return lista;
  }, [reportes, filtro, busqueda]);

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-10">
      <EncabezadoPagina titulo="Moderación" onVolver={() => navigate('/admin')}
        subtitulo={cargando ? 'Cargando…' : `${reportes.length} reportes en total`} />

      <div className="px-4 pt-4 flex flex-col gap-3">
        <BuscadorAdmin valor={busqueda} onCambio={setBusqueda} placeholder="Buscar mascota, autor o descripción" />
        <FiltrosAdmin activo={filtro} onCambio={setFiltro} opciones={[
          { id: 'todos', label: 'Todos', cuenta: conteo.todos },
          { id: 'activos', label: 'En búsqueda', cuenta: conteo.activos },
          { id: 'ocultos', label: 'Ocultos', cuenta: conteo.ocultos },
          { id: 'resueltos', label: 'Encontradas', cuenta: conteo.resueltos },
        ]} />
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {cargando && [0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-3xl bg-white dark:bg-white/5 border border-warm-border dark:border-white/10 animate-pulse" aria-hidden="true" />
        ))}

        {error && (
          <div className="rounded-3xl p-4 flex items-center gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <p role="alert" className="flex-1 text-[14px] text-red-700 dark:text-red-300">No se pudieron cargar los reportes.</p>
            <button type="button" onClick={cargar}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-primary-700 bg-primary-50 ${focoVisible}`}>
              <RotateCw size={15} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && filtrados.map((r) => (
          <TarjetaReporte key={r.id} r={r} onModerar={(rep) => (rep.moderado ? alternar(rep) : setAOcultar(rep))} />
        ))}

        {!cargando && !error && filtrados.length === 0 && (
          <VacioAdmin titulo="Todo en orden">No hay reportes que coincidan con el filtro.</VacioAdmin>
        )}
      </div>

      <HojaConfirmacion abierta={Boolean(aOcultar)} titulo={`¿Ocultar el reporte de ${aOcultar?.mascota?.nombre || 'esta mascota'}?`}
        textoConfirmar="Ocultar del mapa" cargando={guardando} onConfirmar={() => alternar(aOcultar)} onCancelar={cerrarConfirmacion}>
        Dejará de aparecer en el mapa y en el inicio. Hazlo solo si incumple las normas; podrás volver a mostrarlo.
      </HojaConfirmacion>
    </div>
  );
}
