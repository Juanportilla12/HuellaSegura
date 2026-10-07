const { cloudinary } = require('../config/cloudinary');
const { Mascota, Avistamiento } = require('../models');

// https://res.cloudinary.com/<cloud>/<image|video>/upload/v123/<public_id>.<ext>
const URL_CLOUDINARY = /\/(image|video)\/upload\/(?:v\d+\/)?(.+?)\.[a-z0-9]+$/i;

function datosDesdeUrl(url) {
  const m = URL_CLOUDINARY.exec(url || '');
  return m ? { tipo: m[1].toLowerCase(), publicId: m[2] } : null;
}

/**
 * Ley 1581: al eliminar datos también se borran los archivos en Cloudinary.
 * Nunca lanza error: un fallo al borrar un archivo se registra y no impide
 * que se completen el resto ni la operación principal.
 */
async function eliminarArchivos(urls) {
  const archivos = [...new Set(urls.filter(Boolean))].map(datosDesdeUrl).filter(Boolean);
  const resultados = await Promise.allSettled(
    archivos.map(({ tipo, publicId }) => cloudinary.uploader.destroy(publicId, { resource_type: tipo }))
  );
  resultados.forEach((r, i) => {
    if (r.status === 'rejected') console.error('[Cloudinary] No se pudo borrar', archivos[i].publicId, r.reason?.message);
  });
  return resultados.filter((r) => r.status === 'fulfilled').length;
}

// Fotos, video y fotos de avistamientos de las mascotas indicadas
async function archivosDeMascotas(mascotas) {
  if (mascotas.length === 0) return [];
  const avistamientos = await Avistamiento.findAll({
    where: { mascota_id: mascotas.map((m) => m.id) },
    attributes: ['foto_url'],
  });
  return [
    ...mascotas.flatMap((m) => [...(m.foto_urls || []), m.video_url]),
    ...avistamientos.map((a) => a.foto_url),
  ];
}

// Todos los archivos de un usuario (foto de perfil + los de sus mascotas)
async function archivosDeUsuario(usuario) {
  const mascotas = await Mascota.findAll({
    where: { usuario_id: usuario.id },
    attributes: ['id', 'foto_urls', 'video_url'],
  });
  return [usuario.foto_url, ...(await archivosDeMascotas(mascotas))];
}

module.exports = { eliminarArchivos, archivosDeMascotas, archivosDeUsuario, datosDesdeUrl };
