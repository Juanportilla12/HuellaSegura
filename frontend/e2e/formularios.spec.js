import { test, expect } from './base';
import { createRequire } from 'node:module';
import {
  API, datosUsuario, registrarPorApi, entrarConSesion, crearMascotaPorApi, marcarEnMapa,
} from './ayudas';

// Para volver administrador a un usuario se usa la base de datos de prueba (variables de backend/.env)
const requireBackend = createRequire(new URL('../../backend/package.json', import.meta.url));
async function hacerAdmin(email) {
  requireBackend('dotenv').config({ path: new URL('../../backend/.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
  const mysql = requireBackend('mysql2/promise');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await db.query('UPDATE usuarios SET rol = "admin" WHERE email = ?', [email]);
  await db.end();
}

test.describe('Registrar mascota', () => {
  test('exige nombre, especie, sexo y color antes de avanzar', async ({ page, request }) => {
    const cuenta = await registrarPorApi(request, datosUsuario('mascota'));
    await entrarConSesion(page, cuenta);
    await page.goto('/mascotas/nueva');

    await page.getByTestId('btn-siguiente').click();
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(page.getByTestId('paso-1')).toBeVisible();

    await page.getByLabel(/nombre de la mascota/i).fill('   ');
    await page.getByTestId('btn-siguiente').click();
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();

    await page.getByLabel(/nombre de la mascota/i).fill('Rocky');
    await page.getByTestId('btn-siguiente').click();
    await expect(page.getByTestId('paso-2')).toBeVisible();

    await page.getByTestId('btn-siguiente').click();
    await expect(page.getByText(/selecciona la especie/i)).toBeVisible();
    await expect(page.getByText('Selecciona el sexo.')).toBeVisible();
    await expect(page.getByText(/el color es obligatorio/i)).toBeVisible();
    await expect(page.getByTestId('paso-2')).toBeVisible();
  });

  test('rechaza una edad inválida y guarda una mascota completa', async ({ page, request }) => {
    const cuenta = await registrarPorApi(request, datosUsuario('mascota'));
    await entrarConSesion(page, cuenta);
    await page.goto('/mascotas/nueva');

    await page.getByLabel(/nombre de la mascota/i).fill('Rocky');
    await page.getByTestId('btn-siguiente').click();
    await page.getByRole('button', { name: 'Perro' }).click();
    await page.getByRole('button', { name: 'Macho' }).click();
    await page.getByRole('button', { name: 'Negro' }).click();
    await page.getByTestId('btn-siguiente').click();

    await page.getByLabel('Edad').fill('99');
    await page.getByTestId('btn-siguiente').click();
    await expect(page.getByText(/la edad máxima es 40 años/i)).toBeVisible();
    await page.getByLabel('Edad').fill('3');
    await page.getByTestId('btn-siguiente').click();

    await expect(page.getByTestId('paso-4')).toBeVisible();
    await page.getByTestId('btn-guardar').click();
    await expect(page).toHaveURL(/\/mascotas$/);
    await expect(page.getByText('Rocky').first()).toBeVisible();
  });
});

test.describe('Reportar mascota perdida', () => {
  test('no publica sin mascota ni ubicación, y publica con los datos completos', async ({ page, request, context }) => {
    await context.clearPermissions(); // sin GPS: la ubicación se debe marcar en el mapa
    const cuenta = await registrarPorApi(request, datosUsuario('reporte'));
    const mascota = await crearMascotaPorApi(request, cuenta.token, { nombre: 'Kira' });
    await entrarConSesion(page, cuenta);
    await page.goto('/reportes/nuevo');

    await page.getByRole('button', { name: /publicar reporte/i }).click();
    await expect(page.getByText('Selecciona la mascota que se perdió.')).toBeVisible();
    await expect(page.getByText('Marca en el mapa dónde se perdió.')).toBeVisible();

    await page.getByTestId(`mascota-opcion-${mascota.id}`).click();
    await marcarEnMapa(page);
    await page.getByRole('button', { name: /publicar reporte/i }).click();
    await expect(page.getByText('Reporte publicado')).toBeVisible();
  });

  test('no acepta una fecha futura', async ({ page, request }) => {
    const cuenta = await registrarPorApi(request, datosUsuario('reporte'));
    const mascota = await crearMascotaPorApi(request, cuenta.token);
    await entrarConSesion(page, cuenta);
    await page.goto('/reportes/nuevo');
    await page.getByTestId(`mascota-opcion-${mascota.id}`).click();
    await marcarEnMapa(page);
    await page.getByTestId('input-fecha').fill('2099-01-01');
    await page.getByRole('button', { name: /publicar reporte/i }).click();
    await expect(page.getByText('La fecha no puede ser futura.')).toBeVisible();
  });
});

test.describe('Reportar avistamiento (sin cuenta)', () => {
  test('exige mascota, ubicación, foto y celular', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('hs-bienvenida-vista', '1'));
    await page.goto('/avistamientos/nuevo');
    await page.getByTestId('btn-enviar-avistamiento').click();
    await expect(page.getByText('Elige la mascota que viste.')).toBeVisible();
    await expect(page.getByText('Marca en el mapa dónde la viste.')).toBeVisible();
    await expect(page.getByText(/agrega una foto/i)).toBeVisible();
    await expect(page.getByText('Tu número de celular es obligatorio.')).toBeVisible();

    await page.getByLabel(/tu celular/i).fill('abc');
    await page.getByTestId('btn-enviar-avistamiento').click();
    await expect(page.getByText(/ingresa un celular válido/i)).toBeVisible();
  });
});

test.describe('Perfil', () => {
  test('el celular no se puede dejar vacío', async ({ page, request }) => {
    const cuenta = await registrarPorApi(request, datosUsuario('perfil'));
    await entrarConSesion(page, cuenta);
    await page.goto('/perfil');
    const campo = page.getByTestId('input-celular');
    await campo.fill('');
    await campo.locator('xpath=..').getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/el celular es obligatorio/i)).toBeVisible();

    // El servidor también lo rechaza aunque se salte el formulario
    const resp = await request.put(`${API}/usuarios/perfil`, {
      headers: { Authorization: `Bearer ${cuenta.token}` }, data: { celular: '' },
    });
    expect(resp.status()).toBe(400);
  });

  test('eliminar la cuenta con contraseña incorrecta no cierra la sesión', async ({ page, request }) => {
    const cuenta = await registrarPorApi(request, datosUsuario('perfil'));
    await entrarConSesion(page, cuenta);
    await page.goto('/perfil');
    await page.getByTestId('btn-eliminar-cuenta').click();
    await page.getByTestId('input-password-borrado').fill('no-es-mi-clave');
    await page.getByRole('button', { name: /eliminar definitivamente/i }).click();
    await expect(page.getByText(/la contraseña no es correcta/i)).toBeVisible();
    await expect(page).toHaveURL(/\/perfil$/);
  });
});

test.describe('Directorio (administrador)', () => {
  test('una entidad exige nombre, dirección y teléfono', async ({ page, request }) => {
    const cuenta = await registrarPorApi(request, datosUsuario('admin'));
    await hacerAdmin(cuenta.email);
    await entrarConSesion(page, { ...cuenta, usuario: { ...cuenta.usuario, rol: 'admin' } });
    await page.goto('/directorio');
    await page.getByRole('button', { name: /agregar/i }).click();

    const form = page.getByTestId('form-entidad');
    await form.getByRole('button', { name: 'Guardar' }).click();
    await expect(form.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(form.getByText('La dirección es obligatoria.')).toBeVisible();
    await expect(form.getByText('El teléfono es obligatorio.')).toBeVisible();

    await form.getByLabel(/^nombre/i).fill('Veterinaria Prueba');
    await form.getByLabel(/^dirección/i).fill('Cra 25 # 18-30');
    await form.getByLabel(/^teléfono/i).fill('300 123 4567');
    await form.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Entidad agregada al directorio.')).toBeVisible();
  });
});
