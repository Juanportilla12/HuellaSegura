import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import * as authService from '../services/authService';
import { PantallaAuth, CabeceraFoto, HojaAuth, AlertaError, BotonPrimario, focoVisible } from '../components/auth/AuthUI';

// Enlace "¿No fuiste tú?" de los correos con código. No actúa al abrirse (algunos programas
// de correo abren los enlaces para revisarlos): la persona confirma con el botón.
export default function NoFuiYo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const clave = params.get('clave') || '';
  const claveValida = /^[a-f0-9]{64}$/.test(clave);
  const [estado,  setEstado]  = useState('pregunta'); // pregunta | listo
  const [mensaje, setMensaje] = useState('');
  const [error,   setError]   = useState(claveValida ? '' : 'Este enlace no es válido.');
  const [loading, setLoading] = useState(false);

  async function anular() {
    setLoading(true);
    setError('');
    try {
      const { data } = await authService.anularCodigo(clave);
      setMensaje(data.message);
      setEstado('listo');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo anular el código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PantallaAuth>
      <CabeceraFoto />
      <HojaAuth>
        {estado === 'pregunta' ? (
          <div className="flex flex-col gap-4">
            <span className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300
                             flex items-center justify-center" aria-hidden="true">
              <ShieldAlert size={24} />
            </span>
            <div>
              <h1 className="font-poppins font-bold text-[22px] leading-tight text-dark-900 dark:text-white">¿No fuiste tú?</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-white/60">
                Si no pediste el código que te llegó al correo, anúlalo aquí y nadie podrá usarlo.
                Si alguien intentó crear una cuenta con tu correo, ese registro se cancela.
              </p>
            </div>
            <AlertaError mensaje={error} />
            <BotonPrimario type="button" onClick={anular} loading={loading} disabled={!claveValida}
              textoCargando="Anulando…" data-testid="btn-anular">
              Sí, anular el código
            </BotonPrimario>
            <button type="button" onClick={() => navigate('/login')}
              className={`h-12 rounded-2xl font-semibold text-[15px] text-dark-700 dark:text-white/80
                          hover:bg-black/5 dark:hover:bg-white/5 ${focoVisible}`}>
              Sí fui yo, volver
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4" role="status">
            <span className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300
                             flex items-center justify-center" aria-hidden="true">
              <ShieldCheck size={24} />
            </span>
            <div>
              <h1 className="font-poppins font-bold text-[22px] leading-tight text-dark-900 dark:text-white">Código anulado</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-white/60" data-testid="mensaje-anulado">{mensaje}</p>
            </div>
            <BotonPrimario type="button" onClick={() => navigate('/login')}>Ir al inicio de sesión</BotonPrimario>
          </div>
        )}
      </HojaAuth>
    </PantallaAuth>
  );
}
