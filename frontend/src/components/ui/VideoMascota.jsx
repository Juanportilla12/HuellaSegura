import { urlVideoCompatible, urlPortadaVideo } from '../../utils/video';

// Video de la mascota. Primero intenta la versión MP4 compatible con todos los teléfonos;
// si Cloudinary no la entrega, el navegador pasa solo a la segunda fuente (el original).
export default function VideoMascota({ url, className = '' }) {
  const compatible = urlVideoCompatible(url);
  const portada = urlPortadaVideo(url);
  return (
    <video controls playsInline preload="metadata" data-testid="video-mascota"
           poster={portada !== url ? portada : undefined}
           className={`w-full rounded-2xl bg-black ${className}`}>
      {compatible !== url && <source src={compatible} type="video/mp4" />}
      <source src={url} />
      Tu navegador no puede reproducir este video.
    </video>
  );
}
