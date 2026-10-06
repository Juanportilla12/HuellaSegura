import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, QrCode, Share2 } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import { obtenerMascota } from '../services/mascotaService';
import { misReportes } from '../services/reporteService';
import BottomNav from '../components/ui/BottomNav';

const ESPECIE_EMOJIS = { perro:'🐶', gato:'🐱', ave:'🐦', reptil:'🦎', otro:'🐾' };
const ESPECIE_COLORS = {
  perro:  'linear-gradient(135deg,#FF9280,#F97B62)',
  gato:   'linear-gradient(135deg,#C7B2F5,#9B87E8)',
  ave:    'linear-gradient(135deg,#26D6CD,#00C4B4)',
  reptil: 'linear-gradient(135deg,#4ADE80,#22C55E)',
  otro:   'linear-gradient(135deg,#FF9280,#F97B62)',
};

export default function PerfilMascota() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const t        = useTokens();
  const [mascota,       setMascota]       = useState(null);
  const [reporteActivo, setReporteActivo] = useState(null);
  const [cargando,      setCargando]      = useState(true);

  useEffect(() => {
    Promise.all([
      obtenerMascota(id),
      misReportes().catch(() => ({ data: { reportes: [] } })),
    ]).then(([{ data: dm }, { data: dr }]) => {
      setMascota(dm.mascota);
      const activo = (dr.reportes || []).find(
        r => String(r.mascota_id) === String(id) && r.estado === 'en_busqueda'
      );
      setReporteActivo(activo || null);
    }).catch(() => navigate(-1))
      .finally(() => setCargando(false));
  }, [id, navigate]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: t.bg }}>
        <div className="h-10 w-10 rounded-full border-2 animate-spin"
             style={{ borderColor: t.primary, borderTopColor: 'transparent' }} />
      </div>
    );
  }
  if (!mascota) return null;

  const gradient  = ESPECIE_COLORS[mascota.especie] || ESPECIE_COLORS.otro;
  const emoji     = ESPECIE_EMOJIS[mascota.especie]  || '🐾';
  const fotos     = mascota.foto_urls || [];
  const chips     = [mascota.raza, mascota.edad ? `${mascota.edad} ${mascota.edad_unidad || 'años'}` : null, mascota.sexo, mascota.color].filter(Boolean);

  async function handleCompartir() {
    const url = `${window.location.origin}/publico/mascotas/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${mascota.nombre} — HuellaSegura`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>

      {/* Hero con foto */}
      <div className="relative h-72 overflow-hidden" style={{ background: gradient }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-25 select-none pointer-events-none">
          <span className="text-[12rem] filter blur-sm">{emoji}</span>
        </div>
        <div className="absolute inset-0 flex items-end justify-center pb-8">
          {fotos[0] ? (
            <img src={fotos[0]} alt={mascota.nombre} className="h-48 w-48 rounded-3xl object-cover"
                 style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }} />
          ) : (
            <div className="h-48 w-48 rounded-3xl flex items-center justify-center text-7xl"
                 style={{ background: 'rgba(255,255,255,0.3)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
              {emoji}
            </div>
          )}
        </div>

        {/* Barra superior */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 pt-safe pt-4">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
            <ChevronLeft size={20} color="white" strokeWidth={2.5} />
          </motion.button>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(`/mascotas/${id}/carnet`)}
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
              <QrCode size={18} color="white" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleCompartir}
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
              <Share2 size={18} color="white" />
            </motion.button>
          </div>
        </div>

        {/* Badge estado */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap"
                style={{ background: reporteActivo ? 'rgba(239,68,68,0.88)' : 'rgba(0,196,180,0.88)', backdropFilter: 'blur(8px)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {reporteActivo
              ? `Perdido · Hace ${Math.max(1, Math.round((Date.now() - new Date(reporteActivo.created_at)) / 3600000))}h`
              : 'En casa · Registrado'}
          </span>
        </div>
      </div>

      {/* Card info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="mx-4 -mt-5 rounded-3xl overflow-hidden relative z-10"
        style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1 className="text-3xl font-poppins font-extrabold" style={{ color: t.text }}>{mascota.nombre}</h1>
            {mascota.microchip && (
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>Microchip</p>
                <p className="text-sm font-bold" style={{ color: t.primary }}>{mascota.microchip}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-4">
            <MapPin size={13} style={{ color: t.textMuted }} />
            <span className="text-sm" style={{ color: t.textMuted }}>Pasto, Nariño</span>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {chips.map((c, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: t.surface2, color: t.text, border: `1px solid ${t.border}` }}>
                {c}
              </span>
            ))}
          </div>

          {mascota.descripcion && (
            <p className="text-sm leading-relaxed mb-5" style={{ color: t.textMuted }}>{mascota.descripcion}</p>
          )}

          {fotos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar mb-5 pb-1">
              {fotos.map((url, i) => (
                <img key={i} src={url} alt={`${mascota.nombre} ${i+1}`}
                     className="h-24 w-24 rounded-2xl object-cover shrink-0" />
              ))}
            </div>
          )}
        </div>

        {!reporteActivo && (
          <div className="px-5 pb-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/reportes/nuevo?mascota_id=${id}`)}
              data-testid="btn-reportar-perdida"
              className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: t.primaryBg, color: t.primary, border: `1px solid ${t.primaryBorder}` }}>
              <MapPin size={16} /> Reportar como perdida
            </motion.button>
          </div>
        )}

        <div className="px-5 pb-5 flex gap-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/mascotas/${id}/editar`)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 6px 18px rgba(249,123,98,0.4)' }}>
            Editar perfil
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/mascotas/${id}/carnet`)}
            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: t.secondaryBg, border: `1px solid ${t.secondaryBorder}` }}>
            <QrCode size={20} style={{ color: t.secondary }} />
          </motion.button>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
