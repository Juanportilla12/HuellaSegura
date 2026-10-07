import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Clock } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';
import { FILTRO_ESPECIE } from './filtrosMapa';

function Chip({ activo, onClick, children }) {
  const t = useTokens();
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} aria-pressed={activo}
      className="shrink-0 px-4 py-2 rounded-full text-sm font-bold"
      style={activo
        ? { background: t.isDark ? t.primary : '#1A1A2E', color: 'white', boxShadow: '0 4px 12px rgba(26,26,46,0.35)' }
        : { background: t.navBg, color: t.textMuted, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      {children}
    </motion.button>
  );
}

// Búsqueda, botón de filtros y chips rápidos de especie sobre el mapa
export default function BarraBusquedaMapa({ texto, onTexto, resultados, especie, onEspecie, tiempoActivo, filtrosActivos, onAbrirFiltros }) {
  const t = useTokens();
  return (
    <div className="absolute top-0 inset-x-0 z-[1000] pt-safe pt-3 px-4 flex flex-col gap-2.5 pointer-events-none">
      <div className="flex gap-2 pointer-events-auto">
        <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3"
             style={{ background: t.navBg, backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          <Search size={17} style={{ color: t.textMuted }} className="shrink-0" aria-hidden="true" />
          <input value={texto} onChange={(e) => onTexto(e.target.value)}
            placeholder="Buscar por nombre o raza…" aria-label="Buscar mascota perdida"
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
          {texto.trim() && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: t.primaryBg, color: t.primary }}>
              {resultados}
            </span>
          )}
        </div>

        <motion.button whileTap={{ scale: 0.92 }} onClick={onAbrirFiltros} aria-label="Abrir filtros"
          className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 relative"
          style={{
            background: filtrosActivos > 0 ? 'linear-gradient(135deg,#FF9280,#F97B62)' : t.navBg,
            backdropFilter: 'blur(12px)',
            boxShadow: filtrosActivos > 0 ? '0 6px 20px rgba(249,123,98,0.50)' : '0 4px 16px rgba(0,0,0,0.12)',
          }}>
          <SlidersHorizontal size={18} color={filtrosActivos > 0 ? 'white' : t.primary} strokeWidth={2} />
          {filtrosActivos > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: '#1A1A2E' }}>
              {filtrosActivos}
            </span>
          )}
        </motion.button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
        {FILTRO_ESPECIE.slice(0, 4).map((f) => (
          <Chip key={f.id} activo={especie === f.id} onClick={() => onEspecie(f.id)}>{f.emoji} {f.label}</Chip>
        ))}
        <Chip activo={tiempoActivo} onClick={onAbrirFiltros}>
          <Clock size={13} className="inline mr-1" aria-hidden="true" /> Tiempo
        </Chip>
      </div>
    </div>
  );
}
