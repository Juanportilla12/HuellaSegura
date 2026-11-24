import { useState, useCallback, useRef } from 'react';
import { MapPin } from 'lucide-react';
import HojaConfirmacion from '../components/ui/HojaConfirmacion';
import { obtenerUbicacion } from '../utils/ubicacion';

// Antes de pedir la ubicación al navegador, la app le pregunta al usuario con su propia
// ventana y le explica para qué la usa. Si el navegador ya tiene el permiso concedido,
// no se vuelve a preguntar. Uso:
//   const { solicitarUbicacion, dialogoUbicacion } = usePermisoUbicacion();
//   solicitarUbicacion().then(({ lat, lng }) => …).catch((e) => e.code === 'RECHAZADO' …)
//   … y renderizar {dialogoUbicacion} en la pantalla.

export const RECHAZADO = 'RECHAZADO';

export async function permisoYaConcedido() {
  try {
    const estado = await navigator.permissions?.query({ name: 'geolocation' });
    return estado?.state === 'granted';
  } catch {
    return false; // navegadores sin la API de permisos: se pregunta siempre
  }
}

export function usePermisoUbicacion({
  motivo = 'Así marcamos en el mapa el lugar donde estás. Solo se usa para esto.',
} = {}) {
  const [abierto, setAbierto] = useState(false);
  const pendiente = useRef(null);

  const solicitarUbicacion = useCallback(async () => {
    if (!(await permisoYaConcedido())) {
      const acepto = await new Promise((resolve) => {
        pendiente.current = resolve;
        setAbierto(true);
      });
      if (!acepto) {
        const error = new Error('El usuario no dio permiso');
        error.code = RECHAZADO;
        throw error;
      }
    }
    return obtenerUbicacion();
  }, []);

  const responder = useCallback((acepto) => {
    setAbierto(false);
    pendiente.current?.(acepto);
    pendiente.current = null;
  }, []);
  const permitir = useCallback(() => responder(true), [responder]);
  const ahoraNo = useCallback(() => responder(false), [responder]);

  const dialogoUbicacion = (
    <HojaConfirmacion abierta={abierto} titulo="¿Usar tu ubicación?"
      textoConfirmar="Permitir" textoCancelar="Ahora no" onConfirmar={permitir} onCancelar={ahoraNo}
      extra={
        <p className="flex items-start gap-2 text-[13px] leading-snug text-gray-500 dark:text-white/50">
          <MapPin size={16} className="shrink-0 mt-0.5 text-primary-700" aria-hidden="true" />
          Después tu navegador te pedirá confirmar. Si prefieres no compartirla, puedes marcar el punto tocando el mapa.
        </p>
      }>
      HuellaSegura quiere acceder a la ubicación de este dispositivo. {motivo}
    </HojaConfirmacion>
  );

  return { solicitarUbicacion, dialogoUbicacion };
}
