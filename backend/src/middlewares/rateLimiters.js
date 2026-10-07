const rateLimit = require('express-rate-limit');

// Sin límite de peticiones en desarrollo ni en pruebas automatizadas
const sinLimite = () => ['development', 'test'].includes(process.env.NODE_ENV);

function crearLimitador({ minutos, max, mensaje }) {
  return rateLimit({
    windowMs: minutos * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: mensaje },
    skip: sinLimite,
  });
}

// Global — 100 peticiones / 15 min por IP
const limitadorGlobal = crearLimitador({
  minutos: 15, max: 100, mensaje: 'Demasiadas solicitudes. Intenta en 15 minutos.',
});

// Autenticación — 10 intentos / 15 min por IP (fuerza bruta)
const limitadorAuth = crearLimitador({
  minutos: 15, max: 10, mensaje: 'Demasiados intentos de autenticación. Espera 15 minutos.',
});

// Avistamientos — endpoint público que notifica al dueño: 5 por hora por IP
const limitadorAvistamientos = crearLimitador({
  minutos: 60, max: 5, mensaje: 'Has enviado varios avistamientos seguidos. Intenta de nuevo en una hora.',
});

module.exports = { limitadorGlobal, limitadorAuth, limitadorAvistamientos };
