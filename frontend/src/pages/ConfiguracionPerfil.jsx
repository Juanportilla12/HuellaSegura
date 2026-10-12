import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PawPrint, Megaphone, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as mascotaService from '../services/mascotaService';
import * as reporteService from '../services/reporteService';
import BottomNav from '../components/ui/BottomNav';
import HojaConfirmacion from '../components/ui/HojaConfirmacion';
import CabeceraPerfil from '../components/perfil/CabeceraPerfil';
import EstadisticasPerfil from '../components/perfil/EstadisticasPerfil';
import AjustesCuenta, { Grupo, IconoFila } from '../components/perfil/AjustesCuenta';
import EliminarCuenta from '../components/perfil/EliminarCuenta';
import { focoVisible } from '../components/auth/AuthUI';

function FilaEnlace({ icon, titulo, detalle, onClick, tono }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-warm-50 dark:hover:bg-white/5 ${focoVisible}`}>
      <IconoFila icon={icon} tono={tono} />
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-dark-900 dark:text-white">{titulo}</span>
        {detalle && <span className="block text-[13px] text-gray-500 dark:text-white/50">{detalle}</span>}
      </span>
      <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
    </button>
  );
}

// Perfil del usuario: datos, actividad, configuración de alertas y derechos sobre sus datos
export default function ConfiguracionPerfil() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [mascotas, setMascotas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  useEffect(() => {
    mascotaService.listarMascotas()
      .then(({ data }) => setMascotas(data.mascotas || []))
      .catch(() => {});
    reporteService.misReportes()
      .then(({ data }) => setReportes(data.reportes || []))
      .catch(() => {});
  }, []);

  const cancelarSalida = useCallback(() => setConfirmarSalida(false), []);
  const activos = reportes.filter((r) => r.estado === 'en_busqueda').length;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  return (
    <div className="min-h-dvh pb-28 bg-warm-50 dark:bg-dark-800">
      <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-4">
        <h1 className="font-poppins font-bold text-[26px] leading-tight text-dark-900 dark:text-white">Perfil</h1>
      </header>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <CabeceraPerfil />
          <EstadisticasPerfil mascotas={mascotas} reportes={reportes} />
        </div>

        <Grupo titulo="Mi actividad">
          <FilaEnlace icon={PawPrint} titulo="Mis mascotas" onClick={() => navigate('/mascotas')}
            detalle={mascotas.length ? plural(mascotas.length, 'mascota registrada', 'mascotas registradas') : 'Registra a tu primera mascota'} />
          <FilaEnlace icon={Megaphone} titulo="Mis reportes" onClick={() => navigate('/reportes')}
            detalle={activos ? plural(activos, 'búsqueda activa', 'búsquedas activas') : 'Pérdidas reportadas y encontradas'} />
        </Grupo>

        <AjustesCuenta />

        <Grupo titulo="Cuenta">
          {usuario?.rol === 'admin' && (
            <FilaEnlace icon={LayoutDashboard} tono="neutro" titulo="Panel de administración"
              detalle="Moderación, usuarios y estadísticas" onClick={() => navigate('/admin')} />
          )}
          <button type="button" onClick={() => setConfirmarSalida(true)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-warm-50 dark:hover:bg-white/5 ${focoVisible}`}>
            <IconoFila icon={LogOut} tono="neutro" />
            <span className="flex-1 text-[15px] font-semibold text-dark-900 dark:text-white">Cerrar sesión</span>
          </button>
        </Grupo>

        <div className="flex flex-col items-center gap-1">
          <EliminarCuenta />
          <p className="text-[12px] text-gray-400 dark:text-white/30">HuellaSegura · Pasto, Nariño</p>
        </div>
      </div>

      <HojaConfirmacion abierta={confirmarSalida} titulo="¿Cerrar sesión?" textoConfirmar="Cerrar sesión"
        onConfirmar={() => logout?.()} onCancelar={cancelarSalida}>
        Para volver a entrar necesitarás tu correo y contraseña.
      </HojaConfirmacion>

      <BottomNav />
    </div>
  );
}
