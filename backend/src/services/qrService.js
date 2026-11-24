const QRCode = require('qrcode');

const { urlFrontend } = require('../utils/urlFrontend');

// El QR apunta al perfil público usando el código no adivinable de la mascota
async function generarQR(codigoPublico) {
  const url = urlFrontend(`/publico/mascotas/${codigoPublico}`);
  const buffer = await QRCode.toBuffer(url, { type: 'png', width: 300, margin: 2 });
  const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  return { buffer, dataUrl, url };
}

module.exports = { generarQR };
