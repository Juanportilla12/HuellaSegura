const { validationResult } = require('express-validator');
const { EntidadAliada } = require('../models');

const CAMPOS_EDITABLES = ['nombre', 'tipo', 'direccion', 'telefono', 'horario', 'latitud', 'longitud', 'descripcion'];

// Solo se aceptan los campos permitidos (evita asignación masiva de columnas como id o activo)
function camposPermitidos(body) {
  return Object.fromEntries(
    CAMPOS_EDITABLES.filter((c) => body[c] !== undefined).map((c) => [c, body[c] === '' ? null : body[c]])
  );
}

async function listar(req, res, next) {
  try {
    const entidades = await EntidadAliada.findAll({ where: { activo: true }, order: [['nombre', 'ASC']] });
    return res.status(200).json({ success: true, entidades });
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const entidad = await EntidadAliada.create(camposPermitidos(req.body));
    return res.status(201).json({ success: true, message: 'Entidad registrada.', entidad });
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    const entidad = await EntidadAliada.findByPk(req.params.id);
    if (!entidad) return res.status(404).json({ success: false, message: 'Entidad no encontrada.' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    await entidad.update(camposPermitidos(req.body));
    return res.status(200).json({ success: true, message: 'Entidad actualizada.', entidad });
  } catch (error) { next(error); }
}

// Baja lógica: la entidad deja de mostrarse en el directorio y el mapa
async function eliminar(req, res, next) {
  try {
    const entidad = await EntidadAliada.findByPk(req.params.id);
    if (!entidad) return res.status(404).json({ success: false, message: 'Entidad no encontrada.' });
    await entidad.update({ activo: false });
    return res.status(200).json({ success: true, message: 'Entidad eliminada del directorio.' });
  } catch (error) { next(error); }
}

module.exports = { listar, crear, actualizar, eliminar };
