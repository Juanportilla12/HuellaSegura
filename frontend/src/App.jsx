import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import ProtectedRoute   from './components/ProtectedRoute';
import PageTransition   from './components/PageTransition';
import LoadingSpinner   from './components/ui/LoadingSpinner';

// RNF-01: carga diferida. La primera visita solo descarga el inicio de sesión y la
// página de inicio; el resto de pantallas (mapa, formularios, admin) se descarga al abrirlas.
import Splash from './pages/Splash';
import Login  from './pages/Login';
import Home   from './pages/Home';

const Register             = lazy(() => import('./pages/Register'));
const PerfilPublico        = lazy(() => import('./pages/PerfilPublico'));
const ReportarAvistamiento = lazy(() => import('./pages/ReportarAvistamiento'));
const OlvideContrasena     = lazy(() => import('./pages/OlvideContrasena'));
const MapaPrincipal        = lazy(() => import('./pages/MapaPrincipal'));
const MisMascotas          = lazy(() => import('./pages/MisMascotas'));
const MascotaForm          = lazy(() => import('./pages/MascotaForm'));
const PerfilMascota        = lazy(() => import('./pages/PerfilMascota'));
const CarnetQR             = lazy(() => import('./pages/CarnetQR'));
const MisReportes          = lazy(() => import('./pages/MisReportes'));
const CrearReporte         = lazy(() => import('./pages/CrearReporte'));
const ConfiguracionPerfil  = lazy(() => import('./pages/ConfiguracionPerfil'));
const Directorio           = lazy(() => import('./pages/Directorio'));
const AlertasPage          = lazy(() => import('./pages/Alertas'));
const Dashboard            = lazy(() => import('./pages/admin/Dashboard'));
const GestionUsuarios      = lazy(() => import('./pages/admin/GestionUsuarios'));
const ModeracionReportes   = lazy(() => import('./pages/admin/ModeracionReportes'));

// Wrapper que aplica AnimatePresence por ruta
function AnimatedRoutes() {
  const location = useLocation();
  // Clave: primer segmento del pathname para no re-animar sub-rutas
  const routeKey = location.pathname.split('/')[1] || 'home';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={routeKey}>
        {/* La carga de cada pantalla diferida se resuelve dentro de su propia transición;
            si el límite de Suspense quedara fuera de AnimatePresence, la animación se bloquea */}
        <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes location={location}>
          {/* ── Públicas ─────────────────────────────────────────── */}
          <Route path="/splash"               element={<Splash />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/register"             element={<Register />} />
          <Route path="/publico/mascotas/:codigo"  element={<PerfilPublico />} />
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
        </Suspense>
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
