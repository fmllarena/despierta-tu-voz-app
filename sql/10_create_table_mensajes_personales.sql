-- Tabla: mensajes_personales
-- Permite al mentor enviar mensajes personales a un usuario que aparecen en el modal de Mensajes (campana) de la app.

CREATE TABLE IF NOT EXISTS public.mensajes_personales (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    remitente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asunto TEXT NOT NULL,
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    borrado BOOLEAN DEFAULT false,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_personales_destinatario ON public.mensajes_personales(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_personales_leido ON public.mensajes_personales(leido);
CREATE INDEX IF NOT EXISTS idx_mensajes_personales_borrado ON public.mensajes_personales(borrado);
CREATE INDEX IF NOT EXISTS idx_mensajes_personales_creado_en ON public.mensajes_personales(creado_en DESC);

COMMENT ON TABLE public.mensajes_personales IS 'Mensajes personales enviados por el mentor a usuarios, mostrados en el modal de Mensajes de la app';
COMMENT ON COLUMN public.mensajes_personales.destinatario_id IS 'Usuario que recibe el mensaje';
COMMENT ON COLUMN public.mensajes_personales.remitente_id IS 'Mentor que envía el mensaje';
COMMENT ON COLUMN public.mensajes_personales.leido IS 'Indica si el usuario ya abrió el mensaje en la app';
COMMENT ON COLUMN public.mensajes_personales.borrado IS 'Indica si el usuario ha eliminado el mensaje (no se muestra en el listado)';
