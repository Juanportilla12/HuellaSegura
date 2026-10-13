import { MessageCircle } from 'lucide-react';

// lucide-react ya no incluye logotipos de marcas: ícono de Facebook en SVG
function IconoFacebook({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z" />
    </svg>
  );
}
import { urlCompartirMascota } from '../services/perfilPublicoService';

// HU-29: compartir en Facebook y WhatsApp sin iniciar sesión.
// El enlace apunta a la API, que entrega la vista previa (foto y nombre) y redirige al perfil.
export default function BotonesCompartir({ codigoPublico, nombreMascota, buscando = false }) {
  const urlCompartir = urlCompartirMascota(codigoPublico);
  const texto = buscando
    ? `🐾 ¡Ayúdame a encontrar a ${nombreMascota}! Se perdió en Pasto. Mira su perfil en HuellaSegura:`
    : `🐾 Conoce a ${nombreMascota} en HuellaSegura:`;

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlCompartir)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${texto} ${urlCompartir}`)}`;

  const base = 'flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white ' +
               'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30';

  return (
    <div className="flex gap-2" data-testid="botones-compartir">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-whatsapp"
         className={`${base} bg-[#128C7E] hover:bg-[#0F7A6E]`}>
        <MessageCircle size={18} aria-hidden="true" /> WhatsApp
      </a>
      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-facebook"
         className={`${base} bg-[#1877F2] hover:bg-[#166FE5]`}>
        <IconoFacebook size={18} /> Facebook
      </a>
    </div>
  );
}
