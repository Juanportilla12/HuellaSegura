import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import ProtectedRoute   from './components/ProtectedRoute';
import PageTransition   from './components/PageTransition';
import LoadingSpinner   from './components/ui/LoadingSpinner';

// Páginas públicas
import Splash               from './pages/Splash';
import Login                from './pages/Login';
import Register             from './pages/Register';
import PerfilPublico        from './pages/PerfilPublico';
import ReportarAvistamiento from './pages/ReportarAvistamiento';
import OlvideContrasena     from './pages/OlvideContrasena';

// Páginas protegidas
import Home                from './pages/Home';
import MapaPrincipal       from './pages/MapaPrincipal';
import MisMascotas         from './pages/MisMascotas';
import MascotaForm         from './pages/MascotaForm';
import PerfilMascota       from './pages/PerfilMascota';
import CarnetQR            from './pages/CarnetQR';
import MisReportes         from './pages/MisReportes';
import CrearReporte        from './pages/CrearReporte';
import ConfiguracionPerfil from './pages/ConfiguracionPerfil';
import Directorio          from './pages/Directorio';

// Lazy
const AlertasPage        = lazy(() => import('./pages/Alertas'));
const Dashboard          = lazy(() => import('./pages/admin/Dashboard'));
const GestionUsuarios    = lazy(() => import('./pages/admin/GestionUsuarios'));
const ModeracionReportes = lazy(() => import('./pages/admin/ModeracionReportes'));

// Wrapper que aplica AnimatePresence por ruta
function AnimatedRoutes() {
  const location = useLocation();
  // Clave: primer segmento del pathname para no re-animar sub-rutas
  const routeKey = location.pathname.split('/')[1] || 'home';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={routeKey}>
        <Routes location={location}>
          {/* ── Públicas ─────────────────────────────────────────── */}
          <Route path="/splash"               element={<Splash />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/register"             element={<Register />} />
          <Route path="/publico/mascotas/:id"  element={<PerfilPublico />} />
          <Route path="/avistamientos/nuevo"  element={<ReportarAvistamiento />} />
          <Route path="/olvide-contrasena"    element={<OlvideContrasena />} />

          {/* ── Protegidas — usuarios ────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/"                    element={<Home />} />
            <Route path="/mapa"                element={<MapaPrincipal />} />
            <Route path="/alertas"             element={<AlertasPage />} />

            <Route path="/mascotas"            element={<MisMascotas />} />
            <Route path="/mascotas/nueva"      element={<MascotaForm />} />
            <Route path="/mascotas/:id"        element={<PerfilMascota />} />
            <Route path="/mascotas/:id/editar" element={<MascotaForm />} />
            <Route path="/mascotas/:id/carnet" element={<CarnetQR />} />

            <Route path="/reportes"            element={<MisReportes />} />
            <Route path="/reportes/nuevo"      element={<CrearReporte />} />

            <Route path="/perfil"              element={<ConfiguracionPerfil />} />
            <Route path="/directorio"          element={<Directorio />} />
          </Route>

          {/* ── Protegidas — admin ───────────────────────────────── */}
          <Route element={<ProtectedRoute soloAdmin />}>
            <Route path="/admin"              element={<Dashboard />} />
            <Route path="/admin/usuarios"     element={<GestionUsuarios />} />
            <Route path="/admin/reportes"     element={<ModeracionReportes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificacionesProvider>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <AnimatedRoutes />
          </Suspense>
        </NotificacionesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
