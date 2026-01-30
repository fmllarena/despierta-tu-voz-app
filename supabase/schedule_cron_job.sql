-- 1. Habilitar la extensión pg_cron (si no está activa)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Programar el Job Diario
-- Este comando hará que la función se ejecute todos los días a las 09:00 AM (hora UTC)
-- REEMPLAZA [TU_SERVICE_ROLE_KEY] por tu clave real de Supabase (Settings -> API)

SELECT cron.schedule(
  'enviar-emails-retencion-diaria', -- nombre del job
  '0 9 * * *',                      -- cron: cada día a las 09:00
  $$
  select
    net.http_post(
      url:='https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/daily-retention-job',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer [TU_SERVICE_ROLE_KEY]"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);

-- NOTA: Para listar tus jobs activos puedes usar: select * from cron.job;
-- Para borrar el job si te equivocas: select cron.unschedule('enviar-emails-retencion-diaria');
