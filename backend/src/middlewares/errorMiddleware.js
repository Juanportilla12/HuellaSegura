function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.stack || err.message}`);

  // Error de validación de Sequelize (campo único duplicado, etc.)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con esos datos.',
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: err.errors.map((e) => e.message).join(', '),
    });
  }

  // Cuerpo JSON mal formado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'El cuerpo de la petición no es un JSON válido.' });
  }

  // Errores de subida de archivos (tamaño, cantidad o tipo no permitido)
  if (err.name === 'MulterError') {
    const mensajes = {
      LIMIT_FILE_SIZE: 'El archivo supera el tamaño máximo permitido.',
      LIMIT_FILE_COUNT: 'Se enviaron demasiados archivos.',
      LIMIT_UNEXPECTED_FILE: 'Se enviaron demasiados archivos o un campo no esperado.',
    };
    return res.status(400).json({ success: false, message: mensajes[err.code] || 'Archivo inválido.' });
  }
  if (err.tipoArchivoInvalido) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Error interno del servidor.'
      : err.message || 'Error interno del servidor.';

  return res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
