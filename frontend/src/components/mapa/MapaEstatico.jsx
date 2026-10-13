import { TILE_URL } from '../../config/mapa';

const TILE = 256;

// Coordenadas globales en píxeles (proyección Web Mercator) para un zoom dado
function aPixeles(lat, lng, zoom) {
  const escala = TILE * 2 ** zoom;
  const x = ((lng + 180) / 360) * escala;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * escala;
  return { x, y };
}

// Mapa estático liviano: arma con teselas de OpenStreetMap una vista centrada en el punto,
// sin cargar Leaflet. Pensado para vistas previas que no necesitan interacción.
export default function MapaEstatico({ lat, lng, zoom = 16, alto = 160, ancho = 400, className = '' }) {
  const centro = aPixeles(lat, lng, zoom);
  const x0 = centro.x - ancho / 2;
  const y0 = centro.y - alto / 2;
  const tx0 = Math.floor(x0 / TILE), tx1 = Math.floor((x0 + ancho) / TILE);
  const ty0 = Math.floor(y0 / TILE), ty1 = Math.floor((y0 + alto) / TILE);

  const teselas = [];
  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      teselas.push({
        key: `${tx}-${ty}`,
        src: TILE_URL.replace('{z}', zoom).replace('{x}', tx).replace('{y}', ty),
        left: tx * TILE - x0,
        top: ty * TILE - y0,
      });
    }
  }

  return (
    <div className={`relative overflow-hidden bg-warm-100 ${className}`} style={{ height: alto }}>
      {/* El contenido se centra horizontalmente para cualquier ancho real del contenedor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mapa-suave-estatico" style={{ width: ancho, height: alto }}>
        {teselas.map((t) => (
          <img key={t.key} src={t.src} alt="" loading="lazy" draggable="false"
               className="absolute max-w-none select-none" style={{ left: t.left, top: t.top, width: TILE, height: TILE }} />
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" aria-hidden="true">
        <svg width="34" height="44" viewBox="0 0 34 44">
          <path d="M17 43s15-14.2 15-26A15 15 0 0 0 2 17c0 11.8 15 26 15 26z" fill="#CC4A34" stroke="white" strokeWidth="3" />
          <circle cx="17" cy="17" r="5.5" fill="white" />
        </svg>
      </div>
      <span className="absolute bottom-1 right-1.5 text-[10px] text-gray-600 bg-white/80 px-1 rounded">
        © OpenStreetMap
      </span>
    </div>
  );
}
