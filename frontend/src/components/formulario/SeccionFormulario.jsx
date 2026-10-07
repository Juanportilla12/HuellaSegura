import { useTokens } from '../../hooks/useTokens';

// Tarjeta de formulario con título en mayúsculas y una etiqueta opcional a la derecha
export default function SeccionFormulario({ titulo, paso, etiqueta, accion, children, sinRelleno = false }) {
  const t = useTokens();
  return (
    <section className="rounded-3xl overflow-hidden" style={{ background: t.surface, boxShadow: t.shadow }}>
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
          {paso && <span style={{ color: t.primary }}>{paso}. </span>}
          {titulo}
        </h2>
        {etiqueta && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: t.secondaryBg, color: t.secondary }}>
            {etiqueta}
          </span>
        )}
        {accion}
      </div>
      <div className={sinRelleno ? '' : 'px-4 pb-4'}>{children}</div>
    </section>
  );
}
