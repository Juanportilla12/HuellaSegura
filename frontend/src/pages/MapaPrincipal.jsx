import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from 'lucide-react';
import { TILE_URL, TILE_ATTRIBUTION, CENTRO_PASTO } from '../config/mapa';
import { useTokens } from '../hooks/useTokens';
import { useGeolocalizacion } from '../hooks/useGeolocalizacion';
import { listarReportesActivos } from '../services/reporteService';
import { listarEntidades } from '../services/entidadService';
import BottomNav from '../components/ui/BottomNav';
import BarraBusquedaMapa from '../components/mapa/BarraBusquedaMapa';
import FichaReporte from '../components/mapa/FichaReporte';
import PanelFiltrosMapa from '../components/mapa/PanelFiltrosMapa';
import { crearPinReporte, PIN_ENTIDAD } from '../components/mapa/pinesMapa';
import { filtrarReportes } from '../components/mapa/filtrosMapa';

// R10 / HU-10, HU-13 a HU-16: mapa de reportes activos y entidades aliadas

function CentrarMapa({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

function ClicEnMapa({ onClic }) {
  useMapEvents({ click: onClic });
  return null;
}

export default function MapaPrincipal() {
  const t = useTokens();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reporteParam = searchParams.get('reporte');
  const { coords: ubicacionUsuario, obtenerUbicacion } = useGeolocalizacion();

  const [reportes,  setReportes]  = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [filtros,   setFiltros]   = useState({ especie: 'todos', tiempo: 'todos' });
  const [texto,     setTexto]     = useState('');
  const [seleccion, setSeleccion] = useState(null);
  const [centrarEn, setCentrarEn] = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(false);

  useEffect(() => {
    listarReportesActivos().then(({ data }) => setReportes(data.reportes || [])).catch(() => {});
    listarEntidades()
      .then(({ data }) => setEntidades((data.entidades || []).filter((e) => e.latitud && e.longitud)))
      .catch(() => {});
  }, []);

  // Abre el reporte indicado en la URL (?reporte=ID), p. ej. desde una notificación
  useEffect(() => {
    if (!reporteParam || reportes.length === 0) return;
    const r = reportes.find((x) => String(x.id) === reporteParam);
    if (r) {
      setSeleccion(r);
      setCentrarEn({ lat: parseFloat(r.latitud), lng: parseFloat(r.longitud) });
    }
  }, [reporteParam, reportes]);

  // HU-16: al obtener la ubicación del dispositivo, el mapa se centra en ella
  useEffect(() => {
    if (ubicacionUsuario) setCentrarEn(ubicacionUsuario);
  }, [ubicacionUsuario]);

  function irAMiUbicacion() {
    if (ubicacionUsuario) setCentrarEn({ ...ubicacionUsuario });
    else obtenerUbicacion();
  }

  const visibles = filtrarReportes(reportes, { ...filtros, texto });
  const filtrosActivos = (filtros.especie !== 'todos' ? 1 : 0) + (filtros.tiempo !== 'todos' ? 1 : 0);
  const flotante = { background: t.navBg, backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.14)' };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <MapContainer center={CENTRO_PASTO} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <CentrarMapa coords={centrarEn} />
        <ClicEnMapa onClic={() => setSeleccion(null)} />

        {visibles.map((r) => (
          <Marker key={r.id} position={[parseFloat(r.latitud), parseFloat(r.longitud)]}
            icon={crearPinReporte(r.mascota?.especie, seleccion?.id === r.id)}
            eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); setSeleccion(r); } }} />
        ))}

        {entidades.map((e) => (
          <Marker key={`entidad-${e.id}`} position={[parseFloat(e.latitud), parseFloat(e.longitud)]} icon={PIN_ENTIDAD}>
            <Popup>
              <strong>{e.nombre}</strong><br />
              {e.direccion && <>{e.direccion}<br /></>}
              {e.horario && <>{e.horario}<br /></>}
              {e.telefono && <a href={`tel:${e.telefono}`}>{e.telefono}</a>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <BarraBusquedaMapa texto={texto} onTexto={setTexto} resultados={visibles.length}
        especie={filtros.especie} onEspecie={(especie) => setFiltros((f) => ({ ...f, especie }))}
        tiempoActivo={filtros.tiempo !== 'todos'} filtrosActivos={filtrosActivos}
        onAbrirFiltros={() => setPanelAbierto(true)} />

      <motion.button whileTap={{ scale: 0.92 }} onClick={irAMiUbicacion} aria-label="Centrar en mi ubicación"
        className="absolute right-4 z-[1000] h-12 w-12 rounded-2xl flex items-center justify-center"
        style={{ ...flotante, bottom: '6.5rem' }}>
        <Navigation size={19} style={{ color: t.primary }} />
      </motion.button>

      <div className="absolute left-4 z-[1000] flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold"
           style={{ ...flotante, color: visibles.length > 0 ? '#EF4444' : t.textMuted, bottom: '6.5rem' }}
           aria-live="polite">
        {visibles.length > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
        {visibles.length} {visibles.length === 1 ? 'reporte activo' : 'reportes activos'}
      </div>

      <AnimatePresence>
        {seleccion && (
          <FichaReporte reporte={seleccion} ubicacionUsuario={ubicacionUsuario}
            onCerrar={() => setSeleccion(null)}
            onVerDetalles={() => navigate(`/publico/mascotas/${seleccion.mascota?.codigo_publico}`)}
            onReportarAvistamiento={() => navigate(`/avistamientos/nuevo?mascota=${seleccion.mascota?.codigo_publico}`)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelAbierto && (
          <PanelFiltrosMapa reportes={reportes} inicial={filtros} texto={texto}
            onCerrar={() => setPanelAbierto(false)}
            onAplicar={(nuevos) => { setFiltros(nuevos); setPanelAbierto(false); }} />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
