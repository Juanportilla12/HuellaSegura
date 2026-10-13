import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, UserPlus, Bell } from 'lucide-react';
import fotoPasto from '../assets/mascotas-pasto.webp';
import fotoGatosPitbull from '../assets/gatos-pitbull.webp';
import fotoPerros from '../assets/home-perros.webp';
import MapaEstatico from '../components/mapa/MapaEstatico';
import { Huella, focoVisible } from '../components/auth/AuthUI';
import { marcarBienvenidaVista } from '../utils/bienvenida';

// Ilustración del segundo paso: mapa de Pasto con un aviso de mascota perdida encima
function VisualMapa() {
  return (
    <div className="relative h-full w-full bg-warm-100">
      <div className="absolute inset-0 flex items-center">
        <MapaEstatico lat={1.2136} lng={-77.2811} zoom={15} alto={720} ancho={460} className="w-full" />
      </div>
      <div className="absolute left-1/2 top-[22%] -translate-x-1/2 w-[78%] max-w-[300px] rounded-2xl bg-white p-3
                      shadow-[0_12px_30px_rgba(26,26,46,0.18)] flex items-center gap-3">
        <img src={fotoPasto} alt="" className="h-12 w-12 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-primary-700 flex items-center gap-1"><Bell size={12} aria-hidden="true" /> Alerta cerca de ti</p>
          <p className="text-[14px] font-semibold text-dark-900 truncate">Se busca a Max · a 600 m</p>
        </div>
      </div>
    </div>
  );
}

const PASOS = [
  {
    titulo: 'Reencuentra a tu mejor amigo',
    texto: 'HuellaSegura reúne a los vecinos de Pasto para encontrar a las mascotas perdidas.',
    visual: () => <img src={fotoPerros} alt="" className="h-full w-full object-cover object-[50%_35%]" />,
  },
  {
    titulo: 'Reporta y recibe alertas',
    texto: 'Publica dónde se perdió tu mascota y avisamos al instante a los vecinos que están cerca.',
    visual: VisualMapa,
  },
  {
    titulo: 'Protégela con su carnet QR',
    texto: 'Si alguien la encuentra, solo escanea el código del collar para ver cómo contactarte.',
    visual: () => <img src={fotoGatosPitbull} alt="" className="h-full w-full object-cover object-[50%_30%] bg-white" />,
  },
];

const deslizar = {
  entra: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  centro: { x: 0, opacity: 1 },
  sale:  (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

export default function Splash() {
  const navigate = useNavigate();
  const [actual, setActual] = useState(0);
  const [dir, setDir] = useState(1);
  const ultimo = actual === PASOS.length - 1;
  const paso = PASOS[actual];
  const Visual = paso.visual;

  function ir(idx) {
    if (idx < 0 || idx >= PASOS.length) return;
    setDir(idx > actual ? 1 : -1);
    setActual(idx);
  }

  function salir(ruta) {
    marcarBienvenidaVista();
    navigate(ruta, { replace: true });
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-white dark:bg-dark-800">

      {/* ── Imagen del paso (se puede deslizar) ─────────────────── */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div key={actual} custom={dir} variants={deslizar} initial="entra" animate="centro" exit="sale"
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
            onDragEnd={(_, { offset }) => { if (offset.x < -60) ir(actual + 1); else if (offset.x > 60) ir(actual - 1); }}
            className="absolute inset-0" aria-hidden="true">
            <Visual />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 top-0 px-5 pt-[max(env(safe-area-inset-top),1rem)] flex items-center justify-between">
          <span className="h-10 pl-1.5 pr-3.5 rounded-full bg-white/95 flex items-center gap-2 shadow-[0_4px_14px_rgba(26,26,46,0.15)]">
            <span className="h-7 w-7 rounded-full bg-[#E8732F] flex items-center justify-center">
              <Huella className="h-4 w-4 text-white" />
            </span>
            <span className="font-poppins font-bold text-[14px] text-dark-900">HuellaSegura</span>
          </span>
          {!ultimo && (
            <button type="button" onClick={() => salir('/login')}
              className={`h-10 px-4 rounded-full bg-white/95 text-[14px] font-semibold text-dark-700 shadow-[0_4px_14px_rgba(26,26,46,0.15)] ${focoVisible}`}>
              Omitir
            </button>
          )}
        </div>
      </div>

      {/* ── Texto y acciones ────────────────────────────────────── */}
      <main className="relative -mt-7 rounded-t-[28px] bg-white dark:bg-dark-800 px-6 pt-6
                       pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[0_-8px_30px_rgba(26,26,46,0.08)]">
        <div className="flex gap-1.5 mb-5" role="tablist" aria-label="Pasos de la bienvenida">
          {PASOS.map((p, i) => (
            <button key={p.titulo} type="button" role="tab" aria-selected={i === actual} aria-label={`Paso ${i + 1}: ${p.titulo}`}
              onClick={() => ir(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === actual ? 'w-8 bg-primary-700' : 'w-1.5 bg-gray-300 dark:bg-white/20'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={actual} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }} className="min-h-[112px]">
            <h1 className="font-poppins font-bold text-[26px] leading-tight text-dark-900 dark:text-white">{paso.titulo}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-white/60">{paso.texto}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-col gap-2">
          {ultimo ? (
            <button type="button" onClick={() => salir('/register')}
              className={`h-[52px] rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold text-[15px] text-white
                          bg-primary-700 hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
              <UserPlus size={18} aria-hidden="true" /> Crear mi cuenta
            </button>
          ) : (
            <button type="button" onClick={() => ir(actual + 1)}
              className={`h-[52px] rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold text-[15px] text-white
                          bg-primary-700 hover:bg-primary-800 shadow-[0_8px_20px_rgba(204,74,52,0.35)] ${focoVisible}`}>
              Siguiente <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => salir('/login')}
            className={`h-12 rounded-2xl text-[15px] font-semibold text-dark-700 dark:text-white/80 hover:bg-black/5 ${focoVisible}`}>
            Ya tengo cuenta
          </button>
        </div>
      </main>
    </div>
  );
}
