// Valida el parámetro :id de la ruta antes de llegar al controlador.
// Varias rutas declaraban param('id').isInt(), pero sus controladores no
// revisaban el resultado: un id como "abc" llegaba a la consulta y respondía 404.
function validarId(req, res, next, id) {
  if (/^[1-9]\d{0,9}$/.test(id)) return next();
  return res.status(400).json({
    success: false,
    message: 'El identificador debe ser un número entero positivo.',
  });
}

module.exports = { validarId };
