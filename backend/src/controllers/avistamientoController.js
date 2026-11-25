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
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { mascota_id, latitud, longitud, descripcion, nombre_testigo, email_testigo, telefono_testigo } = req.body;

    const mascota = await Mascota.findByPk(mascota_id, {
      include: [{ model: Usuario, as: 'propietario', attributes: ['id', 'nombre', 'email'] }],
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }
    // El dueño no reporta avistamientos de su propia mascota
    if (req.usuario && req.usuario.id === mascota.propietario.id) {
      return res.status(400).json({
        success: false,
        message: 'Esta mascota es tuya. Si la encontraste, marca su reporte como "¡La encontré!" en Mis reportes.',
      });
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
      usuario_id: req.usuario?.id || null, // así aparece en "Mis reportes" de quien lo hizo
      latitud,
      longitud,
      descripcion: descripcion || null,
      foto_url,
      nombre_testigo: nombre_testigo || req.usuario?.nombre || null,
      email_testigo: email_testigo || null,
      telefono_testigo,
    });

    // Notificación in-app al propietario
    await Notificacion.create({
      usuario_id: mascota.propietario.id,
      reporte_id: reporteActivo?.id || null,
      avistamiento_id: avistamiento.id, // para mostrar dónde la vieron, no dónde se perdió
      mensaje: `¡Alguien vio a ${mascota.nombre}! Contacta a quien la vio al ${telefono_testigo}. Toca para ver dónde la vio.`,
      tipo: 'avistamiento',
    });

    // Notificación SSE en tiempo real al propietario
    notificarUsuario(mascota.propietario.id, 'avistamiento', {
      mensaje: `¡Alguien vio a ${mascota.nombre}! Revisa el mapa.`,
      mascota_id: mascota.id,
      mascota_nombre: mascota.nombre,
      avistamiento_id: avistamiento.id,
      latitud, longitud,
    });

    // Correo al propietario (no bloquea la respuesta)
    if (recientes === 0) enviarCorreoAvistamiento({
      propietario: { email: mascota.propietario.email, nombre: mascota.propietario.nombre },
      mascota: { nombre: mascota.nombre },
      avistamiento: { latitud, longitud, descripcion, nombre_testigo, telefono_testigo, foto_url },
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

// Avistamientos que reportó el usuario con sesión iniciada ("Mis reportes")
async function misAvistamientos(req, res, next) {
  try {
    const avistamientos = await Avistamiento.findAll({
      where: { usuario_id: req.usuario.id },
      attributes: ['id', 'latitud', 'longitud', 'descripcion', 'foto_url', 'created_at'],
      include: [
        { model: Mascota, as: 'mascota', attributes: ['id', 'nombre', 'especie', 'sexo', 'foto_urls', 'codigo_publico'] },
        { model: Reporte, as: 'reporte', attributes: ['id', 'estado'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    return res.status(200).json({ success: true, avistamientos });
  } catch (error) {
    next(error);
  }
}

module.exports = { crear, misAvistamientos };
