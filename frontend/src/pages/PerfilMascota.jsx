import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, Pencil, QrCode, Printer, Eye, Megaphone, House, Trash2, ChevronRight, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { obtenerMascota, eliminarMascota, descargarCartel } from '../services/mascotaService';
import { misReportes } from '../services/reporteService';
import { urlPerfilPublico } from '../services/perfilPublicoService';
import IconoEspecie from '../components/ui/IconoEspecie';
import HojaConfirmacion from '../components/ui/HojaConfirmacion';
import { focoVisible } from '../components/auth/AuthUI';

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

function edadTexto(m) {
  if (!m.edad) return null;
  const unidad = m.edad_unidad === 'meses' ? (m.edad === 1 ? 'mes' : 'meses') : (m.edad === 1 ? 'año' : 'años');
  return `${m.edad} ${unidad}`;
}

function diasDesde(fecha) {
  const [a, mes, d] = String(fecha).slice(0, 10).split('-').map(Number);
  const hoy = new Date();
  return Math.max(0, Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - new Date(a, mes - 1, d)) / 864e5));
}

const botonCircular = `h-10 w-10 rounded-full bg-white/95 text-dark-900 flex items-center justify-center
                       shadow-[0_4px_14px_rgba(26,26,46,0.2)] active:scale-95 transition-transform ${focoVisible}`;

