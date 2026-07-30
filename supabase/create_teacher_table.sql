-- Tabla teacher: conversaciones con el profesor de inglés IA
CREATE TABLE IF NOT EXISTS public.teacher (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    topic text,
    created_at timestamptz DEFAULT now()
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_teacher_user_id ON public.teacher(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_created_at ON public.teacher(created_at);

ALTER TABLE public.teacher ENABLE ROW LEVEL SECURITY;

-- Políticas: el mentor puede ver e insertar todo
DROP POLICY IF EXISTS "Mentor puede ver teacher" ON public.teacher;
CREATE POLICY "Mentor puede ver teacher"
ON public.teacher FOR SELECT
USING ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

DROP POLICY IF EXISTS "Mentor puede insertar teacher";
CREATE POLICY "Mentor puede insertar teacher"
ON public.teacher FOR INSERT
WITH CHECK ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

-- El propio usuario puede ver sus mensajes
DROP POLICY IF EXISTS "Usuario puede ver sus mensajes teacher";
CREATE POLICY "Usuario puede ver sus mensajes teacher"
ON public.teacher FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Usuario puede insertar sus mensajes teacher";
CREATE POLICY "Usuario puede insertar sus mensajes teacher"
ON public.teacher FOR INSERT
WITH CHECK ( auth.uid() = user_id );