-- 🔍 DIAGNÓSTICO: ¿Por qué no se envían emails de inactividad?

-- 1. Ver usuarios que deberían recibir el email (más de 10 días inactivos)
SELECT 
    user_id,
    email,
    nombre,
    created_at,
    last_active_at,
    email_inactividad_10_enviado,
    CASE 
        WHEN last_active_at IS NULL THEN 'SIN ACTIVIDAD REGISTRADA'
        WHEN last_active_at < (NOW() - INTERVAL '10 days') THEN 'INACTIVO +10 DÍAS'
        ELSE 'ACTIVO RECIENTE'
    END as estado_actividad,
    CASE 
        WHEN last_active_at IS NULL THEN EXTRACT(DAY FROM (NOW() - created_at))
        ELSE EXTRACT(DAY FROM (NOW() - last_active_at))
    END as dias_inactividad
FROM user_profiles
WHERE email_inactividad_10_enviado = false
ORDER BY created_at DESC
LIMIT 20;

-- 2. Contar usuarios por estado
SELECT 
    CASE 
        WHEN last_active_at IS NULL THEN 'last_active_at = NULL'
        WHEN last_active_at < (NOW() - INTERVAL '10 days') THEN 'Inactivos +10 días'
        ELSE 'Activos recientes'
    END as categoria,
    COUNT(*) as total_usuarios
FROM user_profiles
WHERE email_inactividad_10_enviado = false
GROUP BY categoria;

-- 3. Ver usuarios específicos con NULL en last_active_at
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

-- 4. SOLUCIÓN TEMPORAL: Inicializar last_active_at para usuarios antiguos
-- EJECUTAR SOLO SI CONFIRMAS QUE HAY USUARIOS CON last_active_at = NULL

-- Opción A: Usar created_at como fallback
UPDATE user_profiles
SET last_active_at = created_at
WHERE last_active_at IS NULL
  AND created_at < (NOW() - INTERVAL '10 days');

-- Verificar cuántos se actualizarían (ejecutar ANTES del UPDATE):
SELECT COUNT(*) as usuarios_a_actualizar
FROM user_profiles
WHERE last_active_at IS NULL
  AND created_at < (NOW() - INTERVAL '10 days');

-- 5. Ver logs de ejecución del cron job
SELECT 
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'enviar-emails-retencion-diaria')
ORDER BY start_time DESC
LIMIT 10;

-- 6. Ver si el cron job está activo
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
WHERE jobname = 'enviar-emails-retencion-diaria';

-- 7. DIAGNÓSTICO COMPLETO: Ver todos los campos relevantes de un usuario inactivo
SELECT 
    user_id,
    email,
    nombre,
    created_at,
    last_active_at,
    subscription_tier,
    email_inactividad_10_enviado,
    email_retencion_15_enviado,
    email_retencion_23_enviado,
    EXTRACT(DAY FROM (NOW() - COALESCE(last_active_at, created_at))) as dias_sin_actividad
FROM user_profiles
WHERE email_inactividad_10_enviado = false
  AND COALESCE(last_active_at, created_at) < (NOW() - INTERVAL '10 days')
ORDER BY created_at DESC
LIMIT 5;
