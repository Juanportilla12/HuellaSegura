import { createRequire } from 'node:module';
const requireBackend = createRequire(new URL('../../backend/package.json', import.meta.url));
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

// El código de verificación real llega por correo. En la base de datos de PRUEBA se fija
// uno conocido (su hash) para poder escribirlo, como haría el usuario con el que le llegó.
export const CODIGO_PRUEBA = '123456';
export async function fijarCodigoVerificacion(email, codigo = CODIGO_PRUEBA) {
  const bcrypt = requireBackend('bcryptjs');
  await consultarBD('UPDATE usuarios SET verificacion_code = ?, verificacion_intentos = 0 WHERE email = ?',
    [await bcrypt.hash(codigo, 10), email]);
}

// Registra un usuario por la API y verifica su correo (más rápido que el formulario cuando
// no es lo que se prueba). Devuelve la sesión ya iniciada.
export async function registrarPorApi(request, datos = datosUsuario()) {
  const resp = await request.post(`${API}/auth/register`, { data: datos });
  if (!resp.ok()) throw new Error(`Registro falló: ${resp.status()} ${await resp.text()}`);
  await fijarCodigoVerificacion(datos.email);
  const verif = await request.post(`${API}/auth/verificar-correo`, { data: { email: datos.email, codigo: CODIGO_PRUEBA } });
  if (!verif.ok()) throw new Error(`Verificación falló: ${verif.status()} ${await verif.text()}`);
  const body = await verif.json();
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

// Consulta directa a la base de datos de PRUEBA (variables de backend/.env). Sirve para
// preparar datos que no se pueden crear por la API en local (p. ej. fotos en Cloudinary).
export async function consultarBD(sql, parametros = []) {
  requireBackend('dotenv').config({ path: new URL('../../backend/.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
  const mysql = requireBackend('mysql2/promise');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  try {
    const [resultado] = await db.query(sql, parametros);
    return resultado;
  } finally {
    await db.end();
  }
}

export async function crearReportePorApi(request, token, mascotaId, coords = { latitud: 1.2136, longitud: -77.2811 }) {
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const resp = await request.post(`${API}/reportes`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { mascota_id: mascotaId, ...coords, fecha_perdida: hoy },
  });
  if (!resp.ok()) throw new Error(`Crear reporte falló: ${resp.status()} ${await resp.text()}`);
  return (await resp.json()).reporte;
}
