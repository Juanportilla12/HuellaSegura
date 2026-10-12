import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { listarUsuarios, cambiarEstadoUsuario } from '../../services/adminService';
import EncabezadoPagina from '../../components/ui/EncabezadoPagina';
import Interruptor from '../../components/ui/Interruptor';
import { BuscadorAdmin, FiltrosAdmin, VacioAdmin } from '../../components/admin/ListaAdmin';
import { focoVisible } from '../../components/auth/AuthUI';

function FilaUsuario({ u, onCambiar }) {
  const esAdmin = u.rol === 'admin';
  const iniciales = u.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-poppins font-semibold text-[15px]
                        ${u.activo ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-white/40'}`}>
        {iniciales}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-[15px] font-semibold truncate ${u.activo ? 'text-dark-900 dark:text-white' : 'text-gray-500 dark:text-white/50'}`}>
            {u.nombre}
          </p>
          {esAdmin && (
            <span className="shrink-0 h-5 px-1.5 rounded-full flex items-center gap-0.5 text-[11px] font-bold
                             bg-dark-900 text-white dark:bg-white dark:text-dark-900">
              <ShieldCheck size={11} aria-hidden="true" /> Admin
            </span>
          )}
        </div>
        <p className="text-[13px] truncate text-gray-500 dark:text-white/50">{u.email}</p>
        <p className="text-[12px] text-gray-400 dark:text-white/40">
          {u.activo ? 'Activo' : 'Desactivado'}
          {u.created_at && ` · desde ${new Date(u.created_at).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}`}
        </p>
      </div>
      <Interruptor activo={u.activo} deshabilitado={esAdmin} onCambio={() => onCambiar(u)}
        etiqueta={esAdmin ? `${u.nombre} es administrador` : `${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre}`}
        data-testid={`btn-toggle-${u.id}`} />
    </li>
  );
}

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro,   setFiltro]   = useState('todos');

  const cargar = useCallback(() => {
    setCargando(true);
    setError('');
    listarUsuarios()
      .then(({ data }) => setUsuarios(data.usuarios || []))
      .catch(() => setError('No se pudieron cargar los usuarios. Intenta de nuevo.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleToggle(u) {
    if (u.rol === 'admin') return;
    try {
      const { data } = await cambiarEstadoUsuario(u.id);
      const nuevo = data?.activo ?? !u.activo;
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: nuevo } : x)));
      toast(nuevo ? `${u.nombre} fue activado.` : `${u.nombre} fue desactivado: ya no puede iniciar sesión.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cambiar el estado del usuario.');
    }
  }

  const conteo = {
    todos: usuarios.length,
    activos: usuarios.filter((u) => u.activo).length,
    inactivos: usuarios.filter((u) => !u.activo).length,
    admin: usuarios.filter((u) => u.rol === 'admin').length,
  };

  const filtrados = useMemo(() => {
    let lista = usuarios;
    if (filtro === 'activos')   lista = lista.filter((u) => u.activo);
    if (filtro === 'inactivos') lista = lista.filter((u) => !u.activo);
    if (filtro === 'admin')     lista = lista.filter((u) => u.rol === 'admin');
    const q = busqueda.trim().toLowerCase();
    if (q) lista = lista.filter((u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    return lista;
  }, [usuarios, filtro, busqueda]);

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-10">
      <EncabezadoPagina titulo="Usuarios" onVolver={() => navigate('/admin')}
        subtitulo={cargando ? 'Cargando…' : `${usuarios.length} registrados en total`} />

      <div className="px-4 pt-4 flex flex-col gap-3">
        <BuscadorAdmin valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por nombre o correo" />
        <FiltrosAdmin activo={filtro} onCambio={setFiltro} opciones={[
          { id: 'todos', label: 'Todos', cuenta: conteo.todos },
          { id: 'activos', label: 'Activos', cuenta: conteo.activos },
          { id: 'inactivos', label: 'Desactivados', cuenta: conteo.inactivos },
          { id: 'admin', label: 'Administradores', cuenta: conteo.admin },
        ]} />
      </div>

      <div className="px-4 pt-4">
        {error && (
          <div className="rounded-3xl p-4 flex items-center gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <p role="alert" className="flex-1 text-[14px] text-red-700 dark:text-red-300">{error}</p>
            <button type="button" onClick={cargar}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-primary-700 bg-primary-50 ${focoVisible}`}>
              <RotateCw size={15} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {cargando && (
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} data-testid="skeleton-usuario" className="flex items-center gap-3 px-4 py-3.5" aria-hidden="true">
                <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-4 w-32 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
                  <div className="h-3 w-44 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!cargando && !error && filtrados.length > 0 && (
          <ul className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10
                         divide-y divide-warm-border dark:divide-white/10">
            {filtrados.map((u) => <FilaUsuario key={u.id} u={u} onCambiar={handleToggle} />)}
          </ul>
        )}

        {!cargando && !error && filtrados.length === 0 && (
          <VacioAdmin titulo="Sin resultados">No hay usuarios que coincidan con tu búsqueda.</VacioAdmin>
        )}
      </div>
    </div>
  );
}
