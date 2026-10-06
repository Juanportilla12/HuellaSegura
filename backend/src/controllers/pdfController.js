const { Op } = require('sequelize');
const { Mascota, Reporte } = require('../models');
const { generarCartelMascota, generarReporteSemanal } = require('../services/pdfService');

async function cartelMascota(req, res, next) {
  try {
    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    const buffer = await generarCartelMascota(mascota.toPublicJSON());
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cartel-${mascota.nombre.replace(/\s+/g, '-')}.pdf"`,
    });
    return res.send(buffer);
  } catch (error) { next(error); }
}

async function reporteSemanal(req, res, next) {
  try {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const reportes = await Reporte.findAll({
      where: { created_at: { [Op.gte]: hace7Dias } },
      include: [{ model: Mascota, as: 'mascota', attributes: ['id', 'nombre', 'especie', 'foto_urls'] }],
      order: [['created_at', 'DESC']],
    });

    const buffer = await generarReporteSemanal(reportes.map((r) => r.toPublicJSON()));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="reporte-semanal-huellasegura.pdf"',
    });
    return res.send(buffer);
  } catch (error) { next(error); }
}

module.exports = { cartelMascota, reporteSemanal };
