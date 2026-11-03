# Implementación: Mensajes Guardados (marcador estilo Instagram)

## Qué hace

Permite al alumno guardar respuestas individuales del Mentor y recuperarlas en
cualquier sesión desde un modal. Es el equivalente a guardar un reel en Instagram,
aplicado a las respuestas del chat.

- **Icono pequeño** (`assets/marcador0.png`): aparece en la fila de acciones debajo
  de cada respuesta del Mentor, junto a like/dislike y borrar.
- **Icono de la barra superior** (`assets/marcador2.png`): abre el modal y está
  situado entre "Emergencias" y "Sesiones 1/1", a la altura del resto de iconos.
- **Modal**: muestra fecha del mensaje, pregunta del alumno y respuesta completa
  del Mentor, con acciones para copiar o eliminar cada mensaje y "Borrar todo".

## Archivos

| Archivo | Función |
|---|---|
| `index-original.html` | Botón de la barra superior, modal y versiones de caché |
| `js/modules/saved-messages.js` | Módulo: cargar, guardar, renderizar, copiar y eliminar |
| `js/modules/elements.js` | Referencias a botón, modal y contenedor |
| `js/modules/settings.js` | Arranca `MENSAJES_GUARDADOS.setup()` al cargar el DOM |
| `main.js` | Botón de marcador en cada respuesta y guardado desde el chat |
| `css/modals.css` | Estilos del modal, tarjetas y estados |
| `css/style.css` | Estilos del botón de marcador y aviso flotante (toast) |
| `sql/09_create_table_mensajes_guardados.sql` | Tabla, índices, RLS y permisos |

## Base de datos (paso obligatorio)

Ejecutar en el SQL Editor de Supabase:

```
sql/09_create_table_mensajes_guardados.sql
```

Crea `public.mensajes_guardados` con:

- `alumno_id` → `auth.users(id)` (`ON DELETE CASCADE`)
- `mensaje_original_id` → `public.mensajes(id)` (`ON DELETE SET NULL`)
- `pregunta`, `respuesta`, `fecha`, `etiquetas`, `creada_en`
- Índice único `(alumno_id, mensaje_original_id)` para no guardar dos veces la misma respuesta
- RLS: cada alumno solo ve, inserta y borra sus propios registros

Si la tabla no existe, el modal muestra un aviso indicando que hay que ejecutar
este script.

## Comportamiento

1. El alumno pulsa el marcador bajo una respuesta.
2. Se guarda la respuesta, la pregunta anterior del alumno y la fecha del mensaje.
3. El marcador cambia a la versión rellena (`assets/marcador.png`) y aparece un
   aviso flotante no bloqueante.
4. Si ya estaba guardada, se avisa y no se duplica.
5. Desde la barra superior se abre el modal, que carga los mensajes ordenados por
   fecha de guardado (más recientes primero).

## Detalles técnicos

- El guardado solo se activa cuando la respuesta ya tiene `id` en la tabla
  `mensajes`; mientras la IA está generando o si falla el guardado, el botón
  permanece deshabilitado.
- La pregunta se obtiene del mensaje de usuario inmediatamente anterior en el DOM.
- El texto se toma del DOM final (sin el cursor de streaming ni el tag técnico).
- Todo el contenido se escapa antes de pintarse en el modal.
- Los botones de las tarjetas usan delegación de eventos, sin `onclick` inline.
- El modal se cierra con la X, con Escape o pulsando fuera.

## Comprobación manual

1. Ejecutar el SQL en Supabase.
2. Abrir `index-original.html` con sesión iniciada.
3. Enviar un mensaje y pulsar el marcador bajo la respuesta.
4. Comprobar el aviso y que el icono cambia a relleno.
5. Pulsar el marcador de la barra superior (entre Emergencias y Sesiones).
6. Verificar fecha, pregunta y respuesta; probar copiar, eliminar y "Borrar todo".
7. Recargar la página y comprobar que el mensaje sigue guardado.
