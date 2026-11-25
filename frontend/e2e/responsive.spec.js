import { devices } from '@playwright/test';
import { test, expect } from './base';
import { datosUsuario, registrarPorApi, entrarConSesion, crearMascotaPorApi, crearReportePorApi } from './ayudas';

// Se prueba con WebKit, el mismo motor de Safari y Chrome en iPhone
const { defaultBrowserType: _ignorado, ...IPHONE } = devices['iPhone 13'];
test.use({ ...IPHONE, browserName: 'webkit' });

async function cuentaConDatos(request) {
  const cuenta = await registrarPorApi(request, datosUsuario('responsive'));
  const m = await crearMascotaPorApi(request, cuenta.token, { nombre: 'Mascota con un nombre bastante largo' });
  await crearReportePorApi(request, cuenta.token, m.id);
  return cuenta;
}

test('al pasar de Inicio (desplazado) al mapa, el mapa queda completo: búsqueda arriba y menú abajo', async ({ page, request }) => {
  await entrarConSesion(page, await cuentaConDatos(request));
  await page.goto('/');
  await expect(page.getByText('Se buscan')).toBeVisible();
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.getByRole('navigation').last().getByRole('link', { name: /mapa/i }).click();
  await expect(page).toHaveURL(/\/mapa$/);
  await page.waitForTimeout(800);

  const medidas = await page.evaluate(() => {
    const buscador = document.querySelector('input[placeholder*="Buscar"]').getBoundingClientRect();
    const menu = [...document.querySelectorAll('nav')].pop().getBoundingClientRect();
    return { scrollY: window.scrollY, buscadorTop: buscador.top, menuBottom: Math.round(menu.bottom), alto: window.innerHeight };
  });
  expect(medidas.scrollY).toBe(0);
  expect(medidas.buscadorTop).toBeGreaterThanOrEqual(0);
  expect(Math.abs(medidas.menuBottom - medidas.alto)).toBeLessThanOrEqual(1);

  // La página del mapa no se puede desplazar
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('ninguna pantalla se desborda de lado y el fondo del documento es el de la app', async ({ browser, request }) => {
  test.setTimeout(300_000);
  const cuenta = await cuentaConDatos(request);
  const TAMANOS = [[320, 640], [360, 740], [375, 667], [390, 844], [430, 932]];
  const RUTAS = ['/', '/mapa', '/directorio', '/alertas', '/mascotas', '/mascotas/nueva', '/reportes', '/reportes/nuevo',
    '/perfil', '/avistamientos/nuevo', '/login', '/register', '/olvide-contrasena'];
  const problemas = [];
  for (const [width, height] of TAMANOS) {
    const ctx = await browser.newContext({ ...IPHONE, viewport: { width, height } });
    await ctx.route(/\/api\/|railway\.app/, (r) => (/^http:\/\/(localhost|127\.0\.0\.1)/.test(r.request().url()) ? r.continue() : r.abort()));
    const page = await ctx.newPage();
    await entrarConSesion(page, cuenta);
    for (const ruta of RUTAS) {
      await page.goto(ruta);
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        ancho: document.documentElement.clientWidth,
        fondo: getComputedStyle(document.documentElement).backgroundColor,
      }));
      if (r.scrollW > r.ancho + 1) problemas.push(`${width}px ${ruta}: ancho ${r.scrollW}/${r.ancho}`);
      if (r.fondo === 'rgba(0, 0, 0, 0)') problemas.push(`${width}px ${ruta}: fondo del documento transparente`);
    }
    await ctx.close();
  }
  expect(problemas).toEqual([]);
});
