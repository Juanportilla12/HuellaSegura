const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = Router();

// Celular: 7 a 15 dígitos, opcionalmente con + inicial, espacios o guiones
const CELULAR_REGEX = /^\+?[0-9][0-9\s-]{6,18}$/;

const registerValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.'),
  body('celular')
    .trim()
    .matches(CELULAR_REGEX)
    .withMessage('Ingresa un número de celular válido.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
];

// POST /api/auth/register
router.post('/register', registerValidators, authController.register);

// POST /api/auth/login
router.post('/login', loginValidators, authController.login);

// POST /api/auth/logout  (requiere token válido)
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me  (requiere token válido)
router.get('/me', authenticate, authController.me);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.')],
  authController.forgotPassword
);

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code',
  [
    body('email').isEmail().normalizeEmail().withMessage('Correo inválido.'),
    body('codigo').isLength({ min: 6, max: 6 }).isNumeric().withMessage('El código debe tener 6 dígitos.'),
  ],
  authController.verifyResetCode
);

// POST /api/auth/reset-password
router.post('/reset-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Correo inválido.'),
    body('codigo').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Código inválido.'),
    body('nuevaPassword').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
  ],
  authController.resetPassword
);

module.exports = router;
