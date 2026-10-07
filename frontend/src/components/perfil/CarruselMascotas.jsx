import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Pencil, QrCode } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';

const EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };
const COLORES = {
  perro:  ['#FFD0BF', '#F97B62'],
  gato:   ['#C7B2F5', '#9B87E8'],
  ave:    ['#A7F0EB', '#00C4B4'],
  reptil: ['#A7F5B9', '#22C55E'],
  otro:   ['#FFD0BF', '#F97B62'],
};
const CORAL = 'linear-gradient(135deg,#FF9280,#F97B62)';

function TarjetaMascota({ mascota }) {
  const t = useTokens();
  const navigate = useNavigate();
  const [c1, c2] = COLORES[mascota.especie] || COLORES.otro;
  const emoji = EMOJIS[mascota.especie] || '🐾';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/mascotas/${mascota.id}`)}
      className="shrink-0 w-44 rounded-3xl overflow-hidden cursor-pointer" style={{ boxShadow: t.shadow }}>
      <div className="relative h-28 flex items-center justify-center overflow-hidden"
           style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
        <span className="absolute text-7xl opacity-20 select-none blur-sm pointer-events-none">{emoji}</span>
        <div className="relative z-10 h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center text-3xl"
             style={{ background: 'rgba(255,255,255,0.30)' }}>
          {mascota.foto_principal ? <img src={mascota.foto_principal} alt={mascota.nombre} className="w-full h-full object-cover" /> : emoji}
        </div>
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide"
              style={{ background: 'rgba(0,0,0,0.18)' }}>
          {mascota.especie}
        </span>
      </div>

      <div className="px-3 py-3" style={{ background: t.isDark ? '#1E1E30' : '#FFFFFF' }}>
        <p className="font-poppins font-bold text-sm truncate" style={{ color: t.text }}>{mascota.nombre}</p>
        {mascota.raza && <p className="text-[11px] truncate mt-0.5" style={{ color: t.textMuted }}>{mascota.raza}</p>}
        <div className="flex gap-1 mt-2 flex-wrap">
          {mascota.edad != null && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: t.primaryBg, color: t.primary }}>
              {mascota.edad} {mascota.edad_unidad || 'años'}
            </span>
          )}
          {mascota.sexo && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: t.accentBg, color: t.accent }}>
              {mascota.sexo.charAt(0).toUpperCase() + mascota.sexo.slice(1)}
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/mascotas/${mascota.id}/editar`); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-semibold"
            style={{ background: t.primaryBg, color: t.primary, border: `1.5px solid ${t.primaryBorder}` }}>
            <Pencil size={11} /> Editar
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/mascotas/${mascota.id}/carnet`); }}
            aria-label={`Carnet QR de ${mascota.nombre}`}
            className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: t.secondaryBg, border: `1px solid ${t.secondaryBorder}` }}>
            <QrCode size={13} style={{ color: t.secondary }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Sección "Mis mascotas" del perfil: carga, vacío, carrusel y acceso a la lista completa
export default function CarruselMascotas({ mascotas, cargando }) {
  const t = useTokens();
  const navigate = useNavigate();
  const nueva = () => navigate('/mascotas/nueva');

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between px-5 mb-3">
        <div>
          <h3 className="font-poppins font-bold text-base" style={{ color: t.text }}>Mis mascotas</h3>
          <p className="text-xs" style={{ color: t.textMuted }}>
            {cargando ? 'Cargando…' : `${mascotas.length} registrada${mascotas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={nueva}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-white"
          style={{ background: CORAL, boxShadow: '0 4px 12px rgba(249,123,98,0.40)' }}>
          <Plus size={14} /> Agregar
        </motion.button>
      </div>

      {cargando && (
        <div className="flex gap-3 px-5 pb-1">
          {[1, 2].map((i) => <div key={i} className="shrink-0 w-44 h-52 rounded-3xl animate-pulse" style={{ background: t.skeletonBg }} />)}
        </div>
      )}

      {!cargando && mascotas.length === 0 && (
        <div className="mx-4 rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
             style={{ background: t.surface, border: `1.5px dashed ${t.border}` }}>
          <span className="text-4xl">🐾</span>
          <div>
            <p className="font-poppins font-semibold text-sm" style={{ color: t.text }}>Sin mascotas registradas</p>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Agrega el perfil digital de tu mascota</p>
          </div>
          <button onClick={nueva} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white"
                  style={{ background: CORAL }}>
            <Plus size={14} /> Registrar mascota
          </button>
        </div>
      )}

      {!cargando && mascotas.length > 0 && (
        <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
          {mascotas.map((m) => <TarjetaMascota key={m.id} mascota={m} />)}
          <button onClick={nueva}
            className="shrink-0 w-36 min-h-[212px] rounded-3xl flex flex-col items-center justify-center gap-3"
            style={{ background: t.surface, border: `2px dashed ${t.border}` }}>
            <span className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: t.primaryBg }}>
              <Plus size={22} style={{ color: t.primary }} />
            </span>
            <span className="text-xs font-bold text-center px-3" style={{ color: t.textMuted }}>Agregar mascota</span>
          </button>
        </div>
      )}

      {!cargando && mascotas.length > 3 && (
        <button onClick={() => navigate('/mascotas')} className="flex items-center gap-1 mx-5 mt-2 text-xs font-bold"
                style={{ color: t.primary }}>
          Ver todas mis mascotas <ChevronRight size={13} />
        </button>
      )}
    </section>
  );
}
