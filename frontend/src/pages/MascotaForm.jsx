import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, X, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import * as mascotaService from '../services/mascotaService';

const PASOS = ['Fotos', 'Básicos', 'Detalles', 'Confirmar'];
const MAX_FOTOS = 5;      // HU-06
const MAX_VIDEO_MB = 30;  // R5

const FORM_INICIAL = {
  nombre: '', especie: '', raza: '', sexo: '', color: '',
  edad: '', edad_unidad: 'años', descripcion: '', microchip: '',
};

const ESPECIES = [
  { value: 'perro',  label: 'Perro',  emoji: '🐶', grad: ['#FFD0BF','#F97B62'] },
  { value: 'gato',   label: 'Gato',   emoji: '🐱', grad: ['#C7B2F5','#9B87E8'] },
  { value: 'ave',    label: 'Ave',    emoji: '🐦', grad: ['#A7F0EB','#00C4B4'] },
  { value: 'reptil', label: 'Reptil', emoji: '🦎', grad: ['#A7F5B9','#22C55E'] },
  { value: 'otro',   label: 'Otro',   emoji: '🐾', grad: ['#FFD0BF','#F97B62'] },
];

const SEXOS    = [{ value:'macho',  label:'Macho',   icon:'♂' },
                  { value:'hembra', label:'Hembra',  icon:'♀' }];
const TAMANIOS = [{ value:'pequeño',label:'Pequeño', sub:'< 10 kg' },
                  { value:'mediano',label:'Mediano',  sub:'10-25 kg' },
                  { value:'grande', label:'Grande',   sub:'> 25 kg' }];
const UNIDADES = [{ value:'años', label:'Años' }, { value:'meses', label:'Meses' }];

const COLORES_SUGERIDOS = ['Negro','Blanco','Café','Dorado/Miel','Gris','Naranja','Manchado','Atigrado','Crema'];

function ChipBtn({ activo, onClick, children, style = {} }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-150"
      style={activo
        ? { background:'linear-gradient(135deg,#FF9280,#F97B62)', color:'white', boxShadow:'0 4px 12px rgba(249,123,98,0.35)', ...style }
        : { background:'#FFF8F5', color:'#6B7280', border:'1.5px solid #EDE5E1', ...style }}
    >
      {children}
    </motion.button>
  );
}

