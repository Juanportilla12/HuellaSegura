import { useEffect, useMemo } from 'react';
import { Camera, X } from 'lucide-react';
import { focoVisible } from '../auth/AuthUI';

import { prepararFoto } from '../../utils/imagen';

// Selección de una foto con vista previa. La foto se reduce y convierte a JPG
// antes de subirla, así se aceptan fotos grandes de cámara (ver utils/imagen.js)
export default function SelectorFoto({ foto, onCambio, onError, error }) {
  const vista = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);

  useEffect(() => () => { if (vista) URL.revokeObjectURL(vista); }, [vista]);

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      onCambio(await prepararFoto(archivo));
    } catch (err) {
      onError?.(err.message);
    }
  }

  if (vista) {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <img src={vista} alt="Vista previa de la foto" className="w-full h-48 object-cover" />
        <button type="button" onClick={() => onCambio(null)} aria-label="Quitar foto"
          className={`absolute top-2 right-2 h-10 w-10 rounded-full bg-black/55 text-white flex items-center justify-center ${focoVisible}`}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-[1.5px] border-dashed transition-colors
                       focus-within:ring-4 focus-within:ring-primary/20 dark:bg-white/5
                       ${error ? 'border-danger/70 bg-red-50 dark:border-danger/70'
                               : 'border-[#D9CFCA] bg-[#F6F2F0] hover:bg-primary-50/50 dark:border-white/15'}`}>
      <span className="h-12 w-12 shrink-0 rounded-2xl bg-white dark:bg-white/10 text-primary-700 dark:text-primary-400
                       flex items-center justify-center shadow-card">
        <Camera size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-dark-900 dark:text-white">Agregar una foto</span>
        <span className="block text-[13px] text-gray-500 dark:text-white/50">Toma una o elige de tu galería</span>
      </span>
      <input type="file" accept="image/*" className="sr-only" onChange={handleArchivo}
             data-testid="input-foto" />
    </label>
  );
}
