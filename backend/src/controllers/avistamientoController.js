const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Avistamiento, Mascota, Reporte, Notificacion, Usuario } = require('../models');
const { uploadBuffer } = require('../config/cloudinary');
const { enviarCorreoAvistamiento } = require('../services/emailService');
const { notificarUsuario } = require('../services/tiempoRealService');

async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { mascota_id, latitud, longitud, descripcion, nombre_testigo, email_testigo } = req.body;

    const mascota = await Mascota.findByPk(mascota_id, {
      include: [{ model: Usuario, as: 'propietario', attributes: ['id', 'nombre', 'email'] }],
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    const reporteActivo = await Reporte.findOne({
      where: { mascota_id, estado: 'en_busqueda' },
    });

    // Como máximo un correo por mascota cada 10 minutos: los avistamientos
    // siguientes llegan como notificación interna (evita saturar al dueño).
    const VENTANA_CORREO_MS = 10 * 60 * 1000;
    const recientes = await Avistamiento.count({
      where: { mascota_id, created_at: { [Op.gte]: new Date(Date.now() - VENTANA_CORREO_MS) } },
    });

    let foto_url = null;
    if (req.file) {
      const resultado = await uploadBuffer(req.file.buffer, { folder: 'huella-segura/avistamientos' });
      foto_url = resultado.secure_url;
    }

    const avistamiento = await Avistamiento.create({
      mascota_id,
      reporte_id: reporteActivo?.id || null,
      latitud,
      longitud,
      descripcion: descripcion || null,
      foto_url,
      nombre_testigo: nombre_testigo || null,
      email_testigo: email_testigo || null,
    });

    // Notificación in-app al propietario
    await Notificacion.create({
      usuario_id: mascota.propietario.id,
      reporte_id: reporteActivo?.id || null,
      mensaje: `¡Alguien vio a ${mascota.nombre}! Se registró un avistamiento cerca de lat:${parseFloat(latitud).toFixed(4)}, lng:${parseFloat(longitud).toFixed(4)}.`,
      tipo: 'avistamiento',
    });

    // Notificación SSE en tiempo real al propietario
    notificarUsuario(mascota.propietario.id, 'avistamiento', {
      mensaje: `¡Alguien vio a ${mascota.nombre}! Revisa el mapa.`,
      mascota_id: mascota.id,
      mascota_nombre: mascota.nombre,
      latitud, longitud,
    });

    // Correo al propietario (no bloquea la respuesta)
    if (recientes === 0) enviarCorreoAvistamiento({
      propietario: { email: mascota.propietario.email, nombre: mascota.propietario.nombre },
      mascota: { nombre: mascota.nombre },
      avistamiento: { latitud, longitud, descripcion, nombre_testigo, foto_url },
    }).catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Avistamiento registrado. El propietario fue notificado.',
      avistamiento: { id: avistamiento.id },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { crear };
