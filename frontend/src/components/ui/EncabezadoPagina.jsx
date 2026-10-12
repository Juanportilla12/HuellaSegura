import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { focoVisible } from '../auth/AuthUI';

// Barra superior fija de las pantallas internas: volver, título y una acción opcional a la derecha
export default function EncabezadoPagina({ titulo, subtitulo, onVolver, accion }) {
  const navigate = useNavigate();
  const volver = onVolver ?? (() => (window.history.length > 1 ? navigate(-1) : navigate('/')));

  return (
    <header className="sticky top-0 z-30 bg-warm-50/90 dark:bg-dark-800/90 backdrop-blur-md
                       border-b border-warm-border/70 dark:border-white/10
                       px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 flex items-center gap-3">
      <button type="button" onClick={volver} aria-label="Volver"
              className={`h-10 w-10 shrink-0 rounded-full bg-white dark:bg-white/10 border border-warm-border dark:border-white/10
                          text-dark-900 dark:text-white flex items-center justify-center active:scale-95 transition-transform ${focoVisible}`}>
        <ChevronLeft size={22} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="font-poppins font-bold text-[18px] leading-tight truncate text-dark-900 dark:text-white">{titulo}</h1>
        {subtitulo && <p className="text-[13px] truncate text-gray-500 dark:text-white/50">{subtitulo}</p>}
      </div>
      {accion}
    </header>
  );
}
