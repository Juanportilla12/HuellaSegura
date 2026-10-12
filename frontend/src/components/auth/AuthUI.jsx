import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import fotoMascotas from '../../assets/login-mascotas.webp';
import { HUELLA_DEDOS, HUELLA_ALMOHADILLA } from '../ui/huella';

// Piezas visuales compartidas por las pantallas de acceso (login, recuperación, registro).
// Diseñadas para caber en la pantalla visible (dvh) sin scroll; si el usuario amplía el
// texto o hace zoom, la página puede desplazarse en lugar de recortar el contenido.

// Foco visible con teclado para botones y enlaces
export const focoVisible = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30';

// Huella del logo de la marca
export function Huella({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="currentColor">
      {HUELLA_DEDOS.map((d) => (
        <ellipse key={d.cx} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} transform={`rotate(${d.rot} ${d.cx} ${d.cy})`} />
      ))}
      <path d={HUELLA_ALMOHADILLA} />
    </svg>
  );
}

export function PantallaAuth({ children }) {
  return <div className="min-h-dvh flex flex-col bg-white dark:bg-dark-800">{children}</div>;
}

// Cabecera con foto de mascotas; `children` (opcional) se centra en el espacio libre de la foto.
// Sin `foto` usa la foto de la marca sobre naranja; con `foto` la muestra a pantalla completa (`posicion` ajusta el encuadre).
// `compacta` deja que la foto ceda más alto en formularios largos (p. ej. cuando aparecen errores)
export function CabeceraFoto({ children, onVolver, compacta = false, foto, posicion = '50% 50%' }) {
  const alto = compacta ? 'min-h-[96px]' : 'min-h-[150px] [@media(max-height:700px)]:min-h-[132px]';
  const animacion = { initial: { scale: 1.06 }, animate: { scale: 1 }, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } };

  if (foto) {
    return (
      <header className={`relative flex-1 overflow-hidden bg-warm-100 pt-[env(safe-area-inset-top)] ${alto}`}>
        <motion.img src={foto} alt="" aria-hidden="true" fetchpriority="high" decoding="async" {...animacion}
          className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: posicion }} />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
        {onVolver && <BotonVolverFoto onVolver={onVolver} />}
      </header>
    );
  }

  return (
    // El fondo naranja es el mismo de la foto: en pantallas altas la imagen se ancla abajo y el
    // naranja continúa hacia arriba; en pantallas bajas se recorta sin perder las caras
    <header className={`relative flex-1 overflow-hidden bg-[#E8732F] pt-[env(safe-area-inset-top)] ${alto}`}>
      <div className="absolute inset-x-0 bottom-0"
           style={{ height: 'min(100%, calc(min(100vw, 430px) * 533 / 800))' }}>
        <motion.img
          src={fotoMascotas} alt="" aria-hidden="true" fetchpriority="high" decoding="async" {...animacion}
          className="h-full w-full object-cover object-[50%_40%]"
        />

        {/* El centrado va en un contenedor aparte: la animación reemplaza el transform del elemento animado.
            Se descuenta la franja inferior que cubre la hoja */}
        {children && (
        <div className="absolute left-1/2 top-[calc(50%-14px)] -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.15 }}
            className="flex flex-col items-center text-center">
            {children}
          </motion.div>
        </div>
        )}
      </div>

      {onVolver && <BotonVolverFoto onVolver={onVolver} />}
    </header>
  );
}

