# Chat, historial y seguridad — resumen de cambios

Este documento resume lo implementado y, sobre todo, **qué hay que hacer para
desplegarlo**: aplicar una migración de base de datos y definir unas variables
de entorno. El código ya está listo; sin esos dos pasos, algunas funciones se
quedan en modo degradado.

---

## 1. Seguridad (los tres puntos pendientes de la revisión)

### `POST /api/email` protegido

Antes era un **relay de correo abierto**: cualquiera podía enviar `{userId, email}`
y (a) disparar emails por Brevo a coste del proyecto y (b) sobrescribir el token
de verificación de otra persona, secuestrando su cuenta.

Ahora:

- Exige **sesión de Supabase** y que el `userId` coincida con el usuario autenticado
  (o que quien llama sea mentor).
- Se mantiene un caso legítimo sin sesión: el **reenvío inmediato tras registrarse**,
  cuando Supabase todavía no ha creado sesión. Se acepta solo si el `userId` existe
  en Auth, su email coincide con el enviado y la cuenta **aún no está confirmada**.
- El **destinatario lo decide el servidor**, nunca el cuerpo de la petición.
- Rate limit de 5 envíos/hora por IP y **enfriamiento de 60 s** por usuario.
- El token se guarda **hasheado** (HMAC-SHA256) y se compara en tiempo constante.
- Los errores internos ya no se devuelven al cliente (`details: error.message` filtraba
  respuestas de Brevo).

`GET /api/email` sigue siendo público (el enlace llega por correo), pero ahora
compara contra el hash y limitando la tasa.

### Firmas en los webhooks

| Endpoint | Antes | Ahora |
|---|---|---|
| `/api/webhook` (Stripe) | Firma verificada (correcto) | Igual, + errores monitorizados y `500` para que Stripe reintente si Supabase falla |
| `/api/calcom-webhook` | **Sin verificación** y con `Access-Control-Allow-Origin: *` | HMAC-SHA256 obligatorio sobre el cuerpo crudo; CORS abierto eliminado |

Reglas aplicadas:

- Si hay secreto configurado, **la firma es obligatoria**.
- Si **falta** el secreto, el webhook se **rechaza** (no hay *fail-open*).
- Solo en desarrollo y con `ALLOW_UNVERIFIED_WEBHOOKS=true` se permite pasar sin firma.
- La verificación se hace sobre los **bytes exactos** del cuerpo (`bodyParser: false`),
  porque cualquier reserialización del JSON invalida el HMAC.

### Monitorización tipo Sentry

`api/_lib/monitoring.js` (sin dependencias nuevas):

- Si hay `SENTRY_DSN`, envía los eventos a la API de ingesta de Sentry
  (fire-and-forget con timeout de 2 s, para no añadir latencia).
- Si no, registra en consola de forma estructurada y guarda un buffer circular.
- **Redacta** campos sensibles (`token`, `secret`, `key`, `password`, `authorization`…).
- `withMonitoring()` envuelve los handlers: captura excepciones no controladas
  y responde `500` uniforme sin filtrar detalles.
- `GET /api/config?health=1` expone estado y últimos errores (solo mentor;
  `?ping=1` es público y mínimo). Antes vivía en `/api/health`, pero se integró
  en `config` para no superar el límite de **12 funciones** de Vercel Hobby.

---

## 2. Experiencia de chat

### Historial persistente con barra lateral

- Nueva tabla `conversaciones` y columna `mensajes.conversacion_id`.
- Al entrar, **se cargan y muestran las conversaciones anteriores** (antes solo se
  pintaban si volvías de una reserva: `cargarHistorialDesdeDB(user.id, isBookingSuccess)`).
- Barra lateral con: búsqueda (título + texto de los mensajes), **nueva conversación**,
  renombrar, eliminar y fecha/contador.
- **Volver de la búsqueda**: la cabecera de resultados tiene un botón "Volver",
  la "x" del buscador limpia el campo y, al vaciarlo, reaparece el listado
  completo con sus fechas. También `Escape` limpia la búsqueda.
- Título automático con el primer mensaje.
- **`resumen_diario` y `sistema` nunca se muestran**: son material interno para que la
  IA recupere contexto. Se filtran en la lista, en el chat, en la búsqueda y en la
  exportación.

### Exportar conversación siempre visible

