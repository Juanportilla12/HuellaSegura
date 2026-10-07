import { useState } from 'react';
import { toast } from 'sonner';
import { useTokens } from '../../hooks/useTokens';
import * as usuarioService from '../../services/usuarioService';

// Ley 1581 de 2012: el titular puede eliminar su cuenta y todos sus datos
export default function EliminarCuenta() {
  const t = useTokens();
  const [confirmando, setConfirmando] = useState(false);
  const [password, setPassword] = useState('');
  const [borrando, setBorrando] = useState(false);

  async function eliminar(e) {
    e.preventDefault();
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

  if (!confirmando) {
    return (
      <div className="mx-4 mt-3 mb-4">
        <button onClick={() => setConfirmando(true)} data-testid="btn-eliminar-cuenta"
          className="w-full py-3 text-xs font-semibold" style={{ color: t.textMuted }}>
          Eliminar mi cuenta y mis datos
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={eliminar} className="mx-4 mt-3 mb-4 rounded-3xl p-4 flex flex-col gap-3"
          style={{ background: t.surface, border: `1px solid ${t.danger}` }}>
      <label htmlFor="password-borrado" className="text-xs" style={{ color: t.text }}>
        Se eliminarán tu cuenta, tus mascotas, reportes y notificaciones. Esta acción no se puede deshacer.
        Confirma tu contraseña:
      </label>
      <input id="password-borrado" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        required autoComplete="current-password" data-testid="input-password-borrado"
        className="px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.inputBorder}` }} />
      <div className="flex gap-2">
        <button type="button" onClick={() => { setConfirmando(false); setPassword(''); }}
          className="flex-1 py-2.5 rounded-2xl text-xs font-semibold" style={{ color: t.textMuted, border: `1px solid ${t.border}` }}>
          Cancelar
        </button>
        <button type="submit" disabled={borrando}
          className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white" style={{ background: '#EF4444' }}>
          {borrando ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
      </div>
    </form>
  );
}
