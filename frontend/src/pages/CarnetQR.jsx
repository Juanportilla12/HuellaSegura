import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Share2, Download, Printer, CheckCircle, ChevronLeft } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import { obtenerMascota } from '../services/mascotaService';
import BotonesCompartir from '../components/BotonesCompartir';

const ESPECIE_EMOJIS = { perro:'🐶', gato:'🐱', ave:'🐦', reptil:'🦎', otro:'🐾' };

export default function CarnetQR() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const t         = useTokens();
  const carnetRef = useRef(null);

  const [mascota,  setMascota]  = useState(null);
  const [cargando, setCargando] = useState(true);
  const [copiado,  setCopiado]  = useState(false);

  useEffect(() => {
    obtenerMascota(id)
      .then(({ data }) => setMascota(data.mascota))
      .catch(() => navigate(-1))
      .finally(() => setCargando(false));
  }, [id, navigate]);

  const publicUrl = `${window.location.origin}/publico/mascotas/${id}`;
  const hsId      = `HS-PT-${String(id).padStart(5, '0')}`;
  const emoji     = ESPECIE_EMOJIS[mascota?.especie] || '🐾';

  async function handleCompartir() {
    if (navigator.share) {
      try { await navigator.share({ title: `${mascota?.nombre} — HuellaSegura`, url: publicUrl }); } catch { /* el usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(publicUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  function handleImprimir() { window.print(); }

  async function handleDescargarPNG() {
    try {
      const svgEl   = carnetRef.current?.querySelector('svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl  = URL.createObjectURL(svgBlob);
      const img     = new Image();
      img.onload = () => {
        const canvas  = document.createElement('canvas');
        canvas.width  = img.width  * 3;
        canvas.height = img.height * 3;
        const ctx = canvas.getContext('2d');
        ctx.scale(3, 3);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);
        const link    = document.createElement('a');
        link.href     = canvas.toDataURL('image/png');
        link.download = `carnet-${mascota?.nombre || 'mascota'}.png`;
        link.click();
      };
      img.src = svgUrl;
    } catch { alert('No se pudo descargar. Intenta imprimir la página.'); }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: t.bg }}>
        <div className="h-10 w-10 rounded-full border-2 animate-spin"
             style={{ borderColor: t.primary, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: t.bg }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3"
           style={{ background: t.bgHeader }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: t.surface, border: `1px solid ${t.border}` }}>
          <ChevronLeft size={20} style={{ color: t.primary }} strokeWidth={2.5} />
        </motion.button>
        <h1 className="font-poppins font-bold text-lg" style={{ color: t.text }}>Carnet digital</h1>
        <motion.button whileTap={{ scale: 0.88 }} onClick={handleCompartir}
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: t.primaryBg, border: `1px solid ${t.primaryBorder}` }}>
          {copiado
            ? <CheckCircle size={18} style={{ color: t.secondary }} />
            : <Share2 size={18} style={{ color: t.primary }} />}
        </motion.button>
      </div>

      {/* Card carnet — siempre blanca para impresión */}
      <motion.div ref={carnetRef}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="mx-5 mt-4 rounded-3xl overflow-hidden"
        style={{ background: 'white', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>

        {/* Branding */}
        <div className="flex items-center justify-between px-5 py-3.5"
             style={{ background: '#FFF8F5', borderBottom: '1px solid #F0E8E4' }}>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-sm"
                 style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)' }}>🐾</div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F97B62' }}>HuellaSegura</span>
          </div>
          <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>ID · {hsId}</span>
        </div>

        {/* Info mascota */}
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0"
               style={{ background: 'linear-gradient(135deg,#FFD0BF,#F97B62)' }}>
            {mascota?.foto_urls?.[0]
              ? <img src={mascota.foto_urls[0]} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl">{emoji}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-poppins font-bold" style={{ color: '#1A1A2E' }}>{mascota?.nombre}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
              {[mascota?.raza, mascota?.edad ? `${mascota.edad} años` : null].filter(Boolean).join(' · ')}
            </p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: '#E0F9F7', color: '#00C4B4', border: '1px solid #B3F1ED' }}>
              <CheckCircle size={11} /> VERIFICADO
            </span>
          </div>
        </div>

        {/* QR */}
        <div className="flex items-center justify-center py-6 px-5">
          <div className="relative">
            <QRCodeSVG value={publicUrl} size={220} level="H" includeMargin={false} style={{ display: 'block' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full flex items-center justify-center text-xl"
                 style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 4px 12px rgba(249,123,98,0.5)' }}>
              🐾
            </div>
          </div>
        </div>

        {/* Info dueño */}
        <div className="grid grid-cols-2 gap-px mx-5 mb-5 rounded-2xl overflow-hidden"
             style={{ background: '#F0E8E4' }}>
          <div className="px-4 py-3" style={{ background: '#FFF8F5' }}>
            <p className="font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9CA3AF', fontSize: '0.6rem' }}>DUEÑO</p>
            <p className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>
              {mascota?.usuario_id ? `Usuario #${mascota.usuario_id}` : '—'}
            </p>
          </div>
          <div className="px-4 py-3" style={{ background: '#FFF8F5' }}>
            <p className="font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9CA3AF', fontSize: '0.6rem' }}>APP</p>
            <p className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>HuellaSegura</p>
          </div>
        </div>

        <p className="text-center text-xs pb-5" style={{ color: '#C9B8B0' }}>Escanea para ver el perfil completo</p>
      </motion.div>

      {/* Botones */}
      <div className="grid grid-cols-3 gap-3 mx-5 mt-5">
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleDescargarPNG}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
          style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textMuted }}>
          <Download size={16} /> Descargar PNG
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleImprimir}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
          style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textMuted }}>
          <Printer size={16} /> Imprimir
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleCompartir}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow: '0 6px 20px rgba(249,123,98,0.4)' }}>
          <Share2 size={16} /> {copiado ? '¡Copiado!' : 'Compartir link'}
        </motion.button>
      </div>
      {mascota && (
        <div className="mx-5 mt-3">
          <BotonesCompartir mascotaId={mascota.id} nombreMascota={mascota.nombre} />
        </div>
      )}
    </div>
  );
}
