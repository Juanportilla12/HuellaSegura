// Cabecera Content-Disposition segura a partir del nombre de la mascota.
// Las cabeceras HTTP no admiten emojis ni saltos de línea y unas comillas
// romperían el valor: se envía un nombre ASCII y, aparte, el original en UTF-8 (RFC 6266).
function descargaAdjunta(prefijo, nombre, extension) {
  const legible = `${prefijo}-${String(nombre ?? '').trim().replace(/\s+/g, '-')}`;
  const ascii = legible
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // Ñ → N, í → i
    .replace(/[^A-Za-z0-9_-]+/g, '')
    .replace(/-+$/, '') || prefijo;
  return `attachment; filename="${ascii}.${extension}"; filename*=UTF-8''${encodeURIComponent(legible)}.${extension}`;
}

module.exports = { descargaAdjunta };
