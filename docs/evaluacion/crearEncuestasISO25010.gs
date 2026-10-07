/**
 * HuellaSegura — Instrumento de evaluación de calidad ISO/IEC 25010 (evaluación 360°)
 *
 * Crea en Google Drive:
 *   1. Encuesta 1: Usuarios (dueños de mascotas y ciudadanos colaboradores)
 *   2. Encuesta 2: Administrador y personal técnico
 *   3. Una hoja de cálculo con las respuestas de ambas y la pestaña "Resultados ISO 25010",
 *      que se recalcula sola cada vez que alguien responde.
 *
 * Uso: en https://script.google.com → Nuevo proyecto → pegar este archivo → Guardar →
 * elegir la función "crearEncuestas" → Ejecutar → autorizar con tu cuenta de Google.
 * Al terminar, el registro de ejecución muestra los enlaces de las encuestas y de la hoja.
 */

const ESCALA = [
  '1 · Muy en desacuerdo',
  '2 · En desacuerdo',
  '3 · Ni de acuerdo ni en desacuerdo',
  '4 · De acuerdo',
  '5 · Muy de acuerdo',
  'N/A · No tengo elementos para evaluarlo',
];

// Niveles de interpretación del porcentaje de calidad (promedio / 5 × 100)
const NIVELES = [
  { minimo: 90, nombre: 'Excelente' },
  { minimo: 75, nombre: 'Bueno' },
  { minimo: 60, nombre: 'Aceptable' },
  { minimo: 0, nombre: 'Deficiente' },
];

const CONSENTIMIENTO =
  'Esta encuesta hace parte del trabajo de grado "Desarrollo de un prototipo de aplicación web para la ' +
  'localización y recuperación de mascotas perdidas" (Universidad Mariana, Ingeniería de Sistemas). ' +
  'Las respuestas son anónimas, se usan solo con fines académicos y se tratan conforme a la Ley 1581 de 2012. ' +
  'No se recopila tu correo ni tu nombre.';

