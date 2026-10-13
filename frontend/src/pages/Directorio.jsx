import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Navigation, Clock, Plus, Pencil, Trash2, X, Stethoscope, House, HeartHandshake, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import * as entidadService from '../services/entidadService';
import BottomNav from '../components/ui/BottomNav';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import HojaConfirmacion from '../components/ui/HojaConfirmacion';
import MapaSelector from '../components/MapaSelector';
import CampoTexto from '../components/formulario/CampoTexto';
import AreaTexto from '../components/formulario/AreaTexto';
import { BuscadorAdmin, FiltrosAdmin } from '../components/admin/ListaAdmin';
import { AlertaError, BotonPrimario, focoVisible } from '../components/auth/AuthUI';

// HU-27: directorio de veterinarias, albergues y centros de bienestar animal.
// Cualquier usuario lo consulta; el administrador puede agregar, editar y eliminar.

const TIPOS = {
  veterinaria: { label: 'Veterinaria', icon: Stethoscope },
  albergue:    { label: 'Albergue',    icon: House },
  otro:        { label: 'Otro aliado', icon: HeartHandshake },
};

const FORM_VACIO = {
  nombre: '', tipo: 'veterinaria', direccion: '', telefono: '', horario: '',
  latitud: '', longitud: '', descripcion: '',
};

// Ruta en la app de mapas del celular (por coordenadas o, si no hay, por dirección)
function enlaceComoLlegar(e) {
  if (e.latitud && e.longitud) return `https://www.google.com/maps/dir/?api=1&destination=${e.latitud},${e.longitud}`;
  if (e.direccion) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.direccion}, Pasto`)}`;
  return null;
}

