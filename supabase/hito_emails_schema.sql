-- hito_emails_schema.sql
-- Tracking for module completion emails (Hitos)

-- 1. Añadir columnas de control a user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS hito1_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hito2_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hito3_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hito4_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hito5_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_hito_completed int DEFAULT 0;

-- 2. Función para disparar el Edge Function (vía Webhook de Supabase)
-- Se recomienda configurar un Webhook en el Dashboard de Supabase con estos datos:
-- Tabla: user_profiles
-- Evento: UPDATE
-- Columna de filtro: last_hito_completed
-- URL: https://[PROYECTO].supabase.co/functions/v1/send-hito-email
-- HTTP Method: POST
-- Headers: Authorization: Bearer [SERVICE_ROLE_KEY]
