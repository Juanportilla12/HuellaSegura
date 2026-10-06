import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, Crosshair, Plus } from 'lucide-react';
import MapaSelector from '../components/MapaSelector';
import * as reporteService from '../services/reporteService';
import { listarMascotas } from '../services/mascotaService';

// HU-09 / R6 registroUbicacionPerdida.
// Flujo de tres pasos recomendado por el experto: elegir la mascota, confirmar la
// ubicación (GPS del navegador o marcada a mano en el mapa) y describir la pérdida.

const MAX_DESC = 500;
const EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };

function hoyISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

async function geocodificarReversa(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
    );
    const data = await res.json();
    const r    = data.address || {};
    const barrio = r.neighbourhood || r.suburb || r.city_district || r.quarter || '';
    const calle  = r.road || r.pedestrian || r.footway || '';
    return [calle, barrio].filter(Boolean).join(' · ').toUpperCase() || 'UBICACIÓN MARCADA';
  } catch {
    return 'UBICACIÓN MARCADA';
  }
}

function SectionLabel({ paso, children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>
      <span style={{ color: '#F97B62' }}>{paso}.</span> {children}
    </p>
  );
}

export default function CrearReporte() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mascotas,      setMascotas]      = useState([]);
  const [cargandoMasc,  setCargandoMasc]  = useState(true);
  const [mascotaId,     setMascotaId]     = useState(searchParams.get('mascota_id') || '');
  const [coords,        setCoords]        = useState({ lat: null, lng: null });
  const [direccion,     setDireccion]     = useState('');
  const [buscandoGPS,   setBuscandoGPS]   = useState(false);
  const [avisoGPS,      setAvisoGPS]      = useState('');
  const [fechaPerdida,  setFechaPerdida]  = useState(hoyISO());
  const [descripcion,   setDescripcion]   = useState('');
  const [errores,       setErrores]       = useState({});
  const [errorGlobal,   setErrorGlobal]   = useState('');
  const [enviando,      setEnviando]      = useState(false);
  const [exito,         setExito]         = useState(false);
  const geocodeTimer = useRef(null);

  useEffect(() => {
    listarMascotas()
      .then(({ data }) => setMascotas(data.mascotas || []))
      .catch(() => setErrorGlobal('No se pudieron cargar tus mascotas.'))
      .finally(() => setCargandoMasc(false));
  }, []);

  function handleCoordsChange(lat, lng) {
    setCoords({ lat, lng });
    setAvisoGPS('');
    setErrores((p) => ({ ...p, coords: '' }));
    setDireccion('…');
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      setDireccion(await geocodificarReversa(lat, lng));
    }, 600);
  }

  // Sugiere la ubicación actual; si el usuario la niega, puede marcarla en el mapa
  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setAvisoGPS('Tu navegador no permite obtener la ubicación. Márcala en el mapa.');
      return;
    }
    setBuscandoGPS(true);
    setAvisoGPS('');
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        handleCoordsChange(c.latitude, c.longitude);
        setBuscandoGPS(false);
      },
      () => {
        setAvisoGPS('No se pudo obtener tu ubicación. Toca el mapa para marcar dónde se perdió.');
        setBuscandoGPS(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  useEffect(() => { usarMiUbicacion(); }, []);

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

  const mascotaSel = mascotas.find((m) => String(m.id) === String(mascotaId));

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (exito) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-6"
           style={{ background: '#FFF8F5' }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="h-24 w-24 rounded-3xl flex items-center justify-center shadow-warm-lg"
          style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}
        >
          <CheckCircle size={44} color="white" />
        </motion.div>
        <div className="text-center">
          <h2 className="font-poppins font-extrabold text-2xl mb-2" style={{ color: '#1A1A2E' }}>
            Reporte publicado
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {mascotaSel?.nombre ?? 'Tu mascota'} ya aparece en el mapa. Los vecinos con alertas activas
            cerca del lugar recibirán un aviso, y te enviamos un correo de confirmación.
          </p>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/reportes')}
            className="h-14 rounded-3xl font-poppins font-bold text-white text-base"
            style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}>
            Ver mis reportes
          </motion.button>
          <button onClick={() => navigate('/mapa')} className="text-sm font-semibold" style={{ color: '#F97B62' }}>
            Ver en el mapa
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ background: '#FFF8F5' }}>

      <div
        className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 sticky top-0 z-30"
        style={{ background: 'white', borderBottom: '1px solid #F0E8E4' }}
      >
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-2xl flex items-center justify-center"
          style={{ background: '#FFF0EA' }}
          aria-label="Volver"
        >
          <ChevronLeft size={20} style={{ color: '#F97B62' }} strokeWidth={2.5} />
        </motion.button>
        <h1 className="font-poppins font-bold text-lg" style={{ color: '#1A1A2E' }}>
          Reportar mascota perdida
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate data-testid="form-reporte">
        <div className="px-5 pt-5 flex flex-col gap-4">

          <AnimatePresence>
            {errorGlobal && (
              <motion.div role="alert"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl px-4 py-3 text-sm font-medium"
                style={{ background: '#FFF0EE', color: '#E8614A' }}>
                {errorGlobal}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1 — Mascota */}
          <div className="rounded-3xl shadow-sm px-4 py-4" style={{ background: 'white' }}>
            <SectionLabel paso={1}>¿Cuál de tus mascotas se perdió?</SectionLabel>

            {cargandoMasc && <div className="h-20 rounded-2xl skeleton" />}

            {!cargandoMasc && mascotas.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-3 text-center">
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Primero registra a tu mascota para poder reportarla.
                </p>
                <button type="button" onClick={() => navigate('/mascotas/nueva')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}>
                  <Plus size={14} /> Registrar mascota
                </button>
              </div>
            )}

            {!cargandoMasc && mascotas.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="radiogroup" aria-label="Mascota">
                {mascotas.map((m) => {
                  const activo = String(m.id) === String(mascotaId);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      data-testid={`mascota-opcion-${m.id}`}
                      onClick={() => { setMascotaId(String(m.id)); setErrores((p) => ({ ...p, mascota: '' })); }}
                      className="shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-2xl w-24"
                      style={{
                        background: activo ? 'linear-gradient(135deg,#FF9280,#F97B62)' : '#FFF8F5',
                        border: `1.5px solid ${activo ? 'transparent' : '#EDE5E1'}`,
                      }}
                    >
                      <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center text-2xl"
                           style={{ background: activo ? 'rgba(255,255,255,0.25)' : 'white' }}>
                        {m.foto_principal
                          ? <img src={m.foto_principal} alt="" className="w-full h-full object-cover" />
                          : EMOJIS[m.especie] || '🐾'}
                      </div>
                      <span className="text-xs font-bold truncate w-full text-center"
                            style={{ color: activo ? 'white' : '#1A1A2E' }}>
                        {m.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {errores.mascota && <p className="text-xs mt-2" style={{ color: '#E8614A' }}>{errores.mascota}</p>}
          </div>

          {/* 2 — Ubicación */}
          <div className="rounded-3xl shadow-sm overflow-hidden" style={{ background: 'white' }}>
            <div className="px-4 pt-4 flex items-center justify-between">
              <SectionLabel paso={2}>¿Dónde se perdió?</SectionLabel>
              <button type="button" onClick={usarMiUbicacion} disabled={buscandoGPS}
                className="flex items-center gap-1 text-xs font-bold mb-3" style={{ color: '#F97B62' }}>
                <Crosshair size={13} /> {buscandoGPS ? 'Buscando…' : 'Mi ubicación'}
              </button>
            </div>
            <MapaSelector coords={coords} onCoordsChange={handleCoordsChange} address={direccion} />
            <p className="px-4 py-2 text-xs" style={{ color: avisoGPS ? '#B45309' : '#9CA3AF' }}>
              {avisoGPS || 'Toca el mapa para ajustar el punto exacto.'}
            </p>
            {errores.coords && <p className="px-4 pb-3 text-xs" style={{ color: '#E8614A' }}>{errores.coords}</p>}
          </div>

          {/* 3 — Detalles */}
          <div className="rounded-3xl shadow-sm px-4 py-4 flex flex-col gap-4" style={{ background: 'white' }}>
            <SectionLabel paso={3}>Detalles de la pérdida</SectionLabel>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Fecha de pérdida</span>
              <input type="date" value={fechaPerdida} max={hoyISO()} data-testid="input-fecha"
                onChange={(e) => { setFechaPerdida(e.target.value); setErrores((p) => ({ ...p, fecha: '' })); }}
                className="rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: '#FFF8F5', border: '1.5px solid #EDE5E1', color: '#1A1A2E' }} />
              {errores.fecha && <span className="text-xs" style={{ color: '#E8614A' }}>{errores.fecha}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                Descripción (opcional): ¿qué pasó?, ¿llevaba collar?, señas particulares
              </span>
              <textarea value={descripcion} maxLength={MAX_DESC} rows={4} data-testid="input-descripcion"
                onChange={(e) => setDescripcion(e.target.value)}
                className="rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                style={{ background: '#FFF8F5', border: '1.5px solid #EDE5E1', color: '#1A1A2E' }} />
              <span className="text-[10px] text-right" style={{ color: '#9CA3AF' }}>
                {descripcion.length}/{MAX_DESC}
              </span>
            </label>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={enviando || mascotas.length === 0}
            className="h-14 rounded-3xl font-poppins font-bold text-white text-base"
            style={{
              background: 'linear-gradient(135deg,#FF9280,#F97B62)',
              boxShadow: '0 8px 24px rgba(249,123,98,0.4)',
              opacity: enviando || mascotas.length === 0 ? 0.6 : 1,
            }}
          >
            {enviando ? 'Publicando…' : 'Publicar reporte'}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