// ─── Encuesta 1: usuarios finales ────────────────────────────────────────────
const ENCUESTA_USUARIOS = {
  titulo: 'HuellaSegura · Evaluación de calidad (usuarios)',
  descripcion:
    'Evalúa tu experiencia con HuellaSegura, la plataforma para reportar y encontrar mascotas perdidas en Pasto. ' +
    'Toma unos 7 minutos. Responde según lo que hayas usado; si no usaste una función, marca N/A.',
  perfil: [
    { tipo: 'opcion', titulo: '¿Cómo usaste HuellaSegura?', opciones: [
      'Como dueño(a) de mascota (registré mi mascota o hice un reporte)',
      'Como ciudadano(a) colaborador(a) (vi el mapa, reporté un avistamiento o escaneé un QR)',
      'De ambas formas',
    ] },
    { tipo: 'opcion', titulo: 'Edad', opciones: ['18 a 25 años', '26 a 35 años', '36 a 45 años', '46 a 55 años', 'Más de 55 años'] },
    { tipo: 'opcion', titulo: '¿Con qué frecuencia la usaste?', opciones: ['Una sola vez', 'Varias veces', 'Semanalmente', 'Casi a diario'] },
    { tipo: 'opcion', titulo: 'Dispositivo principal', opciones: ['Celular Android', 'iPhone', 'Computador', 'Tablet'] },
    { tipo: 'opcion', titulo: 'Navegador', opciones: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Otro / no sé'] },
    { tipo: 'casillas', titulo: '¿Qué funciones usaste? (marca todas las que apliquen)', opciones: [
      'Registro e inicio de sesión', 'Registrar una mascota con fotos o video', 'Reportar una mascota perdida',
      'Mapa de mascotas perdidas', 'Alertas por proximidad', 'Reportar un avistamiento',
      'Código QR / carnet de la mascota', 'Directorio de veterinarias y refugios',
      'Compartir en WhatsApp o Facebook', 'Cartel PDF para imprimir',
    ] },
  ],
  caracteristicas: [
    { nombre: 'Adecuación funcional', ayuda: '¿La plataforma hace lo que necesitas?', preguntas: [
      'Pude registrar a mi mascota con los datos y fotos necesarios para identificarla.',
      'Reportar una mascota perdida con su ubicación fue completo y sencillo.',
      'El mapa muestra correctamente las mascotas perdidas y su ubicación.',
      'El perfil que abre el código QR muestra la información correcta para contactar al dueño.',
      'Las alertas y avisos que recibí fueron útiles para ayudar en la búsqueda.',
    ] },
    { nombre: 'Eficiencia del desempeño', ayuda: 'Rapidez de la plataforma.', preguntas: [
      'La aplicación carga rápido en mi celular.',
      'El mapa, las fotos y los formularios responden sin demoras molestas.',
    ] },
    { nombre: 'Compatibilidad', ayuda: 'Funcionamiento junto a otras aplicaciones.', preguntas: [
      'Compartir un reporte por WhatsApp o Facebook funcionó correctamente.',
      'El código QR se puede leer con la cámara del celular sin instalar otra aplicación.',
      'Los correos de la plataforma (alertas, confirmaciones, recuperación de contraseña) me llegaron bien.',
    ] },
    { nombre: 'Usabilidad', ayuda: 'Facilidad de uso, aprendizaje y presentación.', preguntas: [
      'Aprendí a usar la plataforma rápidamente.',
      'Puedo realizar lo que necesito sin pedir ayuda.',
      'Los mensajes de error y las instrucciones son claros.',
      'Los textos, botones e íconos se leen y se tocan con facilidad.',
      'El diseño de la aplicación es agradable.',
    ] },
    { nombre: 'Fiabilidad', ayuda: 'Estabilidad de la plataforma.', preguntas: [
      'La aplicación funcionó de forma estable, sin cierres ni errores inesperados.',
      'La información que registré no se perdió.',
      'Cuando algo falló, la aplicación me indicó qué pasó y pude continuar.',
    ] },
    { nombre: 'Seguridad', ayuda: 'Protección de tus datos.', preguntas: [
      'Confío en que la plataforma protege mis datos personales.',
      'El perfil público de la mascota muestra solo la información necesaria (no mi correo).',
      'Tengo control sobre mi información: activar o desactivar mi ubicación y eliminar mi cuenta.',
    ] },
    { nombre: 'Portabilidad', ayuda: 'Uso en distintos dispositivos.', preguntas: [
      'La aplicación funciona bien en el dispositivo que uso.',
      'Pude usarla (o instalarla en la pantalla de inicio) sin necesidad de descargar una app de una tienda.',
    ] },
  ],
  cierre: [
    { tipo: 'escala', titulo: 'En general, ¿qué tan satisfecho(a) estás con HuellaSegura?', min: 1, max: 5, etiquetaMin: 'Nada satisfecho', etiquetaMax: 'Muy satisfecho' },
    { tipo: 'opcion', titulo: '¿Recomendarías HuellaSegura a otras personas de Pasto?', opciones: ['Sí', 'Tal vez', 'No'] },
    { tipo: 'parrafo', titulo: '¿Qué mejorarías o qué te gustó más? (opcional)', opcional: true },
  ],
};

// ─── Encuesta 2: administrador y personal técnico ───────────────────────────
const ENCUESTA_TECNICA = {
  titulo: 'HuellaSegura · Evaluación de calidad (administración y personal técnico)',
  descripcion:
    'Evaluación técnica de HuellaSegura para quienes administran la plataforma o revisan su construcción ' +
    '(administradores, desarrolladores, docentes o evaluadores expertos). Toma unos 10 minutos. ' +
    'Si no tienes elementos para evaluar un aspecto, marca N/A.',
  perfil: [
    { tipo: 'opcion', titulo: 'Rol', opciones: [
      'Administrador(a) de la plataforma', 'Desarrollador(a) / personal técnico',
      'Docente o evaluador(a) experto(a)', 'Personal de entidad aliada (veterinaria, refugio, centro de bienestar)',
    ] },
    { tipo: 'opcion', titulo: 'Experiencia en desarrollo o gestión de software', opciones: ['Ninguna', 'Menos de 1 año', '1 a 3 años', 'Más de 3 años'] },
    { tipo: 'casillas', titulo: '¿Qué revisaste? (marca todas las que apliquen)', opciones: [
      'Panel de administración', 'Gestión de usuarios y moderación de reportes', 'Directorio de entidades aliadas',
      'Reporte semanal en PDF', 'Funciones de usuario (reportes, mapa, QR, alertas)',
      'Código fuente en GitHub', 'Documentación técnica', 'Instalación o despliegue',
    ] },
  ],
  caracteristicas: [
    { nombre: 'Adecuación funcional', ayuda: 'Completitud, corrección y pertinencia funcional.', preguntas: [
      'El panel de administración muestra estadísticas correctas (usuarios, reportes activos y resueltos).',
      'La gestión de usuarios y la moderación de reportes permiten controlar el contenido de la plataforma.',
      'El directorio de entidades aliadas puede crearse, editarse y eliminarse correctamente.',
      'El reporte semanal en PDF contiene la información esperada (casos activos y resueltos).',
      'El sistema cumple los requisitos funcionales planteados (registro, reportes, mapa, alertas, avistamientos, QR).',
    ] },
    { nombre: 'Eficiencia del desempeño', ayuda: 'Tiempos de respuesta y uso de recursos.', preguntas: [
      'Las páginas y el panel responden en tiempos adecuados.',
      'Las consultas a la base de datos responden con rapidez (índices, consultas optimizadas).',
      'La plataforma opera con recursos razonables para un prototipo en planes gratuitos o de bajo costo.',
    ] },
    { nombre: 'Compatibilidad', ayuda: 'Coexistencia e interoperabilidad.', preguntas: [
      'La integración con servicios externos (Cloudinary, correo, OpenStreetMap) funciona correctamente.',
      'La API REST permite comunicar el frontend y el backend de forma clara y consistente.',
      'Los documentos generados (PDF, imagen del QR) pueden usarse en otros programas o imprimirse sin problemas.',
    ] },
    { nombre: 'Usabilidad', ayuda: 'Para las tareas de administración.', preguntas: [
      'El panel de administración es fácil de entender y usar.',
      'Puedo realizar tareas de moderación y gestión sin ayuda externa.',
      'Los mensajes del sistema ayudan a evitar y corregir errores de operación.',
    ] },
    { nombre: 'Fiabilidad', ayuda: 'Madurez, disponibilidad, tolerancia a fallos y recuperación.', preguntas: [
      'La plataforma se mantiene disponible y estable durante su uso.',
      'Si falla un servicio externo (por ejemplo, el correo), la plataforma sigue funcionando.',
      'La base de datos puede reconstruirse desde cero o restaurarse (migraciones, respaldos).',
    ] },
    { nombre: 'Seguridad', ayuda: 'Confidencialidad, integridad, autenticidad y responsabilidad.', preguntas: [
      'El acceso está controlado por roles: un usuario no puede entrar al panel de administración.',
      'Las contraseñas se almacenan cifradas y las sesiones expiran o pueden cerrarse.',
      'La plataforma resiste usos abusivos (límite de intentos de inicio de sesión y de envíos públicos).',
      'No hay credenciales ni datos sensibles expuestos en el código o en el repositorio.',
      'El tratamiento de datos personales es coherente con la Ley 1581 de 2012.',
    ] },
    { nombre: 'Mantenibilidad', ayuda: 'Modularidad, reusabilidad, analizabilidad, modificabilidad y capacidad de prueba.', preguntas: [
      'La arquitectura en capas (presentación, API, datos) está claramente separada.',
      'El código es legible y sigue un estilo consistente.',
      'Sería sencillo modificar o agregar una funcionalidad sin afectar el resto del sistema.',
      'La documentación técnica (README, arquitectura, base de datos) es suficiente para entender el sistema.',
      'Las pruebas automatizadas y la integración continua permiten detectar errores antes de publicar cambios.',
    ] },
    { nombre: 'Portabilidad', ayuda: 'Adaptabilidad, facilidad de instalación y de reemplazo.', preguntas: [
      'El sistema puede instalarse en otro equipo siguiendo la documentación.',
      'El despliegue en la nube es reproducible (variables de entorno, migraciones automáticas).',
      'El sistema podría adaptarse a otra ciudad o cambiar de proveedor de servicios con un esfuerzo razonable.',
      'La aplicación funciona en distintos dispositivos y navegadores.',
    ] },
  ],
  cierre: [
    { tipo: 'escala', titulo: 'En general, ¿cómo calificas la calidad técnica de HuellaSegura?', min: 1, max: 5, etiquetaMin: 'Muy baja', etiquetaMax: 'Muy alta' },
    { tipo: 'parrafo', titulo: 'Fortalezas y aspectos por mejorar (opcional)', opcional: true },
  ],
};

// ─── Creación ────────────────────────────────────────────────────────────────
function crearEncuestas() {
  const carpeta = DriveApp.createFolder('HuellaSegura · Evaluación ISO 25010');
  const hoja = SpreadsheetApp.create('HuellaSegura · Respuestas y resultados ISO 25010');
  DriveApp.getFileById(hoja.getId()).moveTo(carpeta);

  const formUsuarios = construirFormulario(ENCUESTA_USUARIOS, carpeta);
  const formTecnica = construirFormulario(ENCUESTA_TECNICA, carpeta);

  formUsuarios.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());
  formTecnica.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());
  SpreadsheetApp.flush();
  renombrarHojaDeRespuestas(hoja, formUsuarios, 'Respuestas · Usuarios');
  renombrarHojaDeRespuestas(hoja, formTecnica, 'Respuestas · Técnica');

  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    FORM_USUARIOS: formUsuarios.getId(),
    FORM_TECNICA: formTecnica.getId(),
    HOJA: hoja.getId(),
  });

  // Recalcular los resultados cada vez que alguien responda cualquiera de las dos
  ScriptApp.newTrigger('actualizarResultados').forForm(formUsuarios).onFormSubmit().create();
  ScriptApp.newTrigger('actualizarResultados').forForm(formTecnica).onFormSubmit().create();

  actualizarResultados();
  // Elimina la pestaña vacía que Google crea por defecto ("Hoja 1" / "Sheet1")
  hoja.getSheets()
    .filter((s) => !s.getFormUrl() && /^(Hoja|Sheet) ?1$/.test(s.getName()))
    .forEach((s) => hoja.deleteSheet(s));

  Logger.log('Carpeta: ' + carpeta.getUrl());
  Logger.log('Encuesta 1 (usuarios) para compartir: ' + formUsuarios.getPublishedUrl());
  Logger.log('Encuesta 2 (técnica) para compartir: ' + formTecnica.getPublishedUrl());
  Logger.log('Hoja de respuestas y resultados: ' + hoja.getUrl());
}

