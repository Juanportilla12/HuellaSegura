// Geocodificación inversa con Nominatim (OpenStreetMap): coordenadas → dirección legible.
// Es un servicio público externo; si falla, se muestra un texto genérico.
export async function geocodificarReversa(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
    );
    const data = await res.json();
    const r = data.address || {};
    const barrio = r.neighbourhood || r.suburb || r.city_district || r.quarter || '';
    const calle = r.road || r.pedestrian || r.footway || '';
    return [calle, barrio].filter(Boolean).join(' · ').toUpperCase() || 'UBICACIÓN MARCADA';
  } catch {
    return 'UBICACIÓN MARCADA';
  }
}
