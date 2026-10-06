const { Router } = require('express');
const { body, param } = require('express-validator');
const entidadAliadaController = require('../controllers/entidadAliadaController');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');

const soloAdmin = [authenticate, requireAdmin];

const router = Router();

const TIPOS = ['veterinaria', 'albergue', 'otro'];

const camposOpcionales = [
  body('direccion').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('telefono').optional({ values: 'falsy' }).isLength({ max: 20 }).withMessage('Teléfono demasiado largo.'),
  body('horario').optional({ values: 'falsy' }).isLength({ max: 150 }).withMessage('Horario demasiado largo.'),
  body('latitud').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }).withMessage('Latitud inválida.'),
  body('longitud').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida.'),
];

const crearValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('tipo').isIn(TIPOS).withMessage('Tipo inválido.'),
  ...camposOpcionales,
];

const actualizarValidators = [
  param('id').isInt({ min: 1 }),
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede quedar vacío.'),
  body('tipo').optional().isIn(TIPOS).withMessage('Tipo inválido.'),
  ...camposOpcionales,
];

// GET público: directorio y mapa (HU-27)
router.get('/', entidadAliadaController.listar);
// Gestión solo para administradores
router.post('/', soloAdmin, crearValidators, entidadAliadaController.crear);
router.put('/:id', soloAdmin, actualizarValidators, entidadAliadaController.actualizar);
router.delete('/:id', soloAdmin, param('id').isInt({ min: 1 }), entidadAliadaController.eliminar);

module.exports = router;
