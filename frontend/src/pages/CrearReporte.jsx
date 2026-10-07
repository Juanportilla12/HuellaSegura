import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, Crosshair } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import MapaSelector from '../components/MapaSelector';
import SeccionFormulario from '../components/formulario/SeccionFormulario';
import SelectorMisMascotas from '../components/formulario/SelectorMisMascotas';
import AreaTexto from '../components/formulario/AreaTexto';
import * as reporteService from '../services/reporteService';
import { listarMascotas } from '../services/mascotaService';
import { geocodificarReversa } from '../services/geocodificacionService';

// HU-09 / R6 registroUbicacionPerdida.
// Flujo de tres pasos recomendado por el experto: elegir la mascota, confirmar la
// ubicación (GPS del navegador o marcada a mano en el mapa) y describir la pérdida.

const MAX_DESC = 500;
const CORAL = 'linear-gradient(135deg,#FF9280,#F97B62)';

function hoyISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function PantallaExito({ nombre, onReportes, onMapa }) {
  const t = useTokens();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-6" style={{ background: t.bg }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="h-24 w-24 rounded-3xl flex items-center justify-center shadow-warm-lg" style={{ background: CORAL }}>
        <CheckCircle size={44} color="white" />
      </motion.div>
      <div className="text-center">
        <h2 className="font-poppins font-extrabold text-2xl mb-2" style={{ color: t.text }}>Reporte publicado</h2>
        <p className="text-sm leading-relaxed" style={{ color: t.textMuted }}>
          {nombre ?? 'Tu mascota'} ya aparece en el mapa. Los vecinos con alertas activas cerca del lugar
          recibirán un aviso, y te enviamos un correo de confirmación.
        </p>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onReportes}
          className="h-14 rounded-3xl font-poppins font-bold text-white text-base" style={{ background: CORAL }}>
          Ver mis reportes
        </motion.button>
        <button onClick={onMapa} className="text-sm font-semibold" style={{ color: t.primary }}>Ver en el mapa</button>
      </div>
    </div>
  );
}

