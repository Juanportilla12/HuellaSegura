import api from './api';

export function login(email, password, turnstileToken = '') {
  return api.post('/auth/login', { email, password, turnstileToken });
}

export function register({ nombre, email, celular, password }) {
  return api.post('/auth/register', { nombre, email, celular, password });
}

export function logout() {
  return api.post('/auth/logout');
}

export function getMe() {
  return api.get('/auth/me');
}

export function solicitarCodigoRecuperacion(email) {
  return api.post('/auth/forgot-password', { email });
}

export function verificarCodigoRecuperacion(email, codigo) {
  return api.post('/auth/verify-reset-code', { email, codigo });
}

export function restablecerPassword(email, codigo, nuevaPassword) {
  return api.post('/auth/reset-password', { email, codigo, nuevaPassword });
}
