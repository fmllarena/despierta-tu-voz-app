-- retention_schema.sql (Updated for Day 10 Inactivity & Day 5 Post-Journey)
-- Tracking for retention and post-journey emails

-- 1. Añadir columnas de control si no existen
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_retencion_15_enviado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_retencion_23_enviado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_inactividad_10_enviado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_post_viaje_enviado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS journey_completed_at timestamp with time zone;

-- 2. Migración: Si existía la del día 15 de inactividad, la movemos a la del día 10 para no perder datos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='email_inactividad_15_enviado') THEN
        UPDATE public.user_profiles SET email_inactividad_10_enviado = email_inactividad_15_enviado;
        -- Opcional: ALTER TABLE public.user_profiles DROP COLUMN email_inactividad_15_enviado;
    END IF;
END $$;

COMMENT ON COLUMN public.user_profiles.email_retencion_15_enviado IS 'Aviso seguimiento (Día 15)';
COMMENT ON COLUMN public.user_profiles.email_retencion_23_enviado IS 'Aviso fin de plan (Día 23)';
COMMENT ON COLUMN public.user_profiles.email_inactividad_10_enviado IS 'Aviso inactividad (Día 10)';
COMMENT ON COLUMN public.user_profiles.email_post_viaje_enviado IS 'Aviso post-viaje (5 días después de M5)';
COMMENT ON COLUMN public.user_profiles.last_active_at IS 'Fecha del último mensaje o acción del usuario';
COMMENT ON COLUMN public.user_profiles.journey_completed_at IS 'Fecha en la que el usuario terminó el Módulo 5';
