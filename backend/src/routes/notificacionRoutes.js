const { Router } = require('express');
const notificacionController = require('../controllers/notificacionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validarId } = require('../middlewares/validarId');

const router = Router();

// Toda ruta con :id exige un entero positivo (400 si no lo es)
router.param('id', validarId);
router.use(authenticate);

router.get('/',                   notificacionController.listar);
router.put('/leer-todas',         notificacionController.marcarTodasLeidas);
router.put('/:id/leer',           notificacionController.marcarLeida);

module.exports = router;
