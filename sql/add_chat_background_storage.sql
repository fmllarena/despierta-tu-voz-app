-- =====================================================
-- FONDO DEL CHAT: Storage + columnas en user_profiles
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Crea el bucket 'chat-backgrounds' (público) y sus políticas RLS.
-- Es idempotente: se puede volver a ejecutar sin efectos duplicados.

-- 1. Crear (o ajustar) el bucket de fondos del chat
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-backgrounds',
    'chat-backgrounds',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Añadir columnas del fondo del chat a user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fondo_chat_tipo TEXT DEFAULT 'ninguno';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fondo_chat_color TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fondo_chat_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fondo_chat_velo INTEGER DEFAULT 30;

COMMENT ON COLUMN public.user_profiles.fondo_chat_tipo IS 'Tipo de fondo de la zona de lectura: ninguno, color o foto';
COMMENT ON COLUMN public.user_profiles.fondo_chat_color IS 'Color hexadecimal del fondo de la zona de lectura (tipo color)';
COMMENT ON COLUMN public.user_profiles.fondo_chat_url IS 'URL pública de la foto de fondo del chat en Supabase Storage';
COMMENT ON COLUMN public.user_profiles.fondo_chat_velo IS 'Intensidad del velo aplicado sobre el fondo del chat (0-90)';

-- 3. Políticas RLS del bucket
DROP POLICY IF EXISTS "chat_backgrounds_upload_own" ON storage.objects;
CREATE POLICY "chat_backgrounds_upload_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-backgrounds'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "chat_backgrounds_read_public" ON storage.objects;
CREATE POLICY "chat_backgrounds_read_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-backgrounds');

DROP POLICY IF EXISTS "chat_backgrounds_update_own" ON storage.objects;
CREATE POLICY "chat_backgrounds_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'chat-backgrounds'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "chat_backgrounds_delete_own" ON storage.objects;
CREATE POLICY "chat_backgrounds_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-backgrounds'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