function BotonVolverFoto({ onVolver }) {
  return (
    <button type="button" onClick={onVolver} aria-label="Volver"
            className={`absolute left-4 top-[max(env(safe-area-inset-top),0.875rem)] h-10 w-10 rounded-full
                        bg-white/95 text-dark-900 flex items-center justify-center
                        shadow-[0_4px_14px_rgba(122,43,28,0.25)] active:scale-95 transition-transform ${focoVisible}`}>
      <ChevronLeft size={22} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

// Cuadro blanco con ícono, usado como emblema en el centro de la cabecera
export function EmblemaCabecera({ children }) {
  return (
    <div className="h-14 w-14 [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:w-11
                    rounded-2xl bg-white flex items-center justify-center text-primary-700
                    shadow-[0_10px_28px_rgba(122,43,28,0.35)]">
      {children}
    </div>
  );
}

export function TituloCabecera({ children }) {
  return (
    <p className="mt-2 font-poppins font-bold text-xl [@media(max-height:700px)]:text-lg leading-none
                  tracking-tight text-white whitespace-nowrap [text-shadow:0_2px_10px_rgba(122,43,28,0.45)]">
      {children}
    </p>
  );
}

// Hoja blanca que se superpone a la cabecera
export function HojaAuth({ children }) {
  return (
    <motion.main
      initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
      className="relative -mt-7 rounded-t-[28px] bg-white dark:bg-dark-800 px-6 pt-7 [@media(max-height:640px)]:pt-5
                 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_-8px_30px_rgba(26,26,46,0.08)]">
      {children}
    </motion.main>
  );
}

export function EncabezadoHoja({ titulo, children }) {
  return (
    <div className="mb-5 [@media(max-height:640px)]:mb-4">
      <h1 className="font-poppins font-bold text-[22px] leading-tight text-dark-900 dark:text-white">
        {titulo}
      </h1>
      {children && (
        <p className="text-sm mt-1 text-gray-500 dark:text-white/50 [@media(max-height:640px)]:hidden">{children}</p>
      )}
    </div>
  );
}

// Campo con ícono, etiqueta visible y estados de foco/error
export function CampoAuth({ id, label, icon: Icon, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-dark-700 dark:text-white/70">
        {label}
      </label>
      <div className="relative group">
        <Icon size={18} aria-hidden="true"
              className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                          ${error ? 'text-danger' : 'text-gray-500 group-focus-within:text-primary-700 dark:text-white/35'}`} />
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

export const inputAuth = (error) =>
  'w-full h-[52px] [@media(max-height:640px)]:h-12 pl-11 rounded-2xl text-[15px] outline-none transition-all border-[1.5px] ' +
  'text-dark-900 placeholder:text-gray-500 dark:text-white dark:placeholder:text-white/30 ' +
  'focus:bg-white focus:ring-4 dark:focus:bg-white/10 ' +
  (error
    ? 'bg-red-50 border-danger/60 focus:border-danger focus:ring-danger/15 dark:bg-red-500/10'
    : 'bg-[#F6F2F0] border-[#E3DCD8] focus:border-primary focus:ring-primary/15 dark:bg-white/5');

// Botón para mostrar u ocultar la contraseña dentro de un CampoAuth
export function BotonVerClave({ visible, onClick }) {
  return (
    <button type="button" onClick={onClick}
            aria-label={visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} aria-pressed={visible}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center
                        rounded-xl text-gray-500 hover:text-dark-700 dark:text-white/40 dark:hover:text-white/80 ${focoVisible}`}>
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  );
}

export function AlertaError({ mensaje }) {
  return (
    <AnimatePresence>
      {mensaje && (
        <motion.div role="alert"
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium
                     bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
          {mensaje}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BotonPrimario({ loading, textoCargando, children, className = '', ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      {...props}
      disabled={loading || props.disabled}
      className={`group w-full h-[52px] [@media(max-height:640px)]:h-12 rounded-2xl font-poppins font-semibold text-[15px] text-white
                  bg-primary-700 hover:bg-primary-800 disabled:opacity-60 transition-colors
                  shadow-[0_8px_20px_rgba(204,74,52,0.35)] disabled:shadow-none
                  flex items-center justify-center gap-2 ${focoVisible} ${className}`}
    >
      {loading ? (
        <>
          <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
          <span className="sr-only">{textoCargando}</span>
        </>
      ) : children}
    </motion.button>
  );
}

// Barra de progreso para formularios por pasos; `soloBarra` oculta el texto para ganar espacio
export function Progreso({ paso, total, soloBarra = false }) {
  return (
    <div className="mb-4 [@media(max-height:640px)]:mb-3">
      <p className={`text-xs font-semibold text-primary-700 dark:text-primary-400 mb-2 ${soloBarra ? 'sr-only' : ''}`}>
        Paso {paso + 1} de {total}
      </p>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
            <motion.span className="block h-full bg-primary-700 rounded-full origin-left"
                         initial={false} animate={{ scaleX: i <= paso ? 1 : 0 }}
                         transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }} />
          </span>
        ))}
      </div>
    </div>
  );
}

export function Requisito({ cumple, children }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs font-medium transition-colors
                    ${cumple ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-white/40'}`}>
      <span className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors
                        ${cumple ? 'bg-emerald-600 text-white' : 'border-[1.5px] border-gray-300 dark:border-white/20'}`}>
        {cumple && <Check size={10} strokeWidth={3.5} aria-hidden="true" />}
      </span>
      {children}
      <span className="sr-only">{cumple ? '(cumplido)' : '(pendiente)'}</span>
    </li>
  );
}

