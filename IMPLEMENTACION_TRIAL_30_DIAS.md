# Sistema de Trial de 30 Días - Implementación

## 📋 Resumen

Sistema automático que gestiona el periodo de prueba de 30 días para usuarios Pro sin pago configurado. Al finalizar el trial, baja automáticamente a tier 'free' y envía email de notificación vía Brevo.

---

## 🔧 Componentes

### 1. **Base de Datos** (`add_trial_system.sql`)
- **Campo `trial_end_date`**: Fecha de fin del periodo de prueba
- **Campo `promo_locked_price`**: Precio bloqueado por promoción (9.90 para PROMO1MES)
- **Trigger actualizado**: Establece `trial_end_date = created_at + 30 días` automáticamente

### 2. **API de Canje** (`api/redeem-promo.js`)
- Registra `promo_locked_price = 9.90` para PROMO1MES
- Extiende `trial_end_date` 30 días adicionales al canjear promo
- Previene canjes duplicados

### 3. **Edge Function** (`supabase/functions/check-expired-trials/index.ts`)
- Busca usuarios con `trial_end_date < hoy` y `tier = 'pro'` sin pago
- Baja a `tier = 'free'`
- Envía email usando plantilla Brevo #6

### 4. **Cron Job** (`schedule_trial_check_cron.sql`)
- Se ejecuta **diariamente a las 10:00 AM UTC** (11:00 AM España)
- Llama a la Edge Function automáticamente

---

## 📝 Pasos de Implementación

### **Paso 1: Ejecutar migración de base de datos**
```sql
-- En Supabase SQL Editor:
-- Ejecutar: supabase/add_trial_system.sql
```

### **Paso 2: Desplegar Edge Function**
```bash
# Desde la terminal, en la raíz del proyecto:
supabase functions deploy check-expired-trials
```

### **Paso 3: Configurar variables de entorno en Supabase**
```bash
# En Supabase Dashboard > Settings > Edge Functions > Secrets:
BREVO_API_KEY=tu_api_key_de_brevo
```

### **Paso 4: Configurar cron job**
```sql
-- En Supabase SQL Editor:
-- 1. Editar schedule_trial_check_cron.sql
-- 2. Reemplazar YOUR_PROJECT_REF con tu referencia de proyecto
-- 3. Reemplazar YOUR_ANON_KEY con tu clave anon
-- 4. Ejecutar el script
```

### **Paso 5: Verificar plantilla de Brevo**
- Ir a Brevo > Plantillas > Plantilla #6
- Verificar que existen estos parámetros:
  - `{{ params.NOMBRE }}`
  - `{{ params.PRECIO }}`
  - `{{ params.LINK_PAGO }}`

---

## 🔄 Flujo Completo

### **Usuario Normal (Sin Promo)**
```
1. Registro → tier='pro', trial_end_date=+30 días
2. Pasan 30 días sin configurar pago
3. Cron job detecta trial expirado
4. Baja a tier='free'
5. Email Brevo #6: "Tu periodo de prueba ha terminado"
```

### **Usuario con PROMO1MES**
```
1. Registro → tier='pro', trial_end_date=+30 días
2. Canjea PROMO1MES → promo_locked_price=9.90, trial_end_date=+30 días más
3. Pasan 30 días sin configurar pago
4. Cron job detecta trial expirado
5. Baja a tier='free'
6. Email Brevo #6: "Configura tu pago para mantener el precio de 9,90€/mes"
```

---

## 🧪 Testing

### **Probar manualmente la Edge Function**
```bash
# Llamar directamente a la función:
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expired-trials' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### **Simular trial expirado**
```sql
-- En Supabase SQL Editor:
UPDATE user_profiles
SET trial_end_date = NOW() - INTERVAL '1 day'
WHERE email = 'test@example.com';

-- Luego ejecutar manualmente la función
```

---

## ⚠️ Notas Importantes

1. **Betatesters**: Si quieres que algunos usuarios tengan acceso Pro indefinido, establece `trial_end_date = NULL`
2. **Precio blindado**: Los usuarios con `promo_locked_price` deben ver ese precio en Stripe
3. **Zona horaria**: El cron está en UTC. 10:00 AM UTC = 11:00 AM España (invierno)
4. **Logs**: Revisa los logs de la Edge Function en Supabase Dashboard > Edge Functions > Logs

---

## 📊 Monitoreo

### **Ver usuarios próximos a expirar**
```sql
SELECT email, nombre, trial_end_date, 
       trial_end_date - NOW() as tiempo_restante
FROM user_profiles
WHERE subscription_tier = 'pro'
  AND trial_end_date IS NOT NULL
  AND trial_end_date > NOW()
ORDER BY trial_end_date ASC
LIMIT 20;
```

### **Ver usuarios que expiraron hoy**
```sql
SELECT email, nombre, trial_end_date
FROM user_profiles
WHERE subscription_tier = 'free'
  AND trial_end_date::date = CURRENT_DATE;
```

---

## 🔗 Referencias

- Plantilla Brevo #6: "Email de aviso fin de suscripción/error en el pago"
- Edge Function: `supabase/functions/check-expired-trials/index.ts`
- Cron Job: Ejecuta diariamente a las 10:00 AM UTC
