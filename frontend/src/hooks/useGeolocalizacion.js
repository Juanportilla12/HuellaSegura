import { useState, useCallback } from 'react';
import { mensajeErrorUbicacion } from '../utils/ubicacion';
import { usePermisoUbicacion, RECHAZADO } from './usePermisoUbicacion';

// Ubicación del usuario para centrar el mapa. Antes de pedirla se le pregunta al usuario
// (ver usePermisoUbicacion): quien use el hook debe renderizar `dialogoUbicacion`.
export function useGeolocalizacion() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { solicitarUbicacion, dialogoUbicacion } = usePermisoUbicacion({
    motivo: 'Así centramos el mapa donde estás y ves las mascotas perdidas cerca.',
  });

  const obtenerUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    setCargando(true);
    setError(null);
    solicitarUbicacion()
      .then(setCoords)
      .catch((err) => { if (err.code !== RECHAZADO) setError(mensajeErrorUbicacion(err, { conMapa: false })); })
      .finally(() => setCargando(false));
  }, [solicitarUbicacion]);

  return { coords, error, cargando, obtenerUbicacion, dialogoUbicacion };
}
