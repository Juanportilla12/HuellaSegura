import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, MapPin, ChevronRight, Search, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotificaciones } from '../context/NotificacionesContext';
import { useTokens } from '../hooks/useTokens';
import BottomNav from '../components/ui/BottomNav';
import { listarReportesActivos } from '../services/reporteService';

const EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };

const QUICK_ACTIONS = [
  { id: 'reportar',     emoji: '📍', bg: 'linear-gradient(135deg,#FF9280,#F97B62)', shadow: 'rgba(249,123,98,0.4)',  title: 'Reportar',    sub: 'Mascota perdida', to: '/reportes/nuevo'      },
  { id: 'avistar',      emoji: '👁️', bg: 'linear-gradient(135deg,#26D6CD,#00C4B4)', shadow: 'rgba(0,196,180,0.4)',   title: 'Vi una',      sub: 'Avistamiento',    to: '/avistamientos/nuevo' },
  { id: 'mis-mascotas', emoji: '🐾', bg: 'linear-gradient(135deg,#FFD770,#F59E0B)', shadow: 'rgba(245,158,11,0.4)',  title: 'Mis mascotas',sub: 'Perfiles',         to: '/mascotas'            },
  { id: 'directorio',   emoji: '🏥', bg: 'linear-gradient(135deg,#C7B2F5,#9B87E8)', shadow: 'rgba(155,135,232,0.4)',title: 'Veterinarias',sub: 'Directorio',      to: '/directorio'          },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.32,0.72,0,1] } } };

