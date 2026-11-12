-- =====================================================
-- OPACIDAD DE GLOBOS DE CHAT: columna en user_profiles
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Añade la columna fondo_globo_opacidad (0-100) para controlar
-- la transparencia de los globos de mensaje y ver el fondo del chat.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fondo_globo_opacidad INTEGER DEFAULT 100;

COMMENT ON COLUMN public.user_profiles.fondo_globo_opacidad IS 'Opacidad de los globos de mensaje en porcentaje (0-100). 100 = opaco, menor = más transparente para ver el fondo del chat.';
