# Trazabilidad: requisitos de la tesis → sistema

Estados: **IMPLEMENTADO** (verificado con pruebas), **PARCIAL**, **PENDIENTE** (fuera del código o no verificable aquí).
Las verificaciones E2E corresponden a `backend/tests/e2e/flujoCompleto.e2e.mjs` contra MySQL real.

## Requisitos funcionales

| Req. | Funcionalidad | Código principal | Estado | Evidencia |
|---|---|---|---|---|
| R1 registroUsuario | Registro con nombre, correo, contraseña y celular | `authRoutes`, `authController.register`, `Register.jsx`, migración 11 | IMPLEMENTADO | E2E: celular obligatorio, registro, correo duplicado |
| R2 inicioSesion | Login con JWT de 24 h | `authController.login`, `config/jwt.js`, `AuthContext` | IMPLEMENTADO | E2E: JWT válido, exp = 24 h, mensaje genérico |
| R3 registroMascota | Datos de la mascota en formulario por pasos | `mascotaController`, `MascotaForm.jsx` | IMPLEMENTADO | E2E + `sprint2-mascotas.test.js` |
| R4 cargaImagenes | Hasta 5 fotos JPG/PNG en Cloudinary | `subirFotos`, `uploadMiddleware` | IMPLEMENTADO | Pruebas unitarias de subida |
| R5 cargaVideos | 1 video MP4/WebM/MOV ≤ 30 MB | `subirVideo`, `uploadVideo`, migración 13 | IMPLEMENTADO | Prueba de rechazo de formato; la subida real depende de credenciales de Cloudinary |
| R6 registroUbicacionPerdida | Reporte con mascota, ubicación GPS o manual y descripción | `reporteController.crear`, `CrearReporte.jsx` | IMPLEMENTADO | E2E + `CrearReporte.test.jsx` + prueba visual |
| R7 reporteAvistamiento | Avistamiento con foto y GPS sin cuenta | `avistamientoController`, `ReportarAvistamiento.jsx` | IMPLEMENTADO | E2E: avistamiento anónimo y aviso al dueño |
| R8 sistemaAlertas | Alerta a usuarios cercanos al crear un reporte | `notificacionService` (Haversine) | IMPLEMENTADO | E2E: vecino a 1.0 km recibe la alerta |
| R9 notificacionesBusqueda | Notificación interna, tiempo real y correo dentro del radio | `notificacionService`, `tiempoRealService`, `NotificacionesContext` | IMPLEMENTADO | Prueba unitaria de SSE + correo; E2E |
| R10 consultaMascotasPerdidas | Listado/mapa con filtros | `reporteController.listarActivos`, `MapaPrincipal.jsx` | IMPLEMENTADO | E2E; filtros por especie, fecha y texto |
| R11 registroMascotaEncontrada | Reporte por terceros de una mascota registrada vista o encontrada | Flujo de avistamiento (QR / mapa) + estado `encontrada` | IMPLEMENTADO (alcance: mascotas registradas) | Decisión aprobada: R11 lista "Object mascota" entre sus atributos |

## Historias de usuario

