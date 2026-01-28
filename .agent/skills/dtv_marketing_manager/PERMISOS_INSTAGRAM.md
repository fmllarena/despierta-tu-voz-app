# 🔧 Solución: Permisos de Instagram No Disponibles

## ⚠️ Problema

Solo ves estos permisos:
- ✅ `pages_show_list`
- ✅ `ads_management`
- ✅ `ads_read`
- ✅ `business_management`
- ✅ `pages_read_engagement`

**Faltan:**
- ❌ `instagram_content_publish`
- ❌ `pages_manage_posts`
- ❌ `instagram_basic`

---

## 🎯 Solución: Configurar la App Correctamente

### Paso 1: Agregar Productos a tu App

1. Ve a tu App en **https://developers.facebook.com/apps/**
2. En el panel izquierdo, busca **"Add Products"** o **"Agregar Productos"**
3. Busca y agrega estos productos:
   - **Instagram Graph API** → Click en "Set Up"
   - **Facebook Login** → Click en "Set Up"

### Paso 2: Configurar Instagram Graph API

1. Una vez agregado Instagram Graph API
2. Ve a **Instagram Graph API → Settings**
3. Asegúrate de que esté habilitado

### Paso 3: Modo de Desarrollo vs Producción

#### Opción A: Usar Modo de Desarrollo (Más Rápido)

1. Ve a **Settings → Basic**
2. En la parte superior, verás el estado de tu app
3. Si está en **"Development Mode"**, está bien para testing
4. Agrega tu cuenta de Facebook como **"Tester"**:
   - Ve a **Roles → Test Users** o **Roles → Testers**
   - Agrega tu cuenta de Facebook

#### Opción B: Pasar a Producción (Para Uso Real)

1. Ve a **Settings → Basic**
2. Completa todos los campos requeridos:
   - Privacy Policy URL
   - Terms of Service URL
   - App Icon
   - Category
3. Ve a **App Review**
4. Solicita los permisos:
   - `instagram_content_publish`
   - `pages_manage_posts`
   - `instagram_basic`

**⚠️ IMPORTANTE:** Para pasar a producción necesitas que Meta revise tu app (puede tardar días).

---

## 🚀 Solución Rápida: Usar Meta Business Suite Directamente

Si necesitas empezar YA sin esperar la revisión de Meta, podemos usar **Meta Business Suite** de forma manual:

### Workflow Alternativo

1. **La Skill genera el contenido** (copy + imágenes)
2. **Guarda todo localmente** en modo `assets_only`
3. **Tú publicas manualmente** desde Meta Business Suite

### Ventajas
- ✅ No necesitas permisos especiales
- ✅ Funciona inmediatamente
- ✅ Mantienes control total
- ✅ Puedes revisar antes de publicar

### Cómo Funciona

```bash
# Generar contenido del día
node scripts/run.js --mode=assets_only

# Esto crea en output/YYYY-MM-DD/:
# - content.json (toda la info)
# - feed.png (imagen 1:1)
# - story.png (imagen 9:16)
# - copy.txt (copy completo)
```

Luego:
1. Abres Meta Business Suite
2. Copias el copy de `copy.txt`
3. Subes la imagen `feed.png`
4. Programas la publicación

---

## 🔄 Solución Intermedia: API de Contenido Básico

Podemos modificar la Skill para usar solo los permisos que SÍ tienes:

### Permisos Disponibles
- ✅ `pages_show_list` → Ver tus páginas
- ✅ `pages_read_engagement` → Ver estadísticas
- ✅ `pages_manage_posts` → **¡Este lo necesitamos!**

### Verificar si tienes `pages_manage_posts`

Ejecuta este comando en PowerShell:

```powershell
$token = "TU_TOKEN_AQUI"
$response = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/me/permissions?access_token=$token" -Method Get
$response.data | Where-Object { $_.permission -like "*pages*" -or $_.permission -like "*instagram*" }
```

---

## 💡 Recomendación: ¿Qué Hacer Ahora?

### Opción 1: Modo Manual (Inmediato) ⭐ RECOMENDADO

**Ventajas:**
- ✅ Funciona HOY
- ✅ No necesitas permisos especiales
- ✅ Control total del contenido

**Pasos:**
1. Usar la Skill en modo `assets_only`
2. Publicar manualmente desde Meta Business Suite
3. Mientras tanto, solicitar permisos a Meta

**Tiempo:** 5 minutos por día

### Opción 2: Solicitar Permisos a Meta (1-2 semanas)

**Ventajas:**
- ✅ Automatización completa
- ✅ Publicación programada

**Desventajas:**
- ❌ Requiere revisión de Meta (1-2 semanas)
- ❌ Necesitas Privacy Policy y Terms of Service

**Pasos:**
1. Completar información de la app
2. Solicitar permisos en App Review
3. Esperar aprobación

### Opción 3: Usar Cuenta de Prueba (Testing)

**Ventajas:**
- ✅ Permisos completos para testing
- ✅ No requiere revisión

**Desventajas:**
- ❌ Solo funciona con cuentas de prueba
- ❌ No publica en tu página real

---

## 🎯 Mi Recomendación

**Para empezar HOY:**

1. **Usa modo `assets_only`** → La Skill genera todo el contenido
2. **Publica manualmente** → Copias y pegas en Meta Business Suite
3. **En paralelo:** Solicita los permisos a Meta para automatizar después

**Esto te permite:**
- ✅ Empezar a generar contenido HOY
- ✅ Mantener la calidad y coherencia
- ✅ Automatizar cuando Meta apruebe los permisos

---

## 📝 Checklist de Configuración Actual

```
[ ] Agregar Instagram Graph API a tu app
[ ] Agregar Facebook Login a tu app
[ ] Verificar permisos disponibles
[ ] Decidir: ¿Manual o esperar aprobación?
[ ] Si manual: Configurar workflow con assets_only
[ ] Si automatizado: Solicitar permisos en App Review
```

---

## 🚀 Próximo Paso Inmediato

**¿Qué prefieres?**

**A)** Configurar modo manual (assets_only) y empezar HOY  
**B)** Te ayudo a solicitar permisos a Meta (tarda 1-2 semanas)  
**C)** Crear cuenta de prueba para testing  

**Dime qué opción prefieres y te configuro todo!** 😊

---

## 📞 Información Adicional

### Para Solicitar Permisos a Meta

Necesitarás:
1. **Privacy Policy URL** (puedes usar un generador online)
2. **Terms of Service URL**
3. **Descripción de uso** de los permisos
4. **Video demo** mostrando cómo usarás los permisos

### Generadores de Privacy Policy Gratuitos

- https://www.privacypolicygenerator.info/
- https://www.freeprivacypolicy.com/
- https://app-privacy-policy-generator.firebaseapp.com/

---

**Mientras tanto, podemos usar modo manual y la Skill seguirá siendo súper útil para generar contenido de calidad!** 🎨
