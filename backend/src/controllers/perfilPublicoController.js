const { Mascota, Usuario, Reporte } = require('../models');

async function obtenerPerfil(req, res, next) {
  try {
    const mascota = await Mascota.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'especie', 'raza', 'sexo', 'color', 'descripcion', 'microchip', 'foto_urls'],
      include: [{ model: Usuario, as: 'propietario', attributes: ['id', 'nombre', 'celular'] }],
    });

    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    const reporteActivo = await Reporte.findOne({
      where: { mascota_id: mascota.id, estado: 'en_busqueda' },
      attributes: ['id', 'latitud', 'longitud', 'descripcion', 'fecha_perdida'],
    });

    return res.status(200).json({
      success: true,
      mascota: {
        id: mascota.id,
        nombre: mascota.nombre,
        especie: mascota.especie,
        raza: mascota.raza,
        sexo: mascota.sexo,
        color: mascota.color,
        descripcion: mascota.descripcion,
        foto_urls: mascota.foto_urls || [],
        foto_principal: (mascota.foto_urls || [])[0] || null,
      },
      // Ley 1581: solo el primer nombre y el número de contacto; nunca el correo
      propietario: {
        nombre: (mascota.propietario.nombre || '').split(' ')[0],
        telefono: mascota.propietario.celular || null,
      },
      reporte_activo: reporteActivo
        ? {
            id: reporteActivo.id,
            latitud: parseFloat(reporteActivo.latitud),
            longitud: parseFloat(reporteActivo.longitud),
            descripcion: reporteActivo.descripcion,
            fecha_perdida: reporteActivo.fecha_perdida,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPerfil };
