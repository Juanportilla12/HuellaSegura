import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MapPin, Clock, SlidersHorizontal, X, Check } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import BottomNav from '../components/ui/BottomNav';
import { listarNotificaciones, marcarLeida, marcarTodasLeidas } from '../services/notificacionService';
import { useNotificaciones } from '../context/NotificacionesContext';


const TABS = [
  { label: 'Todos',        filter: () => true },
  { label: 'Cercanos',     filter: n => n.tipo === 'proximidad'   },
  { label: 'Mis mascotas', filter: n => n.tipo === 'avistamiento' },
];
const FILTRO_TIPO_OPTS   = ['Todos', 'Proximidad', 'Avistamiento'];
const FILTRO_ESTADO_OPTS = ['Todas', 'No leídas', 'Leídas'];

function tiempoRelativo(isoStr) {
  const mins = Math.floor((Date.now() - new Date(isoStr)) / 60000);
  if (mins < 60)   return `Hace ${mins} min`;
  if (mins < 1440) return `Hace ${Math.floor(mins / 60)}h`;
  return `Hace ${Math.floor(mins / 1440)}d`;
}

export default function Alertas() {
  const t = useTokens();
  const navigate = useNavigate();
  const { refrescar } = useNotificaciones();
  const [notifs,     setNotifs]     = useState([]);
  const [tab,        setTab]        = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [showFiltro, setShowFiltro] = useState(false);
  const [filtroTipo,   setFiltroTipo]   = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  useEffect(() => {
    listarNotificaciones()
      .then(({ data }) => setNotifs(data.notificaciones || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRead    = async (id) => { try { await marcarLeida(id); } catch {} setNotifs(p => p.map(n => n.id===id ? {...n,leida:true} : n)); refrescar(); };
  const handleReadAll = async ()    => { try { await marcarTodasLeidas(); } catch {} setNotifs(p => p.map(n => ({...n,leida:true}))); refrescar(); };

  // DoD Sprint 5: la notificación lleva directamente al reporte en el mapa
  const handleAbrir = async (notif) => {
    if (!notif.leida) await handleRead(notif.id);
    if (notif.reporte_id) navigate(`/mapa?reporte=${notif.reporte_id}`);
  };

  const notifsFiltradas = notifs
    .filter(TABS[tab].filter)
    .filter(n => filtroTipo==='Proximidad' ? n.tipo==='proximidad' : filtroTipo==='Avistamiento' ? n.tipo==='avistamiento' : true)
    .filter(n => filtroEstado==='No leídas' ? !n.leida : filtroEstado==='Leídas' ? n.leida : true);

  const noLeidas       = notifs.filter(n => !n.leida).length;
  const filtrosActivos = (filtroTipo !== 'Todos' ? 1 : 0) + (filtroEstado !== 'Todas' ? 1 : 0);

  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>

      {/* Header */}
      <div className="px-5 pt-safe pt-5 pb-4" style={{ background: t.bgHeader }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-poppins font-bold text-2xl" style={{ color: t.text }}>Alertas</h1>
          {noLeidas > 0 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleReadAll}
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: t.primaryBg, color: t.primary, border: `1px solid ${t.primaryBorder}` }}>
              Marcar todas
            </motion.button>
          )}
        </div>
        <p className="text-sm" style={{ color: t.textMuted }}>
          {noLeidas > 0
            ? <><span className="font-bold" style={{ color: t.primary }}>{noLeidas} nuevas</span> · {notifs.length} total</>
            : `${notifs.length} notificaciones`}
        </p>
      </div>

      {/* Tabs + Filtro */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2">
          {TABS.map((tab_, i) => (
            <motion.button key={tab_.label} whileTap={{ scale: 0.95 }} onClick={() => setTab(i)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={tab === i
                ? { background: 'linear-gradient(135deg,#FF9280,#F97B62)', color: 'white', boxShadow: '0 4px 14px rgba(249,123,98,0.35)' }
                : { background: t.surface, color: t.textMuted, border: `1px solid ${t.border}` }}>
              {tab_.label}
            </motion.button>
          ))}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowFiltro(true)}
            className="ml-auto relative h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: filtrosActivos > 0 ? 'linear-gradient(135deg,#FF9280,#F97B62)' : t.surface, border: filtrosActivos === 0 ? `1px solid ${t.border}` : 'none' }}>
            <SlidersHorizontal size={16} color={filtrosActivos > 0 ? 'white' : t.textMuted} />
            {filtrosActivos > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                    style={{ background: t.isDark ? '#1A1A2E' : '#1A1A2E', border: `1px solid ${t.border}` }}>
                {filtrosActivos}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Lista */}
      <div className="px-5 flex flex-col gap-3">
        {loading && [...Array(3)].map((_,i) => (
          <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: t.skeletonBg }} />
        ))}

        {!loading && notifsFiltradas.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="h-20 w-20 rounded-3xl flex items-center justify-center"
                 style={{ background: t.primaryBg, border: `1px solid ${t.primaryBorder}` }}>
              <Bell size={32} style={{ color: t.primary, opacity: 0.6 }} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-poppins font-bold text-base" style={{ color: t.text }}>Sin alertas</p>
              <p className="text-sm mt-1 max-w-xs" style={{ color: t.textMuted }}>
                {filtrosActivos > 0 ? 'Ninguna notificación coincide con los filtros.' : 'Cuando haya mascotas perdidas cerca de ti, las verás aquí.'}
              </p>
            </div>
            {filtrosActivos > 0 && (
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setFiltroTipo('Todos'); setFiltroEstado('Todas'); }}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold"
                style={{ background: t.primaryBg, color: t.primary, border: `1px solid ${t.primaryBorder}` }}>
                Limpiar filtros
              </motion.button>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {!loading && notifsFiltradas.map((notif, i) => (
            <motion.div key={notif.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
              onClick={() => handleAbrir(notif)}
              data-testid={`notif-item-${notif.id}`}
              className="rounded-2xl p-4 cursor-pointer"
              style={{
                background: notif.leida ? t.surface2 : t.surface,
                border: notif.leida ? `1px solid ${t.border}` : `1px solid ${t.primaryBorder}`,
                opacity: notif.leida ? 0.7 : 1,
                boxShadow: notif.leida ? 'none' : t.shadowSm,
              }}>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                     style={{
                       background: notif.tipo==='avistamiento' ? t.secondaryBg : t.primaryBg,
                       border: `1px solid ${notif.tipo==='avistamiento' ? t.secondaryBorder : t.primaryBorder}`,
                     }}>
                  {notif.tipo==='avistamiento'
                    ? <MapPin size={18} style={{ color: t.secondary }} strokeWidth={2} />
                    : <Bell   size={18} style={{ color: t.primary  }} strokeWidth={2} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug line-clamp-3" style={{ color: t.text, fontWeight: notif.leida ? 400 : 600 }}>
                    {notif.mensaje}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} style={{ color: t.textSoft }} />
                      <span className="text-xs" style={{ color: t.textMuted }}>{tiempoRelativo(notif.created_at)}</span>
                    </div>
                    {!notif.leida && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}>
                        Nueva
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Panel filtros */}
      <AnimatePresence>
        {showFiltro && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowFiltro(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed bottom-0 inset-x-0 z-50 rounded-t-[2rem] px-5 pt-4 pb-10 max-w-mobile mx-auto"
              style={{ background: t.isDark ? '#1A1A2E' : '#FFFFFF', border: `1px solid ${t.border}`, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>
              <div className="flex justify-center mb-4">
                <div className="h-1 w-10 rounded-full" style={{ background: t.border }} />
              </div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-poppins font-bold text-lg" style={{ color: t.text }}>Filtrar alertas</h2>
                <button onClick={() => setShowFiltro(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ background: t.surface2 }}>
                  <X size={16} style={{ color: t.textMuted }} />
                </button>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Tipo</p>
              <div className="flex gap-2 flex-wrap mb-5">
                {FILTRO_TIPO_OPTS.map(opt => (
                  <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => setFiltroTipo(opt)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={filtroTipo===opt
                      ? { background: 'linear-gradient(135deg,#FF9280,#F97B62)', color: 'white' }
                      : { background: t.surface2, color: t.textMuted, border: `1px solid ${t.border}` }}>
                    {filtroTipo===opt && <Check size={13} />} {opt}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Estado</p>
              <div className="flex gap-2 flex-wrap mb-6">
                {FILTRO_ESTADO_OPTS.map(opt => (
                  <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => setFiltroEstado(opt)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={filtroEstado===opt
                      ? { background: 'linear-gradient(135deg,#FF9280,#F97B62)', color: 'white' }
                      : { background: t.surface2, color: t.textMuted, border: `1px solid ${t.border}` }}>
                    {filtroEstado===opt && <Check size={13} />} {opt}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setFiltroTipo('Todos'); setFiltroEstado('Todas'); }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                  style={{ background: t.surface2, color: t.textMuted }}>
                  Limpiar
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowFiltro(false)}
                  className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 6px 20px rgba(249,123,98,0.4)' }}>
                  Aplicar {filtrosActivos > 0 && `(${filtrosActivos})`}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
