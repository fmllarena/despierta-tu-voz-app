-- 1. Eliminar políticas antiguas para que nos dejen tocar la columna
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "Permitir insertar a usuarios autenticados" ON public.mensajes;
DROP POLICY IF EXISTS "Permitir ver sus propios mensajes" ON public.mensajes;

-- 2. Limpiar/Reiniciar la columna 'alumno' para que sea de tipo UUID real
-- Como los datos actuales no son UUIDs válidos, lo más seguro es recrear la columna
ALTER TABLE public.mensajes DROP COLUMN IF EXISTS alumno;
ALTER TABLE public.mensajes ADD COLUMN alumno uuid REFERENCES auth.users(id);

-- 3. Asegurar que el resto de columnas existen
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS texto text;
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS emisor text;
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 4. Activar Seguridad (RLS)
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas definitivas
CREATE POLICY "Permitir insertar a usuarios autenticados" 
ON public.mensajes FOR INSERT 
TO authenticated 
WITH CHECK ( auth.uid() = alumno );

CREATE POLICY "Permitir ver sus propios mensajes" 
ON public.mensajes FOR SELECT 
TO authenticated 
USING ( auth.uid() = alumno );

-- 6. Índice para velocidad
CREATE INDEX IF NOT EXISTS idx_mensajes_alumno ON public.mensajes(alumno);
