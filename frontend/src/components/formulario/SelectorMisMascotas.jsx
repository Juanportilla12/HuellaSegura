import { Plus } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';

const EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };

// HU-09 paso 1: el dueño elige cuál de sus mascotas se perdió
export default function SelectorMisMascotas({ mascotas, cargando, valor, onCambio, onRegistrar, error }) {
  const t = useTokens();

  if (cargando) return <div className="h-24 rounded-2xl animate-pulse" style={{ background: t.skeletonBg }} />;

  if (mascotas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-3 text-center">
        <p className="text-sm" style={{ color: t.textMuted }}>Primero registra a tu mascota para poder reportarla.</p>
        <button type="button" onClick={onRegistrar}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}>
          <Plus size={14} /> Registrar mascota
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="radiogroup" aria-label="Mascota">
        {mascotas.map((m) => {
          const activo = String(m.id) === String(valor);
          return (
            <button key={m.id} type="button" role="radio" aria-checked={activo}
              data-testid={`mascota-opcion-${m.id}`}
              onClick={() => onCambio(String(m.id))}
              className="shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-2xl w-24"
              style={{
                background: activo ? 'linear-gradient(135deg,#FF9280,#F97B62)' : t.surface2,
                border: `1.5px solid ${activo ? 'transparent' : t.border}`,
              }}>
              <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center text-2xl"
                   style={{ background: activo ? 'rgba(255,255,255,0.25)' : t.surface }}>
                {m.foto_principal
                  ? <img src={m.foto_principal} alt="" className="w-full h-full object-cover" />
                  : EMOJIS[m.especie] || '🐾'}
              </div>
              <span className="text-xs font-bold truncate w-full text-center"
                    style={{ color: activo ? 'white' : t.text }}>
                {m.nombre}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs mt-2" style={{ color: t.primary }}>{error}</p>}
    </>
  );
}
