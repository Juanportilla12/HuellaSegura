import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// HU-23: perfil público de la mascota (sin iniciar sesión, al escanear el QR).
// Se identifica con su código público aleatorio, no con el id interno (Ley 1581).
export function obtenerPerfilPublico(codigoPublico) {
  return api.get(`/publico/mascotas/${codigoPublico}`);
}

export function urlPerfilPublico(codigoPublico) {
  return `${window.location.origin}/publico/mascotas/${codigoPublico}`;
}

// HU-29: enlace para redes sociales. Lo sirve el backend con etiquetas Open Graph
// (vista previa con foto y nombre) y redirige al perfil público.
export function urlCompartirMascota(codigoPublico) {
  return `${API_URL}/publico/compartir/mascotas/${codigoPublico}`;
}
