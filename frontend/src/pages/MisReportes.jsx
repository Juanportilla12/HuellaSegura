import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Plus, RotateCw, Eye, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import * as reporteService from '../services/reporteService';
import { misAvistamientos } from '../services/avistamientoService';
import MapaEstatico from '../components/mapa/MapaEstatico';
import IconoEspecie from '../components/ui/IconoEspecie';
import ReporteCard from '../components/ReporteCard';
import BottomNav from '../components/ui/BottomNav';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import { focoVisible } from '../components/auth/AuthUI';

const MENSAJES = {
  encontrada:  '¡Qué alegría! Marcamos el reporte como encontrado y ya no aparece en el mapa.',
  cerrado:     'Reporte cerrado. Puedes reactivarlo cuando quieras.',
  en_busqueda: 'Reporte reactivado: vuelve a aparecer en el mapa.',
};

function Seccion({ titulo, children, activa = false }) {
  return (
    <section className="flex flex-col gap-3" aria-label={titulo}>
      <h2 className={`px-1 flex items-center gap-2 text-[13px] font-semibold
                      ${activa ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-white/50'}`}>
        {activa && <span className="h-2 w-2 rounded-full bg-primary-700" aria-hidden="true" />}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const ESTADO_AVISTADA = {
  en_busqueda: { texto: 'Su familia aún la busca', clase: 'bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400' },
  encontrada:  { texto: '¡Ya volvió a casa!',      clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  cerrado:     { texto: 'Búsqueda cerrada',        clase: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60' },
};

// Avistamiento que reportó el usuario: qué mascota, dónde y cuándo la vio, y cómo va su búsqueda
function TarjetaAvistamiento({ avistamiento: a, onVerPerfil }) {
  const m = a.mascota || {};
  const foto = a.foto_url || m.foto_urls?.[0];
  const estado = ESTADO_AVISTADA[a.reporte?.estado] || null;
  const lat = parseFloat(a.latitud);
  const lng = parseFloat(a.longitud);
  const fecha = new Date(a.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  return (
    <article className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10"
             data-testid={`avistamiento-${a.id}`}>
      <div className="p-4 flex gap-3">
        <span className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center">
          {foto ? <img src={foto} alt="" className="h-full w-full object-cover" loading="lazy" />
                : <IconoEspecie especie={m.especie} size={28} className="text-primary-300" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-poppins font-semibold text-[16px] truncate text-dark-900 dark:text-white">
            Viste a {m.nombre || 'una mascota'}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-white/50">{fecha}</p>
          {estado && (
            <span className={`inline-block mt-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold leading-6 ${estado.clase}`}>
              {estado.texto}
            </span>
          )}
        </div>
      </div>
      {Number.isFinite(lat) && Number.isFinite(lng) && <MapaEstatico lat={lat} lng={lng} alto={110} />}
      {a.descripcion && <p className="px-4 pt-3 text-[13px] text-gray-600 dark:text-white/60">“{a.descripcion}”</p>}
      {m.codigo_publico && (
        <div className="p-4">
          <button type="button" onClick={() => onVerPerfil(m.codigo_publico)}
            className={`w-full h-11 rounded-2xl flex items-center justify-center gap-1.5 text-[14px] font-semibold
                        border-[1.5px] border-gray-300 text-dark-900 dark:border-white/15 dark:text-white ${focoVisible}`}>
            <MapPin size={16} aria-hidden="true" /> Ver perfil de {m.nombre}
          </button>
        </div>
      )}
    </article>
  );
}

const PESTANAS = [
  { id: 'perdidas',      label: 'Mis pérdidas' },
  { id: 'avistamientos', label: 'Mis avistamientos' },
];

export default function MisReportes() {
  const navigate = useNavigate();
  const [pestana,  setPestana]  = useState('perdidas');
  const [reportes, setReportes] = useState([]);
  const [avistamientos, setAvistamientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [r, a] = await Promise.all([reporteService.misReportes(), misAvistamientos()]);
      const avis = a.data.avistamientos || [];
      setReportes(r.data.reportes);
      setAvistamientos(avis);
      // Quien solo ha reportado avistamientos ve directamente esa pestaña
      if (r.data.reportes.length === 0 && avis.length > 0) setPestana('avistamientos');
    } catch {
      setError('No se pudieron cargar tus reportes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleCambiarEstado(id, nuevoEstado) {
    try {
      await reporteService.cambiarEstado(id, nuevoEstado);
      setReportes(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r));
      toast.success(MENSAJES[nuevoEstado] || 'Estado actualizado.');
    } catch (err) {
      // Muestra el motivo real (p. ej. al reactivar si ya hay otra búsqueda activa)
      toast.error(err.response?.data?.message || 'No se pudo cambiar el estado del reporte.');
    }
  }

  const activos  = reportes.filter(r => r.estado === 'en_busqueda');
  const cerrados = reportes.filter(r => r.estado !== 'en_busqueda');

  return (
    <div className="min-h-dvh pb-28 bg-warm-50 dark:bg-dark-800">
      <EncabezadoPagina titulo="Mis reportes"
        subtitulo={cargando ? 'Cargando…' : pestana === 'perdidas'
          ? `${reportes.length} reporte${reportes.length !== 1 ? 's' : ''} de pérdida`
          : `${avistamientos.length} avistamiento${avistamientos.length !== 1 ? 's' : ''}`}
        accion={pestana === 'perdidas' && reportes.length > 0 && (
          <button type="button" onClick={() => navigate('/reportes/nuevo')}
            className={`h-10 px-3.5 shrink-0 rounded-full flex items-center gap-1 text-[14px] font-semibold text-white
                        bg-primary-700 hover:bg-primary-800 ${focoVisible}`}>
            <Plus size={17} strokeWidth={2.5} aria-hidden="true" /> Nuevo
          </button>
        )} />

      <div role="tablist" aria-label="Tipo de reporte"
           className="mx-4 mt-3 p-1 grid grid-cols-2 gap-1 rounded-2xl bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
        {PESTANAS.map((p) => {
          const total = p.id === 'perdidas' ? reportes.length : avistamientos.length;
          return (
            <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id} onClick={() => setPestana(p.id)}
              data-testid={`pestana-${p.id}`}
              className={`h-10 rounded-xl text-[14px] font-semibold transition-colors ${focoVisible}
                          ${pestana === p.id ? 'bg-primary-700 text-white' : 'text-gray-600 dark:text-white/60'}`}>
              {p.label}{!cargando && total > 0 ? ` (${total})` : ''}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-6">
        {cargando && [0, 1].map((i) => (
          <div key={i} className="h-40 rounded-3xl bg-white dark:bg-white/5 border border-warm-border dark:border-white/10 animate-pulse" aria-hidden="true" />
        ))}

        {error && (
          <div className="rounded-3xl p-5 flex flex-col items-start gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <p role="alert" className="text-[15px] text-red-700 dark:text-red-300">{error}</p>
            <button type="button" onClick={cargar}
              className={`h-10 px-4 rounded-full flex items-center gap-1.5 text-[14px] font-semibold text-primary-700 bg-primary-50 ${focoVisible}`}>
              <RotateCw size={16} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {/* ── Avistamientos que reporté ─────────────────────────── */}
        {pestana === 'avistamientos' && !cargando && !error && (avistamientos.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 py-12" data-testid="empty-avistamientos">
            <span className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-white/10 text-emerald-700 flex items-center justify-center mb-5">
              <Eye size={42} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="font-poppins font-bold text-xl text-dark-900 dark:text-white">Aún no has reportado avistamientos</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-500 dark:text-white/50 max-w-xs">
              Si ves una mascota perdida, repórtalo: avisamos a su familia y aquí podrás seguir cómo va su búsqueda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {avistamientos.map((a) => (
              <TarjetaAvistamiento key={a.id} avistamiento={a} onVerPerfil={(codigo) => navigate(`/publico/mascotas/${codigo}`)} />
            ))}
          </div>
        ))}

        {pestana === 'perdidas' && !cargando && !error && reportes.length === 0 && (
          <div className="flex flex-col items-center text-center px-6 py-12" data-testid="empty-state">
            <span className="h-24 w-24 rounded-full bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-primary-400
                             flex items-center justify-center mb-5">
              <Megaphone size={42} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="font-poppins font-bold text-xl text-dark-900 dark:text-white">No tienes reportes activos</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-500 dark:text-white/50 max-w-xs">
              Si tu mascota se pierde, publica un reporte: aparecerá en el mapa y avisaremos a los vecinos cercanos.
            </p>
            <button type="button" onClick={() => navigate('/reportes/nuevo')}
              className={`mt-6 h-[52px] px-6 rounded-2xl flex items-center gap-2 font-poppins font-semibold text-[15px] text-white
                          bg-primary-700 hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
              <Megaphone size={19} aria-hidden="true" /> Reportar mascota perdida
            </button>
          </div>
        )}

        {pestana === 'perdidas' && !cargando && activos.length > 0 && (
          <Seccion titulo={`En búsqueda (${activos.length})`} activa>
            {activos.map((r, idx) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <ReporteCard reporte={r} onCambiarEstado={handleCambiarEstado} />
              </motion.div>
            ))}
          </Seccion>
        )}

        {pestana === 'perdidas' && !cargando && cerrados.length > 0 && (
          <Seccion titulo={`Historial (${cerrados.length})`}>
            {cerrados.map((r, idx) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <ReporteCard reporte={r} onCambiarEstado={handleCambiarEstado} />
              </motion.div>
            ))}
          </Seccion>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