function construirFormulario(def, carpeta) {
  const form = FormApp.create(def.titulo);
  DriveApp.getFileById(form.getId()).moveTo(carpeta);
  form.setDescription(def.descripcion)
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage('¡Gracias! Tu evaluación ayuda a mejorar HuellaSegura.');

  // Consentimiento (Ley 1581): si no acepta, la encuesta termina
  const consentimiento = form.addMultipleChoiceItem()
    .setTitle('Consentimiento informado')
    .setHelpText(CONSENTIMIENTO)
    .setRequired(true);

  const paginaPerfil = form.addPageBreakItem().setTitle('Datos del evaluador');
  def.perfil.forEach((p) => agregarPregunta(form, p));

  consentimiento.setChoices([
    consentimiento.createChoice('Acepto participar', paginaPerfil),
    consentimiento.createChoice('No acepto', FormApp.PageNavigationType.SUBMIT),
  ]);

  def.caracteristicas.forEach((c) => {
    form.addPageBreakItem()
      .setTitle(c.nombre)
      .setHelpText(c.ayuda + ' Escala: 1 = muy en desacuerdo, 5 = muy de acuerdo.');
    form.addGridItem()
      .setTitle(c.nombre)
      .setRows(c.preguntas)
      .setColumns(ESCALA)
      .setRequired(true);
  });

  form.addPageBreakItem().setTitle('Valoración general');
  def.cierre.forEach((p) => agregarPregunta(form, p));
  return form;
}

