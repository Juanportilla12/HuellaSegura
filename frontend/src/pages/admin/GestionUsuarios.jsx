import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Shield, Search, Users, UserCheck, UserX, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { listarUsuarios, cambiarEstadoUsuario } from '../../services/adminService';

function Toggle({ on, onChange, testId, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      data-testid={testId}
      className="relative h-7 w-12 rounded-full transition-colors duration-300 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: on ? '#34D399' : 'rgba(255,255,255,0.15)' }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

function TabBtn({ active, onClick, children, count, color }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
      style={active
        ? { background: `${color}25`, color, border: `1px solid ${color}50` }
        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
      }
    >
      {children}
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold"
            style={active
              ? { background: color, color: '#0F0F1A' }
              : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
            }>
        {count}
      </span>
    </button>
  );
}

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro,   setFiltro]   = useState('todos');

  useEffect(() => {
    listarUsuarios()
      .then(({ data }) => setUsuarios(data.usuarios || []))
      .catch(() => setError('No se pudieron cargar los usuarios. Intenta de nuevo.'))
      .finally(() => setCargando(false));
  }, []);

  async function handleToggle(u) {
    if (u.rol === 'admin') return;
    try {
      const { data } = await cambiarEstadoUsuario(u.id);
      const nuevo = data?.activo ?? !u.activo;
      setUsuarios(prev => prev.map(x => (x.id === u.id ? { ...x, activo: nuevo } : x)));
      toast(nuevo ? `✅ ${u.nombre} activado` : `🚫 ${u.nombre} desactivado`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cambiar el estado del usuario.');
    }
  }

  const filtrados = useMemo(() => {
    let list = usuarios;
    if (filtro === 'activos')   list = list.filter(u => u.activo);
    if (filtro === 'inactivos') list = list.filter(u => !u.activo);
    if (filtro === 'admin')     list = list.filter(u => u.rol === 'admin');
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  }, [usuarios, filtro, busqueda]);

  const totales   = usuarios.length;
  const activos   = usuarios.filter(u => u.activo).length;
  const inactivos = usuarios.filter(u => !u.activo).length;
  const admins    = usuarios.filter(u => u.rol === 'admin').length;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F1A' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-12 pb-5"
           style={{ background: 'linear-gradient(135deg,#1E1B4B 0%,#1A1A2E 100%)' }}>
        <div className="flex items-center gap-3 mb-5">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/admin')}
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <ChevronLeft size={20} color="white" strokeWidth={2.5} />
          </motion.button>
          <div>
            <h1 className="font-poppins font-bold text-white text-lg">Usuarios</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {cargando ? 'Cargando…' : `${totales} registrados en total`}
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Activos',   value: activos,   color: '#34D399' },
            { label: 'Inactivos', value: inactivos, color: '#F87171' },
            { label: 'Admins',    value: admins,    color: '#818CF8' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-3 text-center"
                 style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}25` }}>
              <p className="font-poppins font-extrabold text-xl" style={{ color }}>{value}</p>
              <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Tabs filtro */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <TabBtn active={filtro === 'todos'}    onClick={() => setFiltro('todos')}    count={totales}   color="#818CF8">
            <Users size={11} /> Todos
          </TabBtn>
          <TabBtn active={filtro === 'activos'}  onClick={() => setFiltro('activos')}  count={activos}   color="#34D399">
            <UserCheck size={11} /> Activos
          </TabBtn>
          <TabBtn active={filtro === 'inactivos'} onClick={() => setFiltro('inactivos')} count={inactivos} color="#F87171">
            <UserX size={11} /> Inactivos
          </TabBtn>
          <TabBtn active={filtro === 'admin'}    onClick={() => setFiltro('admin')}    count={admins}    color="#FBBF24">
            <Crown size={11} /> Admins
          </TabBtn>
        </div>
      </div>

      {/* ── Lista ──────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 flex flex-col gap-3 pb-12">

        {error && (
          <div role="alert" className="rounded-2xl px-4 py-3 text-sm font-medium"
               style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>
            {error}
          </div>
        )}

        {cargando && [1, 2, 3, 4].map(i => (
          <div key={i} data-testid="skeleton-usuario" className="h-20 rounded-2xl animate-pulse"
               style={{ background: 'rgba(255,255,255,0.05)' }} />
        ))}

        <AnimatePresence mode="popLayout">
          {!cargando && filtrados.map((u, i) => (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: u.activo
                  ? '1px solid rgba(52,211,153,0.15)'
                  : '1px solid rgba(255,255,255,0.06)',
                opacity: u.activo ? 1 : 0.6,
              }}
            >
              {/* Avatar */}
              <div className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 text-base"
                   style={{
                     background: u.rol === 'admin'
                       ? 'linear-gradient(135deg,#818CF8,#6366F1)'
                       : u.activo
                         ? 'linear-gradient(135deg,#34D399,#059669)'
                         : 'rgba(255,255,255,0.1)',
                   }}>
                {u.nombre.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-poppins font-semibold text-sm text-white truncate">{u.nombre}</p>
                  {u.rol === 'admin' && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(129,140,248,0.2)', color: '#818CF8', border: '1px solid rgba(129,140,248,0.3)' }}>
                      <Shield size={8} /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{u.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={u.activo
                          ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                          : { background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>
                    {u.activo ? '● Activo' : '● Inactivo'}
                  </span>
                  {u.created_at && (
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      desde {new Date(u.created_at).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <Toggle
                on={u.activo}
                onChange={() => handleToggle(u)}
                disabled={u.rol === 'admin'}
                testId={`btn-toggle-${u.id}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Vacío */}
        {!cargando && filtrados.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 gap-3 text-center"
          >
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl"
                 style={{ background: 'rgba(255,255,255,0.05)' }}>🔍</div>
            <p className="font-poppins font-bold text-white">Sin resultados</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No hay usuarios que coincidan con tu búsqueda.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
