-- Añadir columnas para retos diarios en user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS receive_daily_challenges BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS racha_dias INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_retos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_reto_enviado_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.user_profiles.receive_daily_challenges IS 'El usuario quiere recibir retos vocales diarios';
COMMENT ON COLUMN public.user_profiles.racha_dias IS 'Días consecutivos que ha completado el reto diario';
COMMENT ON COLUMN public.user_profiles.total_retos IS 'Total de retos diarios completados';
COMMENT ON COLUMN public.user_profiles.ultimo_reto_enviado_at IS 'Última vez que se le envió un reto diario';
