import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, User, Mail, Eye, CheckCircle } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import MapaSelector from '../components/MapaSelector';
import SeccionFormulario from '../components/formulario/SeccionFormulario';
import CampoTexto from '../components/formulario/CampoTexto';
import AreaTexto from '../components/formulario/AreaTexto';
import SelectorFoto from '../components/formulario/SelectorFoto';
import SelectorMascotaPerdida from '../components/formulario/SelectorMascotaPerdida';
import { crearAvistamiento } from '../services/avistamientoService';
import { obtenerPerfilPublico } from '../services/perfilPublicoService';
import { geocodificarReversa } from '../services/geocodificacionService';

// R7 reporteAvistamiento / R11: cualquier persona, sin cuenta, reporta dónde vio
// una mascota perdida. Si llega desde el QR o el mapa, la mascota ya viene elegida.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_DESC = 500;
const TEAL = 'linear-gradient(135deg,#26D6CD,#00C4B4)';

function MascotaDesdeQR({ codigo, onResuelta, onNoEncontrada }) {
  const t = useTokens();
  const [mascota, setMascota] = useState(null);

  useEffect(() => {
    obtenerPerfilPublico(codigo)
      .then(({ data }) => { setMascota(data.mascota); onResuelta(String(data.mascota.id)); })
      .catch(() => onNoEncontrada());
  }, [codigo, onResuelta, onNoEncontrada]);

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ background: t.secondaryBg }}
         data-testid="mascota-desde-qr">
      <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center text-2xl shrink-0"
           style={{ background: t.surface }}>
        {mascota?.foto_principal ? <img src={mascota.foto_principal} alt="" className="w-full h-full object-cover" /> : '🐾'}
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: t.text }}>{mascota?.nombre ?? 'Cargando…'}</p>
        <p className="text-xs" style={{ color: t.textMuted }}>
          {[mascota?.especie, mascota?.raza, mascota?.color].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  );
}

