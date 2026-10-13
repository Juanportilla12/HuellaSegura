import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Printer, Pencil, ChevronRight, House } from 'lucide-react';
import { toast } from 'sonner';
import { descargarCartel } from '../services/mascotaService';
import IconoEspecie from './ui/IconoEspecie';
import { focoVisible } from './auth/AuthUI';

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

function edadTexto(m) {
  if (!m.edad) return null;
  const unidad = m.edad_unidad === 'meses' ? (m.edad === 1 ? 'mes' : 'meses') : (m.edad === 1 ? 'año' : 'años');
  return `${m.edad} ${unidad}`;
}

function Accion({ icon: Icon, children, ...props }) {
  return (
    <button type="button" {...props}
      className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold
                  text-dark-700 dark:text-white/80 bg-warm-50 hover:bg-warm-100 dark:bg-white/5 dark:hover:bg-white/10
                  disabled:opacity-60 ${focoVisible}`}>
      <Icon size={16} aria-hidden="true" /> {children}
    </button>
  );
}

// Tarjeta de una mascota del usuario: foto, datos, estado y accesos rápidos (carnet, cartel, editar)
export default function MascotaCard({ mascota, perdida = false }) {
  const navigate = useNavigate();
  const [generandoCartel, setGenerandoCartel] = useState(false);
  const foto = mascota.foto_urls?.[0] || null;
  const datos = [mascota.raza, edadTexto(mascota)].filter(Boolean).join(' · ') || capitalizar(mascota.especie || 'mascota');

  // HU-31: cartel A4 en PDF (foto, datos y QR) generado en el servidor
  async function handleCartel() {
    setGenerandoCartel(true);
    try {
      await descargarCartel(mascota.id, mascota.nombre);
    } catch {
      toast.error('No se pudo generar el cartel. Intenta de nuevo.');
    } finally {
      setGenerandoCartel(false);
    }
  }

  return (
    <article data-testid="mascota-card"
      className="rounded-3xl bg-white dark:bg-white/5 border border-warm-border dark:border-white/10 shadow-card overflow-hidden">
      <button type="button" onClick={() => navigate(`/mascotas/${mascota.id}`)}
              aria-label={`Ver el perfil de ${mascota.nombre}`}
              className={`w-full flex items-center gap-4 p-3 pr-4 text-left rounded-3xl ${focoVisible}`}>
        <span className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center">
          {foto
            ? <img src={foto} alt="" className="w-full h-full object-cover" />
            : <IconoEspecie especie={mascota.especie} size={34} strokeWidth={1.5} className="text-primary-300" />}
        </span>
        <span className="flex-1 min-w-0">
          {perdida ? (
            <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold bg-primary-700 text-white">Se busca</span>
          ) : (
            <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700
                             dark:bg-emerald-500/15 dark:text-emerald-300">
              <House size={12} aria-hidden="true" /> En casa
            </span>
          )}
          <span className="block mt-1 font-poppins font-semibold text-[18px] leading-tight truncate text-dark-900 dark:text-white">
            {mascota.nombre}
          </span>
          <span className="block text-[13px] truncate text-gray-500 dark:text-white/50">{datos}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-gray-400" aria-hidden="true" />
      </button>

      <div className="flex gap-2 px-3 pb-3">
        <Accion icon={QrCode} onClick={() => navigate(`/mascotas/${mascota.id}/carnet`)}>Carnet QR</Accion>
        <Accion icon={Printer} onClick={handleCartel} disabled={generandoCartel}
                data-testid="btn-ver-cartel" aria-label={`Descargar cartel PDF de ${mascota.nombre}`}>
          {generandoCartel ? 'Generando…' : 'Cartel'}
        </Accion>
        <Accion icon={Pencil} onClick={() => navigate(`/mascotas/${mascota.id}/editar`)}
                aria-label={`Editar a ${mascota.nombre}`}>
          Editar
        </Accion>
      </div>
    </article>
  );
}
