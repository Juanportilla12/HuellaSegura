import { MarcaObligatorio } from '../auth/AuthUI';

// Tarjeta de formulario con número de paso, título y una etiqueta o acción opcional a la derecha.
// `requerido` marca la sección con asterisco; `conError` la resalta en rojo y permite
// llevar al usuario hasta ella cuando falta completarla.
export default function SeccionFormulario({ titulo, paso, etiqueta, accion, children, sinRelleno = false, requerido = false, conError = false }) {
  return (
    <section data-error={conError || undefined}
      className={`rounded-3xl overflow-hidden bg-white dark:bg-white/5 border transition-colors
                  ${conError ? 'border-red-400 dark:border-red-500/60' : 'border-warm-border dark:border-white/10'}`}>
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        {paso && (
          <span className="h-7 w-7 shrink-0 rounded-full bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400
                           text-[13px] font-bold flex items-center justify-center" aria-hidden="true">
            {paso}
          </span>
        )}
        <h2 className="flex-1 min-w-0 font-poppins font-semibold text-[16px] leading-tight text-dark-900 dark:text-white">
          {titulo}{requerido && <MarcaObligatorio />}
        </h2>
        {etiqueta && (
          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60">
            {etiqueta}
          </span>
        )}
        {accion}
      </div>
      <div className={sinRelleno ? '' : 'px-4 pb-4'}>{children}</div>
    </section>
  );
}
