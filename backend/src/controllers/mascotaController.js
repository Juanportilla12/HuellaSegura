const { validationResult } = require('express-validator');
const { Mascota } = require('../models');
const { uploadBuffer } = require('../config/cloudinary');
const { generarQR } = require('../services/qrService');
const { eliminarArchivos, archivosDeMascotas } = require('../services/archivosService');
const { descargaAdjunta } = require('../utils/nombreArchivo');

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

    // Se reúnen los archivos antes de borrar (los avistamientos se eliminan en cascada)
    const archivos = await archivosDeMascotas([mascota]).catch(() => []);
    await mascota.destroy();
    eliminarArchivos(archivos).catch(() => {});

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

    // El índice evita que fotos subidas en el mismo milisegundo compartan public_id y se sobrescriban
    const marca = Date.now();
    const resultados = await Promise.all(
      archivos.map((archivo, i) =>
        uploadBuffer(archivo.buffer, {
          public_id: `mascota-${mascota.id}-${marca}-${i}`,
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

/**
 * Edición de fotos: recibe la lista final en el orden deseado (la primera es la
 * principal). Solo admite fotos que la mascota ya tiene; las que no vengan en la
 * lista se quitan y se borran de Cloudinary.
 */
async function ordenarFotos(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    const actuales = mascota.foto_urls || [];
    const nuevas = req.body.foto_urls;
    const soloActuales = nuevas.every((url) => actuales.includes(url));
    if (!soloActuales || new Set(nuevas).size !== nuevas.length) {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes conservar o reordenar las fotos que ya tiene la mascota.',
      });
    }

    const quitadas = actuales.filter((url) => !nuevas.includes(url));
    await mascota.update({ foto_urls: nuevas });
    eliminarArchivos(quitadas).catch(() => {});

    return res.status(200).json({ success: true, message: 'Fotos actualizadas.', foto_urls: nuevas });
  } catch (error) {
    next(error);
  }
}

// Quita el video de la mascota (y lo borra de Cloudinary)
async function quitarVideo(req, res, next) {
  try {
    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    const anterior = mascota.video_url;
    if (anterior) {
      await mascota.update({ video_url: null });
      eliminarArchivos([anterior]).catch(() => {});
    }
    return res.status(200).json({ success: true, message: 'Video eliminado.' });
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
    const { buffer } = await generarQR(mascota.codigo_publico);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': descargaAdjunta('qr', mascota.nombre, 'png'),
    });
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crear, listar, obtener, actualizar, eliminar, subirFotos, ordenarFotos, subirVideo, quitarVideo, descargarQR,
};
