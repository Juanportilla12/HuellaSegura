import { defineConfig, devices } from '@playwright/test';

// Pruebas en un navegador real (Chromium) con pantalla de celular.
// Requisitos: backend corriendo en http://localhost:3001 con una base de datos de PRUEBA
// (nunca la de producción) y las migraciones aplicadas. El frontend lo levanta Playwright
// en el puerto 4173 forzando la API local: así un .env.local que apunte a producción no
// tiene efecto. Además e2e/base.js bloquea cualquier petición a un servidor que no sea local.
//   npx playwright test            → corre todo
//   npx playwright show-report     → abre el informe con capturas de los fallos
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://localhost:4173',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite --port 4173 --strictPort',
    url: 'http://localhost:4173',
    // Nunca reutilizar un servidor ya abierto: podría estar apuntando a producción
    reuseExistingServer: false,
    // Las variables del entorno tienen prioridad sobre los archivos .env de Vite
    env: { VITE_API_URL: 'http://localhost:3001/api' },
    timeout: 120_000,
  },
});
