// Tarjeta de formulario con número de paso, título y una etiqueta o acción opcional a la derecha
export default function SeccionFormulario({ titulo, paso, etiqueta, accion, children, sinRelleno = false }) {
  return (
    <section className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        {paso && (
          <span className="h-7 w-7 shrink-0 rounded-full bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400
                           text-[13px] font-bold flex items-center justify-center" aria-hidden="true">
            {paso}
          </span>
        )}
        <h2 className="flex-1 min-w-0 font-poppins font-semibold text-[16px] leading-tight text-dark-900 dark:text-white">
          {titulo}
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
