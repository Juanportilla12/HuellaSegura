import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ChevronLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import * as authService from '../services/authService';

// ── Orb decorativo ───────────────────────────────────────────
function Orb({ style }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

// ── Indicador de pasos ───────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Correo', 'Código', 'Nueva clave'];
  return (
    <div className="flex items-center justify-center gap-1 mb-7">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{
                background: i < step
                  ? 'linear-gradient(135deg,#34D399,#059669)'
                  : i === step
                    ? 'linear-gradient(135deg,#FF9280,#F97B62)'
                    : 'rgba(255,255,255,0.1)',
                scale: i === step ? 1.08 : 1,
                boxShadow: i === step
                  ? '0 6px 20px rgba(249,123,98,0.45)'
                  : i < step
                    ? '0 6px 20px rgba(52,211,153,0.35)'
                    : 'none',
              }}
              className="h-12 w-12 rounded-full flex items-center justify-center font-poppins font-extrabold text-white"
              style={{ fontSize: '1.1rem' }}
            >
              {i < step ? <CheckCircle size={20} strokeWidth={2.5} /> : i + 1}
            </motion.div>
            <span className="text-[11px] font-bold text-center"
                  style={{ color: i === step ? '#F97B62' : i < step ? '#34D399' : 'rgba(255,255,255,0.3)' }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <motion.div
              className="h-px w-10 mb-7 rounded-full"
              animate={{ background: i < step ? '#34D399' : 'rgba(255,255,255,0.12)' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OlvideContrasena() {
  const navigate = useNavigate();
  const [step,     setStep]     = useState(0); // 0=email, 1=codigo, 2=nueva clave, 3=exito
  const [email,    setEmail]    = useState('');
  const [codigo,   setCodigo]   = useState(['', '', '', '', '', '']);
  const [pass,     setPass]     = useState('');
  const [passConf, setPassConf] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const inputsRef = useRef([]);

  // ── Paso 1: enviar código ──────────────────────────────────
  async function handleEnviarCodigo(e) {
    e.preventDefault();
    if (!email) return setError('Ingresa tu correo electrónico.');
    setError(''); setLoading(true);
    try {
      await authService.solicitarCodigoRecuperacion(email);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el código.');
    } finally { setLoading(false); }
  }

  // ── Paso 2: verificar código ──────────────────────────────
  function handleCodigoChange(val, idx) {
    if (!/^\d?$/.test(val)) return;
    const nuevo = [...codigo];
    nuevo[idx] = val;
    setCodigo(nuevo);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
    if (!val && idx > 0) inputsRef.current[idx - 1]?.focus();
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
      setCodigo(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally { setLoading(false); }
  }

  // ── Paso 3: nueva contraseña ──────────────────────────────
  async function handleResetear(e) {
    e.preventDefault();
    if (pass.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (pass !== passConf) return setError('Las contraseñas no coinciden.');
    setError(''); setLoading(true);
    try {
      await authService.restablecerPassword(email, codigo.join(''), pass);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden"
         style={{ background: 'linear-gradient(160deg,#0F0F1A 0%,#1A1A2E 55%,#0D1F3C 100%)' }}>

      {/* Orbs */}
      <Orb style={{ top: '-60px', right: '-50px', width: '220px', height: '220px', background: 'radial-gradient(circle,rgba(249,123,98,0.2) 0%,transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
      <Orb style={{ bottom: '20%', left: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle,rgba(0,196,180,0.15) 0%,transparent 70%)', animation: 'floatSlow 6s ease-in-out infinite 2s' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-2">
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => step > 0 && step < 3 ? setStep(s => s - 1) : navigate('/login')}
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ChevronLeft size={20} color="white" strokeWidth={2.5} />
        </motion.button>
        <div>
          <h1 className="font-poppins font-bold text-lg text-white">
            {step === 3 ? '¡Listo!' : 'Recuperar contraseña'}
          </h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {step === 0 && 'Te enviaremos un código de verificación'}
            {step === 1 && `Código enviado a ${email}`}
            {step === 2 && 'Crea tu nueva contraseña'}
            {step === 3 && 'Tu contraseña fue restablecida'}
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pt-4 pb-10">
        <AnimatePresence mode="wait">

          {/* ── ÉXITO ──────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="exito"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="h-28 w-28 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#34D399,#059669)', boxShadow: '0 16px 48px rgba(52,211,153,0.4)' }}>
                <CheckCircle size={56} color="white" strokeWidth={2} />
              </motion.div>
              <div>
                <h2 className="font-poppins font-bold text-2xl text-white mb-2">¡Contraseña restablecida!</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')}
                className="w-full py-4 rounded-2xl font-poppins font-bold text-white flex items-center justify-center gap-2 mt-4"
                style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 8px 28px rgba(249,123,98,0.45)' }}>
                Ir al inicio de sesión <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* ── FORMULARIOS ───────────────────────────────────── */}
          {step < 3 && (
            <motion.div key={`step-${step}`}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl p-6"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}>

              <StepIndicator step={step} />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl px-4 py-3 text-sm font-medium mb-4 flex items-center gap-2"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Paso 0 — Email */}
              {step === 0 && (
                <form onSubmit={handleEnviarCodigo} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: 'rgba(255,255,255,0.35)' }} />
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="juan@gmail.com" autoComplete="email"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                        onFocus={e => { e.target.style.border = '1.5px solid rgba(249,123,98,0.7)'; e.target.style.background = 'rgba(249,123,98,0.08)'; }}
                        onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                      />
                    </div>
                  </div>
                  <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
                    className="w-full py-4 rounded-2xl font-poppins font-bold text-base text-white flex items-center justify-center gap-2 mt-2"
                    style={{ background: loading ? 'rgba(249,123,98,0.5)' : 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: loading ? 'none' : '0 8px 28px rgba(249,123,98,0.45)' }}>
                    {loading ? <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Enviar código <ArrowRight size={18} /></>}
                  </motion.button>
                </form>
              )}

              {/* Paso 1 — Código */}
              {step === 1 && (
                <form onSubmit={handleVerificarCodigo} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Ingresa el código de 6 dígitos
                    </label>
                    <div className="flex gap-2 justify-center">
                      {codigo.map((d, i) => (
                        <input
                          key={i}
                          ref={el => inputsRef.current[i] = el}
                          type="text" inputMode="numeric" maxLength={1}
                          value={d}
                          onChange={e => handleCodigoChange(e.target.value, i)}
                          onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) inputsRef.current[i-1]?.focus(); }}
                          className="h-14 w-11 rounded-2xl text-center text-xl font-bold text-white outline-none"
                          style={{ background: d ? 'rgba(249,123,98,0.2)' : 'rgba(255,255,255,0.08)', border: d ? '2px solid rgba(249,123,98,0.6)' : '1.5px solid rgba(255,255,255,0.15)' }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      El código expira en 15 minutos
                    </p>
                  </div>
                  <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading || codigo.join('').length < 6}
                    className="w-full py-4 rounded-2xl font-poppins font-bold text-base text-white flex items-center justify-center gap-2"
                    style={{ background: loading || codigo.join('').length < 6 ? 'rgba(249,123,98,0.4)' : 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 8px 28px rgba(249,123,98,0.4)' }}>
                    {loading ? <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Verificar código <ArrowRight size={18} /></>}
                  </motion.button>
                  <button type="button" onClick={() => { setCodigo(['','','','','','']); handleEnviarCodigo({ preventDefault: () => {} }); }}
                    className="text-sm font-semibold text-center w-full" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    ¿No llegó? Reenviar código
                  </button>
                </form>
              )}

              {/* Paso 2 — Nueva contraseña */}
              {step === 2 && (
                <form onSubmit={handleResetear} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: 'rgba(255,255,255,0.35)' }} />
                      <input type={showPass ? 'text' : 'password'} value={pass}
                        onChange={e => { setPass(e.target.value); setError(''); }}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                        onFocus={e => { e.target.style.border = '1.5px solid rgba(249,123,98,0.7)'; e.target.style.background = 'rgba(249,123,98,0.08)'; }}
                        onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: 'rgba(255,255,255,0.35)' }} />
                      <input type={showPass ? 'text' : 'password'} value={passConf}
                        onChange={e => { setPassConf(e.target.value); setError(''); }}
                        placeholder="Repite tu contraseña"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                        onFocus={e => { e.target.style.border = '1.5px solid rgba(249,123,98,0.7)'; e.target.style.background = 'rgba(249,123,98,0.08)'; }}
                        onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                      />
                    </div>
                  </div>
                  <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
                    className="w-full py-4 rounded-2xl font-poppins font-bold text-base text-white flex items-center justify-center gap-2 mt-2"
                    style={{ background: loading ? 'rgba(0,196,180,0.4)' : 'linear-gradient(135deg,#00C4B4,#009E90)', boxShadow: loading ? 'none' : '0 8px 28px rgba(0,196,180,0.4)' }}>
                    {loading ? <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Restablecer contraseña <ArrowRight size={18} /></>}
                  </motion.button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
