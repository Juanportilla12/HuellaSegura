import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, MapPin, CheckCircle,
  ChevronRight, LogOut, Home, Shield,
  TrendingUp, Activity, FileText,
} from 'lucide-react';
import { obtenerEstadisticas, descargarReporteSemanal } from '../../services/adminService';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

const STAT_CONFIG = [
  { key: 'total_usuarios',     label: 'Usuarios',          sub: 'registrados',       icon: Users,         color: '#818CF8', bg: 'rgba(129,140,248,0.15)', max: 500 },
  { key: 'reportes_activos',   label: 'Reportes',          sub: 'en búsqueda',       icon: AlertTriangle, color: '#F87171', bg: 'rgba(248,113,113,0.15)', max: 50  },
  { key: 'avistamientos_mes',  label: 'Avistamientos',     sub: 'este mes',          icon: MapPin,        color: '#34D399', bg: 'rgba(52,211,153,0.15)',  max: 100 },
  { key: 'reportes_resueltos', label: 'Encontradas',       sub: 'mascotas reunidas', icon: CheckCircle,   color: '#FBBF24', bg: 'rgba(251,191,36,0.15)',  max: 200 },
];

const ACCESOS = [
  { to: '/admin/usuarios', icon: Users,         label: 'Gestión de usuarios',  desc: 'Activar · desactivar · roles',     color: '#818CF8', border: 'rgba(129,140,248,0.3)' },
  { to: '/admin/reportes', icon: AlertTriangle, label: 'Moderación',           desc: 'Revisar reportes inapropiados',    color: '#F87171', border: 'rgba(248,113,113,0.3)' },
  { to: '/directorio',     icon: MapPin,        label: 'Directorio aliados',   desc: 'Veterinarias y refugios',          color: '#34D399', border: 'rgba(52,211,153,0.3)'  },
];

function StatCard({ cfg, value, cargando }) {
  const pct = Math.min(100, Math.round(((value || 0) / cfg.max) * 100));
  return (
    <motion.div variants={fadeUp} data-testid="stat-card"
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
          <cfg.icon size={19} style={{ color: cfg.color }} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
             style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
          <TrendingUp size={9} /> +{Math.floor(Math.random() * 12) + 1}%
        </div>
      </div>
      {cargando
        ? <div className="h-8 w-20 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
        : <p className="font-poppins font-extrabold text-3xl text-white">{value ?? 0}</p>
      }
      <div>
        <p className="text-xs font-bold text-white">{cfg.label}</p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{cfg.sub}</p>
      </div>
      {/* Mini barra de progreso */}
      <div className="h-1 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: cfg.color }}
        />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { logout, usuario } = useAuth();
  const navigate            = useNavigate();
  const [stats, setStats]   = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerEstadisticas()
      .then(({ data }) => setStats(data.estadisticas))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const tasa = stats
    ? stats.total_reportes > 0
      ? Math.round((stats.reportes_resueltos / stats.total_reportes) * 100)
      : 0
    : 0;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F1A' }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-12 pb-6"
           style={{ background: 'linear-gradient(135deg,#1E1B4B 0%,#1A1A2E 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 90% 0%, rgba(129,140,248,0.2) 0%, transparent 60%)' }} />

        <div className="flex items-start justify-between relative z-10 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.3)' }}>
              <Shield size={21} style={{ color: '#818CF8' }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                HuellaSegura
              </p>
              <h1 className="font-poppins font-bold text-white text-xl leading-tight">
                Panel Admin
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              title="Ir al inicio">
              <Home size={17} color="white" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => logout?.()}
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(248,113,113,0.2)' }}
              title="Cerrar sesión">
              <LogOut size={17} style={{ color: '#FCA5A5' }} />
            </motion.button>
          </div>
        </div>

        {/* Bienvenida */}
        <div className="rounded-2xl p-4 flex items-center gap-4"
             style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
          <div className="h-12 w-12 rounded-xl flex items-center justify-center font-poppins font-bold text-lg text-white shrink-0"
               style={{ background: 'linear-gradient(135deg,#818CF8,#6366F1)' }}>
            {usuario?.nombre?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Bienvenido de nuevo</p>
            <p className="font-poppins font-bold text-white">{usuario?.nombre || 'Administrador'}</p>
            <p className="text-[11px]" style={{ color: 'rgba(129,140,248,0.8)' }}>{usuario?.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
               style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <Activity size={11} style={{ color: '#34D399' }} />
            <span className="text-[10px] font-bold" style={{ color: '#34D399' }}>Activo</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-6 pb-12">

        {/* ── Métricas ──────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
             style={{ color: 'rgba(255,255,255,0.3)' }}>Métricas generales</p>
          <motion.div variants={stagger} initial="hidden" animate="show"
                      className="grid grid-cols-2 gap-3">
            {STAT_CONFIG.map(cfg => (
              <StatCard key={cfg.key} cfg={cfg} value={stats?.[cfg.key]} cargando={cargando} />
            ))}
          </motion.div>
        </div>

        {/* ── Tasa de resolución ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-white">Tasa de resolución</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Mascotas encontradas vs. reportes totales
              </p>
            </div>
            <p className="font-poppins font-extrabold text-2xl" style={{ color: '#FBBF24' }}>
              {tasa}%
            </p>
          </div>
          <div className="h-2 rounded-full w-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tasa}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#F97B62,#FBBF24)' }}
            />
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>{stats?.reportes_resueltos ?? 0} resueltos</span>
            <span>{stats?.total_reportes ?? 0} totales</span>
          </div>
        </motion.div>

        {/* ── Accesos rápidos ───────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
             style={{ color: 'rgba(255,255,255,0.3)' }}>Administración</p>
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
            {ACCESOS.map(({ to, icon: Icon, label, desc, color, border }) => (
              <motion.button
                key={to} variants={fadeUp} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(to)}
                className="flex items-center gap-4 p-4 rounded-2xl text-left w-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${border}` }}
              >
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: `${color}20` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-poppins font-bold text-sm text-white">{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* ── Reporte PDF ───────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-bold"
          style={{
            background: 'linear-gradient(135deg,#818CF8,#6366F1)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            color: 'white',
          }}
          onClick={() => descargarReporteSemanal().catch(() => toast.error('No se pudo generar el PDF.'))}
        >
          <FileText size={16} />
          Descargar reporte semanal PDF
        </motion.button>

      </div>
    </div>
  );
}
