# 🔧 Solución: Emails de Inactividad No Se Envían

## Problema Identificado

La Edge Function `daily-retention-job` tiene un **bug en la consulta** que busca usuarios inactivos:

```typescript
// ❌ CÓDIGO ANTERIOR (INCORRECTO)
.lte('last_active_at', isoInact);
```

**Problema**: Si `last_active_at` es `NULL` (usuarios que nunca han tenido actividad registrada), **NO se incluyen en la consulta**.

---

## ✅ Solución Implementada

He corregido la función para que incluya usuarios con `last_active_at = NULL` usando `created_at` como fallback:

```typescript
// ✅ CÓDIGO NUEVO (CORRECTO)
.or(`last_active_at.lte.${isoInact},and(last_active_at.is.null,created_at.lte.${isoInact})`)
```

**Archivo modificado**: `supabase/functions/daily-retention-job/index.ts`

---

## 📋 Pasos para Aplicar la Solución

### 1. Ejecutar el diagnóstico SQL (OPCIONAL)

Para confirmar que hay usuarios con `last_active_at = NULL`:

```sql
-- Ver usuarios afectados
SELECT 
    user_id,
    email,
    created_at,
    last_active_at,
    email_inactividad_10_enviado
FROM user_profiles
WHERE last_active_at IS NULL
  AND email_inactividad_10_enviado = false
  AND created_at < (NOW() - INTERVAL '10 days')
ORDER BY created_at DESC
LIMIT 10;
```

**Archivo**: `supabase/diagnostico_inactividad.sql`

---

### 2. Desplegar la función corregida

Desde la terminal:

```bash
cd c:\Projects\appDTV\despierta-tu-voz-app

# Desplegar la función actualizada
supabase functions deploy daily-retention-job
```

O desde la consola de Supabase:
1. Ve a Edge Functions
2. Busca `daily-retention-job`
3. Haz clic en "Deploy" o sube el archivo manualmente

---

### 3. Ejecutar manualmente para enviar emails pendientes

**Opción A - Desde terminal**:
```bash
supabase functions invoke daily-retention-job --no-verify-jwt
```

**Opción B - Desde Supabase Console**:
1. Edge Functions → daily-retention-job
2. Clic en "Invoke" o "Test"

**Opción C - Desde SQL Editor**:
```sql
select net.http_post(
  url:='https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/daily-retention-job',
  headers:='{"Content-Type": "application/json", "Authorization": "Bearer TU_SERVICE_ROLE_KEY"}'::jsonb,
  body:='{}'::jsonb
);
```

---

### 4. Verificar logs

```bash
supabase functions logs daily-retention-job --tail
```

O en Supabase Console: Edge Functions → daily-retention-job → Logs

**Buscar en los logs**:
- `[Job] Enviando Inactividad 10 a X usuarios...`
- Errores de Brevo (si los hay)

---

## 🔍 Diagnóstico Adicional (Si Sigue Sin Funcionar)

### A. Verificar que el cron job está activo

```sql
SELECT 
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'enviar-emails-retencion-diaria';
```

**Resultado esperado**:
- `active = true`
- `schedule = 0 9 * * *`

---

### B. Ver últimas ejecuciones del cron

```sql
SELECT 
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'enviar-emails-retencion-diaria')
ORDER BY start_time DESC
LIMIT 5;
```

**Buscar**:
- `status = 'succeeded'` o `'failed'`
- Mensajes de error en `return_message`

---

### C. Verificar variables de entorno

En Supabase Console → Edge Functions → daily-retention-job → Settings:

- ✅ `BREVO_API_KEY` debe estar configurada
- ✅ `SUPABASE_URL` (auto-configurada)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-configurada)

---

### D. Verificar templates de Brevo

La función usa el template ID **15** para emails de inactividad.

En Brevo/Sendinblue:
1. Ve a Campaigns → Templates
2. Busca el template con ID 15
3. Verifica que existe y está activo

---

## 🎯 Resultado Esperado

Después de desplegar la función corregida:

1. **Inmediatamente** (al invocar manualmente):
   - Se enviarán emails a todos los usuarios con +10 días de inactividad
   - El flag `email_inactividad_10_enviado` se actualizará a `true`

2. **Diariamente a las 9 AM UTC** (automático):
   - El cron ejecutará la función
   - Nuevos usuarios inactivos recibirán el email

---

## 📊 Monitoreo

### Verificar que los emails se enviaron

```sql
-- Usuarios que YA recibieron el email
SELECT 
    email,
    nombre,
    last_active_at,
    email_inactividad_10_enviado
FROM user_profiles
WHERE email_inactividad_10_enviado = true
ORDER BY last_active_at DESC
LIMIT 20;

-- Usuarios pendientes (deberían ser 0 después de ejecutar)
SELECT COUNT(*) as pendientes
FROM user_profiles
WHERE email_inactividad_10_enviado = false
  AND (
    last_active_at < (NOW() - INTERVAL '10 days')
    OR (last_active_at IS NULL AND created_at < (NOW() - INTERVAL '10 days'))
  );
```

---

## ⚠️ Notas Importantes

1. **No ejecutar múltiples veces seguidas**: Podría enviar emails duplicados si hay un error en la actualización del flag.

2. **Zona horaria**: El cron usa UTC. 9 AM UTC = 10 AM España (invierno) / 11 AM (verano).

3. **Límites de Brevo**: Verifica que no has alcanzado el límite diario de emails de tu plan.

---

## 🚀 Checklist de Implementación

- [ ] Ejecutar diagnóstico SQL (opcional)
- [ ] Desplegar función corregida: `supabase functions deploy daily-retention-job`
- [ ] Invocar manualmente para enviar emails pendientes
- [ ] Verificar logs: `supabase functions logs daily-retention-job`
- [ ] Confirmar que `email_inactividad_10_enviado = true` para usuarios procesados
- [ ] Verificar en Brevo que los emails se enviaron
- [ ] Esperar al siguiente día para confirmar que el cron funciona automáticamente

---

**Fecha**: 24 Enero 2026  
**Prioridad**: ALTA  
**Archivo corregido**: `supabase/functions/daily-retention-job/index.ts`
