import L from 'leaflet';
import { EMOJIS } from './filtrosMapa';

// Corrige las rutas de los íconos por defecto de Leaflet al empaquetar con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
});

// HU-13: pin de reporte con el emoji de la especie (resaltado si está seleccionado)
export function crearPinReporte(especie, seleccionado = false) {
  const emoji = EMOJIS[especie] || '🐾';
  const color = seleccionado ? '#00C4B4' : '#F97B62';
  const brillo = seleccionado
    ? '0 0 0 4px rgba(0,196,180,0.25), 0 6px 20px rgba(0,196,180,0.50)'
    : '0 0 0 3px rgba(249,123,98,0.20), 0 6px 20px rgba(249,123,98,0.50)';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:54px;height:64px;display:flex;flex-direction:column;align-items:center;">
        <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#FF9280,#F97B62);
          border:3px solid white;box-shadow:${brillo};display:flex;align-items:center;justify-content:center;
          font-size:24px;cursor:pointer;">${emoji}</div>
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
          border-top:10px solid ${color};margin-top:-2px;"></div>
      </div>`,
    iconSize: [54, 64],
    iconAnchor: [27, 64],
    popupAnchor: [0, -64],
  });
}

// HU-27 / DoD Sprint 7: entidades aliadas con ícono de corazón diferenciado
export const PIN_ENTIDAD = L.divIcon({
  className: '',
  html: `<div style="width:38px;height:38px;border-radius:50%;background:white;border:2px solid #EC4899;
           box-shadow:0 4px 14px rgba(236,72,153,0.45);display:flex;align-items:center;justify-content:center;
           font-size:18px;">❤️</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -18],
});
