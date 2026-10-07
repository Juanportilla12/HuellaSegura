import { useTokens } from '../../hooks/useTokens';

// Área de texto con contador de caracteres
export default function AreaTexto({ id, etiqueta, value, maxLength, ...props }) {
  const t = useTokens();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold" style={{ color: t.textMuted }}>{etiqueta}</label>
      <textarea id={id} value={value} maxLength={maxLength} {...props}
        className="rounded-2xl px-4 py-3 text-sm outline-none resize-none leading-relaxed"
        style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text, fontFamily: 'inherit' }} />
      {maxLength && (
        <span className="text-[10px] text-right" style={{ color: t.textMuted }}>{value.length}/{maxLength}</span>
      )}
    </div>
  );
}
