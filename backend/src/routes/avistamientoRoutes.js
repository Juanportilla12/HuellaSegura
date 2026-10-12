const { Router } = require('express');
const { body } = require('express-validator');
const avistamientoController = require('../controllers/avistamientoController');
const upload = require('../middlewares/uploadMiddleware');
const { limitadorAvistamientos } = require('../middlewares/rateLimiters');
const { CELULAR_REGEX } = require('../utils/validaciones');

const router = Router();

const crearValidators = [
  body('mascota_id').isInt({ min: 1 }).withMessage('La mascota es obligatoria.'),
  body('latitud').isFloat({ min: -90,  max: 90  }).withMessage('Latitud inválida.'),
  body('longitud').isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida.'),
  // El dueño necesita una forma de contactar al testigo y una foto para confirmar que es su mascota
  body('telefono_testigo')
    .trim()
    .notEmpty().withMessage('Tu número de celular es obligatorio.')
    .bail()
    .matches(CELULAR_REGEX).withMessage('Ingresa un número de celular válido.'),
  body('foto').custom((_valor, { req }) => Boolean(req.file)).withMessage('La foto es obligatoria.'),
  body('email_testigo').optional({ values: 'falsy' }).isEmail().withMessage('Email inválido.'),
];

// POST /api/avistamientos — público, sin autenticación
router.post('/', limitadorAvistamientos, upload.single('foto'), crearValidators, avistamientoController.crear);

module.exports = router;
