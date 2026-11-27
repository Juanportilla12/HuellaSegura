/**
 * Prueba de extremo a extremo: recorre los flujos principales de la tesis
 * contra el backend en ejecución y una base de datos MySQL real.
 *
 * Uso (con el backend corriendo y migraciones aplicadas):
 *   E2E_API_URL=http://localhost:3001/api npm run test:e2e
 * Usa las variables DB_* del entorno (o de backend/.env) para verificar la BD.
 * Crea datos de prueba con correos @test.local. NO ejecutar contra producción.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const API = process.env.E2E_API_URL || 'http://localhost:3001/api';
const BASE = API.replace(/\/api\/?$/, '');
const resultados = [];
const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});
const sql = async (q) => {
  const [filas] = await db.query(q);
  if (!Array.isArray(filas) || filas.length === 0) return '';
  return String(Object.values(filas[0])[0]);
};

function check(nombre, ok, detalle = '') {
  resultados.push({ nombre, ok, detalle });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
}

async function req(metodo, ruta, { token, body, raw } = {}) {
  const r = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return r;
  let data = null; try { data = await r.json(); } catch { /* respuesta sin JSON */ }
  return { status: r.status, data };
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const sufijo = Date.now();
const dueno  = { nombre: 'Ana María Pérez', email: `ana${sufijo}@test.local`, celular: '3001234567', password: 'clave1234' };
const vecino = { nombre: 'Leo Vecino', email: `leo${sufijo}@test.local`, celular: '3109876543', password: 'clave1234' };
const admin  = { nombre: 'Admin Prueba', email: `admin${sufijo}@test.local`, celular: '3000000000', password: 'clave1234' };

// Salud y conexión
let r = await fetch(`${BASE}/health`); check('Health check', r.status === 200);

// R1 / HU-01
r = await req('POST', '/auth/register', { body: { ...dueno, password: '1234567' } });
check('HU-01 contraseña de 7 caracteres rechazada', r.status === 400);
r = await req('POST', '/auth/register', { body: { ...dueno, celular: undefined } });
check('R1 celular obligatorio', r.status === 400);
r = await req('POST', '/auth/register', { body: dueno });
check('R1 registro queda pendiente de verificar el correo (sin sesión)', r.status === 201 && r.data.requiereVerificacion === true && !r.data.token);
check('R1 celular guardado', await sql(`SELECT celular FROM usuarios WHERE email='${dueno.email}'`) === dueno.celular);
check('Seguridad: la cuenta nueva no está verificada', await sql(`SELECT email_verificado FROM usuarios WHERE email='${dueno.email}'`) === '0');
check('Seguridad: el código de verificación se guarda cifrado', (await sql(`SELECT verificacion_code FROM usuarios WHERE email='${dueno.email}'`)).startsWith('$2'));
r = await req('POST', '/auth/login', { body: { email: dueno.email, password: dueno.password } });
check('Seguridad: sin verificar el correo no se puede iniciar sesión', r.status === 403 && r.data.codigo === 'CORREO_NO_VERIFICADO' && !r.data.token);

// El código real llega por correo; aquí se fija uno conocido en la base de datos de prueba
async function verificarCuenta(email) {
  const hash = await bcrypt.hash('123456', 10);
  await db.query('UPDATE usuarios SET verificacion_code = ?, verificacion_enviada = NULL WHERE email = ?', [hash, email]);
  return req('POST', '/auth/verificar-correo', { body: { email, codigo: '123456' } });
}
await db.query('UPDATE usuarios SET verificacion_code = ? WHERE email = ?', [await bcrypt.hash('123456', 10), dueno.email]);
r = await req('POST', '/auth/verificar-correo', { body: { email: dueno.email, codigo: '654321' } });
check('Seguridad: código de verificación incorrecto rechazado', r.status === 400 && /te quedan 4/i.test(r.data.message));
r = await req('POST', '/auth/verificar-correo', { body: { email: dueno.email, codigo: '123456' } });
check('Seguridad: código correcto activa la cuenta e inicia sesión', r.status === 200 && Boolean(r.data.token));
r = await req('POST', '/auth/register', { body: dueno });
check('Correo duplicado (ya verificado) rechazado', r.status === 409);