export default function Home() {
  const { usuario } = useAuth();
  const { noLeidas } = useNotificaciones();
  const navigate    = useNavigate();
  const t           = useTokens();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarReportesActivos()
      .then(({ data }) => setReportes(data.reportes || []))
      .catch(() => setReportes([]))
      .finally(() => setCargando(false));
  }, []);

  const nombre = usuario?.nombre?.split(' ')[0] ?? 'vecino';
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="min-h-screen w-full pb-24" style={{ background: t.bg }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-safe pt-5 pb-6" style={{ background: t.bgHeader }}>
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle,rgba(249,123,98,0.18) 0%,transparent 70%)' }} />
        <div className="absolute top-8 -left-8 h-32 w-32 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle,rgba(0,196,180,0.12) 0%,transparent 70%)' }} />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.div whileTap={{ scale: 0.95 }} onClick={() => navigate('/perfil')}
              className="h-11 w-11 rounded-2xl flex items-center justify-center font-poppins font-bold text-white cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 4px 14px rgba(249,123,98,0.45)' }}>
              {nombre.charAt(0).toUpperCase()}
            </motion.div>
            <div>
              <p className="text-xs font-medium" style={{ color: t.textMuted }}>{saludo},</p>
              <h2 className="font-poppins font-bold text-lg leading-tight" style={{ color: t.text }}>
                {nombre} 👋
              </h2>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/alertas')}
            className="relative h-11 w-11 rounded-2xl flex items-center justify-center"
            style={{ background: t.primaryBg, border: `1px solid ${t.primaryBorder}` }}>
            <Bell size={20} style={{ color: t.primary }} strokeWidth={1.8} />
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: t.primary }}>
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </motion.button>
        </div>

        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => navigate('/mapa')}
          className="mt-4 w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 relative z-10"
          style={{ background: t.surface, border: `1.5px solid ${t.border}`, boxShadow: t.shadowSm }}>
          <Search size={17} style={{ color: t.primary }} />
          <span className="text-sm" style={{ color: t.textSoft }}>Buscar mascota o barrio…</span>
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: t.primaryBg, color: t.primary }}>Mapa</span>
        </motion.button>
      </div>

      <div className="px-5 mt-4 flex flex-col gap-5">

        {/* ── SOS Card ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <div className="relative rounded-3xl overflow-hidden p-5 cursor-pointer" onClick={() => navigate('/mapa')}
               style={{ background: 'linear-gradient(135deg,#FF9280 0%,#F97B62 55%,#E8614A 100%)', boxShadow: '0 16px 48px rgba(249,123,98,0.4)' }}>
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'radial-gradient(circle at 85% 15%,rgba(255,255,255,0.15) 0%,transparent 55%)' }} />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex items-center gap-1.5 mb-3 relative">
              <span className="h-2 w-2 rounded-full bg-white" style={{ animation: 'pulse 1.5s ease-in-out infinite', boxShadow: '0 0 0 3px rgba(255,255,255,0.3)' }} />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Alerta activa · Cerca de ti</span>
            </div>
            <h3 className="font-poppins font-extrabold text-white leading-tight mb-4 relative" style={{ fontSize: '1.7rem' }}>
              {cargando ? '…' : reportes.length} mascota{reportes.length !== 1 ? 's' : ''}<br />
              en búsqueda<br />
              <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.8 }}>en tu zona ahora mismo</span>
            </h3>
            <div className="flex items-center justify-between relative">
              <div className="flex -space-x-2.5">
                {(reportes.length > 0 ? reportes.slice(0,3) : [0,1,2]).map((r, i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-lg"
                       style={{ borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                    {typeof r === 'object' ? (EMOJIS[r.mascota?.especie] ?? '🐾') : '🐾'}
                  </div>
                ))}
              </div>
              <motion.div whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                Ver mapa <ChevronRight size={14} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── Acciones rápidas ─────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(action => (
              <motion.button key={action.id} variants={fadeUp} whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-start gap-3 rounded-3xl p-4 text-left"
                style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl"
                     style={{ background: action.bg, boxShadow: `0 6px 18px ${action.shadow}` }}>
                  {action.emoji}
                </div>
                <div>
                  <p className="font-poppins font-bold text-sm" style={{ color: t.text }}>{action.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{action.sub}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Stats ────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon: AlertTriangle, value: cargando ? '…' : reportes.length, label: 'Activos',  color: t.primary,    bg: t.primaryBg   },
            { icon: Users,         value: '500+',                            label: 'Vecinos',  color: t.secondary,  bg: t.secondaryBg },
            { icon: CheckCircle,   value: '128',                             label: 'Reunidos', color: t.success,    bg: t.successBg   },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
                 style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="font-poppins font-extrabold text-lg leading-none" style={{ color: t.text }}>{value}</p>
              <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: t.textMuted }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Reportes recientes ───────────────────────────────────── */}
        {!cargando && reportes.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-poppins font-bold text-base" style={{ color: t.text }}>🆘 Cerca de ti</h3>
              <button onClick={() => navigate('/mapa')} className="text-xs font-bold flex items-center gap-1" style={{ color: t.primary }}>
                Ver todos <ChevronRight size={13} />
              </button>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
              {reportes.slice(0,3).map(r => (
                <motion.div key={r.id} variants={fadeUp} whileTap={{ scale: 0.98 }} onClick={() => navigate('/mapa')}
                  className="flex items-center gap-3 rounded-2xl p-3.5 cursor-pointer"
                  style={{ background: t.surface, border: `1px solid ${t.primaryBorder}`, boxShadow: t.shadowSm }}>
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                       style={{ background: t.primaryBg }}>
                    {EMOJIS[r.mascota?.especie] ?? '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins font-bold text-sm truncate" style={{ color: t.text }}>
                      {r.mascota?.nombre ?? `Mascota #${r.mascota_id}`}
                    </p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: t.textMuted }}>
                      {r.mascota?.especie}{r.mascota?.raza ? ` · ${r.mascota.raza}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}>SOS</span>
                    <ChevronRight size={14} style={{ color: t.border }} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── Empty ────────────────────────────────────────────────── */}
        {!cargando && reportes.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 flex flex-col items-center gap-3 text-center"
            style={{ background: t.surface, border: `1px solid ${t.secondaryBorder}`, boxShadow: t.shadowSm }}>
            <span className="text-5xl" style={{ animation: 'float 3s ease-in-out infinite' }}>🎉</span>
            <div>
              <p className="font-poppins font-bold" style={{ color: t.text }}>¡Todo tranquilo por aquí!</p>
              <p className="text-sm mt-1" style={{ color: t.textMuted }}>No hay mascotas perdidas cerca ahora mismo.</p>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
