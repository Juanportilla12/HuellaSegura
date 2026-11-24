const rateLimit = require('express-rate-limit');

// Sin límite de peticiones en desarrollo ni en pruebas automatizadas
const sinLimite = () => ['development', 'test'].includes(process.env.NODE_ENV);

function crearLimitador({ minutos, max, mensaje, soloFallidos = false }) {
  return rateLimit({
    windowMs: minutos * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: mensaje },
    skip: sinLimite,
    // Con soloFallidos, los inicios de sesión correctos no gastan intentos
    skipSuccessfulRequests: soloFallidos,
  });
}

// Global — 1500 peticiones / 15 min por IP. Muchas personas comparten la misma IP
// (wifi de una universidad o de una casa) y cada pantalla hace varias peticiones:
// un límite bajo bloqueaba la app entera para todo un salón.
const limitadorGlobal = crearLimitador({
  minutos: 15, max: 1500, mensaje: 'Demasiadas solicitudes. Intenta en unos minutos.',
});

// Autenticación — 30 intentos fallidos / 15 min por IP (fuerza bruta). Solo se aplica
// a login, registro y recuperación de contraseña, no a /auth/me ni /auth/logout.
const limitadorAuth = crearLimitador({
  minutos: 15, max: 30, soloFallidos: true,
  mensaje: 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
});

// Avistamientos — endpoint público que notifica al dueño: 20 por hora por IP
const limitadorAvistamientos = crearLimitador({
  minutos: 60, max: 20, mensaje: 'Has enviado varios avistamientos seguidos. Intenta de nuevo más tarde.',
});

module.exports = { limitadorGlobal, limitadorAuth, limitadorAvistamientos };
