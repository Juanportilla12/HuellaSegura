import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Clock, X, Eye,
  ChevronRight, MapPin, Navigation, Check,
} from 'lucide-react';
import BottomNav from '../components/ui/BottomNav';
import { listarReportesActivos } from '../services/reporteService';
import { useGeolocalizacion } from '../hooks/useGeolocalizacion';

// ─── Fix iconos Leaflet con Vite ─────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
});

const CENTRO_PASTO = [1.2136, -77.2811];
const EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };

// ─── Opciones de filtro ───────────────────────────────────────────────────────
const FILTRO_ESPECIE = [
  { id: 'todos',  label: 'Todos',    emoji: '🐾' },
  { id: 'perro',  label: 'Perros',   emoji: '🐕' },
  { id: 'gato',   label: 'Gatos',    emoji: '🐈' },
  { id: 'ave',    label: 'Aves',     emoji: '🐦' },
  { id: 'reptil', label: 'Reptiles', emoji: '🦎' },
];

const FILTRO_TIEMPO = [
  { id: 'todos',   label: 'Cualquier fecha'  },
  { id: '1h',      label: 'Última 1 hora'    },
  { id: '24h',     label: 'Últimas 24 horas' },
  { id: '7d',      label: 'Última semana'    },
];

// ─── Pin circular personalizado ───────────────────────────────────────────────
function crearPin(especie, isSelected = false) {
  const emoji  = EMOJIS[especie] || '🐾';
  const color  = isSelected ? '#00C4B4' : '#F97B62';
  const glow   = isSelected
    ? '0 0 0 4px rgba(0,196,180,0.25), 0 6px 20px rgba(0,196,180,0.50)'
    : '0 0 0 3px rgba(249,123,98,0.20), 0 6px 20px rgba(249,123,98,0.50)';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:54px;height:64px;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:54px;height:54px;border-radius:50%;
          background:linear-gradient(135deg,#FF9280,#F97B62);
          border:3px solid white;
          box-shadow:${glow};
          display:flex;align-items:center;justify-content:center;
          font-size:24px;cursor:pointer;
          transition:transform 0.2s;
        ">${emoji}</div>
        <div style="
          width:0;height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:10px solid ${color};
          margin-top:-2px;
        "></div>
      </div>`,
    iconSize:    [54, 64],
    iconAnchor:  [27, 64],
    popupAnchor: [0, -64],
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CentrarMapa({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: onMapClick });
  return null;
}

function tiempoTranscurrido(fecha) {
  if (!fecha) return '?';
  const mins = Math.floor((Date.now() - new Date(fecha)) / 60000);
  if (mins < 60)  return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function dentroDeRango(fecha, rango) {
  if (!fecha || rango === 'todos') return true;
  const mins = Math.floor((Date.now() - new Date(fecha)) / 60000);
  if (rango === '1h')  return mins <= 60;
  if (rango === '24h') return mins <= 1440;
  if (rango === '7d')  return mins <= 10080;
  return true;
}

// ─── Chip de filtro rápido ────────────────────────────────────────────────────
function FiltroChip({ activo, onClick, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-150"
      style={activo
        ? { background: '#1A1A2E', color: 'white', boxShadow: '0 4px 12px rgba(26,26,46,0.35)' }
        : { background: 'rgba(255,255,255,0.95)', color: '#6B7280', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
    >
      {children}
    </motion.button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MapaPrincipal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reporteParam = searchParams.get('reporte');
  const { coords: userCoords, obtenerUbicacion } = useGeolocalizacion();

  const [reportes,    setReportes]    = useState([]);
  const [filtroEsp,   setFiltroEsp]   = useState('todos');
  const [filtroTmp,   setFiltroTmp]   = useState('todos');
  const [selected,    setSelected]    = useState(null);
  const [centrarEn,   setCentrarEn]   = useState(null);
  const [busqueda,    setBusqueda]    = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  // Copias temporales para el panel
  const [tmpEsp, setTmpEsp] = useState('todos');
  const [tmpTmp, setTmpTmp] = useState('todos');

  useEffect(() => {
    listarReportesActivos()
      .then(({ data }) => setReportes(data.reportes || []))
      .catch(() => {});
  }, []);

  // Abre el reporte indicado en la URL (?reporte=ID), p. ej. desde una notificación
  useEffect(() => {
    if (!reporteParam || reportes.length === 0) return;
    const r = reportes.find((x) => String(x.id) === reporteParam);
    if (r) {
      setSelected(r);
      setCentrarEn({ lat: r.latitud, lng: r.longitud });
    }
  }, [reporteParam, reportes]);

  const filtrados = reportes.filter(r => {
    if (filtroEsp !== 'todos' && r.mascota?.especie !== filtroEsp) return false;
    if (!dentroDeRango(r.created_at, filtroTmp)) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const nombre = (r.mascota?.nombre || '').toLowerCase();
      const raza   = (r.mascota?.raza   || '').toLowerCase();
      if (!nombre.includes(q) && !raza.includes(q)) return false;
    }
    return true;
  });

  const handleMiUbicacion = useCallback(() => {
    obtenerUbicacion();
    if (userCoords) setCentrarEn(userCoords);
  }, [obtenerUbicacion, userCoords]);

  useEffect(() => {
    if (userCoords) setCentrarEn(userCoords);
  }, [userCoords]);

  function abrirFiltros() {
    setTmpEsp(filtroEsp);
    setTmpTmp(filtroTmp);
    setShowFiltros(true);
  }

  function aplicarFiltros() {
    setFiltroEsp(tmpEsp);
    setFiltroTmp(tmpTmp);
    setShowFiltros(false);
  }

  function limpiarFiltros() {
    setTmpEsp('todos'); setTmpTmp('todos');
  }

  const filtrosActivos = (filtroEsp !== 'todos' ? 1 : 0) + (filtroTmp !== 'todos' ? 1 : 0);

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* ── Mapa full-screen ────────────────────────────────────────────── */}
      <MapContainer
        center={CENTRO_PASTO}
        zoom={14}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        {/* ── Tiles: CartoDB Voyager — colorido y moderno ── */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        <CentrarMapa coords={centrarEn} />
        <MapClickHandler onMapClick={() => setSelected(null)} />

        {filtrados.map(r => (
          <Marker
            key={r.id}
            position={[parseFloat(r.latitud), parseFloat(r.longitud)]}
            icon={crearPin(r.mascota?.especie, selected?.id === r.id)}
            eventHandlers={{ click: e => { e.originalEvent.stopPropagation(); setSelected(r); } }}
          />
        ))}
      </MapContainer>

      {/* ── Barra de búsqueda + filtros ─────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-[1000] pt-safe pt-3 px-4 flex flex-col gap-2.5 pointer-events-none">

        {/* Búsqueda + botón filtros */}
        <div className="flex gap-2 pointer-events-auto">
          <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3"
               style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            <Search size={17} style={{ color: '#9CA3AF' }} className="shrink-0" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar mascota o barrio…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#1A1A2E' }}
            />
            {busqueda.trim() && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: '#FFF0EA', color: '#F97B62' }}>
                {filtrados.length}
              </span>
            )}
          </div>

          {/* Botón filtros — CON onClick */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={abrirFiltros}
            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 relative"
            style={{
              background: filtrosActivos > 0
                ? 'linear-gradient(135deg,#FF9280,#F97B62)'
                : 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(12px)',
              boxShadow: filtrosActivos > 0
                ? '0 6px 20px rgba(249,123,98,0.50)'
                : '0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            <SlidersHorizontal size={18}
              color={filtrosActivos > 0 ? 'white' : '#F97B62'} strokeWidth={2} />
            {filtrosActivos > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full text-[10px]
                               font-bold text-white flex items-center justify-center"
                    style={{ background: '#1A1A2E' }}>
                {filtrosActivos}
              </span>
            )}
          </motion.button>
        </div>

        {/* Chips de especie rápidos */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
          {FILTRO_ESPECIE.slice(0,4).map(f => (
            <FiltroChip key={f.id} activo={filtroEsp === f.id} onClick={() => setFiltroEsp(f.id)}>
              {f.emoji} {f.label}
            </FiltroChip>
          ))}
          <FiltroChip activo={filtroTmp !== 'todos'} onClick={abrirFiltros}>
            <Clock size={13} className="inline mr-1" />
            Tiempo
          </FiltroChip>
        </div>
      </div>

      {/* ── Botón mi ubicación ───────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleMiUbicacion}
        className="absolute right-4 z-[1000] h-12 w-12 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          bottom: '6.5rem',
        }}
      >
        <Navigation size={19} style={{ color: '#F97B62' }} />
      </motion.button>

      {/* ── Contador ─────────────────────────────────────────────────────── */}
      <div
        className="absolute left-4 z-[1000] flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          color: filtrados.length > 0 ? '#EF4444' : '#9CA3AF',
          bottom: '6.5rem',
        }}
      >
        {filtrados.length > 0 && (
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        )}
        {filtrados.length} {filtrados.length === 1 ? 'reporte activo' : 'reportes activos'}
      </div>

      {/* ── Bottom sheet — detalle mascota ───────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="absolute bottom-0 inset-x-0 z-[1500] rounded-t-[2rem] overflow-hidden"
            style={{
              background: 'white',
              boxShadow: '0 -12px 50px rgba(0,0,0,0.18)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center pt-3 pb-2 relative">
              <div className="h-1 w-10 rounded-full" style={{ background: '#EDE5E1' }} />
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setSelected(null)}
                className="absolute right-4 h-8 w-8 rounded-full flex items-center justify-center"
                style={{ background: '#F5F5F5' }}>
                <X size={15} style={{ color: '#9CA3AF' }} />
              </motion.button>
            </div>

            <div className="px-5 pb-2">
              <div className="flex gap-4 items-start mb-4">
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-3xl flex items-center justify-center text-4xl overflow-hidden"
                       style={{ background: 'linear-gradient(135deg,#FFD0BF,#F97B62)',
                                boxShadow: '0 6px 20px rgba(249,123,98,0.40)' }}>
                    {selected.mascota?.foto_principal
                      ? <img src={selected.mascota.foto_principal} alt="" className="w-full h-full object-cover" />
                      : EMOJIS[selected.mascota?.especie] || '🐾'}
                  </div>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-bold text-white
                               px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: 'linear-gradient(135deg,#FF4444,#CC0000)',
                             fontSize: '0.58rem', boxShadow: '0 2px 8px rgba(204,0,0,0.45)' }}>
                    🆘 SOS
                  </motion.span>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="font-poppins font-extrabold text-xl leading-tight" style={{ color: '#1A1A2E' }}>
                    {selected.mascota?.nombre ?? `Mascota #${selected.mascota_id}`}
                  </h3>
                  <p className="text-sm mt-0.5 capitalize" style={{ color: '#9CA3AF' }}>
                    {[selected.mascota?.especie, selected.mascota?.raza, selected.mascota?.sexo]
                      .filter(Boolean).join(' · ')}
                  </p>
                  <div className="flex gap-2 mt-2.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: '#FFF0EA', color: '#F97B62' }}>
                      <Clock size={11} /> {tiempoTranscurrido(selected.created_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: '#E0F9F7', color: '#00C4B4' }}>
                      <MapPin size={11} /> Cerca de ti
                    </span>
                  </div>
                </div>
              </div>

              {selected.descripcion && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
                  className="flex items-start gap-3 p-3.5 rounded-2xl mb-4"
                  style={{ background: 'linear-gradient(135deg,#FFFBEB,#FFF8E0)' }}>
                  <span className="text-lg shrink-0">🔔</span>
                  <p className="text-sm leading-snug font-medium" style={{ color: '#92400E' }}>
                    {selected.descripcion}
                  </p>
                </motion.div>
              )}

              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/publico/mascotas/${selected.mascota_id}`)}
                  className="flex-1 flex items-center justify-center gap-2 h-14 rounded-3xl
                             font-poppins font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)',
                           boxShadow: '0 6px 20px rgba(249,123,98,0.45)' }}>
                  Ver detalles <ChevronRight size={16} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(`/avistamientos/nuevo?mascota_id=${selected.mascota_id}`)}
                  className="h-14 w-14 rounded-3xl flex items-center justify-center shrink-0"
                  style={{ background: '#E0F9F7', boxShadow: '0 4px 14px rgba(0,196,180,0.30)' }}>
                  <Eye size={22} style={{ color: '#00C4B4' }} strokeWidth={2} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panel de filtros ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFiltros && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2000]"
              style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowFiltros(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="absolute bottom-0 inset-x-0 z-[2100] rounded-t-[2rem] px-5 pt-4 pb-10"
              style={{ background: 'white', boxShadow: '0 -8px 40px rgba(0,0,0,0.20)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="h-1 w-10 rounded-full" style={{ background: '#EDE5E1' }} />
              </div>

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-poppins font-bold text-xl" style={{ color: '#1A1A2E' }}>
                  Filtrar mapa
                </h2>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowFiltros(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ background: '#F5F5F5' }}>
                  <X size={16} style={{ color: '#9CA3AF' }} />
                </motion.button>
              </div>

              {/* Especie */}
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                 style={{ color: '#9CA3AF' }}>Tipo de animal</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {FILTRO_ESPECIE.map(f => (
                  <motion.button key={f.id} whileTap={{ scale: 0.95 }}
                    onClick={() => setTmpEsp(f.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                    style={tmpEsp === f.id
                      ? { background: 'linear-gradient(135deg,#FF9280,#F97B62)', color: 'white',
                          boxShadow: '0 4px 12px rgba(249,123,98,0.40)' }
                      : { background: '#FFF8F5', color: '#6B7280', border: '1.5px solid #EDE5E1' }}>
                    {tmpEsp === f.id && <Check size={13} />}
                    {f.emoji} {f.label}
                  </motion.button>
                ))}
              </div>

              {/* Tiempo */}
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                 style={{ color: '#9CA3AF' }}>Tiempo del reporte</p>
              <div className="flex flex-col gap-2 mb-6">
                {FILTRO_TIEMPO.map(t => (
                  <motion.button key={t.id} whileTap={{ scale: 0.98 }}
                    onClick={() => setTmpTmp(t.id)}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                    style={tmpTmp === t.id
                      ? { background: '#FFF0EA', color: '#F97B62', border: '1.5px solid #F97B62' }
                      : { background: '#FFF8F5', color: '#6B7280', border: '1.5px solid #EDE5E1' }}>
                    <span>{t.label}</span>
                    {tmpTmp === t.id && <Check size={15} style={{ color: '#F97B62' }} />}
                  </motion.button>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={limpiarFiltros}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                  style={{ background: '#F5F5F5', color: '#9CA3AF' }}>
                  Limpiar
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={aplicarFiltros}
                  className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)',
                           boxShadow: '0 6px 20px rgba(249,123,98,0.45)' }}>
                  Ver {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
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
