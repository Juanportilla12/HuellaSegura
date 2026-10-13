import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, PawPrint, QrCode, RotateCw } from 'lucide-react';
import * as mascotaService from '../services/mascotaService';
import { misReportes } from '../services/reporteService';
import MascotaCard from '../components/MascotaCard';
import BottomNav from '../components/ui/BottomNav';
import { focoVisible } from '../components/auth/AuthUI';

export default function MisMascotas() {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState([]);
  const [perdidas, setPerdidas] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    setError('');
    mascotaService.listarMascotas()
      .then(({ data }) => setMascotas(data.mascotas))
      .catch((err) => setError(err?.response?.status === 429
        ? 'Hay muchas solicitudes en este momento. Espera unos minutos y vuelve a intentar.'
        : 'No se pudo cargar la lista de mascotas. Revisa tu conexión.'))
      .finally(() => setCargando(false));

    // Marca las mascotas con un reporte de pérdida activo (si falla, la lista se muestra igual)
    Promise.resolve()
      .then(() => misReportes())
      .then(({ data }) => setPerdidas(new Set((data.reportes || [])
        .filter((r) => r.estado === 'en_busqueda').map((r) => String(r.mascota_id)))))
      .catch(() => {});
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const total = mascotas.length;

  return (
    <div className="min-h-dvh pb-28 bg-warm-50 dark:bg-dark-800">

      <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-2 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-poppins font-bold text-[26px] leading-tight text-dark-900 dark:text-white">Mis mascotas</h1>
          <p className="text-[14px] mt-0.5 text-gray-500 dark:text-white/50">
            {cargando ? 'Cargando…'
              : error ? 'Tus mascotas registradas'
              : total === 0 ? 'Registra a tu primera mascota'
              : `${total} ${total === 1 ? 'mascota registrada' : 'mascotas registradas'}`}
          </p>
        </div>
        {total > 0 && (
          <button type="button" onClick={() => navigate('/mascotas/nueva')}
            className={`h-11 px-4 shrink-0 rounded-full flex items-center gap-1.5 text-[14px] font-semibold text-white
                        bg-primary-700 hover:bg-primary-800 shadow-[0_6px_16px_rgba(204,74,52,0.35)] ${focoVisible}`}>
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" /> Agregar
          </button>
        )}
      </header>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {cargando && (
          <>
            {/* Indicador de carga para lectores de pantalla */}
            <span className="spinner-border sr-only" role="status">Cargando mascotas…</span>
            {[1, 2].map((i) => (
              <div key={i} className="rounded-3xl p-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10" aria-hidden="true">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-gray-100 dark:bg-white/10 animate-pulse" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 w-16 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
                    <div className="h-5 w-28 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
                  </div>
                </div>
                <div className="mt-3 h-11 rounded-xl bg-gray-100 dark:bg-white/10 animate-pulse" />
              </div>
            ))}
          </>
        )}

        {error && (
          <div className="rounded-3xl p-5 flex flex-col items-start gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <p role="alert" className="text-[15px] leading-relaxed text-red-700 dark:text-red-300">{error}</p>
            <button type="button" onClick={cargar}
              className={`h-10 px-4 rounded-full flex items-center gap-1.5 text-[14px] font-semibold text-primary-700
                          dark:text-primary-400 bg-primary-50 dark:bg-white/10 hover:bg-primary-100 ${focoVisible}`}>
              <RotateCw size={16} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && total === 0 && (
          <div className="flex flex-col items-center text-center px-6 py-12" data-testid="empty-state">
            <span className="h-24 w-24 rounded-full bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-primary-400
                             flex items-center justify-center mb-5">
              <PawPrint size={44} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="font-poppins font-bold text-xl text-dark-900 dark:text-white">Aún no tienes mascotas registradas</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-500 dark:text-white/50 max-w-xs">
              Crea su perfil y obtén un carnet con código QR. Si algún día se pierde, quien la encuentre podrá contactarte.
            </p>
            <button type="button" onClick={() => navigate('/mascotas/nueva')}
              className={`mt-6 h-[52px] px-6 rounded-2xl flex items-center gap-2 font-poppins font-semibold text-[15px] text-white
                          bg-primary-700 hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
              <Plus size={19} aria-hidden="true" /> Registrar mi primera mascota
            </button>
          </div>
        )}

        {!cargando && total > 0 && (
          <>
            {mascotas.map((mascota, idx) => (
              <motion.div key={mascota.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}>
                <MascotaCard mascota={mascota} perdida={perdidas.has(String(mascota.id))} />
              </motion.div>
            ))}

            <div className="mt-2 rounded-3xl p-4 flex items-start gap-3 bg-primary-50/70 dark:bg-white/5">
              <QrCode size={22} className="shrink-0 mt-0.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-dark-700 dark:text-white/70">
                <span className="font-semibold">Consejo:</span> imprime el carnet QR y ponlo en el collar. Quien encuentre a tu
                mascota verá cómo contactarte, sin necesitar la app.
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
