-- calendly_schema.sql (Now for Cal.com Quotas)
-- Adds columns to track monthly 1/1 sessions

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS sessions_minutes_consumed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_session_reset timestamp with time zone DEFAULT now();

COMMENT ON COLUMN public.user_profiles.sessions_minutes_consumed IS 'Minutos de sesión 1/1 consumidos este mes';
COMMENT ON COLUMN public.user_profiles.last_session_reset IS 'Fecha del último reset mensual de cuotas de sesión';
