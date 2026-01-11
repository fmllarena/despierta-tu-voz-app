-- MIGRACIÓN PARA PREFERENCIAS DE EMAIL
-- Añade columnas para gestionar los tipos de consentimiento de comunicaciones.

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS consent_marketing boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS consent_lifecycle boolean DEFAULT true;

-- Comentarios para documentación
COMMENT ON COLUMN public.user_profiles.consent_marketing IS 'True si el usuario acepta correos de inspiración, novedades y marketing.';
COMMENT ON COLUMN public.user_profiles.consent_lifecycle IS 'True si el usuario acepta correos de seguimiento de hitos y acompañamiento en el viaje.';

-- Nota: consent_transactional se asume implícitamente como siempre activo/necesario.
