import { distanciaKm } from '../../utils/distancia';

// Reportes en el mismo punto (a menos de METROS_MISMO_PUNTO) siempre van juntos: si no,
// quedarían uno encima del otro y solo se vería una mascota.
export const METROS_MISMO_PUNTO = 30;

// Además, con el mapa alejado, pines a pocos metros se tapan en pantalla. Se agrupan los
// que quedarían a menos de PIXELES_SEPARACION entre sí con el zoom actual; al acercar el
// mapa los grupos se separan solos.
export const PIXELES_SEPARACION = 44;

// Metros que representa un píxel en el mapa (proyección Web Mercator de OpenStreetMap)
export function metrosPorPixel(zoom, lat) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

export function distanciaDeAgrupacion(zoom, lat) {
  if (!Number.isFinite(zoom)) return METROS_MISMO_PUNTO;
  return Math.max(METROS_MISMO_PUNTO, PIXELES_SEPARACION * metrosPorPixel(zoom, lat));
}

export function agruparReportes(reportes, { zoom, metros } = {}) {
  const grupos = [];
  for (const r of reportes) {
    const lat = parseFloat(r.latitud);
    const lng = parseFloat(r.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const limite = metros ?? distanciaDeAgrupacion(zoom, lat);
    const grupo = grupos.find((g) => distanciaKm(g.lat, g.lng, lat, lng) * 1000 <= limite);
    if (grupo) grupo.reportes.push(r);
    else grupos.push({ lat, lng, reportes: [r] });
  }
  return grupos.map((g) => ({
    ...g,
    // La clave depende de quiénes están en el grupo, para que React lo reconozca entre renders
    clave: g.reportes.map((r) => r.id).join('-'),
    // ¿Todas en el mismo lugar exacto, o en una zona que se separa al acercar el mapa?
    mismoPunto: g.reportes.every((r) =>
      distanciaKm(g.lat, g.lng, parseFloat(r.latitud), parseFloat(r.longitud)) * 1000 <= METROS_MISMO_PUNTO),
  }));
}
