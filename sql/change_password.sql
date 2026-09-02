-- Cambiar contraseña de un usuario en Supabase
-- Reemplaza 'USUARIO_EMAIL' y 'NUEVA_CONTRASEÑA' con los valores reales

-- Opción 1: Cambiar por email (desde auth.users)
UPDATE auth.users
SET encrypted_password = crypt('NUEVA_CONTRASEÑA', gen_salt('bf'))
WHERE email = 'USUARIO_EMAIL';

-- Opción 2: Cambiar por UUID
-- UPDATE auth.users
-- SET encrypted_password = crypt('NUEVA_CONTRASEÑA', gen_salt('bf'))
-- WHERE id = 'UUID_DEL_USUARIO';
