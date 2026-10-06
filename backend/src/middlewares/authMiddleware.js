const { verify } = require('../config/jwt');
const { Usuario } = require('../models');

/**
 * Crea un middleware de autenticación JWT.
 * Por defecto el token solo se acepta en el header Authorization.
 * La conexión de tiempo real (EventSource) no permite headers, por eso
 * esa única ruta usa { permitirTokenEnQuery: true }.
 */
function crearAutenticador({ permitirTokenEnQuery = false } = {}) {
  return async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const tokenHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = tokenHeader || (permitirTokenEnQuery ? req.query.token : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere autenticación.',
      });
    }

    try {
      const payload = verify(token);

      const usuario = await Usuario.findByPk(payload.id);
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido: usuario no encontrado.',
        });
      }

      // Verifica que el token no fue invalidado por un logout previo
      if (payload.tokenVersion !== usuario.token_version) {
        return res.status(401).json({
          success: false,
          message: 'Sesión expirada. Por favor inicia sesión nuevamente.',
        });
      }

      if (!usuario.activo) {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta ha sido desactivada.',
        });
      }

      req.usuario = usuario;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado.',
      });
    }
  };
}

const authenticate = crearAutenticador();
const authenticateSSE = crearAutenticador({ permitirTokenEnQuery: true });

function requireAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.',
    });
  }
  next();
}

module.exports = { authenticate, authenticateSSE, requireAdmin };
