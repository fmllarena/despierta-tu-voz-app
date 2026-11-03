-- =====================================================
-- Tabla: mensajes_guardados
-- Guarda respuestas individuales del Mentor que el alumno
-- marca con el icono de marcador, para recuperarlas en
-- cualquier sesión desde el modal "Mensajes Guardados".
-- =====================================================

CREATE TABLE IF NOT EXISTS public.mensajes_guardados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL,
    mensaje_original_id BIGINT,
    pregunta TEXT,
    respuesta TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    etiquetas TEXT[] NOT NULL DEFAULT '{}',
    creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_mensajes_guardados_alumno
        FOREIGN KEY (alumno_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensajes_guardados_mensaje
        FOREIGN KEY (mensaje_original_id)
        REFERENCES public.mensajes(id)
        ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mensajes_guardados_alumno
    ON public.mensajes_guardados(alumno_id);

CREATE INDEX IF NOT EXISTS idx_mensajes_guardados_creada_en
    ON public.mensajes_guardados(creada_en DESC);

-- Evita guardar dos veces la misma respuesta del mismo alumno.
-- (Los registros sin mensaje_original_id quedan fuera del índice.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_mensajes_guardados_alumno_mensaje
    ON public.mensajes_guardados(alumno_id, mensaje_original_id)
    WHERE mensaje_original_id IS NOT NULL;

-- RLS
ALTER TABLE public.mensajes_guardados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver mis mensajes guardados" ON public.mensajes_guardados;
CREATE POLICY "Ver mis mensajes guardados"
ON public.mensajes_guardados
FOR SELECT
TO authenticated
USING (auth.uid() = alumno_id);

DROP POLICY IF EXISTS "Guardar mis mensajes" ON public.mensajes_guardados;
CREATE POLICY "Guardar mis mensajes"
ON public.mensajes_guardados
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = alumno_id);

DROP POLICY IF EXISTS "Eliminar mis mensajes guardados" ON public.mensajes_guardados;
CREATE POLICY "Eliminar mis mensajes guardados"
ON public.mensajes_guardados
FOR DELETE
TO authenticated
USING (auth.uid() = alumno_id);

DROP POLICY IF EXISTS "Actualizar mis mensajes guardados" ON public.mensajes_guardados;
CREATE POLICY "Actualizar mis mensajes guardados"
ON public.mensajes_guardados
FOR UPDATE
TO authenticated
USING (auth.uid() = alumno_id)
WITH CHECK (auth.uid() = alumno_id);

-- Permisos para el rol authenticated (Supabase los hereda por defecto,
-- se declaran explícitamente para entornos nuevos).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensajes_guardados TO authenticated;

COMMENT ON TABLE public.mensajes_guardados IS
    'Respuestas del Mentor guardadas por el alumno con el icono de marcador';
COMMENT ON COLUMN public.mensajes_guardados.alumno_id IS
    'UUID del alumno propietario (auth.users.id)';
COMMENT ON COLUMN public.mensajes_guardados.mensaje_original_id IS
    'ID del mensaje original en public.mensajes; se conserva la copia si el mensaje se borra';
COMMENT ON COLUMN public.mensajes_guardados.pregunta IS
    'Mensaje del alumno que precede a la respuesta guardada';
COMMENT ON COLUMN public.mensajes_guardados.respuesta IS
    'Texto de la respuesta del Mentor';
COMMENT ON COLUMN public.mensajes_guardados.fecha IS
    'Fecha original del mensaje guardado';
COMMENT ON COLUMN public.mensajes_guardados.etiquetas IS
    'Etiquetas opcionales para clasificar el mensaje guardado';
