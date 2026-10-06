import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, MapPin, Phone, Navigation, Clock, Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTokens } from '../hooks/useTokens';
import { useAuth } from '../context/AuthContext';
import * as entidadService from '../services/entidadService';
import BottomNav from '../components/ui/BottomNav';

// HU-27: directorio de veterinarias, albergues y centros de bienestar animal.
// Cualquier usuario lo consulta; el administrador puede agregar, editar y eliminar.

const TIPOS = {
  veterinaria: { label: 'Veterinaria', emoji: '🏥', gradient: 'linear-gradient(135deg,#00C4B4,#00A890)' },
  albergue:    { label: 'Albergue',    emoji: '🏠', gradient: 'linear-gradient(135deg,#FF9280,#F97B62)' },
  otro:        { label: 'Otro',        emoji: '❤️', gradient: 'linear-gradient(135deg,#C7B2F5,#9B87E8)' },
};

const FILTROS = [
  { id: 'todos',       label: 'Todos'        },
  { id: 'veterinaria', label: 'Veterinarias' },
  { id: 'albergue',    label: 'Albergues'    },
  { id: 'otro',        label: 'Otros'        },
];

const FORM_VACIO = {
  nombre: '', tipo: 'veterinaria', direccion: '', telefono: '', horario: '',
  latitud: '', longitud: '', descripcion: '',
};

function enlaceMapa(e) {
  if (e.latitud && e.longitud) {
    return `https://www.openstreetmap.org/?mlat=${e.latitud}&mlon=${e.longitud}#map=17/${e.latitud}/${e.longitud}`;
  }
  if (e.direccion) {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${e.direccion}, Pasto`)}`;
  }
  return null;
}

function FormularioEntidad({ inicial, onCancelar, onGuardado, t }) {
  const [form, setForm]         = useState(inicial ? { ...FORM_VACIO, ...inicial } : FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState('');

  const cambiar = (campo) => (ev) => setForm((p) => ({ ...p, [campo]: ev.target.value }));

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setGuardando(true);
    setError('');
    const datos = {
      nombre: form.nombre.trim(), tipo: form.tipo, direccion: form.direccion, telefono: form.telefono,
      horario: form.horario, latitud: form.latitud, longitud: form.longitud, descripcion: form.descripcion,
    };
    try {
      const { data } = inicial?.id
        ? await entidadService.actualizarEntidad(inicial.id, datos)
        : await entidadService.crearEntidad(datos);
      toast.success(inicial?.id ? 'Entidad actualizada.' : 'Entidad agregada al directorio.');
      onGuardado(data.entidad);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  }

  const campo = (id, label, props = {}) => (
    <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: t.textMuted }}>
      {label}
      <input id={id} value={form[id] ?? ''} onChange={cambiar(id)} {...props}
        className="rounded-xl px-3 py-2 text-sm outline-none"
        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
    </label>
  );

  return (
    <motion.form onSubmit={handleSubmit} data-testid="form-entidad"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className="mx-4 mt-4 rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
      <div className="flex items-center justify-between">
        <h2 className="font-poppins font-bold" style={{ color: t.text }}>
          {inicial?.id ? 'Editar entidad' : 'Nueva entidad aliada'}
        </h2>
        <button type="button" onClick={onCancelar} aria-label="Cerrar formulario">
          <X size={18} style={{ color: t.textMuted }} />
        </button>
      </div>
      {error && <p role="alert" className="text-xs" style={{ color: '#E8614A' }}>{error}</p>}
      {campo('nombre', 'Nombre *', { required: true, maxLength: 150 })}
      <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: t.textMuted }}>
        Tipo
        <select value={form.tipo} onChange={cambiar('tipo')}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          {Object.entries(TIPOS).map(([id, cfg]) => <option key={id} value={id}>{cfg.label}</option>)}
        </select>
      </label>
      {campo('direccion', 'Dirección', { maxLength: 255 })}
      {campo('telefono', 'Teléfono', { type: 'tel', maxLength: 20 })}
      {campo('horario', 'Horario de atención', { placeholder: 'Lun–Sáb 8:00–18:00', maxLength: 150 })}
      <div className="grid grid-cols-2 gap-2">
        {campo('latitud', 'Latitud', { type: 'number', step: 'any', placeholder: '1.2136' })}
        {campo('longitud', 'Longitud', { type: 'number', step: 'any', placeholder: '-77.2811' })}
      </div>
      <p className="text-[11px]" style={{ color: t.textMuted }}>
        Con latitud y longitud la entidad aparece en el mapa con un ícono de corazón.
      </p>
      <button type="submit" disabled={guardando}
        className="py-3 rounded-2xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#00C4B4,#00A890)', opacity: guardando ? 0.7 : 1 }}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </motion.form>
  );
}

