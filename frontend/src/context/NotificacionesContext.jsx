import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useSSE } from '../hooks/useSSE';
import { listarNotificaciones } from '../services/notificacionService';
import { actualizarUbicacion } from '../services/usuarioService';

const NotificacionesContext = createContext({ noLeidas: 0, refrescar: () => {} });

/**
 * Estado global de notificaciones (R8/R9, HU-17/HU-18):
 * - contador de no leídas para la barra de navegación
 * - eventos en tiempo real (SSE) con aviso emergente
 * - si el usuario activó las alertas, actualiza su última ubicación conocida al abrir la app
 */
export function NotificacionesProvider({ children }) {
  const { estaAutenticado, usuario } = useAuth();
  const [noLeidas, setNoLeidas] = useState(0);

  const refrescar = useCallback(() => {
    if (!estaAutenticado) return;
    listarNotificaciones()
      .then(({ data }) => setNoLeidas(data.no_leidas || 0))
      .catch(() => {});
  }, [estaAutenticado]);

  useEffect(() => {
    if (estaAutenticado) refrescar();
    else setNoLeidas(0);
  }, [estaAutenticado, refrescar]);

  useEffect(() => {
    if (!usuario?.alertas_activas || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => actualizarUbicacion(coords.latitude, coords.longitude).catch(() => {}),
      () => {},
      { timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [usuario?.id, usuario?.alertas_activas]);

  useSSE(useCallback((tipo, datos) => {
    if (datos?.mensaje) toast(datos.mensaje, { icon: tipo === 'avistamiento' ? '👀' : '🐾' });
    refrescar();
  }, [refrescar]));

  return (
    <NotificacionesContext.Provider value={{ noLeidas, refrescar }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  return useContext(NotificacionesContext);
}