export default function CrearReporte() {
  const t = useTokens();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const geocodeTimer = useRef(null);

  const [mascotas,     setMascotas]     = useState([]);
  const [cargandoMasc, setCargandoMasc] = useState(true);
  const [mascotaId,    setMascotaId]    = useState(searchParams.get('mascota_id') || '');
  const [coords,       setCoords]       = useState({ lat: null, lng: null });
  const [direccion,    setDireccion]    = useState('');
  const [buscandoGPS,  setBuscandoGPS]  = useState(false);
  const [avisoGPS,     setAvisoGPS]     = useState('');
  const [fechaPerdida, setFechaPerdida] = useState(hoyISO());
  const [descripcion,  setDescripcion]  = useState('');
  const [errores,      setErrores]      = useState({});
  const [errorGlobal,  setErrorGlobal]  = useState('');
  const [enviando,     setEnviando]     = useState(false);
  const [exito,        setExito]        = useState(false);

  useEffect(() => {
    listarMascotas()
      .then(({ data }) => setMascotas(data.mascotas || []))
      .catch(() => setErrorGlobal('No se pudieron cargar tus mascotas.'))
      .finally(() => setCargandoMasc(false));
  }, []);

  const handleCoordsChange = useCallback((lat, lng) => {
    setCoords({ lat, lng });
    setAvisoGPS('');
    setErrores((p) => ({ ...p, coords: '' }));
    setDireccion('…');
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => setDireccion(await geocodificarReversa(lat, lng)), 600);
  }, []);

  // Sugiere la ubicación actual; si el usuario la niega, puede marcarla en el mapa
  const usarMiUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      setAvisoGPS('Tu navegador no permite obtener la ubicación. Márcala en el mapa.');
      return;
    }
    setBuscandoGPS(true);
    setAvisoGPS('');
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => { handleCoordsChange(c.latitude, c.longitude); setBuscandoGPS(false); },
      () => {
        setAvisoGPS('No se pudo obtener tu ubicación. Toca el mapa para marcar dónde se perdió.');
        setBuscandoGPS(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [handleCoordsChange]);

  useEffect(() => { usarMiUbicacion(); }, [usarMiUbicacion]);

  function validar() {
    const e = {};
    if (!mascotaId)                   e.mascota = 'Selecciona la mascota que se perdió.';
    if (!coords.lat || !coords.lng)   e.coords  = 'Marca en el mapa dónde se perdió.';
    if (!fechaPerdida)                e.fecha   = 'Indica la fecha de pérdida.';
    else if (fechaPerdida > hoyISO()) e.fecha   = 'La fecha no puede ser futura.';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validar()) return;
    setEnviando(true);
    setErrorGlobal('');
    try {
      await reporteService.crearReporte({
        mascota_id:    parseInt(mascotaId, 10),
        latitud:       coords.lat,
        longitud:      coords.lng,
        fecha_perdida: fechaPerdida,
        descripcion:   descripcion.trim() || undefined,
      });
      setExito(true);
    } catch (err) {
      setErrorGlobal(
        err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Error al publicar el reporte. Intenta de nuevo.'
      );
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    const nombre = mascotas.find((m) => String(m.id) === String(mascotaId))?.nombre;
    return <PantallaExito nombre={nombre} onReportes={() => navigate('/reportes')} onMapa={() => navigate('/mapa')} />;
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: t.bg }}>
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 sticky top-0 z-30"
              style={{ background: t.navBg, borderBottom: `1px solid ${t.border}` }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)} aria-label="Volver"
          className="h-9 w-9 rounded-2xl flex items-center justify-center" style={{ background: t.primaryBg }}>
          <ChevronLeft size={20} style={{ color: t.primary }} strokeWidth={2.5} />
        </motion.button>
        <h1 className="font-poppins font-bold text-lg" style={{ color: t.text }}>Reportar mascota perdida</h1>
      </header>

      <form onSubmit={handleSubmit} noValidate data-testid="form-reporte">
        <div className="px-5 pt-5 flex flex-col gap-4">
          <AnimatePresence>
            {errorGlobal && (
              <motion.div role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl px-4 py-3 text-sm font-medium" style={{ background: t.dangerBg, color: t.danger }}>
                {errorGlobal}
              </motion.div>
            )}
          </AnimatePresence>

          <SeccionFormulario paso={1} titulo="¿Cuál de tus mascotas se perdió?">
            <SelectorMisMascotas mascotas={mascotas} cargando={cargandoMasc} valor={mascotaId}
              error={errores.mascota} onRegistrar={() => navigate('/mascotas/nueva')}
              onCambio={(id) => { setMascotaId(id); setErrores((p) => ({ ...p, mascota: '' })); }} />
          </SeccionFormulario>

          <SeccionFormulario paso={2} titulo="¿Dónde se perdió?" sinRelleno accion={
            <button type="button" onClick={usarMiUbicacion} disabled={buscandoGPS}
              className="flex items-center gap-1 text-xs font-bold" style={{ color: t.primary }}>
              <Crosshair size={13} /> {buscandoGPS ? 'Buscando…' : 'Mi ubicación'}
            </button>
          }>
            <MapaSelector coords={coords} onCoordsChange={handleCoordsChange} address={direccion} />
            <p className="px-4 py-2 text-xs" style={{ color: avisoGPS ? t.warning : t.textMuted }}>
              {avisoGPS || 'Toca el mapa para ajustar el punto exacto.'}
            </p>
            {errores.coords && <p className="px-4 pb-3 text-xs" style={{ color: t.primary }}>{errores.coords}</p>}
          </SeccionFormulario>

          <SeccionFormulario paso={3} titulo="Detalles de la pérdida">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold" style={{ color: t.textMuted }}>Fecha de pérdida</span>
                <input type="date" value={fechaPerdida} max={hoyISO()} data-testid="input-fecha"
                  onChange={(e) => { setFechaPerdida(e.target.value); setErrores((p) => ({ ...p, fecha: '' })); }}
                  className="rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text, colorScheme: t.isDark ? 'dark' : 'light' }} />
                {errores.fecha && <span className="text-xs" style={{ color: t.primary }}>{errores.fecha}</span>}
              </label>
              <AreaTexto id="descripcion-reporte" data-testid="input-descripcion" rows={4} maxLength={MAX_DESC}
                etiqueta="Descripción (opcional): ¿qué pasó?, ¿llevaba collar?, señas particulares"
                value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </SeccionFormulario>

          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={enviando || mascotas.length === 0}
            className="h-14 rounded-3xl font-poppins font-bold text-white text-base"
            style={{ background: CORAL, boxShadow: '0 8px 24px rgba(249,123,98,0.4)', opacity: enviando || mascotas.length === 0 ? 0.6 : 1 }}>
            {enviando ? 'Publicando…' : 'Publicar reporte'}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
