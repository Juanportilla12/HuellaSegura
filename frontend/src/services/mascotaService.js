import api, { descargarArchivo } from './api';

export function listarMascotas() {
  return api.get('/mascotas');
}

export function obtenerMascota(id) {
  return api.get(`/mascotas/${id}`);
}

export function crearMascota(datos) {
  return api.post('/mascotas', datos);
}

export function actualizarMascota(id, datos) {
  return api.put(`/mascotas/${id}`, datos);
}

export function eliminarMascota(id) {
  return api.delete(`/mascotas/${id}`);
}

export function subirFotos(id, archivos) {
  const formData = new FormData();
  archivos.forEach((archivo) => formData.append('fotos', archivo));
  return api.post(`/mascotas/${id}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// R5: un video por mascota (MP4, WebM o MOV, máx. 30 MB)
export function subirVideo(id, archivo) {
  const formData = new FormData();
  formData.append('video', archivo);
  return api.post(`/mascotas/${id}/video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// HU-31: cartel A4 en PDF con foto, datos y QR
export function descargarCartel(id, nombre = 'mascota') {
  return descargarArchivo(`/mascotas/${id}/cartel-pdf`, `cartel-${nombre.replace(/\s+/g, '-')}.pdf`);
}
