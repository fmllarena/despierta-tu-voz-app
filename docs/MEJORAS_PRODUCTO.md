# Mejoras de producto: métricas, portabilidad y onboarding

Resumen de lo implementado y de lo que queda pendiente a propósito.

---

## 1. Métricas de embudo (SQL)

**Fichero:** `supabase/metrics_funnel.sql` — ejecutar en *Supabase → SQL Editor*.

Crea tres vistas y deja consultas listas para lanzar. **No requiere analítica de
terceros, ni cookies, ni consentimiento añadido**: se calcula sobre datos que ya
existen.

| Vista | Qué contiene |
|---|---|
| `v_usuario_embudo` | Una fila por usuario: alta, primer mensaje, mensajes, conversaciones, guardados, plan y trial |
| `v_actividad_diaria` | Días con actividad real por usuario (excluye `resumen_diario` y `sistema`) |
| `v_metricas_diarias` | Altas, usuarios activos y mensajes por día |

Consultas incluidas:

1. **Embudo principal**: altas → escribieron → 5 mensajes → 2 hilos → guardaron → de pago.
2. **Tiempo hasta el primer mensaje** (mediana). Si es alto, el problema está en el onboarding.
3. **Activación por semana de alta**.
4. **Retención D1 / D7 / D30**.
5. **Planes y trials**, incluidos los que caducan en 7 días.
6. **Top 20 usuarios** por uso (para entrevistas).
7. **Señal de valor**: cuántos guardan algo.

### ⚠️ Seguridad (importante)

Las vistas **no tienen RLS**. Supabase concede por defecto privilegios a
`anon` y `authenticated` sobre objetos nuevos de `public`, así que el script
termina con:

```sql
REVOKE ALL ON public.v_usuario_embudo   FROM anon, authenticated;
REVOKE ALL ON public.v_actividad_diaria FROM anon, authenticated;
REVOKE ALL ON public.v_metricas_diarias FROM anon, authenticated;
```

Sin esos `REVOKE`, cualquier usuario autenticado podría leer métricas de **todos**
los usuarios (las vistas se ejecutan con permisos de su owner). No los quites.

---

## 2. Exportación de datos del usuario (RGPD art. 20)

**Fichero:** `js/modules/data-export.js` · **Botón:** Ajustes → *Descargar mis datos (JSON)*.

Descarga un JSON con:

- **Titular**: id, email, alta y último acceso.
- **Perfil**: `user_profiles` (incluye plan, trial y consentimientos aceptados).
- **Conversaciones**: `conversaciones`.
- **Mensajes**: `mensajes`, **todos los emisores**, incluidos los resúmenes internos
  (`resumen_diario`), porque también son datos personales derivados de sus charlas.
- **Progreso**: `user_coaching_data`.
- **Mensajes guardados**: `mensajes_guardados`.

Detalles de diseño:

- Se ejecuta **en el cliente con la sesión del usuario**, así que las políticas RLS
  garantizan que solo se leen sus filas.
- **No necesita ninguna función nueva** (Vercel está en 12/12).
- Si una tabla falla (RLS, tabla inexistente…), el resto **se exporta igual** y el
  error se anota en `avisos` y se muestra junto al botón.
- Nombre del fichero: `mis-datos-despierta-tu-voz-AAAA-MM-DD.json`.

> Alternativa futura: moverlo a una *Supabase Edge Function* (como
> `delete-user-account`) si se prefiere un export firmado y auditable en servidor.
> Las Edge Functions **no cuentan** en el límite de Vercel.

---

## 3. Onboarding dosificado

**Fichero:** `js/modules/tour.js`.

El tour tenía **16 pasos** lanzados de golpe antes de que el usuario escribiera
nada. Ahora son **6**, en este orden:

1. Bienvenida (explica que son cuatro pasos y dónde está el resto).
2. **Caja de chat** — la única acción obligatoria para empezar.
3. Mi Viaje.
4. Mi Progreso (avisa de que al principio estará vacío).
5. S.O.S Vocal.
6. Guía `?` — donde está todo lo demás.

Ya no señala funciones de pago (`#sesionBtn`, `#upgradeBtn`) que un usuario free
no ve. El resto de funciones siguen documentadas en la guía `?` y se explican en
el momento de usarlas.

---

## 4. Estados vacíos

### Mi Progreso

Antes, sin datos se dibujaba un **gráfico vacío**. Ahora se muestra un estado
propio: explica qué aparecerá ahí (actividad mensual, módulos, minutos de sesión)
y ofrece un botón que cierra el modal y enfoca la caja de chat.

### Sesiones 1:1

Antes solo decía «Tu plan actual no incluye sesiones 1/1». Ahora explica **qué
son** (una hora al mes con el mentor), menciona el plan que las incluye y ofrece
un botón que cierra el modal de sesiones y abre el de planes.

---

## 5. Cómo comprobarlo

```bash
npm test
```

La suite `tests/product-improvements.test.js` (16 comprobaciones) cubre:

- La exportación incluye todas las secciones y **no** filas de otros usuarios.
- Si una tabla falla, el resto se exporta y queda constancia en `avisos`.
- El nombre del fichero lleva la fecha.
- Progreso sin actividad → estado vacío, **sin** `<canvas>`.
- Con actividad → sí pinta el gráfico.
- Sesiones sin plan → explica y ofrece el CTA que abre el modal de planes.
- El tour tiene 6 pasos, empieza por el chat, no señala funciones de pago y
  termina en la guía.

---

## 6. Pendiente a propósito

| Tema | Estado |
|---|---|
| Trial visible (días restantes) | **No implementado.** `trial_end_date` se guarda y hay cron + emails, pero la app no lo muestra. Es la mejora con mejor relación impacto/esfuerzo que queda. |
| Banner de cookies | **No implementado.** No hay analítica de terceros, así que no es obligatorio todavía. Es precondición si algún día se añade. |
| i18n de la interfaz | **Descartado por ahora.** Semanas de trabajo; el mentor ya responde en varios idiomas, así que el producto es usable. |
| Analítica de producto | **No implementada.** Se decidió empezar por las métricas SQL, que dan el 70 % de las decisiones sin coste legal. |
