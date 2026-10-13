import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, X, Video, Check, Cpu, Plus } from 'lucide-react';
import { toast } from 'sonner';
import * as mascotaService from '../services/mascotaService';
import IconoEspecie from '../components/ui/IconoEspecie';
import AreaTexto from '../components/formulario/AreaTexto';
import CampoTexto from '../components/formulario/CampoTexto';
import { BotonPrimario, focoVisible, inputAuth } from '../components/auth/AuthUI';

const PASOS = ['Fotos', 'Características', 'Detalles', 'Confirmar'];
const MAX_FOTOS = 5;      // HU-06 (el backend acepta hasta 5 por mascota)
const MAX_VIDEO_MB = 30;  // R5

const FORM_INICIAL = {
  nombre: '', especie: '', raza: '', sexo: '', color: '',
  edad: '', edad_unidad: 'años', descripcion: '', microchip: '',
};

const ESPECIES = [
  { value: 'perro',  label: 'Perro' },
  { value: 'gato',   label: 'Gato' },
  { value: 'ave',    label: 'Ave' },
  { value: 'reptil', label: 'Reptil' },
  { value: 'otro',   label: 'Otro' },
];
const SEXOS    = [{ value: 'macho', label: 'Macho' }, { value: 'hembra', label: 'Hembra' }];
const UNIDADES = [{ value: 'años', label: 'Años' }, { value: 'meses', label: 'Meses' }];
const COLORES_SUGERIDOS = ['Negro', 'Blanco', 'Café', 'Dorado/Miel', 'Gris', 'Naranja', 'Manchado', 'Atigrado', 'Crema'];

const etiqueta = 'text-[13px] font-semibold text-dark-700 dark:text-white/70';

function Opcion({ activo, onClick, children, className = '' }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo}
      className={`rounded-2xl border-[1.5px] font-semibold text-[14px] transition-colors ${focoVisible} ${className}
                  ${activo ? 'border-primary-700 bg-primary-50 text-primary-800 dark:bg-white/10 dark:text-white'
                           : 'border-warm-border bg-white text-dark-700 hover:bg-warm-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80'}`}>
      {children}
    </button>
  );
}

function MensajeError({ children }) {
  return children ? <p className="text-xs font-medium mt-1.5 text-red-600 dark:text-red-400">{children}</p> : null;
}

function Titulo({ children, sub }) {
  return (
    <div>
      <h2 className="font-poppins font-bold text-[24px] leading-tight text-dark-900 dark:text-white">{children}</h2>
      {sub && <p className="text-[14px] mt-1 text-gray-500 dark:text-white/50">{sub}</p>}
    </div>
  );
}

