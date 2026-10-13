// La bienvenida (Splash) se muestra una sola vez por dispositivo
const CLAVE = 'hs-bienvenida-vista';

export function bienvenidaVista() {
  try { return localStorage.getItem(CLAVE) === '1'; } catch { return true; }
}

export function marcarBienvenidaVista() {
  try { localStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento: se mostrará de nuevo */ }
}
