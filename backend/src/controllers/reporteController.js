const { validationResult } = require('express-validator');
const { Reporte, Mascota, Usuario } = require('../models');
const { generarNotificacionesProximidad } = require('../services/notificacionService');
const { enviarCorreoReporteCreado } = require('../services/emailService');

async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { mascota_id, latitud, longitud, descripcion, fecha_perdida } = req.body;

    // Verificar que la mascota pertenece al usuario
    const mascota = await Mascota.findOne({ where: { id: mascota_id } });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }
    if (mascota.usuario_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No puedes crear un reporte para una mascota que no te pertenece.',
      });
    }

    const reporte = await Reporte.create({
      mascota_id,
      usuario_id: req.usuario.id,
      latitud,
      longitud,
      descripcion: descripcion || null,
      estado: 'en_busqueda',
      fecha_perdida,
    });

    // Disparar notificaciones y correo en background (no bloquean la respuesta)
    generarNotificacionesProximidad(reporte, mascota.nombre).catch(console.error);
    enviarCorreoReporteCreado({
      propietario: { email: req.usuario.email, nombre: req.usuario.nombre },
      mascota: { nombre: mascota.nombre, especie: mascota.especie, foto_principal: (mascota.foto_urls || [])[0] || null },
      reporte: { fecha_perdida: reporte.fecha_perdida },
    }).catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Reporte creado exitosamente.',
      reporte: reporte.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function listarActivos(req, res, next) {
  try {
    const reportes = await Reporte.findAll({
      where: { estado: 'en_busqueda', moderado: false },
      include: [
        { model: Mascota,  as: 'mascota',    attributes: ['id', 'codigo_publico', 'nombre', 'especie', 'raza', 'sexo', 'color', 'foto_urls'] },
        { model: Usuario,  as: 'reportante', attributes: ['id', 'nombre'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      reportes: reportes.map((r) => r.toPublicJSON()),
    });
  } catch (error) {
    next(error);
  }
}

async function misReportes(req, res, next) {
  try {
    const reportes = await Reporte.findAll({
      where: { usuario_id: req.usuario.id },
      include: [{ model: Mascota, as: 'mascota', attributes: ['id', 'codigo_publico', 'nombre', 'especie', 'foto_urls'] }],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      reportes: reportes.map((r) => r.toPublicJSON()),
    });
  } catch (error) {
    next(error);
  }
}

async function cambiarEstado(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { estado } = req.body;
    const reporte = await Reporte.findByPk(req.params.id);

    if (!reporte) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado.' });
    }

    if (reporte.usuario_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este reporte.',
      });
    }

    await reporte.update({ estado });

    return res.status(200).json({
      success: true,
      message: `Estado actualizado a "${estado}".`,
      reporte: reporte.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { crear, listarActivos, misReportes, cambiarEstado };
