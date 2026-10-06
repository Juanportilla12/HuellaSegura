const cron = require('node-cron');
const { Op } = require('sequelize');
const { Reporte, Mascota, Usuario } = require('../models');
const { generarReporteSemanal } = require('./pdfService');
const { enviarCorreoReporteSemanal } = require('./emailService');

const INCLUDE_MASCOTA = [{ model: Mascota, as: 'mascota', attributes: ['id', 'nombre', 'especie'] }];

/**
 * HU-30: casos activos (en búsqueda, no moderados) y casos resueltos
 * (marcados como "encontrada") durante los últimos 7 días.
 */
async function obtenerDatosSemana() {
  const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activos, resueltos] = await Promise.all([
    Reporte.findAll({
      where: { estado: 'en_busqueda', moderado: false },
      include: INCLUDE_MASCOTA,
      order: [['created_at', 'DESC']],
    }),
    Reporte.findAll({
      where: { estado: 'encontrada', updated_at: { [Op.gte]: hace7Dias } },
      include: INCLUDE_MASCOTA,
      order: [['updated_at', 'DESC']],
    }),
  ]);

  return {
    activos: activos.map((r) => r.toPublicJSON()),
    resueltos: resueltos.map((r) => r.toPublicJSON()),
  };
}

async function generarPdfSemanal() {
  return generarReporteSemanal(await obtenerDatosSemana());
}

// Envía el PDF semanal a los administradores activos
async function enviarReporteSemanal() {
  const admins = await Usuario.findAll({ where: { rol: 'admin', activo: true }, attributes: ['email', 'nombre'] });
  if (admins.length === 0) return 0;
  const pdf = await generarPdfSemanal();
  await Promise.all(admins.map((a) => enviarCorreoReporteSemanal({ destinatario: a, pdf })));
  return admins.length;
}

/**
 * Programa la generación automática cada lunes a las 7:00 (hora de Colombia).
 * El PDF también puede descargarse en cualquier momento desde el panel admin.
 */
function programarReporteSemanal() {
  return cron.schedule('0 7 * * 1', () => {
    enviarReporteSemanal()
      .then((n) => console.log(`[Reporte semanal] Enviado a ${n} administrador(es).`))
      .catch((err) => console.error('[Reporte semanal]', err.message));
  }, { timezone: 'America/Bogota' });
}

module.exports = { obtenerDatosSemana, generarPdfSemanal, enviarReporteSemanal, programarReporteSemanal };
