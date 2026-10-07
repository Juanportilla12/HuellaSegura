import { motion } from 'framer-motion';
import { MapPin, Calendar, CheckCircle, XCircle, Search } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';

const ESPECIE_EMOJIS = { perro:'🐶', gato:'🐱', ave:'🐦', reptil:'🦎', otro:'🐾' };

const ESTADO_CONFIG = {
  en_busqueda: { label: 'En búsqueda', color: '#F87171', dot: '#F87171' },
  encontrada:  { label: 'Encontrada',  color: '#34D399', dot: '#34D399' },
  cerrado:     { label: 'Cerrado',     color: '#6B7280', dot: '#9CA3AF' },
};

const ESTADOS_TRANSICION = [
  { id: 'encontrada',  label: '¡La encontré!',  icon: CheckCircle, colorKey: 'success'   },
  { id: 'cerrado',     label: 'Cerrar reporte', icon: XCircle,     colorKey: 'muted'     },
  { id: 'en_busqueda', label: 'Reactivar',       icon: Search,      colorKey: 'primary'   },
];

export default function ReporteCard({ reporte, onCambiarEstado }) {
  const t           = useTokens();
  const config      = ESTADO_CONFIG[reporte.estado] || ESTADO_CONFIG.en_busqueda;
  const emoji       = ESPECIE_EMOJIS[reporte.mascota?.especie] || '🐾';
  const fotoPrincipal = reporte.mascota?.foto_principal || reporte.mascota?.foto_urls?.[0];

  const fechaFormateada = reporte.fecha_perdida
    ? new Date(reporte.fecha_perdida + 'T12:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  const btnStyle = (colorKey) => {
    const map = {
      success: { bg: t.successBg,  color: t.success  },
      primary: { bg: t.primaryBg,  color: t.primary  },
      muted:   { bg: t.surface2,   color: t.textMuted },
    };
    return map[colorKey] || map.muted;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="reporte-card"
      className="rounded-3xl overflow-hidden"
      style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}
    >
      <div className="p-4">
        <div className="flex gap-3 items-start">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
               style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}>
            {fotoPrincipal
              ? <img src={fotoPrincipal} alt="" className="w-full h-full object-cover" />
              : emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-poppins font-bold text-base truncate" style={{ color: t.text }}>
                {reporte.mascota?.nombre || `Mascota #${reporte.mascota_id}`}
              </h3>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                    style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}30` }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.dot,
                  animation: reporte.estado === 'en_busqueda' ? 'pulse 2s infinite' : 'none' }} />
                {config.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={11} style={{ color: t.textMuted }} />
              <span className="text-xs" style={{ color: t.textMuted }}>Perdida el {fechaFormateada}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin size={11} style={{ color: t.textMuted }} />
              <span className="text-xs" style={{ color: t.textMuted }}>
                {reporte.latitud
                  ? `${parseFloat(reporte.latitud).toFixed(4)}, ${parseFloat(reporte.longitud).toFixed(4)}`
                  : 'Ubicación no registrada'}
              </span>
            </div>

            {reporte.descripcion && (
              <p className="text-xs mt-1.5 line-clamp-2 italic" style={{ color: t.textMuted }}>
                &ldquo;{reporte.descripcion}&rdquo;
              </p>
            )}
          </div>
        </div>

        {onCambiarEstado && (
          <div className="flex gap-2 mt-3 pt-3 flex-wrap" style={{ borderTop: `1px solid ${t.border}` }}>
            {ESTADOS_TRANSICION
              .filter(e => e.id !== reporte.estado)
              .map(({ id, label, icon: Icon, colorKey }) => {
                const s = btnStyle(colorKey);
                return (
                  <motion.button key={id} whileTap={{ scale: 0.95 }}
                    onClick={() => onCambiarEstado(reporte.id, id)}
                    data-testid={`btn-estado-${id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>
                    <Icon size={13} /> {label}
                  </motion.button>
                );
              })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