// Alguien registra un correo ajeno y no lo verifica: el dueño real puede registrarse igual
const ajeno = { nombre: 'Suplantador', email: `ajeno${sufijo}@test.local`, celular: '3001112233', password: 'clave1234' };
await req('POST', '/auth/register', { body: ajeno });
await db.query('UPDATE usuarios SET verificacion_enviada = NULL WHERE email = ?', [ajeno.email]);
r = await req('POST', '/auth/register', { body: { ...ajeno, nombre: 'Dueño Real' } });
check('Seguridad: una cuenta pendiente no "aparta" el correo (el dueño real puede registrarse)', r.status === 201
  && await sql(`SELECT nombre FROM usuarios WHERE email='${ajeno.email}'`) === 'Dueño Real');

await req('POST', '/auth/register', { body: vecino });
await req('POST', '/auth/register', { body: admin });
await verificarCuenta(vecino.email);
await verificarCuenta(admin.email);

// Bloqueo por contraseñas incorrectas seguidas (por cuenta, no por IP)
const victima = { nombre: 'Cuenta Atacada', email: `atacada${sufijo}@test.local`, celular: '3002223344', password: 'clave1234' };
await req('POST', '/auth/register', { body: victima });
await verificarCuenta(victima.email);
for (let i = 0; i < 4; i += 1) await req('POST', '/auth/login', { body: { email: victima.email, password: 'adivinando1' } });
r = await req('POST', '/auth/login', { body: { email: victima.email, password: 'adivinando1' } });
check('Seguridad: 5 contraseñas incorrectas bloquean la cuenta (423)', r.status === 423 && r.data.codigo === 'CUENTA_BLOQUEADA');
r = await req('POST', '/auth/login', { body: { email: victima.email, password: victima.password } });
check('Seguridad: bloqueada, ni con la contraseña correcta entra', r.status === 423);
check('RNF-05 contraseña con bcrypt costo 10', await sql(`SELECT LEFT(password,7) FROM usuarios WHERE email='${dueno.email}'`) === '$2a$10$' || await sql(`SELECT LEFT(password,7) FROM usuarios WHERE email='${dueno.email}'`) === '$2b$10$');

// R2 login
r = await req('POST', '/auth/login', { body: { email: dueno.email, password: 'mala1234' } });
check('Login con contraseña incorrecta → 401 genérico', r.status === 401 && r.data.message === 'Correo o contraseña incorrectos.');
r = await req('POST', '/auth/login', { body: { email: 'noexiste@test.local', password: 'mala1234' } });
check('Login con correo inexistente → mismo mensaje', r.status === 401 && r.data.message === 'Correo o contraseña incorrectos.');
const tDueno  = (await req('POST', '/auth/login', { body: { email: dueno.email,  password: dueno.password } })).data.token;
const tVecino = (await req('POST', '/auth/login', { body: { email: vecino.email, password: vecino.password } })).data.token;
check('R2 login devuelve JWT', Boolean(tDueno && tVecino));
const payload = JSON.parse(Buffer.from(tDueno.split('.')[1], 'base64url').toString());
check('RNF-06 JWT expira en 24 h', payload.exp - payload.iat === 86400);

// Consentimiento de ubicación del vecino (≈1 km del centro de Pasto)
r = await req('PUT', '/usuarios/ubicacion', { token: tVecino, body: { latitud: 1.2226, longitud: -77.2811 } });
check('Vecino comparte ubicación', r.status === 200);
r = await req('GET', '/auth/me', { token: tVecino });
check('alertas_activas = true tras consentir', r.data.usuario.alertas_activas === true);

// R3 mascota
r = await req('POST', '/mascotas', { token: tDueno, body: { nombre: 'Luna', especie: 'perro', sexo: 'hembra', color: 'negro', raza: 'Criolla' } });
check('R3 registro de mascota', r.status === 201);
const mascotaId = r.data.mascota.id;
const codigo = r.data.mascota.codigo_publico;
check('Mascota con código público aleatorio (UUID)', /^[0-9a-f-]{36}$/.test(codigo || ''));
r = await req('GET', `/mascotas/${mascotaId}`, { token: tVecino });
check('Otro usuario no ve la mascota privada', r.status === 404);

