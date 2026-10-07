import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';
import { FILTRO_ESPECIE, FILTRO_TIEMPO, filtrarReportes } from './filtrosMapa';

const CORAL = 'linear-gradient(135deg,#FF9280,#F97B62)';

// Panel inferior para elegir especie y antigüedad; los cambios se aplican al confirmar
export default function PanelFiltrosMapa({ reportes, inicial, texto, onAplicar, onCerrar }) {
  const t = useTokens();
  const [especie, setEspecie] = useState(inicial.especie);
  const [tiempo, setTiempo] = useState(inicial.tiempo);

  // El conteo refleja los filtros que se están eligiendo, no los ya aplicados
  const resultados = filtrarReportes(reportes, { especie, tiempo, texto }).length;

  const fondoInactivo = { background: t.inputBg, color: t.textMuted, border: `1.5px solid ${t.inputBorder}` };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-[2000]" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)' }}
        onClick={onCerrar} />
      <motion.div role="dialog" aria-label="Filtrar mapa"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="absolute bottom-0 inset-x-0 z-[2100] rounded-t-[2rem] px-5 pt-4 pb-10"
        style={{ background: t.isDark ? '#1A1A2E' : '#FFFFFF', boxShadow: '0 -8px 40px rgba(0,0,0,0.20)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4"><div className="h-1 w-10 rounded-full" style={{ background: t.border }} /></div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-poppins font-bold text-xl" style={{ color: t.text }}>Filtrar mapa</h2>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onCerrar} aria-label="Cerrar filtros"
            className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: t.surface2 }}>
            <X size={16} style={{ color: t.textMuted }} />
          </motion.button>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: t.textMuted }}>Tipo de animal</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTRO_ESPECIE.map((f) => (
            <motion.button key={f.id} whileTap={{ scale: 0.95 }} onClick={() => setEspecie(f.id)} aria-pressed={especie === f.id}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold"
              style={especie === f.id ? { background: CORAL, color: 'white', boxShadow: '0 4px 12px rgba(249,123,98,0.40)' } : fondoInactivo}>
              {especie === f.id && <Check size={13} />} {f.emoji} {f.label}
            </motion.button>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: t.textMuted }}>Tiempo del reporte</p>
        <div className="flex flex-col gap-2 mb-6">
          {FILTRO_TIEMPO.map((op) => (
            <motion.button key={op.id} whileTap={{ scale: 0.98 }} onClick={() => setTiempo(op.id)} aria-pressed={tiempo === op.id}
              className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold"
              style={tiempo === op.id ? { background: t.primaryBg, color: t.primary, border: `1.5px solid ${t.primary}` } : fondoInactivo}>
              <span>{op.label}</span>
              {tiempo === op.id && <Check size={15} style={{ color: t.primary }} />}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setEspecie('todos'); setTiempo('todos'); }}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: t.surface2, color: t.textMuted }}>
            Limpiar
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onAplicar({ especie, tiempo })}
            className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: CORAL, boxShadow: '0 6px 20px rgba(249,123,98,0.45)' }}>
            Ver {resultados} resultado{resultados !== 1 ? 's' : ''}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
