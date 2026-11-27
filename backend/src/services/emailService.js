const nodemailer = require('nodemailer');
const { urlFrontend } = require('../utils/urlFrontend');

// Colores de la marca (los mismos de la app)
const NARANJA = '#E8732F';
const CORAL   = '#CC4A34';
const TEXTO   = '#1A1A2E';
const SUAVE   = '#6B7280';
const FONDO   = '#FFF8F5';
const BORDE   = '#EDE5E1';

// Escapa texto ingresado por usuarios antes de insertarlo en el HTML del correo
function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Railway bloquea el correo por SMTP en los planes Free, Trial y Hobby: allí los correos
// salen por la API HTTPS de Brevo (variable BREVO_API_KEY). Sin esa variable, como en
// desarrollo, se usa SMTP. Ambos ofrecen la misma interfaz sendMail() de nodemailer.
const REMITENTE_RE = /^"?([^"<]*)"?\s*<([^>]+)>$/;

function transporteBrevo() {
  return {
    async sendMail({ from, to, subject, html, text, attachments = [] }) {
      const [, nombre = 'HuellaSegura', correo] = String(from).match(REMITENTE_RE) || [];
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: nombre.trim() || 'HuellaSegura', email: process.env.EMAIL_FROM || correo || process.env.EMAIL_USER },
          to: String(to).split(',').map((email) => ({ email: email.trim() })),
          subject,
          htmlContent: html,
          ...(text ? { textContent: text } : {}),
          ...(attachments.length ? {
            attachment: attachments.map((a) => ({ name: a.filename, content: Buffer.from(a.content).toString('base64') })),
          } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(`Brevo respondió ${resp.status}: ${datos.message || 'error desconocido'}`);
      return { messageId: datos.messageId };
    },
  };
}

function crearTransporte() {
  if (process.env.BREVO_API_KEY) return transporteBrevo();
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: false,
    // Sin estos límites, un servidor SMTP que no responde deja conexiones colgadas
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const urlApp = urlFrontend;

// Plantilla común: franja naranja con la marca, tarjeta blanca y pie con el aviso de correo automático.
// `contenido` es HTML ya escapado por quien llama.
function plantilla({ titulo, contenido, boton, pie }) {
  const botonHtml = boton
    ? `<p style="margin:28px 0 8px;text-align:center;">
         <a href="${esc(boton.url)}" style="display:inline-block;background:${CORAL};color:#ffffff;text-decoration:none;
            font-weight:bold;font-size:15px;padding:14px 28px;border-radius:14px;">${esc(boton.texto)}</a>
       </p>`
    : '';
  return `
  <div style="background:${FONDO};padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${BORDE};border-radius:20px;overflow:hidden;">
      <div style="background:${NARANJA};padding:20px 28px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">HuellaSegura</span>
      </div>
      <div style="padding:28px;color:${TEXTO};font-size:15px;line-height:1.6;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${TEXTO};">${titulo}</h1>
        ${contenido}
        ${botonHtml}
      </div>
      <div style="padding:16px 28px;border-top:1px solid ${BORDE};color:${SUAVE};font-size:12px;line-height:1.5;">
        ${pie || 'Este es un correo automático, no respondas a este mensaje.'}<br />HuellaSegura · Pasto, Nariño
      </div>
    </div>
  </div>`;
}

// Tabla de datos (etiqueta / valor); los valores deben venir escapados
function tablaDatos(filas) {
  const celdas = filas.filter(Boolean).map(([etiqueta, valor]) => `
    <tr>
      <td style="padding:10px 12px;color:${SUAVE};font-size:13px;border-bottom:1px solid ${BORDE};width:38%;">${etiqueta}</td>
      <td style="padding:10px 12px;color:${TEXTO};font-size:14px;border-bottom:1px solid ${BORDE};">${valor}</td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid ${BORDE};border-radius:12px;">${celdas}</table>`;
}

function fotoHtml(url, alt) {
  return url
    ? `<img src="${esc(url)}" alt="${esc(alt)}" style="display:block;width:100%;max-width:464px;max-height:300px;object-fit:cover;border-radius:14px;margin:16px 0;" />`
    : '';
}

async function enviarCorreoReporteCreado({ propietario, mascota, reporte }) {
  const transporte = crearTransporte();
  const info = await transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: propietario.email,
    subject: `🐾 Alerta creada — ${mascota.nombre} está en búsqueda`,
    html: plantilla({
      titulo: `Publicamos el reporte de ${esc(mascota.nombre)}`,
      contenido: `
        <p style="margin:0;">Hola <strong>${esc(propietario.nombre)}</strong>, tu reporte ya aparece en el mapa
          y avisamos a los vecinos que tienen las alertas activas cerca del lugar.</p>
        ${fotoHtml(mascota.foto_principal, mascota.nombre)}
        ${tablaDatos([
          ['Mascota', esc(mascota.nombre)],
          ['Especie', esc(mascota.especie)],
          ['Se perdió el', esc(reporte.fecha_perdida)],
        ])}
        <p style="margin:16px 0 0;color:${SUAVE};">Te escribiremos cuando alguien reporte haberla visto. ¡Mucho ánimo!</p>`,
      boton: { texto: 'Ver mis reportes', url: urlApp('/reportes') },
    }),
  });

  return info;
}

