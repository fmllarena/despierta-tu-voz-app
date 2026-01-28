-- Sistema de Trial de 30 días para usuarios Pro sin pago
-- Ejecutar en el SQL Editor de Supabase

-- 1. Añadir columna trial_end_date
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;

-- 2. Añadir columna para marcar si tiene precio blindado (PROMO1MES)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS promo_locked_price NUMERIC(10,2);

-- 3. Actualizar el trigger para establecer trial_end_date automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    nombre, 
    subscription_tier, 
    notification_pref,
    trial_end_date  -- Nuevo campo
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', SPLIT_PART(new.email, '@', 1)), 
    'pro',  -- Betatesters tienen acceso Pro por defecto
    'daily',
    NOW() + INTERVAL '30 days'  -- Trial de 30 días
  );
  RETURN new;
END;
$$;

-- 4. Actualizar usuarios existentes que no tienen trial_end_date
UPDATE public.user_profiles
SET trial_end_date = created_at + INTERVAL '30 days'
WHERE trial_end_date IS NULL
  AND subscription_tier = 'pro'
  AND created_at IS NOT NULL;

-- 5. Comentario para referencia
COMMENT ON COLUMN public.user_profiles.trial_end_date IS 
'Fecha de fin del periodo de prueba de 30 días. Después de esta fecha, si no hay pago, se baja a tier free';

COMMENT ON COLUMN public.user_profiles.promo_locked_price IS 
'Precio mensual bloqueado por promoción (ej: 9.90 para PROMO1MES). NULL si no tiene promo activa';