function FilaAccion({ icon: Icon, titulo, detalle, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-warm-50 dark:hover:bg-white/5
                  disabled:opacity-60 ${focoVisible}`}>
      <span className="h-10 w-10 shrink-0 rounded-xl bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-primary-400
                       flex items-center justify-center">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-dark-900 dark:text-white">{titulo}</span>
        <span className="block text-[13px] text-gray-500 dark:text-white/50">{detalle}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
    </button>
  );
}

export default function PerfilMascota() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [mascota,       setMascota]       = useState(null);
  const [reporteActivo, setReporteActivo] = useState(null);
  const [cargando,      setCargando]      = useState(true);
  const [fotoIdx,       setFotoIdx]       = useState(0);
  const [confirmar,     setConfirmar]     = useState(false);
  const [eliminando,    setEliminando]    = useState(false);
  const [generando,     setGenerando]     = useState(false);

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
    }).catch(() => navigate('/mascotas', { replace: true }))
      .finally(() => setCargando(false));
  }, [id, navigate]);

  if (cargando) {
    return (
      <div className="min-h-dvh bg-warm-50 dark:bg-dark-800" aria-busy="true" aria-label="Cargando mascota">
        <div className="h-[40vh] bg-gray-200 dark:bg-white/5 animate-pulse" />
        <div className="px-5 pt-6 flex flex-col gap-3">
          <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-56 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }
  if (!mascota) return null;

  const fotos = mascota.foto_urls || [];
  const datos = [mascota.raza, edadTexto(mascota), mascota.sexo, mascota.color].filter(Boolean);

  async function handleCompartir() {
    const url = urlPerfilPublico(mascota.codigo_publico);
    if (navigator.share) {
      try { await navigator.share({ title: `${mascota.nombre} — HuellaSegura`, url }); } catch { /* el usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace del perfil copiado.');
    }
  }

  async function handleCartel() {
    setGenerando(true);
    try { await descargarCartel(mascota.id, mascota.nombre); }
    catch { toast.error('No se pudo generar el cartel. Intenta de nuevo.'); }
    finally { setGenerando(false); }
  }

  async function handleEliminar() {
    setEliminando(true);
    try {
      await eliminarMascota(mascota.id);
      toast.success(`${mascota.nombre} fue eliminado de tus mascotas.`);
      navigate('/mascotas', { replace: true });
    } catch {
      toast.error('No se pudo eliminar la mascota.');
      setEliminando(false);
      setConfirmar(false);
    }
  }

  const dias = reporteActivo ? diasDesde(reporteActivo.fecha_perdida) : 0;

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)]">

      {/* ── Foto ──────────────────────────────────────────────── */}
      <header className={`relative ${fotos[0] ? 'h-[42vh] min-h-[260px] max-h-[400px]' : 'h-[28vh] min-h-[190px]'}
                          bg-primary-50 dark:bg-white/5 overflow-hidden`}>
        {fotos[0] ? (
          <img src={fotos[fotoIdx]} alt={`Foto de ${mascota.nombre}`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-primary-200">
            <IconoEspecie especie={mascota.especie} size={84} strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 px-4 pt-[max(env(safe-area-inset-top),0.875rem)] flex justify-between">
          <button type="button" onClick={() => navigate('/mascotas')} aria-label="Volver a mis mascotas" className={botonCircular}>
            <ChevronLeft size={22} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={handleCompartir} aria-label="Compartir perfil" className={botonCircular}>
              <Share2 size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => navigate(`/mascotas/${id}/editar`)} aria-label="Editar perfil" className={botonCircular}>
              <Pencil size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        {fotos.length > 1 && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center gap-1.5">
            {fotos.map((_, i) => (
              <button key={i} type="button" aria-label={`Foto ${i + 1}`} aria-pressed={i === fotoIdx} onClick={() => setFotoIdx(i)}
                      className={`h-2 rounded-full transition-all ${i === fotoIdx ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />
            ))}
          </div>
        )}
      </header>

      <motion.main initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}
        className="relative -mt-7 rounded-t-[28px] bg-warm-50 dark:bg-dark-800 px-5 pt-5 flex flex-col gap-5">

        <section>
          {reporteActivo ? (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-bold bg-primary-700 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              Se busca · {dias === 0 ? 'desde hoy' : dias === 1 ? 'desde ayer' : `hace ${dias} días`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-bold bg-emerald-600 text-white">
              <House size={14} aria-hidden="true" /> En casa
            </span>
          )}
          <h1 className="mt-3 font-poppins font-bold text-[32px] leading-none text-dark-900 dark:text-white">{mascota.nombre}</h1>
          {datos.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Características">
              {datos.map((d) => (
                <li key={d} className="h-8 px-3 rounded-full flex items-center text-[13px] font-medium bg-white border border-warm-border
                                       text-dark-700 dark:bg-white/5 dark:border-white/10 dark:text-white/80">
                  {capitalizar(d)}
                </li>
              ))}
            </ul>
          )}
          {mascota.descripcion && (
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600 dark:text-white/70">{mascota.descripcion}</p>
          )}
          {mascota.microchip && (
            <p className="mt-3 flex items-center gap-2 text-[13px] text-gray-500 dark:text-white/50">
              <Cpu size={16} aria-hidden="true" /> Microchip: <span className="font-semibold text-dark-900 dark:text-white">{mascota.microchip}</span>
            </p>
          )}
        </section>

        {fotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {fotos.map((url, i) => (
              <button key={url} type="button" onClick={() => setFotoIdx(i)} aria-label={`Ver foto ${i + 1}`}
                      className={`shrink-0 h-20 w-20 rounded-2xl overflow-hidden ring-2 transition ${focoVisible}
                                  ${i === fotoIdx ? 'ring-primary-700' : 'ring-transparent opacity-80'}`}>
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {mascota.video_url && (
          <video src={mascota.video_url} controls playsInline preload="metadata"
                 className="w-full rounded-2xl" data-testid="video-mascota" />
        )}

        {/* ── Herramientas ──────────────────────────────────────── */}
        <section aria-label="Herramientas" className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border
                                                     dark:border-white/10 divide-y divide-warm-border dark:divide-white/10">
          <FilaAccion icon={QrCode} titulo="Carnet con código QR" detalle="Para el collar o la billetera"
                      onClick={() => navigate(`/mascotas/${id}/carnet`)} />
          <FilaAccion icon={Printer} titulo={generando ? 'Generando cartel…' : 'Cartel para imprimir'} detalle="PDF con foto, datos y QR"
                      onClick={handleCartel} disabled={generando} />
          <FilaAccion icon={Eye} titulo="Ver perfil público" detalle="Lo que ve quien escanea el QR"
                      onClick={() => navigate(`/publico/mascotas/${mascota.codigo_publico}`)} />
        </section>

        <button type="button" onClick={() => setConfirmar(true)}
          className={`self-center h-11 px-4 rounded-xl flex items-center gap-2 text-[14px] font-semibold text-red-600
                      hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 ${focoVisible}`}>
          <Trash2 size={16} aria-hidden="true" /> Eliminar mascota
        </button>
      </motion.main>

      {/* ── Acción principal ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 px-5 pt-3
                      pb-[max(env(safe-area-inset-bottom),1rem)] bg-gradient-to-t from-warm-50 via-warm-50 to-warm-50/0
                      dark:from-dark-800 dark:via-dark-800 dark:to-dark-800/0">
        {reporteActivo ? (
          <button type="button" onClick={() => navigate('/reportes')}
            className={`w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold text-[15px]
                        border-[1.5px] border-primary-700 text-primary-700 bg-white hover:bg-primary-50
                        dark:bg-transparent dark:text-primary-400 ${focoVisible}`}>
            Gestionar reporte de búsqueda
          </button>
        ) : (
          <button type="button" onClick={() => navigate(`/reportes/nuevo?mascota_id=${id}`)} data-testid="btn-reportar-perdida"
            className={`w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold text-[15px]
                        text-white bg-primary-700 hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
            <Megaphone size={19} aria-hidden="true" /> Reportar como perdida
          </button>
        )}
      </div>

      <HojaConfirmacion abierta={confirmar} titulo={`¿Eliminar a ${mascota.nombre}?`} peligro cargando={eliminando}
        textoConfirmar="Sí, eliminar" onConfirmar={handleEliminar} onCancelar={() => setConfirmar(false)}>
        Se borrarán su perfil, sus fotos, su carnet QR y sus reportes. Esta acción no se puede deshacer.
      </HojaConfirmacion>
    </div>
  );
}
