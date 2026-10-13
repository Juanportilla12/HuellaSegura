import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell, ChevronRight, ArrowRight, Megaphone, Eye, PawPrint, Stethoscope, QrCode, Dog, Cat, Bird, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotificaciones } from '../context/NotificacionesContext';
import BottomNav from '../components/ui/BottomNav';
import { focoVisible } from '../components/auth/AuthUI';
import { listarReportesActivos } from '../services/reporteService';
import fotoPerros from '../assets/home-perros.webp';

const ICONO_ESPECIE = { perro: Dog, gato: Cat, ave: Bird };

const ACCIONES = [
  { id: 'reportar',     icon: Megaphone,   label: 'Reportar',     to: '/reportes/nuevo' },
  { id: 'avistar',      icon: Eye,         label: 'Vi una',       to: '/avistamientos/nuevo' },
  { id: 'mis-mascotas', icon: PawPrint,    label: 'Mis mascotas', to: '/mascotas' },
  { id: 'directorio',   icon: Stethoscope, label: 'Veterinarias', to: '/directorio' },
];

const aparecer = (delay = 0) => ({
  initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1], delay },
});

// "Hoy", "Ayer" o "Hace N días" a partir de la fecha de pérdida (AAAA-MM-DD)
function haceCuanto(fecha) {
  if (!fecha) return '';
  const [a, m, d] = String(fecha).slice(0, 10).split('-').map(Number);
  const hoy = new Date();
  const dias = Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - new Date(a, m - 1, d)) / 864e5);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 30) return `Hace ${dias} días`;
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function TarjetaMascota({ reporte, onClick }) {
  const m = reporte.mascota ?? {};
  const Icono = ICONO_ESPECIE[m.especie] ?? PawPrint;
  return (
    <button type="button" onClick={onClick}
            className={`snap-start shrink-0 w-[152px] text-left rounded-3xl overflow-hidden bg-white dark:bg-white/5
                        border border-warm-border dark:border-white/10 shadow-card active:scale-[0.98] transition-transform ${focoVisible}`}>
      <div className="relative h-[132px] bg-primary-50 dark:bg-white/5 flex items-center justify-center">
        {m.foto_principal
          ? <img src={m.foto_principal} alt="" loading="lazy" className="h-full w-full object-cover" />
          : <Icono size={44} strokeWidth={1.5} className="text-primary-300" aria-hidden="true" />}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-700 text-white">
          Se busca
        </span>
      </div>
      <div className="p-3">
        <p className="font-poppins font-semibold text-[15px] leading-tight truncate text-dark-900 dark:text-white">
          {m.nombre ?? `Mascota #${reporte.mascota_id}`}
        </p>
        <p className="text-xs mt-0.5 truncate capitalize text-gray-500 dark:text-white/50">
          {m.raza || m.especie || 'Sin datos'}
        </p>
        <p className="text-xs mt-2 font-medium text-primary-700 dark:text-primary-400">
          {haceCuanto(reporte.fecha_perdida)}
        </p>
      </div>
    </button>
  );
}

