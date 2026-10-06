import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, Trash2, QrCode, Printer, Eye } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import { toast } from 'sonner';
import { descargarCartel } from '../services/mascotaService';

const ESPECIE_EMOJIS  = { perro:'🐶', gato:'🐱', ave:'🐦', reptil:'🦎', otro:'🐾' };
const ESPECIE_COLORS  = {
  perro:  ['#FF9280','#F97B62'],
  gato:   ['#C7B2F5','#9B87E8'],
  ave:    ['#26D6CD','#00C4B4'],
  reptil: ['#4ADE80','#22C55E'],
  otro:   ['#FF9280','#F97B62'],
};
const ESPECIE_LABELS  = { perro:'Perro', gato:'Gato', ave:'Ave', reptil:'Reptil', otro:'Otro' };

export default function MascotaCard({ mascota, onEliminar }) {
  const navigate = useNavigate();
  const t        = useTokens();
  const [generandoCartel, setGenerandoCartel] = useState(false);

  const [c1, c2]      = ESPECIE_COLORS[mascota.especie] || ESPECIE_COLORS.otro;
  const emoji         = ESPECIE_EMOJIS[mascota.especie]  || '🐾';
  const fotoPrincipal = mascota.foto_urls?.[0] || null;

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
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.99 }}
      data-testid="mascota-card"
      className="rounded-3xl overflow-hidden"
      style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>

      {/* Banner */}
      <div className="relative h-44 flex items-center justify-center overflow-hidden cursor-pointer"
           style={{ background: `linear-gradient(135deg,${c1},${c2})` }}
           onClick={() => navigate(`/mascotas/${mascota.id}`)}>
        <span className="absolute text-[8rem] opacity-15 select-none filter blur-sm pointer-events-none">{emoji}</span>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.25) 100%)' }} />
        <div className="relative z-10 h-24 w-24 rounded-2xl overflow-hidden flex items-center justify-center text-4xl"
             style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}>
          {fotoPrincipal ? <img src={fotoPrincipal} alt={mascota.nombre} className="w-full h-full object-cover" /> : emoji}
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
             style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          {emoji} {ESPECIE_LABELS[mascota.especie] || 'Mascota'}
        </div>
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center"
             style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
          <Eye size={14} color="white" />
        </div>
        {mascota.microchip && (
          <div className="absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
               style={{ background: 'rgba(0,196,180,0.85)', color: 'white' }}>
            💉 Chip
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-3.5 pb-4">
        <div className="mb-3">
          <h3 className="font-poppins font-bold text-lg leading-tight" style={{ color: t.text }}>{mascota.nombre}</h3>
          {mascota.raza && <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{mascota.raza}</p>}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {mascota.edad && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: t.primaryBg, color: t.primary, border: `1px solid ${t.primaryBorder}` }}>
              🎂 {mascota.edad} {mascota.edad_unidad || 'años'}
            </span>
          )}
          {mascota.sexo && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}` }}>
              {mascota.sexo === 'macho' ? '♂' : '♀'} {mascota.sexo.charAt(0).toUpperCase() + mascota.sexo.slice(1)}
            </span>
          )}
          {mascota.color && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: t.isDark ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.12)', color: t.warning, border: `1px solid rgba(251,191,36,0.25)` }}>
              🎨 {mascota.color}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/mascotas/${mascota.id}/editar`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: t.primaryBg, color: t.primary, border: `1px solid ${t.primaryBorder}` }}>
            <Pencil size={14} /> Editar
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/mascotas/${mascota.id}/carnet`)}
            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: t.secondaryBg, border: `1px solid ${t.secondaryBorder}` }}>
            <QrCode size={16} style={{ color: t.secondary }} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleCartel} disabled={generandoCartel}
            data-testid="btn-ver-cartel" aria-label={`Descargar cartel PDF de ${mascota.nombre}`}
            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}` }}>
            <Printer size={16} style={{ color: t.accent }} />
          </motion.button>
          {onEliminar && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onEliminar(mascota.id)}
              aria-label={`Eliminar a ${mascota.nombre}`}
              className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: t.dangerBg, border: `1px solid ${t.danger}30` }}>
              <Trash2 size={16} style={{ color: t.danger }} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
