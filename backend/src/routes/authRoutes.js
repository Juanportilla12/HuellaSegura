const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { CELULAR_REGEX } = require('../utils/validaciones');
const { limitadorAuth } = require('../middlewares/rateLimiters');

const router = Router();

const registerValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.')
    .bail()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
  body('email').trim().notEmpty().withMessage('El correo es obligatorio.')
    .bail()
    .isEmail().withMessage('Ingresa un correo válido.')
    .normalizeEmail(),
  body('celular')
    .trim()
    .notEmpty().withMessage('El celular es obligatorio.')
    .bail()
    .matches(CELULAR_REGEX)
    .withMessage('Ingresa un número de celular válido.'),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .bail()
    .isLength({ min: 8, max: 100 })
    .withMessage('La contraseña debe tener entre 8 y 100 caracteres.'),
];

const loginValidators = [
  body('email').trim().notEmpty().withMessage('El correo es obligatorio.')
    .bail()
    .isEmail().withMessage('Ingresa un correo válido.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
];

// POST /api/auth/register
router.post('/register', limitadorAuth, registerValidators, authController.register);

const validarEmail = body('email').trim().notEmpty().withMessage('El correo es obligatorio.')
  .bail().isEmail().withMessage('Ingresa un correo válido.').normalizeEmail();

// POST /api/auth/verificar-correo — activa la cuenta con el código enviado al correo
router.post('/verificar-correo', limitadorAuth,
  [
    validarEmail,
    body('codigo').isLength({ min: 6, max: 6 }).isNumeric().withMessage('El código debe tener 6 dígitos.'),
  ],
  authController.verificarCorreo
);

// POST /api/auth/reenviar-verificacion — un código nuevo para una cuenta pendiente
router.post('/reenviar-verificacion', limitadorAuth, [validarEmail], authController.reenviarVerificacion);

// POST /api/auth/no-fui-yo — enlace "¿No fuiste tú?" de los correos con código
router.post('/no-fui-yo', limitadorAuth,
  [body('clave').isString().matches(/^[a-f0-9]{64}$/).withMessage('Enlace no válido.')],
  authController.anularCodigo
);

// POST /api/auth/login
router.post('/login', limitadorAuth, loginValidators, authController.login);

// POST /api/auth/logout  (requiere token válido)
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me  (requiere token válido)
router.get('/me', authenticate, authController.me);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  limitadorAuth,
  [body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.')],
  authController.forgotPassword
);

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code',
  limitadorAuth,
  [
    body('email').isEmail().normalizeEmail().withMessage('Correo inválido.'),
    body('codigo').isLength({ min: 6, max: 6 }).isNumeric().withMessage('El código debe tener 6 dígitos.'),
  ],
  authController.verifyResetCode
);

// POST /api/auth/reset-password
router.post('/reset-password',
  limitadorAuth,
  [
    body('email').isEmail().normalizeEmail().withMessage('Correo inválido.'),
    body('codigo').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Código inválido.'),
    body('nuevaPassword').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
  ],
  authController.resetPassword
);

module.exports = router;
