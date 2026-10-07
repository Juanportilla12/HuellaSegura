import { useTokens } from '../../hooks/useTokens';

// Campo de texto con ícono, etiqueta accesible y mensaje de error
export default function CampoTexto({ id, etiqueta, icono: Icono, error, ...props }) {
  const t = useTokens();
  return (
    <div>
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
           style={{ background: t.inputBg, border: `1.5px solid ${error ? t.primary : t.inputBorder}` }}>
        {Icono && <Icono size={16} style={{ color: t.textMuted }} className="shrink-0" aria-hidden="true" />}
        <input id={id} placeholder={etiqueta} aria-invalid={Boolean(error)} {...props}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: t.text, fontFamily: 'inherit' }} />
      </div>
      {error && <p className="text-xs mt-1 font-medium" style={{ color: t.primary }}>{error}</p>}
    </div>
  );
}
