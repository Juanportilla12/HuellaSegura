import { useTokens } from '../../hooks/useTokens';

// Interruptor accesible (role="switch")
export default function Interruptor({ activo, onCambio, etiqueta, deshabilitado = false }) {
  const t = useTokens();
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={deshabilitado}
      onClick={() => onCambio(!activo)}
      className="relative h-7 w-12 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-60"
      style={{ background: activo ? t.primary : (t.isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB') }}>
      <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-200"
            style={{ left: activo ? 'calc(100% - 1.625rem)' : '0.125rem' }} />
    </button>
  );
}
