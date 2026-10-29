import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Huella } from './auth/AuthUI';
import { bienvenidaVista } from '../utils/bienvenida';
import { esInvitado } from '../utils/invitado';

// permitirInvitado: pantallas de solo lectura (inicio, mapa, directorio) abiertas en modo invitado
export default function ProtectedRoute({ soloAdmin = false, permitirInvitado = false }) {
  const { estaAutenticado, esAdmin, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-warm-50 dark:bg-dark-800" role="status" aria-label="Cargando">
        <span className="h-16 w-16 rounded-2xl bg-[#E8732F] flex items-center justify-center animate-pulse-soft">
          <Huella className="h-9 w-9 text-white" />
        </span>
      </div>
    );
  }

  // Quien abre la app por primera vez sin sesión ve antes la bienvenida
  if (!estaAutenticado && permitirInvitado && esInvitado()) return <Outlet />;
  if (!estaAutenticado) return <Navigate to={bienvenidaVista() ? '/login' : '/splash'} replace />;
  if (soloAdmin && !esAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
