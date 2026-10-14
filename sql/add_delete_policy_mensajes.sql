-- ============================================================
-- Migración: política DELETE sobre mensajes (borrado por mensaje)
-- Idempotente: se puede re-ejecutar sin error
-- Ejecutar en: Supabase SQL Editor
-- ============================================================
-- Habilita el borrado desde el cliente (RLS obliga a que cada
-- usuario solo pueda borrar SUS mensajes: auth.uid() = alumno).
-- También normaliza/crea la política que usa el botón
-- "Borrar Historial de Chat" de Ajustes (js/modules/settings.js).

DROP POLICY IF EXISTS "Permitir borrar sus propios mensajes" ON public.mensajes;

CREATE POLICY "Permitir borrar sus propios mensajes"
ON public.mensajes
FOR DELETE
TO authenticated
USING (auth.uid() = alumno);
