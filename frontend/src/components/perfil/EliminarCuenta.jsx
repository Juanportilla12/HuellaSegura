import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import * as usuarioService from '../../services/usuarioService';
import HojaConfirmacion from '../ui/HojaConfirmacion';
import { inputAuth, focoVisible } from '../auth/AuthUI';

// Ley 1581 de 2012: el titular puede eliminar su cuenta y todos sus datos
export default function EliminarCuenta() {
  const [abierta, setAbierta] = useState(false);
  const [password, setPassword] = useState('');
  const [borrando, setBorrando] = useState(false);

  const cancelar = useCallback(() => { setAbierta(false); setPassword(''); }, []);

  async function eliminar() {
    if (!password) { toast.error('Escribe tu contraseña para confirmar.'); return; }
    setBorrando(true);
    try {
      await usuarioService.eliminarCuenta(password);
      toast.success('Tu cuenta y tus datos fueron eliminados.');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.assign('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar la cuenta.');
      setBorrando(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} data-testid="btn-eliminar-cuenta"
        className={`self-center h-11 px-4 rounded-xl flex items-center gap-2 text-[14px] font-semibold text-red-600
                    hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 ${focoVisible}`}>
        <Trash2 size={16} aria-hidden="true" /> Eliminar mi cuenta y mis datos
      </button>

      <HojaConfirmacion abierta={abierta} titulo="¿Eliminar tu cuenta?" peligro cargando={borrando}
        textoConfirmar="Eliminar definitivamente" onConfirmar={eliminar} onCancelar={cancelar}
        extra={
          <>
            <label htmlFor="password-borrado" className="text-[13px] font-semibold text-dark-700 dark:text-white/70">
              Confirma con tu contraseña
            </label>
            <input id="password-borrado" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" data-testid="input-password-borrado"
              onKeyDown={(e) => { if (e.key === 'Enter') eliminar(); }}
              className={`${inputAuth(false)} !pl-4 pr-4 mt-1.5`} />
          </>
        }>
        Se borrarán tu cuenta, tus mascotas, reportes y notificaciones. Esta acción no se puede deshacer.
      </HojaConfirmacion>
    </>
  );
}
