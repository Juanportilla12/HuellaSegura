
const { Router } = require('express');
const { body, param } = require('express-validator');
const mascotaController = require('../controllers/mascotaController');
const { cartelMascota } = require('../controllers/pdfController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { uploadVideo } = require('../middlewares/uploadMiddleware');
const { validarId } = require('../middlewares/validarId');

const router = Router();

// Toda ruta con :id exige un entero positivo (400 si no lo es)
router.param('id', validarId);

const crearValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('especie')
    .isIn(['perro', 'gato', 'ave', 'reptil', 'otro'])
    .withMessage('Especie inválida. Valores: perro, gato, ave, reptil, otro.'),
  body('sexo')
    .isIn(['macho', 'hembra'])
    .withMessage('Sexo inválido. Valores: macho, hembra.'),
  body('color').trim().notEmpty().withMessage('El color es obligatorio.'),
  // Límites de las columnas: sin esto MySQL rechaza el valor y la API responde 500
  body('color').isLength({ max: 100 }).withMessage('El color admite máximo 100 caracteres.'),
  body('raza').optional({ values: 'falsy' }).isLength({ max: 100 }).withMessage('La raza admite máximo 100 caracteres.'),
  body('microchip').optional({ values: 'falsy' }).isLength({ max: 100 }).withMessage('El microchip admite máximo 100 caracteres.'),
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

// PUT /api/mascotas/:id/fotos  (quitar o reordenar fotos; la primera es la principal)
router.put('/:id/fotos', [
  body('foto_urls').isArray({ max: 5 }).withMessage('foto_urls debe ser una lista de máximo 5 fotos.'),
  body('foto_urls.*').isString().withMessage('Cada foto debe ser una URL.'),
], mascotaController.ordenarFotos);

// DELETE /api/mascotas/:id/video
router.delete('/:id/video', mascotaController.quitarVideo);

// POST /api/mascotas/:id/video  (1 video, máx. 30 MB)
router.post('/:id/video', param('id').isInt({ min: 1 }), uploadVideo.single('video'), mascotaController.subirVideo);

// GET /api/mascotas/:id/qr
router.get('/:id/qr', param('id').isInt({ min: 1 }), mascotaController.descargarQR);

// GET /api/mascotas/:id/cartel-pdf
router.get('/:id/cartel-pdf', param('id').isInt({ min: 1 }), cartelMascota);

module.exports = router;
