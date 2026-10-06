import api from './api';

export function listarNotificaciones() {
  return api.get('/notificaciones');
}

export function marcarLeida(id) {
  return api.put(`/notificaciones/${id}/leer`);
}

export function marcarTodasLeidas() {
  return api.put('/notificaciones/leer-todas');
}
