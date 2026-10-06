const { Mascota } = require('../models');
const { generarCartelMascota, descargarImagen } = require('../services/pdfService');
const { generarQR } = require('../services/qrService');
const { generarPdfSemanal } = require('../services/reporteSemanalService');

// HU-31: cartel A4 con foto, datos y QR
async function cartelMascota(req, res, next) {
  try {
    const mascota = await Mascota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });
    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada.' });
    }

    const datos = mascota.toPublicJSON();
    const [{ buffer: qrBuffer }, fotoBuffer] = await Promise.all([
      generarQR(mascota.id),
      descargarImagen(datos.foto_principal),
    ]);

    const buffer = await generarCartelMascota(datos, { qrBuffer, fotoBuffer });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cartel-${mascota.nombre.replace(/\s+/g, '-')}.pdf"`,
    });
    return res.send(buffer);
  } catch (error) { next(error); }
}

// HU-30: reporte semanal bajo demanda (además del envío automático de los lunes)
async function reporteSemanal(req, res, next) {
  try {
    const buffer = await generarPdfSemanal();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="reporte-semanal-huellasegura.pdf"',
    });
    return res.send(buffer);
  } catch (error) { next(error); }
}

module.exports = { cartelMascota, reporteSemanal };
