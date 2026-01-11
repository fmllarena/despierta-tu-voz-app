-- ACTUALIZACIÓN DE SCHEMA PARA BIENVENIDAS POR NIVEL
-- Permite rastrear si se ha enviado el mail de cada nivel de suscripción.

-- 1. Añadir nuevas columnas de control
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS bienvenida_free_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bienvenida_pro_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bienvenida_premium_sent boolean DEFAULT false;

-- 2. Migrar datos de la columna antigua (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='bienvenida_enviada') THEN
        UPDATE public.user_profiles SET bienvenida_free_sent = bienvenida_enviada;
    END IF;
END $$;

-- 3. (OPCIONAL) Borrar columna antigua tras verificar
-- ALTER TABLE public.user_profiles DROP COLUMN bienvenida_enviada;
