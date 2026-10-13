import { useNavigate } from 'react-router-dom';
import { Check, Map as IconoMapa, Share2, X, RotateCcw, House } from 'lucide-react';
import { toast } from 'sonner';
import IconoEspecie from './ui/IconoEspecie';
import MapaEstatico from './mapa/MapaEstatico';
import { urlPerfilPublico } from '../services/perfilPublicoService';
import { focoVisible } from './auth/AuthUI';

function fecha(f) {
  if (!f) return '—';
  const [a, m, d] = String(f).slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function diasDesde(f) {
  const [a, m, d] = String(f).slice(0, 10).split('-').map(Number);
  const hoy = new Date();
  return Math.max(0, Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - new Date(a, m - 1, d)) / 864e5));
}

function tiempoPerdida(f) {
  if (!f) return '';
  const dias = diasDesde(f);
  return dias === 0 ? 'desde hoy' : dias === 1 ? 'desde ayer' : `hace ${dias} días`;
}

function Foto({ mascota, className }) {
  const foto = mascota?.foto_principal || mascota?.foto_urls?.[0];
  return (
    <span className={`shrink-0 overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center ${className}`}>
      {foto
        ? <img src={foto} alt="" className="w-full h-full object-cover" />
        : <IconoEspecie especie={mascota?.especie} size={28} strokeWidth={1.6} className="text-primary-300" />}
    </span>
  );
}

const ESTADOS = {
  en_busqueda: { label: 'Se busca',   clase: 'bg-primary-700 text-white' },
  encontrada:  { label: 'Encontrada', clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  cerrado:     { label: 'Cerrado',    clase: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60' },
};

const botonSecundario = `flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold
                         text-dark-700 bg-warm-50 hover:bg-warm-100 dark:text-white/80 dark:bg-white/5 dark:hover:bg-white/10 ${focoVisible}`;

export default function ReporteCard({ reporte, onCambiarEstado }) {
  const navigate = useNavigate();
  const m = reporte.mascota;
  const nombre = m?.nombre || `Mascota #${reporte.mascota_id}`;
  const estado = ESTADOS[reporte.estado] || ESTADOS.en_busqueda;
  const activo = reporte.estado === 'en_busqueda';
  const tieneUbicacion = Number.isFinite(parseFloat(reporte.latitud));

  async function compartir() {
    if (!m?.codigo_publico) return;
    const url = urlPerfilPublico(m.codigo_publico);
    if (navigator.share) {
      try { await navigator.share({ title: `Se busca a ${nombre} — HuellaSegura`, url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace del perfil copiado.');
    }
  }

  // Reporte cerrado o encontrado: tarjeta compacta en el historial
  if (!activo) {
    return (
      <article data-testid="reporte-card"
        className="rounded-3xl p-3 flex items-center gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
        <Foto mascota={m} className="h-14 w-14 rounded-2xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-poppins font-semibold text-[15px] truncate text-dark-900 dark:text-white">{nombre}</h3>
            <span className={`shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-bold ${estado.clase}`}>
              {reporte.estado === 'encontrada' && <House size={11} aria-hidden="true" />} {estado.label}
            </span>
          </div>
          <p className="text-[12px] text-gray-500 dark:text-white/50">Se perdió el {fecha(reporte.fecha_perdida)}</p>
        </div>
        {onCambiarEstado && (
          <button type="button" onClick={() => onCambiarEstado(reporte.id, 'en_busqueda')} data-testid="btn-estado-en_busqueda"
            className={`shrink-0 h-9 px-3 rounded-full flex items-center gap-1 text-[13px] font-semibold text-primary-700
                        bg-primary-50 hover:bg-primary-100 dark:bg-white/10 dark:text-primary-400 ${focoVisible}`}>
            <RotateCcw size={14} aria-hidden="true" /> Reactivar
          </button>
        )}
      </article>
    );
  }

  // Búsqueda activa: tarjeta completa con mapa y acciones
  return (
    <article data-testid="reporte-card"
      className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-primary-200 dark:border-white/15 shadow-card">
      <div className="p-4 flex items-center gap-3">
        <Foto mascota={m} className="h-16 w-16 rounded-2xl" />
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold ${estado.clase}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            {estado.label} · {tiempoPerdida(reporte.fecha_perdida)}
          </span>
          <h3 className="mt-1 font-poppins font-bold text-[19px] leading-tight truncate text-dark-900 dark:text-white">{nombre}</h3>
          <p className="text-[12px] text-gray-500 dark:text-white/50">Se perdió el {fecha(reporte.fecha_perdida)}</p>
        </div>
      </div>

      {tieneUbicacion && (
        <button type="button" onClick={() => navigate(`/mapa?reporte=${reporte.id}`)} aria-label={`Ver dónde se perdió ${nombre} en el mapa`}
                className={`block w-full ${focoVisible}`}>
          <MapaEstatico lat={parseFloat(reporte.latitud)} lng={parseFloat(reporte.longitud)} alto={110} />
        </button>
      )}

      {reporte.descripcion && (
        <p className="px-4 pt-3 text-[14px] leading-relaxed text-gray-600 dark:text-white/70 line-clamp-3">{reporte.descripcion}</p>
      )}

      {onCambiarEstado && (
        <div className="p-4 flex flex-col gap-2">
          <button type="button" onClick={() => onCambiarEstado(reporte.id, 'encontrada')} data-testid="btn-estado-encontrada"
            className={`h-12 rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold text-[15px] text-white
                        bg-emerald-600 hover:bg-emerald-700 shadow-[0_8px_20px_rgba(5,150,105,0.3)] ${focoVisible}`}>
            <Check size={19} strokeWidth={2.5} aria-hidden="true" /> ¡La encontré!
          </button>
          <div className="flex gap-2">
            {tieneUbicacion && (
              <button type="button" onClick={() => navigate(`/mapa?reporte=${reporte.id}`)} className={botonSecundario}>
                <IconoMapa size={16} aria-hidden="true" /> Mapa
              </button>
            )}
            {m?.codigo_publico && (
              <button type="button" onClick={compartir} className={botonSecundario}>
                <Share2 size={16} aria-hidden="true" /> Compartir
              </button>
            )}
            <button type="button" onClick={() => onCambiarEstado(reporte.id, 'cerrado')} data-testid="btn-estado-cerrado"
              className={botonSecundario}>
              <X size={16} aria-hidden="true" /> Cerrar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
