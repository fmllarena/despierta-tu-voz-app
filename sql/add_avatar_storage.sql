-- =====================================================
-- AVATAR DE PERFIL: Storage + columna en user_profiles
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir columna avatar_url a user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL pública de la foto de perfil en Supabase Storage';

-- 2. Crear bucket 'avatars' (privado, controlado por RLS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 524288, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage para bucket 'avatars'

-- Usuarios autenticados pueden subir su propio avatar
CREATE POLICY "Usuarios suben su propio avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuarios pueden ver su propio avatar
CREATE POLICY "Usuarios ven su propio avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Cualquiera puede ver avatars (para mostrar en chat)
CREATE POLICY "Avatars publicos para lectura"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Usuarios pueden actualizar su propio avatar
CREATE POLICY "Usuarios actualizan su propio avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuarios pueden eliminar su propio avatar
CREATE POLICY "Usuarios eliminan su propio avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
