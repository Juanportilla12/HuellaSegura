import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL, TILE_ATTRIBUTION, CENTRO_PASTO } from '../config/mapa';


// Pin con efecto radar/pulso
function crearPinRadar() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:72px;height:72px;display:flex;align-items:center;justify-content:center;">
        <!-- Anillos de radar -->
        <div style="
          position:absolute;width:72px;height:72px;border-radius:50%;
          background:rgba(249,123,98,0.15);
          animation:radar 1.8s ease-out infinite;
        "></div>
        <div style="
          position:absolute;width:52px;height:52px;border-radius:50%;
          background:rgba(249,123,98,0.20);
          animation:radar 1.8s ease-out 0.5s infinite;
        "></div>
        <!-- Pin central -->
        <div style="
          position:relative;z-index:2;
          width:44px;height:44px;border-radius:50%;
          background:linear-gradient(135deg,#FF9280,#F97B62);
          border:3px solid white;
          box-shadow:0 4px 16px rgba(249,123,98,0.55);
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
        ">🐾</div>
      </div>
      <style>
        @keyframes radar {
          0%   { transform:scale(0.4); opacity:0.8; }
          100% { transform:scale(1);   opacity:0;   }
        }
      </style>
    `,
    iconSize:   [72, 72],
    iconAnchor: [36, 36],
  });
}

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
  return (
    <div data-testid="mapa-selector" style={{ width: '100%' }}>
      <MapContainer
        center={CENTRO_PASTO}
        zoom={14}
        style={{ height: '220px', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ClickHandler onCoordsChange={onCoordsChange} />
        <FlyTo coords={coords} />
        {coords.lat && coords.lng && (
          <Marker position={[coords.lat, coords.lng]} icon={crearPinRadar()} />
        )}
      </MapContainer>

      {/* Dirección debajo del mapa */}
      {address && (
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: '#FFF0EA', borderTop: '1px solid #EDE5E1' }}
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F97B62' }}>
            📍 {address}
          </span>
        </div>
      )}
    </div>
  );
}
