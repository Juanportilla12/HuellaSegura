// Videos guardados en Cloudinary. Los del iPhone suelen venir en .MOV (a veces HEVC), que
// muchos Android y navegadores de computador no reproducen: se pide a Cloudinary la versión
// MP4 (H.264 + AAC), compatible con todos, y una imagen del primer cuadro como portada.
const MARCA_SUBIDA = '/video/upload/';

function transformar(url, transformacion, extension) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes(MARCA_SUBIDA)) return url;
  const [base, ruta] = url.split(MARCA_SUBIDA);
  return `${base}${MARCA_SUBIDA}${transformacion}/${ruta.replace(/\.[a-z0-9]+$/i, `.${extension}`)}`;
}

export function urlVideoCompatible(url) {
  return transformar(url, 'vc_h264,ac_aac,q_auto', 'mp4');
}

export function urlPortadaVideo(url) {
  return transformar(url, 'so_0,q_auto', 'jpg');
}

// Duración máxima recomendada: un video corto pesa poco y carga rápido con datos móviles
export const MAX_VIDEO_SEGUNDOS = 30;

// Lee la duración del video en el navegador; null si el formato no se puede leer aquí
export function duracionVideo(archivo) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(archivo);
    const video = document.createElement('video');
    const terminar = (valor) => { URL.revokeObjectURL(url); resolve(valor); };
    video.preload = 'metadata';
    video.onloadedmetadata = () => terminar(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => terminar(null);
    setTimeout(() => terminar(null), 5000);
    video.src = url;
  });
}