export default function Directorio() {
  const navigate = useNavigate();
  const t        = useTokens();
  const { esAdmin } = useAuth();
  const [entidades, setEntidades] = useState([]);
  const [filtro,    setFiltro]    = useState('todos');
  const [busqueda,  setBusqueda]  = useState('');
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [editando,  setEditando]  = useState(null); // null | {} (nueva) | entidad

  useEffect(() => {
    entidadService.listarEntidades()
      .then(({ data }) => setEntidades(data.entidades || []))
      .catch(() => setError('No se pudo cargar el directorio.'))
      .finally(() => setCargando(false));
  }, []);

  const filtradas = entidades.filter((e) => {
    if (filtro !== 'todos' && e.tipo !== filtro) return false;
    if (busqueda && !e.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  function handleGuardado(entidad) {
    setEntidades((prev) => {
      const existe = prev.some((e) => e.id === entidad.id);
      const lista = existe ? prev.map((e) => (e.id === entidad.id ? entidad : e)) : [...prev, entidad];
      return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    setEditando(null);
  }

  async function handleEliminar(entidad) {
    if (!window.confirm(`¿Eliminar "${entidad.nombre}" del directorio?`)) return;
    try {
      await entidadService.eliminarEntidad(entidad.id);
      setEntidades((prev) => prev.filter((e) => e.id !== entidad.id));
      toast.success('Entidad eliminada del directorio.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar.');
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>

      {/* Header */}
      <div className="relative px-5 pt-safe pt-4 pb-5 overflow-hidden" style={{ background: t.bgHeader }}>
        <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle,rgba(0,196,180,0.15) 0%,transparent 70%)' }} />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)} aria-label="Volver"
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <ChevronLeft size={20} style={{ color: t.primary }} strokeWidth={2.5} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-poppins font-extrabold leading-tight" style={{ color: t.text }}>Directorio</h1>
            <p className="text-sm" style={{ color: t.textMuted }}>
              {filtradas.length} entidad{filtradas.length !== 1 ? 'es' : ''} aliada{filtradas.length !== 1 ? 's' : ''} · Pasto
            </p>
          </div>
          {esAdmin && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditando({})} data-testid="btn-nueva-entidad"
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#00C4B4,#00A890)' }}>
              <Plus size={14} /> Agregar
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-3 relative z-10"
             style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={16} style={{ color: t.textMuted }} className="shrink-0" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre" aria-label="Buscar entidad"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: t.text }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar relative z-10" data-testid="filtros-directorio">
          {FILTROS.map((f) => (
            <button key={f.id} onClick={() => setFiltro(f.id)} data-testid={`filtro-${f.id}`}
              className="shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={filtro === f.id
                ? { background: 'linear-gradient(135deg,#00C4B4,#00A890)', color: 'white', boxShadow: '0 4px 12px rgba(0,196,180,0.35)' }
                : { background: t.surface, color: t.textMuted, border: `1px solid ${t.border}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {editando && (
          <FormularioEntidad key={editando.id ?? 'nueva'} inicial={editando} t={t}
            onCancelar={() => setEditando(null)} onGuardado={handleGuardado} />
        )}
      </AnimatePresence>

      {cargando && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 rounded-full border-2 animate-spin"
               style={{ borderColor: t.secondary, borderTopColor: 'transparent' }} />
        </div>
      )}

      {error && (
        <p role="alert" className="mx-4 mt-4 rounded-2xl px-4 py-3 text-sm" style={{ background: t.primaryBg, color: t.primary }}>
          {error}
        </p>
      )}

      {!cargando && !error && filtradas.length === 0 && (
        <div className="flex flex-col items-center py-16 px-8 text-center" data-testid="directorio-vacio">
          <span className="text-5xl mb-4">🏥</span>
          <p className="font-semibold" style={{ color: t.textMuted }}>No hay entidades registradas.</p>
        </div>
      )}

      <div className="px-4 pt-4 flex flex-col gap-3" data-testid="lista-entidades">
        {filtradas.map((e, idx) => {
          const tipo  = TIPOS[e.tipo] || TIPOS.otro;
          const mapa  = enlaceMapa(e);
          return (
            <motion.div key={e.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-4 p-4 rounded-2xl"
              style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>

              <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                   style={{ background: tipo.gradient, boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
                {tipo.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-poppins font-bold text-base leading-snug" style={{ color: t.text }}>{e.nombre}</h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: t.secondaryBg, color: t.secondary, border: `1px solid ${t.secondaryBorder}` }}>
                  {tipo.label}
                </span>
                {e.direccion && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: t.textMuted }}>
                    <MapPin size={12} className="shrink-0" /> {e.direccion}
                  </p>
                )}
                {e.horario && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: t.textMuted }}>
                    <Clock size={12} className="shrink-0" /> {e.horario}
                  </p>
                )}
                {e.telefono && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: t.textMuted }}>
                    <Phone size={12} className="shrink-0" /> {e.telefono}
                  </p>
                )}
                {esAdmin && (
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setEditando(e)} className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: t.secondary }} data-testid={`editar-entidad-${e.id}`}>
                      <Pencil size={12} /> Editar
                    </button>
                    <button onClick={() => handleEliminar(e)} className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: '#EF4444' }} data-testid={`eliminar-entidad-${e.id}`}>
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {e.telefono && (
                  <a href={`tel:${e.telefono}`} aria-label={`Llamar a ${e.nombre}`}
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: t.secondaryBg, border: `1px solid ${t.secondaryBorder}` }}>
                    <Phone size={16} style={{ color: t.secondary }} />
                  </a>
                )}
                {mapa && (
                  <a href={mapa} target="_blank" rel="noopener noreferrer" aria-label={`Cómo llegar a ${e.nombre}`}
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: t.primaryBg, border: `1px solid ${t.primaryBorder}` }}>
                    <Navigation size={16} style={{ color: t.primary }} />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
