-- =====================================================
-- AVATAR DE PERFIL: Storage + columna en user_profiles
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- NOTA: El bucket 'avatars' se crea automáticamente desde la app.
--       Si prefieres crearlo manualmente: Dashboard > Storage > New Bucket > nombre: "avatars", público: true

-- 1. Añadir columna avatar_url a user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL pública de la foto de perfil en Supabase Storage';
