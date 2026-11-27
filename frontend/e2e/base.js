import { test as base, expect } from '@playwright/test';

// Protección: las pruebas solo pueden hablar con el backend local. Cualquier petición a
// una API que no sea localhost (por ejemplo, producción en Railway) se bloquea y la
// prueba falla, en lugar de crear datos reales.
const API_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;

export const test = base.extend({
  context: async ({ context }, continuar) => {
    const bloqueadas = [];
    await context.route(/\/api\/|railway\.app/, (route) => {
      const url = route.request().url();
      // La verificación anti-bots de Cloudflare (Turnstile) también usa rutas con /api/
      if (API_LOCAL.test(url) || /^https:\/\/challenges\.cloudflare\.com\//.test(url)) return route.continue();
      bloqueadas.push(url);
      return route.abort('blockedbyclient');
    });
    await continuar(context);
    if (bloqueadas.length) throw new Error(`Peticiones bloqueadas a servidores no locales:\n${bloqueadas.join('\n')}`);
  },
});

export { expect };
