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

async function generarCartelMascota(mascota) {
  return crearBuffer((doc) => {
    // Encabezado
    doc.rect(0, 0, doc.page.width, 80).fill('#dc3545');
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
      .text('¡MASCOTA PERDIDA!', 50, 22, { align: 'center' });

    doc.fillColor('black').moveDown(2);

    // Foto si existe
    if (mascota.foto_principal) {
      try {
        doc.image(mascota.foto_principal, {
          fit: [300, 300], align: 'center', valign: 'center',
        });
      } catch { /* imagen no accesible — continúa sin foto */ }
    } else {
      doc.fontSize(80).text('🐾', { align: 'center' });
    }

    // Nombre
    doc.moveDown(1)
      .fontSize(32).font('Helvetica-Bold').fillColor('#dc3545')
      .text(mascota.nombre, { align: 'center' });

    // Detalles
    doc.moveDown(0.5).fontSize(14).font('Helvetica').fillColor('#333');
    const detalles = [
      `Especie: ${mascota.especie}`,
      mascota.raza   ? `Raza: ${mascota.raza}`    : null,
      `Sexo: ${mascota.sexo ?? 'N/A'}`,
      `Color: ${mascota.color}`,
    ].filter(Boolean);

    detalles.forEach((d) => doc.text(d, { align: 'center' }));

    if (mascota.descripcion) {
      doc.moveDown(0.5).fontSize(12).fillColor('#555')
        .text(mascota.descripcion, { align: 'center' });
    }

    // Pie
    doc.moveDown(2).fontSize(16).font('Helvetica-Bold').fillColor('#2563eb')
      .text('Si la encontraste, comunícate por HuellaSegura', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#555')
      .text(`Pasto, Nariño — ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' });
  });
}

async function generarReporteSemanal(reportes) {
  return crearBuffer((doc) => {
    // Encabezado
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#2563eb')
      .text('HuellaSegura — Reporte Semanal', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#555')
      .text(`Generado: ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    doc.moveDown(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
    doc.moveDown(0.5);

    const activos   = reportes.filter((r) => r.estado === 'en_busqueda');
    const resueltos = reportes.filter((r) => r.estado === 'encontrada');
    const cerrados  = reportes.filter((r) => r.estado === 'cerrado');

    // Resumen
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#333').text('Resumen del período');
    doc.moveDown(0.3).fontSize(11).font('Helvetica');
    doc.text(`• Casos activos (en búsqueda): ${activos.length}`);
    doc.text(`• Mascotas encontradas: ${resueltos.length}`);
    doc.text(`• Casos cerrados: ${cerrados.length}`);
    doc.text(`• Total registros: ${reportes.length}`);

    // Tabla activos
    if (activos.length > 0) {
      doc.moveDown(1).fontSize(13).font('Helvetica-Bold').fillColor('#dc3545')
        .text(`Casos activos (${activos.length})`);
      doc.moveDown(0.3);
      tablaReportes(doc, activos);
    }

    // Tabla resueltos
    if (resueltos.length > 0) {
      doc.moveDown(1).fontSize(13).font('Helvetica-Bold').fillColor('#198754')
        .text(`Mascotas encontradas (${resueltos.length})`);
      doc.moveDown(0.3);
      tablaReportes(doc, resueltos);
    }
  });
}

function tablaReportes(doc, reportes) {
  const cols = [50, 100, 200, 350, 450];
  const headers = ['#', 'Mascota', 'Estado', 'Fecha pérdida', 'Coords'];

  // Cabecera tabla
  doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
  doc.rect(50, doc.y, 495, 16).fill('#2563eb');
  headers.forEach((h, i) => doc.text(h, cols[i] + 2, doc.y - 13, { width: 90 }));
  doc.moveDown(0.2);

  // Filas
  doc.font('Helvetica').fillColor('#333');
  reportes.forEach((r, idx) => {
    const y = doc.y;
    if (idx % 2 === 0) doc.rect(50, y, 495, 14).fill('#f8f9fa');
    doc.fillColor('#333');
    doc.text(String(r.id ?? '—'),         cols[0] + 2, y + 2, { width: 45 });
    doc.text(r.mascota?.nombre ?? `#${r.mascota_id}`, cols[1] + 2, y + 2, { width: 90 });
    doc.text(r.estado ?? '—',             cols[2] + 2, y + 2, { width: 140 });
    doc.text(r.fecha_perdida ?? '—',      cols[3] + 2, y + 2, { width: 90 });
    doc.text(r.latitud ? `${parseFloat(r.latitud).toFixed(3)}, ${parseFloat(r.longitud).toFixed(3)}` : '—',
      cols[4] + 2, y + 2, { width: 80 });
    doc.moveDown(0.6);
  });
}

module.exports = { generarCartelMascota, generarReporteSemanal };
