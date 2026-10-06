const { Router } = require('express');
const authRoutes         = require('./authRoutes');
const mascotaRoutes      = require('./mascotaRoutes');
const reporteRoutes      = require('./reporteRoutes');
const notificacionRoutes = require('./notificacionRoutes');
const usuarioRoutes      = require('./usuarioRoutes');
const avistamientoRoutes = require('./avistamientoRoutes');
const perfilPublicoRoutes= require('./perfilPublicoRoutes');
const sseRouter          = require('./sseRoutes');

const router = Router();

router.use('/auth',          authRoutes);
router.use('/mascotas',      mascotaRoutes);        // Sprint 2
router.use('/reportes',      reporteRoutes);        // Sprint 3
router.use('/notificaciones', notificacionRoutes);  // Sprint 5
router.use('/usuarios',      usuarioRoutes);        // Sprint 5
router.use('/avistamientos', avistamientoRoutes);   // Sprint 6
router.use('/publico',          perfilPublicoRoutes);   // Sprint 6
router.use('/admin',            require('./adminRoutes'));          // Sprint 7
router.use('/entidades-aliadas', require('./entidadAliadaRoutes')); // Sprint 7
router.use('/sse',              sseRouter);                         // Tiempo real

module.exports = router;
