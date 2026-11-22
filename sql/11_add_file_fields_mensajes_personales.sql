-- Añadir campos de archivo adjunto a mensajes_personales
ALTER TABLE public.mensajes_personales
ADD COLUMN IF NOT EXISTS archivo_nombre TEXT,
ADD COLUMN IF NOT EXISTS archivo_tipo TEXT,
ADD COLUMN IF NOT EXISTS archivo_datos TEXT;

COMMENT ON COLUMN public.mensajes_personales.archivo_nombre IS 'Nombre original del archivo adjunto (imagen o PDF)';
COMMENT ON COLUMN public.mensajes_personales.archivo_tipo IS 'MIME type del archivo (image/jpeg, application/pdf, etc.)';
COMMENT ON COLUMN public.mensajes_personales.archivo_datos IS 'Contenido del archivo en base64';
