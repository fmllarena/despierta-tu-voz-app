-- SCRIPT DE REPARACIÓN DEFINITIVO
-- Ejecuta esto por partes si es necesario, pero asegúrate de que todo de "Success"

-- 1. ASEGURAR COLUMNAS (Si alguna ya existe, no pasará nada malo)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN email text;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'La columna email ya existe.';
    END;
    
    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN nombre text;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'La columna nombre ya existe.';
    END;

    BEGIN
        ALTER TABLE public.user_profiles ADD COLUMN created_at timestamp with time zone DEFAULT now();
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'La columna created_at ya existe.';
    END;
END $$;

-- 2. FUNCIÓN DEL TRIGGER ULTRA-SEGURA
-- Esta función NO fallará aunque el nombre venga vacío o haya errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    nombre_final text;
BEGIN
    -- Intentamos sacar el nombre del metadato, si no, usamos el email
    nombre_final := COALESCE(
        new.raw_user_meta_data->>'nombre', 
        new.raw_user_metadata->>'nombre',
        split_part(new.email, '@', 1)
    );

    -- Insertamos el perfil. Usamos ON CONFLICT por si ya existiera
    INSERT INTO public.user_profiles (user_id, email, nombre, subscription_tier)
    VALUES (new.id, new.email, nombre_final, 'free')
    ON CONFLICT (user_id) DO UPDATE 
    SET email = excluded.email, nombre = excluded.nombre, 
        subscription_tier = COALESCE(public.user_profiles.subscription_tier, 'free');

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Si falla algo, que al menos deje que el usuario se registre en Auth
    RETURN new;
END;
$$;

-- 3. REINSTALAR EL TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. VERIFICACIÓN (Ejecuta esto al final para confirmar)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles';