| HU | Estado | Nota |
|---|---|---|
| HU-01 Registro | IMPLEMENTADO | Contraseña ≥ 8, correo duplicado, formato de correo |
| HU-02 Login | IMPLEMENTADO | |
| HU-03 Logout | IMPLEMENTADO | `token_version` invalida el token (E2E) |
| HU-04 BD inicial | IMPLEMENTADO | 15 migraciones reconstruyen la BD |
| HU-05 a HU-08 Mascotas | IMPLEMENTADO | |
| HU-09 Crear reporte | IMPLEMENTADO | **Estaba roto** (enviaba `mascota_id: null`); corregido |
| HU-10, HU-13 Mapa | IMPLEMENTADO | Teselas de **OpenStreetMap** (CARTO exigía API key) |
| HU-11 Estados del reporte | IMPLEMENTADO | |
| HU-12 Listado de reportes | IMPLEMENTADO | |
| HU-14 Filtro por especie | IMPLEMENTADO | |
| HU-15 Ficha emergente | IMPLEMENTADO | |
| HU-16 Mi ubicación | IMPLEMENTADO | |
| HU-17 Notificación por proximidad | IMPLEMENTADO | **No funcionaba**: nunca se enviaba la ubicación del usuario |
| HU-18 Panel con leído/no leído | IMPLEMENTADO | Contador visible en la navegación |
| HU-19 Radio 1–10 km | IMPLEMENTADO | |
| HU-20 Correo al propietario | IMPLEMENTADO | |
| HU-21 Avistamiento | IMPLEMENTADO | |
| HU-22 QR descargable | IMPLEMENTADO | PNG (E2E) |
| HU-23 Perfil público | IMPLEMENTADO | Muestra teléfono y primer nombre |
| HU-24 Aviso de avistamiento | IMPLEMENTADO | |
| HU-25 Panel admin | IMPLEMENTADO | |
| HU-26 Gestión de usuarios | IMPLEMENTADO | |
| HU-27 Directorio de aliados | IMPLEMENTADO | Horario, CRUD admin, ícono de corazón en el mapa |
| HU-28 Moderación | IMPLEMENTADO | |
| HU-29 Compartir | IMPLEMENTADO | Facebook y WhatsApp con vista previa Open Graph |
| HU-30 PDF semanal | IMPLEMENTADO | Automático los lunes por correo a admins + descarga; **la descarga estaba rota** |
| HU-31 Cartel A4 | IMPLEMENTADO | PDF con foto y QR |
| HU-32 a HU-35 Sprint 9 | PARCIAL | Pruebas automatizadas e índices hechos; las pruebas multi-navegador y el registro de pruebas manuales son del equipo |

## Requisitos no funcionales

| RNF | Estado | Nota |
|---|---|---|
| RNF-01 Carga < 3 s en 4G | PENDIENTE | No medido; build de 820 KB precacheado por la PWA. Medir con Lighthouse sobre el despliegue |
| RNF-02 Consultas < 500 ms | IMPLEMENTADO | 19 ms en E2E con índices |
| RNF-03 Disponibilidad 99 % | PENDIENTE | Operativo; depende del plan de Railway/Vercel |
| RNF-04 HTTPS | IMPLEMENTADO en despliegue | Vercel y Railway sirven HTTPS |
| RNF-05 bcrypt costo ≥ 10 | IMPLEMENTADO | Verificado en la BD (E2E) |
| RNF-06 JWT ≤ 24 h | IMPLEMENTADO | Verificado (E2E) |
| RNF-07 SUS ≥ 70 | PENDIENTE | Evaluación con usuarios (objetivo 3 de la tesis) |
| RNF-08 Chrome, Firefox, Safari | PENDIENTE | Probado en Chromium; falta Firefox y Safari |
| RNF-09 Responsive 320–1920 px | IMPLEMENTADO | Diseño móvil; en escritorio se muestra centrado en una columna |
| RNF-10 GitHub con ramas por sprint | PARCIAL | Commits descriptivos en `main`; no hay ramas por sprint en el historial |
| RNF-11 Ley 1581 | IMPLEMENTADO | Consentimientos, perfil público mínimo y no enumerable (código aleatorio en el QR), retiro de ubicación y eliminación de cuenta que también borra fotos y videos en Cloudinary |

## Diferencias entre el documento de la tesis y el sistema

| Tema | Tesis | Sistema | Recomendación |
|---|---|---|---|
| Framework CSS | Bootstrap 5 | Tailwind CSS 3 | Corregir el texto de la tesis |
| Mapa | Leaflet + OpenStreetMap | Leaflet + OpenStreetMap | Coincide (se corrigió el uso de CARTO) |
| Entidad Imagen (Fig. 19) | Tabla propia | JSON en `mascotas` + `video_url` | Actualizar la Fig. 19 |
| Avistamientos | No aparece en la Fig. 19 | Tabla `avistamientos` | Agregarla a la Fig. 19 |
| Tiempo real | Alerta interna + correo | Además, eventos SSE | Mencionarlo en la arquitectura |
