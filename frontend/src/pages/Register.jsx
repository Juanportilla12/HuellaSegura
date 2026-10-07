import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, MapPin, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { actualizarUbicacion } from '../services/usuarioService';
import { useAuth } from '../context/AuthContext';

function FloatingOrb({ style }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

function PasswordStrength({ password }) {
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const levels = [
    { label: 'Muy débil', color: '#F87171' },
    { label: 'Débil',     color: '#FB923C' },
    { label: 'Regular',   color: '#FBBF24' },
    { label: 'Buena',     color: '#34D399' },
    { label: 'Fuerte',    color: '#10B981' },
  ];

  if (!password) return null;
  const lvl = Math.min(4, strength - 1);

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[0,1,2,3,4].map(i => (
          <motion.div
            key={i}
            className="flex-1 h-1 rounded-full"
            animate={{ background: i <= lvl ? levels[lvl].color : 'rgba(255,255,255,0.1)' }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold shrink-0" style={{ color: levels[Math.max(0, lvl)].color }}>
        {levels[Math.max(0, lvl)].label}
      </span>
    </div>
  );
}

function Field({ label, id, name, type = 'text', placeholder, value, onChange, error,
                 icon: Icon, autoComplete, extra }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold tracking-wide uppercase"
             style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: error ? '#F87171' : focused ? '#F97B62' : 'rgba(255,255,255,0.35)' }} />
        <input
          id={id} name={name} type={type} placeholder={placeholder}
          value={value} onChange={onChange} autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
          style={{
            background: error ? 'rgba(248,113,113,0.1)' : focused ? 'rgba(249,123,98,0.08)' : 'rgba(255,255,255,0.07)',
            border: error
              ? '1.5px solid rgba(248,113,113,0.6)'
              : focused
                ? '1.5px solid rgba(249,123,98,0.7)'
                : '1.5px solid rgba(255,255,255,0.1)',
          }}
        />
      </div>
      {error && <p className="text-xs pl-1" style={{ color: '#F87171' }}>{error}</p>}
      {extra}
    </div>
  );
}

