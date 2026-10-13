import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { focoVisible } from '../auth/AuthUI';

// Confirmación a pantalla completa después de una acción importante (reporte, avistamiento…)
export default function PantallaExito({ titulo, children, accionPrincipal, accionSecundaria }) {
  return (
    <div className="min-h-dvh flex flex-col bg-warm-50 dark:bg-dark-800 px-6
                    pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]" role="status">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
        <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="h-24 w-24 rounded-full bg-emerald-600 text-white flex items-center justify-center
                     ring-[10px] ring-emerald-600/15">
          <Check size={48} strokeWidth={3} aria-hidden="true" />
        </motion.span>
        <div>
          <h1 className="font-poppins font-bold text-2xl text-dark-900 dark:text-white">{titulo}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-white/60 max-w-xs mx-auto">{children}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {accionPrincipal && (
          <button type="button" onClick={accionPrincipal.onClick}
                  className={`h-[52px] rounded-2xl font-poppins font-semibold text-[15px] text-white bg-primary-700
                              hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
            {accionPrincipal.texto}
          </button>
        )}
        {accionSecundaria && (
          <button type="button" onClick={accionSecundaria.onClick}
                  className={`h-12 rounded-2xl font-semibold text-[15px] text-dark-700 dark:text-white/80
                              hover:bg-black/5 dark:hover:bg-white/5 ${focoVisible}`}>
            {accionSecundaria.texto}
          </button>
        )}
      </div>
    </div>
  );
}
