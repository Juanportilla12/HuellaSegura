import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, Phone, MessageCircle, Eye, MapPin, ArrowRight, House } from 'lucide-react';
import { toast } from 'sonner';
import { obtenerPerfilPublico } from '../services/perfilPublicoService';
import BotonesCompartir from '../components/BotonesCompartir';
import IconoEspecie from '../components/ui/IconoEspecie';
import MapaEstatico from '../components/mapa/MapaEstatico';
import { focoVisible } from '../components/auth/AuthUI';

// Días transcurridos desde la fecha de pérdida (AAAA-MM-DD), en hora local
function diasDesde(fecha) {
  const [a, m, d] = String(fecha).slice(0, 10).split('-').map(Number);
  const hoy = new Date();
  return Math.max(0, Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - new Date(a, m - 1, d)) / 864e5));
}

function textoPerdida(fecha, sexo) {
  const perdido = sexo === 'hembra' ? 'Perdida' : 'Perdido';
  if (!fecha) return perdido;
  const dias = diasDesde(fecha);
  if (dias === 0) return `${perdido} desde hoy`;
  if (dias === 1) return `${perdido} desde ayer`;
  return `${perdido} hace ${dias} días`;
}

// Celular colombiano → número internacional para WhatsApp (wa.me exige el indicativo)
function numeroWhatsApp(telefono) {
  const digitos = String(telefono).replace(/\D/g, '');
  return digitos.length === 10 && digitos.startsWith('3') ? `57${digitos}` : digitos;
}

// Solo la primera letra en mayúscula ("Verde y amarillo", no "Verde Y Amarillo")
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const botonCircular = `h-10 w-10 rounded-full bg-white/95 text-dark-900 flex items-center justify-center
                       shadow-[0_4px_14px_rgba(26,26,46,0.2)] active:scale-95 transition-transform ${focoVisible}`;

