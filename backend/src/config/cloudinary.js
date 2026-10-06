const cloudinary = require('cloudinary').v2;

// Se eliminan espacios accidentales al copiar los valores en el panel del hosting
const limpiar = (valor) => (valor || '').trim();

cloudinary.config({
  cloud_name: limpiar(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: limpiar(process.env.CLOUDINARY_API_KEY),
  api_secret: limpiar(process.env.CLOUDINARY_API_SECRET),
});

function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'huella-segura/mascotas', ...options },
        (error, result) => {
          if (!error) return resolve(result);
          // Error del servicio externo: se registra el detalle y se responde 502
          console.error('[Cloudinary]', error.http_code || '', error.message);
          const fallo = new Error('No se pudo subir el archivo al servicio de almacenamiento. Intenta más tarde.');
          fallo.status = 502;
          reject(fallo);
        }
      )
      .end(buffer);
  });
}

function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { cloudinary, uploadBuffer, deleteImage };
