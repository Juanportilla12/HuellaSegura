import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Eye, MapPin } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useSSE } from '../hooks/useSSE';
import { listarNotificaciones } from '../services/notificacionService';
import { actualizarUbicacion } from '../services/usuarioService';
import { obtenerUbicacion } from '../utils/ubicacion';
import { permisoYaConcedido } from '../hooks/usePermisoUbicacion';

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
    // Actualiza la ubicación en segundo plano solo si el navegador ya tiene el permiso:
    // nunca aparece una solicitud de ubicación sin que el usuario la haya pedido
    if (!usuario?.alertas_activas) return;
    permisoYaConcedido()
      .then((concedido) => (concedido ? obtenerUbicacion() : null))
      .then((pos) => pos && actualizarUbicacion(pos.lat, pos.lng))
      .catch(() => {});
  }, [usuario?.id, usuario?.alertas_activas]);

  useSSE(useCallback((tipo, datos) => {
    if (datos?.mensaje) {
      toast(datos.mensaje, {
        icon: tipo === 'avistamiento'
          ? <Eye size={18} className="text-emerald-600" aria-hidden="true" />
          : <MapPin size={18} className="text-primary-700" aria-hidden="true" />,
      });
    }
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
