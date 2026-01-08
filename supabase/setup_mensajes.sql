ALTER TABLE IF EXISTS public.mensajes ADD COLUMN IF NOT EXISTS texto text;
ALTER TABLE IF EXISTS public.mensajes ADD COLUMN IF NOT EXISTS emisor text;
ALTER TABLE IF EXISTS public.mensajes ADD COLUMN IF NOT EXISTS alumno uuid REFERENCES auth.users(id);
ALTER TABLE IF EXISTS public.mensajes ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios mensajes" ON public.mensajes;
CREATE POLICY "Usuarios pueden insertar sus propios mensajes"
ON public.mensajes FOR INSERT
WITH CHECK ( auth.uid() = alumno );

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios mensajes" ON public.mensajes;
CREATE POLICY "Usuarios pueden ver sus propios mensajes"
ON public.mensajes FOR SELECT
USING ( auth.uid() = alumno );

CREATE INDEX IF NOT EXISTS idx_mensajes_alumno ON public.mensajes(alumno);
