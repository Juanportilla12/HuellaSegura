import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LocateFixed, Megaphone } from 'lucide-react';
import MapaSelector from '../components/MapaSelector';
import SeccionFormulario from '../components/formulario/SeccionFormulario';
import SelectorMisMascotas from '../components/formulario/SelectorMisMascotas';
import AreaTexto from '../components/formulario/AreaTexto';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import PantallaExito from '../components/ui/PantallaExito';
import { AlertaError, BotonPrimario, focoVisible } from '../components/auth/AuthUI';
import * as reporteService from '../services/reporteService';
import { listarMascotas } from '../services/mascotaService';
import { geocodificarReversa } from '../services/geocodificacionService';

// HU-09 / R6 registroUbicacionPerdida.
// Flujo de tres pasos recomendado por el experto: elegir la mascota, confirmar la
// ubicación (GPS del navegador o marcada a mano en el mapa) y describir la pérdida.

const MAX_DESC = 500;

function hoyISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

export default function CrearReporte() {
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
    setDireccion('Buscando dirección…');
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
    return (
      <PantallaExito titulo="Reporte publicado"
        accionPrincipal={{ texto: 'Ver mis reportes', onClick: () => navigate('/reportes') }}
        accionSecundaria={{ texto: 'Ver en el mapa', onClick: () => navigate('/mapa') }}>
        {nombre ?? 'Tu mascota'} ya aparece en el mapa. Los vecinos con alertas activas cerca del lugar
        recibirán un aviso, y te enviamos un correo de confirmación.
      </PantallaExito>
    );
  }

  const textoMapa = errores.coords || avisoGPS || 'Toca el mapa para ajustar el punto exacto.';
  const colorMapa = errores.coords ? 'font-medium text-red-600 dark:text-red-400'
    : avisoGPS ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500 dark:text-white/50';

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)]">
      <EncabezadoPagina titulo="Reportar mascota perdida" subtitulo="Avisaremos a los vecinos cercanos" />

      <form onSubmit={handleSubmit} noValidate data-testid="form-reporte">
        <div className="px-4 pt-4 flex flex-col gap-4">
          <AlertaError mensaje={errorGlobal} />

          <SeccionFormulario paso={1} titulo="¿Cuál de tus mascotas se perdió?">
            <SelectorMisMascotas mascotas={mascotas} cargando={cargandoMasc} valor={mascotaId}
              error={errores.mascota} onRegistrar={() => navigate('/mascotas/nueva')}
              onCambio={(id) => { setMascotaId(id); setErrores((p) => ({ ...p, mascota: '' })); }} />
          </SeccionFormulario>

          <SeccionFormulario paso={2} titulo="¿Dónde se perdió?" sinRelleno accion={
            <button type="button" onClick={usarMiUbicacion} disabled={buscandoGPS}
              className={`shrink-0 -my-1 h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold
                          text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-white/10 disabled:opacity-60 ${focoVisible}`}>
              <LocateFixed size={15} aria-hidden="true" /> {buscandoGPS ? 'Buscando…' : 'Mi ubicación'}
            </button>
          }>
            <MapaSelector coords={coords} onCoordsChange={handleCoordsChange} address={direccion} />
            <p className={`px-4 py-3 text-[13px] ${colorMapa}`}>{textoMapa}</p>
          </SeccionFormulario>

          <SeccionFormulario paso={3} titulo="Detalles de la pérdida">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fecha-perdida" className="text-[13px] font-semibold text-dark-700 dark:text-white/70">
                  Fecha de pérdida
                </label>
                <input id="fecha-perdida" type="date" value={fechaPerdida} max={hoyISO()} data-testid="input-fecha"
                  aria-invalid={Boolean(errores.fecha)}
                  onChange={(e) => { setFechaPerdida(e.target.value); setErrores((p) => ({ ...p, fecha: '' })); }}
                  className="w-full h-[52px] rounded-2xl px-4 text-[15px] outline-none transition-all border-[1.5px]
                             bg-[#F6F2F0] border-[#E3DCD8] text-dark-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/15
                             dark:bg-white/5 dark:border-white/10 dark:text-white dark:[color-scheme:dark]" />
                {errores.fecha && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errores.fecha}</p>}
              </div>
              <AreaTexto id="descripcion-reporte" data-testid="input-descripcion" rows={3} maxLength={MAX_DESC}
                etiqueta="Descripción (opcional)" placeholder="¿Qué pasó? ¿Llevaba collar? Señas particulares…"
                value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </SeccionFormulario>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 px-4 pt-3
                        pb-[max(env(safe-area-inset-bottom),1rem)] bg-gradient-to-t from-warm-50 via-warm-50 to-warm-50/0
                        dark:from-dark-800 dark:via-dark-800 dark:to-dark-800/0">
          <BotonPrimario type="submit" loading={enviando} disabled={mascotas.length === 0} textoCargando="Publicando…">
            <Megaphone size={19} aria-hidden="true" /> Publicar reporte
          </BotonPrimario>
        </div>
      </form>
    </div>
  );
}