// R6 reporte de pérdida → R8/R9 alerta al vecino
r = await req('POST', '/reportes', { token: tDueno, body: { mascota_id: null, latitud: 1.2136, longitud: -77.2811, fecha_perdida: '2026-10-05' } });
check('Reporte sin mascota rechazado (bug original)', r.status === 400);
r = await req('POST', '/reportes', { token: tVecino, body: { mascota_id: mascotaId, latitud: 1.2136, longitud: -77.2811, fecha_perdida: '2026-10-05' } });
check('No se puede reportar mascota ajena', r.status === 403);
r = await req('POST', '/reportes', { token: tDueno, body: { mascota_id: mascotaId, latitud: 1.2136, longitud: -77.2811, fecha_perdida: '2026-10-05', descripcion: 'Collar rojo' } });
check('R6 reporte de pérdida creado', r.status === 201);
const reporteId = r.data.reporte.id;
await esperar(800);
r = await req('GET', '/notificaciones', { token: tVecino });
const alerta = (r.data.notificaciones || []).find((n) => n.reporte_id === reporteId && n.tipo === 'proximidad');
check('R8/R9 vecino recibe alerta por proximidad', Boolean(alerta), alerta?.mensaje);
check('HU-18 contador de no leídas', r.data.no_leidas >= 1);
r = await req('GET', '/notificaciones', { token: tDueno });
check('El dueño no recibe su propia alerta', !(r.data.notificaciones || []).some((n) => n.tipo === 'proximidad'));

// R10 consulta pública
r = await req('GET', '/reportes');
const enMapa = (r.data.reportes || []).find((x) => x.id === reporteId);
check('R10 reporte visible en listado público', Boolean(enMapa) && enMapa.mascota.nombre === 'Luna');

// HU-23 perfil público + Ley 1581
r = await req('GET', `/publico/mascotas/${codigo}`);
check('Ley 1581: el id numérico no abre el perfil (no enumerable)', (await req('GET', `/publico/mascotas/${mascotaId}`)).status === 404);
check('HU-23 perfil público sin login', r.status === 200 && r.data.reporte_activo?.id === reporteId);
check('Ley 1581: solo primer nombre y teléfono', r.data.propietario?.nombre === 'Ana' && r.data.propietario?.telefono === dueno.celular);
check('Ley 1581: sin correo en el perfil público', !JSON.stringify(r.data).includes(dueno.email));

// R7 avistamiento anónimo: exige celular y foto. En CI Cloudinary no tiene credenciales reales,
// por eso aquí se verifican las validaciones; el registro con foto lo cubren las pruebas de integración.
const avistamiento = { mascota_id: mascotaId, latitud: 1.215, longitud: -77.28, descripcion: 'la vi en el parque' };
r = await req('POST', '/avistamientos', { body: avistamiento });
check('R7 avistamiento sin celular rechazado', r.status === 400 && JSON.stringify(r.data).includes('celular es obligatorio'));
r = await req('POST', '/avistamientos', { body: { ...avistamiento, telefono_testigo: '3001234567' } });
check('R7 avistamiento sin foto rechazado', r.status === 400 && JSON.stringify(r.data).includes('foto es obligatoria'));

// HU-22 QR y HU-31 cartel
let bin = await req('GET', `/mascotas/${mascotaId}/qr`, { token: tDueno, raw: true });
let buf = Buffer.from(await bin.arrayBuffer());
check('HU-22 QR PNG descargable', bin.status === 200 && buf.slice(1, 4).toString() === 'PNG');
bin = await req('GET', `/mascotas/${mascotaId}/cartel-pdf`, { token: tDueno, raw: true });
buf = Buffer.from(await bin.arrayBuffer());
check('HU-31 cartel PDF', bin.status === 200 && buf.slice(0, 4).toString() === '%PDF');

// HU-29 compartir con vista previa
bin = await fetch(`${API}/publico/compartir/mascotas/${codigo}`);
const html = await bin.text();
check('HU-29 página Open Graph', bin.status === 200 && html.includes('og:title') && html.includes(`/publico/mascotas/${codigo}`));

