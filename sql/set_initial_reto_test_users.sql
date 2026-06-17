-- Solo estos dos emails recibirán el reto diario de prueba
UPDATE public.user_profiles
SET receive_daily_challenges = false;

UPDATE public.user_profiles
SET receive_daily_challenges = true
WHERE email IN ('fernando@despiertatuvoz.com', 'contacto@despiertatuvoz.com');
