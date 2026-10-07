# Evaluación de calidad ISO/IEC 25010

Instrumento de evaluación 360° de HuellaSegura con dos encuestas, una por tipo de actor:

| Encuesta | Actores | Características evaluadas |
|---|---|---|
| 1 · Usuarios | Dueños de mascotas y ciudadanos colaboradores | Adecuación funcional, eficiencia, compatibilidad, usabilidad, fiabilidad, seguridad y portabilidad (23 ítems) |
| 2 · Administración y técnica | Administrador, desarrolladores, docentes o evaluadores expertos, entidades aliadas | Las ocho características, incluida mantenibilidad (31 ítems) |

La mantenibilidad solo se pregunta al personal técnico: un usuario final no tiene elementos para evaluar el código.

**Escala:** 1 (muy en desacuerdo) a 5 (muy de acuerdo) y N/A (no tengo elementos para evaluarlo).
**Consentimiento:** cada encuesta inicia con el consentimiento informado (Ley 1581 de 2012); quien no acepta termina sin responder. No se recoge correo ni nombre.

## Cálculo de resultados

- **% de calidad por característica** = promedio de las respuestas 1–5 (sin N/A) ÷ 5 × 100.
- **Índice global** = promedio de los % de las características evaluadas.
- Se calcula por actor y combinado (360°).
- **Niveles:** Excelente ≥ 90 % · Bueno 75–89 % · Aceptable 60–74 % · Deficiente < 60 %.

La pestaña **Resultados ISO 25010** se recalcula sola cada vez que llega una respuesta.

## Cómo crear las encuestas en Google Drive

1. Abre <https://script.google.com> con tu cuenta de Google y pulsa **Nuevo proyecto**.
2. Borra el contenido del editor y pega todo el archivo `crearEncuestasISO25010.gs`.
3. Pulsa **Guardar** (ícono de disquete).
4. En la barra superior elige la función **crearEncuestas** y pulsa **Ejecutar**.
5. Autoriza los permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a … (no seguro) → Permitir*.
   Aparece "no seguro" porque el script es tuyo y no está verificado por Google; solo accede a tu Drive y Formularios.
6. Al terminar, abre **Registro de ejecución**: muestra los enlaces de la carpeta, de las dos encuestas para compartir y de la hoja de resultados.

Todo queda en la carpeta **HuellaSegura · Evaluación ISO 25010** de tu Drive. Ejecuta `crearEncuestas` **una sola vez**; si la ejecutas de nuevo se crea otra copia.
Para recalcular los resultados a mano, ejecuta la función `actualizarResultados`.
