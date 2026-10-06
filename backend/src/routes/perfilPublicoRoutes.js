const { Router } = require('express');
const perfilPublicoController = require('../controllers/perfilPublicoController');

const router = Router();

// GET /api/publico/mascotas/:id — sin autenticación
router.get('/mascotas/:id', perfilPublicoController.obtenerPerfil);

// GET /api/publico/compartir/mascotas/:id — vista previa para redes sociales
router.get('/compartir/mascotas/:id', perfilPublicoController.paginaCompartir);

module.exports = router;
