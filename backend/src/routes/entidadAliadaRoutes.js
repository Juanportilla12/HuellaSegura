const { Router } = require('express');
const { body } = require('express-validator');
const entidadAliadaController = require('../controllers/entidadAliadaController');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');

const soloAdmin = [authenticate, requireAdmin];

const router = Router();

const validators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('tipo').isIn(['veterinaria', 'albergue', 'otro']).withMessage('Tipo inválido.'),
];

router.get('/', entidadAliadaController.listar);
router.post('/', soloAdmin, validators, entidadAliadaController.crear);
router.put('/:id', soloAdmin, entidadAliadaController.actualizar);

module.exports = router;
