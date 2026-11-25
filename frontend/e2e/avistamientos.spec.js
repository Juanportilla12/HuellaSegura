import { test, expect } from './base';
import {
  API, datosUsuario, registrarPorApi, entrarConSesion, crearMascotaPorApi, crearReportePorApi, consultarBD,
} from './ayudas';

// Flujo real de un avistamiento entre dos personas: el dueño (perdió la mascota) y el
// testigo (la vio). El avistamiento se inserta en la base de datos porque en local no hay
// Cloudinary para subir la foto obligatoria; el envío por la API lo cubren las pruebas del backend.
const DONDE_SE_PERDIO = { latitud: 1.2136, longitud: -77.2811 };
const DONDE_LA_VIERON = { latitud: 1.2001, longitud: -77.2999 };

async function escenario(request) {
  const dueno = await registrarPorApi(request, datosUsuario('dueno'));
  const testigo = await registrarPorApi(request, datosUsuario('testigo'));
  const mascota = await crearMascotaPorApi(request, dueno.token, { nombre: 'Batman', especie: 'gato', sexo: 'macho' });
  const reporte = await crearReportePorApi(request, dueno.token, mascota.id, DONDE_SE_PERDIO);
  const avistamiento = await consultarBD(
    `INSERT INTO avistamientos (mascota_id, reporte_id, usuario_id, latitud, longitud, descripcion, telefono_testigo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'Iba por el parque', '3001234567', NOW(), NOW())`,
    [mascota.id, reporte.id, testigo.usuario.id, DONDE_LA_VIERON.latitud, DONDE_LA_VIERON.longitud],
  );
  await consultarBD(
    `INSERT INTO notificaciones (usuario_id, reporte_id, avistamiento_id, mensaje, tipo, leida, created_at, updated_at)
     VALUES (?, ?, ?, '¡Alguien vio a Batman! Contacta a quien la vio al 300 123 4567. Toca para ver dónde la vio.', 'avistamiento', 0, NOW(), NOW())`,
    [dueno.usuario.id, reporte.id, avistamiento.insertId],
  );
  return { dueno, testigo, mascota, reporte };
}

test('el dueño ve en Alertas el lugar donde VIERON a su mascota, no donde se perdió', async ({ page, request }) => {
  const { dueno } = await escenario(request);
  await entrarConSesion(page, dueno);
  await page.goto('/alertas');
  const lugar = page.getByTestId('lugar-avistamiento');
  await expect(lugar).toContainText(/aquí la vieron/i);
  await expect(lugar.locator(`a[href*="destination=${DONDE_LA_VIERON.latitud},${DONDE_LA_VIERON.longitud}"]`)).toBeVisible();
  await expect(lugar.locator(`a[href*="${DONDE_SE_PERDIO.latitud}"]`)).toHaveCount(0);
});

test('quien reportó el avistamiento lo ve en "Mis reportes" y sabe si la mascota volvió a casa', async ({ page, request }) => {
  const { dueno, testigo, reporte } = await escenario(request);
  await entrarConSesion(page, testigo);
  await page.goto('/reportes');
  await expect(page.getByTestId('pestana-avistamientos')).toHaveAttribute('aria-selected', 'true');
  const tarjeta = page.locator('[data-testid^="avistamiento-"]').first();
  await expect(tarjeta).toContainText('Viste a Batman');
  await expect(tarjeta).toContainText('Su familia aún la busca');

  // El dueño la encuentra: el testigo lo ve reflejado en su avistamiento
  const resp = await request.put(`${API}/reportes/${reporte.id}/estado`, {
    headers: { Authorization: `Bearer ${dueno.token}` }, data: { estado: 'encontrada' },
  });
  expect(resp.ok()).toBe(true);
  await page.reload();
  await expect(page.locator('[data-testid^="avistamiento-"]').first()).toContainText('¡Ya volvió a casa!');
});

test('al dueño no le aparece "La vi" en su propia mascota (mapa, perfil público y formulario)', async ({ page, request }) => {
  const { dueno, mascota, reporte } = await escenario(request);
  await entrarConSesion(page, dueno);

  await page.goto(`/mapa?reporte=${reporte.id}`);
  await expect(page.getByTestId('es-tu-mascota')).toBeVisible();
  await expect(page.getByRole('button', { name: 'La vi' })).toHaveCount(0);

  await page.goto(`/publico/mascotas/${mascota.codigo_publico}`);
  await expect(page.getByTestId('aviso-propietario')).toBeVisible();
  await expect(page.getByRole('button', { name: /la vi/i })).toHaveCount(0);

  await page.goto(`/avistamientos/nuevo?mascota=${mascota.codigo_publico}`);
  await expect(page.getByTestId('aviso-mascota-propia')).toBeVisible();
  await expect(page.getByTestId('btn-enviar-avistamiento')).toBeDisabled();
});

test('a otra persona sí le aparece "La vi" en esa mascota', async ({ page, request }) => {
  const { testigo, reporte } = await escenario(request);
  await entrarConSesion(page, testigo);
  await page.goto(`/mapa?reporte=${reporte.id}`);
  await expect(page.getByRole('button', { name: 'La vi' })).toBeVisible();
});
