import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, X } from 'lucide-react';
import { actualizarUbicacion } from '../services/usuarioService';
import { useAuth } from '../context/AuthContext';
import fotoPasto from '../assets/mascotas-pasto.webp';
import {
  PantallaAuth, CabeceraFoto, HojaAuth, EncabezadoHoja, Progreso,
  CampoAuth, inputAuth, BotonVerClave, AlertaError, BotonPrimario, focoVisible,
} from '../components/auth/AuthUI';

const NIVELES = [
  { label: 'Muy débil', barra: 'bg-red-500',     texto: 'text-red-600' },
  { label: 'Débil',     barra: 'bg-orange-500',  texto: 'text-orange-700' },
  { label: 'Regular',   barra: 'bg-amber-500',   texto: 'text-amber-700' },
  { label: 'Buena',     barra: 'bg-emerald-500', texto: 'text-emerald-700' },
  { label: 'Fuerte',    barra: 'bg-emerald-600', texto: 'text-emerald-700' },
];

function FuerzaClave({ password }) {
  const nivel = useMemo(() => {
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.max(0, score - 1);
  }, [password]);

  if (!password) return null;
  const n = NIVELES[nivel];
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex gap-1 flex-1" aria-hidden="true">
        {NIVELES.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200
                                    ${i <= nivel ? n.barra : 'bg-gray-200 dark:bg-white/10'}`} />
        ))}
      </div>
      <span className={`text-xs font-semibold shrink-0 ${n.texto} dark:brightness-150`}>
        Seguridad: {n.label}
      </span>
    </div>
  );
}

// Hoja inferior con el texto completo de la autorización (Ley 1581 de 2012)
function DetalleDatos({ abierto, onCerrar }) {
  const cerrarRef = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Cerrar" tabIndex={-1} onClick={onCerrar}
                  className="absolute inset-0 bg-black/40" />
          <motion.div role="dialog" aria-modal="true" aria-labelledby="titulo-datos"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[430px] rounded-t-[28px] bg-white dark:bg-dark-800 px-6 pt-6
                       pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 id="titulo-datos" className="font-poppins font-bold text-lg text-dark-900 dark:text-white">
                Tratamiento de tus datos
              </h2>
              <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar"
                      className={`-mr-2 -mt-1 h-10 w-10 rounded-full flex items-center justify-center text-gray-500
                                  hover:bg-gray-100 dark:hover:bg-white/10 ${focoVisible}`}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="text-sm leading-relaxed text-gray-600 dark:text-white/70 flex flex-col gap-2">
              <p>
                Autorizo el tratamiento de mis datos personales (nombre, correo y celular) conforme a la
                Ley 1581 de 2012.
              </p>
              <p>
                Mi celular solo se mostrará en el perfil público de mis mascotas y podré eliminar mi cuenta
                en cualquier momento.
              </p>
            </div>
            <BotonPrimario type="button" onClick={onCerrar} className="mt-6">Entendido</BotonPrimario>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Casilla({ checked, onChange, testId, children }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer text-[13px] leading-snug text-gray-600 dark:text-white/70">
      <input type="checkbox" checked={checked} onChange={onChange} data-testid={testId}
             className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded accent-primary-700 cursor-pointer" />
      <span>{children}</span>
    </label>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [paso,     setPaso]     = useState(0); // 0 = datos, 1 = seguridad
  const [form,     setForm]     = useState({ nombre: '', email: '', celular: '', password: '', confirmPassword: '' });
  const [aceptaDatos,     setAceptaDatos]     = useState(false);
  const [aceptaUbicacion, setAceptaUbicacion] = useState(false);
  const [verDetalle, setVerDetalle] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const cerrarDetalle = useCallback(() => setVerDetalle(false), []);

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setApiError('');
  }

  function validarDatos() {
    const e = {};
    if (!form.nombre.trim())                 e.nombre = 'El nombre es obligatorio.';
    else if (form.nombre.trim().length < 2)  e.nombre = 'Mínimo 2 caracteres.';
    if (!form.email)                         e.email  = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido.';
    if (!form.celular.trim())                e.celular = 'El celular es obligatorio.';
    else if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(form.celular.trim())) e.celular = 'Celular inválido.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function validarSeguridad() {
    const e = {};
    if (!form.password)                      e.password = 'La contraseña es obligatoria.';
    else if (form.password.length < 8)       e.password = 'Mínimo 8 caracteres.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.';
    if (!aceptaDatos)                        e.aceptaDatos = 'Debes autorizar el tratamiento de tus datos.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function handleContinuar(e) {
    e.preventDefault();
    if (validarDatos()) setPaso(1);
  }

  function volver() {
    setApiError('');
    if (paso === 1) setPaso(0);
    else navigate('/login');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validarSeguridad()) return;
    setLoading(true);
    try {
      await register({
        nombre: form.nombre.trim(), email: form.email, celular: form.celular.trim(), password: form.password,
      });
      // Consentimiento explícito de ubicación para alertas por proximidad (Ley 1581)
      if (aceptaUbicacion && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => actualizarUbicacion(coords.latitude, coords.longitude).catch(() => {}),
          () => {},
          { timeout: 10000 }
        );
      }
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al registrarse. Intenta de nuevo.';
      // Si el problema es el correo, se vuelve al paso donde se puede corregir
      if (/correo/i.test(msg)) {
        setPaso(0);
        setErrors({ email: msg });
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const formClase = 'flex flex-col gap-4 [@media(max-height:640px)]:gap-3';

  return (
    <PantallaAuth>
      <CabeceraFoto onVolver={volver} compacta foto={fotoPasto} posicion="50% 45%" />

      <HojaAuth>
        <Progreso paso={paso} total={2} soloBarra={Object.values(errors).some(Boolean)} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={paso}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}>

            {/* ── Paso 1: datos personales ───────────────────── */}
            {paso === 0 && (
              <>
                <EncabezadoHoja titulo="Crea tu cuenta">
                  Únete a la red que cuida a las mascotas.
                </EncabezadoHoja>
                <form onSubmit={handleContinuar} noValidate className={formClase}>
                  <CampoAuth id="nombre" label="Nombre completo" icon={User} error={errors.nombre}>
                    <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                      placeholder="Ej. Juan Ortiz" autoComplete="name" autoCapitalize="words"
                      aria-invalid={!!errors.nombre} aria-describedby={errors.nombre ? 'nombre-error' : undefined}
                      className={`${inputAuth(errors.nombre)} pr-4`} />
                  </CampoAuth>
                  <CampoAuth id="email" label="Correo electrónico" icon={Mail} error={errors.email}>
                    <input id="email" name="email" type="email" inputMode="email" value={form.email} onChange={handleChange}
                      placeholder="tucorreo@ejemplo.com" autoComplete="email"
                      aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined}
                      className={`${inputAuth(errors.email)} pr-4`} />
                  </CampoAuth>
                  <CampoAuth id="celular" label="Celular" icon={Phone} error={errors.celular}>
                    <input id="celular" name="celular" type="tel" inputMode="tel" value={form.celular} onChange={handleChange}
                      placeholder="300 123 4567" autoComplete="tel"
                      aria-invalid={!!errors.celular} aria-describedby={errors.celular ? 'celular-error' : undefined}
                      className={`${inputAuth(errors.celular)} pr-4`} />
                  </CampoAuth>
                  <BotonPrimario type="submit" className="mt-1">
                    Continuar <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true"
                                          className="transition-transform group-hover:translate-x-0.5" />
                  </BotonPrimario>
                </form>
              </>
            )}

            {/* ── Paso 2: contraseña y autorizaciones ────────── */}
            {paso === 1 && (
              <>
                <EncabezadoHoja titulo="Protege tu cuenta">
                  Crea una contraseña segura.
                </EncabezadoHoja>
                <form onSubmit={handleSubmit} noValidate className={formClase}>
                  <div className="flex flex-col gap-2">
                    <CampoAuth id="password" label="Contraseña" icon={Lock} error={errors.password}>
                      <input id="password" name="password" type={showPass ? 'text' : 'password'}
                        value={form.password} onChange={handleChange}
                        placeholder="Mínimo 8 caracteres" autoComplete="new-password" autoFocus
                        aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined}
                        className={`${inputAuth(errors.password)} pr-12`} />
                      <BotonVerClave visible={showPass} onClick={() => setShowPass(p => !p)} />
                    </CampoAuth>
                    <FuerzaClave password={form.password} />
                  </div>
                  <CampoAuth id="confirmPassword" label="Confirmar contraseña" icon={Lock} error={errors.confirmPassword}>
                    <input id="confirmPassword" name="confirmPassword" type={showPass ? 'text' : 'password'}
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="Repite tu contraseña" autoComplete="new-password"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      className={`${inputAuth(errors.confirmPassword)} pr-4`} />
                  </CampoAuth>

                  {/* Consentimientos (Ley 1581 de 2012) */}
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <Casilla checked={aceptaDatos} testId="check-datos"
                               onChange={e => { setAceptaDatos(e.target.checked); setErrors(p => ({ ...p, aceptaDatos: '' })); }}>
                        Autorizo el tratamiento de mis datos según la Ley 1581 de 2012.{' '}
                        <button type="button" onClick={(e) => { e.preventDefault(); setVerDetalle(true); }}
                                className={`font-semibold text-primary-700 dark:text-primary-400 underline rounded ${focoVisible}`}>
                          Ver detalles
                        </button>
                      </Casilla>
                      {errors.aceptaDatos && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-[30px] mt-1">{errors.aceptaDatos}</p>
                      )}
                    </div>
                    <Casilla checked={aceptaUbicacion} testId="check-ubicacion"
                             onChange={e => setAceptaUbicacion(e.target.checked)}>
                      Compartir mi ubicación para recibir alertas de mascotas perdidas cerca{' '}
                      <span className="text-gray-500 dark:text-white/40">(opcional)</span>
                    </Casilla>
                  </div>

                  <AlertaError mensaje={apiError} />

                  <BotonPrimario type="submit" loading={loading} textoCargando="Creando cuenta…">
                    Crear cuenta <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true"
                                             className="transition-transform group-hover:translate-x-0.5" />
                  </BotonPrimario>
                </form>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-sm text-gray-500 dark:text-white/50 mt-4 [@media(max-height:640px)]:mt-2">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login"
                className={`inline-block -my-2 px-1 py-2 rounded-lg font-semibold text-primary-700
                            dark:text-primary-400 hover:underline ${focoVisible}`}>
            Inicia sesión
          </Link>
        </p>
      </HojaAuth>

      <DetalleDatos abierto={verDetalle} onCerrar={cerrarDetalle} />
    </PantallaAuth>
  );
}
