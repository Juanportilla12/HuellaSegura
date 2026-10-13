import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Plus, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import * as reporteService from '../services/reporteService';
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

export default function MisReportes() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { data } = await reporteService.misReportes();
      setReportes(data.reportes);
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
    } catch {
      toast.error('No se pudo cambiar el estado del reporte.');
    }
  }

  const activos  = reportes.filter(r => r.estado === 'en_busqueda');
  const cerrados = reportes.filter(r => r.estado !== 'en_busqueda');

  return (
    <div className="min-h-dvh pb-28 bg-warm-50 dark:bg-dark-800">
      <EncabezadoPagina titulo="Mis reportes"
        subtitulo={cargando ? 'Cargando…' : `${reportes.length} reporte${reportes.length !== 1 ? 's' : ''} en total`}
        accion={reportes.length > 0 && (
          <button type="button" onClick={() => navigate('/reportes/nuevo')}
            className={`h-10 px-3.5 shrink-0 rounded-full flex items-center gap-1 text-[14px] font-semibold text-white
                        bg-primary-700 hover:bg-primary-800 ${focoVisible}`}>
            <Plus size={17} strokeWidth={2.5} aria-hidden="true" /> Nuevo
          </button>
        )} />

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

        {!cargando && !error && reportes.length === 0 && (
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

        {!cargando && activos.length > 0 && (
          <Seccion titulo={`En búsqueda (${activos.length})`} activa>
            {activos.map((r, idx) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <ReporteCard reporte={r} onCambiarEstado={handleCambiarEstado} />
              </motion.div>
            ))}
          </Seccion>
        )}

        {!cargando && cerrados.length > 0 && (
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
