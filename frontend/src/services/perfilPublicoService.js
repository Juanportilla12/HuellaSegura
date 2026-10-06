import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// HU-23: perfil público de la mascota (sin iniciar sesión, al escanear el QR)
export function obtenerPerfilPublico(mascotaId) {
  return api.get(`/publico/mascotas/${mascotaId}`);
}

// HU-29: enlace para redes sociales. Lo sirve el backend con etiquetas Open Graph
// (vista previa con foto y nombre) y redirige al perfil público.
export function urlCompartirMascota(mascotaId) {
  return `${API_URL}/publico/compartir/mascotas/${mascotaId}`;
}
