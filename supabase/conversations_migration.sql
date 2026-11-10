-- ============================================================================
-- Migración: conversaciones con nombre para el historial del chat
-- ============================================================================
-- Objetivo: agrupar los mensajes en "conversaciones" para poder mostrar una
-- barra lateral con historial, búsqueda y "nueva conversación".
--
-- NOTA IMPORTANTE sobre `resumen_diario`:
--   Los mensajes con emisor = 'resumen_diario' (y 'sistema') son material
--   INTERNO para que la IA recupere contexto de días anteriores. NO deben
--   mostrarse nunca al usuario. Esta migración los conserva y los mantiene
--   fuera de las conversaciones visibles (conversacion_id NULL), y los
--   índices/políticas permiten seguir consultándolos para el contexto de la IA.
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede repetir sin daño.
-- ============================================================================

-- ── 1. Tabla de conversaciones ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversaciones (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo      text NOT NULL DEFAULT 'Nueva conversación',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    -- Cuántos mensajes tiene, para pintar la barra lateral sin contar filas.
    mensajes_count integer NOT NULL DEFAULT 0,
    -- Permite fijar conversaciones arriba en la lista.
    fijada      boolean NOT NULL DEFAULT false,
    archivada   boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_conversaciones_alumno
    ON public.conversaciones(alumno, updated_at DESC);

COMMENT ON TABLE public.conversaciones IS
    'Agrupación de mensajes del chat en conversaciones con nombre.';

-- ── 2. Enlazar mensajes con su conversación ─────────────────────────────────
ALTER TABLE public.mensajes
    ADD COLUMN IF NOT EXISTS conversacion_id uuid
    REFERENCES public.conversaciones(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion
    ON public.mensajes(conversacion_id, created_at);

COMMENT ON COLUMN public.mensajes.conversacion_id IS
    'Conversación a la que pertenece. NULL para mensajes internos (resumen_diario/sistema) y para el histórico anterior a esta migración.';

-- ── 3. Búsqueda de texto ────────────────────────────────────────────────────
-- Índice trigram para que la búsqueda en el historial no haga seq scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_mensajes_texto_trgm
    ON public.mensajes USING gin (texto gin_trgm_ops);

-- ── 4. Mantener `updated_at` y el contador al día ───────────────────────────
CREATE OR REPLACE FUNCTION public.touch_conversacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.conversacion_id IS NOT NULL THEN
        UPDATE public.conversaciones
           SET updated_at = now(),
               mensajes_count = (
                   SELECT count(*) FROM public.mensajes
                    WHERE conversacion_id = NEW.conversacion_id
               )
         WHERE id = NEW.conversacion_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversacion ON public.mensajes;
CREATE TRIGGER trg_touch_conversacion
    AFTER INSERT ON public.mensajes
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_conversacion();

-- ── 5. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus conversaciones" ON public.conversaciones;
CREATE POLICY "Usuarios ven sus conversaciones"
    ON public.conversaciones FOR SELECT
    TO authenticated
    USING (auth.uid() = alumno);

DROP POLICY IF EXISTS "Usuarios crean sus conversaciones" ON public.conversaciones;
CREATE POLICY "Usuarios crean sus conversaciones"
    ON public.conversaciones FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = alumno);

DROP POLICY IF EXISTS "Usuarios actualizan sus conversaciones" ON public.conversaciones;
CREATE POLICY "Usuarios actualizan sus conversaciones"
    ON public.conversaciones FOR UPDATE
    TO authenticated
    USING (auth.uid() = alumno)
    WITH CHECK (auth.uid() = alumno);

DROP POLICY IF EXISTS "Usuarios borran sus conversaciones" ON public.conversaciones;
CREATE POLICY "Usuarios borran sus conversaciones"
    ON public.conversaciones FOR DELETE
    TO authenticated
    USING (auth.uid() = alumno);

-- Los mensajes ya tenían políticas de SELECT/INSERT por alumno.
-- Añadimos UPDATE (editar un mensaje) y DELETE (borrar un mensaje),
-- que antes no existían y por tanto fallaban en silencio bajo RLS.
DROP POLICY IF EXISTS "Usuarios editan sus propios mensajes" ON public.mensajes;
CREATE POLICY "Usuarios editan sus propios mensajes"
    ON public.mensajes FOR UPDATE
    TO authenticated
    USING (auth.uid() = alumno)
    WITH CHECK (auth.uid() = alumno);

DROP POLICY IF EXISTS "Usuarios borran sus propios mensajes" ON public.mensajes;
CREATE POLICY "Usuarios borran sus propios mensajes"
    ON public.mensajes FOR DELETE
    TO authenticated
    USING (auth.uid() = alumno);

-- ── 6. Adoptar el histórico existente ───────────────────────────────────────
-- Los mensajes antiguos no tienen conversación. Se agrupa cada día natural
-- con actividad visible en una conversación, ignorando resumen_diario y
-- sistema para que no aparezcan en la barra lateral.
DO $$
DECLARE
    r RECORD;
    nueva_id uuid;
    filas integer;
    creadas integer := 0;
    adoptados integer := 0;
    sin_fecha integer := 0;
    sin_dueno integer := 0;
BEGIN
    -- Salvaguardas: filas que NO se pueden agrupar y se quedan como están.
    -- (No se borran: simplemente no aparecen en el historial.)
    SELECT count(*) INTO sin_fecha
      FROM public.mensajes
     WHERE conversacion_id IS NULL AND created_at IS NULL;

    SELECT count(*) INTO sin_dueno
      FROM public.mensajes
     WHERE conversacion_id IS NULL AND alumno IS NULL;

    IF sin_fecha > 0 THEN
        RAISE NOTICE 'Aviso: % mensaje(s) sin created_at. No se pueden agrupar por día y quedan fuera del historial.', sin_fecha;
    END IF;

    IF sin_dueno > 0 THEN
        RAISE NOTICE 'Aviso: % mensaje(s) sin alumno. No pertenecen a ningún usuario y quedan fuera del historial.', sin_dueno;
    END IF;

    FOR r IN
        SELECT alumno, date_trunc('day', created_at) AS dia
          FROM public.mensajes
         WHERE conversacion_id IS NULL
           AND alumno IS NOT NULL
           AND created_at IS NOT NULL
           AND emisor NOT IN ('resumen_diario', 'sistema')
         GROUP BY alumno, date_trunc('day', created_at)
         ORDER BY 1, 2
    LOOP
        INSERT INTO public.conversaciones (alumno, titulo, created_at, updated_at)
        VALUES (
            r.alumno,
            'Conversación del ' || to_char(r.dia, 'DD/MM/YYYY'),
            r.dia,
            r.dia
        )
        RETURNING id INTO nueva_id;

        creadas := creadas + 1;

        UPDATE public.mensajes
           SET conversacion_id = nueva_id
         WHERE alumno = r.alumno
           AND conversacion_id IS NULL
           AND created_at IS NOT NULL
           AND date_trunc('day', created_at) = r.dia
           AND emisor NOT IN ('resumen_diario', 'sistema');

        GET DIAGNOSTICS filas = ROW_COUNT;
        adoptados := adoptados + filas;
    END LOOP;

    RAISE NOTICE 'Histórico adoptado: % conversación(es) creada(s), % mensaje(s) enlazado(s).', creadas, adoptados;
END $$;

-- Recalcular contadores tras adoptar el histórico.
UPDATE public.conversaciones c
   SET mensajes_count = (
       SELECT count(*) FROM public.mensajes m WHERE m.conversacion_id = c.id
   );

-- ── 7. Comprobación ─────────────────────────────────────────────────────────
-- Ejecuta estas consultas después de la migración para ver el resultado real.

-- a) Resumen general
SELECT
    (SELECT count(*) FROM public.conversaciones)                        AS conversaciones,
    (SELECT count(*) FROM public.mensajes WHERE conversacion_id IS NOT NULL) AS msgs_enlazados,
    (SELECT count(*) FROM public.mensajes
      WHERE conversacion_id IS NULL
        AND emisor NOT IN ('resumen_diario','sistema'))                 AS msgs_visibles_sin_hilo,
    (SELECT count(*) FROM public.mensajes
      WHERE emisor IN ('resumen_diario','sistema'))                     AS msgs_internos;

-- b) Cuántas conversaciones tiene cada usuario (las 20 con más actividad)
SELECT c.alumno,
       count(*)                AS conversaciones,
       sum(c.mensajes_count)   AS mensajes
  FROM public.conversaciones c
 GROUP BY c.alumno
 ORDER BY mensajes DESC
 LIMIT 20;

-- c) Detalle de las conversaciones de un usuario concreto
--    (sustituye el UUID por el del alumno que quieras revisar)
-- SELECT id, titulo, created_at, mensajes_count
--   FROM public.conversaciones
--  WHERE alumno = '00000000-0000-0000-0000-000000000000'
--  ORDER BY updated_at DESC;

-- Si `msgs_visibles_sin_hilo` no es 0, son mensajes antiguos que no se pudieron
-- agrupar (sin fecha o sin dueño). Se pueden revisar con:
-- SELECT id, alumno, emisor, created_at FROM public.mensajes
--  WHERE conversacion_id IS NULL AND emisor NOT IN ('resumen_diario','sistema')
--  LIMIT 50;
