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

// Colores de la marca (los mismos de la app y los correos)
const NARANJA = '#E8732F';
const CORAL   = '#CC4A34';
const VERDE   = '#047857';
const TEXTO   = '#1A1A2E';
const SUAVE   = '#6B7280';
const FONDO   = '#FFF8F5';
const BORDE   = '#EDE5E1';

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
    doc.rect(0, 0, ancho, 80).fill(NARANJA);
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
    doc.fontSize(32).font('Helvetica-Bold').fillColor(CORAL)
      .text(mascota.nombre, 50, y, { align: 'center' });

    // Detalles
    doc.moveDown(0.4).fontSize(14).font('Helvetica').fillColor(TEXTO);
    [
      `Especie: ${mascota.especie}`,
      mascota.raza ? `Raza: ${mascota.raza}` : null,
      `Sexo: ${mascota.sexo ?? 'N/A'}`,
      `Color: ${mascota.color}`,
    ].filter(Boolean).forEach((d) => doc.text(d, { align: 'center' }));

    if (mascota.descripcion) {
      doc.moveDown(0.4).fontSize(11).fillColor(SUAVE)
        .text(mascota.descripcion, { align: 'center', height: 60, ellipsis: true });
    }

    // QR al perfil público
    if (qrBuffer) {
      const ladoQR = 130;
      const yQR = Math.min(doc.y + 15, doc.page.height - ladoQR - 110);
      doc.image(qrBuffer, (ancho - ladoQR) / 2, yQR, { width: ladoQR });
      doc.y = yQR + ladoQR + 5;
      doc.fontSize(10).fillColor(SUAVE)
        .text('Escanea el código para ver su perfil y contactar a su familia', 50, doc.y, { align: 'center' });
    }

    // Pie
    doc.moveDown(0.8).fontSize(15).font('Helvetica-Bold').fillColor(CORAL)
      .text('Si la viste, repórtalo en HuellaSegura', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor(SUAVE)
      .text(`Pasto, Nariño — ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' });
  });
}

/**
 * HU-30: reporte semanal con casos activos y casos resueltos en la semana.
 */
async function generarReporteSemanal({ activos, resueltos }) {
  return crearBuffer((doc) => {
    doc.fontSize(22).font('Helvetica-Bold').fillColor(CORAL)
      .text('HuellaSegura — Reporte semanal', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor(SUAVE)
      .text(`Generado: ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    doc.moveDown(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke(BORDE);
    doc.moveDown(0.5);

    doc.fontSize(13).font('Helvetica-Bold').fillColor(TEXTO).text('Resumen');
    doc.moveDown(0.3).fontSize(11).font('Helvetica');
    doc.text(`• Casos activos (en búsqueda): ${activos.length}`);
    doc.text(`• Mascotas encontradas en los últimos 7 días: ${resueltos.length}`);

    doc.moveDown(1).fontSize(13).font('Helvetica-Bold').fillColor(CORAL)
      .text(`Casos activos (${activos.length})`);
    doc.moveDown(0.3);
    if (activos.length > 0) tablaReportes(doc, activos);
    else doc.fontSize(10).font('Helvetica').fillColor(SUAVE).text('No hay casos activos.');

    doc.moveDown(1).fontSize(13).font('Helvetica-Bold').fillColor(VERDE)
      .text(`Casos resueltos en la semana (${resueltos.length})`);
    doc.moveDown(0.3);
    if (resueltos.length > 0) tablaReportes(doc, resueltos);
    else doc.fontSize(10).font('Helvetica').fillColor(SUAVE).text('No hubo casos resueltos esta semana.');
  });
}

// Tabla con posiciones explícitas: encabezado coral, filas alternadas y salto de página si no cabe
function tablaReportes(doc, reportes) {
  const X = 50;
  const ANCHO = 495;
  const ALTO_ENC = 22;
  const ALTO_FILA = 20;
  const cols = [
    { titulo: '#',                x: 50,  w: 40 },
    { titulo: 'Mascota',          x: 90,  w: 140 },
    { titulo: 'Especie',          x: 230, w: 90 },
    { titulo: 'Fecha de pérdida', x: 320, w: 105 },
    { titulo: 'Ubicación',        x: 425, w: 120 },
  ];
  const celda = (texto, c, y) => doc.text(texto, c.x + 6, y, { width: c.w - 10, lineBreak: false, ellipsis: true });

  const encabezado = (y) => {
    doc.rect(X, y, ANCHO, ALTO_ENC).fill(CORAL);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
    cols.forEach((c) => celda(c.titulo, c, y + 7));
    return y + ALTO_ENC;
  };

  let y = encabezado(doc.y);
  doc.font('Helvetica').fontSize(9);
  reportes.forEach((r, idx) => {
    if (y + ALTO_FILA > doc.page.height - 60) {
      doc.addPage();
      y = encabezado(doc.page.margins.top);
      doc.font('Helvetica').fontSize(9);
    }
    if (idx % 2 === 0) doc.rect(X, y, ANCHO, ALTO_FILA).fill(FONDO);
    doc.fillColor(TEXTO);
    const valores = [
      String(r.id ?? '—'),
      r.mascota?.nombre ?? `#${r.mascota_id}`,
      r.mascota?.especie ?? '—',
      r.fecha_perdida ?? '—',
      r.latitud ? `${parseFloat(r.latitud).toFixed(4)}, ${parseFloat(r.longitud).toFixed(4)}` : '—',
    ];
    cols.forEach((c, i) => celda(valores[i], c, y + 6));
    y += ALTO_FILA;
  });
  doc.moveTo(X, y).lineTo(X + ANCHO, y).stroke(BORDE);

  // Devuelve el cursor al margen izquierdo, debajo de la tabla
  doc.x = X;
  doc.y = y + 6;
}

module.exports = { generarCartelMascota, generarReporteSemanal, descargarImagen };
