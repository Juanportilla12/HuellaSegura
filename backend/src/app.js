const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const helmet     = require('helmet');
const routes     = require('./routes');
const { limitadorGlobal } = require('./middlewares/rateLimiters');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app = express();

// En producción la app corre detrás del proxy de Railway: confiar en un salto
// permite leer la IP real del cliente (X-Forwarded-For). Sin esto, el rate
// limit trataría a todos los usuarios como una sola IP.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permite imágenes de Cloudinary
  contentSecurityPolicy: false, // El frontend maneja su propio CSP
}));

// Límite de peticiones por IP (ver middlewares/rateLimiters.js)
app.use(limitadorGlobal);

// ── CORS ─────────────────────────────────────────────────────────────────────
// FRONTEND_URL admite varias URLs separadas por coma. Se ignoran la barra final y
// las mayúsculas: "https://app.vercel.app/" y "https://app.vercel.app" son el mismo origen.
const normalizarOrigen = (url) => url.trim().replace(/\/+$/, '').toLowerCase();

const originesPermitidos = new Set([
  ...(process.env.FRONTEND_URL || '').split(','),
  // Dominios públicos de la app en Vercel: permitidos aunque FRONTEND_URL no esté configurada.
  // El segundo es el del proyecto duplicado: puede haber QR impresos que apunten a él.
  'https://huella-segura-three.vercel.app',
  'https://huellasegura-frontend-khaki.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
].map(normalizarOrigen).filter(Boolean));

app.use(cors((req, callback) => {
  const origin = req.headers.origin;
  // Permitir peticiones sin origen (mobile, Postman, curl) y las del propio servidor
  // (p. ej. el formulario de la página "No fui yo" que sirve el backend)
  const propio = `${req.protocol}://${req.get('host')}`;
  if (!origin || normalizarOrigen(origin) === normalizarOrigen(propio) || originesPermitidos.has(normalizarOrigen(origin))) {
    return callback(null, { origin: true, credentials: true });
  }
  console.warn(`[CORS] Origen rechazado: ${origin}. Agrégalo a FRONTEND_URL.`);
  const error = new Error('Origen no permitido por CORS.');
  error.status = 403;
  callback(error);
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// El token de la conexión SSE viaja en la URL: se oculta en los logs
morgan.token('url', (req) => req.originalUrl.replace(/([?&]token=)[^&]+/, '$1***'));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── Rutas principales ────────────────────────────────────────────────────────
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
