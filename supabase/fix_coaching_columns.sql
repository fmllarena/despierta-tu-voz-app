-- fix_coaching_columns.sql
-- Asegura que todas las columnas necesarias para los Módulos 1-5 existan

ALTER TABLE public.user_coaching_data 
-- Módulo 1
ADD COLUMN IF NOT EXISTS linea_vida_hitos jsonb DEFAULT '[]'::jsonb,
-- Módulo 2
ADD COLUMN IF NOT EXISTS herencia_raices jsonb DEFAULT '[]'::jsonb,
-- Módulo 3
ADD COLUMN IF NOT EXISTS roles_familiares jsonb DEFAULT '[]'::jsonb,
-- Módulo 4
ADD COLUMN IF NOT EXISTS carta_yo_pasado jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS carta_padres jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sanacion_heridas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ritual_sanacion jsonb DEFAULT '[]'::jsonb,
-- Módulo 5
ADD COLUMN IF NOT EXISTS inventario_creencias jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS proposito_vida jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS plan_accion jsonb DEFAULT '[]'::jsonb;

-- Comentario de éxito
COMMENT ON TABLE public.user_coaching_data IS 'Tabla de hitos del viaje alquímico - Todas las columnas sincronizadas';