function agregarPregunta(form, p) {
  if (p.tipo === 'opcion') {
    form.addMultipleChoiceItem().setTitle(p.titulo).setChoiceValues(p.opciones).setRequired(!p.opcional);
  } else if (p.tipo === 'casillas') {
    form.addCheckboxItem().setTitle(p.titulo).setChoiceValues(p.opciones).setRequired(!p.opcional);
  } else if (p.tipo === 'escala') {
    form.addScaleItem().setTitle(p.titulo).setBounds(p.min, p.max)
      .setLabels(p.etiquetaMin, p.etiquetaMax).setRequired(!p.opcional);
  } else if (p.tipo === 'parrafo') {
    form.addParagraphTextItem().setTitle(p.titulo).setRequired(!p.opcional);
  }
}

function renombrarHojaDeRespuestas(hoja, form, nombre) {
  hoja.getSheets().forEach((s) => {
    const enlazado = s.getFormUrl();
    if (enlazado && enlazado.indexOf(form.getId()) !== -1) s.setName(nombre);
  });
}

// ─── Cálculo de resultados ───────────────────────────────────────────────────
/**
 * % de calidad por característica = (promedio de las respuestas 1–5, sin N/A) / 5 × 100.
 * Índice global = promedio de los % de las características evaluadas.
 * Se calcula por encuesta (actor) y para la evaluación 360° combinada.
 */
