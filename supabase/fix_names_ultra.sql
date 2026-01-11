-- SCRIPT PARA ARREGLAR NOMBRES Y SINCRONIZACIÓN
-- Este script hace que el nombre se extraiga correctamente y se actualice si cambia.

CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    nombre_final text;
BEGIN
    -- Intentamos extraer el nombre de todas las fuentes posibles manejadas por Supabase
    nombre_final := COALESCE(
        new.raw_user_meta_data->>'nombre', 
        new.raw_user_meta_data->>'full_name',
        new.raw_user_metadata->>'nombre',
        split_part(new.email, '@', 1)
    );

    -- Insertar o actualizar el perfil
    INSERT INTO public.user_profiles (user_id, email, nombre, subscription_tier)
    VALUES (new.id, new.email, nombre_final, 'free')
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        email = EXCLUDED.email, 
        nombre = CASE 
            -- Solo actualizamos el nombre si no es el email o si el nuevo es más "real"
            WHEN EXCLUDED.nombre NOT LIKE '%@%' THEN EXCLUDED.nombre 
            ELSE public.user_profiles.nombre 
        END;

    RETURN new;
END;
$$;

-- Registramos el trigger tanto para INSERT como para UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_sync();

-- Sincronización inmediata para arreglar usuarios actuales
UPDATE auth.users SET updated_at = now() WHERE raw_user_meta_data->>'nombre' IS NOT NULL;
