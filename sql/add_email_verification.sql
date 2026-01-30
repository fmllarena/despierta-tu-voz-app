-- Script SQL para agregar columnas de verificación de email
-- Ejecutar en Supabase SQL Editor

-- Agregar solo las columnas nuevas necesarias (email_confirmado_at ya existe)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

-- Crear índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_email_verification_token 
ON user_profiles(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Marcar como verificados a todos los usuarios PRO/PREMIUM existentes
-- (usando la columna existente email_confirmado_at)
UPDATE user_profiles 
SET email_confirmado_at = NOW()
WHERE subscription_tier IN ('pro', 'premium') 
  AND email_confirmado_at IS NULL;

-- Comentario: Los usuarios FREE nuevos tendrán email_confirmado_at = NULL por defecto
-- y recibirán el email de verificación al registrarse
-- La columna email_confirmado_at se usará para verificar si el email está confirmado
