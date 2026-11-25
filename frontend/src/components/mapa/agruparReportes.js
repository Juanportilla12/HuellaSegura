import { distanciaKm } from '../../utils/distancia';

// Reportes en el mismo punto (a menos de METROS entre sí) se agrupan en un solo pin con
// el número de mascotas; si no, quedan uno encima del otro y solo se ve una.
export const METROS_MISMO_PUNTO = 30;

export function agruparReportes(reportes, metros = METROS_MISMO_PUNTO) {
  const grupos = [];
  for (const r of reportes) {
    const lat = parseFloat(r.latitud);
    const lng = parseFloat(r.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const grupo = grupos.find((g) => distanciaKm(g.lat, g.lng, lat, lng) * 1000 <= metros);
    if (grupo) grupo.reportes.push(r);
    else grupos.push({ lat, lng, reportes: [r] });
  }
  // La clave depende de quiénes están en el grupo, para que React lo reconozca entre renders
  return grupos.map((g) => ({ ...g, clave: g.reportes.map((r) => r.id).join('-') }));
}
