
const { Router } = require('express');
const { body, param } = require('express-validator');
const mascotaController = require('../controllers/mascotaController');
const { cartelMascota } = require('../controllers/pdfController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { uploadVideo } = require('../middlewares/uploadMiddleware');

const router = Router();

const crearValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('especie')
    .isIn(['perro', 'gato', 'ave', 'reptil', 'otro'])
    .withMessage('Especie inválida. Valores: perro, gato, ave, reptil, otro.'),
  body('sexo')
    .isIn(['macho', 'hembra'])
    .withMessage('Sexo inválido. Valores: macho, hembra.'),
  body('color').trim().notEmpty().withMessage('El color es obligatorio.'),
  body('edad').optional().isInt({ min: 0 }).withMessage('La edad debe ser un número positivo.'),
  body('edad_unidad').optional().isIn(['meses', 'años']).withMessage('Unidad inválida.'),
];

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/mascotas
router.post('/', crearValidators, mascotaController.crear);

// GET /api/mascotas
router.get('/', mascotaController.listar);

// GET /api/mascotas/:id
router.get('/:id', param('id').isInt({ min: 1 }), mascotaController.obtener);

// PUT /api/mascotas/:id
router.put('/:id', crearValidators, mascotaController.actualizar);

// DELETE /api/mascotas/:id
router.delete('/:id', param('id').isInt({ min: 1 }), mascotaController.eliminar);

// POST /api/mascotas/:id/fotos  (max 5 archivos por llamada)
router.post('/:id/fotos', upload.array('fotos', 5), mascotaController.subirFotos);

// POST /api/mascotas/:id/video  (1 video, máx. 30 MB)
router.post('/:id/video', param('id').isInt({ min: 1 }), uploadVideo.single('video'), mascotaController.subirVideo);

// GET /api/mascotas/:id/qr
router.get('/:id/qr', param('id').isInt({ min: 1 }), mascotaController.descargarQR);

// GET /api/mascotas/:id/cartel-pdf
router.get('/:id/cartel-pdf', param('id').isInt({ min: 1 }), cartelMascota);

module.exports = router;
