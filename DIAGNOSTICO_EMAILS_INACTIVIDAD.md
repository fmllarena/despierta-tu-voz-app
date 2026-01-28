# 🔍 Diagnóstico: Emails de Inactividad No Se Envían

## Problema Detectado

Los usuarios con más de 10 días de inactividad tienen `email_inactividad_10_enviado = FALSE`, lo que indica que **el sistema automático de emails NO está funcionando**.

---

## Causa Raíz

El **cron job diario** que ejecuta la Edge Function `daily-retention-job` **NO está configurado correctamente** o **NO está activo** en Supabase.

---

## Verificación Paso a Paso

### 1. Verificar si el cron job existe

Ejecuta en el SQL Editor de Supabase:

```sql
SELECT * FROM cron.job;
```

**Resultado esperado**: Debe aparecer un job llamado `enviar-emails-retencion-diaria`

**Si NO aparece**: El cron job nunca se configuró → Ir a paso 2

**Si aparece**: Verificar que:
- `schedule` sea `0 9 * * *` (cada día a las 9 AM UTC)
- `active` sea `true`

---

### 2. Verificar la extensión pg_cron

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**Si NO aparece**: Ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

### 3. Obtener la SERVICE_ROLE_KEY

1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia la **service_role key** (secret)

---

### 4. Configurar el cron job correctamente

**IMPORTANTE**: Reemplaza `[TU_SERVICE_ROLE_KEY]` con tu clave real.

```sql
-- Primero, eliminar el job si existe (para evitar duplicados)
SELECT cron.unschedule('enviar-emails-retencion-diaria');

-- Crear el job con la clave correcta
SELECT cron.schedule(
  'enviar-emails-retencion-diaria',
  '0 9 * * *', -- Cada día a las 9 AM UTC (10 AM España en invierno, 11 AM en verano)
  $$
  select
    net.http_post(
      url:='https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/daily-retention-job',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer AQUI_TU_SERVICE_ROLE_KEY_REAL"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);
```

---

### 5. Verificar que la Edge Function está desplegada

En tu terminal local:

```bash
cd c:\Projects\appDTV\despierta-tu-voz-app

# Verificar que la función existe
supabase functions list

# Si no aparece 'daily-retention-job', desplegarla:
supabase functions deploy daily-retention-job
```

---

### 6. Probar manualmente la función

Para verificar que funciona sin esperar al cron:

```bash
# Desde terminal local
supabase functions invoke daily-retention-job --no-verify-jwt
```

O desde SQL Editor:

```sql
select
  net.http_post(
    url:='https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/daily-retention-job',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer TU_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
```

---

### 7. Verificar variables de entorno de la función

La función necesita estas variables configuradas en Supabase:

1. Ve a Edge Functions → daily-retention-job → Settings
2. Verifica que existen:
   - `BREVO_API_KEY` (tu API key de Brevo/Sendinblue)
   - `SUPABASE_URL` (auto-configurada)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-configurada)

**Si falta `BREVO_API_KEY`**: La función no podrá enviar emails.

---

## Solución Rápida (Ejecutar ahora)

Si quieres enviar los emails pendientes **inmediatamente** sin esperar al cron:

### Opción A: Desde la consola de Supabase

1. Ve a Edge Functions
2. Busca `daily-retention-job`
3. Haz clic en "Invoke" o "Test"

### Opción B: Desde terminal

```bash
supabase functions invoke daily-retention-job --no-verify-jwt
```

---

## Monitoreo

### Ver logs de la función

```bash
supabase functions logs daily-retention-job
```

O en la consola de Supabase: Edge Functions → daily-retention-job → Logs

### Ver historial de ejecuciones del cron

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'enviar-emails-retencion-diaria')
ORDER BY start_time DESC
LIMIT 10;
```

---

## Checklist de Verificación

- [ ] Extensión `pg_cron` instalada
- [ ] Cron job `enviar-emails-retencion-diaria` existe y está activo
- [ ] SERVICE_ROLE_KEY correcta en el cron job
- [ ] Edge Function `daily-retention-job` desplegada
- [ ] Variable `BREVO_API_KEY` configurada en la función
- [ ] Función ejecutada manualmente con éxito
- [ ] Logs muestran emails enviados

---

## Resultado Esperado

Después de configurar correctamente:

1. **Cada día a las 9 AM UTC**, el cron ejecutará la función
2. La función revisará:
   - Usuarios con 15 días desde registro → Email día 15
   - Usuarios con 23 días desde registro → Email día 23
   - Usuarios con 10 días de inactividad → Email inactividad
   - Usuarios con 5 días desde completar M5 → Email post-viaje
3. Los flags se actualizarán a `true` en `user_profiles`
4. Los emails se enviarán vía Brevo

---

## Troubleshooting

### "No se envían emails pero el cron se ejecuta"

- Verificar `BREVO_API_KEY` en las variables de entorno
- Verificar logs de la función: `supabase functions logs daily-retention-job`
- Verificar que los templates existen en Brevo (IDs: 15, 9, 8, 16)

### "El cron no se ejecuta"

- Verificar que `pg_cron` está habilitado
- Verificar que el job está activo: `SELECT active FROM cron.job WHERE jobname = 'enviar-emails-retencion-diaria'`
- Verificar la zona horaria: `SHOW timezone;`

### "Error 401 Unauthorized"

- La `SERVICE_ROLE_KEY` en el cron job es incorrecta
- Copiar de nuevo desde Settings → API

---

**Fecha**: 24 Enero 2026  
**Prioridad**: ALTA - Los usuarios no están recibiendo emails de retención
