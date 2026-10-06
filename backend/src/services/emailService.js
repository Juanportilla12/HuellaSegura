const nodemailer = require('nodemailer');

// Escapa texto ingresado por usuarios antes de insertarlo en el HTML del correo
function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function crearTransporte() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function enviarCorreoReporteCreado({ propietario, mascota, reporte }) {
  const transporte = crearTransporte();
  const fotosHtml = mascota.foto_principal
    ? `<img src="${esc(mascota.foto_principal)}" alt="${esc(mascota.nombre)}" style="max-width:200px;border-radius:8px;" />`
    : '';

  const info = await transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: propietario.email,
    subject: `🐾 Alerta creada — ${mascota.nombre} está en búsqueda`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2 style="color:#2563eb;">HuellaSegura</h2>
        <p>Hola <strong>${esc(propietario.nombre)}</strong>,</p>
        <p>Tu reporte de pérdida ha sido publicado exitosamente.</p>
        ${fotosHtml}
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="padding:6px;font-weight:bold;">Mascota</td><td>${esc(mascota.nombre)}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">Especie</td><td>${esc(mascota.especie)}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;">Fecha</td><td>${esc(reporte.fecha_perdida)}</td></tr>
        </table>
        <p style="margin-top:16px;color:#555;">
          La comunidad de HuellaSegura en Pasto ya puede ver tu alerta en el mapa.
        </p>
        <p style="color:#888;font-size:12px;">Este es un correo automático, no respondas a este mensaje.</p>
      </div>`,
  });

  return info;
}

async function enviarCorreoAvistamiento({ propietario, mascota, avistamiento }) {
  const transporte = crearTransporte();
  const fotoHtml = avistamiento.foto_url
    ? `<img src="${esc(avistamiento.foto_url)}" alt="Foto del avistamiento" style="max-width:200px;border-radius:8px;margin-top:8px;" />`
    : '';

  const info = await transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: propietario.email,
    subject: `🐾 ¡Alguien vio a ${mascota.nombre}!`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2 style="color:#F97B62;">HuellaSegura</h2>
        <p>Hola <strong>${esc(propietario.nombre)}</strong>,</p>
        <p>¡Buenas noticias! Alguien reportó un avistamiento de <strong>${esc(mascota.nombre)}</strong>.</p>
        ${fotoHtml}
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr style="background:#fff3ee;"><td style="padding:8px;font-weight:bold;">Testigo</td><td>${esc(avistamiento.nombre_testigo || 'Anónimo')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Ubicación</td><td>Lat: ${parseFloat(avistamiento.latitud).toFixed(5)}, Lng: ${parseFloat(avistamiento.longitud).toFixed(5)}</td></tr>
          <tr style="background:#fff3ee;"><td style="padding:8px;font-weight:bold;">Descripción</td><td>${esc(avistamiento.descripcion || 'Sin descripción adicional')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Fecha</td><td>${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td></tr>
        </table>
        <p style="margin-top:16px;">Ingresa a HuellaSegura para ver la ubicación exacta en el mapa.</p>
        <p style="color:#888;font-size:12px;">Este es un correo automático, no respondas a este mensaje.</p>
      </div>`,
  });

  return info;
}

async function enviarCorreoResetCodigo({ email, nombre, codigo }) {
  const transporte = crearTransporte();
  return transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 Tu código de verificación — HuellaSegura`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0F0F1A;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#FF9280,#F97B62);padding:32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">🐾</div>
          <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">HuellaSegura</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:rgba(255,255,255,0.7);margin-top:0;">Hola <strong style="color:white;">${esc(nombre)}</strong>,</p>
          <p style="color:rgba(255,255,255,0.7);">Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
          <p style="color:rgba(255,255,255,0.7);">Tu código de verificación es:</p>
          <div style="background:rgba(249,123,98,0.15);border:2px solid rgba(249,123,98,0.4);border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#F97B62;">${codigo}</span>
          </div>
          <p style="color:rgba(255,255,255,0.5);font-size:13px;">⏱ Este código expira en <strong style="color:rgba(255,255,255,0.7);">15 minutos</strong>.</p>
          <p style="color:rgba(255,255,255,0.5);font-size:13px;">Si no solicitaste este cambio, ignora este correo. Tu contraseña permanece sin cambios.</p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;" />
          <p style="color:rgba(255,255,255,0.3);font-size:11px;text-align:center;">HuellaSegura · Pasto, Nariño</p>
        </div>
      </div>`,
  });
}

module.exports = { enviarCorreoReporteCreado, enviarCorreoAvistamiento, enviarCorreoResetCodigo };