- Botón de descarga en la **cabecera del chat** y en el **pie de la barra lateral**
  (antes solo existía dentro del protocolo de cierre).
- Exporta **la conversación activa** (no solo la sesión en curso), con su título.

### Valoraciones y mensajes guardados (sin cambios)

- 👍 **like**, 👎 **dislike**, 🔖 **guardar** y 🗑 **eliminar** siguen igual: se
  construyen en `crearBotonesFeedback`, que no se ha modificado.
- Las acciones nuevas (Escuchar / Regenerar) van en una **fila aparte**, debajo.
- Regenerar o borrar un mensaje **no elimina** sus mensajes guardados: la FK
  `mensaje_original_id` es `ON DELETE SET NULL`, así que se conserva la copia de
  texto y solo se pierde la referencia.

### Modal "Mensajes Guardados": una sola columna

- `.saved-messages-grid` pasa de `repeat(auto-fill, minmax(380px, 1fr))` —que en
  un modal de 900 px creaba **dos columnas desordenadas**— a una **columna única**.
- Ancho forzado y centrado: grid `max-width: 720px`, tarjetas `width: 100%`,
  y el modal baja de 900 px a **760 px** para que cabecera y tarjetas alineen.
- En móvil sigue a una columna, como ya estaba.

### Reintentar / regenerar / editar

- **Reintentar**: los errores muestran un aviso claro con botón que descarta el
  mensaje fallido y lo reenvía (sin duplicar).
- **Regenerar**: en cada respuesta de la IA.
- **Editar**: en cada mensaje del usuario; actualiza BD, contexto de la IA y DOM, y
  regenera la respuesta posterior.
- Estados de error diferenciados para problemas de red vs. fallo del modelo.

### Escuchar respuestas (TTS)

- Botón **Escuchar** en cada respuesta, usando el `/api/tts` existente.
- Limpia el Markdown antes de hablar (no lee asteriscos ni bloques de código).
- Una sola locución a la vez; el botón se para solo al terminar.

### Markdown seguro y enriquecido

- `renderSafeMarkdown` ahora: GFM (tablas, código, listas, citas), enlaces externos
  con `target="_blank"` + `rel="noopener noreferrer nofollow"`, bloqueo de `javascript:`
  y saneado con DOMPurify.
- Estilos para tablas, bloques de código, citas y enlaces dentro de la burbuja.

### Accesibilidad

- `aria-label` en todos los botones de icono.
- **Foco atrapado** en modales, cierre con `Escape` y restauración del foco.
- Navegación por teclado en la barra lateral (Enter/Espacio) y `aria-expanded`
  en el botón del historial.
- Región `aria-live` que anuncia las respuestas nuevas.
- `font-size: 16px` en inputs en móvil (evita el zoom automático de iOS).
- Foco visible consistente y respeto a `prefers-reduced-motion`.

### PWA real

- `service-worker.js`:
  - Navegación: *network-first* con caída a caché y a `offline.html`.
  - Estáticos: *stale-while-revalidate*.
  - **`/api/*`, Supabase y CDNs nunca se cachean.**
  - Aviso de versión nueva y limpieza de cachés antiguas.
- `offline.html` como página de respaldo.
- `js/modules/pwa.js`: registro del SW y aviso de versión nueva.
  **Sin botón flotante de instalación**: se solapaba con la burbuja de
  "Asistencia" (`right:25px / bottom:25px`). La instalación sigue disponible
  desde el propio navegador (icono de la barra de direcciones o menú →
  "Instalar app"), que es lo que habilita el service worker.

---

## 3. Qué tienes que hacer tú para desplegarlo

### a) Aplicar la migración SQL

Ejecuta `supabase/conversations_migration.sql` en **Supabase → SQL Editor**.

Es idempotente. Crea `conversaciones`, añade `mensajes.conversacion_id`, índices,
políticas RLS y **adopta el histórico existente** agrupándolo por día.

> Mientras no la apliques, la app sigue funcionando: la barra lateral muestra un
> aviso y el chat se comporta como un único hilo (modo degradado).

Añade además las políticas de `UPDATE`/`DELETE` sobre `mensajes`, necesarias para
editar y borrar mensajes bajo RLS (antes fallaban en silencio).

### b) Variables de entorno (Vercel → Settings → Environment Variables)

