-- SCRIPT PARA RETRASAR BIENVENIDA HASTA CONFIRMACIÓN
-- Añade control de confirmación y evita duplicados.

-- 1. Añadir columnas de control a user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_confirmado_at timestamptz,
ADD COLUMN IF NOT EXISTS bienvenida_enviada boolean DEFAULT false;

-- 2. Actualizar el trigger para sincronizar el estado de confirmación
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, nombre, subscription_tier, email_confirmado_at)
    VALUES (new.id, new.email, split_part(new.email, '@', 1), 'free', new.email_confirmed_at)
    ON CONFLICT (user_id) DO UPDATE 
    SET email_confirmado_at = EXCLUDED.email_confirmado_at,
        nombre = COALESCE(new.raw_user_meta_data->>'nombre', public.user_profiles.nombre);
    
    RETURN new;
END;
$$;

-- 3. (OPCIONAL) Limpiar flag para usuarios que ya recibieron email (si quieres que no se les repita)
-- UPDATE public.user_profiles SET bienvenida_enviada = true WHERE email_confirmado_at IS NOT NULL;
