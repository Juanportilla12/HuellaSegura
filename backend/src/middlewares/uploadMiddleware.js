const multer = require('multer');

const IMAGENES_PERMITIDAS = ['image/jpeg', 'image/jpg', 'image/png'];
const VIDEOS_PERMITIDOS   = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;  // 5 MB
const MAX_VIDEO_BYTES  = 30 * 1024 * 1024; // 30 MB

function crearFiltro(tiposPermitidos, mensaje) {
  return function fileFilter(req, file, cb) {
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(mensaje);
      error.tipoArchivoInvalido = true;
      cb(error, false);
    }
  };
}

const fileFilter = crearFiltro(IMAGENES_PERMITIDAS, 'Solo se permiten archivos JPG y PNG.');

// Imágenes (R4): fotos de mascotas, avistamientos y perfil
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_IMAGEN_BYTES },
});

// Videos (R5): un video corto por mascota
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  fileFilter: crearFiltro(VIDEOS_PERMITIDOS, 'Solo se permiten videos MP4, WebM o MOV.'),
  limits: { fileSize: MAX_VIDEO_BYTES },
});

module.exports = upload;
module.exports.fileFilter = fileFilter;
module.exports.uploadVideo = uploadVideo;
