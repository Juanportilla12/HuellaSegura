import { test, expect } from './base';

// Quien llega sin cuenta (escaneó el QR de la placa) debe poder volver al inicio y ver
// el mapa sin que la app lo mande al inicio de sesión. Las respuestas del servidor se
// simulan: lo que se prueba es la navegación del visitante.
const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const MASCOTA = { id: 5, nombre: 'Batman', especie: 'gato', sexo: 'macho', codigo_publico: 'codigo-prueba' };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hs-bienvenida-vista', '1'));
  await page.route('**/api/publico/mascotas/codigo-prueba', (r) => r.fulfill({
    json: { success: true, mascota: MASCOTA, propietario: { nombre: 'Victor', telefono: '3001234567' }, reporte_activo: null },
  }));
  await page.route('**/api/avistamientos', (r) => r.fulfill({ status: 201, json: { success: true } }));
});

test('después de enviar un avistamiento, "Volver al inicio" abre el inicio (no el login)', async ({ page }) => {
  await page.goto('/avistamientos/nuevo?mascota=codigo-prueba');
  await expect(page.getByTestId('mascota-desde-qr')).toContainText('Batman');
  const mapa = page.getByTestId('mapa-selector').locator('.leaflet-container');
  const caja = await mapa.boundingBox();
  await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG_1PX });
  await page.getByLabel(/tu celular/i).fill('300 123 4567');
  await page.getByTestId('btn-enviar-avistamiento').click();

  await expect(page.getByText('¡Gracias por ayudar!')).toBeVisible();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page).toHaveURL('http://localhost:4173/');
  await expect(page.getByRole('navigation').first()).toBeVisible();
});

test('desde el perfil público, un visitante puede ir al inicio sin iniciar sesión', async ({ page }) => {
  await page.goto('/publico/mascotas/codigo-prueba');
  await expect(page.getByText('En casa')).toBeVisible();
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:4173/');
});
