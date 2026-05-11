const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const routes     = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app = express();

// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permite imágenes de Cloudinary
  contentSecurityPolicy: false, // El frontend maneja su propio CSP
}));

// Rate limiting global — 100 req / 15 min por IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
  skip: (req) => process.env.NODE_ENV === 'development',
}));

// Rate limiting estricto para auth — 10 intentos / 15 min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de autenticación. Espera 15 minutos.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});

// ── CORS ─────────────────────────────────────────────────────────────────────
const originesPermitidos = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (mobile, Postman, curl)
    if (!origin) return callback(null, true);
    if (originesPermitidos.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── Rutas principales ────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter); // Rate limit estricto solo en auth
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