function PantallaExito({ onVerPerfil, onInicio }) {
  const t = useTokens();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-6" style={{ background: t.bg }}>
      <motion.div
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="h-28 w-28 rounded-[2rem] flex items-center justify-center"
        style={{ background: TEAL, boxShadow: '0 16px 50px rgba(0,196,180,0.50)' }}>
        <CheckCircle size={52} color="white" />
      </motion.div>
      <div className="text-center">
        <h2 className="font-poppins font-extrabold text-2xl mb-2" style={{ color: t.text }}>¡Gracias por ayudar!</h2>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: t.textMuted }}>
          Avisamos al dueño de la mascota. Tu reporte puede ser el que la reúna con su familia.
        </p>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onVerPerfil}
          className="w-full h-14 rounded-3xl font-poppins font-bold text-white text-sm"
          style={{ background: TEAL, boxShadow: '0 8px 28px rgba(0,196,180,0.45)' }}>
          Ver perfil de la mascota
        </motion.button>
        <button onClick={onInicio} className="w-full h-12 rounded-3xl font-semibold text-sm"
          style={{ background: t.surface, color: t.textMuted, boxShadow: t.shadowSm }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default function ReportarAvistamiento() {
  const t = useTokens();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const codigoDesdeUrl = params.get('mascota') || '';
  const geocodeTimer = useRef(null);

  const [mascotaId,   setMascotaId]   = useState('');
  const [codigo,      setCodigo]      = useState(codigoDesdeUrl);
  const [coords,      setCoords]      = useState({ lat: null, lng: null });
  const [direccion,   setDireccion]   = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nombre,      setNombre]      = useState('');
  const [email,       setEmail]       = useState('');
  const [foto,        setFoto]        = useState(null);
  const [errores,     setErrores]     = useState({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [enviando,    setEnviando]    = useState(false);
  const [exito,       setExito]       = useState(false);

  const mascotaNoEncontrada = useCallback(() => setErrorGlobal('No encontramos esa mascota. Elige una de la lista.'), []);

  function handleCoordsChange(lat, lng) {
    setCoords({ lat, lng });
    setErrores((p) => ({ ...p, coords: '' }));
    setDireccion('…');
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => setDireccion(await geocodificarReversa(lat, lng)), 600);
  }

  function validar() {
    const e = {};
    if (!mascotaId) e.mascota = 'Elige la mascota que viste.';
    if (!coords.lat || !coords.lng) e.coords = 'Marca en el mapa dónde la viste.';
    if (email && !EMAIL_REGEX.test(email)) e.email = 'Correo inválido.';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validar()) return;
    setEnviando(true);
    setErrorGlobal('');
    try {
      await crearAvistamiento({
        mascota_id: parseInt(mascotaId, 10),
        latitud: coords.lat,
        longitud: coords.lng,
        descripcion: descripcion.trim() || undefined,
        nombre_testigo: nombre.trim() || undefined,
        email_testigo: email.trim() || undefined,
      }, foto);
      setExito(true);
    } catch (err) {
      // El éxito solo se muestra si el servidor confirmó el registro
      setErrorGlobal(
        err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'No se pudo enviar el avistamiento. Revisa tu conexión e intenta de nuevo.'
      );
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <PantallaExito
        onVerPerfil={() => navigate(`/publico/mascotas/${codigo}`)}
        onInicio={() => navigate('/')} />
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: t.bg }}>
      {/* Encabezado */}
      <div className="relative overflow-hidden px-5 pt-safe pt-4 pb-8"
           style={{ background: 'linear-gradient(145deg,#A7F0EB 0%,#4DDFD7 50%,#00C4B4 100%)' }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)} aria-label="Volver"
          className="h-9 w-9 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.25)' }}>
          <ChevronLeft size={20} color="white" strokeWidth={2.5} />
        </motion.button>
        <div className="flex flex-col items-center gap-2 pt-4 text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(255,255,255,0.30)' }}>
            <Eye size={28} color="white" />
          </div>
          <h1 className="font-poppins font-extrabold text-white text-2xl leading-tight">Reportar avistamiento</h1>
          <p className="text-white/80 text-sm">No necesitas cuenta. Avisaremos al dueño al instante.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate data-testid="form-avistamiento">
        <div className="px-5 pt-4 flex flex-col gap-4">
          <AnimatePresence>
            {errorGlobal && (
              <motion.div role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl px-4 py-3 text-sm font-medium" style={{ background: t.dangerBg, color: t.danger }}>
                {errorGlobal}
              </motion.div>
            )}
          </AnimatePresence>

          <SeccionFormulario paso={1} titulo="¿Qué mascota viste?">
            {codigoDesdeUrl
              ? <MascotaDesdeQR codigo={codigoDesdeUrl} onResuelta={setMascotaId} onNoEncontrada={mascotaNoEncontrada} />
              : <SelectorMascotaPerdida valor={mascotaId} error={errores.mascota}
                  onCambio={(id, cod) => { setMascotaId(id); setCodigo(cod); setErrores((p) => ({ ...p, mascota: '' })); }} />}
          </SeccionFormulario>

          <SeccionFormulario paso={2} titulo="¿Dónde la viste?" sinRelleno>
            <MapaSelector coords={coords} onCoordsChange={handleCoordsChange} address={direccion} />
            <p className="px-4 py-3 text-xs" style={{ color: errores.coords ? t.primary : t.textMuted }}>
              {errores.coords || (coords.lat ? 'Ubicación marcada. Toca otro punto para moverla.' : 'Toca el mapa para marcar el lugar exacto.')}
            </p>
          </SeccionFormulario>

          <SeccionFormulario paso={3} titulo="Detalles" etiqueta="opcional">
            <div className="flex flex-col gap-4">
              <AreaTexto id="descripcion-avistamiento" etiqueta="¿Qué hacía? ¿Llevaba collar? ¿Estaba herida o sola?"
                value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={MAX_DESC} rows={4} />
              <SelectorFoto foto={foto} onCambio={setFoto} onError={setErrorGlobal} />
            </div>
          </SeccionFormulario>

          <SeccionFormulario paso={4} titulo="Tus datos" etiqueta="opcional">
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-snug" style={{ color: t.textMuted }}>
                Solo los verá el dueño, por si necesita más detalles.
              </p>
              <CampoTexto id="nombre-testigo" etiqueta="Tu nombre" icono={User}
                value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} />
              <CampoTexto id="email-testigo" etiqueta="Tu correo" icono={Mail} type="email"
                value={email} onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: '' })); }}
                error={errores.email} maxLength={150} />
            </div>
          </SeccionFormulario>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-5 pb-safe pb-6 pt-4 z-50"
             style={{ background: `linear-gradient(to top, ${t.bg} 75%, transparent)` }}>
          <motion.button type="submit" disabled={enviando} whileTap={enviando ? {} : { scale: 0.97 }}
            data-testid="btn-enviar-avistamiento"
            className="w-full h-16 rounded-3xl flex items-center justify-center gap-3 font-poppins font-bold text-white text-base disabled:opacity-50"
            style={{ background: TEAL, boxShadow: '0 8px 32px rgba(0,196,180,0.50)' }}>
            {enviando
              ? <><span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" /><span className="sr-only">Enviando…</span></>
              : <><Eye size={20} strokeWidth={2.2} /> Enviar avistamiento</>}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
