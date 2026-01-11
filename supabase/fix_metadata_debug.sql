-- 1. Actualizar la función para que sea más robusta con los metadatos
-- Algunos drivers de Supabase pueden enviar 'nombre' o 'nombre' (con distinta capitalización o en distintos campos)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    nombre_extraido text;
begin
    -- Intentamos extraer el nombre de varias fuentes posibles
    nombre_extraido := coalesce(
        new.raw_user_meta_data->>'nombre',
        new.raw_user_meta_data->>'name',
        new.raw_user_metadata->>'nombre',
        split_part(new.email, '@', 1)
    );

    insert into public.user_profiles (user_id, email, nombre, subscription_tier)
    values (new.id, new.email, nombre_extraido, 'free');
    
    return new;
end;
$$;

-- 2. Asegurarnos de que el trigger esté bien puesto
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. SQL PARA DEBUGGING: Ejecuta esto para ver qué datos hay guardados en el último usuario registrado
-- (Pega el resultado aquí para que lo analice)
-- select id, email, raw_user_meta_data from auth.users order by created_at desc limit 1;
