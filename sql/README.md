# 📊 Scripts SQL - Despierta tu Voz

Esta carpeta contiene todos los scripts SQL necesarios para recrear la base de datos completa de Supabase.

## 📁 Estructura de Archivos

### Tablas (01-05)
- **01_create_table_mensajes.sql** - Historial de conversaciones entre usuarios y mentor IA
- **02_create_table_revelaciones.sql** - Tabla legacy (no se usa actualmente)
- **03_create_table_user_coaching_data.sql** - Datos del viaje de coaching (5 módulos)
- **04_create_table_user_profiles.sql** - **Tabla principal** con toda la info del usuario
- **05_create_table_mensajes_backup.sql** - Backup de mensajes

### Lógica de Negocio (06-07)
- **06_functions.sql** - Funciones PL/pgSQL para sincronización de usuarios
- **07_triggers.sql** - Triggers HTTP para emails y notificaciones

### Seguridad (08)
- **08_rls_policies.sql** - Políticas de Row Level Security

### Mensajes guardados (09)
- **09_create_table_mensajes_guardados.sql** - Respuestas del Mentor marcadas por el alumno (tabla, índices, RLS y permisos)

### Migraciones
- **add_email_verification.sql** - Añade columnas para verificación de email

## 🚀 Orden de Ejecución

Si necesitas recrear la base de datos desde cero, ejecuta los scripts en este orden:

```bash
# 1. Crear tablas
01_create_table_mensajes.sql
02_create_table_revelaciones.sql
03_create_table_user_coaching_data.sql
04_create_table_user_profiles.sql
05_create_table_mensajes_backup.sql

# 2. Crear funciones
06_functions.sql

# 3. Crear triggers
07_triggers.sql

# 4. Aplicar políticas RLS
08_rls_policies.sql

# 5. Mensajes guardados (imprescindible para el marcador del chat)
09_create_table_mensajes_guardados.sql

# 6. Migraciones adicionales
add_email_verification.sql
```

## 📋 Descripción de Tablas

### `user_profiles` (Tabla Principal)
Centraliza toda la información del usuario:
- **Datos básicos**: nombre, email, fecha de registro
- **Coaching**: historia vocal, creencias, nivel de alquimia
- **Suscripción**: tier (free/pro/premium), Stripe ID, trial
- **Progreso**: último hito completado, fecha de finalización
- **Emails**: control de qué emails se han enviado
- **Preferencias**: configuración del mentor IA, notificaciones
- **Consentimientos**: términos, marketing, lifecycle

### `mensajes`
Historial completo de conversaciones:
- Mensajes del usuario
- Respuestas del mentor IA
- Resúmenes diarios generados automáticamente
- Mensajes del sistema

### `mensajes_guardados`
Respuestas del Mentor marcadas por el alumno con el icono de marcador:
- Pregunta del alumno y respuesta del Mentor (copias desacopladas del mensaje original)
- Fecha del mensaje y fecha de guardado
- Etiquetas opcionales
- Un registro por alumno y mensaje (índice único)

### `user_coaching_data`
Datos del viaje "Mi Viaje" (5 módulos):
- **Módulo 1**: Línea de vida y hitos
- **Módulo 2**: Herencia familiar y roles
- **Módulo 3**: El personaje y creencias limitantes
- **Módulo 4**: Cartas de sanación y rituales
- **Módulo 5**: Propósito de vida y plan de acción

Todos los datos se almacenan en formato JSONB.

## 🔐 Seguridad (RLS)

Todas las tablas principales tienen **Row Level Security** habilitado:

- ✅ Los usuarios solo pueden ver/editar sus propios datos
- ✅ El mentor (fernando@despiertatuvoz.com) tiene acceso completo
- ✅ Las políticas usan `auth.uid()` para identificar usuarios
- ✅ Protección automática contra accesos no autorizados

## 🔄 Funciones Automáticas

### `handle_user_sync()`
Se ejecuta automáticamente cuando:
- Un usuario se registra en `auth.users`
- Se actualiza información en `auth.users`

**Acción**: Crea o actualiza el perfil en `user_profiles`

### Triggers HTTP
Ejecutan llamadas HTTP automáticas a:
- **Supabase Edge Functions**: Envío de emails de bienvenida y hitos
- **Brevo API**: Sincronización con plataforma de email marketing
- **n8n**: Workflows de automatización adicionales

## 📧 Control de Emails

La tabla `user_profiles` tiene columnas booleanas para controlar qué emails se han enviado:

**Bienvenida:**
- `bienvenida_enviada`
- `bienvenida_free_sent`
- `bienvenida_pro_sent`
- `bienvenida_premium_sent`

**Hitos (Mi Viaje):**
- `hito1_sent` a `hito5_sent`

**Retención e Inactividad:**
- `email_retencion_15_enviado`
- `email_retencion_23_enviado`
- `email_inactividad_10_enviado`
- `email_inactividad_15_enviado`
- `email_post_viaje_enviado`

## 🎯 Tiers de Suscripción

- **free**: Acceso básico con límites
- **pro**: Acceso completo a todos los módulos
- **premium**: Pro + funcionalidades adicionales

Los nuevos usuarios reciben tier `pro` por defecto con trial de 30 días.

## 🔧 Mantenimiento

### Backup
La tabla `mensajes_backup` sirve como respaldo del historial de conversaciones.

### Limpieza
La tabla `revelaciones` es legacy y puede ser eliminada en el futuro.

## ⚠️ Notas Importantes

1. Los triggers HTTP contienen **Service Role Keys** - mantener secretos
2. El trigger `on_auth_user_created` debe crearse manualmente en `auth.users` (requiere permisos de superusuario)
3. Algunas políticas RLS parecen duplicadas - considerar consolidación
4. Los tokens de verificación de email expiran a los 7 días

## 📞 Contacto

Para dudas sobre la estructura de la base de datos, contactar al equipo de desarrollo.
