import { motion } from 'framer-motion';
import { X, Clock, MapPin, ChevronRight, Eye } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';
import { distanciaKm } from '../../utils/distancia';
import { EMOJIS, tiempoTranscurrido } from './filtrosMapa';

// HU-15: ficha emergente del reporte seleccionado en el mapa
export default function FichaReporte({ reporte, ubicacionUsuario, onCerrar, onVerDetalles, onReportarAvistamiento }) {
  const t = useTokens();
  const m = reporte.mascota;
  const distancia = ubicacionUsuario
    ? distanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, parseFloat(reporte.latitud), parseFloat(reporte.longitud))
    : null;

  return (
    <motion.div key="ficha" role="dialog" aria-label={`Reporte de ${m?.nombre ?? 'mascota'}`}
      initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 32, stiffness: 340 }}
      className="absolute bottom-0 inset-x-0 z-[1500] rounded-t-[2rem] overflow-hidden"
      style={{
        background: t.isDark ? '#1A1A2E' : '#FFFFFF',
        boxShadow: '0 -12px 50px rgba(0,0,0,0.18)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
      }}
      onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-center pt-3 pb-2 relative">
        <div className="h-1 w-10 rounded-full" style={{ background: t.border }} />
        <motion.button whileTap={{ scale: 0.88 }} onClick={onCerrar} aria-label="Cerrar"
          className="absolute right-4 h-8 w-8 rounded-full flex items-center justify-center" style={{ background: t.surface2 }}>
          <X size={15} style={{ color: t.textMuted }} />
        </motion.button>
      </div>

      <div className="px-5 pb-2">
        <div className="flex gap-4 items-start mb-4">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-3xl flex items-center justify-center text-4xl overflow-hidden"
                 style={{ background: 'linear-gradient(135deg,#FFD0BF,#F97B62)', boxShadow: '0 6px 20px rgba(249,123,98,0.40)' }}>
              {m?.foto_principal ? <img src={m.foto_principal} alt="" className="w-full h-full object-cover" /> : EMOJIS[m?.especie] || '🐾'}
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ background: 'linear-gradient(135deg,#FF4444,#CC0000)', fontSize: '0.58rem' }}>
              Perdida
            </span>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-poppins font-extrabold text-xl leading-tight" style={{ color: t.text }}>
              {m?.nombre ?? `Mascota #${reporte.mascota_id}`}
            </h3>
            <p className="text-sm mt-0.5 capitalize" style={{ color: t.textMuted }}>
              {[m?.especie, m?.raza, m?.sexo].filter(Boolean).join(' · ')}
            </p>
            <div className="flex gap-2 mt-2.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: t.primaryBg, color: t.primary }}>
                <Clock size={11} /> hace {tiempoTranscurrido(reporte.created_at)}
              </span>
              {distancia !== null && (
                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: t.secondaryBg, color: t.secondary }}>
                  <MapPin size={11} /> a {distancia < 1 ? `${Math.round(distancia * 1000)} m` : `${distancia.toFixed(1)} km`}
                </span>
              )}
            </div>
          </div>
        </div>

        {reporte.descripcion && (
          <p className="p-3.5 rounded-2xl mb-4 text-sm leading-snug font-medium"
             style={{ background: t.isDark ? 'rgba(251,191,36,0.12)' : '#FFF8E0', color: t.isDark ? '#FCD34D' : '#92400E' }}>
            {reporte.descripcion}
          </p>
        )}

        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={onVerDetalles}
            className="flex-1 flex items-center justify-center gap-2 h-14 rounded-3xl font-poppins font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 6px 20px rgba(249,123,98,0.45)' }}>
            Ver detalles <ChevronRight size={16} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.92 }} onClick={onReportarAvistamiento} aria-label="La vi: reportar avistamiento"
            className="h-14 w-14 rounded-3xl flex items-center justify-center shrink-0"
            style={{ background: t.secondaryBg, boxShadow: '0 4px 14px rgba(0,196,180,0.30)' }}>
            <Eye size={22} style={{ color: t.secondary }} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
