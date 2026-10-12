import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { TILE_URL, TILE_ATTRIBUTION, CENTRO_PASTO } from '../config/mapa';

// Pin en forma de gota con un pulso suave alrededor del punto marcado
const PIN_SELECCION = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:40px;height:52px;">
      <span class="pin-pulso" style="position:absolute;left:8px;bottom:-4px;width:24px;height:10px;border-radius:50%;
                                     background:rgba(204,74,52,0.35);"></span>
      <svg width="40" height="52" viewBox="0 0 34 44" style="position:relative;filter:drop-shadow(0 4px 6px rgba(122,43,28,.35));">
        <path d="M17 43s15-14.2 15-26A15 15 0 0 0 2 17c0 11.8 15 26 15 26z" fill="#CC4A34" stroke="white" stroke-width="3"/>
        <circle cx="17" cy="17" r="5.5" fill="white"/>
      </svg>
    </div>`,
  iconSize: [40, 52],
  iconAnchor: [20, 52],
});

function ClickHandler({ onCoordsChange }) {
  useMapEvents({
    click(e) { onCoordsChange(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.lat && coords.lng) map.flyTo([coords.lat, coords.lng], 16, { duration: 0.9 });
  }, [coords, map]);
  return null;
}

export default function MapaSelector({ coords, onCoordsChange, address }) {
  const marcado = Boolean(coords.lat && coords.lng);
  return (
    <div data-testid="mapa-selector" className="w-full">
      <div className="relative">
        <MapContainer center={CENTRO_PASTO} zoom={14} zoomControl={false} className="mapa-suave"
                      style={{ height: '230px', width: '100%' }}>
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickHandler onCoordsChange={onCoordsChange} />
          <FlyTo coords={coords} />
          {marcado && <Marker position={[coords.lat, coords.lng]} icon={PIN_SELECCION} />}
        </MapContainer>
        {!marcado && (
          <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 z-[500] px-3 h-8 rounded-full
                           bg-dark-900/80 text-white text-[13px] font-medium flex items-center whitespace-nowrap">
            Toca el mapa para marcar el punto
          </span>
        )}
      </div>

      {address && (
        <div className="px-4 py-3 flex items-center gap-2 bg-primary-50/70 dark:bg-white/5 border-t border-warm-border dark:border-white/10"
             aria-live="polite">
          <MapPin size={16} className="shrink-0 text-primary-700 dark:text-primary-400" aria-hidden="true" />
          <span className="text-[13px] font-semibold truncate text-dark-900 dark:text-white">{address}</span>
        </div>
      )}
    </div>
  );
}
