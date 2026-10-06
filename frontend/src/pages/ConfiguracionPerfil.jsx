import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MoreHorizontal, CheckCircle, Bell,
  MapPin, Moon, LogOut, Plus, ChevronRight, QrCode, Pencil, LayoutDashboard, Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../hooks/useTokens';
import { useThemeContext } from '../providers/ThemeProvider';
import * as usuarioService from '../services/usuarioService';
import * as mascotaService from '../services/mascotaService';
import * as reporteService from '../services/reporteService';
import BottomNav from '../components/ui/BottomNav';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESPECIE_EMOJIS = { perro:'🐶', gato:'🐱', ave:'🐦', reptil:'🦎', otro:'🐾' };
const ESPECIE_COLORS = {
  perro:  ['#FFD0BF','#F97B62'],
  gato:   ['#C7B2F5','#9B87E8'],
  ave:    ['#A7F0EB','#00C4B4'],
  reptil: ['#A7F5B9','#22C55E'],
  otro:   ['#FFD0BF','#F97B62'],
};

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className="relative h-7 w-12 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? '#F97B62' : '#D1D5DB' }}>
      <div className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-200"
           style={{ left: on ? 'calc(100% - 1.625rem)' : '0.125rem' }} />
    </button>
  );
}

// ─── Tarjeta de mascota ───────────────────────────────────────────────────────
function MascotaProfileCard({ mascota, isDark, navigate }) {
  const [c1, c2] = ESPECIE_COLORS[mascota.especie] || ESPECIE_COLORS.otro;
  const emoji    = ESPECIE_EMOJIS[mascota.especie]  || '🐾';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      className="shrink-0 w-44 rounded-3xl overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 6px 24px rgba(26,26,46,0.10)' }}
      onClick={() => navigate(`/mascotas/${mascota.id}`)}
    >
      {/* Banner gradiente */}
      <div className="relative h-28 flex items-center justify-center overflow-hidden"
           style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
        {/* Emoji fondo difuminado */}
        <span className="absolute text-7xl opacity-20 select-none filter blur-sm pointer-events-none">
          {emoji}
        </span>
        {/* Foto o avatar */}
        <div className="relative z-10 h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center text-3xl"
             style={{ background: 'rgba(255,255,255,0.30)', backdropFilter: 'blur(8px)' }}>
          {mascota.foto_urls?.[0]
            ? <img src={mascota.foto_urls[0]} alt={mascota.nombre} className="w-full h-full object-cover" />
            : emoji}
        </div>
        {/* Badge especie */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide"
             style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(4px)' }}>
          {mascota.especie}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-3" style={{ background: isDark ? '#1E1E30' : 'white' }}>
        <p className="font-poppins font-bold text-sm truncate" style={{ color: isDark ? '#F1F0FF' : '#1A1A2E' }}>
          {mascota.nombre}
        </p>
        {mascota.raza && (
          <p className="text-[11px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>{mascota.raza}</p>
        )}

        {/* Chips edad + sexo */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {mascota.edad && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#FFF0EA', color: '#F97B62' }}>
              {mascota.edad} {mascota.edad_unidad || 'años'}
            </span>
          )}
          {mascota.sexo && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: isDark ? '#252540' : '#F5F3FF', color: '#9B87E8' }}>
              {mascota.sexo.charAt(0).toUpperCase() + mascota.sexo.slice(1)}
            </span>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/mascotas/${mascota.id}/editar`); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(249,123,98,0.1)', color: '#F97B62', border: '1.5px solid rgba(249,123,98,0.2)' }}>
            <Pencil size={11} /> Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/mascotas/${mascota.id}/carnet`); }}
            className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,196,180,0.15)', border: '1px solid rgba(0,196,180,0.2)' }}>
            <QrCode size={13} style={{ color: '#00C4B4' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ConfiguracionPerfil() {
  const { usuario, logout, actualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const t = useTokens();
  const { isDark, toggleTheme } = useThemeContext();
  const fotoInputRef = useRef(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [radioAlerta,  setRadioAlerta]  = useState(usuario?.radio_alerta || 5);
  const [alertasActivas, setAlertasActivas] = useState(!!usuario?.alertas_activas);
  const [cambiandoAlertas, setCambiandoAlertas] = useState(false);
  const [celular,      setCelular]      = useState(usuario?.celular || '');
  const [guardandoCel, setGuardandoCel] = useState(false);
  const [misReportes,  setMisReportes]  = useState([]);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [passwordBorrado,  setPasswordBorrado]  = useState('');
  const [borrando,     setBorrando]     = useState(false);
  const [guardando,    setGuardando]    = useState(false);
  const [mensaje,      setMensaje]      = useState('');
  const [error,        setError]        = useState('');
  const [mascotas,     setMascotas]     = useState([]);
  const [loadMascotas, setLoadMascotas] = useState(true);

  useEffect(() => {
    mascotaService.listarMascotas()
      .then(({ data }) => setMascotas(data.mascotas || []))
      .catch(() => {})
      .finally(() => setLoadMascotas(false));
    reporteService.misReportes()
      .then(({ data }) => setMisReportes(data.reportes || []))
      .catch(() => {});
  }, []);

  useEffect(() => { setAlertasActivas(!!usuario?.alertas_activas); }, [usuario?.alertas_activas]);

  // R8/R9 + Ley 1581: la ubicación solo se guarda con el consentimiento explícito del usuario
  async function handleToggleAlertas(activar) {
    setCambiandoAlertas(true);
    try {
      if (activar) {
        const pos = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) reject(new Error('sin-geo'));
          else navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        await usuarioService.actualizarUbicacion(pos.coords.latitude, pos.coords.longitude);
        toast.success('Alertas activadas. Te avisaremos de mascotas perdidas cerca de ti.');
      } else {
        await usuarioService.desactivarUbicacion();
        toast.success('Alertas desactivadas. Tu ubicación fue eliminada.');
      }
      setAlertasActivas(activar);
      actualizarUsuario({ alertas_activas: activar });
    } catch (err) {
      toast.error(err?.response?.data?.message
        || 'No se pudo obtener tu ubicación. Revisa los permisos del navegador.');
    } finally {
      setCambiandoAlertas(false);
    }
  }

  async function handleGuardarCelular(e) {
    e.preventDefault();
    setGuardandoCel(true);
    try {
      const { data } = await usuarioService.actualizarPerfil({ celular: celular.trim() });
      actualizarUsuario({ celular: data.usuario.celular });
      toast.success('Celular actualizado.');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'No se pudo actualizar el celular.');
    } finally {
      setGuardandoCel(false);
    }
  }

  async function handleEliminarCuenta(e) {
    e.preventDefault();
    setBorrando(true);
    try {
      await usuarioService.eliminarCuenta(passwordBorrado);
      toast.success('Tu cuenta y tus datos fueron eliminados.');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.assign('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar la cuenta.');
      setBorrando(false);
    }
  }

  async function handleGuardarRadio(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await usuarioService.actualizarRadioAlerta(radioAlerta);
      toast.success(`Radio actualizado a ${radioAlerta} km.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar el radio.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB.');
      return;
    }
    setSubiendoFoto(true);
    try {
      const { data } = await usuarioService.actualizarFoto(file);
      actualizarUsuario({ foto_url: data.foto_url });
      toast.success('Foto de perfil actualizada.');
    } catch {
      toast.error('No se pudo actualizar la foto. Intenta de nuevo.');
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  }

  const initials = usuario?.nombre?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?';

  const bg          = t.bg;
  const surface     = t.surface;
  const textPrimary = t.text;
  const textMuted   = t.textMuted;
  const divider     = t.border;

  return (
    <div className="min-h-screen pb-24 transition-colors" style={{ background: bg }}>

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-2">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ChevronLeft size={20} style={{ color: '#F97B62' }} strokeWidth={2.5} />
        </motion.button>
        <h1 className="font-poppins font-bold text-lg" style={{ color: textPrimary }}>Mi perfil</h1>
        <button className="h-9 w-9 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <MoreHorizontal size={20} style={{ color: '#F97B62' }} />
        </button>
      </div>

      {/* ── Hero avatar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-5 pb-6 px-5">
        {/* Input oculto para seleccionar imagen */}
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleFotoChange}
        />
        {/* Avatar con glow */}
        <div className="relative mb-3">
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => fotoInputRef.current?.click()}
            className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-poppins font-bold text-white cursor-pointer"
            style={{
              background: usuario?.foto_url ? 'transparent' : 'linear-gradient(135deg,#FF9280,#F97B62)',
              boxShadow: '0 8px 32px rgba(249,123,98,0.40), 0 0 0 5px rgba(249,123,98,0.12)',
            }}
          >
            {usuario?.foto_url
              ? <img src={usuario.foto_url} alt="Foto de perfil" className="w-full h-full object-cover" />
              : initials
            }
          </motion.div>
          {/* Badge cámara */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => fotoInputRef.current?.click()}
            disabled={subiendoFoto}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 2px 8px rgba(249,123,98,0.5)' }}>
            {subiendoFoto
              ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Camera size={13} color="white" />
            }
          </motion.button>
        </div>

        <h2 className="text-xl font-poppins font-bold mb-0.5" style={{ color: textPrimary }}>
          {usuario?.nombre}
        </h2>
        <p className="text-sm mb-2" style={{ color: textMuted }}>{usuario?.email}</p>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
             style={{ background: isDark ? 'rgba(0,196,180,0.12)' : '#E0F9F7' }}>
          <CheckCircle size={13} style={{ color: '#00C4B4' }} />
          <span className="text-xs font-semibold" style={{ color: '#00C4B4' }}>
            {alertasActivas ? 'Alertas por proximidad activas' : 'Alertas por proximidad desactivadas'}
          </span>
        </div>
      </div>

      {/* ── Estadísticas ─────────────────────────────────────────────────── */}
      <div className="mx-4 rounded-3xl p-4 mb-5 grid grid-cols-3"
           style={{ background: surface, boxShadow: '0 4px 20px rgba(26,26,46,0.06)' }}>
        {[
          { value: mascotas.length || '—', label: 'MASCOTAS', color: '#F97B62'  },
          { value: misReportes.length,     label: 'REPORTES',  color: textPrimary },
          { value: misReportes.filter(r => r.estado === 'encontrada').length, label: 'ENCONTRADAS', color: '#00C4B4' },
        ].map(({ value, label, color }, i) => (
          <div key={label} className="flex flex-col items-center py-1"
               style={i < 2 ? { borderRight: `1px solid ${divider}` } : {}}>
            <span className="text-2xl font-poppins font-extrabold" style={{ color }}>{value}</span>
            <span className="text-[10px] font-bold tracking-wider mt-0.5" style={{ color: textMuted }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN — Mis mascotas
      ════════════════════════════════════════════════════════════════════ */}
      <div className="mb-5">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 mb-3">
          <div>
            <h3 className="font-poppins font-bold text-base" style={{ color: textPrimary }}>
              Mis mascotas
            </h3>
            <p className="text-xs" style={{ color: textMuted }}>
              {loadMascotas ? 'Cargando…' : `${mascotas.length} registrada${mascotas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/mascotas/nueva')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-white"
            style={{
              background: 'linear-gradient(135deg,#FF9280,#F97B62)',
              boxShadow: '0 4px 12px rgba(249,123,98,0.40)',
            }}
          >
            <Plus size={14} /> Agregar
          </motion.button>
        </div>

        {/* Esqueletos de carga */}
        {loadMascotas && (
          <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-1">
            {[1,2].map(i => (
              <div key={i} className="shrink-0 w-44 h-52 rounded-3xl skeleton" />
            ))}
          </div>
        )}

        {/* Vacío */}
        {!loadMascotas && mascotas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
            style={{ background: surface, border: `1.5px dashed ${divider}` }}
          >
            <span className="text-4xl" style={{ animation: 'float 3s ease-in-out infinite' }}>🐾</span>
            <div>
              <p className="font-poppins font-semibold text-sm" style={{ color: textPrimary }}>
                Sin mascotas registradas
              </p>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                Agrega el perfil digital de tu mascota
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/mascotas/nueva')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}
            >
              <Plus size={14} /> Registrar mascota
            </motion.button>
          </motion.div>
        )}

        {/* Carrusel de tarjetas */}
        {!loadMascotas && mascotas.length > 0 && (
          <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
            {mascotas.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <MascotaProfileCard mascota={m} isDark={isDark} navigate={navigate} />
              </motion.div>
            ))}

            {/* Tarjeta "+ Agregar" al final del carrusel */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: mascotas.length * 0.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/mascotas/nueva')}
              className="shrink-0 w-36 h-full min-h-[212px] rounded-3xl flex flex-col items-center justify-center gap-3"
              style={{
                background: isDark ? '#1E1E30' : 'white',
                border: `2px dashed ${divider}`,
              }}
            >
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                   style={{ background: isDark ? '#252540' : '#FFF0EA' }}>
                <Plus size={22} style={{ color: '#F97B62' }} />
              </div>
              <p className="text-xs font-bold text-center px-3" style={{ color: textMuted }}>
                Agregar mascota
              </p>
            </motion.button>
          </div>
        )}

        {/* Enlace "Ver todas" si hay más de 3 */}
        {!loadMascotas && mascotas.length > 3 && (
          <button
            onClick={() => navigate('/mascotas')}
            className="flex items-center gap-1 mx-5 mt-2 text-xs font-bold"
            style={{ color: '#F97B62' }}
          >
            Ver todas mis mascotas <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* ── Alertas de estado ────────────────────────────────────────────── */}
      <AnimatePresence>
        {mensaje && (
          <motion.div role="alert" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mx-4 mb-3 px-4 py-3 rounded-2xl text-sm font-medium"
            style={{ background: '#E0F9F7', color: '#00A890' }}>
            {mensaje}
          </motion.div>
        )}
        {error && (
          <motion.div role="alert" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mx-4 mb-3 px-4 py-3 rounded-2xl text-sm font-medium"
            style={{ background: '#FFF0EE', color: '#E8614A' }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Configuración ────────────────────────────────────────────────── */}
      <div className="mx-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1"
           style={{ color: textMuted }}>Configuración</p>

        <div className="rounded-3xl overflow-hidden" style={{ background: surface, boxShadow: '0 4px 20px rgba(26,26,46,0.06)' }}>

          {/* Notificaciones */}
          <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: 'rgba(249,123,98,0.12)' }}>
              <Bell size={18} style={{ color: '#F97B62' }} />
            </div>
            <div className="flex-1">
              <span className="block font-medium text-[15px]" style={{ color: textPrimary }}>Alertas por proximidad</span>
              <span className="block text-xs" style={{ color: textMuted }}>
                Comparte tu ubicación para recibir avisos de mascotas perdidas cerca de ti.
              </span>
            </div>
            <Toggle label="Alertas por proximidad" on={alertasActivas} onChange={(v) => !cambiandoAlertas && handleToggleAlertas(v)} />
          </div>

          {/* Celular de contacto (R1) */}
          <form onSubmit={handleGuardarCelular} className="px-5 py-4 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${divider}` }}>
            <label htmlFor="celular-perfil" className="text-sm font-medium shrink-0" style={{ color: textPrimary }}>
              Celular
            </label>
            <input id="celular-perfil" type="tel" value={celular} onChange={e => setCelular(e.target.value)}
              placeholder="300 123 4567" data-testid="input-celular"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: t.surface2, color: textPrimary, border: `1px solid ${divider}` }} />
            <button type="submit" disabled={guardandoCel}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', opacity: guardandoCel ? 0.7 : 1 }}>
              {guardandoCel ? '…' : 'Guardar'}
            </button>
          </form>

          {/* Radio de alerta */}
          <div style={{ borderBottom: `1px solid ${divider}` }}>
            <div className="flex items-center gap-4 px-5 pt-4 pb-2">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: 'rgba(0,196,180,0.12)' }}>
                <MapPin size={18} style={{ color: '#00C4B4' }} />
              </div>
              <span className="flex-1 font-medium text-[15px]" style={{ color: textPrimary }}>Alertas por radio</span>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: '#E0F9F7', color: '#00C4B4' }}>
                {radioAlerta} km
              </span>
            </div>
            <form onSubmit={handleGuardarRadio} className="px-5 pb-4">
              <input id="radio-alerta" type="range" className="w-full mb-1"
                min={1} max={10} step={1} value={radioAlerta}
                onChange={e => setRadioAlerta(parseInt(e.target.value, 10))}
                style={{ accentColor: '#F97B62' }}
                data-testid="slider-radio" />
              <div className="flex justify-between text-xs mb-3" style={{ color: textMuted }}>
                <span>1 km</span><span>5 km</span><span>10 km</span>
              </div>
              <button type="submit" data-testid="btn-guardar-radio" disabled={guardando}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-opacity"
                style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando…' : 'Guardar radio'}
              </button>
            </form>
          </div>

          {/* Modo oscuro */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: isDark ? 'rgba(241,240,255,0.1)' : 'rgba(26,26,46,0.08)' }}>
              <Moon size={18} style={{ color: isDark ? '#C7B2F5' : '#6B7280' }} />
            </div>
            <span className="flex-1 font-medium text-[15px]" style={{ color: textPrimary }}>Modo oscuro</span>
            <Toggle label="Modo oscuro" on={isDark} onChange={toggleTheme} />
          </div>
        </div>
      </div>

      {/* ── Panel de administrador (solo visible para admin) ─────────────── */}
      {usuario?.rol === 'admin' && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/admin')}
          className="mx-4 w-[calc(100%-2rem)] py-4 rounded-3xl text-sm font-semibold flex items-center justify-center gap-2 mb-3"
          style={{
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
          }}
        >
          <LayoutDashboard size={16} />
          Panel de administrador
        </motion.button>
      )}

      {/* ── Cerrar sesión ────────────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => logout?.()}
        className="mx-4 w-[calc(100%-2rem)] py-4 rounded-3xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: isDark ? 'rgba(239,68,68,0.15)' : '#FFF0EE', color: '#EF4444' }}
      >
        <LogOut size={16} /> Cerrar sesión
      </motion.button>

      {/* ── Eliminar cuenta (Ley 1581 de 2012) ───────────────────────────── */}
      <div className="mx-4 mt-3 mb-4">
        {!confirmarBorrado ? (
          <button onClick={() => setConfirmarBorrado(true)} data-testid="btn-eliminar-cuenta"
            className="w-full py-3 text-xs font-semibold" style={{ color: textMuted }}>
            Eliminar mi cuenta y mis datos
          </button>
        ) : (
          <form onSubmit={handleEliminarCuenta} className="rounded-3xl p-4 flex flex-col gap-3"
                style={{ background: surface, border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-xs" style={{ color: textPrimary }}>
              Se eliminarán tu cuenta, tus mascotas, reportes y notificaciones. Esta acción no se puede deshacer.
              Confirma tu contraseña:
            </p>
            <input type="password" value={passwordBorrado} onChange={e => setPasswordBorrado(e.target.value)}
              required autoComplete="current-password" data-testid="input-password-borrado"
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: t.surface2, color: textPrimary, border: `1px solid ${divider}` }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setConfirmarBorrado(false); setPasswordBorrado(''); }}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold" style={{ color: textMuted, border: `1px solid ${divider}` }}>
                Cancelar
              </button>
              <button type="submit" disabled={borrando}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white" style={{ background: '#EF4444' }}>
                {borrando ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </form>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
