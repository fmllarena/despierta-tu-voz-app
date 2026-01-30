-- Tabla: mensajes
-- Almacena todos los mensajes del chat entre el usuario y el mentor IA
-- Incluye tanto mensajes del usuario como respuestas del mentor

CREATE TABLE IF NOT EXISTS public.mensajes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    texto TEXT,
    emisor TEXT,
    alumno UUID,
    
    -- Foreign key a auth.users (Supabase Auth)
    CONSTRAINT fk_mensajes_alumno 
        FOREIGN KEY (alumno) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_mensajes_alumno ON public.mensajes(alumno);
CREATE INDEX IF NOT EXISTS idx_mensajes_created_at ON public.mensajes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_emisor ON public.mensajes(emisor);

-- Comentarios
COMMENT ON TABLE public.mensajes IS 'Historial completo de conversaciones entre usuarios y el mentor IA';
COMMENT ON COLUMN public.mensajes.id IS 'ID único del mensaje (autoincremental)';
COMMENT ON COLUMN public.mensajes.created_at IS 'Fecha y hora de creación del mensaje';
COMMENT ON COLUMN public.mensajes.texto IS 'Contenido del mensaje';
COMMENT ON COLUMN public.mensajes.emisor IS 'Quién envió el mensaje: "usuario", "ia", "sistema", "resumen_diario"';
COMMENT ON COLUMN public.mensajes.alumno IS 'UUID del usuario (referencia a auth.users)';
