-- Políticas RLS para el bucket "avatar" en Storage
-- Ejecutar en Supabase SQL Editor

-- 1. Usuarios autenticados pueden subir su propio avatar
CREATE POLICY "avatar_upload_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatar'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Cualquiera puede ver avatars (bucket público)
CREATE POLICY "avatar_read_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatar');

-- 3. Usuarios pueden actualizar su propio avatar
CREATE POLICY "avatar_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatar'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Usuarios pueden eliminar su propio avatar
CREATE POLICY "avatar_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatar'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
