-- SCRIPT DE REPARACIÓN DE REGISTRO Y CONSENTIMIENTOS (V3)
-- Objetivo: Asegurar que la fecha de confirmación se sincroniza y los consentimientos son TRUE por defecto.

-- 1. Actualizar la función del Trigger para ser más completa
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    nombre_final text;
BEGIN
    -- Extraemos el nombre de forma segura de los metadatos
    nombre_final := COALESCE(
        new.raw_user_meta_data->>'nombre', 
        new.raw_user_meta_data->>'full_name',
        new.raw_user_metadata->>'nombre',
        split_part(new.email, '@', 1)
    );

    -- Insertamos o actualizamos el perfil
    INSERT INTO public.user_profiles (
        user_id, 
        email, 
        nombre, 
        subscription_tier, 
        email_confirmado_at,
        consent_marketing,
        consent_lifecycle
    )
    VALUES (
        new.id, 
        new.email, 
        nombre_final, 
        'pro', -- Por defecto Pro según setup anterior
        new.email_confirmed_at,
        true,
        true
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        email_confirmado_at = EXCLUDED.email_confirmado_at,
        -- Solo actualizamos el nombre si no parece un email (para no sobreescribir nombres buenos con emails)
        nombre = CASE 
            WHEN EXCLUDED.nombre NOT LIKE '%@%' THEN EXCLUDED.nombre 
            ELSE public.user_profiles.nombre 
        END,
        -- Asegurar que si los consentimientos eran NULL, ahora sean TRUE
        consent_marketing = COALESCE(public.user_profiles.consent_marketing, true),
        consent_lifecycle = COALESCE(public.user_profiles.consent_lifecycle, true);

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error en handle_user_sync para %: %', new.email, SQLERRM;
    RETURN new;
END;
$$;

-- 2. Asegurarse de que el trigger esté vinculado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email_confirmed_at, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_sync();

-- 3. SINCRONIZACIÓN RETROACTIVA (Para los que ya están registrados)
-- Esto rellena la fecha de confirmación y los consentimientos en los perfiles actuales
UPDATE public.user_profiles up
SET 
    email_confirmado_at = au.email_confirmed_at,
    consent_marketing = COALESCE(up.consent_marketing, true),
    consent_lifecycle = COALESCE(up.consent_lifecycle, true)
FROM auth.users au
WHERE up.user_id = au.id
AND (up.email_confirmado_at IS NULL OR up.consent_marketing IS NULL);

-- 4. Verificación rápida (opcional)
-- SELECT email, email_confirmado_at, consent_marketing FROM public.user_profiles;
