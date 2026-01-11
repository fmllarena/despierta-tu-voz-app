-- SCRIPT DE LIMPIEZA Y SEGURIDAD ABSOLUTA
-- Ejecuta esto en el SQL Editor para arreglar el error 500 de una vez por todas.

-- 1. Eliminar CUALQUIER trigger viejo que pueda estar estorbando
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- 2. Eliminar funciones viejas
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_sync();

-- 3. Crear la nueva función "Blindada" (No bloquea el registro si falla)
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    nombre_final text;
BEGIN
    -- Extraemos el nombre de forma segura
    nombre_final := COALESCE(
        new.raw_user_meta_data->>'nombre', 
        new.raw_user_meta_data->>'full_name',
        new.raw_user_metadata->>'nombre',
        split_part(new.email, '@', 1)
    );

    -- Intentamos la operación en un bloque protegido
    BEGIN
        INSERT INTO public.user_profiles (user_id, email, nombre, subscription_tier)
        VALUES (new.id, new.email, nombre_final, 'free')
        ON CONFLICT (user_id) DO UPDATE 
        SET 
            email = EXCLUDED.email, 
            nombre = CASE 
                WHEN EXCLUDED.nombre NOT LIKE '%@%' THEN EXCLUDED.nombre 
                ELSE public.user_profiles.nombre 
            END;
    EXCEPTION WHEN OTHERS THEN
        -- Si falla, enviamos un aviso a los logs pero NO detenemos el registro
        RAISE WARNING 'Error no crítico al sincronizar perfil para %: %', new.email, SQLERRM;
    END;

    RETURN new;
END;
$$;

-- 4. Reinstalar el trigger único
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_sync();

-- 5. Sincronizar nombres actuales para que todo esté al día
UPDATE auth.users SET updated_at = now() WHERE raw_user_meta_data->>'nombre' IS NOT NULL;
