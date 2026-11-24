// Utilidades compartidas por las pruebas de navegador
export const API = process.env.E2E_API_URL || 'http://localhost:3001/api';

let contador = 0;
export function datosUsuario(prefijo = 'usuario') {
  contador += 1;
  const id = `${Date.now()}${contador}`;
  return {
    nombre: 'Ana Prueba',
    email: `${prefijo}.${id}@test.local`,
    celular: '300 123 4567',
    password: 'Clave-segura-123',
  };
}

// Registra un usuario por la API (más rápido que el formulario cuando no es lo que se prueba)
export async function registrarPorApi(request, datos = datosUsuario()) {
  const resp = await request.post(`${API}/auth/register`, { data: datos });
  if (!resp.ok()) throw new Error(`Registro falló: ${resp.status()} ${await resp.text()}`);
  const body = await resp.json();
  return { ...datos, token: body.token, usuario: body.usuario };
}

// Abre la app con la sesión ya iniciada y sin la pantalla de bienvenida
export async function entrarConSesion(page, cuenta) {
  await page.addInitScript(({ token, usuario }) => {
    localStorage.setItem('hs-bienvenida-vista', '1');
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }, { token: cuenta.token, usuario: cuenta.usuario });
}

export async function sinBienvenida(page) {
  await page.addInitScript(() => localStorage.setItem('hs-bienvenida-vista', '1'));
}

export async function crearMascotaPorApi(request, token, datos = {}) {
  const resp = await request.post(`${API}/mascotas`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { nombre: 'Luna', especie: 'perro', sexo: 'hembra', color: 'Café', ...datos },
  });
  if (!resp.ok()) throw new Error(`Crear mascota falló: ${resp.status()} ${await resp.text()}`);
  return (await resp.json()).mascota;
}

// Toca el centro del mapa de Leaflet para marcar una ubicación
export async function marcarEnMapa(page) {
  const mapa = page.getByTestId('mapa-selector').locator('.leaflet-container');
  await mapa.scrollIntoViewIfNeeded();
  const caja = await mapa.boundingBox();
  await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
}
