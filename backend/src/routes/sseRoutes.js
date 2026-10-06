const { Router } = require('express');
const { authenticateSSE } = require('../middlewares/authMiddleware');
const { registrarCliente, eliminarCliente, enviarEvento } = require('../services/tiempoRealService');

const router = Router();

// GET /api/sse/eventos — conexión de tiempo real del cliente
router.get('/eventos', authenticateSSE, (req, res) => {
  const usuarioId = req.usuario.id;

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Heartbeat cada 25 s para mantener la conexión viva
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  enviarEvento(res, 'conectado', { mensaje: 'Conectado a HuellaSegura en tiempo real' });
  registrarCliente(usuarioId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    eliminarCliente(usuarioId, res);
  });
});

module.exports = router;
