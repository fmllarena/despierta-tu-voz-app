-- Triggers de la base de datos
-- Estos triggers ejecutan acciones automáticas cuando ocurren eventos en las tablas

-- =====================================================
-- TRIGGER: Sincronización de usuarios desde auth.users
-- Descripción: Cuando se crea o actualiza un usuario en auth.users, 
--              se sincroniza automáticamente con user_profiles
-- =====================================================

-- Primero necesitamos crear el trigger en auth.users (requiere permisos de superusuario)
-- Este trigger debe ejecutarse en el schema auth, no en public

-- NOTA: Este trigger debe ser creado manualmente en Supabase Dashboard > SQL Editor
-- porque requiere permisos especiales sobre el schema auth

/*
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_sync();
*/


-- =====================================================
-- TRIGGER: enviar_bienvenida_brevo
-- Descripción: Envía email de bienvenida cuando se crea o actualiza un perfil
-- Evento: AFTER INSERT OR UPDATE en user_profiles
-- =====================================================
CREATE OR REPLACE TRIGGER enviar_bienvenida_brevo
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/send-welcome-email',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d3dqdGpjYXd1YWJ6eW9qYWJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzExNDI3OCwiZXhwIjoyMDgyNjkwMjc4fQ.a_lRvzOP4YYbyG6-diQdqn0RmSGqidFZQk3kvU6Ku9U"}',
    '{}',
    '5000'
  );

COMMENT ON TRIGGER enviar_bienvenida_brevo ON public.user_profiles IS 
  'Envía email de bienvenida vía Supabase Edge Function cuando se crea o actualiza un perfil';


-- =====================================================
-- TRIGGER: sync-to-brevo
-- Descripción: Sincroniza el nuevo usuario con Brevo (plataforma de email marketing)
-- Evento: AFTER INSERT en user_profiles
-- =====================================================
CREATE OR REPLACE TRIGGER "sync-to-brevo"
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/send-welcome-email',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d3dqdGpjYXd1YWJ6eW9qYWJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzExNDI3OCwiZXhwIjoyMDgyNjkwMjc4fQ.a_lRvzOP4YYbyG6-diQdqn0RmSGqidFZQk3kvU6Ku9U"}',
    '{}',
    '5000'
  );

COMMENT ON TRIGGER "sync-to-brevo" ON public.user_profiles IS 
  'Sincroniza nuevos usuarios con Brevo para email marketing';


-- =====================================================
-- TRIGGER: n8n-registro
-- Descripción: Notifica a n8n cuando se registra un nuevo usuario
--              n8n puede ejecutar workflows adicionales (notificaciones, integraciones, etc)
-- Evento: AFTER INSERT en user_profiles
-- =====================================================
CREATE OR REPLACE TRIGGER "n8n-registro"
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://n8n-gue4.onrender.com/webhook/supabase-auth-webhook',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '5000'
  );

COMMENT ON TRIGGER "n8n-registro" ON public.user_profiles IS 
  'Notifica a n8n cuando se registra un nuevo usuario para ejecutar workflows adicionales';


-- =====================================================
-- TRIGGER: trigger-hito-emails
-- Descripción: Envía emails de celebración cuando el usuario completa un hito/módulo
-- Evento: AFTER UPDATE en user_profiles
-- Condición: Se ejecuta cuando cambia last_hito_completed
-- =====================================================
CREATE OR REPLACE TRIGGER "trigger-hito-emails"
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://axwwjtjcawuabzyojabu.supabase.co/functions/v1/send-hito-email',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d3dqdGpjYXd1YWJ6eW9qYWJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzExNDI3OCwiZXhwIjoyMDgyNjkwMjc4fQ.a_lRvzOP4YYbyG6-diQdqn0RmSGqidFZQk3kvU6Ku9U"}',
    '{}',
    '5000'
  );

COMMENT ON TRIGGER "trigger-hito-emails" ON public.user_profiles IS 
  'Envía emails de celebración cuando el usuario completa un hito/módulo en Mi Viaje';


-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Los triggers HTTP usan supabase_functions.http_request que es una función nativa de Supabase
-- 2. Los tokens Bearer en los headers son Service Role Keys - MANTENER SECRETOS
-- 3. El trigger principal de sincronización (on_auth_user_created) debe crearse en auth.users
--    y requiere permisos de superusuario en Supabase Dashboard
-- 4. Los triggers de email pueden generar múltiples llamadas - considerar usar WHEN conditions
--    para evitar duplicados (ej: WHEN (NEW.bienvenida_enviada = false))
