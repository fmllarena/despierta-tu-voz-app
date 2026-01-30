-- ADICIÓN DE COLUMNA PARA CONSENTIMIENTO LEGAL
-- Marca si el usuario ha aceptado los términos y condiciones antes de su primer pago.

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS accepted_terms boolean DEFAULT false;

-- Comentario para documentación
COMMENT ON COLUMN public.user_profiles.accepted_terms IS 'True if the user has accepted the legal terms and conditions.';
