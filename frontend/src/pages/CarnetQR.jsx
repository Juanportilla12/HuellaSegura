import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Share2, Download, Printer, Check, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { obtenerMascota } from '../services/mascotaService';
import { urlPerfilPublico } from '../services/perfilPublicoService';
import { useAuth } from '../context/AuthContext';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import IconoEspecie from '../components/ui/IconoEspecie';
import { Huella, focoVisible } from '../components/auth/AuthUI';

function Boton({ icon: Icon, children, principal = false, ...props }) {
  return (
    <button type="button" {...props}
      className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold ${focoVisible}
                  ${principal ? 'text-white bg-primary-700 hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.3)]'
                              : 'text-dark-900 bg-white border border-warm-border hover:bg-warm-100 dark:bg-white/5 dark:border-white/10 dark:text-white'}`}>
      <Icon size={18} aria-hidden="true" /> {children}
    </button>
  );
}

export default function CarnetQR() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { usuario } = useAuth();
  const qrRef     = useRef(null);

  const [mascota,  setMascota]  = useState(null);
  const [cargando, setCargando] = useState(true);
  const [copiado,  setCopiado]  = useState(false);
  const [mostrarCelular, setMostrarCelular] = useState(true);

  useEffect(() => {
    obtenerMascota(id)
      .then(({ data }) => setMascota(data.mascota))
      .catch(() => navigate('/mascotas', { replace: true }))
      .finally(() => setCargando(false));
  }, [id, navigate]);

  // El QR usa el código público aleatorio de la mascota, no su id interno
  const publicUrl = mascota ? urlPerfilPublico(mascota.codigo_publico) : '';
  const dueno     = usuario?.nombre?.split(' ')[0];
  const celular   = usuario?.celular;

  async function handleCompartir() {
    if (navigator.share) {
      try { await navigator.share({ title: `${mascota?.nombre} — HuellaSegura`, url: publicUrl }); } catch { /* el usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(publicUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  // Descarga solo el código QR en PNG (alta resolución, fondo blanco)
  function handleDescargarQR() {
    try {
      const svgEl = qrRef.current?.querySelector('svg');
      if (!svgEl) return;
      const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = () => {
        const escala = 4, margen = 24;
        const canvas = document.createElement('canvas');
        canvas.width  = img.width * escala + margen * 2;
        canvas.height = img.height * escala + margen * 2;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, margen, margen, img.width * escala, img.height * escala);
        URL.revokeObjectURL(svgUrl);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `qr-${mascota?.nombre || 'mascota'}.png`;
        link.click();
      };
      img.src = svgUrl;
    } catch {
      toast.error('No se pudo descargar el QR. Intenta imprimir el carnet.');
    }
  }

  if (cargando) {
    return (
      <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 flex items-center justify-center" aria-busy="true">
        <div className="h-[420px] w-[calc(100%-40px)] max-w-sm rounded-3xl bg-gray-200 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-10 print:bg-white print:pb-0">
      <div className="print:hidden">
        <EncabezadoPagina titulo="Carnet con QR" subtitulo={mascota?.nombre} />
      </div>

      {/* ── Carnet (siempre claro para imprimir) ─────────────────── */}
      <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        aria-label={`Carnet de ${mascota?.nombre}`}
        className="mx-5 mt-5 rounded-[28px] overflow-hidden bg-white shadow-[0_16px_40px_rgba(26,26,46,0.14)]
                   print:shadow-none print:border print:border-gray-300 print:mx-auto print:max-w-[360px]
                   [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <div className="bg-[#E8732F] px-5 py-3 flex items-center gap-2 text-white">
          <span className="h-7 w-7 rounded-lg bg-white flex items-center justify-center">
            <Huella className="h-4 w-4 text-primary-700" />
          </span>
          <span className="font-poppins font-bold text-[15px]">HuellaSegura</span>
          <span className="ml-auto text-[12px] font-medium text-white/90">Pasto, Nariño</span>
        </div>

        <div className="flex items-center gap-4 px-5 pt-5">
          <span className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-primary-50 flex items-center justify-center">
            {mascota?.foto_urls?.[0]
              ? <img src={mascota.foto_urls[0]} alt="" className="w-full h-full object-cover" />
              : <IconoEspecie especie={mascota?.especie} size={30} strokeWidth={1.6} className="text-primary-300" />}
          </span>
          <div className="min-w-0">
            <h2 className="font-poppins font-bold text-[22px] leading-tight truncate text-dark-900">{mascota?.nombre}</h2>
            <p className="text-[13px] truncate text-gray-500">
              {[mascota?.raza, mascota?.color].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <div ref={qrRef} className="flex justify-center py-5">
          <div className="relative p-3 rounded-2xl border border-warm-border">
            <QRCodeSVG value={publicUrl} size={196} level="H" includeMargin={false} style={{ display: 'block' }} />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-11 w-11 rounded-xl bg-primary-700
                             ring-4 ring-white flex items-center justify-center" aria-hidden="true">
              <Huella className="h-6 w-6 text-white" />
            </span>
          </div>
        </div>

        <div className="mx-5 mb-5 rounded-2xl bg-warm-50 px-4 py-3 text-center">
          <p className="font-poppins font-semibold text-[15px] text-dark-900">Si me encuentras, escanea el código</p>
          <p className="text-[12px] text-gray-500 mt-0.5">Verás cómo avisarle a mi familia. No necesitas la app.</p>
          {mostrarCelular && celular && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-dark-900">
              <Phone size={14} aria-hidden="true" /> {dueno ? `${dueno} · ` : ''}{celular}
            </p>
          )}
        </div>
      </motion.article>

      {/* ── Opciones ─────────────────────────────────────────────── */}
      <div className="mx-5 mt-5 flex flex-col gap-3 print:hidden">
        {celular && (
          <label className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 bg-white dark:bg-white/5
                            border border-warm-border dark:border-white/10 cursor-pointer">
            <span>
              <span className="block text-[15px] font-semibold text-dark-900 dark:text-white">Mostrar mi celular</span>
              <span className="block text-[13px] text-gray-500 dark:text-white/50">Por si quien la encuentra no puede escanear</span>
            </span>
            <input type="checkbox" role="switch" checked={mostrarCelular} onChange={(e) => setMostrarCelular(e.target.checked)}
                   className="peer sr-only" />
            <span className="relative h-7 w-12 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary-700
                             peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30
                             after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white
                             after:shadow after:transition-transform peer-checked:after:translate-x-5" aria-hidden="true" />
          </label>
        )}

        <div className="flex gap-3">
          <Boton icon={Printer} onClick={() => window.print()} principal>Imprimir</Boton>
          <Boton icon={Download} onClick={handleDescargarQR}>Descargar QR</Boton>
        </div>
        <Boton icon={copiado ? Check : Share2} onClick={handleCompartir}>
          {copiado ? 'Enlace copiado' : 'Compartir enlace del perfil'}
        </Boton>
      </div>
    </div>
  );
}
