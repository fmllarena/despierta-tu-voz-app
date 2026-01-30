-- Tabla: user_profiles
-- Perfil completo del usuario con toda su información de coaching, suscripción y preferencias
-- Esta es la tabla principal que centraliza toda la información del usuario

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Información básica del usuario
    nombre TEXT,
    email TEXT,
    email_confirmado_at TIMESTAMP WITH TIME ZONE,
    
    -- Datos de coaching y alquimia vocal
    historia_vocal TEXT,
    creencias TEXT,
    creencias_transmutadas TEXT,
    ultimo_resumen TEXT,
    nivel_alquimia TEXT,
    
    -- Progreso en Mi Viaje
    last_hito_completed INTEGER DEFAULT 0,
    journey_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Suscripción y pagos
    subscription_tier TEXT DEFAULT 'free'::text,
    stripe_customer_id TEXT,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    promo_locked_price NUMERIC,
    
    -- Control de emails enviados - Bienvenida
    bienvenida_enviada BOOLEAN DEFAULT false,
    bienvenida_free_sent BOOLEAN DEFAULT false,
    bienvenida_pro_sent BOOLEAN DEFAULT false,
    bienvenida_premium_sent BOOLEAN DEFAULT false,
    
    -- Control de emails enviados - Hitos
    hito1_sent BOOLEAN DEFAULT false,
    hito2_sent BOOLEAN DEFAULT false,
    hito3_sent BOOLEAN DEFAULT false,
    hito4_sent BOOLEAN DEFAULT false,
    hito5_sent BOOLEAN DEFAULT false,
    
    -- Control de emails enviados - Retención e Inactividad
    email_retencion_15_enviado BOOLEAN DEFAULT false,
    email_retencion_23_enviado BOOLEAN DEFAULT false,
    email_inactividad_10_enviado BOOLEAN DEFAULT false,
    email_inactividad_15_enviado BOOLEAN DEFAULT false,
    email_post_viaje_enviado BOOLEAN DEFAULT false,
    
    -- Actividad del usuario
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Control de sesiones y límites
    sessions_minutes_consumed INTEGER DEFAULT 0,
    last_session_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Preferencias del mentor IA
    mentor_focus REAL DEFAULT 0.5,
    mentor_personality REAL DEFAULT 0.5,
    mentor_length REAL DEFAULT 0.5,
    mentor_language TEXT DEFAULT 'es'::text,
    mentor_notes TEXT,
    
    -- Objetivos y preferencias del usuario
    weekly_goal TEXT DEFAULT ''::text,
    notification_pref TEXT DEFAULT 'daily'::text,
    notas_personales TEXT[] DEFAULT '{}'::text[],
    
    -- Consentimientos y términos
    accepted_terms BOOLEAN DEFAULT false,
    consent_marketing BOOLEAN DEFAULT true,
    consent_lifecycle BOOLEAN DEFAULT true,
    
    -- Verificación de email
    email_verification_token TEXT,
    email_verification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key a auth.users (Supabase Auth)
    CONSTRAINT fk_user_profiles_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active_at ON public.user_profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_end_date ON public.user_profiles(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verification_token ON public.user_profiles(email_verification_token) WHERE email_verification_token IS NOT NULL;

-- Comentarios
COMMENT ON TABLE public.user_profiles IS 'Perfil completo del usuario con información de coaching, suscripción y preferencias';
COMMENT ON COLUMN public.user_profiles.user_id IS 'UUID del usuario (referencia a auth.users) - ÚNICO';
COMMENT ON COLUMN public.user_profiles.nombre IS 'Nombre del usuario';
COMMENT ON COLUMN public.user_profiles.email IS 'Email del usuario';
COMMENT ON COLUMN public.user_profiles.email_confirmado_at IS 'Fecha de confirmación del email';
COMMENT ON COLUMN public.user_profiles.historia_vocal IS 'Historia vocal del usuario (generada por IA)';
COMMENT ON COLUMN public.user_profiles.creencias IS 'Creencias limitantes identificadas';
COMMENT ON COLUMN public.user_profiles.creencias_transmutadas IS 'Creencias ya transmutadas/trabajadas';
COMMENT ON COLUMN public.user_profiles.ultimo_resumen IS 'Último resumen generado de la sesión';
COMMENT ON COLUMN public.user_profiles.nivel_alquimia IS 'Nivel de progreso en la alquimia vocal (1-10)';
COMMENT ON COLUMN public.user_profiles.last_hito_completed IS 'Último módulo completado (0-5)';
COMMENT ON COLUMN public.user_profiles.journey_completed_at IS 'Fecha de finalización del viaje completo';
COMMENT ON COLUMN public.user_profiles.subscription_tier IS 'Nivel de suscripción: free, pro, premium';
COMMENT ON COLUMN public.user_profiles.stripe_customer_id IS 'ID del cliente en Stripe';
COMMENT ON COLUMN public.user_profiles.trial_end_date IS 'Fecha de finalización del periodo de prueba';
COMMENT ON COLUMN public.user_profiles.promo_locked_price IS 'Precio bloqueado por código promocional';
COMMENT ON COLUMN public.user_profiles.last_active_at IS 'Última vez que el usuario estuvo activo';
COMMENT ON COLUMN public.user_profiles.sessions_minutes_consumed IS 'Minutos de sesión consumidos en el mes actual';
COMMENT ON COLUMN public.user_profiles.last_session_reset IS 'Última vez que se reseteó el contador de sesiones';
COMMENT ON COLUMN public.user_profiles.mentor_focus IS 'Preferencia de enfoque del mentor (0=emocional, 1=técnico)';
COMMENT ON COLUMN public.user_profiles.mentor_personality IS 'Personalidad del mentor (0=formal, 1=cercano)';
COMMENT ON COLUMN public.user_profiles.mentor_length IS 'Longitud de respuestas (0=cortas, 1=largas)';
COMMENT ON COLUMN public.user_profiles.mentor_language IS 'Idioma del mentor (es, en, etc)';
COMMENT ON COLUMN public.user_profiles.mentor_notes IS 'Notas del mentor sobre el usuario';
COMMENT ON COLUMN public.user_profiles.weekly_goal IS 'Objetivo semanal del usuario';
COMMENT ON COLUMN public.user_profiles.notification_pref IS 'Preferencia de notificaciones: daily, weekly, none';
COMMENT ON COLUMN public.user_profiles.notas_personales IS 'Array de notas personales del usuario';
COMMENT ON COLUMN public.user_profiles.accepted_terms IS 'Ha aceptado términos y condiciones';
COMMENT ON COLUMN public.user_profiles.consent_marketing IS 'Consiente recibir emails de marketing';
COMMENT ON COLUMN public.user_profiles.consent_lifecycle IS 'Consiente recibir emails de lifecycle (bienvenida, hitos, etc)';
COMMENT ON COLUMN public.user_profiles.email_verification_token IS 'Token para verificación de email';
COMMENT ON COLUMN public.user_profiles.email_verification_sent_at IS 'Fecha de envío del email de verificación';
