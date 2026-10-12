import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Eye, MapPin, Phone, MessageCircle, ChevronRight, BellOff, RotateCw, CheckCheck } from 'lucide-react';
import BottomNav from '../components/ui/BottomNav';
import { listarNotificaciones, marcarLeida, marcarTodasLeidas } from '../services/notificacionService';
import { useNotificaciones } from '../context/NotificacionesContext';
import { useAuth } from '../context/AuthContext';
import { focoVisible } from '../components/auth/AuthUI';

const PESTANAS = [
  { id: 'todas',        label: 'Todas',        filtro: () => true },
  { id: 'cerca',        label: 'Cerca de mí',  filtro: (n) => n.tipo === 'proximidad' },
  { id: 'avistamiento', label: 'Mis mascotas', filtro: (n) => n.tipo === 'avistamiento' },
];

function tiempoRelativo(fecha) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(fecha)) / 60000));
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  if (mins < 1440) return `Hace ${Math.floor(mins / 60)} h`;
  return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function grupoDeFecha(fecha) {
  const d = new Date(fecha);
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  if (d >= inicioHoy) return 'Hoy';
  if (d >= new Date(inicioHoy - 864e5)) return 'Ayer';
  return 'Anteriores';
}

// El aviso de avistamiento incluye el celular del testigo ("…a quien la vio al 300 123 4567.")
function celularDelTestigo(n) {
  if (n.tipo !== 'avistamiento') return null;
  const m = n.mensaje?.match(/al (\+?\d[\d\s-]{6,18}\d)/);
  return m ? m[1] : null;
}

function numeroWhatsApp(telefono) {
  const d = telefono.replace(/\D/g, '');
  return d.length === 10 && d.startsWith('3') ? `57${d}` : d;
}

function Alerta({ notif, onAbrir }) {
  const esAvistamiento = notif.tipo === 'avistamiento';
  const celular = celularDelTestigo(notif);
  const abrible = Boolean(notif.reporte_id);
  const Icono = esAvistamiento ? Eye : MapPin;

  const contenido = (
    <>
      <span className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center
                        ${esAvistamiento ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                         : 'bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400'}`}>
        <Icono size={20} aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className={`text-[12px] font-semibold ${esAvistamiento ? 'text-emerald-700 dark:text-emerald-300' : 'text-primary-700 dark:text-primary-400'}`}>
            {esAvistamiento ? 'Avistamiento' : 'Mascota perdida cerca'}
          </span>
          <span className="text-[12px] text-gray-500 dark:text-white/40">· {tiempoRelativo(notif.created_at)}</span>
          {!notif.leida && <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-primary-700" aria-label="Sin leer" />}
        </span>
        <span className={`block mt-1 text-[14px] leading-snug text-dark-900 dark:text-white ${notif.leida ? '' : 'font-semibold'}`}>
          {notif.mensaje}
        </span>
      </span>
      {abrible && <ChevronRight size={18} className="shrink-0 self-center text-gray-400" aria-hidden="true" />}
    </>
  );

  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid={`notif-item-${notif.id}`}
      className={`rounded-3xl border overflow-hidden transition-colors
                  ${notif.leida ? 'bg-white/60 border-warm-border dark:bg-white/[0.03] dark:border-white/10'
                               : 'bg-white border-primary-200 shadow-card dark:bg-white/5 dark:border-white/15'}`}>
      {abrible ? (
        <button type="button" onClick={() => onAbrir(notif)}
                className={`w-full flex items-start gap-3 p-4 text-left ${focoVisible}`}>
          {contenido}
        </button>
      ) : (
        <div className="flex items-start gap-3 p-4" onClick={() => onAbrir(notif)}>{contenido}</div>
      )}
      {celular && (
        <div className="flex gap-2 px-4 pb-4 -mt-1">
          <a href={`tel:${celular.replace(/\s/g, '')}`} onClick={() => onAbrir(notif, { soloLeer: true })}
             className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold
                         border-[1.5px] border-gray-300 text-dark-900 dark:border-white/15 dark:text-white ${focoVisible}`}>
            <Phone size={16} aria-hidden="true" /> Llamar
          </a>
          <a href={`https://wa.me/${numeroWhatsApp(celular)}`} target="_blank" rel="noopener noreferrer"
             onClick={() => onAbrir(notif, { soloLeer: true })}
             className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold
                         text-white bg-[#128C7E] hover:bg-[#0F7A6E] ${focoVisible}`}>
            <MessageCircle size={16} aria-hidden="true" /> WhatsApp
          </a>
        </div>
      )}
    </motion.li>
  );
}

export default function Alertas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { refrescar } = useNotificaciones();
  const [notifs,     setNotifs]     = useState([]);
  const [pestana,    setPestana]    = useState('todas');
  const [soloNuevas, setSoloNuevas] = useState(false);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(false);
    listarNotificaciones()
      .then(({ data }) => setNotifs(data.notificaciones || []))
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function marcarComoLeida(id) {
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try { await marcarLeida(id); } catch { /* se reintenta al refrescar */ }
    refrescar();
  }

  async function marcarTodas() {
    setNotifs((p) => p.map((n) => ({ ...n, leida: true })));
    try { await marcarTodasLeidas(); } catch { /* se reintenta al refrescar */ }
    refrescar();
  }

  // DoD Sprint 5: la notificación lleva directamente al reporte en el mapa
  function abrir(notif, { soloLeer = false } = {}) {
    if (!notif.leida) marcarComoLeida(notif.id);
    if (!soloLeer && notif.reporte_id) navigate(`/mapa?reporte=${notif.reporte_id}`);
  }

  const filtro = PESTANAS.find((p) => p.id === pestana).filtro;
  const visibles = notifs.filter(filtro).filter((n) => !soloNuevas || !n.leida);
  const noLeidas = notifs.filter((n) => !n.leida).length;
  const grupos = ['Hoy', 'Ayer', 'Anteriores']
    .map((g) => ({ g, items: visibles.filter((n) => grupoDeFecha(n.created_at) === g) }))
    .filter((x) => x.items.length > 0);

  return (
    <div className="min-h-dvh pb-28 bg-warm-50 dark:bg-dark-800">

      <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-2 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-poppins font-bold text-[26px] leading-tight text-dark-900 dark:text-white">Alertas</h1>
          <p className="text-[14px] mt-0.5 text-gray-500 dark:text-white/50">
            {cargando ? 'Cargando…' : noLeidas > 0 ? `${noLeidas} sin leer` : 'Estás al día'}
          </p>
        </div>
        {noLeidas > 0 && (
          <button type="button" onClick={marcarTodas}
            className={`h-10 px-3.5 shrink-0 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-primary-700
                        dark:text-primary-400 bg-primary-50 dark:bg-white/10 hover:bg-primary-100 ${focoVisible}`}>
            <CheckCheck size={16} aria-hidden="true" /> Marcar todas
          </button>
        )}
      </header>

      {/* Sin ubicación compartida no llegan alertas de proximidad */}
      {usuario && usuario.alertas_activas === false && (
        <button type="button" onClick={() => navigate('/perfil')}
          className={`mx-4 mt-3 w-[calc(100%-2rem)] flex items-center gap-3 rounded-3xl p-4 text-left
                      bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 ${focoVisible}`}>
          <BellOff size={22} className="shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold text-dark-900 dark:text-white">Activa las alertas cerca de ti</span>
            <span className="block text-[13px] text-gray-600 dark:text-white/60">Comparte tu ubicación para saber de mascotas perdidas en tu barrio.</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
        </button>
      )}

      <div className="px-4 pt-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Tipo de alerta">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id} onClick={() => setPestana(p.id)}
            className={`shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${focoVisible}
                        ${pestana === p.id ? 'bg-primary-700 text-white'
                                           : 'bg-white text-dark-700 border border-warm-border dark:bg-white/5 dark:border-white/10 dark:text-white/80'}`}>
            {p.label}
          </button>
        ))}
        <button type="button" onClick={() => setSoloNuevas((v) => !v)} aria-pressed={soloNuevas}
          className={`shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold border transition-colors ${focoVisible}
                      ${soloNuevas ? 'bg-dark-900 text-white border-dark-900'
                                   : 'bg-white text-dark-700 border-warm-border dark:bg-white/5 dark:border-white/10 dark:text-white/80'}`}>
          Sin leer
        </button>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">
        {cargando && [0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-3xl bg-white dark:bg-white/5 border border-warm-border dark:border-white/10 animate-pulse" aria-hidden="true" />
        ))}

        {!cargando && error && (
          <div className="rounded-3xl p-5 flex flex-col items-start gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <p role="alert" className="text-[15px] text-red-700 dark:text-red-300">No se pudieron cargar tus alertas.</p>
            <button type="button" onClick={cargar}
              className={`h-10 px-4 rounded-full flex items-center gap-1.5 text-[14px] font-semibold text-primary-700 bg-primary-50 ${focoVisible}`}>
              <RotateCw size={16} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && visibles.length === 0 && (
          <div className="flex flex-col items-center text-center px-6 py-14">
            <span className="h-20 w-20 rounded-full bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-primary-400 flex items-center justify-center mb-4">
              <Bell size={36} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="font-poppins font-bold text-lg text-dark-900 dark:text-white">
              {notifs.length === 0 ? 'Aún no tienes alertas' : 'Nada por aquí'}
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-gray-500 dark:text-white/50 max-w-xs">
              {notifs.length === 0
                ? 'Te avisaremos cuando se pierda una mascota cerca de ti o cuando alguien vea a una de las tuyas.'
                : 'No hay alertas con este filtro.'}
            </p>
          </div>
        )}

        {!cargando && !error && grupos.map(({ g, items }) => (
          <section key={g} aria-label={g}>
            <h2 className="px-1 mb-2 text-[13px] font-semibold text-gray-500 dark:text-white/50">{g}</h2>
            <ul className="flex flex-col gap-2.5">
              {items.map((n) => <Alerta key={n.id} notif={n} onAbrir={abrir} />)}
            </ul>
          </section>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
