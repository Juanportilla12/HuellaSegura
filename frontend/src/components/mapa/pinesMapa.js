import L from 'leaflet';
import { HUELLA_MARCADO } from '../ui/huella';

// Corrige las rutas de los íconos por defecto de Leaflet al empaquetar con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
});

const NARANJA = '#CC4A34';
const NARANJA_SEL = '#A83B28';

// La URL de la foto la sube el usuario: se escapa antes de insertarla en el HTML del pin
const escaparAtributo = (texto) =>
  String(texto).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const HUELLA_SVG = `<svg viewBox="0 0 100 100" width="22" height="22" fill="white" aria-hidden="true">${HUELLA_MARCADO}</svg>`;

// HU-13: pin de reporte en forma de gota con la foto de la mascota (o una huella si no tiene foto)
export function crearPinReporte(mascota, seleccionado = false) {
  const tam   = seleccionado ? 56 : 46;
  const borde = seleccionado ? NARANJA_SEL : NARANJA;
  const foto  = mascota?.foto_principal;
  const interior = foto
    ? `<img src="${escaparAtributo(foto)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : HUELLA_SVG;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${tam}px;height:${tam + 10}px;display:flex;flex-direction:column;align-items:center;
                  transition:transform .2s;filter:drop-shadow(0 6px 10px rgba(122,43,28,${seleccionado ? 0.45 : 0.3}));">
        <div style="width:${tam}px;height:${tam}px;border-radius:50%;background:${borde};padding:3px;box-sizing:border-box;">
          <div style="width:100%;height:100%;border-radius:50%;border:2px solid white;box-sizing:border-box;overflow:hidden;
                      background:${borde};display:flex;align-items:center;justify-content:center;">${interior}</div>
        </div>
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
                    border-top:10px solid ${borde};margin-top:-2px;"></div>
      </div>`,
    iconSize: [tam, tam + 10],
    iconAnchor: [tam / 2, tam + 10],
  });
}

// HU-27 / DoD Sprint 7: entidades aliadas (veterinarias, albergues) con pin verde y cruz
export const PIN_ENTIDAD = L.divIcon({
  className: '',
  html: `
    <div style="width:36px;height:36px;border-radius:12px;background:white;border:2px solid #059669;
                box-shadow:0 4px 12px rgba(5,150,105,0.35);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round"
           aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
