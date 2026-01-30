-- SCRIPT DE ACCESO PARA EL MENTOR
-- Objetivo: Permitir que Fernando (mentor) vea los datos de los alumnos en el dashboard.

-- 1. Políticas para user_profiles
DROP POLICY IF EXISTS "Mentor puede ver todos los perfiles" ON public.user_profiles;
CREATE POLICY "Mentor puede ver todos los perfiles"
ON public.user_profiles FOR SELECT
USING ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

DROP POLICY IF EXISTS "Mentor puede actualizar perfiles" ON public.user_profiles;
CREATE POLICY "Mentor puede actualizar perfiles"
ON public.user_profiles FOR UPDATE
USING ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

-- 2. Políticas para mensajes
DROP POLICY IF EXISTS "Mentor puede ver todos los mensajes" ON public.mensajes;
CREATE POLICY "Mentor puede ver todos los mensajes"
ON public.mensajes FOR SELECT
USING ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

-- 3. Políticas para user_coaching_data
ALTER TABLE public.user_coaching_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus propios datos de coaching" ON public.user_coaching_data;
CREATE POLICY "Usuarios ven sus propios datos de coaching"
ON public.user_coaching_data FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Mentor puede ver todos los datos de coaching" ON public.user_coaching_data;
CREATE POLICY "Mentor puede ver todos los datos de coaching"
ON public.user_coaching_data FOR SELECT
USING ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

-- 4. Asegurarse de que el email de Fernando sea tratado correctamente en las comparaciones
-- (Nota: Esto asume que el token JWT contiene el email, lo cual es el estándar en Supabase)