// Fila con el celular del testigo y enlaces para llamarlo o escribirle por WhatsApp
function contactoTestigoHtml(telefono) {
  if (!telefono) return null;
  const digitos = String(telefono).replace(/\D/g, '');
  const whatsapp = digitos.length === 10 && digitos.startsWith('3') ? `57${digitos}` : digitos;
  return ['Celular', `<a href="tel:${esc(digitos)}" style="color:${CORAL};font-weight:bold;">${esc(telefono)}</a>
    &nbsp;·&nbsp;<a href="https://wa.me/${esc(whatsapp)}" style="color:${CORAL};font-weight:bold;">Escribir por WhatsApp</a>`];
}

async function enviarCorreoAvistamiento({ propietario, mascota, avistamiento }) {
  const transporte = crearTransporte();
  const lat = parseFloat(avistamiento.latitud).toFixed(6);
  const lng = parseFloat(avistamiento.longitud).toFixed(6);

  const info = await transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: propietario.email,
    subject: `🐾 ¡Alguien vio a ${mascota.nombre}!`,
    html: plantilla({
      titulo: `¡Alguien vio a ${esc(mascota.nombre)}!`,
      contenido: `
        <p style="margin:0;">Hola <strong>${esc(propietario.nombre)}</strong>, ¡buenas noticias! Una persona reportó
          haber visto a <strong>${esc(mascota.nombre)}</strong>. Contáctala lo antes posible.</p>
        ${fotoHtml(avistamiento.foto_url, 'Foto del avistamiento')}
        ${tablaDatos([
          ['Testigo', esc(avistamiento.nombre_testigo || 'Sin nombre')],
          contactoTestigoHtml(avistamiento.telefono_testigo),
          ['Detalles', esc(avistamiento.descripcion || 'Sin descripción adicional')],
          ['Fecha', esc(new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }))],
        ])}`,
      boton: { texto: 'Ver dónde la vieron', url: `https://www.google.com/maps?q=${lat},${lng}` },
    }),
  });

  return info;
}

// Bloque "¿No fuiste tú?": lleva a una pantalla de la app donde la persona confirma la anulación
function bloqueNoFuiYo(enlace, texto) {
  if (!enlace) return '';
  return `
        <div style="margin-top:22px;padding:16px 18px;border:1px solid ${BORDE};border-radius:14px;">
          <p style="margin:0 0 6px;font-weight:bold;color:${TEXTO};">¿No fuiste tú?</p>
          <p style="margin:0 0 12px;color:${SUAVE};font-size:14px;">${texto}</p>
          <a href="${esc(enlace)}" style="color:${CORAL};font-weight:bold;font-size:14px;">No fui yo: anular este código</a>
        </div>`;
}

