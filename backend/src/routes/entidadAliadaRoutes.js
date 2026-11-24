const { Router } = require('express');
const { body, param } = require('express-validator');
const entidadAliadaController = require('../controllers/entidadAliadaController');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');
const { validarId } = require('../middlewares/validarId');
const { CELULAR_REGEX } = require('../utils/validaciones');

const soloAdmin = [authenticate, requireAdmin];

const router = Router();

// Toda ruta con :id exige un entero positivo (400 si no lo es)
router.param('id', validarId);

const TIPOS = ['veterinaria', 'albergue', 'otro'];

// Dirección y teléfono son obligatorios: una entidad del directorio sin forma de
// ubicarla o contactarla no le sirve a quien busca ayuda para su mascota.
const camposContacto = (opcional) => {
  const campo = (nombre) => (opcional ? body(nombre).optional() : body(nombre));
  return [
    campo('direccion').trim().notEmpty().withMessage('La dirección es obligatoria.')
      .bail().isLength({ max: 255 }).withMessage('La dirección admite máximo 255 caracteres.'),
    campo('telefono').trim().notEmpty().withMessage('El teléfono es obligatorio.')
      .bail().matches(CELULAR_REGEX).withMessage('Ingresa un teléfono válido.'),
  ];
};

const camposOpcionales = [
  body('horario').optional({ values: 'falsy' }).isLength({ max: 150 }).withMessage('Horario demasiado largo.'),
  body('latitud').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }).withMessage('Latitud inválida.'),
  body('longitud').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida.'),
];

const crearValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ max: 150 }).withMessage('El nombre admite máximo 150 caracteres.'),
  body('tipo').isIn(TIPOS).withMessage('Tipo inválido.'),
  ...camposContacto(false),
  ...camposOpcionales,
];

const actualizarValidators = [
  param('id').isInt({ min: 1 }),
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede quedar vacío.')
    .isLength({ max: 150 }).withMessage('El nombre admite máximo 150 caracteres.'),
  body('tipo').optional().isIn(TIPOS).withMessage('Tipo inválido.'),
  ...camposContacto(true),
  ...camposOpcionales,
];

// GET público: directorio y mapa (HU-27)
router.get('/', entidadAliadaController.listar);
// Gestión solo para administradores
router.post('/', soloAdmin, crearValidators, entidadAliadaController.crear);
router.put('/:id', soloAdmin, actualizarValidators, entidadAliadaController.actualizar);
router.delete('/:id', soloAdmin, param('id').isInt({ min: 1 }), entidadAliadaController.eliminar);

module.exports = router;
