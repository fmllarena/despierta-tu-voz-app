-- Políticas RLS (Row Level Security)
-- Estas políticas controlan quién puede ver y modificar qué datos en cada tabla

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coaching_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- POLÍTICAS PARA: mensajes
-- =====================================================

-- Usuarios pueden ver sus propios mensajes
CREATE POLICY "Permitir ver sus propios mensajes"
ON public.mensajes
FOR SELECT
TO authenticated
USING (auth.uid() = alumno);

-- Usuarios pueden insertar sus propios mensajes
CREATE POLICY "Permitir insertar a usuarios autenticados"
ON public.mensajes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = alumno);

-- Mentor puede ver todos los mensajes (para dashboard)
CREATE POLICY "Mentor puede ver todos los mensajes"
ON public.mensajes
FOR SELECT
TO public
USING ((auth.jwt() ->> 'email'::text) = 'fernando@despiertatuvoz.com'::text);


-- =====================================================
-- POLÍTICAS PARA: user_coaching_data
-- =====================================================

-- Usuarios pueden ver sus propios datos de coaching
CREATE POLICY "Usuarios ven sus propios datos de coaching"
ON public.user_coaching_data
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Usuarios pueden gestionar completamente sus datos de coaching
CREATE POLICY "Configuracion de coaching personal"
ON public.user_coaching_data
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Mentor puede ver todos los datos de coaching (para dashboard)
CREATE POLICY "Mentor puede ver todos los datos de coaching"
ON public.user_coaching_data
FOR SELECT
TO public
USING ((auth.jwt() ->> 'email'::text) = 'fernando@despiertatuvoz.com'::text);


-- =====================================================
-- POLÍTICAS PARA: user_profiles
-- =====================================================

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON public.user_profiles
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON public.user_profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id);

-- Acceso completo al perfil personal (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Acceso personal alumno"
ON public.user_profiles
FOR ALL
TO authenticated
USING (
    (id::text = auth.uid()::text) OR 
    (user_id = auth.uid())
);

-- Mentor puede ver todos los perfiles (para dashboard)
CREATE POLICY "Mentor puede ver todos los perfiles"
ON public.user_profiles
FOR SELECT
TO public
USING ((auth.jwt() ->> 'email'::text) = 'fernando@despiertatuvoz.com'::text);

-- Mentor puede ver perfiles (política alternativa)
CREATE POLICY "Mentor puede ver perfiles"
ON public.user_profiles
FOR SELECT
TO public
USING (auth.email() = 'fernando@despiertatuvoz.com'::text);

-- Mentor puede actualizar perfiles (para gestión de usuarios)
CREATE POLICY "Mentor puede actualizar perfiles"
ON public.user_profiles
FOR UPDATE
TO public
USING ((auth.jwt() ->> 'email'::text) = 'fernando@despiertatuvoz.com'::text);

-- Mentor puede actualizar notas en perfiles
CREATE POLICY "Mentor puede actualizar notas"
ON public.user_profiles
FOR UPDATE
TO public
USING (auth.email() = 'fernando@despiertatuvoz.com'::text)
WITH CHECK (auth.email() = 'fernando@despiertatuvoz.com'::text);


-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. RLS (Row Level Security) está habilitado en todas las tablas principales
-- 2. Los usuarios solo pueden ver y modificar sus propios datos
-- 3. El mentor (fernando@despiertatuvoz.com) tiene acceso completo a todos los datos
--    para el dashboard de gestión
-- 4. Las políticas usan auth.uid() para identificar al usuario autenticado
-- 5. Las políticas del mentor usan auth.jwt() o auth.email() para verificar el email
-- 6. Algunas políticas parecen duplicadas - considerar consolidarlas en el futuro
-- 7. La tabla mensajes_backup y revelaciones NO tienen RLS habilitado
--    (probablemente porque son tablas de sistema/backup)
