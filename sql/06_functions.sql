-- Funciones de la base de datos
-- Estas funciones manejan la lógica automática de creación y sincronización de perfiles

-- =====================================================
-- FUNCIÓN: handle_user_sync
-- Descripción: Crea o actualiza el perfil del usuario cuando se registra o actualiza en auth.users
-- Trigger: Se ejecuta AFTER INSERT OR UPDATE en auth.users
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.handle_user_sync() IS 'Sincroniza automáticamente los datos de auth.users con user_profiles';


-- =====================================================
-- FUNCIÓN: handle_new_user (LEGACY - probablemente reemplazada por handle_user_sync)
-- Descripción: Versión anterior de creación de perfil para nuevos usuarios
-- Nota: Asigna tier 'pro' y trial de 30 días por defecto
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    nombre, 
    subscription_tier, 
    notification_pref,
    trial_end_date
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', SPLIT_PART(new.email, '@', 1)), 
    'pro',  -- Betatesters tienen acceso Pro por defecto
    'daily',
    NOW() + INTERVAL '30 days'  -- Trial de 30 días
  );
  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'LEGACY: Crea perfil para nuevos usuarios con tier Pro y trial de 30 días';


-- =====================================================
-- FUNCIÓN: actualizar_perfil_vocal (LEGACY - no se usa actualmente)
-- Descripción: Función genérica para actualizar campos de la tabla alumnos (que ya no existe)
-- Nota: Esta función probablemente no se usa porque la tabla 'alumnos' fue renombrada a 'user_profiles'
-- =====================================================
CREATE OR REPLACE FUNCTION public.actualizar_perfil_vocal(
    user_id INTEGER,
    campo TEXT,
    nuevo_dato TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE alumnos SET %I = %L WHERE id = %s', campo, nuevo_dato, user_id);
END;
$$;

COMMENT ON FUNCTION public.actualizar_perfil_vocal(INTEGER, TEXT, TEXT) IS 'LEGACY: Actualiza campos de la tabla alumnos (tabla que ya no existe)';
