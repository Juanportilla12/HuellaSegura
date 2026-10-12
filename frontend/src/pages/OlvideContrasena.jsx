import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import * as authService from '../services/authService';
import fotoGatosPitbull from '../assets/gatos-pitbull.webp';
import {
  PantallaAuth, CabeceraFoto, HojaAuth, EncabezadoHoja,
  CampoAuth, inputAuth, BotonVerClave, AlertaError, BotonPrimario, Progreso, Requisito, focoVisible,
} from '../components/auth/AuthUI';

const ESPERA_REENVIO = 30; // segundos antes de poder pedir otro código
const CODIGO_VACIO = ['', '', '', '', '', ''];

export default function OlvideContrasena() {
  const navigate = useNavigate();
  const [step,     setStep]     = useState(0); // 0=email, 1=codigo, 2=nueva clave, 3=exito
  const [email,    setEmail]    = useState('');
  const [codigo,   setCodigo]   = useState(CODIGO_VACIO);
  const [pass,     setPass]     = useState('');
  const [passConf, setPassConf] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [espera,   setEspera]   = useState(0);
  const inputsRef = useRef([]);

  // Cuenta regresiva para reenviar el código
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  function volver() {
    setError('');
    if (step > 0 && step < 3) setStep(s => s - 1);
    else navigate('/login');
  }

  // ── Paso 1: enviar código ──────────────────────────────────
  async function enviarCodigo() {
    if (!email) return setError('Ingresa tu correo electrónico.');
    setError(''); setLoading(true);
    try {
      await authService.solicitarCodigoRecuperacion(email);
      setCodigo(CODIGO_VACIO);
      setEspera(ESPERA_REENVIO);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el código.');
    } finally { setLoading(false); }
  }

  function handleEnviarCodigo(e) {
    e.preventDefault();
    enviarCodigo();
  }

  // ── Paso 2: verificar código ──────────────────────────────
  function handleCodigoChange(val, idx) {
    if (!/^\d?$/.test(val)) return;
    const nuevo = [...codigo];
    nuevo[idx] = val;
    setCodigo(nuevo);
    setError('');
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  // Permite pegar el código completo desde el correo
  function handleCodigoPaste(e) {
    const digitos = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digitos) return;
    e.preventDefault();
    const nuevo = CODIGO_VACIO.map((_, i) => digitos[i] || '');
    setCodigo(nuevo);
    setError('');
    inputsRef.current[Math.min(digitos.length, 5)]?.focus();
  }

  async function handleVerificarCodigo(e) {
    e.preventDefault();
    const cod = codigo.join('');
    if (cod.length < 6) return setError('Ingresa los 6 dígitos del código.');
    setError(''); setLoading(true);
    try {
      await authService.verificarCodigoRecuperacion(email, cod);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido o expirado.');
      setCodigo(CODIGO_VACIO);
      inputsRef.current[0]?.focus();
    } finally { setLoading(false); }
  }

  // ── Paso 3: nueva contraseña ──────────────────────────────
  const largoOk  = pass.length >= 8;
  const coincide = pass.length > 0 && pass === passConf;

  async function handleResetear(e) {
    e.preventDefault();
    if (!largoOk) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (!coincide) return setError('Las contraseñas no coinciden.');
    setError(''); setLoading(true);
    try {
      await authService.restablecerPassword(email, codigo.join(''), pass);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña.');
    } finally { setLoading(false); }
  }

  const formClase = 'flex flex-col gap-4 [@media(max-height:640px)]:gap-3';

  return (
    <PantallaAuth>
      <CabeceraFoto onVolver={step < 3 ? volver : undefined} foto={fotoGatosPitbull} posicion="50% 30%" />

      <HojaAuth>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}>

            {step < 3 && <Progreso paso={step} total={3} />}

            {/* ── Paso 0: correo ─────────────────────────────── */}
            {step === 0 && (
              <>
                <EncabezadoHoja titulo="¿Olvidaste tu contraseña?">
                  Escribe tu correo y te enviaremos un código para crear una nueva.
                </EncabezadoHoja>
                <form onSubmit={handleEnviarCodigo} noValidate className={formClase}>
                  <CampoAuth id="email" label="Correo electrónico" icon={Mail}>
                    <input id="email" type="email" inputMode="email" value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="tucorreo@ejemplo.com" autoComplete="email"
                      className={`${inputAuth(false)} pr-4`} />
                  </CampoAuth>
                  <AlertaError mensaje={error} />
                  <BotonPrimario type="submit" loading={loading} textoCargando="Enviando código…">
                    Enviar código <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                  </BotonPrimario>
                </form>
              </>
            )}

            {/* ── Paso 1: código ─────────────────────────────── */}
            {step === 1 && (
              <>
                <div className="mb-5 [@media(max-height:640px)]:mb-4">
                  <h1 className="font-poppins font-bold text-[22px] leading-tight text-dark-900 dark:text-white">
                    Revisa tu correo
                  </h1>
                  <p className="text-sm mt-1 text-gray-500 dark:text-white/50">
                    Enviamos un código de 6 dígitos a
                    <span className="block font-semibold text-dark-900 dark:text-white truncate">{email}</span>
                  </p>
                </div>
                <form onSubmit={handleVerificarCodigo} noValidate className={formClase}>
                  <fieldset>
                    <legend className="sr-only">Código de verificación de 6 dígitos</legend>
                    <div className="flex gap-2 justify-between">
                      {codigo.map((d, i) => (
                        <input
                          key={i}
                          ref={el => inputsRef.current[i] = el}
                          type="text" inputMode="numeric" maxLength={1}
                          autoComplete={i === 0 ? 'one-time-code' : 'off'}
                          autoFocus={i === 0}
                          aria-label={`Dígito ${i + 1}`}
                          value={d}
                          onChange={e => handleCodigoChange(e.target.value, i)}
                          onPaste={handleCodigoPaste}
                          onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) inputsRef.current[i - 1]?.focus(); }}
                          className={`h-14 [@media(max-height:640px)]:h-12 w-full min-w-0 rounded-2xl text-center
                                      text-xl font-poppins font-bold outline-none transition-all border-[1.5px]
                                      text-dark-900 dark:text-white focus:ring-4 focus:ring-primary/15 focus:border-primary
                                      ${d ? 'bg-white border-primary/60 dark:bg-white/10'
                                          : 'bg-[#F6F2F0] border-[#E3DCD8] dark:bg-white/5 dark:border-white/10'}`}
                        />
                      ))}
                    </div>
                  </fieldset>
                  <p className="text-xs text-gray-500 dark:text-white/40 -mt-1">El código vence en 15 minutos.</p>
                  <AlertaError mensaje={error} />
                  <BotonPrimario type="submit" loading={loading} disabled={codigo.join('').length < 6}
                                 textoCargando="Verificando…">
                    Verificar código <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                  </BotonPrimario>
                  <div className="flex items-center justify-between text-[13px] font-semibold">
                    <button type="button" onClick={volver}
                            className={`-ml-2 px-2 py-2.5 rounded-lg text-gray-600 dark:text-white/60 hover:underline ${focoVisible}`}>
                      Cambiar correo
                    </button>
                    <button type="button" onClick={enviarCodigo} disabled={espera > 0 || loading}
                            className={`-mr-2 px-2 py-2.5 rounded-lg text-primary-700 dark:text-primary-400 hover:underline
                                        disabled:text-gray-500 disabled:no-underline dark:disabled:text-white/40 ${focoVisible}`}>
                      {espera > 0 ? `Reenviar en ${espera}s` : 'Reenviar código'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── Paso 2: nueva contraseña ───────────────────── */}
            {step === 2 && (
              <>
                <EncabezadoHoja titulo="Crea tu nueva contraseña">
                  Usa una que no hayas usado antes.
                </EncabezadoHoja>
                <form onSubmit={handleResetear} noValidate className={formClase}>
                  <CampoAuth id="nueva" label="Nueva contraseña" icon={Lock}>
                    <input id="nueva" type={showPass ? 'text' : 'password'} value={pass}
                      onChange={e => { setPass(e.target.value); setError(''); }}
                      placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                      aria-describedby="requisitos"
                      className={`${inputAuth(false)} pr-12`} />
                    <BotonVerClave visible={showPass} onClick={() => setShowPass(p => !p)} />
                  </CampoAuth>
                  <CampoAuth id="confirmar" label="Confirmar contraseña" icon={Lock}>
                    <input id="confirmar" type={showPass ? 'text' : 'password'} value={passConf}
                      onChange={e => { setPassConf(e.target.value); setError(''); }}
                      placeholder="Repite tu contraseña" autoComplete="new-password"
                      className={`${inputAuth(false)} pr-4`} />
                  </CampoAuth>
                  <ul id="requisitos" className="flex flex-wrap gap-x-4 gap-y-1.5 -mt-1">
                    <Requisito cumple={largoOk}>Mínimo 8 caracteres</Requisito>
                    <Requisito cumple={coincide}>Las contraseñas coinciden</Requisito>
                  </ul>
                  <AlertaError mensaje={error} />
                  <BotonPrimario type="submit" loading={loading} textoCargando="Guardando…">
                    Guardar contraseña <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                  </BotonPrimario>
                </form>
              </>
            )}

            {/* ── Paso 3: éxito ──────────────────────────────── */}
            {step === 3 && (
              <div className="text-center pt-2" role="status">
                <EncabezadoHoja titulo="¡Contraseña actualizada!" />
                <p className="text-sm text-gray-500 dark:text-white/50 -mt-3 mb-6">
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
                <BotonPrimario type="button" onClick={() => navigate('/login', { replace: true })}>
                  Ir a iniciar sesión <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                </BotonPrimario>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </HojaAuth>
    </PantallaAuth>
  );
}
