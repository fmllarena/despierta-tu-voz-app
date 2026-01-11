-- 1. Añadir columnas de forma segura (una por una para evitar errores de sintaxis)
alter table public.user_profiles add column if not exists email text;
alter table public.user_profiles add column if not exists nombre text;
alter table public.user_profiles add column if not exists created_at timestamp with time zone default now();

-- 2. Crear o actualizar la función que maneja el nuevo usuario
-- Esta función extrae el 'nombre' de los metadatos que enviamos desde el JS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, nombre, subscription_tier)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)), 
    'free'
  );
  return new;
end;
$$;

-- 3. Re-crear el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Configurar RLS (Seguridad)
alter table public.user_profiles enable row level security;

drop policy if exists "Usuarios pueden ver su propio perfil" on public.user_profiles;
create policy "Usuarios pueden ver su propio perfil"
on public.user_profiles for select
using ( auth.uid() = user_id );

drop policy if exists "Usuarios pueden actualizar su propio perfil" on public.user_profiles;
create policy "Usuarios pueden actualizar su propio perfil"
on public.user_profiles for update
using ( auth.uid() = user_id );

-- 5. Sincronización inicial de datos para usuarios existentes
update public.user_profiles
set 
  email = auth.users.email,
  nombre = coalesce(auth.users.raw_user_meta_data->>'nombre', split_part(auth.users.email, '@', 1))
from auth.users
where public.user_profiles.user_id = auth.users.id
and (public.user_profiles.email is null or public.user_profiles.nombre is null);
