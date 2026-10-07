import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, MapPin, Bell, QrCode, Eye, EyeOff } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: MapPin,  label: 'Mapa en vivo',      color: '#00C4B4' },
  { icon: Bell,    label: 'Alertas al instante', color: '#F97B62' },
  { icon: QrCode,  label: 'QR por mascota',     color: '#9B87E8' },
];

function FloatingOrb({ style }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

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

  const destino = location.state?.from?.pathname || '/';

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
    <div className="relative min-h-screen flex flex-col overflow-hidden"
         style={{ background: 'linear-gradient(160deg,#1A1A2E 0%,#16213E 50%,#0F3460 100%)' }}>

      {/* ── Orbs de fondo ──────────────────────────────────────────── */}
      <FloatingOrb style={{
        top: '-80px', right: '-60px', width: '280px', height: '280px',
        background: 'radial-gradient(circle,rgba(249,123,98,0.25) 0%,transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <FloatingOrb style={{
        bottom: '15%', left: '-80px', width: '240px', height: '240px',
        background: 'radial-gradient(circle,rgba(0,196,180,0.18) 0%,transparent 70%)',
        animation: 'floatSlow 6s ease-in-out infinite 2s',
      }} />
      <FloatingOrb style={{
        top: '40%', right: '-40px', width: '160px', height: '160px',
        background: 'radial-gradient(circle,rgba(155,135,232,0.15) 0%,transparent 70%)',
        animation: 'float 10s ease-in-out infinite 1s',
      }} />

      {/* ── Sección superior — Brand ───────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center pt-14 pb-6 px-6">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
          className="relative mb-5"
        >
          <div className="h-24 w-24 rounded-[2rem] flex items-center justify-center text-5xl select-none"
               style={{
                 background: 'linear-gradient(135deg,#FF9280,#F97B62)',
                 boxShadow: '0 16px 48px rgba(249,123,98,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
               }}>
            🐾
          </div>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.4 }}
            className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#26D6CD,#00C4B4)',
              boxShadow: '0 4px 14px rgba(0,196,180,0.6)',
            }}>
            <MapPin size={15} color="white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-center mb-6"
        >
          <h1 className="font-poppins font-extrabold leading-none select-none"
              style={{ fontSize: '2.4rem', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'white' }}>Huella</span>
            <span style={{
              background: 'linear-gradient(90deg,#F97B62,#FF9280)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Segura</span>
          </h1>
          <p className="text-xs font-semibold mt-1.5 tracking-[0.2em] uppercase"
             style={{ color: 'rgba(255,255,255,0.35)' }}>
            Pasto · Nariño · Colombia
          </p>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
          className="flex gap-2 flex-wrap justify-center"
        >
          {FEATURES.map(({ icon: Icon, label, color }) => (
            <div key={label}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                 style={{
                   background: `${color}18`,
                   border: `1px solid ${color}35`,
                   color: color,
                 }}>
              <Icon size={11} strokeWidth={2.5} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Formulario ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        className="relative z-10 mx-4 mb-6 rounded-3xl overflow-hidden flex-1"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="px-6 pt-7 pb-8 flex flex-col gap-5">

          <div>
            <h2 className="font-poppins font-bold text-2xl text-white">Bienvenido de nuevo</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Ingresa para continuar cuidando a Pasto.
            </p>
          </div>

          {/* Error API */}
          <AnimatePresence>
            {apiError && (
              <motion.div role="alert"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                ⚠️ {apiError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Campo email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold tracking-wide uppercase"
                     style={{ color: 'rgba(255,255,255,0.5)' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: errors.email ? '#F87171' : 'rgba(255,255,255,0.35)' }} />
                <input
                  id="email" name="email" type="email"
                  placeholder="juan.ortiz@gmail.com"
                  value={form.email} onChange={handleChange}
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
                  style={{
                    background: errors.email ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)',
                    border: errors.email ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid rgba(249,123,98,0.7)'; e.target.style.background = 'rgba(249,123,98,0.08)'; }}
                  onBlur={e => { e.target.style.border = errors.email ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.12)'; e.target.style.background = errors.email ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              {errors.email && (
                <p className="text-xs pl-1" style={{ color: '#F87171' }}>{errors.email}</p>
              )}
            </div>

            {/* Campo contraseña */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold tracking-wide uppercase"
                       style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Contraseña
                </label>
                <Link to="/olvide-contrasena"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: '#F97B62' }}>
                  ¿Olvidaste la clave?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: errors.password ? '#F87171' : 'rgba(255,255,255,0.35)' }} />
                <input
                  id="password" name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
                  style={{
                    background: errors.password ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)',
                    border: errors.password ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid rgba(249,123,98,0.7)'; e.target.style.background = 'rgba(249,123,98,0.08)'; }}
                  onBlur={e => { e.target.style.border = errors.password ? '1.5px solid rgba(248,113,113,0.6)' : '1.5px solid rgba(255,255,255,0.12)'; e.target.style.background = errors.password ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)'; }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs pl-1" style={{ color: '#F87171' }}>{errors.password}</p>
              )}
            </div>

            {/* Cloudflare Turnstile */}
            <div className="flex flex-col items-center gap-1">
              <Turnstile
                ref={turnstileRef}
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => { setTurnstileToken(token); setTurnstileOk(true); setTurnstileError(false); }}
                onExpire={() => { setTurnstileToken(''); setTurnstileOk(false); }}
                onError={() => { setTurnstileError(true); }}
                options={{ theme: 'dark', language: 'es', size: 'normal' }}
              />
              {turnstileError && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Verificación no disponible — continúa normalmente
                </p>
              )}
            </div>

            {/* Botón submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading || !puedeEnviar}
              className="w-full py-4 rounded-2xl font-poppins font-bold text-base text-white flex items-center justify-center gap-2 mt-1"
              style={{
                background: loading || !puedeEnviar
                  ? 'rgba(249,123,98,0.45)'
                  : 'linear-gradient(135deg,#F97B62,#FF5C3A)',
                boxShadow: loading || !puedeEnviar ? 'none' : '0 8px 28px rgba(249,123,98,0.45)',
              }}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
                  <span className="sr-only">Ingresando…</span>
                </>
              ) : (
                <>Iniciar sesión <ArrowRight size={18} strokeWidth={2.5} /></>
              )}
            </motion.button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3">
            <Link to="/"
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Continuar como invitado
            </Link>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-bold hover:underline" style={{ color: '#F97B62' }}>
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="relative z-10 text-center text-[11px] pb-6"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        HuellaSegura · Pasto, Nariño · v1.0
      </motion.p>
    </div>
  );
}
