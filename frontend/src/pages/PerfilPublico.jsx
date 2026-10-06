import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, MoreHorizontal, MapPin, Phone, Navigation, Eye } from 'lucide-react';
import { obtenerPerfilPublico } from '../services/perfilPublicoService';
import BotonesCompartir from '../components/BotonesCompartir';
import Chip from '../components/ui/Chip';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

const ESPECIE_EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };
const ESPECIE_COLORS = {
  perro:  'linear-gradient(135deg,#FFD0BF,#F97B62)',
  gato:   'linear-gradient(135deg,#C7B2F5,#9B87E8)',
  ave:    'linear-gradient(135deg,#A7F0EB,#00C4B4)',
  reptil: 'linear-gradient(135deg,#A7F5B9,#22C55E)',
  otro:   'linear-gradient(135deg,#FFD0BF,#F97B62)',
};

export default function PerfilPublico() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [datos,    setDatos]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');
  const [copiado,  setCopiado]  = useState(false);

  useEffect(() => {
    obtenerPerfilPublico(id)
      .then(({ data }) => setDatos(data))
      .catch(() => setError('Mascota no encontrada.'))
      .finally(() => setCargando(false));
  }, [id]);

  async function handleCompartir() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'HuellaSegura', url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#FFF8F5' }}>
        <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
             style={{ borderColor: '#F97B62', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-8"
           style={{ background: '#FFF8F5' }}>
        <span className="text-6xl">🐾</span>
        <p className="font-poppins font-bold text-xl text-center" style={{ color: '#1A1A2E' }}>
          {error}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-2xl text-white font-semibold"
          style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  const { mascota, propietario, reporte_activo } = datos;
  const gradient = ESPECIE_COLORS[mascota.especie] || ESPECIE_COLORS.otro;
  const emoji    = ESPECIE_EMOJIS[mascota.especie] || '🐾';
  const fotos    = mascota.foto_urls || (mascota.foto_principal ? [mascota.foto_principal] : []);

  const chips = [
    mascota.raza,
    mascota.edad ? `${mascota.edad} ${mascota.edad_unidad || 'años'}` : null,
    mascota.sexo,
    mascota.color,
    mascota.temperamento,
  ].filter(Boolean);

  const horasPerdida = reporte_activo
    ? Math.max(1, Math.round((Date.now() - new Date(reporte_activo.created_at)) / 3600000))
    : null;

  return (
    <div className="min-h-screen pb-10" style={{ background: '#FFF8F5' }}>

      {/* ── Header gradiente ──────────────────────────────────────────────── */}
      <div className="relative h-72 overflow-hidden" style={{ background: gradient }}>

        {/* Emoji decorativo difuminado */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 select-none pointer-events-none">
          <span className="text-[12rem] filter blur-sm">{emoji}</span>
        </div>

        {/* Foto / emoji principal */}
        <div className="absolute inset-0 flex items-end justify-center pb-8">
          {fotos[0] ? (
            <img src={fotos[0]} alt={mascota.nombre}
                 className="h-48 w-48 rounded-3xl object-cover shadow-warm-lg" />
          ) : (
            <div
              className="h-48 w-48 rounded-3xl flex items-center justify-center text-7xl shadow-warm-lg"
              style={{ background: 'rgba(255,255,255,0.35)' }}
            >
              {emoji}
            </div>
          )}
        </div>

        {/* Botones superiores */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 pt-12">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.35)' }}
          >
            <ChevronLeft size={20} color="white" strokeWidth={2.5} />
          </motion.button>

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleCompartir}
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.35)' }}
            >
              <Share2 size={18} color="white" strokeWidth={2} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.35)' }}
            >
              <MoreHorizontal size={18} color="white" strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* Badge estado */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap"
            style={{
              background: reporte_activo
                ? 'rgba(239,68,68,0.88)'
                : 'rgba(0,196,180,0.88)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {reporte_activo
              ? `Perdido · Hace ${horasPerdida}h`
              : 'En casa · Registrado'}
          </span>
        </div>
      </div>

      {/* ── Card principal ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-4 -mt-5 rounded-3xl overflow-hidden shadow-card-lg relative z-10"
        style={{ background: 'white' }}
      >
        <div className="p-5">

          {/* Nombre + recompensa */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1 className="text-3xl font-poppins font-extrabold" style={{ color: '#1A1A2E' }}>
              {mascota.nombre}
            </h1>
            {reporte_activo?.recompensa && (
              <div className="text-right shrink-0">
                <p className="text-xl font-poppins font-extrabold" style={{ color: '#F97B62' }}>
                  $ {Number(reporte_activo.recompensa).toLocaleString('es-CO')}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
                  RECOMPENSA
                </p>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin size={13} style={{ color: '#9CA3AF' }} />
            <span className="text-sm" style={{ color: '#9CA3AF' }}>
              {reporte_activo?.zona || 'Pasto, Nariño'}
            </span>
          </div>

          {/* Chips características */}
          <div className="flex flex-wrap gap-2 mb-5">
            {chips.map((c, i) => (
              <Chip key={i} variant="neutral" size="md">{c}</Chip>
            ))}
          </div>

          {/* Descripción */}
          {mascota.descripcion && (
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#6B7280' }}>
              {mascota.descripcion}
            </p>
          )}

          {/* Galería */}
          {fotos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar mb-5 pb-1">
              {fotos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${mascota.nombre} ${i + 1}`}
                  className="h-24 w-24 rounded-2xl object-cover shrink-0"
                />
              ))}
            </div>
          )}

          {/* Video (R5) */}
          {mascota.video_url && (
            <video src={mascota.video_url} controls playsInline preload="metadata"
                   className="w-full rounded-2xl mb-5" data-testid="video-mascota" />
          )}

          {/* Separador */}
          <div className="h-px mb-4" style={{ background: '#EDE5E1' }} />

          {/* Propietario */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={propietario?.nombre ?? ''} size="md" />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>
                  {propietario?.nombre ?? 'Propietario'}
                </p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {propietario?.telefono ? `Contacto: ${propietario.telefono}` : 'Dueño'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {propietario?.telefono && (
                <a
                  href={`tel:${propietario.telefono}`}
                  aria-label={`Llamar al ${propietario.telefono}`}
                  className="h-11 w-11 rounded-full border flex items-center justify-center"
                  style={{ borderColor: '#EDE5E1' }}
                >
                  <Phone size={18} style={{ color: '#6B7280' }} />
                </a>
              )}
              <a
                href={reporte_activo
                  ? `https://maps.google.com/?q=${reporte_activo.latitud},${reporte_activo.longitud}`
                  : 'https://maps.google.com/?q=Pasto,Narino'}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 w-11 rounded-2xl flex items-center justify-center"
                style={{ background: '#1A1A2E' }}
              >
                <Navigation size={18} color="white" />
              </a>
            </div>
          </div>
        </div>

        {/* Botón reportar avistamiento */}
        <div className="px-5 pb-5">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => window.location.assign(`/avistamientos/nuevo?mascota_id=${mascota.id}`)}
            iconLeft={<Eye size={18} />}
          >
            ¡La vi! Reportar avistamiento
          </Button>
          <div className="mt-3">
            <BotonesCompartir mascotaId={mascota.id} nombreMascota={mascota.nombre} buscando={Boolean(reporte_activo)} />
          </div>
        </div>
      </motion.div>

      {/* Marca HuellaSegura */}
      <p className="text-center text-xs mt-6" style={{ color: '#C9B8B0' }}>
        Perfil público · <span style={{ color: '#F97B62' }}>HuellaSegura</span>
      </p>
    </div>
  );
}
