const PDFDocument = require('pdfkit');

function crearBuffer(fn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    fn(doc);
    doc.end();
  });
}

/**
 * Descarga una imagen remota (Cloudinary) para incrustarla en el PDF.
 * PDFKit no descarga URLs por sí mismo. Se pide a Cloudinary en JPG para
 * garantizar un formato compatible. Si falla, el cartel se genera sin foto.
 */
async function descargarImagen(url) {
  if (!url) return null;
  try {
    const urlJpg = url.includes('/upload/') ? url.replace('/upload/', '/upload/f_jpg,w_800/') : url;
    const resp = await fetch(urlJpg, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    return Buffer.from(await resp.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * HU-31: cartel A4 imprimible con foto, datos y código QR de la mascota.
 */
async function generarCartelMascota(mascota, { qrBuffer = null, fotoBuffer = null } = {}) {
  return crearBuffer((doc) => {
    const ancho = doc.page.width;

    // Encabezado
    doc.rect(0, 0, ancho, 80).fill('#dc3545');
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
      .text('¡MASCOTA PERDIDA!', 50, 24, { align: 'center' });

    // Foto
    let y = 100;
    if (fotoBuffer) {
      try {
        doc.image(fotoBuffer, (ancho - 300) / 2, y, { fit: [300, 260], align: 'center' });
        y += 270;
      } catch { /* formato no compatible: se continúa sin foto */ }
    }

    // Nombre
    doc.fontSize(32).font('Helvetica-Bold').fillColor('#dc3545')
      .text(mascota.nombre, 50, y, { align: 'center' });

    // Detalles
    doc.moveDown(0.4).fontSize(14).font('Helvetica').fillColor('#333');
    [
      `Especie: ${mascota.especie}`,
      mascota.raza ? `Raza: ${mascota.raza}` : null,
      `Sexo: ${mascota.sexo ?? 'N/A'}`,
      `Color: ${mascota.color}`,
    ].filter(Boolean).forEach((d) => doc.text(d, { align: 'center' }));

    if (mascota.descripcion) {
      doc.moveDown(0.4).fontSize(11).fillColor('#555')
        .text(mascota.descripcion, { align: 'center', height: 60, ellipsis: true });
    }

    // QR al perfil público
    if (qrBuffer) {
      const ladoQR = 130;
      const yQR = Math.min(doc.y + 15, doc.page.height - ladoQR - 110);
      doc.image(qrBuffer, (ancho - ladoQR) / 2, yQR, { width: ladoQR });
      doc.y = yQR + ladoQR + 5;
      doc.fontSize(10).fillColor('#555')
        .text('Escanea el código para ver su perfil y contactar a su familia', 50, doc.y, { align: 'center' });
    }

    // Pie
    doc.moveDown(0.8).fontSize(15).font('Helvetica-Bold').fillColor('#2563eb')
      .text('Si la viste, repórtalo en HuellaSegura', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#555')
      .text(`Pasto, Nariño — ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' });
  });
}

/**
 * HU-30: reporte semanal con casos activos y casos resueltos en la semana.
 */
async function generarReporteSemanal({ activos, resueltos }) {
  return crearBuffer((doc) => {
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#2563eb')
      .text('HuellaSegura — Reporte Semanal', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#555')
      .text(`Generado: ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    doc.moveDown(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown(0.5);

    doc.fontSize(13).font('Helvetica-Bold').fillColor('#333').text('Resumen');
    doc.moveDown(0.3).fontSize(11).font('Helvetica');
    doc.text(`• Casos activos (en búsqueda): ${activos.length}`);
    doc.text(`• Mascotas encontradas en los últimos 7 días: ${resueltos.length}`);

    doc.moveDown(1).fontSize(13).font('Helvetica-Bold').fillColor('#dc3545')
      .text(`Casos activos (${activos.length})`);
    doc.moveDown(0.3);
    if (activos.length > 0) tablaReportes(doc, activos);
    else doc.fontSize(10).font('Helvetica').fillColor('#555').text('No hay casos activos.');

    doc.moveDown(1).fontSize(13).font('Helvetica-Bold').fillColor('#198754')
      .text(`Casos resueltos en la semana (${resueltos.length})`);
    doc.moveDown(0.3);
    if (resueltos.length > 0) tablaReportes(doc, resueltos);
    else doc.fontSize(10).font('Helvetica').fillColor('#555').text('No hubo casos resueltos esta semana.');
  });
}

function tablaReportes(doc, reportes) {
  const cols = [50, 100, 200, 350, 450];
  const headers = ['#', 'Mascota', 'Especie', 'Fecha pérdida', 'Coords'];

  doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
  doc.rect(50, doc.y, 495, 16).fill('#2563eb');
  headers.forEach((h, i) => doc.text(h, cols[i] + 2, doc.y - 13, { width: 90 }));
  doc.moveDown(0.2);

  doc.font('Helvetica').fillColor('#333');
  reportes.forEach((r, idx) => {
    if (doc.y > doc.page.height - 70) doc.addPage();
    const y = doc.y;
    if (idx % 2 === 0) doc.rect(50, y, 495, 14).fill('#f8f9fa');
    doc.fillColor('#333');
    doc.text(String(r.id ?? '—'),                       cols[0] + 2, y + 2, { width: 45 });
    doc.text(r.mascota?.nombre ?? `#${r.mascota_id}`,   cols[1] + 2, y + 2, { width: 95 });
    doc.text(r.mascota?.especie ?? '—',                 cols[2] + 2, y + 2, { width: 140 });
    doc.text(r.fecha_perdida ?? '—',                    cols[3] + 2, y + 2, { width: 90 });
    doc.text(r.latitud ? `${parseFloat(r.latitud).toFixed(3)}, ${parseFloat(r.longitud).toFixed(3)}` : '—',
      cols[4] + 2, y + 2, { width: 80 });
    doc.moveDown(0.6);
  });
}

module.exports = { generarCartelMascota, generarReporteSemanal, descargarImagen };