// Admin
await sql(`UPDATE usuarios SET rol='admin' WHERE email='${admin.email}'`);
const tAdmin = (await req('POST', '/auth/login', { body: { email: admin.email, password: admin.password } })).data.token;
r = await req('GET', '/admin/estadisticas', { token: tDueno });
check('Usuario normal no accede al panel admin', r.status === 403);
r = await req('GET', '/admin/estadisticas', { token: tAdmin });
check('HU-25 estadísticas admin', r.status === 200 && r.data.estadisticas.reportes_activos >= 1);
r = await req('POST', '/entidades-aliadas', { token: tAdmin, body: { nombre: 'Veterinaria Prueba', tipo: 'veterinaria', direccion: 'Cra 25 # 18-30', telefono: '300 123 4567', horario: 'Lun–Sáb 8:00–18:00', latitud: 1.214, longitud: -77.281, activo: false } });
check('HU-27 admin crea entidad con horario', r.status === 201 && r.data.entidad.horario && r.data.entidad.activo !== false);
const entidadId = r.data.entidad.id;
r = await req('GET', '/entidades-aliadas');
check('HU-27 entidad visible públicamente', (r.data.entidades || []).some((e) => e.id === entidadId));
r = await req('DELETE', `/entidades-aliadas/${entidadId}`, { token: tAdmin });
r = await req('GET', '/entidades-aliadas');
check('HU-27 admin elimina entidad', !(r.data.entidades || []).some((e) => e.id === entidadId));
bin = await req('GET', '/admin/reportes/semanal-pdf', { token: tAdmin, raw: true });
buf = Buffer.from(await bin.arrayBuffer());
check('HU-30 PDF semanal', bin.status === 200 && buf.slice(0, 4).toString() === '%PDF');
r = await req('PUT', `/admin/reportes/${reporteId}/moderar`, { token: tAdmin });
r = await req('GET', '/reportes');
check('HU-28 reporte moderado sale del mapa', !(r.data.reportes || []).some((x) => x.id === reporteId));

// HU-11 estado + RNF-02 tiempo de consulta
r = await req('PUT', `/reportes/${reporteId}/estado`, { token: tDueno, body: { estado: 'encontrada' } });
check('HU-11 cambiar estado a encontrada', r.status === 200);
const t0 = performance.now(); await req('GET', '/reportes'); const ms = performance.now() - t0;
check('RNF-02 consulta de reportes < 500 ms', ms < 500, `${ms.toFixed(0)} ms`);

// FK corregida: borrar un reporte deja la notificación con reporte_id NULL
await sql(`DELETE FROM reportes WHERE id=${reporteId}`);
check('Notificación sobrevive con reporte_id NULL (migración 15)', await sql(`SELECT COUNT(*) FROM notificaciones WHERE reporte_id IS NULL AND mensaje LIKE '%Luna%'`) !== '0');

// HU-03 logout invalida el token
await req('POST', '/auth/logout', { token: tDueno });
r = await req('GET', '/auth/me', { token: tDueno });
check('HU-03 token invalidado tras logout', r.status === 401);

// Ley 1581: eliminar cuenta en cascada
const idVecino = await sql(`SELECT id FROM usuarios WHERE email='${vecino.email}'`);
r = await req('DELETE', '/usuarios/cuenta', { token: tVecino, body: { password: vecino.password } });
check('Eliminar cuenta', r.status === 200);
check('Cuenta y notificaciones borradas en cascada',
  await sql(`SELECT COUNT(*) FROM usuarios WHERE id=${idVecino}`) === '0' && await sql(`SELECT COUNT(*) FROM notificaciones WHERE usuario_id=${idVecino}`) === '0');

// Errores sin filtrar detalles internos
r = await req('GET', '/ruta-que-no-existe');
check('404 en JSON para rutas desconocidas', r.status === 404 && r.data.success === false);

const fallos = resultados.filter((x) => !x.ok);
console.log(`\n${resultados.length - fallos.length}/${resultados.length} verificaciones correctas`);
await db.end();
process.exit(fallos.length ? 1 : 0);
