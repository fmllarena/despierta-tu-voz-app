-- Tabla: revelaciones
-- Tabla legacy que no se está usando actualmente
-- Se mantiene por compatibilidad pero puede ser eliminada en el futuro

CREATE TABLE IF NOT EXISTS public.revelaciones (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    contenido TEXT,
    usuario_id TEXT
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_revelaciones_usuario_id ON public.revelaciones(usuario_id);

-- Comentarios
COMMENT ON TABLE public.revelaciones IS 'Tabla legacy - No se está usando actualmente. Puede ser eliminada.';
COMMENT ON COLUMN public.revelaciones.id IS 'ID único de la revelación (autoincremental)';
COMMENT ON COLUMN public.revelaciones.created_at IS 'Fecha y hora de creación';
COMMENT ON COLUMN public.revelaciones.contenido IS 'Contenido de la revelación';
COMMENT ON COLUMN public.revelaciones.usuario_id IS 'ID del usuario (formato texto, no UUID)';
