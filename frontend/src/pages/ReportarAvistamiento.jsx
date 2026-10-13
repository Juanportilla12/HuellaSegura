import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, Eye, LocateFixed, ShieldCheck } from 'lucide-react';
import MapaSelector from '../components/MapaSelector';
import SeccionFormulario from '../components/formulario/SeccionFormulario';
import CampoTexto from '../components/formulario/CampoTexto';
import AreaTexto from '../components/formulario/AreaTexto';
import SelectorFoto from '../components/formulario/SelectorFoto';
import SelectorMascotaPerdida from '../components/formulario/SelectorMascotaPerdida';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import PantallaExito from '../components/ui/PantallaExito';
import IconoEspecie from '../components/ui/IconoEspecie';
import { AlertaError, BotonPrimario, focoVisible } from '../components/auth/AuthUI';
import { crearAvistamiento } from '../services/avistamientoService';
import { obtenerPerfilPublico } from '../services/perfilPublicoService';
import { geocodificarReversa } from '../services/geocodificacionService';

// R7 reporteAvistamiento / R11: cualquier persona, sin cuenta, reporta dónde vio
// una mascota perdida. Si llega desde el QR o el mapa, la mascota ya viene elegida.

// Mismo formato que acepta el backend: dígitos con espacios o guiones opcionales
const CELULAR_REGEX = /^\+?[0-9][0-9\s-]{6,18}$/;
const MAX_DESC = 500;

function MascotaDesdeQR({ codigo, onResuelta, onNoEncontrada }) {
  const [mascota, setMascota] = useState(null);

  useEffect(() => {
    obtenerPerfilPublico(codigo)
      .then(({ data }) => { setMascota(data.mascota); onResuelta(String(data.mascota.id)); })
      .catch(() => onNoEncontrada());
  }, [codigo, onResuelta, onNoEncontrada]);

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl border-[1.5px] border-primary-700 bg-primary-50 dark:bg-white/10"
         data-testid="mascota-desde-qr">
      <span className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-white/10 flex items-center justify-center">
        {mascota?.foto_principal
          ? <img src={mascota.foto_principal} alt="" className="w-full h-full object-cover" />
          : <IconoEspecie especie={mascota?.especie} size={28} strokeWidth={1.6} className="text-primary-300" />}
      </span>
      <span className="min-w-0">
        <span className="block font-poppins font-semibold text-[16px] truncate text-dark-900 dark:text-white">
          {mascota?.nombre ?? 'Cargando…'}
        </span>
        <span className="block text-[13px] truncate text-gray-500 dark:text-white/50">
          {[mascota?.raza, mascota?.color].filter(Boolean).join(' · ') || mascota?.especie}
        </span>
      </span>
    </div>
  );
}

