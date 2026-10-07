import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useTokens } from '../../hooks/useTokens';
import * as usuarioService from '../../services/usuarioService';

const MAX_FOTO_MB = 5;

// Foto de perfil (con cambio de imagen), nombre, correo y estado de las alertas
export default function CabeceraPerfil() {
  const t = useTokens();
  const { usuario, actualizarUsuario } = useAuth();
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);

  const iniciales = usuario?.nombre?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  async function handleFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
      toast.error(`La imagen no puede superar ${MAX_FOTO_MB} MB.`);
      return;
    }
    setSubiendo(true);
    try {
      const { data } = await usuarioService.actualizarFoto(archivo);
      actualizarUsuario({ foto_url: data.foto_url });
      toast.success('Foto de perfil actualizada.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar la foto. Intenta de nuevo.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col items-center pt-5 pb-6 px-5">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFoto} />
      <div className="relative mb-3">
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => inputRef.current?.click()}
          aria-label="Cambiar foto de perfil"
          className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-poppins font-bold text-white"
          style={{
            background: usuario?.foto_url ? 'transparent' : 'linear-gradient(135deg,#FF9280,#F97B62)',
            boxShadow: '0 8px 32px rgba(249,123,98,0.40), 0 0 0 5px rgba(249,123,98,0.12)',
          }}>
          {usuario?.foto_url ? <img src={usuario.foto_url} alt="" className="w-full h-full object-cover" /> : iniciales}
        </motion.button>
        <span className="absolute bottom-0 right-0 h-8 w-8 rounded-full flex items-center justify-center pointer-events-none"
              style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 2px 8px rgba(249,123,98,0.5)' }}>
          {subiendo
            ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Camera size={13} color="white" />}
        </span>
      </div>

      <h2 className="text-xl font-poppins font-bold mb-0.5" style={{ color: t.text }}>{usuario?.nombre}</h2>
      <p className="text-sm mb-2" style={{ color: t.textMuted }}>{usuario?.email}</p>
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: t.secondaryBg }}>
        <CheckCircle size={13} style={{ color: t.secondary }} />
        <span className="text-xs font-semibold" style={{ color: t.secondary }}>
          {usuario?.alertas_activas ? 'Alertas por proximidad activas' : 'Alertas por proximidad desactivadas'}
        </span>
      </div>
    </div>
  );
}
