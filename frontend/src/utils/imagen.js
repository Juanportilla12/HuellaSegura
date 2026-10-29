// Prepara una foto antes de subirla: la reduce (máx. 1600 px de lado) y la convierte
// a JPG en el propio teléfono. Así una foto de cámara de 6-10 MB, o en formato WebP,
// llega al servidor como un JPG liviano (≈ 300-600 KB) que sí acepta.
const LADO_MAX = 1600;
const CALIDAD = 0.82;
const MAX_MB_SERVIDOR = 5;

export class FotoNoValida extends Error {}

function nombreJpg(nombre) {
  return `${(nombre || 'foto').replace(/\.[^.]+$/, '')}.jpg`;
}

async function decodificar(archivo) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(archivo, { imageOrientation: 'from-image' });
  }
  // Navegadores sin createImageBitmap
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepararFoto(archivo) {
  if (!archivo?.type?.startsWith('image/')) {
    throw new FotoNoValida('Ese archivo no es una imagen.');
  }

  const puedeProcesar = typeof document !== 'undefined'
    && typeof HTMLCanvasElement !== 'undefined'
    && typeof HTMLCanvasElement.prototype.toBlob === 'function'
    && (typeof createImageBitmap === 'function' || typeof Image !== 'undefined');

  let imagen;
  try {
    if (!puedeProcesar) throw new Error('sin canvas');
    imagen = await decodificar(archivo);
  } catch {
    // No se pudo leer en el navegador (p. ej. HEIC en Chrome): se usa tal cual
    // solo si el servidor la aceptaría.
    if (['image/jpeg', 'image/png'].includes(archivo.type) && archivo.size <= MAX_MB_SERVIDOR * 1024 * 1024) {
      return archivo;
    }
    throw new FotoNoValida('No pudimos leer esta foto. Prueba con otra o tómala de nuevo con la cámara.');
  }

  const escala = Math.min(1, LADO_MAX / Math.max(imagen.width, imagen.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(imagen.width * escala);
  canvas.height = Math.round(imagen.height * escala);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (['image/jpeg', 'image/png'].includes(archivo.type) && archivo.size <= MAX_MB_SERVIDOR * 1024 * 1024) return archivo;
    throw new FotoNoValida('No pudimos procesar esta foto. Prueba con otra.');
  }
  ctx.fillStyle = '#ffffff'; // las zonas transparentes de un PNG quedan blancas en el JPG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  imagen.close?.();

  const blob = await new Promise((resolver) => canvas.toBlob(resolver, 'image/jpeg', CALIDAD));
  if (!blob) throw new FotoNoValida('No pudimos procesar esta foto. Prueba con otra.');
  return new File([blob], nombreJpg(archivo.name), { type: 'image/jpeg' });
}

// Prepara varias fotos; devuelve las válidas y la cantidad que no se pudo usar
export async function prepararFotos(archivos) {
  const resultados = await Promise.allSettled(Array.from(archivos).map(prepararFoto));
  return {
    validas: resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value),
    rechazadas: resultados.filter((r) => r.status === 'rejected').length,
  };
}
