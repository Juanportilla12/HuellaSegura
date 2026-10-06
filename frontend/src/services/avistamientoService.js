import api from './api';

export function crearAvistamiento(datos, foto = null) {
  const formData = new FormData();
  Object.entries(datos).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v); });
  if (foto) formData.append('foto', foto);
  return api.post('/avistamientos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}
