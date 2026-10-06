const { Mascota, Usuario, Reporte } = require('../models');

async function obtenerPerfil(req, res, next) {
  try {
    const mascota = await Mascota.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'especie', 'raza', 'sexo', 'color', 'descripcion', 'microchip', 'foto_urls', 'video_url'],
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
        video_url: mascota.video_url || null,
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

function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * HU-29: enlace para compartir en Facebook/WhatsApp con vista previa.
 * Los rastreadores de redes sociales no ejecutan JavaScript, por eso esta ruta
 * devuelve un HTML mínimo con etiquetas Open Graph y redirige al perfil público.
 */
async function paginaCompartir(req, res, next) {
  try {
    const mascota = await Mascota.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'especie', 'raza', 'color', 'foto_urls'],
    });
    if (!mascota) return res.status(404).send('Mascota no encontrada.');

    const reporteActivo = await Reporte.findOne({
      where: { mascota_id: mascota.id, estado: 'en_busqueda' },
      attributes: ['id'],
    });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const destino = `${frontend}/publico/mascotas/${mascota.id}`;
    const titulo = reporteActivo
      ? `¡Se busca a ${mascota.nombre}! — HuellaSegura`
      : `${mascota.nombre} — HuellaSegura`;
    const descripcion = [mascota.especie, mascota.raza, mascota.color].filter(Boolean).join(' · ')
      + '. Ayúdanos a encontrarla en Pasto.';
    const imagen = (mascota.foto_urls || [])[0] || `${frontend}/pwa-512x512.svg`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:image" content="${esc(imagen)}">
<meta property="og:url" content="${esc(destino)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
</head><body><a href="${esc(destino)}">Ver el perfil de ${esc(mascota.nombre)}</a></body></html>`);
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPerfil, paginaCompartir };