function EsqueletoTarjeta() {
  return (
    <div className="shrink-0 w-[152px] rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
      <div className="h-[132px] bg-gray-100 dark:bg-white/5 animate-pulse" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 w-20 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
        <div className="h-3 w-16 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export default function Home() {
  const { usuario } = useAuth();
  const { noLeidas } = useNotificaciones();
  const navigate    = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarReportesActivos()
      .then(({ data }) => setReportes(data.reportes || []))
      .catch(() => setReportes([]))
      .finally(() => setCargando(false));
  }, []);

  const nombre = usuario?.nombre?.split(' ')[0] ?? 'vecino';
  const total  = reportes.length;

  function abrirReporte(r) {
    const codigo = r.mascota?.codigo_publico;
    navigate(codigo ? `/publico/mascotas/${codigo}` : '/mapa');
  }

  return (
    <div className="min-h-dvh w-full pb-28 bg-warm-50 dark:bg-dark-800">

      {/* ── Encabezado ──────────────────────────────────────────── */}
      <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-2 flex items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/perfil')} aria-label="Ir a mi perfil"
                className={`flex items-center gap-3 min-w-0 rounded-2xl -m-1 p-1 text-left ${focoVisible}`}>
          {usuario?.foto_url
            ? <img src={usuario.foto_url} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
            : <span className="h-11 w-11 rounded-full shrink-0 bg-primary-700 text-white font-poppins font-semibold
                               text-lg flex items-center justify-center" aria-hidden="true">
                {nombre.charAt(0).toUpperCase()}
              </span>}
          <span className="min-w-0">
            <span className="block text-[13px] text-gray-500 dark:text-white/50">Hola,</span>
            <span className="block font-poppins font-bold text-xl leading-tight truncate text-dark-900 dark:text-white">
              {nombre}
            </span>
          </span>
        </button>
        <button type="button" onClick={() => navigate('/alertas')}
                aria-label={noLeidas > 0 ? `Alertas, ${noLeidas} sin leer` : 'Alertas'}
                className={`relative h-11 w-11 shrink-0 rounded-full bg-white dark:bg-white/10 border border-warm-border
                            dark:border-white/10 flex items-center justify-center text-dark-900 dark:text-white ${focoVisible}`}>
          <Bell size={20} strokeWidth={2} aria-hidden="true" />
          {noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                             text-white bg-primary-700 ring-2 ring-warm-50 dark:ring-dark-800 flex items-center justify-center"
                  aria-hidden="true">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>
      </header>

      <div className="px-5 mt-4 flex flex-col gap-7">

        {/* ── Tarjeta principal: mascotas en búsqueda ─────────────── */}
        <motion.section {...aparecer()} aria-labelledby="titulo-busqueda"
          className="relative overflow-hidden rounded-[28px] bg-[#E8732F] min-h-[184px]
                     shadow-[0_14px_36px_rgba(232,115,47,0.35)]">
          {/* Foto de los perros a la derecha; se desvanece hacia el texto */}
          <img src={fotoPerros} alt="" aria-hidden="true"
               className="absolute right-0 inset-y-0 h-full w-[52%] object-cover object-[50%_35%]"
               style={{ maskImage: 'linear-gradient(to right, transparent, #000 40%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 40%)' }} />
          <div className="relative p-5 pr-[42%] flex flex-col h-full min-h-[184px]">
            <p className="text-[13px] font-semibold text-white/90 flex items-center gap-1">
              <MapPin size={14} aria-hidden="true" /> Pasto
            </p>
            <h1 id="titulo-busqueda" className="mt-1 font-poppins font-bold text-white text-xl leading-tight">
              {cargando
                ? 'Buscando reportes…'
                : total === 0
                  ? 'Todas a salvo'
                  : `${total} ${total === 1 ? 'mascota te necesita' : 'mascotas te necesitan'}`}
            </h1>
            <p className="text-sm mt-1 text-white/90">
              {total === 0 && !cargando ? 'No hay mascotas perdidas ahora.' : 'Están perdidas. ¿Las has visto?'}
            </p>
            <button type="button" onClick={() => navigate('/mapa')}
                    className={`mt-auto self-start inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white
                                text-[14px] font-semibold text-primary-800 active:scale-95 transition-transform ${focoVisible}`}>
              Ver en el mapa <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </motion.section>

        {/* ── Accesos rápidos ─────────────────────────────────────── */}
        <motion.nav {...aparecer(0.06)} aria-label="Accesos rápidos" className="grid grid-cols-4 gap-2">
          {ACCIONES.map(({ id, icon: Icon, label, to }) => (
            <button key={id} type="button" onClick={() => navigate(to)}
                    className={`flex flex-col items-center gap-2 rounded-2xl py-1 group ${focoVisible}`}>
              <span className="h-14 w-14 rounded-2xl bg-white dark:bg-white/5 border border-warm-border dark:border-white/10
                               shadow-card flex items-center justify-center text-primary-700 dark:text-primary-400
                               group-active:scale-95 transition-transform">
                <Icon size={24} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-center leading-tight text-dark-700 dark:text-white/80">
                {label}
              </span>
            </button>
          ))}
        </motion.nav>

        {/* ── Se buscan ───────────────────────────────────────────── */}
        <motion.section {...aparecer(0.12)} aria-labelledby="titulo-se-buscan">
          <div className="flex items-center justify-between mb-3">
            <h2 id="titulo-se-buscan" className="font-poppins font-bold text-lg text-dark-900 dark:text-white">
              Se buscan
            </h2>
            {total > 0 && (
              <button type="button" onClick={() => navigate('/mapa')}
                      className={`-mr-2 px-2 py-1.5 rounded-lg text-[13px] font-semibold text-primary-700
                                  dark:text-primary-400 flex items-center gap-0.5 ${focoVisible}`}>
                Ver todas <ChevronRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {cargando ? (
            <div className="flex gap-3 -mx-5 px-5 overflow-hidden" aria-hidden="true">
              <EsqueletoTarjeta /><EsqueletoTarjeta /><EsqueletoTarjeta />
            </div>
          ) : total > 0 ? (
            <div className="flex gap-3 -mx-5 px-5 pb-2 overflow-x-auto snap-x snap-mandatory scroll-px-5
                            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {reportes.slice(0, 10).map(r => (
                <TarjetaMascota key={r.id} reporte={r} onClick={() => abrirReporte(r)} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl p-6 flex items-center gap-4 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
              <span className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600
                               flex items-center justify-center">
                <PawPrint size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="font-poppins font-semibold text-dark-900 dark:text-white">Todo tranquilo por aquí</p>
                <p className="text-sm mt-0.5 text-gray-500 dark:text-white/50">No hay mascotas perdidas reportadas.</p>
              </div>
            </div>
          )}
        </motion.section>

        {/* ── Prevención: carnet QR ───────────────────────────────── */}
        <motion.button {...aparecer(0.18)} type="button" onClick={() => navigate('/mascotas')}
          className={`w-full flex items-center gap-4 rounded-3xl p-4 text-left bg-white dark:bg-white/5
                      border border-warm-border dark:border-white/10 shadow-card active:scale-[0.99] transition-transform ${focoVisible}`}>
          <span className="h-12 w-12 shrink-0 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-700
                           dark:text-primary-400 flex items-center justify-center">
            <QrCode size={24} aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-poppins font-semibold text-[15px] text-dark-900 dark:text-white">
              Protege a tu mascota
            </span>
            <span className="block text-[13px] mt-0.5 text-gray-500 dark:text-white/50">
              Crea su carnet con QR para que la encuentren rápido.
            </span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-gray-400" aria-hidden="true" />
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
}
