const { Router } = require('express');
const { body } = require('express-validator');
const usuarioController = require('../controllers/usuarioController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = Router();
router.use(authenticate);

router.put(
  '/radio-alerta',
  [body('radio_alerta').isInt({ min: 1, max: 10 }).withMessage('El radio debe estar entre 1 y 10 km.')],
  usuarioController.actualizarRadioAlerta
);

router.put(
  '/ubicacion',
  [
    body('latitud').isFloat({ min: -90, max: 90 }).withMessage('Latitud inválida.'),
    body('longitud').isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida.'),
  ],
  usuarioController.actualizarUbicacion
);

// DELETE /api/usuarios/ubicacion — retira el consentimiento de ubicación
router.delete('/ubicacion', usuarioController.desactivarUbicacion);

// PUT /api/usuarios/foto
router.put('/foto', upload.single('foto'), usuarioController.actualizarFoto);

// PUT /api/usuarios/perfil
router.put(
  '/perfil',
  [
    body('nombre').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('celular').optional({ values: 'falsy' }).trim()
      .matches(/^\+?[0-9][0-9\s-]{6,18}$/).withMessage('Ingresa un número de celular válido.'),
  ],
  usuarioController.actualizarPerfil
);

// DELETE /api/usuarios/cuenta — requiere confirmar la contraseña
router.delete(
  '/cuenta',
  [body('password').notEmpty().withMessage('Confirma tu contraseña.')],
  usuarioController.eliminarCuenta
);

module.exports = router;
