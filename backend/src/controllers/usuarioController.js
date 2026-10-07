const { validationResult } = require('express-validator');
const { uploadBuffer } = require('../config/cloudinary');
const { eliminarArchivos, archivosDeUsuario } = require('../services/archivosService');

async function actualizarRadioAlerta(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { radio_alerta } = req.body;
    await req.usuario.update({ radio_alerta });
    return res.status(200).json({
      success: true,
      message: `Radio de alerta actualizado a ${radio_alerta} km.`,
      radio_alerta,
    });
  } catch (error) { next(error); }
}

async function actualizarUbicacion(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { latitud, longitud } = req.body;
    await req.usuario.update({ ubicacion_lat: latitud, ubicacion_lng: longitud });
    return res.status(200).json({ success: true, message: 'Ubicación actualizada.' });
  } catch (error) { next(error); }
}

async function actualizarFoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen.' });
    }

    const resultado = await uploadBuffer(req.file.buffer, {
      folder: 'huella-segura/perfiles',
      public_id: `perfil_${req.usuario.id}`,
      overwrite: true,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });

    await req.usuario.update({ foto_url: resultado.secure_url });

    return res.status(200).json({
      success: true,
      message: 'Foto de perfil actualizada.',
      foto_url: resultado.secure_url,
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarPerfil(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { nombre, celular } = req.body;
    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (celular !== undefined) cambios.celular = celular || null;
    await req.usuario.update(cambios);
    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado.',
      usuario: req.usuario.toPublicJSON(),
    });
  } catch (error) { next(error); }
}

// Retira el consentimiento de ubicación: se borra y se dejan de recibir alertas
async function desactivarUbicacion(req, res, next) {
  try {
    await req.usuario.update({ ubicacion_lat: null, ubicacion_lng: null });
    return res.status(200).json({ success: true, message: 'Ubicación eliminada. Alertas desactivadas.' });
  } catch (error) { next(error); }
}

// Ley 1581: el titular puede solicitar la eliminación de sus datos.
// Las mascotas, reportes, avistamientos y notificaciones se eliminan en cascada.
async function eliminarCuenta(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const passwordValida = await req.usuario.verificarPassword(req.body.password);
    if (!passwordValida) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }
    const archivos = await archivosDeUsuario(req.usuario).catch(() => []);
    await req.usuario.destroy();
    // Fotos y videos en Cloudinary (no bloquea la respuesta)
    eliminarArchivos(archivos).catch(() => {});
    return res.status(200).json({ success: true, message: 'Tu cuenta y tus datos fueron eliminados.' });
  } catch (error) { next(error); }
}

module.exports = {
  actualizarRadioAlerta, actualizarUbicacion, actualizarFoto,
  actualizarPerfil, desactivarUbicacion, eliminarCuenta,
};
