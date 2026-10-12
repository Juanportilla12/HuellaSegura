import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { focoVisible } from '../auth/AuthUI';

// Hoja inferior para confirmar acciones importantes (p. ej. eliminar). Se cierra con Escape o tocando fuera.
// `extra` permite agregar contenido debajo del texto (p. ej. un campo de contraseña).
export default function HojaConfirmacion({ abierta, titulo, children, extra, textoConfirmar, peligro = false, cargando = false, onConfirmar, onCancelar }) {
  const cancelarRef = useRef(null);

  useEffect(() => {
    if (!abierta) return;
    cancelarRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancelar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierta, onCancelar]);

  return (
    <AnimatePresence>
      {abierta && (
        <motion.div className="fixed inset-0 z-[3000] flex items-end justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onCancelar} aria-hidden="true" />
          <motion.div role="alertdialog" aria-modal="true" aria-labelledby="hoja-confirmacion-titulo"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-mobile rounded-t-[28px] bg-white dark:bg-dark-800 px-6 pt-6
                       pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <h2 id="hoja-confirmacion-titulo" className="font-poppins font-bold text-lg text-dark-900 dark:text-white">{titulo}</h2>
            {children && <p className="mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-white/60">{children}</p>}
            {extra && <div className="mt-4">{extra}</div>}
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={onConfirmar} disabled={cargando}
                className={`h-12 rounded-2xl font-poppins font-semibold text-[15px] text-white disabled:opacity-60 ${focoVisible}
                            ${peligro ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-700 hover:bg-primary-800'}`}>
                {cargando ? 'Un momento…' : textoConfirmar}
              </button>
              <button ref={cancelarRef} type="button" onClick={onCancelar}
                className={`h-12 rounded-2xl font-semibold text-[15px] text-dark-700 dark:text-white/80
                            hover:bg-gray-100 dark:hover:bg-white/5 ${focoVisible}`}>
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
