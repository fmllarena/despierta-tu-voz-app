-- SOLUCIÓN AL ERROR DE BORRADO DE USUARIOS
-- Este script permite que al borrar un usuario de Auth, se borren automáticamente 
-- sus datos en 'user_profiles' y 'mensajes', evitando errores de bloqueo.

-- 1. Arreglar tabla user_profiles
-- Primero buscamos el nombre de la restricción actual (suele ser 'user_profiles_user_id_fkey')
-- Y la recreamos con ON DELETE CASCADE
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 2. Arreglar tabla mensajes
-- Hacemos lo mismo para la columna 'alumno'
ALTER TABLE public.mensajes 
DROP CONSTRAINT IF EXISTS mensajes_alumno_fkey;

ALTER TABLE public.mensajes 
ADD CONSTRAINT mensajes_alumno_fkey 
FOREIGN KEY (alumno) REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOTA: Si tienes otras tablas que referencien a auth.users, habría que hacer lo mismo.
