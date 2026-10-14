-- ============================================================
-- Migración: valoración 👍/👎 de las respuestas de la IA
-- Idempotente: se puede re-ejecutar sin error
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

ALTER TABLE public.mensajes
  ADD COLUMN IF NOT EXISTS reaction TEXT
  CHECK (reaction IN ('like','dislike'));

-- Índice parcial: la query de feedback solo toca filas votadas,
-- no el histórico completo de mensajes
CREATE INDEX IF NOT EXISTS idx_mensajes_votados
  ON public.mensajes (alumno, created_at DESC)
  WHERE emisor = 'ia' AND reaction IS NOT NULL;

COMMENT ON COLUMN public.mensajes.reaction
  IS 'Valoración del alumno a la respuesta de la IA: like/dislike';
