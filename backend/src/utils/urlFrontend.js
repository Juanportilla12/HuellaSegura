// URL pública del frontend para enlaces en correos, QR y PDF. FRONTEND_URL puede traer
// varias URLs separadas por coma (ver CORS en app.js): se usa la primera, sin barra final.
function urlFrontend(ruta = '') {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');
  return `${base}${ruta}`;
}

module.exports = { urlFrontend };