function FormularioEntidad({ inicial, onCancelar, onGuardado }) {
  const [form, setForm] = useState(inicial?.id ? { ...FORM_VACIO, ...inicial } : FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (campo) => (ev) => setForm((p) => ({ ...p, [campo]: ev.target.value }));
  const coords = { lat: form.latitud ? parseFloat(form.latitud) : null, lng: form.longitud ? parseFloat(form.longitud) : null };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancelar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancelar]);

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

  return (
    <motion.div className="fixed inset-0 z-[3000] flex items-end justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onCancelar} aria-hidden="true" />
      <motion.form onSubmit={handleSubmit} data-testid="form-entidad" role="dialog" aria-modal="true" aria-labelledby="titulo-entidad"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-mobile max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-warm-50 dark:bg-dark-800
                   px-5 pt-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="titulo-entidad" className="font-poppins font-bold text-lg text-dark-900 dark:text-white">
            {inicial?.id ? 'Editar entidad' : 'Nueva entidad aliada'}
          </h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar formulario"
            className={`-mr-2 h-10 w-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-black/5 ${focoVisible}`}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <AlertaError mensaje={error} />

        <CampoTexto id="nombre" etiqueta="Nombre" placeholder="Ej.: Veterinaria San Francisco" required maxLength={150}
          value={form.nombre} onChange={cambiar('nombre')} />

        <fieldset>
          <legend className="text-[13px] font-semibold text-dark-700 dark:text-white/70">Tipo</legend>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {Object.entries(TIPOS).map(([id, cfg]) => {
              const Icon = cfg.icon;
              const sel = form.tipo === id;
              return (
                <button key={id} type="button" aria-pressed={sel} onClick={() => setForm((p) => ({ ...p, tipo: id }))}
                  className={`h-16 rounded-2xl border-[1.5px] flex flex-col items-center justify-center gap-1 text-[12px] font-semibold ${focoVisible}
                              ${sel ? 'border-emerald-700 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                                    : 'border-warm-border bg-white text-dark-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80'}`}>
                  <Icon size={20} aria-hidden="true" /> {cfg.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <CampoTexto id="direccion" etiqueta="Dirección" placeholder="Cra 25 # 18-30, Centro" maxLength={255}
          value={form.direccion} onChange={cambiar('direccion')} />
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto id="telefono" etiqueta="Teléfono" type="tel" inputMode="tel" placeholder="300 123 4567" maxLength={20}
            value={form.telefono} onChange={cambiar('telefono')} />
          <CampoTexto id="horario" etiqueta="Horario" placeholder="L–S 8:00–18:00" maxLength={150}
            value={form.horario} onChange={cambiar('horario')} />
        </div>

        <div>
          <p className="text-[13px] font-semibold text-dark-700 dark:text-white/70 mb-1.5">Ubicación en el mapa</p>
          <div className="rounded-2xl overflow-hidden border border-warm-border dark:border-white/10">
            <MapaSelector coords={coords}
              onCoordsChange={(lat, lng) => setForm((p) => ({ ...p, latitud: lat.toFixed(6), longitud: lng.toFixed(6) }))} />
          </div>
          <p className="mt-1.5 text-[12px] text-gray-500 dark:text-white/50">
            {coords.lat ? 'Ubicación marcada: aparecerá en el mapa con una cruz verde.' : 'Opcional: márcala para que aparezca en el mapa.'}
          </p>
        </div>

        <AreaTexto id="descripcion" etiqueta="Descripción (opcional)" rows={2} maxLength={500}
          placeholder="Servicios, urgencias 24 h, jornadas de adopción…" value={form.descripcion} onChange={cambiar('descripcion')} />

        <BotonPrimario type="submit" loading={guardando} textoCargando="Guardando…">Guardar</BotonPrimario>
      </motion.form>
    </motion.div>
  );
}

function TarjetaEntidad({ e, esAdmin, onEditar, onEliminar }) {
  const tipo = TIPOS[e.tipo] || TIPOS.otro;
  const Icon = tipo.icon;
  const llegar = enlaceComoLlegar(e);
  return (
    <article className="rounded-3xl p-4 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
      <div className="flex gap-3">
        <span className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300
                         flex items-center justify-center">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">{tipo.label}</p>
          <h3 className="font-poppins font-semibold text-[16px] leading-tight text-dark-900 dark:text-white">{e.nombre}</h3>
          <ul className="mt-2 flex flex-col gap-1 text-[13px] text-gray-600 dark:text-white/60">
            {e.direccion && <li className="flex items-start gap-1.5"><MapPin size={14} className="shrink-0 mt-0.5 text-gray-400" aria-hidden="true" />{e.direccion}</li>}
            {e.horario && <li className="flex items-start gap-1.5"><Clock size={14} className="shrink-0 mt-0.5 text-gray-400" aria-hidden="true" />{e.horario}</li>}
          </ul>
          {e.descripcion && <p className="mt-2 text-[13px] leading-relaxed text-gray-500 dark:text-white/50">{e.descripcion}</p>}
        </div>
      </div>

      {(e.telefono || llegar) && (
        <div className="flex gap-2 mt-4">
          {e.telefono && (
            <a href={`tel:${e.telefono}`} aria-label={`Llamar a ${e.nombre}`}
               className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-semibold
                           border-[1.5px] border-gray-300 text-dark-900 hover:bg-gray-50 dark:border-white/15 dark:text-white ${focoVisible}`}>
              <Phone size={16} aria-hidden="true" /> Llamar
            </a>
          )}
          {llegar && (
            <a href={llegar} target="_blank" rel="noopener noreferrer" aria-label={`Cómo llegar a ${e.nombre}`}
               className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-semibold text-white
                           bg-emerald-700 hover:bg-emerald-800 ${focoVisible}`}>
              <Navigation size={16} aria-hidden="true" /> Cómo llegar
            </a>
          )}
        </div>
      )}

      {esAdmin && (
        <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-warm-border dark:border-white/10">
          <button type="button" onClick={() => onEditar(e)} data-testid={`editar-entidad-${e.id}`}
            className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-dark-700 hover:bg-warm-100
                        dark:text-white/80 dark:hover:bg-white/10 ${focoVisible}`}>
            <Pencil size={14} aria-hidden="true" /> Editar
          </button>
          <button type="button" onClick={() => onEliminar(e)} data-testid={`eliminar-entidad-${e.id}`}
            className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50
                        dark:text-red-400 dark:hover:bg-red-500/10 ${focoVisible}`}>
            <Trash2 size={14} aria-hidden="true" /> Eliminar
          </button>
        </div>
      )}
    </article>
  );
}

export default function Directorio() {
  const { esAdmin } = useAuth();
  const [entidades, setEntidades] = useState([]);
  const [filtro,    setFiltro]    = useState('todos');
  const [busqueda,  setBusqueda]  = useState('');
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [editando,  setEditando]  = useState(null); // null | {} (nueva) | entidad
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError('');
    entidadService.listarEntidades()
      .then(({ data }) => setEntidades(data.entidades || []))
      .catch(() => setError('No se pudo cargar el directorio.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const q = busqueda.trim().toLowerCase();
  const filtradas = entidades.filter((e) => {
    if (filtro !== 'todos' && e.tipo !== filtro) return false;
    if (q && ![e.nombre, e.direccion].some((v) => v?.toLowerCase().includes(q))) return false;
    return true;
  });
  const cuenta = (tipo) => entidades.filter((e) => e.tipo === tipo).length;

  function handleGuardado(entidad) {
    setEntidades((prev) => {
      const existe = prev.some((e) => e.id === entidad.id);
      const lista = existe ? prev.map((e) => (e.id === entidad.id ? entidad : e)) : [...prev, entidad];
      return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    setEditando(null);
  }

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await entidadService.eliminarEntidad(aEliminar.id);
      setEntidades((prev) => prev.filter((e) => e.id !== aEliminar.id));
      toast.success('Entidad eliminada del directorio.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar.');
    } finally {
      setEliminando(false);
      setAEliminar(null);
    }
  }

  const cerrarFormulario = useCallback(() => setEditando(null), []);
  const cancelarEliminar = useCallback(() => setAEliminar(null), []);

  return (
    <div className="min-h-dvh pb-28 bg-warm-50 dark:bg-dark-800">
      <EncabezadoPagina titulo="Aliados" subtitulo="Veterinarias y albergues"
        accion={esAdmin && (
          <button type="button" onClick={() => setEditando({})} data-testid="btn-nueva-entidad"
            className={`h-10 px-3.5 shrink-0 rounded-full flex items-center gap-1 text-[14px] font-semibold text-white
                        bg-primary-700 hover:bg-primary-800 ${focoVisible}`}>
            <Plus size={17} strokeWidth={2.5} aria-hidden="true" /> Agregar
          </button>
        )} />

      <div className="px-4 pt-4 flex flex-col gap-3">
        <BuscadorAdmin valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por nombre o dirección" />
        <div data-testid="filtros-directorio">
          <FiltrosAdmin activo={filtro} onCambio={setFiltro} opciones={[
            { id: 'todos', label: 'Todos', cuenta: entidades.length },
            { id: 'veterinaria', label: 'Veterinarias', cuenta: cuenta('veterinaria') },
            { id: 'albergue', label: 'Albergues', cuenta: cuenta('albergue') },
            { id: 'otro', label: 'Otros', cuenta: cuenta('otro') },
          ]} />
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3" data-testid="lista-entidades">
        {cargando && [0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-3xl bg-white dark:bg-white/5 border border-warm-border dark:border-white/10 animate-pulse" aria-hidden="true" />
        ))}

        {error && (
          <div className="rounded-3xl p-4 flex items-center gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <p role="alert" className="flex-1 text-[14px] text-red-700 dark:text-red-300">{error}</p>
            <button type="button" onClick={cargar}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-primary-700 bg-primary-50 ${focoVisible}`}>
              <RotateCw size={15} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && filtradas.length === 0 && (
          <div className="flex flex-col items-center text-center px-6 py-12" data-testid="directorio-vacio">
            <span className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300
                             flex items-center justify-center mb-4">
              <Stethoscope size={36} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="font-poppins font-bold text-lg text-dark-900 dark:text-white">
              {entidades.length === 0 ? 'Aún no hay aliados registrados' : 'Sin resultados'}
            </h2>
            <p className="mt-1.5 text-[14px] text-gray-500 dark:text-white/50 max-w-xs">
              {entidades.length === 0 ? 'Pronto encontrarás aquí veterinarias y albergues de Pasto.' : 'Prueba con otro nombre o filtro.'}
            </p>
          </div>
        )}

        {!cargando && filtradas.map((e) => (
          <TarjetaEntidad key={e.id} e={e} esAdmin={esAdmin} onEditar={setEditando} onEliminar={setAEliminar} />
        ))}
      </div>

      <AnimatePresence>
        {editando && (
          <FormularioEntidad key={editando.id ?? 'nueva'} inicial={editando}
            onCancelar={cerrarFormulario} onGuardado={handleGuardado} />
        )}
      </AnimatePresence>

      <HojaConfirmacion abierta={Boolean(aEliminar)} titulo={`¿Eliminar "${aEliminar?.nombre ?? ''}"?`} peligro
        cargando={eliminando} textoConfirmar="Eliminar del directorio" onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar}>
        Dejará de aparecer en el directorio y en el mapa.
      </HojaConfirmacion>

      <BottomNav />
    </div>
  );
}