```env
# Webhook de Cal.com (Settings → Developer → Webhooks)
CALCOM_WEBHOOK_SECRET=...

# Secreto para el hash de los tokens de verificación de email
EMAIL_TOKEN_SECRET=<cadena aleatoria larga>

# Monitorización (opcional; sin DSN solo va a logs)
SENTRY_DSN=

# Solo para desarrollo local. En producción, false o sin definir.
ALLOW_UNVERIFIED_WEBHOOKS=false
```

`STRIPE_WEBHOOK_SECRET` ya existía y sigue siendo obligatorio.

### c) Comprobar

```bash
npm test
```

Ejecuta las 8 suites (seguridad, email, conversaciones, markdown, accesibilidad,
service worker y validaciones del HTML).

Las suites que usan `jsdom` se omiten con un aviso si no está instalado:

```bash
npm i -D jsdom
```

---

## 3.bis Límite de 12 funciones de Vercel (plan Hobby)

Vercel Hobby permite **12 Serverless Functions por deployment**. Al superarlo,
el deployment falla y no se publica nada.

- `api/` tenía ya **12** funciones, así que un nuevo fichero ahí rompe el deploy.
- Por eso el diagnóstico vive ahora en **`GET /api/config?health=1`** en lugar de
  en un `api/health.js` propio.
- Las rutas que empiezan por `_` **no generan función**: `api/_lib/*.js`
  (utilidades compartidas) no cuentan.
- Los tests se movieron a **`tests/`** (antes `api/_lib/__tests__/`), para que no
  puedan contarse como función ni quedar expuestos como endpoint.

Comprobación rápida antes de cada push:

```bash
npm run test:limits
```

Falla si hay más de 12, y avisa cuando estás justo en el límite. `npm test` también
lo verifica.

**Si en el futuro necesitas otra función**, tienes dos opciones: fusionarla en una
existente (como se hizo con `config`) o mover su lógica a `api/_lib/` y exponerla
desde una función ya existente.

---

## 4. Verificación manual recomendada

1. **Historial**: entra, cierra sesión y vuelve a entrar → debes ver tus
   conversaciones anteriores en la barra lateral, con búsqueda y "Nueva conversación".
2. **Exportar**: el botón de descarga debe estar visible siempre, sin esperar al cierre.
3. **Regenerar / editar**: pulsa "Regenerar" en una respuesta y edita un mensaje tuyo.
4. **Escuchar**: pulsa "Escuchar" (requiere `GOOGLE_TTS_API_KEY` o `GEMINI_API_KEY`).
5. **PWA**: en Chrome de escritorio debe aparecer "Instalar app"; con el móvil en
   modo avión, la app debe abrir y mostrar la página de "Sin conexión".
6. **Seguridad**: `curl -X POST https://tu-dominio/api/email -H "Content-Type: application/json" -d '{"userId":"x","email":"a@b.c"}'`
   debe devolver **401**, no 200.

---

## 5. Archivos tocados

| Archivo | Cambio |
|---|---|
| `api/email.js` | Autenticación, propiedad, token hasheado, rate limit |
| `api/webhook.js` | Firma Stripe robusta + monitorización + errores de Supabase |
| `api/calcom-webhook.js` | Firma HMAC obligatoria, sin CORS abierto |
| `api/config.js` | Diagnóstico mentor en `?health=1` (sustituye a `/api/health` para respetar el límite de 12 funciones) |
| `api/_lib/monitoring.js` | **Nuevo** monitorización tipo Sentry |
| `api/_lib/webhook-security.js` | **Nuevo** lectura de cuerpo crudo y HMAC |
| `supabase/conversations_migration.sql` | **Nuevo** conversaciones + RLS |
| `js/modules/conversations.js` | **Nuevo** historial, búsqueda, CRUD |
| `js/modules/a11y.js` | **Nuevo** foco, etiquetas, live region |
| `js/modules/pwa.js` | **Nuevo** registro del SW e instalación |
| `index-original.html` | Barra lateral, botones, markdown seguro, scripts |
| `css/chat-extras.css` | **Nuevo** estilos de sidebar, markdown, acciones |
| `main.js` | Historial, export, TTS, regenerar/editar/reintentar, accesibilidad |
| `service-worker.js` | **Nuevo** |
| `offline.html` | **Nuevo** |
| `.env.example` | Nuevas variables documentadas |
| `scripts/` | Suites de prueba y validadores |
