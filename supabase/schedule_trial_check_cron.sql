-- Configurar cron job para verificar trials expirados diariamente
-- Ejecutar en el SQL Editor de Supabase

-- 1. Habilitar la extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Eliminar el job si ya existe (comentado en la primera ejecución)
-- Si el job no existe, esta línea dará error. Descoméntala solo si necesitas recrear el job.
-- SELECT cron.unschedule('check-expired-trials-daily');

-- 3. Crear el cron job que se ejecuta todos los días a las 10:00 AM UTC
SELECT cron.schedule(
  'check-expired-trials-daily',  -- Nombre del job
  '0 10 * * *',  -- Cron expression: todos los días a las 10:00 AM UTC (11:00 AM España)
  $$
  SELECT
    net.http_post(
      url:='https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/check-expired-trials',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d3dqdGpjYXd1YWJ6eW9qYWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTQyNzgsImV4cCI6MjA4MjY5MDI3OH0.HawT5cmdvVVa3bnuE74x2sXXQEI3Gg3CeQ3-3NMmN6k"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 4. Verificar que el cron job se creó correctamente
SELECT * FROM cron.job WHERE jobname = 'check-expired-trials-daily';
