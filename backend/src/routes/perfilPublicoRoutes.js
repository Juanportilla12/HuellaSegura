const { Router } = require('express');
const perfilPublicoController = require('../controllers/perfilPublicoController');

const router = Router();

// GET /api/publico/mascotas/:codigo — sin autenticación (código público del QR)
router.get('/mascotas/:codigo', perfilPublicoController.obtenerPerfil);

// GET /api/publico/compartir/mascotas/:codigo — vista previa para redes sociales
router.get('/compartir/mascotas/:codigo', perfilPublicoController.paginaCompartir);

module.exports = router;
