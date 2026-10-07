import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../hooks/useTokens';
import * as mascotaService from '../services/mascotaService';
import * as reporteService from '../services/reporteService';
import BottomNav from '../components/ui/BottomNav';
import CabeceraPerfil from '../components/perfil/CabeceraPerfil';
import EstadisticasPerfil from '../components/perfil/EstadisticasPerfil';
import CarruselMascotas from '../components/perfil/CarruselMascotas';
import AjustesCuenta from '../components/perfil/AjustesCuenta';
import EliminarCuenta from '../components/perfil/EliminarCuenta';

// Perfil del usuario: datos, mascotas, configuración de alertas y derechos sobre sus datos
export default function ConfiguracionPerfil() {
  const t = useTokens();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [mascotas, setMascotas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [cargandoMascotas, setCargandoMascotas] = useState(true);

  useEffect(() => {
    mascotaService.listarMascotas()
      .then(({ data }) => setMascotas(data.mascotas || []))
      .catch(() => {})
      .finally(() => setCargandoMascotas(false));
    reporteService.misReportes()
      .then(({ data }) => setReportes(data.reportes || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pb-24 transition-colors" style={{ background: t.bg }}>
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-2">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)} aria-label="Volver"
          className="h-9 w-9 rounded-2xl flex items-center justify-center" style={{ background: t.primaryBg }}>
          <ChevronLeft size={20} style={{ color: t.primary }} strokeWidth={2.5} />
        </motion.button>
        <h1 className="font-poppins font-bold text-lg" style={{ color: t.text }}>Mi perfil</h1>
      </header>

      <CabeceraPerfil />
      <EstadisticasPerfil mascotas={mascotas} reportes={reportes} />
      <CarruselMascotas mascotas={mascotas} cargando={cargandoMascotas} />
      <AjustesCuenta />

      {usuario?.rol === 'admin' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/admin')}
          className="mx-4 w-[calc(100%-2rem)] py-4 rounded-3xl text-sm font-semibold flex items-center justify-center gap-2 mb-3 text-white"
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
          <LayoutDashboard size={16} /> Panel de administrador
        </motion.button>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => logout?.()}
        className="mx-4 w-[calc(100%-2rem)] py-4 rounded-3xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: t.dangerBg, color: '#EF4444' }}>
        <LogOut size={16} /> Cerrar sesión
      </motion.button>

      <EliminarCuenta />
      <BottomNav />
    </div>
  );
}
