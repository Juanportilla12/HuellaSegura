// Interruptor accesible (role="switch")
export default function Interruptor({ activo, onCambio, etiqueta, deshabilitado = false, ...props }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={deshabilitado}
      onClick={() => onCambio(!activo)} {...props}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30
                  ${activo ? 'bg-primary-700' : 'bg-gray-300 dark:bg-white/20'}`}>
      <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200
                        ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}
