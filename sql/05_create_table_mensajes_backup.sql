-- Tabla: mensajes_backup
-- Backup de la tabla mensajes para recuperación de datos
-- Estructura idéntica a la tabla mensajes

CREATE TABLE IF NOT EXISTS public.mensajes_backup (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    texto TEXT,
    emisor TEXT,
    alumno UUID,
    
    -- Foreign key a auth.users (Supabase Auth)
    CONSTRAINT fk_mensajes_backup_alumno 
        FOREIGN KEY (alumno) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_mensajes_backup_alumno ON public.mensajes_backup(alumno);
CREATE INDEX IF NOT EXISTS idx_mensajes_backup_created_at ON public.mensajes_backup(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_backup_emisor ON public.mensajes_backup(emisor);

-- Comentarios
COMMENT ON TABLE public.mensajes_backup IS 'Tabla de backup del historial de conversaciones';
COMMENT ON COLUMN public.mensajes_backup.id IS 'ID único del mensaje (autoincremental)';
COMMENT ON COLUMN public.mensajes_backup.created_at IS 'Fecha y hora de creación del mensaje';
COMMENT ON COLUMN public.mensajes_backup.texto IS 'Contenido del mensaje';
COMMENT ON COLUMN public.mensajes_backup.emisor IS 'Quién envió el mensaje: "usuario", "ia", "sistema", "resumen_diario"';
COMMENT ON COLUMN public.mensajes_backup.alumno IS 'UUID del usuario (referencia a auth.users)';
