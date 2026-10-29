import { useRef, useState } from 'react';
import { Camera, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import * as usuarioService from '../../services/usuarioService';
import { focoVisible } from '../auth/AuthUI';

import { prepararFoto, FotoNoValida } from '../../utils/imagen';

// Foto de perfil (con cambio de imagen), nombre, correo y celular
export default function CabeceraPerfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);

  const iniciales = usuario?.nombre?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  async function handleFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendo(true);
    try {
      // Se reduce y convierte a JPG antes de subirla (ver utils/imagen.js)
      const { data } = await usuarioService.actualizarFoto(await prepararFoto(archivo));
      actualizarUsuario({ foto_url: data.foto_url });
      toast.success('Foto de perfil actualizada.');
    } catch (err) {
      toast.error(err.response?.data?.message
        || (err instanceof FotoNoValida ? err.message : 'No se pudo actualizar la foto. Intenta de nuevo.'));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <section className="mx-4 rounded-3xl p-4 flex items-center gap-4 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
      <button type="button" onClick={() => inputRef.current?.click()} aria-label="Cambiar foto de perfil"
        className={`relative h-[72px] w-[72px] shrink-0 rounded-full ${focoVisible}`}>
        <span className="h-full w-full rounded-full overflow-hidden flex items-center justify-center bg-primary-700
                         text-white font-poppins font-semibold text-2xl">
          {usuario?.foto_url ? <img src={usuario.foto_url} alt="" className="w-full h-full object-cover" /> : iniciales}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-white dark:bg-dark-700 text-dark-900 dark:text-white
                         border border-warm-border dark:border-white/10 flex items-center justify-center shadow-sm" aria-hidden="true">
          {subiendo
            ? <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-700 border-t-transparent animate-spin" />
            : <Camera size={14} />}
        </span>
      </button>
      <div className="min-w-0">
        <h2 className="font-poppins font-bold text-[19px] leading-tight truncate text-dark-900 dark:text-white">{usuario?.nombre}</h2>
        <p className="text-[14px] truncate text-gray-500 dark:text-white/50">{usuario?.email}</p>
        {usuario?.celular && (
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/50">
            <Phone size={13} aria-hidden="true" /> {usuario.celular}
          </p>
        )}
      </div>
    </section>
  );
}
