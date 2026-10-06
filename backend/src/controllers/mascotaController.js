const { validationResult } = require('express-validator');
const { Mascota } = require('../models');
const { uploadBuffer } = require('../config/cloudinary');
const { generarQR } = require('../services/qrService');

const MAX_FOTOS = 5;

async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, especie, raza, edad, edad_unidad, sexo, color, descripcion, microchip } =
      req.body;

    const mascota = await Mascota.create({
      usuario_id: req.usuario.id,
      nombre,
      especie,
      raza: raza || null,
      edad: edad ? parseInt(edad, 10) : null,
      edad_unidad: edad_unidad || 'años',
      sexo,
      color,
      descripcion: descripcion || null,
      microchip: microchip || null,
      foto_urls: [],
    });

    return res.status(201).json({
      success: true,
      message: 'Mascota registrada exitosamente.',
      mascota: mascota.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function listar(req, res, next) {
  try {
    const mascotas = await Mascota.findAll({
      where: { usuario_id: req.usuario.id },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      mascotas: mascotas.map((m) => m.toPublicJSON()),
    });
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });

    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    return res.status(200).json({ success: true, mascota: mascota.toPublicJSON() });
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mascota = await Mascota.findOne({
      where: { id: req.params.id },
    });

    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    if (mascota.usuario_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta mascota.',
      });
    }

    const campos = ['nombre', 'especie', 'raza', 'edad', 'edad_unidad', 'sexo', 'color',
      'descripcion', 'microchip'];

    campos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        mascota[campo] = req.body[campo];
      }
    });

    await mascota.save();

    return res.status(200).json({
      success: true,
      message: 'Mascota actualizada correctamente.',
      mascota: mascota.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const mascota = await Mascota.findOne({ where: { id: req.params.id } });

    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    if (mascota.usuario_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta mascota.',
      });
    }

    await mascota.destroy();

    return res.status(200).json({ success: true, message: 'Mascota eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
}

async function subirFotos(req, res, next) {
  try {
    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });

    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    const fotosActuales = mascota.foto_urls || [];
    const archivos = req.files || [];

    if (archivos.length === 0) {
      return res.status(400).json({ success: false, message: 'No se enviaron archivos.' });
    }

    if (fotosActuales.length + archivos.length > MAX_FOTOS) {
      return res.status(400).json({
        success: false,
        message: `Solo se permiten hasta ${MAX_FOTOS} fotos por mascota. Ya tiene ${fotosActuales.length}.`,
      });
    }

    const resultados = await Promise.all(
      archivos.map((archivo) =>
        uploadBuffer(archivo.buffer, {
          public_id: `mascota-${mascota.id}-${Date.now()}`,
          resource_type: 'image',
        })
      )
    );

    const nuevasUrls = [...fotosActuales, ...resultados.map((r) => r.secure_url)];
    await mascota.update({ foto_urls: nuevasUrls });

    return res.status(200).json({
      success: true,
      message: 'Fotos subidas exitosamente.',
      foto_urls: nuevasUrls,
    });
  } catch (error) {
    next(error);
  }
}

// R5 cargaVideos: sube (o reemplaza) el video de la mascota en Cloudinary
async function subirVideo(req, res, next) {
  try {
    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún video.' });
    }

    const resultado = await uploadBuffer(req.file.buffer, {
      folder: 'huella-segura/videos',
      public_id: `mascota-${mascota.id}`,
      overwrite: true,
      resource_type: 'video',
    });

    await mascota.update({ video_url: resultado.secure_url });

    return res.status(200).json({
      success: true,
      message: 'Video subido exitosamente.',
      video_url: resultado.secure_url,
    });
  } catch (error) {
    next(error);
  }
}

async function descargarQR(req, res, next) {
  try {
    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }
    const { buffer, url } = await generarQR(mascota.id);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-${mascota.nombre.replace(/\s+/g, '-')}.png"`,
    });
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
}

module.exports = { crear, listar, obtener, actualizar, eliminar, subirFotos, subirVideo, descargarQR };
