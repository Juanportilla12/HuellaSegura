const { Notificacion, Avistamiento } = require('../models');

async function listar(req, res, next) {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { usuario_id: req.usuario.id },
      // Los avisos de avistamiento traen dónde vieron a la mascota (y su foto)
      include: [{
        model: Avistamiento, as: 'avistamiento', required: false,
        attributes: ['id', 'latitud', 'longitud', 'descripcion', 'foto_url', 'created_at'],
      }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    return res.status(200).json({ success: true, notificaciones, no_leidas: noLeidas });
  } catch (error) { next(error); }
}

async function marcarLeida(req, res, next) {
  try {
    const notif = await Notificacion.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!notif) return res.status(404).json({ success: false, message: 'Notificación no encontrada.' });
    await notif.update({ leida: true });
    return res.status(200).json({ success: true, message: 'Notificación marcada como leída.' });
  } catch (error) { next(error); }
}

async function marcarTodasLeidas(req, res, next) {
  try {
    await Notificacion.update(
      { leida: true },
      { where: { usuario_id: req.usuario.id, leida: false } }
    );
    return res.status(200).json({ success: true, message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) { next(error); }
}

module.exports = { listar, marcarLeida, marcarTodasLeidas };