function Cargando() {
  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800" aria-busy="true" aria-label="Cargando perfil">
      <div className="h-[46vh] bg-gray-200 dark:bg-white/5 animate-pulse" />
      <div className="px-5 pt-6 flex flex-col gap-3">
        <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
        <div className="h-4 w-56 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export default function PerfilPublico() {
  const { codigo } = useParams();
  const navigate = useNavigate();

  const [datos,    setDatos]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');
  const [fotoIdx,  setFotoIdx]  = useState(0);

  useEffect(() => {
    obtenerPerfilPublico(codigo)
      .then(({ data }) => setDatos(data))
      .catch(() => setError('Mascota no encontrada.'))
      .finally(() => setCargando(false));
  }, [codigo]);

  async function handleCompartir() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${datos?.mascota?.nombre ?? 'Mascota'} · HuellaSegura`, url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado.');
    }
  }

  // Quien llega escaneando el QR no tiene historial: "volver" lo lleva al inicio
  function volver() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }

  if (cargando) return <Cargando />;

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-8 text-center bg-warm-50 dark:bg-dark-800">
        <span className="h-20 w-20 rounded-3xl bg-primary-50 text-primary-300 flex items-center justify-center">
          <IconoEspecie size={40} strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-poppins font-bold text-xl text-dark-900 dark:text-white">{error}</h1>
          <p className="text-sm mt-1 text-gray-500 dark:text-white/50">Es posible que el enlace haya cambiado o que el perfil ya no exista.</p>
        </div>
        <button type="button" onClick={() => navigate('/')}
                className={`h-12 px-6 rounded-2xl font-semibold text-white bg-primary-700 hover:bg-primary-800 ${focoVisible}`}>
          Ir al inicio
        </button>
      </div>
    );
  }

  const { mascota, propietario, reporte_activo: reporte } = datos;
  const fotos   = mascota.foto_urls?.length ? mascota.foto_urls : (mascota.foto_principal ? [mascota.foto_principal] : []);
  const perdida = Boolean(reporte);
  const datosMascota = [mascota.raza, mascota.sexo, mascota.color].filter(Boolean);
  const dueno   = propietario?.nombre || 'el dueño';
  const mensajeWa = `Hola ${dueno}, vi el perfil de ${mascota.nombre} en HuellaSegura y tengo información: ${window.location.href}`;

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)]">

      {/* ── Foto principal ─────────────────────────────────────── */}
      <header className={`relative ${fotos[0] ? 'h-[46vh] min-h-[280px] max-h-[440px]' : 'h-[30vh] min-h-[200px]'} bg-primary-50 dark:bg-white/5 overflow-hidden`}>
        {fotos[0] ? (
          <motion.img key={fotoIdx} src={fotos[fotoIdx]} alt={`Foto de ${mascota.nombre}`}
                      initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
                      className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-primary-200">
            <IconoEspecie especie={mascota.especie} size={96} strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

        <div className="absolute inset-x-0 top-0 px-4 pt-[max(env(safe-area-inset-top),0.875rem)] flex justify-between">
          <button type="button" onClick={volver} aria-label="Volver" className={botonCircular}>
            <ChevronLeft size={22} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button type="button" onClick={handleCompartir} aria-label="Compartir perfil" className={botonCircular}>
            <Share2 size={18} aria-hidden="true" />
          </button>
        </div>

        {fotos.length > 1 && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center gap-1.5" role="tablist" aria-label="Fotos">
            {fotos.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === fotoIdx} aria-label={`Foto ${i + 1}`}
                      onClick={() => setFotoIdx(i)}
                      className={`h-2 rounded-full transition-all ${i === fotoIdx ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />
            ))}
          </div>
        )}
      </header>

      {/* ── Contenido ──────────────────────────────────────────── */}
      <motion.main initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}
        className="relative -mt-7 rounded-t-[28px] bg-warm-50 dark:bg-dark-800 px-5 pt-5 flex flex-col gap-6">

        <section>
          {perdida ? (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-bold bg-primary-700 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              {textoPerdida(reporte.fecha_perdida, mascota.sexo)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-bold bg-emerald-600 text-white">
              <House size={14} aria-hidden="true" /> En casa
            </span>
          )}

          <h1 className="mt-3 font-poppins font-bold text-[32px] leading-none text-dark-900 dark:text-white">
            {mascota.nombre}
          </h1>

          {datosMascota.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Características">
              {datosMascota.map((d) => (
                <li key={d} className="h-8 px-3 rounded-full flex items-center text-[13px] font-medium
                                       bg-white border border-warm-border text-dark-700
                                       dark:bg-white/5 dark:border-white/10 dark:text-white/80">
                  {capitalizar(d)}
                </li>
              ))}
            </ul>
          )}

          {(reporte?.descripcion || mascota.descripcion) && (
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600 dark:text-white/70">
              {reporte?.descripcion || mascota.descripcion}
            </p>
          )}
        </section>

        {fotos.length > 1 && (
          <section aria-label="Galería">
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {fotos.map((url, i) => (
                <button key={url} type="button" onClick={() => setFotoIdx(i)} aria-label={`Ver foto ${i + 1}`}
                        className={`shrink-0 h-20 w-20 rounded-2xl overflow-hidden ring-2 transition ${focoVisible}
                                    ${i === fotoIdx ? 'ring-primary-700' : 'ring-transparent opacity-80'}`}>
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}

        {mascota.video_url && (
          <video src={mascota.video_url} controls playsInline preload="metadata"
                 className="w-full rounded-2xl" data-testid="video-mascota" />
        )}

        {/* ── Último lugar donde se vio ─────────────────────────── */}
        {perdida && (
          <section aria-labelledby="titulo-lugar" className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <MapaEstatico lat={reporte.latitud} lng={reporte.longitud} alto={150} />
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="titulo-lugar" className="font-poppins font-semibold text-[15px] text-dark-900 dark:text-white flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary-700" aria-hidden="true" /> Visto por última vez
                </h2>
                <p className="text-[13px] mt-0.5 text-gray-500 dark:text-white/50">Pasto, Nariño</p>
              </div>
              <button type="button" onClick={() => navigate(`/mapa?reporte=${reporte.id}`)}
                      className={`shrink-0 h-10 px-4 rounded-full text-[14px] font-semibold text-primary-700 dark:text-primary-400
                                  border-[1.5px] border-primary-200 hover:bg-primary-50 dark:border-white/15 flex items-center gap-1 ${focoVisible}`}>
                Ver mapa <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {/* ── Contacto con el dueño ────────────────────────────── */}
        <section aria-labelledby="titulo-contacto" className="rounded-3xl p-4 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="h-12 w-12 shrink-0 rounded-full bg-primary-700 text-white font-poppins font-semibold text-lg
                             flex items-center justify-center" aria-hidden="true">
              {dueno.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 id="titulo-contacto" className="text-[13px] text-gray-500 dark:text-white/50">
                {perdida ? `¿Tienes noticias de ${mascota.nombre}?` : `¿Encontraste a ${mascota.nombre}?`}
              </h2>
              <p className="font-poppins font-semibold text-[16px] truncate text-dark-900 dark:text-white">
                {propietario?.nombre ?? 'Propietario'}
              </p>
            </div>
          </div>
          {propietario?.telefono ? (
            <div className="flex gap-2 mt-4">
              <a href={`tel:${propietario.telefono}`} aria-label={`Llamar a ${dueno}`}
                 className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold
                             border-[1.5px] border-gray-300 text-dark-900 hover:bg-gray-50
                             dark:border-white/15 dark:text-white dark:hover:bg-white/5 ${focoVisible}`}>
                <Phone size={18} aria-hidden="true" /> Llamar
              </a>
              <a href={`https://wa.me/${numeroWhatsApp(propietario.telefono)}?text=${encodeURIComponent(mensajeWa)}`}
                 target="_blank" rel="noopener noreferrer" aria-label={`Escribir a ${dueno} por WhatsApp`}
                 className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold
                             text-white bg-[#128C7E] hover:bg-[#0F7A6E] ${focoVisible}`}>
                <MessageCircle size={18} aria-hidden="true" /> WhatsApp
              </a>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-gray-500 dark:text-white/50">
              Reporta el avistamiento y avisaremos a su dueño.
            </p>
          )}
        </section>

        {/* ── Difundir ──────────────────────────────────────────── */}
        <section aria-labelledby="titulo-difundir">
          <h2 id="titulo-difundir" className="font-poppins font-semibold text-[15px] mb-3 text-dark-900 dark:text-white">
            {perdida ? 'Ayuda a difundir' : 'Compartir perfil'}
          </h2>
          <BotonesCompartir codigoPublico={mascota.codigo_publico} nombreMascota={mascota.nombre} buscando={perdida} />
        </section>

        <p className="text-center text-xs text-gray-400 dark:text-white/30 pb-2">
          Perfil público · <span className="font-semibold text-primary-700 dark:text-primary-400">HuellaSegura</span>
        </p>
      </motion.main>

      {/* ── Acción principal fija ────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 px-5 pt-3
                      pb-[max(env(safe-area-inset-bottom),1rem)] bg-gradient-to-t from-warm-50 via-warm-50 to-warm-50/0
                      dark:from-dark-800 dark:via-dark-800 dark:to-dark-800/0">
        <button type="button" onClick={() => navigate(`/avistamientos/nuevo?mascota=${mascota.codigo_publico}`)}
                className={`w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold
                            text-[15px] text-white bg-primary-700 hover:bg-primary-800
                            shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
          <Eye size={19} aria-hidden="true" /> ¡La vi! Reportar avistamiento
        </button>
      </div>
    </div>
  );
}