async function enviarCorreoResetCodigo({ email, nombre, codigo, enlaceAnular }) {
  const transporte = crearTransporte();
  return transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 Tu código de verificación — HuellaSegura`,
    html: plantilla({
      titulo: 'Tu código para restablecer la contraseña',
      contenido: `
        <p style="margin:0;">Hola <strong>${esc(nombre)}</strong>, escribe este código en la app para crear una nueva contraseña:</p>
        <div style="margin:24px 0;padding:22px;text-align:center;background:${FONDO};border:1px solid ${BORDE};border-radius:16px;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:${TEXTO};">${esc(codigo)}</span>
        </div>
        <p style="margin:0;color:${SUAVE};font-size:14px;">El código vence en <strong>15 minutos</strong>.</p>
        ${bloqueNoFuiYo(enlaceAnular, 'Si no pediste cambiar tu contraseña, anula el código para que nadie pueda usarlo. Tu contraseña sigue igual.')}`,
    }),
  });
}

// Verificación del correo al crear la cuenta
async function enviarCorreoVerificacion({ email, nombre, codigo, enlaceAnular }) {
  const transporte = crearTransporte();
  return transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Confirma tu correo — HuellaSegura`,
    html: plantilla({
      titulo: 'Confirma tu correo para activar tu cuenta',
      contenido: `
        <p style="margin:0;">Hola <strong>${esc(nombre)}</strong>, escribe este código en la app para activar tu cuenta de HuellaSegura:</p>
        <div style="margin:24px 0;padding:22px;text-align:center;background:${FONDO};border:1px solid ${BORDE};border-radius:16px;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:${TEXTO};">${esc(codigo)}</span>
        </div>
        <p style="margin:0;color:${SUAVE};font-size:14px;">El código vence en <strong>15 minutos</strong>.</p>
        ${bloqueNoFuiYo(enlaceAnular, 'Si tú no creaste esta cuenta, cancélala: el código queda anulado y nadie podrá usar tu correo.')}`,
    }),
  });
}

async function enviarCorreoAlertaProximidad({ destinatario, mascotaNombre, distanciaKm, reporteId }) {
  const transporte = crearTransporte();
  return transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: destinatario.email,
    subject: `🐾 Mascota perdida cerca de ti — ${mascotaNombre}`,
    html: plantilla({
      titulo: `Se busca a ${esc(mascotaNombre)} cerca de ti`,
      contenido: `
        <p style="margin:0;">Hola <strong>${esc(destinatario.nombre)}</strong>, se reportó la pérdida de
          <strong>${esc(mascotaNombre)}</strong> a <strong>${Number(distanciaKm).toFixed(1)} km</strong> de tu ubicación.
          Si la ves, avísale a su familia desde la app.</p>`,
      boton: { texto: 'Ver el reporte en el mapa', url: urlApp(`/mapa?reporte=${reporteId}`) },
      pie: 'Recibes este correo porque activaste las alertas cerca de ti. Puedes desactivarlas desde tu perfil.',
    }),
  });
}

async function enviarCorreoReporteSemanal({ destinatario, pdf }) {
  const transporte = crearTransporte();
  return transporte.sendMail({
    from: `"HuellaSegura" <${process.env.EMAIL_USER}>`,
    to: destinatario.email,
    subject: '📄 Reporte semanal de casos — HuellaSegura',
    html: plantilla({
      titulo: 'Reporte semanal de casos',
      contenido: `
        <p style="margin:0;">Hola <strong>${esc(destinatario.nombre)}</strong>, adjuntamos el reporte con los casos activos
          y los resueltos en la última semana, listo para imprimir y compartir con veterinarias y albergues.</p>`,
    }),
    attachments: [{ filename: 'reporte-semanal-huellasegura.pdf', content: pdf, contentType: 'application/pdf' }],
  });
}

module.exports = {
  enviarCorreoReporteSemanal,
  enviarCorreoReporteCreado, enviarCorreoAvistamiento, enviarCorreoResetCodigo, enviarCorreoAlertaProximidad,
  enviarCorreoVerificacion,
};
