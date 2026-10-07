import { useEffect, useMemo } from 'react';
import { Camera, X } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';

const TIPOS = ['image/jpeg', 'image/png'];
const MAX_MB = 5;

// Selección de una foto con vista previa (JPG/PNG, máx. 5 MB)
export default function SelectorFoto({ foto, onCambio, onError }) {
  const t = useTokens();
  const vista = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);

  useEffect(() => () => { if (vista) URL.revokeObjectURL(vista); }, [vista]);

  function handleArchivo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!TIPOS.includes(archivo.type)) return onError?.('Solo se permiten fotos JPG o PNG.');
    if (archivo.size > MAX_MB * 1024 * 1024) return onError?.(`La foto no puede superar ${MAX_MB} MB.`);
    onCambio(archivo);
  }

  if (vista) {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <img src={vista} alt="Vista previa de la foto" className="w-full h-44 object-cover" />
        <button type="button" onClick={() => onCambio(null)} aria-label="Quitar foto"
          className="absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <X size={14} color="white" />
        </button>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center gap-3 h-36 rounded-2xl cursor-pointer"
           style={{ border: `2px dashed ${t.border}`, background: t.inputBg }}>
      <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: t.primaryBg }}>
        <Camera size={22} style={{ color: t.primary }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: t.text }}>Subir una foto</p>
        <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>JPG o PNG · Máx. {MAX_MB} MB</p>
      </div>
      <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleArchivo}
             data-testid="input-foto" />
    </label>
  );
}
