-- Tabla: user_coaching_data
-- Almacena los datos del viaje de coaching del usuario a través de los módulos
-- Cada columna JSONB representa las respuestas de un módulo específico

CREATE TABLE IF NOT EXISTS public.user_coaching_data (
    user_id UUID PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- Módulo 1: El Espejo del Pasado (La Semilla)
    linea_vida_hitos JSONB DEFAULT '[]'::jsonb,
    
    -- Módulo 2: Herencia y Raíces
    herencia_raices JSONB DEFAULT '[]'::jsonb,
    roles_familiares JSONB DEFAULT '[]'::jsonb,
    
    -- Módulo 3: El Personaje
    personaje JSONB DEFAULT '[]'::jsonb,
    inventario_creencias JSONB DEFAULT '[]'::jsonb,
    
    -- Módulo 4: El Altar de las Palabras
    carta_yo_pasado JSONB DEFAULT '[]'::jsonb,
    carta_padres JSONB DEFAULT '[]'::jsonb,
    ritual_sanacion JSONB DEFAULT '[]'::jsonb,
    sanacion_heridas JSONB DEFAULT '[]'::jsonb,
    
    -- Módulo 5: Alquimia Final y Propósito
    proposito_vida JSONB DEFAULT '[]'::jsonb,
    plan_accion JSONB DEFAULT '[]'::jsonb,
    
    -- Foreign key a auth.users (Supabase Auth)
    CONSTRAINT fk_user_coaching_data_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Índice para búsquedas por fecha de actualización
CREATE INDEX IF NOT EXISTS idx_user_coaching_data_updated_at ON public.user_coaching_data(updated_at DESC);

-- Comentarios
COMMENT ON TABLE public.user_coaching_data IS 'Datos del viaje de coaching del usuario a través de los 5 módulos de Mi Viaje';
COMMENT ON COLUMN public.user_coaching_data.user_id IS 'UUID del usuario (referencia a auth.users)';
COMMENT ON COLUMN public.user_coaching_data.updated_at IS 'Última actualización de los datos de coaching';
COMMENT ON COLUMN public.user_coaching_data.linea_vida_hitos IS 'Módulo 1: Hitos importantes de la línea de vida del usuario';
COMMENT ON COLUMN public.user_coaching_data.herencia_raices IS 'Módulo 2: Herencia familiar y raíces';
COMMENT ON COLUMN public.user_coaching_data.roles_familiares IS 'Módulo 2: Roles que el usuario desempeñó en su familia';
COMMENT ON COLUMN public.user_coaching_data.personaje IS 'Módulo 3: El personaje que el usuario creó para sobrevivir';
COMMENT ON COLUMN public.user_coaching_data.inventario_creencias IS 'Módulo 3: Inventario de creencias limitantes';
COMMENT ON COLUMN public.user_coaching_data.carta_yo_pasado IS 'Módulo 4: Carta al yo del pasado';
COMMENT ON COLUMN public.user_coaching_data.carta_padres IS 'Módulo 4: Carta a los padres/figuras importantes';
COMMENT ON COLUMN public.user_coaching_data.ritual_sanacion IS 'Módulo 4: Ritual de sanación realizado';
COMMENT ON COLUMN public.user_coaching_data.sanacion_heridas IS 'Módulo 4: Proceso de sanación de heridas emocionales';
COMMENT ON COLUMN public.user_coaching_data.proposito_vida IS 'Módulo 5: Propósito de vida descubierto';
COMMENT ON COLUMN public.user_coaching_data.plan_accion IS 'Módulo 5: Plan de acción para vivir el propósito';
