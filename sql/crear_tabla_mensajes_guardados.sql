-- Migración para crear tabla de mensajes guardados (similar a guardar reels de Instagram)
-- Se ejecuta en Supabase Dashboard → SQL Editor

BEGIN;

-- Tabla para guardar mensajes favoritos del usuario
CREATE TABLE IF NOT EXISTS public.mensajes_guardados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alumno_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    mensaje_original_id uuid REFERENCES public.mensajes(id) ON DELETE SET NULL,
    pregunta text,
    respuesta text,
    fecha timestamptz DEFAULT now(),
    etiquetas text[] DEFAULT '{}'::text[],
    creada_en timestamptz DEFAULT now(),
    actualizada_en timestamptz DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_mensajes_guardados_alumno ON public.mensajes_guardados(alumno_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_guardados_creada_en ON public.mensajes_guardados(creada_en DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_guardados_mensaje_original ON public.mensajes_guardados(mensaje_original_id);

-- Habilitar RLS (Row Level Security) para que cada usuario solo vea sus propios mensajes
ALTER TABLE public.mensajes_guardados ENABLE ROW LEVEL SECURITY;

-- Política: los usuarios pueden leer sus propios mensajes guardados
CREATE POLICY "Usuarios pueden leer sus mensajes guardados"
    ON public.mensajes_guardados FOR SELECT
    USING (auth.uid() = alumno_id);

-- Política: los usuarios pueden insertar sus propios mensajes guardados
CREATE POLICY "Usuarios pueden crear sus mensajes guardados"
    ON public.mensajes_guardados FOR INSERT
    WITH CHECK (auth.uid() = alumno_id);

-- Política: los usuarios pueden eliminar sus propios mensajes guardados
CREATE POLICY "Usuarios pueden eliminar sus mensajes guardados"
    ON public.mensajes_guardados FOR DELETE
    USING (auth.uid() = alumno_id);

-- Política: los usuarios pueden actualizar sus propios mensajes guardados
CREATE POLICY "Usuarios pueden actualizar sus mensajes guardados"
    ON public.mensajes_guardados FOR UPDATE
    USING (auth.uid() = alumno_id);

COMMIT;

-- Nota: Ejecutar este SQL en Supabase Dashboard → SQL Editor
-- Luego ejecutar en edge functions o funciones serverless si es necesario
