const { Router } = require('express');
const perfilPublicoController = require('../controllers/perfilPublicoController');
const { autenticacionOpcional } = require('../middlewares/authMiddleware');

const router = Router();

// GET /api/publico/mascotas/:codigo — sin autenticación (código público del QR)
// Si quien lo abre es el dueño (sesión iniciada), se indica para no ofrecerle "¡La vi!"
router.get('/mascotas/:codigo', autenticacionOpcional, perfilPublicoController.obtenerPerfil);

// GET /api/publico/compartir/mascotas/:codigo — vista previa para redes sociales
router.get('/compartir/mascotas/:codigo', perfilPublicoController.paginaCompartir);

module.exports = router;
