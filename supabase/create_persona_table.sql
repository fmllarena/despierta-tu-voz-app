-- Tabla persona_chat: conversaciones de rol/personaje configurables (página sex.html)
CREATE TABLE IF NOT EXISTS public.persona_chat (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    persona text,
    created_at timestamptz DEFAULT now()
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_persona_chat_user_id ON public.persona_chat(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_chat_created_at ON public.persona_chat(created_at);

ALTER TABLE public.persona_chat ENABLE ROW LEVEL SECURITY;

-- El mentor puede ver e insertar todo
DROP POLICY IF EXISTS "Mentor puede ver persona_chat" ON public.persona_chat;
CREATE POLICY "Mentor puede ver persona_chat"
ON public.persona_chat FOR SELECT
USING ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

DROP POLICY IF EXISTS "Mentor puede insertar persona_chat" ON public.persona_chat;
CREATE POLICY "Mentor puede insertar persona_chat"
ON public.persona_chat FOR INSERT
WITH CHECK ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

-- El propio usuario puede ver sus mensajes
DROP POLICY IF EXISTS "Usuario puede ver sus mensajes persona_chat" ON public.persona_chat;
CREATE POLICY "Usuario puede ver sus mensajes persona_chat"
ON public.persona_chat FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Usuario puede insertar sus mensajes persona_chat" ON public.persona_chat;
CREATE POLICY "Usuario puede insertar sus mensajes persona_chat"
ON public.persona_chat FOR INSERT
WITH CHECK ( auth.uid() = user_id );