export default function MascotaForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const esEdicion  = Boolean(id);
  const fileRef    = useRef(null);
  const videoRef   = useRef(null);

  const [paso,          setPaso]          = useState(1);
  const [form,          setForm]          = useState(FORM_INICIAL);
  const [fotos,         setFotos]         = useState([]);
  const [fotosActuales, setFotosActuales] = useState([]);
  const [video,         setVideo]         = useState(null);
  const [errores,       setErrores]       = useState({});
  const [cargando,      setCargando]      = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(esEdicion);
  const [dir,           setDir]           = useState(1);

  useEffect(() => {
    if (!esEdicion) return;
    mascotaService.obtenerMascota(id)
      .then(({ data }) => {
        const m = data.mascota;
        setForm({ nombre: m.nombre || '', especie: m.especie || '', raza: m.raza || '',
          sexo: m.sexo || '', color: m.color || '', edad: m.edad ?? '',
          edad_unidad: m.edad_unidad || 'años', descripcion: m.descripcion || '', microchip: m.microchip || '' });
        setFotosActuales(m.foto_urls || []);
      })
      .catch(() => toast.error('No se pudo cargar la mascota.'))
      .finally(() => setCargandoDatos(false));
  }, [id, esEdicion]);

  const cupoFotos = MAX_FOTOS - fotosActuales.length - fotos.length;

  function set(name, value) {
    setForm(p => ({ ...p, [name]: value }));
    setErrores(p => ({ ...p, [name]: '' }));
  }

  function handleFotos(e) {
    const validos = Array.from(e.target.files).filter(f => ['image/jpeg', 'image/png'].includes(f.type));
    e.target.value = '';
    if (validos.length > cupoFotos) { toast.error(`Puedes agregar ${cupoFotos} foto${cupoFotos === 1 ? '' : 's'} más (máximo ${MAX_FOTOS}).`); return; }
    setFotos(p => [...p, ...validos.map(f => ({ archivo: f, preview: URL.createObjectURL(f) }))]);
  }

  // R5: un video corto de la mascota
  function handleVideo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(archivo.type)) {
      toast.error('Formato no permitido. Usa MP4, WebM o MOV.'); return;
    }
    if (archivo.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`El video no puede superar ${MAX_VIDEO_MB} MB.`); return;
    }
    if (video) URL.revokeObjectURL(video.preview);
    setVideo({ archivo, preview: URL.createObjectURL(archivo) });
  }

  function quitarFoto(i) {
    URL.revokeObjectURL(fotos[i].preview);
    setFotos(p => p.filter((_, j) => j !== i));
  }

  function validarPaso() {
    const e = {};
    if (paso === 1 && !form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (paso === 2) {
      if (!form.especie) e.especie = 'Selecciona la especie.';
      if (!form.sexo)    e.sexo    = 'Selecciona el sexo.';
      if (!form.color.trim()) e.color = 'El color es obligatorio.';
    }
    setErrores(e);
    return !Object.keys(e).length;
  }

  function siguiente() {
    if (!validarPaso()) return;
    setDir(1); setPaso(p => Math.min(p + 1, PASOS.length));
  }
  function anterior() {
    if (paso === 1) { navigate(esEdicion ? `/mascotas/${id}` : '/mascotas'); return; }
    setDir(-1); setPaso(p => Math.max(p - 1, 1));
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setCargando(true);
    try {
      const payload = { ...form, edad: form.edad !== '' ? parseInt(form.edad, 10) : undefined,
        raza: form.raza || undefined, descripcion: form.descripcion || undefined, microchip: form.microchip || undefined };
      let mascotaId;
      if (esEdicion) {
        await mascotaService.actualizarMascota(id, payload); mascotaId = id;
      } else {
        const { data } = await mascotaService.crearMascota(payload); mascotaId = data.mascota.id;
      }
      // La mascota ya quedó guardada: si fallan los archivos se informa sin
      // reintentar el registro completo (evita mascotas duplicadas).
      try {
        if (fotos.length > 0) await mascotaService.subirFotos(mascotaId, fotos.map(f => f.archivo));
        if (video) await mascotaService.subirVideo(mascotaId, video.archivo);
        toast.success(esEdicion ? '¡Perfil actualizado!' : `¡${form.nombre} quedó registrado!`);
      } catch (errArchivos) {
        toast.error(`${form.nombre} se guardó, pero no se pudieron subir las fotos o el video: `
          + (errArchivos.response?.data?.message || 'error de conexión.')
          + ' Puedes agregarlos luego desde "Editar".');
      }
      navigate('/mascotas');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar. Intenta de nuevo.');
    } finally { setCargando(false); }
  }

  if (cargandoDatos) return (
    <div className="min-h-dvh flex items-center justify-center bg-warm-50 dark:bg-dark-800" aria-busy="true">
      <div className="h-10 w-10 rounded-full border-[3px] border-primary-700 border-t-transparent animate-spin" aria-hidden="true" />
    </div>
  );

  const fotoPortada = fotos[0]?.preview || fotosActuales[0];
  const resumen = [form.raza, form.sexo && (form.sexo === 'macho' ? 'Macho' : 'Hembra'), form.color,
    form.edad ? `${form.edad} ${form.edad_unidad}` : null, form.microchip ? 'Con microchip' : null].filter(Boolean);

  const deslizar = {
    enter:  (d) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="min-h-dvh flex flex-col bg-warm-50 dark:bg-dark-800">

      {/* ── Encabezado con progreso ─────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-warm-50/90 dark:bg-dark-800/90 backdrop-blur-md border-b border-warm-border/70
                         dark:border-white/10 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={anterior} aria-label={paso === 1 ? 'Salir' : 'Paso anterior'}
            className={`h-10 w-10 shrink-0 rounded-full bg-white dark:bg-white/10 border border-warm-border dark:border-white/10
                        text-dark-900 dark:text-white flex items-center justify-center ${focoVisible}`}>
            <ChevronLeft size={22} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-poppins font-bold text-[17px] leading-tight truncate text-dark-900 dark:text-white">
              {esEdicion ? 'Editar mascota' : 'Registrar mascota'}
            </p>
            <p className="text-[13px] text-gray-500 dark:text-white/50" data-testid="paso-indicator">
              Paso {paso} de {PASOS.length} · <span className="font-semibold text-primary-700 dark:text-primary-400">{PASOS[paso - 1]}</span>
            </p>
          </div>
          <button type="button" onClick={() => navigate('/mascotas')}
            className={`h-10 px-3 rounded-full text-[14px] font-semibold text-gray-600 dark:text-white/60 hover:bg-black/5 ${focoVisible}`}>
            Salir
          </button>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {PASOS.map((_, i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <motion.span className="block h-full bg-primary-700 rounded-full origin-left" initial={false}
                           animate={{ scaleX: i < paso ? 1 : 0 }} transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }} />
            </span>
          ))}
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────────────── */}
      <div className="flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={paso} custom={dir} variants={deslizar} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="px-5 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]">

            {/* ══ Paso 1: fotos y nombre ══ */}
            {paso === 1 && (
              <div className="flex flex-col gap-6" data-testid="paso-1">
                <Titulo sub="Con buenas fotos será más fácil reconocerla si algún día se pierde.">
                  {form.nombre ? <>Cuéntanos sobre <span className="text-primary-700">{form.nombre}</span></> : 'Registra a tu mascota'}
                </Titulo>

                <section className="rounded-3xl p-4 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10" data-testid="drop-zone">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-poppins font-semibold text-[15px] text-dark-900 dark:text-white">Fotos</p>
                      <p className="text-[13px] text-gray-500 dark:text-white/50">Recomendado: al menos 1 · Máximo {MAX_FOTOS}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-gray-500 dark:text-white/50">
                      {fotosActuales.length + fotos.length}/{MAX_FOTOS}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {fotosActuales.map((url, i) => (
                      <div key={url} className="relative aspect-square">
                        <img src={url} alt="" className="h-full w-full rounded-2xl object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">Principal</span>
                        )}
                      </div>
                    ))}
                    {fotos.map((f, i) => (
                      <motion.div key={f.preview} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative aspect-square">
                        <img src={f.preview} alt="" className="h-full w-full rounded-2xl object-cover" />
                        {i === 0 && fotosActuales.length === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">Principal</span>
                        )}
                        <button type="button" onClick={() => quitarFoto(i)} aria-label={`Quitar foto ${i + 1}`}
                          className={`absolute top-1 right-1 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center ${focoVisible}`}>
                          <X size={16} aria-hidden="true" />
                        </button>
                      </motion.div>
                    ))}
                    {cupoFotos > 0 && (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className={`aspect-square rounded-2xl border-[1.5px] border-dashed border-[#D9CFCA] bg-warm-50 dark:bg-white/5
                                    dark:border-white/15 flex flex-col items-center justify-center gap-1 text-primary-700
                                    dark:text-primary-400 hover:bg-primary-50/60 ${focoVisible}`}>
                        <Camera size={24} aria-hidden="true" />
                        <span className="text-[12px] font-semibold">Agregar</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple className="hidden"
                         onChange={handleFotos} data-testid="file-input" />

                  {/* Video (R5) */}
                  <div className="mt-4 pt-4 border-t border-warm-border dark:border-white/10">
                    {video ? (
                      <div className="flex items-center gap-3">
                        <video src={video.preview} className="h-16 w-24 rounded-xl object-cover" muted data-testid="video-preview" />
                        <span className="flex-1 text-[13px] text-gray-600 dark:text-white/60">Video agregado</span>
                        <button type="button" onClick={() => { URL.revokeObjectURL(video.preview); setVideo(null); }}
                          className={`h-9 px-3 rounded-full text-[13px] font-semibold text-red-600 hover:bg-red-50 ${focoVisible}`}>
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => videoRef.current?.click()}
                        className={`w-full flex items-center gap-3 text-left rounded-xl ${focoVisible}`}>
                        <span className="h-10 w-10 shrink-0 rounded-xl bg-primary-50 dark:bg-white/10 text-primary-700 flex items-center justify-center">
                          <Video size={20} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-[14px] font-semibold text-dark-900 dark:text-white">Agregar un video (opcional)</span>
                          <span className="block text-[12px] text-gray-500 dark:text-white/50">MP4, WebM o MOV · máx. {MAX_VIDEO_MB} MB</span>
                        </span>
                      </button>
                    )}
                    <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime"
                      className="hidden" onChange={handleVideo} data-testid="video-input" />
                  </div>
                </section>

                <div>
                  <label htmlFor="nombre-mascota" className={etiqueta}>Nombre de la mascota</label>
                  <input id="nombre-mascota" name="nombre" placeholder="¿Cómo se llama?" autoComplete="off"
                    value={form.nombre} onChange={e => set('nombre', e.target.value)}
                    aria-invalid={Boolean(errores.nombre)}
                    className={`${inputAuth(errores.nombre)} !pl-4 pr-4 mt-1.5 font-semibold`} />
                  <MensajeError>{errores.nombre}</MensajeError>
                </div>
              </div>
            )}

            {/* ══ Paso 2: características ══ */}
            {paso === 2 && (
              <div className="flex flex-col gap-6" data-testid="paso-2">
                <Titulo>{form.nombre ? <>¿Cómo es <span className="text-primary-700">{form.nombre}</span>?</> : 'Características'}</Titulo>

                <fieldset>
                  <legend className={etiqueta}>Tipo de animal</legend>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {ESPECIES.map(e => (
                      <Opcion key={e.value} activo={form.especie === e.value} onClick={() => set('especie', e.value)}
                              className="flex flex-col items-center gap-1.5 py-3">
                        <IconoEspecie especie={e.value} size={24} strokeWidth={1.8} />
                        <span className="text-[12px]">{e.label}</span>
                      </Opcion>
                    ))}
                  </div>
                  <MensajeError>{errores.especie}</MensajeError>
                </fieldset>

                <fieldset>
                  <legend className={etiqueta}>Sexo</legend>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {SEXOS.map(s => (
                      <Opcion key={s.value} activo={form.sexo === s.value} onClick={() => set('sexo', s.value)} className="h-12">
                        {s.label}
                      </Opcion>
                    ))}
                  </div>
                  <MensajeError>{errores.sexo}</MensajeError>
                </fieldset>

                <fieldset>
                  <legend className={etiqueta}>Color</legend>
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    {COLORES_SUGERIDOS.map(c => (
                      <Opcion key={c} activo={form.color === c} onClick={() => set('color', c)} className="h-10 px-3.5 !rounded-full">
                        {c}
                      </Opcion>
                    ))}
                  </div>
                  <input placeholder="O escribe el color exacto…" aria-label="Color exacto" value={form.color}
                    onChange={e => set('color', e.target.value)} aria-invalid={Boolean(errores.color)}
                    className={`${inputAuth(errores.color)} !pl-4 pr-4`} />
                  <MensajeError>{errores.color}</MensajeError>
                </fieldset>

                <div>
                  <label htmlFor="raza-mascota" className={etiqueta}>Raza (opcional)</label>
                  <input id="raza-mascota" name="raza" placeholder="Ej.: Labrador, Persa, Criollo…"
                    value={form.raza} onChange={e => set('raza', e.target.value)}
                    className={`${inputAuth(false)} !pl-4 pr-4 mt-1.5`} />
                </div>
              </div>
            )}

            {/* ══ Paso 3: detalles ══ */}
            {paso === 3 && (
              <div className="flex flex-col gap-6" data-testid="paso-3">
                <Titulo sub="Todo es opcional, pero cada detalle ayuda a reconocerla.">Detalles</Titulo>

                <fieldset>
                  <legend className={etiqueta}>Edad</legend>
                  <div className="flex gap-2 mt-1.5">
                    <input name="edad" type="number" min="0" inputMode="numeric" placeholder="Ej.: 3" aria-label="Edad"
                      value={form.edad} onChange={e => set('edad', e.target.value)}
                      className={`${inputAuth(false)} !pl-4 pr-4 !w-28 text-center font-semibold`} />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {UNIDADES.map(u => (
                        <Opcion key={u.value} activo={form.edad_unidad === u.value} onClick={() => set('edad_unidad', u.value)} className="h-[52px]">
                          {u.label}
                        </Opcion>
                      ))}
                    </div>
                  </div>
                </fieldset>

                <AreaTexto id="descripcion-mascota" etiqueta="Señas particulares" rows={4} maxLength={500}
                  placeholder="Marcas, manchas, cicatrices, collar, comportamiento…"
                  value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />

                <CampoTexto id="microchip-mascota" etiqueta="Número de microchip" icono={Cpu}
                  placeholder="Si tiene, es muy útil" value={form.microchip} onChange={e => set('microchip', e.target.value)} />
              </div>
            )}

            {/* ══ Paso 4: confirmar ══ */}
            {paso === 4 && (
              <div className="flex flex-col gap-5" data-testid="paso-4">
                <Titulo sub="Revisa los datos antes de guardar.">¡Casi listo!</Titulo>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10 shadow-card">
                  <div className="h-48 bg-primary-50 dark:bg-white/5 flex items-center justify-center">
                    {fotoPortada
                      ? <img src={fotoPortada} alt="" className="w-full h-full object-cover" />
                      : <IconoEspecie especie={form.especie} size={64} strokeWidth={1.2} className="text-primary-200" />}
                  </div>
                  <div className="p-5">
                    <h3 className="font-poppins font-bold text-[24px] leading-tight text-dark-900 dark:text-white">{form.nombre || '(sin nombre)'}</h3>
                    {resumen.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {resumen.map((c) => (
                          <li key={c} className="h-8 px-3 rounded-full flex items-center text-[13px] font-medium bg-warm-50 border border-warm-border
                                                 text-dark-700 dark:bg-white/5 dark:border-white/10 dark:text-white/80">{c}</li>
                        ))}
                      </ul>
                    )}
                    {form.descripcion && (
                      <p className="mt-3 text-[14px] leading-relaxed text-gray-600 dark:text-white/60">{form.descripcion}</p>
                    )}
                    <p className={`mt-4 pt-3 border-t border-warm-border dark:border-white/10 flex items-center gap-2 text-[13px]
                                   ${fotosActuales.length + fotos.length > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {fotosActuales.length + fotos.length > 0
                        ? <><Check size={16} aria-hidden="true" /> {fotosActuales.length + fotos.length} foto{fotosActuales.length + fotos.length !== 1 ? 's' : ''}{video ? ' y 1 video' : ''}</>
                        : <><Camera size={16} aria-hidden="true" /> Sin fotos: te recomendamos agregar al menos una</>}
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Acción ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-30 px-5 pt-3
                      pb-[max(env(safe-area-inset-bottom),1rem)] bg-gradient-to-t from-warm-50 via-warm-50 to-warm-50/0
                      dark:from-dark-800 dark:via-dark-800 dark:to-dark-800/0">
        {paso < PASOS.length ? (
          <BotonPrimario type="button" onClick={siguiente} data-testid="btn-siguiente">Continuar</BotonPrimario>
        ) : (
          <BotonPrimario type="button" onClick={handleSubmit} loading={cargando} textoCargando="Guardando…" data-testid="btn-guardar">
            {esEdicion ? <><Check size={19} aria-hidden="true" /> Guardar cambios</> : <><Plus size={19} aria-hidden="true" /> Registrar mascota</>}
          </BotonPrimario>
        )}
      </div>
    </div>
  );
}
