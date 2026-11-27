import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ArrowRight, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';
import { actualizarUbicacion } from '../services/usuarioService';
import { obtenerUbicacion } from '../utils/ubicacion';
import fotoPasto from '../assets/mascotas-pasto.webp';
import {
  PantallaAuth, CabeceraFoto, HojaAuth, AlertaError, BotonPrimario, focoVisible,
} from '../components/auth/AuthUI';

// Paso final del registro (y de un inicio de sesión con el correo sin verificar): la cuenta
// se activa con el código de 6 dígitos que llegó al correo. Así nadie puede registrar un
// correo que no es suyo.
const ESPERA_REENVIO = 60; // segundos, igual que el servidor
const CODIGO_VACIO = ['', '', '', '', '', ''];

export default function VerificarCorreo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { verificarCorreo } = useAuth();
  const email = state?.email;

  const [codigo,  setCodigo]  = useState(CODIGO_VACIO);
  const [error,   setError]   = useState('');
  const [aviso,   setAviso]   = useState('');
  const [loading, setLoading] = useState(false);
  const [espera,  setEspera]  = useState(state?.recienEnviado === false ? 0 : ESPERA_REENVIO);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  // Sin correo (p. ej. si se recarga la página) se vuelve al inicio de sesión
  if (!email) return <Navigate to="/login" replace />;

  function cambiarDigito(valor, i) {
    if (!/^\d?$/.test(valor)) return;
    const nuevo = [...codigo];
    nuevo[i] = valor;
    setCodigo(nuevo);
    setError('');
    if (valor && i < 5) inputsRef.current[i + 1]?.focus();
  }

  // Permite pegar el código completo desde el correo
  function pegarCodigo(e) {
    const digitos = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digitos) return;
    e.preventDefault();
    setCodigo(CODIGO_VACIO.map((_, i) => digitos[i] || ''));
    setError('');
    inputsRef.current[Math.min(digitos.length, 5)]?.focus();
  }

  async function verificar(e) {
    e.preventDefault();
    const cod = codigo.join('');
    if (cod.length < 6) return setError('Escribe los 6 dígitos del código.');
    setLoading(true);
    setError('');
    try {
      await verificarCorreo(email, cod);
      // Consentimiento de ubicación dado al registrarse (Ley 1581): se guarda ya con sesión
      if (state?.aceptaUbicacion) {
        obtenerUbicacion().then(({ lat, lng }) => actualizarUbicacion(lat, lng)).catch(() => {});
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo verificar el código.');
      setCodigo(CODIGO_VACIO);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function reenviar() {
    setError('');
    setAviso('');
    try {
      await authService.reenviarVerificacion(email);
      setAviso('Te enviamos un código nuevo. Revisa también la carpeta de spam.');
      setCodigo(CODIGO_VACIO);
      setEspera(ESPERA_REENVIO);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo reenviar el código.');
    }
  }

  return (
    <PantallaAuth>
      <CabeceraFoto onVolver={() => navigate('/login')} compacta foto={fotoPasto} posicion="50% 45%" />
      <HojaAuth>
        <div className="mb-5 [@media(max-height:640px)]:mb-4">
          <span className="h-12 w-12 mb-3 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300
                           flex items-center justify-center" aria-hidden="true">
            <MailCheck size={24} />
          </span>
          <h1 className="font-poppins font-bold text-[22px] leading-tight text-dark-900 dark:text-white">
            Confirma tu correo
          </h1>
          <p className="text-sm mt-1 text-gray-500 dark:text-white/50">
            Para activar tu cuenta, escribe el código de 6 dígitos que enviamos a
            <span className="block font-semibold text-dark-900 dark:text-white truncate" data-testid="correo-a-verificar">{email}</span>
          </p>
        </div>

        <form onSubmit={verificar} noValidate className="flex flex-col gap-4 [@media(max-height:640px)]:gap-3">
          <fieldset>
            <legend className="sr-only">Código de verificación de 6 dígitos</legend>
            <div className="flex gap-2 justify-between">
              {codigo.map((d, i) => (
                <input key={i} ref={(el) => { inputsRef.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1}
                  autoComplete={i === 0 ? 'one-time-code' : 'off'} autoFocus={i === 0}
                  aria-label={`Dígito ${i + 1}`} value={d}
                  onChange={(e) => cambiarDigito(e.target.value, i)}
                  onPaste={pegarCodigo}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) inputsRef.current[i - 1]?.focus(); }}
                  className={`h-14 [@media(max-height:640px)]:h-12 w-full min-w-0 rounded-2xl text-center
                              text-xl font-poppins font-bold outline-none transition-all border-[1.5px]
                              text-dark-900 dark:text-white focus:ring-4 focus:ring-primary/15 focus:border-primary
                              ${d ? 'bg-white border-primary/60 dark:bg-white/10'
                                  : 'bg-[#F6F2F0] border-[#E3DCD8] dark:bg-white/5 dark:border-white/10'}`} />
              ))}
            </div>
          </fieldset>
          <p className="text-xs text-gray-500 dark:text-white/40 -mt-1">
            El código vence en 15 minutos. Si no lo ves, revisa la carpeta de spam.
          </p>
          {aviso && <p role="status" className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300">{aviso}</p>}
          <AlertaError mensaje={error} />
          <BotonPrimario type="submit" loading={loading} disabled={codigo.join('').length < 6} textoCargando="Verificando…">
            Activar mi cuenta <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
          </BotonPrimario>
          <div className="flex items-center justify-between text-[13px] font-semibold">
            <button type="button" onClick={() => navigate('/register')}
              className={`-ml-2 px-2 py-2.5 rounded-lg text-gray-600 dark:text-white/60 hover:underline ${focoVisible}`}>
              Cambiar correo
            </button>
            <button type="button" onClick={reenviar} disabled={espera > 0}
              className={`-mr-2 px-2 py-2.5 rounded-lg text-primary-700 dark:text-primary-400 hover:underline
                          disabled:text-gray-500 disabled:no-underline dark:disabled:text-white/40 ${focoVisible}`}>
              {espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar código'}
            </button>
          </div>
        </form>
      </HojaAuth>
    </PantallaAuth>
  );
}
