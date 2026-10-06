import api from './api';

export function actualizarPerfil(datos) {
  return api.put('/usuarios/perfil', datos);
}

export function actualizarFoto(archivo) {
  const formData = new FormData();
  formData.append('foto', archivo);
  return api.put('/usuarios/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function actualizarRadioAlerta(radio_alerta) {
  return api.put('/usuarios/radio-alerta', { radio_alerta });
}

// Consentimiento de ubicación para alertas por proximidad (R8/R9, Ley 1581)
export function actualizarUbicacion(latitud, longitud) {
  return api.put('/usuarios/ubicacion', { latitud, longitud });
}

export function desactivarUbicacion() {
  return api.delete('/usuarios/ubicacion');
}

export function eliminarCuenta(password) {
  return api.delete('/usuarios/cuenta', { data: { password } });
}
