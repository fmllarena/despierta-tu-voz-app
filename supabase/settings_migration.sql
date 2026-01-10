-- ADICIÓN DE COLUMNAS PARA AJUSTES DEL MENTOR Y NOTIFICACIONES
-- Estos campos permiten personalizar la respuesta de la IA y las preferencias de usuario.

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS mentor_focus float4 DEFAULT 0.5,           -- 0: Técnico, 1: Emocional
ADD COLUMN IF NOT EXISTS mentor_personality float4 DEFAULT 0.5,     -- 0: Neutro, 1: Motivador
ADD COLUMN IF NOT EXISTS mentor_length float4 DEFAULT 0.5,          -- 0: Breve, 1: Detallado
ADD COLUMN IF NOT EXISTS mentor_language text DEFAULT 'es',         -- Idioma de respuesta
ADD COLUMN IF NOT EXISTS weekly_goal text DEFAULT '',               -- Objetivo semanal del alumno
ADD COLUMN IF NOT EXISTS notification_pref text DEFAULT 'daily';    -- Preferencia de notificaciones

-- Comentarios para documentación de las columnas
COMMENT ON COLUMN public.user_profiles.mentor_focus IS '0.0 Technical, 1.0 Emotional';
COMMENT ON COLUMN public.user_profiles.mentor_personality IS '0.0 Neutral, 1.0 Motivator';
COMMENT ON COLUMN public.user_profiles.mentor_length IS '0.0 Brief, 1.0 Detailed';
COMMENT ON COLUMN public.user_profiles.notification_pref IS 'Values: off, daily, weekly, important';
