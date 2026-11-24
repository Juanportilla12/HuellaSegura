import { useState, useCallback, useRef } from 'react';
import { MapPin } from 'lucide-react';
import HojaConfirmacion from '../components/ui/HojaConfirmacion';
import { obtenerUbicacion, pasosActivarUbicacion } from '../utils/ubicacion';

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
  // null | 'pregunta' (¿usar tu ubicación?) | 'guia' (cómo activar el permiso bloqueado)
  const [vista, setVista] = useState(null);
  const pendiente = useRef(null);

  const preguntar = useCallback((cual) => new Promise((resolve) => {
    pendiente.current = resolve;
    setVista(cual);
  }), []);

  const solicitarUbicacion = useCallback(async () => {
    const rechazado = () => {
      const error = new Error('El usuario no dio permiso');
      error.code = RECHAZADO;
      return error;
    };
    if (!(await permisoYaConcedido()) && !(await preguntar('pregunta'))) throw rechazado();

    // Si el navegador tiene el permiso bloqueado, se muestra cómo activarlo y se reintenta
    // cuantas veces el usuario quiera, sin salir de la pantalla
    for (;;) {
      try {
        return await obtenerUbicacion();
      } catch (error) {
        if (error.code !== 1) throw error;
        if (!(await preguntar('guia'))) throw rechazado();
      }
    }
  }, [preguntar]);

  const responder = useCallback((acepto) => {
    setVista(null);
    pendiente.current?.(acepto);
    pendiente.current = null;
  }, []);
  const aceptar = useCallback(() => responder(true), [responder]);
  const cancelar = useCallback(() => responder(false), [responder]);

  const { pasos, nota } = pasosActivarUbicacion();

  const dialogoUbicacion = (
    <>
      <HojaConfirmacion abierta={vista === 'pregunta'} titulo="¿Usar tu ubicación?"
        textoConfirmar="Permitir" textoCancelar="Ahora no" onConfirmar={aceptar} onCancelar={cancelar}
        extra={
          <p className="flex items-start gap-2 text-[13px] leading-snug text-gray-500 dark:text-white/50">
            <MapPin size={16} className="shrink-0 mt-0.5 text-primary-700" aria-hidden="true" />
            Después tu navegador te pedirá confirmar. Si prefieres no compartirla, puedes marcar el punto tocando el mapa.
          </p>
        }>
        HuellaSegura quiere acceder a la ubicación de este dispositivo. {motivo}
      </HojaConfirmacion>

      <HojaConfirmacion abierta={vista === 'guia'} titulo="Activa la ubicación"
        textoConfirmar="Ya lo activé, intentar de nuevo" textoCancelar="Ahora no" onConfirmar={aceptar} onCancelar={cancelar}
        extra={
          <>
            <ol className="flex flex-col gap-2.5" data-testid="pasos-ubicacion">
              {pasos.map((paso, i) => (
                <li key={paso} className="flex items-start gap-3 text-[14px] leading-snug text-dark-900 dark:text-white/90">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400
                                   text-[12px] font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                  {paso}
                </li>
              ))}
            </ol>
            {nota && <p className="mt-3 text-[12px] leading-snug text-gray-500 dark:text-white/50">{nota}</p>}
          </>
        }>
        Tu navegador tiene bloqueada la ubicación para esta página. Puedes activarla en segundos sin salir de aquí:
      </HojaConfirmacion>
    </>
  );

  return { solicitarUbicacion, dialogoUbicacion };
}