const BENEFICIOS = [
  'Registra tus mascotas con QR',
  'Recibe alertas de avistamientos',
  'Conecta con tu comunidad',
];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form,     setForm]     = useState({ nombre: '', email: '', celular: '', password: '', confirmPassword: '' });
  const [aceptaDatos,     setAceptaDatos]     = useState(false);
  const [aceptaUbicacion, setAceptaUbicacion] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setApiError('');
  }

  function validate() {
    const e = {};
    if (!form.nombre.trim())                 e.nombre = 'El nombre es obligatorio.';
    else if (form.nombre.trim().length < 2)  e.nombre = 'Mínimo 2 caracteres.';
    if (!form.email)                         e.email  = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido.';
    if (!form.celular.trim())                e.celular = 'El celular es obligatorio.';
    else if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(form.celular.trim())) e.celular = 'Celular inválido.';
    if (!form.password)                      e.password = 'La contraseña es obligatoria.';
    else if (form.password.length < 8)       e.password = 'Mínimo 8 caracteres.';
    if (!aceptaDatos)                        e.aceptaDatos = 'Debes autorizar el tratamiento de tus datos.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
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
      setApiError(err.response?.data?.message || 'Error al registrarse. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden"
         style={{ background: 'linear-gradient(160deg,#0D1F2D 0%,#1A2A3A 45%,#0E3047 100%)' }}>

      {/* ── Orbs ──────────────────────────────────────────────────── */}
      <FloatingOrb style={{
        top: '-60px', left: '-60px', width: '260px', height: '260px',
        background: 'radial-gradient(circle,rgba(0,196,180,0.22) 0%,transparent 70%)',
        animation: 'floatSlow 7s ease-in-out infinite',
      }} />
      <FloatingOrb style={{
        bottom: '20%', right: '-70px', width: '220px', height: '220px',
        background: 'radial-gradient(circle,rgba(249,123,98,0.2) 0%,transparent 70%)',
        animation: 'float 9s ease-in-out infinite 1.5s',
      }} />
      <FloatingOrb style={{
        top: '35%', left: '-40px', width: '140px', height: '140px',
        background: 'radial-gradient(circle,rgba(155,135,232,0.14) 0%,transparent 70%)',
        animation: 'floatSlow 5s ease-in-out infinite 3s',
      }} />

      {/* ── Header compacto ───────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center pt-10 pb-4 px-6">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: 15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
          className="relative mb-4"
        >
          <div className="h-20 w-20 rounded-[1.7rem] flex items-center justify-center text-4xl select-none"
               style={{
                 background: 'linear-gradient(135deg,#26D6CD,#00C4B4)',
                 boxShadow: '0 14px 40px rgba(0,196,180,0.45), 0 0 0 1px rgba(255,255,255,0.1)',
               }}>
            🐾
          </div>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.4 }}
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#FF9280,#F97B62)',
              boxShadow: '0 4px 12px rgba(249,123,98,0.55)',
            }}>
            <MapPin size={13} color="white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="text-center mb-4"
        >
          <h1 className="font-poppins font-extrabold leading-none select-none"
              style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'white' }}>Huella</span>
            <span style={{
              background: 'linear-gradient(90deg,#F97B62,#FF9280)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Segura</span>
          </h1>
          <p className="text-xs font-semibold mt-1 tracking-[0.2em] uppercase"
             style={{ color: 'rgba(255,255,255,0.3)' }}>
            Únete a la red vecinal
          </p>
        </motion.div>

        {/* Beneficios */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex flex-col gap-1.5 w-full max-w-xs"
        >
          {BENEFICIOS.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-2"
            >
              <CheckCircle size={13} style={{ color: '#00C4B4', flexShrink: 0 }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{b}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Formulario ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        className="relative z-10 mx-4 mb-5 rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.11)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="px-6 pt-6 pb-7 flex flex-col gap-4">

          <div>
            <h2 className="font-poppins font-bold text-2xl text-white">Crea tu cuenta</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Regístrate y empieza a proteger a tu mascota.
            </p>
          </div>

          {/* Error API */}
          <AnimatePresence>
            {apiError && (
              <motion.div role="alert"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl px-4 py-3 text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                ⚠️ {apiError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">

            {/* Nombre */}
            <Field
              label="Nombre completo" id="nombre" name="nombre"
              placeholder="Juan Ortiz"
              value={form.nombre} onChange={handleChange} error={errors.nombre}
              icon={User} autoComplete="name"
            />

            {/* Email */}
            <Field
              label="Correo electrónico" id="email" name="email" type="email"
              placeholder="juan@gmail.com"
              value={form.email} onChange={handleChange} error={errors.email}
              icon={Mail} autoComplete="email"
            />

            {/* Celular (R1) */}
            <Field
              label="Celular" id="celular" name="celular" type="tel"
              placeholder="300 123 4567"
              value={form.celular} onChange={handleChange} error={errors.celular}
              icon={Phone} autoComplete="tel"
            />

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold tracking-wide uppercase"
                     style={{ color: 'rgba(255,255,255,0.5)' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: errors.password ? '#F87171' : 'rgba(255,255,255,0.35)' }} />
                <input
                  id="password" name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
                  style={{
                    background: errors.password ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.07)',
                    border: errors.password ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid rgba(0,196,180,0.7)'; e.target.style.background = 'rgba(0,196,180,0.08)'; }}
                  onBlur={e => { e.target.style.border = errors.password ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.1)'; e.target.style.background = errors.password ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.07)'; }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                        aria-label={showPass ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} aria-pressed={showPass}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && <p className="text-xs pl-1" style={{ color: '#F87171' }}>{errors.password}</p>}
            </div>

            {/* Confirmar contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wide uppercase"
                     style={{ color: 'rgba(255,255,255,0.5)' }}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: errors.confirmPassword ? '#F87171' : 'rgba(255,255,255,0.35)' }} />
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showConf ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword} onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
                  style={{
                    background: errors.confirmPassword ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.07)',
                    border: errors.confirmPassword ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid rgba(0,196,180,0.7)'; e.target.style.background = 'rgba(0,196,180,0.08)'; }}
                  onBlur={e => { e.target.style.border = errors.confirmPassword ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.1)'; e.target.style.background = errors.confirmPassword ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.07)'; }}
                />
                <button type="button" onClick={() => setShowConf(p => !p)}
                        aria-label={showConf ? 'Ocultar la confirmación' : 'Mostrar la confirmación'} aria-pressed={showConf}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs pl-1" style={{ color: '#F87171' }}>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Consentimientos (Ley 1581 de 2012) */}
            <div className="flex flex-col gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={aceptaDatos} data-testid="check-datos"
                       onChange={e => { setAceptaDatos(e.target.checked); setErrors(p => ({ ...p, aceptaDatos: '' })); }}
                       className="mt-0.5" style={{ accentColor: '#F97B62' }} />
                <span>
                  Autorizo el tratamiento de mis datos personales (nombre, correo y celular) conforme a la
                  Ley 1581 de 2012. Mi celular solo se mostrará en el perfil público de mis mascotas y podré
                  eliminar mi cuenta en cualquier momento.
                </span>
              </label>
              {errors.aceptaDatos && <p className="pl-6" style={{ color: '#F87171' }}>{errors.aceptaDatos}</p>}
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={aceptaUbicacion} data-testid="check-ubicacion"
                       onChange={e => setAceptaUbicacion(e.target.checked)}
                       className="mt-0.5" style={{ accentColor: '#F97B62' }} />
                <span>
                  Opcional: compartir mi ubicación para recibir alertas de mascotas perdidas cerca de mí
                  (puedo desactivarlo desde mi perfil).
                </span>
              </label>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-poppins font-bold text-base text-white flex items-center justify-center gap-2 mt-1"
              style={{
                background: loading
                  ? 'rgba(0,196,180,0.4)'
                  : 'linear-gradient(135deg,#00C4B4,#009E90)',
                boxShadow: loading ? 'none' : '0 8px 28px rgba(0,196,180,0.4)',
              }}
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>Crear cuenta gratis <ArrowRight size={18} strokeWidth={2.5} /></>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: '#F97B62' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="relative z-10 text-center text-[11px] pb-5"
        style={{ color: 'rgba(255,255,255,0.15)' }}>
        HuellaSegura · Pasto, Nariño · v1.0
      </motion.p>
    </div>
  );
}