function actualizarResultados() {
  const props = PropertiesService.getScriptProperties();
  const hoja = SpreadsheetApp.openById(props.getProperty('HOJA'));
  const fuentes = [
    { actor: 'Usuarios', form: FormApp.openById(props.getProperty('FORM_USUARIOS')), def: ENCUESTA_USUARIOS },
    { actor: 'Administración y técnica', form: FormApp.openById(props.getProperty('FORM_TECNICA')), def: ENCUESTA_TECNICA },
  ];

  // Acumuladores: actor → característica → { suma, n, na }
  const datos = {};
  const respuestasPorActor = {};
  fuentes.forEach(({ actor, form, def }) => {
    datos[actor] = {};
    def.caracteristicas.forEach((c) => { datos[actor][c.nombre] = { suma: 0, n: 0, na: 0 }; });
    const respuestas = form.getResponses().filter(aceptoConsentimiento);
    respuestasPorActor[actor] = respuestas.length;
    respuestas.forEach((r) => {
      r.getItemResponses().forEach((ir) => {
        if (ir.getItem().getType() !== FormApp.ItemType.GRID) return;
        const acc = datos[actor][ir.getItem().getTitle()];
        if (!acc) return;
        (ir.getResponse() || []).forEach((valor) => {
          const numero = parseInt(String(valor), 10);
          if (numero >= 1 && numero <= 5) { acc.suma += numero; acc.n += 1; } else if (valor) { acc.na += 1; }
        });
      });
    });
  });

  const caracteristicas = [];
  fuentes.forEach(({ def }) => def.caracteristicas.forEach((c) => {
    if (caracteristicas.indexOf(c.nombre) === -1) caracteristicas.push(c.nombre);
  }));

  const filas = [];
  const porcentajesGlobales = { combinado: [] };
  fuentes.forEach(({ actor }) => { porcentajesGlobales[actor] = []; });

  caracteristicas.forEach((nombre) => {
    const fila = [nombre];
    let sumaTotal = 0;
    let nTotal = 0;
    fuentes.forEach(({ actor }) => {
      const acc = datos[actor][nombre];
      if (!acc) { fila.push('—', '—', '—'); return; }
      sumaTotal += acc.suma;
      nTotal += acc.n;
      if (acc.n === 0) { fila.push(0, '—', '—'); return; }
      const promedio = acc.suma / acc.n;
      const porcentaje = (promedio / 5) * 100;
      porcentajesGlobales[actor].push(porcentaje);
      fila.push(acc.n, redondear(promedio), redondear(porcentaje));
    });
    if (nTotal === 0) {
      fila.push('—', '—', '—');
    } else {
      const porcentaje = (sumaTotal / nTotal / 5) * 100;
      porcentajesGlobales.combinado.push(porcentaje);
      fila.push(redondear(sumaTotal / nTotal), redondear(porcentaje), nivel(porcentaje));
    }
    filas.push(fila);
  });

  const encabezado = ['Característica ISO/IEC 25010'];
  fuentes.forEach(({ actor }) => encabezado.push(actor + ' · nº de valoraciones', actor + ' · promedio (1–5)', actor + ' · % calidad'));
  encabezado.push('360° · promedio (1–5)', '360° · % calidad', '360° · nivel');

  const global = ['ÍNDICE GLOBAL DE CALIDAD'];
  fuentes.forEach(({ actor }) => {
    const ps = porcentajesGlobales[actor];
    const n = respuestasPorActor[actor];
    global.push(n + (n === 1 ? ' encuesta' : ' encuestas'), '', ps.length ? redondear(promedioDe(ps)) : '—');
  });
  const pg = porcentajesGlobales.combinado;
  global.push('', pg.length ? redondear(promedioDe(pg)) : '—', pg.length ? nivel(promedioDe(pg)) : '—');

  let hojaRes = hoja.getSheetByName('Resultados ISO 25010');
  if (!hojaRes) hojaRes = hoja.insertSheet('Resultados ISO 25010', 0);
  hojaRes.clear();
  const todo = [encabezado].concat(filas, [global]);
  hojaRes.getRange(1, 1, todo.length, encabezado.length).setValues(todo);
  hojaRes.getRange(1, 1, 1, encabezado.length).setFontWeight('bold').setBackground('#F97B62').setFontColor('white').setWrap(true);
  hojaRes.getRange(todo.length, 1, 1, encabezado.length).setFontWeight('bold').setBackground('#FFF0EA');
  hojaRes.setFrozenRows(1);
  hojaRes.setColumnWidth(1, 230);

  const notas = [
    ['Cómo se calcula'],
    ['% calidad = promedio de las respuestas de 1 a 5 (sin contar N/A) ÷ 5 × 100.'],
    ['Índice global = promedio de los % de calidad de las características evaluadas.'],
    ['360° combina las dos encuestas. Mantenibilidad solo la evalúa el personal técnico.'],
    ['Niveles: Excelente ≥ 90 % · Bueno 75–89 % · Aceptable 60–74 % · Deficiente < 60 %.'],
    ['Se excluyen las respuestas que no aceptaron el consentimiento. Actualizado: ' + new Date().toLocaleString('es-CO')],
  ];
  hojaRes.getRange(todo.length + 2, 1, notas.length, 1).setValues(notas);
  hojaRes.getRange(todo.length + 2, 1).setFontWeight('bold');
}

function aceptoConsentimiento(respuesta) {
  return respuesta.getItemResponses().some((ir) =>
    ir.getItem().getTitle() === 'Consentimiento informado' && ir.getResponse() === 'Acepto participar');
}

function nivel(porcentaje) {
  for (let i = 0; i < NIVELES.length; i += 1) if (porcentaje >= NIVELES[i].minimo) return NIVELES[i].nombre;
  return 'Deficiente';
}

function promedioDe(lista) {
  return lista.reduce((a, b) => a + b, 0) / lista.length;
}

function redondear(x) {
  return Math.round(x * 10) / 10;
}
