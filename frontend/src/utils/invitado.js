// Modo invitado: quien elige "Explorar como invitado" puede ver el inicio, el mapa
// y el directorio sin cuenta. Dura lo que la pestaña o la app abierta (sessionStorage).
const CLAVE = 'hs-invitado';

export function esInvitado() {
  try { return sessionStorage.getItem(CLAVE) === '1'; } catch { return false; }
}

export function entrarComoInvitado() {
  try { sessionStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento: se pedirá iniciar sesión */ }
}

export function salirDeInvitado() {
  try { sessionStorage.removeItem(CLAVE); } catch { /* nada que limpiar */ }
}
