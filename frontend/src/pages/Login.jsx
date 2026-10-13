import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../context/AuthContext';
import {
  PantallaAuth, CabeceraFoto, EmblemaCabecera, TituloCabecera, HojaAuth, EncabezadoHoja,
  CampoAuth, inputAuth, BotonVerClave, AlertaError, BotonPrimario, Huella, focoVisible,
} from '../components/auth/AuthUI';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [form,            setForm]            = useState({ email: '', password: '' });
  const [errors,          setErrors]          = useState({});
  const [apiError,        setApiError]        = useState('');
  const [loading,         setLoading]         = useState(false);
  const [showPass,        setShowPass]        = useState(false);
  const [turnstileToken,  setTurnstileToken]  = useState('');
  const [turnstileOk,     setTurnstileOk]     = useState(false);
  const [turnstileError,  setTurnstileError]  = useState(false);
  const turnstileRef = useRef(null);

  // Puede enviar si: pasó Turnstile, o si hubo error de carga (graceful fallback)
  const puedeEnviar = turnstileOk || turnstileError;

  const destino  = location.state?.from?.pathname || '/';
  const esOscuro = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setApiError('');
  }

  function validate() {
    const e = {};
    if (!form.email)    e.email    = 'El correo es obligatorio.';
    if (!form.password) e.password = 'La contraseña es obligatoria.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (!turnstileOk && !turnstileError) {
      setApiError('Completa la verificación de seguridad.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password, turnstileToken);
      navigate(destino, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Correo o contraseña incorrectos.');
      // Resetear Turnstile para que el usuario pueda volver a intentarlo
      turnstileRef.current?.reset();
      setTurnstileToken('');
      setTurnstileOk(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PantallaAuth>
      <CabeceraFoto>
        <EmblemaCabecera>
          <Huella className="h-8 w-8 [@media(max-height:700px)]:h-6 [@media(max-height:700px)]:w-6" />
        </EmblemaCabecera>
        <TituloCabecera>HuellaSegura</TituloCabecera>
      </CabeceraFoto>

      <HojaAuth>
        <EncabezadoHoja titulo="Bienvenido de nuevo">
          Ingresa para seguir cuidando a los tuyos.
        </EncabezadoHoja>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 [@media(max-height:640px)]:gap-3">

          <CampoAuth id="email" label="Correo electrónico" icon={Mail} error={errors.email}>
            <input
              id="email" name="email" type="email" inputMode="email"
              placeholder="tucorreo@ejemplo.com"
              value={form.email} onChange={handleChange}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`${inputAuth(errors.email)} pr-4`}
            />
          </CampoAuth>

          <div className="flex flex-col gap-2">
            <CampoAuth id="password" label="Contraseña" icon={Lock} error={errors.password}>
              <input
                id="password" name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={form.password} onChange={handleChange}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`${inputAuth(errors.password)} pr-12`}
              />
              <BotonVerClave visible={showPass} onClick={() => setShowPass(p => !p)} />
            </CampoAuth>
            <Link to="/olvide-contrasena"
                  className={`self-end -my-1.5 -mr-2 px-2 py-2.5 rounded-lg text-[13px] font-semibold
                              text-primary-700 dark:text-primary-400 hover:underline ${focoVisible}`}>
              ¿Olvidaste tu contraseña?
            </Link>
            {/* Cloudflare Turnstile: solo se muestra si Cloudflare necesita que el usuario interactúe */}
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => { setTurnstileToken(token); setTurnstileOk(true); setTurnstileError(false); }}
              onExpire={() => { setTurnstileToken(''); setTurnstileOk(false); }}
              onError={() => { setTurnstileError(true); }}
              options={{ theme: esOscuro ? 'dark' : 'light', language: 'es', size: 'flexible', appearance: 'interaction-only' }}
            />
          </div>

          <AlertaError mensaje={apiError} />

          <BotonPrimario type="submit" loading={loading} disabled={!puedeEnviar} textoCargando="Ingresando…">
            Iniciar sesión
            <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5" />
          </BotonPrimario>
        </form>

        <div className="flex items-center gap-3 my-4 [@media(max-height:640px)]:my-3" aria-hidden="true">
          <span className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="text-xs text-gray-400 dark:text-white/30">o</span>
          <span className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>

        <Link to="/"
              className={`w-full h-12 [@media(max-height:640px)]:h-11 flex items-center justify-center rounded-2xl
                          text-[15px] font-semibold border-[1.5px] border-gray-300 text-dark-700 hover:bg-gray-50
                          dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 transition-colors ${focoVisible}`}>
          Explorar como invitado
        </Link>

        <p className="text-center text-sm text-gray-500 dark:text-white/50 mt-5 [@media(max-height:640px)]:mt-3">
          ¿No tienes cuenta?{' '}
          <Link to="/register"
                className={`inline-block -my-2 px-1 py-2 rounded-lg font-semibold text-primary-700
                            dark:text-primary-400 hover:underline ${focoVisible}`}>
            Regístrate gratis
          </Link>
        </p>
      </HojaAuth>
    </PantallaAuth>
  );
}
