import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence } from 'framer-motion';
import { LocateFixed } from 'lucide-react';
import { TILE_URL, TILE_ATTRIBUTION, CENTRO_PASTO } from '../config/mapa';
import { useGeolocalizacion } from '../hooks/useGeolocalizacion';
import { listarReportesActivos } from '../services/reporteService';
import { listarEntidades } from '../services/entidadService';
import BottomNav from '../components/ui/BottomNav';
import BarraBusquedaMapa from '../components/mapa/BarraBusquedaMapa';
import FichaReporte from '../components/mapa/FichaReporte';
import FichaEntidad from '../components/mapa/FichaEntidad';
import PanelFiltrosMapa from '../components/mapa/PanelFiltrosMapa';
import { crearPinReporte, PIN_ENTIDAD } from '../components/mapa/pinesMapa';
import { filtrarReportes } from '../components/mapa/filtrosMapa';
import { focoVisible } from '../components/auth/AuthUI';

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

const flotante = 'bg-white/95 dark:bg-dark-800/95 backdrop-blur-md shadow-[0_4px_16px_rgba(26,26,46,0.14)]';

export default function MapaPrincipal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reporteParam = searchParams.get('reporte');
  const { coords: ubicacionUsuario, obtenerUbicacion } = useGeolocalizacion();

  const [reportes,  setReportes]  = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [filtros,   setFiltros]   = useState({ especie: 'todos', tiempo: 'todos' });
  const [texto,     setTexto]     = useState('');
  const [seleccion, setSeleccion] = useState(null);
  const [entidadSel, setEntidadSel] = useState(null);
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

  const cerrarFichas  = useCallback(() => { setSeleccion(null); setEntidadSel(null); }, []);
  const cerrarFiltros = useCallback(() => setPanelAbierto(false), []);

  const visibles = filtrarReportes(reportes, { ...filtros, texto });
  const filtrosActivos = (filtros.especie !== 'todos' ? 1 : 0) + (filtros.tiempo !== 'todos' ? 1 : 0);
  const hayFicha = !!(seleccion || entidadSel);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-warm-100">
      <MapContainer center={CENTRO_PASTO} zoom={14} zoomControl={false} className="mapa-suave"
                    style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <CentrarMapa coords={centrarEn} />
        <ClicEnMapa onClic={cerrarFichas} />

        {entidades.map((e) => (
          <Marker key={`entidad-${e.id}`} position={[parseFloat(e.latitud), parseFloat(e.longitud)]} icon={PIN_ENTIDAD}
            title={e.nombre} alt={e.nombre}
            eventHandlers={{ click: (ev) => { ev.originalEvent.stopPropagation(); setSeleccion(null); setEntidadSel(e); } }} />
        ))}

        {visibles.map((r) => (
          <Marker key={r.id} position={[parseFloat(r.latitud), parseFloat(r.longitud)]}
            icon={crearPinReporte(r.mascota, seleccion?.id === r.id)}
            zIndexOffset={seleccion?.id === r.id ? 1000 : 0}
            title={r.mascota?.nombre ?? 'Mascota perdida'} alt={`Reporte: ${r.mascota?.nombre ?? 'mascota perdida'}`}
            eventHandlers={{ click: (ev) => { ev.originalEvent.stopPropagation(); setEntidadSel(null); setSeleccion(r); } }} />
        ))}
      </MapContainer>

      <BarraBusquedaMapa texto={texto} onTexto={setTexto} resultados={visibles.length}
        especie={filtros.especie} onEspecie={(especie) => setFiltros((f) => ({ ...f, especie }))}
        tiempoActivo={filtros.tiempo !== 'todos'} filtrosActivos={filtrosActivos}
        onAbrirFiltros={() => setPanelAbierto(true)} />

      {/* Contador y ubicación: se ocultan mientras hay una ficha abierta */}
      {!hayFicha && (
        <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] z-[1000]
                        flex items-end justify-between pointer-events-none">
          <p className={`pointer-events-auto flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-semibold
                         text-dark-900 dark:text-white ${flotante}`} aria-live="polite">
            <span className={`h-2 w-2 rounded-full ${visibles.length > 0 ? 'bg-primary-700' : 'bg-gray-400'}`} aria-hidden="true" />
            {visibles.length} {visibles.length === 1 ? 'mascota perdida' : 'mascotas perdidas'}
          </p>
          <button type="button" onClick={irAMiUbicacion} aria-label="Centrar en mi ubicación"
            className={`pointer-events-auto h-12 w-12 rounded-full flex items-center justify-center
                        text-primary-700 dark:text-primary-400 active:scale-95 transition-transform ${flotante} ${focoVisible}`}>
            <LocateFixed size={22} aria-hidden="true" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {seleccion && (
          <FichaReporte key={`r-${seleccion.id}`} reporte={seleccion} ubicacionUsuario={ubicacionUsuario}
            onCerrar={cerrarFichas}
            onVerDetalles={() => navigate(`/publico/mascotas/${seleccion.mascota?.codigo_publico}`)}
            onReportarAvistamiento={() => navigate(`/avistamientos/nuevo?mascota=${seleccion.mascota?.codigo_publico}`)} />
        )}
        {entidadSel && (
          <FichaEntidad key={`e-${entidadSel.id}`} entidad={entidadSel} onCerrar={cerrarFichas} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelAbierto && (
          <PanelFiltrosMapa reportes={reportes} inicial={filtros} texto={texto}
            onCerrar={cerrarFiltros}
            onAplicar={(nuevos) => { setFiltros(nuevos); setPanelAbierto(false); }} />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
