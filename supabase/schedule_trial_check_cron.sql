-- Configurar cron job para verificar trials expirados diariamente
-- Ejecutar en el SQL Editor de Supabase

-- 1. Habilitar la extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Eliminar el job si ya existe (para poder recrearlo)
SELECT cron.unschedule('check-expired-trials-daily');

-- 3. Crear el cron job que se ejecuta todos los días a las 10:00 AM UTC
SELECT cron.schedule(
  'check-expired-trials-daily',  -- Nombre del job
  '0 10 * * *',  -- Cron expression: todos los días a las 10:00 AM UTC (11:00 AM España)
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expired-trials',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 4. Verificar que el cron job se creó correctamente
SELECT * FROM cron.job WHERE jobname = 'check-expired-trials-daily';

-- NOTA IMPORTANTE:
-- Reemplaza YOUR_PROJECT_REF con tu referencia de proyecto de Supabase
-- Reemplaza YOUR_ANON_KEY con tu clave anon de Supabase
-- Puedes encontrar estos valores en: Settings > API