export default function ReportarAvistamiento() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const codigoDesdeUrl = params.get('mascota') || '';
  const geocodeTimer = useRef(null);

  const [mascotaId,   setMascotaId]   = useState('');
  const [codigo,      setCodigo]      = useState(codigoDesdeUrl);
  const [coords,      setCoords]      = useState({ lat: null, lng: null });
  const [direccion,   setDireccion]   = useState('');
  const [buscandoGPS, setBuscandoGPS] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [nombre,      setNombre]      = useState('');
  const [telefono,    setTelefono]    = useState('');
  const [foto,        setFoto]        = useState(null);
  const [errores,     setErrores]     = useState({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [enviando,    setEnviando]    = useState(false);
  const [exito,       setExito]       = useState(false);

  const mascotaNoEncontrada = useCallback(() => setErrorGlobal('No encontramos esa mascota. Elige una de la lista.'), []);

  function handleCoordsChange(lat, lng) {
    setCoords({ lat, lng });
    setErrores((p) => ({ ...p, coords: '' }));
    setDireccion('Buscando dirección…');
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => setDireccion(await geocodificarReversa(lat, lng)), 600);
  }

  // Quien la está viendo en este momento puede usar su ubicación actual
  function usarMiUbicacion() {
    if (!navigator.geolocation) return setErrores((p) => ({ ...p, coords: 'Tu navegador no permite obtener la ubicación. Márcala en el mapa.' }));
    setBuscandoGPS(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => { handleCoordsChange(c.latitude, c.longitude); setBuscandoGPS(false); },
      () => { setErrores((p) => ({ ...p, coords: 'No se pudo obtener tu ubicación. Toca el mapa para marcarla.' })); setBuscandoGPS(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function validar() {
    const e = {};
    if (!mascotaId) e.mascota = 'Elige la mascota que viste.';
    if (!coords.lat || !coords.lng) e.coords = 'Marca en el mapa dónde la viste.';
    if (!foto) e.foto = 'Agrega una foto: ayuda al dueño a confirmar que es su mascota.';
    if (!telefono.trim()) e.telefono = 'Tu número de celular es obligatorio.';
    else if (!CELULAR_REGEX.test(telefono.trim())) e.telefono = 'Ingresa un número de celular válido.';
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
        telefono_testigo: telefono.trim(),
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
      <PantallaExito titulo="¡Gracias por ayudar!"
        accionPrincipal={{ texto: 'Ver perfil de la mascota', onClick: () => navigate(`/publico/mascotas/${codigo}`) }}
        accionSecundaria={{ texto: 'Volver al inicio', onClick: () => navigate('/') }}>
        Avisamos al dueño de la mascota. Tu reporte puede ser el que la reúna con su familia.
      </PantallaExito>
    );
  }

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)]">
      <EncabezadoPagina titulo="Reportar avistamiento" subtitulo="Sin cuenta · Avisamos al dueño" />

      <form onSubmit={handleSubmit} noValidate data-testid="form-avistamiento">
        <div className="px-4 pt-4 flex flex-col gap-4">
          <AlertaError mensaje={errorGlobal} />

          <SeccionFormulario paso={1} titulo="¿Qué mascota viste?">
            {codigoDesdeUrl
              ? <MascotaDesdeQR codigo={codigoDesdeUrl} onResuelta={setMascotaId} onNoEncontrada={mascotaNoEncontrada} />
              : <SelectorMascotaPerdida valor={mascotaId} error={errores.mascota}
                  onCambio={(id, cod) => { setMascotaId(id); setCodigo(cod); setErrores((p) => ({ ...p, mascota: '' })); }} />}
          </SeccionFormulario>

          <SeccionFormulario paso={2} titulo="¿Dónde la viste?" sinRelleno accion={
            <button type="button" onClick={usarMiUbicacion} disabled={buscandoGPS}
              className={`shrink-0 -my-1 h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold
                          text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-white/10 disabled:opacity-60 ${focoVisible}`}>
              <LocateFixed size={15} aria-hidden="true" /> {buscandoGPS ? 'Buscando…' : 'Estoy aquí'}
            </button>
          }>
            <MapaSelector coords={coords} onCoordsChange={handleCoordsChange} address={direccion} />
            <p className={`px-4 py-3 text-[13px] ${errores.coords ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-white/50'}`}>
              {errores.coords || (coords.lat ? 'Ubicación marcada. Toca otro punto para moverla.' : 'Toca el mapa para marcar el lugar exacto.')}
            </p>
          </SeccionFormulario>

          <SeccionFormulario paso={3} titulo="Foto y detalles">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <SelectorFoto foto={foto} error={errores.foto} onError={setErrorGlobal}
                  onCambio={(f) => { setFoto(f); setErrores((p) => ({ ...p, foto: '' })); }} />
                {errores.foto && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errores.foto}</p>}
              </div>
              <AreaTexto id="descripcion-avistamiento" etiqueta="Detalles (opcional)"
                value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={MAX_DESC} rows={3}
                placeholder="¿Qué hacía? ¿Llevaba collar? ¿Se veía lastimada o sola?" />
            </div>
          </SeccionFormulario>

          <SeccionFormulario paso={4} titulo="Tus datos">
            <div className="flex flex-col gap-3">
              <p className="flex items-start gap-2 text-[13px] leading-snug text-gray-500 dark:text-white/50">
                <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
                El dueño te contactará a este número. Solo él lo verá.
              </p>
              <CampoTexto id="telefono-testigo" etiqueta="Tu celular" icono={Phone} type="tel" inputMode="tel"
                placeholder="300 123 4567" autoComplete="tel" maxLength={20} aria-required="true"
                value={telefono} onChange={(e) => { setTelefono(e.target.value); setErrores((p) => ({ ...p, telefono: '' })); }}
                error={errores.telefono} />
              <CampoTexto id="nombre-testigo" etiqueta="Tu nombre (opcional)" icono={User} placeholder="Cómo te llamas"
                value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} autoComplete="name" />
            </div>
          </SeccionFormulario>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 px-4 pt-3
                        pb-[max(env(safe-area-inset-bottom),1rem)] bg-gradient-to-t from-warm-50 via-warm-50 to-warm-50/0
                        dark:from-dark-800 dark:via-dark-800 dark:to-dark-800/0">
          <BotonPrimario type="submit" loading={enviando} textoCargando="Enviando…" data-testid="btn-enviar-avistamiento">
            <Eye size={19} aria-hidden="true" /> Enviar avistamiento
          </BotonPrimario>
        </div>
      </form>
    </div>
  );
}
