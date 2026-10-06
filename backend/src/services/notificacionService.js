const { Usuario, Notificacion } = require('../models');
const { calcularDistancia } = require('./distanciaHelper');
const { notificarUsuario } = require('./tiempoRealService');
const { enviarCorreoAlertaProximidad } = require('./emailService');

/**
 * R8/R9 — Al crear un reporte, notifica a los usuarios que:
 *  1. No son el propietario del reporte
 *  2. Compartieron su ubicación (consentimiento)
 *  3. Están dentro de su radio_alerta respecto al reporte (fórmula de Haversine)
 * Cada usuario cercano recibe: notificación interna, evento en tiempo real y correo.
 */
async function generarNotificacionesProximidad(reporte, mascotaNombre) {
  const usuarios = await Usuario.findAll({
    where: { activo: true },
    attributes: ['id', 'nombre', 'email', 'radio_alerta', 'ubicacion_lat', 'ubicacion_lng'],
  });

  const destinatarios = [];

  for (const usuario of usuarios) {
    if (usuario.id === reporte.usuario_id) continue;
    if (!usuario.ubicacion_lat || !usuario.ubicacion_lng) continue;

    const distancia = calcularDistancia(
      parseFloat(reporte.latitud),
      parseFloat(reporte.longitud),
      parseFloat(usuario.ubicacion_lat),
      parseFloat(usuario.ubicacion_lng)
    );

    if (distancia <= usuario.radio_alerta) {
      destinatarios.push({ usuario, distancia });
    }
  }

  if (destinatarios.length === 0) return 0;

  await Notificacion.bulkCreate(destinatarios.map(({ usuario, distancia }) => ({
    usuario_id: usuario.id,
    reporte_id: reporte.id,
    mensaje: `¡Alerta! Se reportó una mascota perdida a ${distancia.toFixed(1)} km de tu ubicación: ${mascotaNombre}.`,
    tipo: 'proximidad',
    leida: false,
  })));

  destinatarios.forEach(({ usuario, distancia }) => {
    notificarUsuario(usuario.id, 'notificacion', {
      mensaje: `Mascota perdida a ${distancia.toFixed(1)} km: ${mascotaNombre}`,
      reporte_id: reporte.id,
    });
    if (usuario.email) {
      enviarCorreoAlertaProximidad({
        destinatario: { email: usuario.email, nombre: usuario.nombre },
        mascotaNombre,
        distanciaKm: distancia,
        reporteId: reporte.id,
      }).catch((err) => console.error('[Correo proximidad]', err.message));
    }
  });

  return destinatarios.length;
}

module.exports = { generarNotificacionesProximidad };