function Label({ children, required }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:'#9CA3AF' }}>
      {children}{required && <span style={{ color:'#F97B62' }}> *</span>}
    </p>
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
        setForm({ nombre:m.nombre||'', especie:m.especie||'', raza:m.raza||'',
          sexo:m.sexo||'', color:m.color||'', edad:m.edad??'',
          edad_unidad:m.edad_unidad||'años', descripcion:m.descripcion||'', microchip:m.microchip||'' });
      })
      .catch(() => toast.error('No se pudo cargar la mascota.'))
      .finally(() => setCargandoDatos(false));
  }, [id, esEdicion]);

  function set(name, value) {
    setForm(p => ({ ...p, [name]: value }));
    setErrores(p => ({ ...p, [name]: '' }));
  }

  function handleFotos(e) {
    const validos = Array.from(e.target.files).filter(f => ['image/jpeg','image/png'].includes(f.type));
    if (fotos.length + validos.length > MAX_FOTOS) { toast.error(`Máximo ${MAX_FOTOS} fotos.`); return; }
    setFotos(p => [...p, ...validos.map(f => ({ archivo:f, preview:URL.createObjectURL(f) }))]);
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
    setDir(-1); setPaso(p => Math.max(p - 1, 1));
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setCargando(true);
    try {
      const payload = { ...form, edad: form.edad !== '' ? parseInt(form.edad, 10) : undefined,
        raza: form.raza||undefined, descripcion: form.descripcion||undefined, microchip: form.microchip||undefined };
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
        toast.success(esEdicion ? '¡Perfil actualizado!' : `¡${form.nombre} registrado! 🐾`);
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
    <div className="flex items-center justify-center min-h-screen" style={{ background:'#FFF8F5' }}>
      <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
           style={{ borderColor:'#F97B62', borderTopColor:'transparent' }} />
    </div>
  );

  const progreso   = ((paso - 1) / (PASOS.length - 1)) * 100;
  const especieObj = ESPECIES.find(e => e.value === form.especie);

  const slideVariants = {
    enter:  (d) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#FFF8F5' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 sticky top-0 z-20"
              style={{ background:'white', boxShadow:'0 1px 0 #EDE5E1' }}>
        <motion.button whileTap={{ scale:0.88 }} onClick={anterior}
          className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background:'#FFF0EA' }}>
          <ChevronLeft size={20} style={{ color:'#F97B62' }} strokeWidth={2.5} />
        </motion.button>

        <div className="flex-1 flex flex-col items-center gap-1.5">
          <p className="text-xs font-semibold" style={{ color:'#9CA3AF' }} data-testid="paso-indicator">
            Paso {paso} de {PASOS.length} · <span style={{ color:'#F97B62' }}>{PASOS[paso-1]}</span>
          </p>
          {/* Barra de progreso */}
          <div className="w-full h-1.5 rounded-full" style={{ background:'#F0E8E4' }}>
            <motion.div className="h-full rounded-full"
              style={{ background:'linear-gradient(90deg,#FF9280,#F97B62)' }}
              animate={{ width:`${progreso}%` }}
              transition={{ duration:0.35, ease:[0.32,0.72,0,1] }}
            />
          </div>
        </div>

        <motion.button whileTap={{ scale:0.88 }} onClick={() => navigate('/mascotas')}
          className="text-sm font-semibold shrink-0" style={{ color:'#9CA3AF' }}>
          Salir
        </motion.button>
      </header>

      {/* ── Contenido ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={paso}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration:0.25, ease:[0.32,0.72,0,1] }}
            className="px-5 pt-6 pb-32"
          >

            {/* ══════════════ PASO 1 — Fotos + nombre ══════════════ */}
            {paso === 1 && (
              <div className="flex flex-col gap-6" data-testid="paso-1">
                <div>
                  <h2 className="text-2xl font-poppins font-bold leading-tight" style={{ color:'#1A1A2E' }}>
                    {form.nombre
                      ? <>Cuéntanos sobre <span style={{ color:'#F97B62' }}>{form.nombre}</span></>
                      : 'Registra tu mascota 🐾'}
                  </h2>
                  <p className="text-sm mt-1" style={{ color:'#9CA3AF' }}>
                    Mientras más fotos y datos, más fácil será reconocerla.
                  </p>
                </div>

                {/* Zona de fotos */}
                <div className="rounded-3xl p-4" style={{ border:'2px dashed #F97B62', background:'#FFFAF8' }} data-testid="drop-zone">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-poppins font-semibold text-sm" style={{ color:'#1A1A2E' }}>Fotos de la mascota</p>
                      <p className="text-xs mt-0.5" style={{ color:'#9CA3AF' }}>Mínimo 1 · Máximo 6</p>
                    </div>
                    <motion.button type="button" whileTap={{ scale:0.9 }}
                      onClick={() => fileRef.current?.click()}
                      className="h-10 w-10 rounded-2xl flex items-center justify-center"
                      style={{ background:'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow:'0 4px 12px rgba(249,123,98,0.40)' }}>
                      <Camera size={18} color="white" />
                    </motion.button>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {fotos.map((f, i) => (
                      <motion.div key={i} initial={{ scale:0 }} animate={{ scale:1 }}
                        transition={{ type:'spring', stiffness:400, damping:20 }}
                        className="relative h-20 w-20">
                        <img src={f.preview} alt="" className="h-full w-full rounded-2xl object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full">
                            Principal
                          </span>
                        )}
                        <motion.button type="button" whileTap={{ scale:0.88 }}
                          onClick={() => quitarFoto(i)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                          style={{ background:'#EF4444' }}>
                          <X size={10} color="white" />
                        </motion.button>
                      </motion.div>
                    ))}
                    {fotos.length < MAX_FOTOS && (
                      <motion.button type="button" whileTap={{ scale:0.95 }}
                        onClick={() => fileRef.current?.click()}
                        className="h-20 w-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                        style={{ border:'2px dashed #EDE5E1', background:'white' }}>
                        <span className="text-2xl" style={{ color:'#EDE5E1' }}>+</span>
                        <span className="text-[9px] font-semibold" style={{ color:'#C9B8B0' }}>Agregar</span>
                      </motion.button>
                    )}
                  </div>

                  <input ref={fileRef} type="file" accept="image/jpeg,image/png"
                    multiple className="hidden" onChange={handleFotos} data-testid="file-input" />

                  {/* Video (R5) */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold mb-2" style={{ color:'#6B7280' }}>
                      Video opcional (MP4, WebM o MOV, máx. {MAX_VIDEO_MB} MB)
                    </p>
                    {video ? (
                      <div className="flex items-center gap-3">
                        <video src={video.preview} className="h-20 w-28 rounded-2xl object-cover" muted data-testid="video-preview" />
                        <button type="button" onClick={() => { URL.revokeObjectURL(video.preview); setVideo(null); }}
                          className="text-xs font-semibold" style={{ color:'#E8614A' }}>
                          Quitar video
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => videoRef.current?.click()}
                        className="px-4 py-2 rounded-2xl text-xs font-semibold"
                        style={{ border:'2px dashed #EDE5E1', background:'white', color:'#9CA3AF' }}>
                        + Agregar video
                      </button>
                    )}
                    <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime"
                      className="hidden" onChange={handleVideo} data-testid="video-input" />
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <Label required>Nombre de la mascota</Label>
                  <input
                    name="nombre" placeholder="¿Cómo se llama?"
                    value={form.nombre} onChange={e => set('nombre', e.target.value)}
                    className="w-full rounded-2xl px-4 py-3.5 text-base font-poppins font-semibold outline-none transition-all"
                    style={{ background:'white', border:`1.5px solid ${errores.nombre ? '#F97B62' : '#EDE5E1'}`,
                             color:'#1A1A2E', fontFamily:'inherit', boxShadow:'0 2px 12px rgba(26,26,46,0.06)' }}
                  />
                  {errores.nombre && <p className="text-xs mt-1.5 font-medium" style={{ color:'#F97B62' }}>{errores.nombre}</p>}
                </div>
              </div>
            )}

            {/* ══════════════ PASO 2 — Características ══════════════ */}
            {paso === 2 && (
              <div className="flex flex-col gap-6" data-testid="paso-2">
                <div>
                  <h2 className="text-2xl font-poppins font-bold" style={{ color:'#1A1A2E' }}>
                    {form.nombre
                      ? <>Características de <span style={{ color:'#F97B62' }}>{form.nombre}</span></>
                      : 'Características'}
                  </h2>
                </div>

                {/* Especie */}
                <div>
                  <Label required>Tipo de animal</Label>
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    {ESPECIES.slice(0,3).map(e => (
                      <motion.button key={e.value} type="button" whileTap={{ scale:0.95 }}
                        onClick={() => set('especie', e.value)}
                        className="flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all"
                        style={form.especie === e.value
                          ? { background:`linear-gradient(135deg,${e.grad[0]},${e.grad[1]})`, boxShadow:`0 6px 16px ${e.grad[1]}55` }
                          : { background:'white', border:'1.5px solid #EDE5E1' }}>
                        <span className="text-2xl">{e.emoji}</span>
                        <span className="text-xs font-bold" style={{ color: form.especie === e.value ? 'white' : '#6B7280' }}>
                          {e.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ESPECIES.slice(3).map(e => (
                      <motion.button key={e.value} type="button" whileTap={{ scale:0.95 }}
                        onClick={() => set('especie', e.value)}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl transition-all"
                        style={form.especie === e.value
                          ? { background:`linear-gradient(135deg,${e.grad[0]},${e.grad[1]})` }
                          : { background:'white', border:'1.5px solid #EDE5E1' }}>
                        <span>{e.emoji}</span>
                        <span className="text-sm font-bold" style={{ color: form.especie === e.value ? 'white' : '#6B7280' }}>
                          {e.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  {errores.especie && <p className="text-xs mt-1.5 font-medium" style={{ color:'#F97B62' }}>{errores.especie}</p>}
                </div>

                {/* Sexo + Tamaño */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Sexo</Label>
                    <div className="flex gap-2">
                      {SEXOS.map(s => (
                        <ChipBtn key={s.value} activo={form.sexo === s.value}
                          onClick={() => set('sexo', s.value)} style={{ flex:1 }}>
                          {s.icon} {s.label}
                        </ChipBtn>
                      ))}
                    </div>
                    {errores.sexo && <p className="text-xs mt-1 font-medium" style={{ color:'#F97B62' }}>{errores.sexo}</p>}
                  </div>

                  <div>
                    <Label>Tamaño</Label>
                    <div className="flex gap-1.5">
                      {TAMANIOS.map(t => (
                        <ChipBtn key={t.value} activo={form.tamanio === t.value}
                          onClick={() => set('tamanio', t.value)} style={{ flex:1, padding:'0.5rem 0' }}>
                          {t.value.charAt(0).toUpperCase()}
                        </ChipBtn>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <Label required>Color del pelaje</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLORES_SUGERIDOS.map(c => (
                      <ChipBtn key={c} activo={form.color === c} onClick={() => set('color', c)}>
                        {c}
                      </ChipBtn>
                    ))}
                  </div>
                  <input
                    placeholder="O escribe el color exacto…"
                    value={form.color}
                    onChange={e => set('color', e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ background:'#FFF8F5', border:`1.5px solid ${errores.color ? '#F97B62' : '#EDE5E1'}`, color:'#1A1A2E', fontFamily:'inherit' }}
                  />
                  {errores.color && <p className="text-xs mt-1.5 font-medium" style={{ color:'#F97B62' }}>{errores.color}</p>}
                </div>

                {/* Raza */}
                <div>
                  <Label>Raza</Label>
                  <input name="raza" placeholder="Ej: Labrador, Persa… (opcional)"
                    value={form.raza} onChange={e => set('raza', e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ background:'#FFF8F5', border:'1.5px solid #EDE5E1', color:'#1A1A2E', fontFamily:'inherit' }} />
                </div>
              </div>
            )}

            {/* ══════════════ PASO 3 — Detalles ══════════════ */}
            {paso === 3 && (
              <div className="flex flex-col gap-6" data-testid="paso-3">
                <div>
                  <h2 className="text-2xl font-poppins font-bold" style={{ color:'#1A1A2E' }}>Detalles adicionales</h2>
                  <p className="text-sm mt-1" style={{ color:'#9CA3AF' }}>
                    Mientras más específico, más fácil será encontrarla.
                  </p>
                </div>

                {/* Edad */}
                <div>
                  <Label>Edad</Label>
                  <div className="flex gap-3 items-start">
                    <input name="edad" type="number" min="0" placeholder="Ej: 3"
                      value={form.edad} onChange={e => set('edad', e.target.value)}
                      className="w-24 rounded-2xl px-4 py-3 text-sm outline-none text-center font-poppins font-bold transition-all"
                      style={{ background:'#FFF8F5', border:'1.5px solid #EDE5E1', color:'#1A1A2E', fontFamily:'inherit' }} />
                    <div className="flex gap-2">
                      {UNIDADES.map(u => (
                        <ChipBtn key={u.value} activo={form.edad_unidad === u.value}
                          onClick={() => set('edad_unidad', u.value)}>
                          {u.label}
                        </ChipBtn>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <Label>Señas particulares</Label>
                  <textarea name="descripcion" rows={4}
                    placeholder="Marcas, manchas, comportamiento, collar, cicatrices…"
                    value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                    className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none resize-none transition-all leading-relaxed"
                    style={{ background:'#FFF8F5', border:'1.5px solid #EDE5E1', color:'#1A1A2E', fontFamily:'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#F97B62'}
                    onBlur={e => e.target.style.borderColor = '#EDE5E1'}
                  />
                </div>

                {/* Microchip */}
                <div>
                  <Label>Número de microchip</Label>
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                       style={{ background:'#FFF8F5', border:'1.5px solid #EDE5E1' }}>
                    <span className="text-lg">💉</span>
                    <input name="microchip" placeholder="Opcional — muy útil si se pierde"
                      value={form.microchip} onChange={e => set('microchip', e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color:'#1A1A2E', fontFamily:'inherit' }} />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ PASO 4 — Confirmar ══════════════ */}
            {paso === 4 && (
              <div className="flex flex-col gap-5" data-testid="paso-4">
                <div>
                  <h2 className="text-2xl font-poppins font-bold" style={{ color:'#1A1A2E' }}>
                    ¡Casi listo!
                  </h2>
                  <p className="text-sm mt-1" style={{ color:'#9CA3AF' }}>
                    Revisa el perfil antes de publicarlo.
                  </p>
                </div>

                {/* Card resumen */}
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  className="rounded-3xl overflow-hidden"
                  style={{ background:'white', boxShadow:'0 8px 32px rgba(26,26,46,0.10)' }}>

                  {/* Banner foto */}
                  <div className="h-44 relative flex items-center justify-center overflow-hidden"
                       style={{ background: especieObj
                         ? `linear-gradient(135deg,${especieObj.grad[0]},${especieObj.grad[1]})`
                         : 'linear-gradient(135deg,#FFD0BF,#F97B62)' }}>
                    {fotos[0]
                      ? <img src={fotos[0].preview} alt="" className="w-full h-full object-cover" />
                      : <span className="text-7xl filter drop-shadow">{especieObj?.emoji || '🐾'}</span>}
                    {/* Fotos adicionales */}
                    {fotos.length > 1 && (
                      <div className="absolute bottom-3 right-3 flex -space-x-2">
                        {fotos.slice(1,4).map((f,i) => (
                          <img key={i} src={f.preview} alt=""
                            className="h-8 w-8 rounded-xl object-cover border-2 border-white" />
                        ))}
                        {fotos.length > 4 && (
                          <div className="h-8 w-8 rounded-xl bg-black/50 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                            +{fotos.length-4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-2xl font-poppins font-extrabold" style={{ color:'#1A1A2E' }}>
                        {form.nombre || '(sin nombre)'}
                      </h3>
                      {especieObj && (
                        <span className="px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                              style={{ background:'#FFF0EA', color:'#F97B62' }}>
                          {especieObj.emoji} {especieObj.label}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {[form.raza, form.sexo, form.color, form.edad ? `${form.edad} ${form.edad_unidad}` : null,
                        form.microchip ? '💉 Microchip' : null
                      ].filter(Boolean).map((c, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-2xl text-xs font-semibold"
                              style={{ background:'#FFF8F5', color:'#6B7280', border:'1px solid #EDE5E1' }}>
                          {c}
                        </span>
                      ))}
                    </div>

                    {form.descripcion && (
                      <p className="text-sm leading-relaxed italic mb-4" style={{ color:'#9CA3AF' }}>
                        "{form.descripcion}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-3" style={{ borderTop:'1px solid #EDE5E1' }}>
                      <CheckCircle size={15} style={{ color:'#00C4B4' }} />
                      <span className="text-sm" style={{ color:'#6B7280' }}>
                        {fotos.length} foto{fotos.length !== 1 ? 's' : ''} adjunta{fotos.length !== 1 ? 's' : ''}
                      </span>
                      {fotos.length === 0 && (
                        <span className="text-xs font-medium ml-auto" style={{ color:'#F97B62' }}>
                          Se recomienda al menos 1 foto
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer botón ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile
                      px-5 pb-safe pb-6 pt-4 z-30"
           style={{ background:'linear-gradient(to top, #FFF8F5 75%, transparent)' }}>
        {paso < PASOS.length ? (
          <motion.button
            whileTap={{ scale:0.97 }}
            onClick={siguiente}
            data-testid="btn-siguiente"
            className="w-full h-16 rounded-3xl font-poppins font-bold text-white text-base
                       flex items-center justify-center gap-2"
            style={{ background:'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow:'0 8px 28px rgba(249,123,98,0.45)' }}
          >
            Continuar →
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale:0.97 }}
            disabled={cargando}
            onClick={handleSubmit}
            data-testid="btn-guardar"
            className="w-full h-16 rounded-3xl font-poppins font-bold text-white text-base
                       flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background:'linear-gradient(135deg,#FF9280,#F97B62)', boxShadow:'0 8px 28px rgba(249,123,98,0.45)' }}
          >
            {cargando
              ? <div className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              : <><Sparkles size={20} /> {esEdicion ? 'Guardar cambios' : 'Registrar mascota'}</>}
          </motion.button>
        )}
      </div>
    </div>
  );
}
