const { Router } = require('express');
const { body } = require('express-validator');
const avistamientoController = require('../controllers/avistamientoController');
const upload = require('../middlewares/uploadMiddleware');
const { limitadorAvistamientos } = require('../middlewares/rateLimiters');

const router = Router();

const crearValidators = [
  body('mascota_id').isInt({ min: 1 }).withMessage('La mascota es obligatoria.'),
  body('latitud').isFloat({ min: -90,  max: 90  }).withMessage('Latitud inválida.'),
  body('longitud').isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida.'),
  body('email_testigo').optional().isEmail().withMessage('Email inválido.'),
];

// POST /api/avistamientos — público, sin autenticación
router.post('/', limitadorAvistamientos, upload.single('foto'), crearValidators, avistamientoController.crear);

module.exports = router;
