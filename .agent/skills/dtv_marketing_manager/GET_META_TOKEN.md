# 🔑 Guía Rápida: Obtener Token de Meta Válido

## ⚠️ Problema Detectado

El token que proporcionaste parece estar **expirado o inválido**. 

Error recibido:
```
The access token could not be decrypted
```

Esto significa que necesitas generar un **nuevo token**.

---

## 🚀 Solución Rápida (5 minutos)

### Paso 1: Ir a Graph API Explorer

1. Abre tu navegador
2. Ve a: **https://developers.facebook.com/tools/explorer/**
3. Inicia sesión con tu cuenta de Facebook

### Paso 2: Seleccionar tu App

1. En la esquina superior derecha, busca **"Meta App"**
2. Si no tienes una app, haz click en **"Create App"**
   - Tipo: **Business**
   - Nombre: "Despierta tu Voz Marketing"
3. Si ya tienes una app, selecciónala del dropdown

### Paso 3: Seleccionar tu Página

1. En **"User or Page"**, selecciona tu página de Facebook
2. Asegúrate de que sea la página conectada a tu Instagram Business

### Paso 4: Agregar Permisos

1. Haz click en **"Permissions"** (o "Add a Permission")
2. Busca y activa estos permisos:
   - ✅ `instagram_basic`
   - ✅ `instagram_content_publish`
   - ✅ `pages_manage_posts`
   - ✅ `pages_read_engagement`
   - ✅ `pages_show_list`

### Paso 5: Generar Token

1. Haz click en **"Generate Access Token"**
2. Acepta los permisos solicitados
3. **COPIA EL TOKEN** que aparece en el campo "Access Token"

### Paso 6: Obtener IDs

#### A. Obtener PAGE_ID

1. En Graph API Explorer, con tu token generado
2. En el campo de consulta, escribe: `me/accounts`
3. Haz click en **"Submit"**
4. En la respuesta, busca tu página y copia el **"id"**

Ejemplo de respuesta:
```json
{
  "data": [
    {
      "id": "123456789012345",  ← Este es tu PAGE_ID
      "name": "Despierta tu Voz"
    }
  ]
}
```

#### B. Obtener INSTAGRAM_ACCOUNT_ID

1. En el campo de consulta, escribe: `TU_PAGE_ID?fields=instagram_business_account`
   - Reemplaza `TU_PAGE_ID` con el ID que obtuviste arriba
2. Haz click en **"Submit"**
3. Copia el **"id"** que aparece dentro de `instagram_business_account`

Ejemplo de respuesta:
```json
{
  "instagram_business_account": {
    "id": "987654321098765"  ← Este es tu INSTAGRAM_ACCOUNT_ID
  }
}
```

---

## 📝 Actualizar .env

Una vez que tengas los 3 valores, edita el archivo `.env`:

```env
META_ACCESS_TOKEN=TU_NUEVO_TOKEN_AQUI
META_PAGE_ID=123456789012345
META_INSTAGRAM_ACCOUNT_ID=987654321098765
```

---

## ✅ Verificar Token

Ejecuta este comando para verificar que todo esté correcto:

```bash
node scripts/verify-tokens.js
```

Deberías ver:
```
✅ META_ACCESS_TOKEN: Válido (User: Tu Nombre)
```

---

## ⚠️ Importante: Token de Larga Duración

El token que generas en Graph API Explorer **expira en 1-2 horas**.

Para obtener un token de **larga duración** (60 días):

### Opción 1: Desde Graph API Explorer

1. En Graph API Explorer, después de generar el token
2. Busca el botón **"Get Long-Lived Access Token"** o similar
3. Haz click y copia el nuevo token

### Opción 2: Manualmente (Avanzado)

Ejecuta este comando reemplazando los valores:

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_TOKEN_TEMPORAL"
```

Donde:
- `TU_APP_ID`: Settings → Basic → App ID
- `TU_APP_SECRET`: Settings → Basic → App Secret
- `TU_TOKEN_TEMPORAL`: El token que acabas de generar

---

## 🆘 Troubleshooting

### Error: "Invalid OAuth Token"
- El token expiró → Genera uno nuevo
- Faltan permisos → Revisa que todos los permisos estén activos

### Error: "Instagram Account Not Connected"
- Tu página de Facebook no está conectada a Instagram Business
- Ve a tu página → Settings → Instagram → Conectar cuenta

### Error: "Insufficient Permissions"
- Revisa que TODOS los permisos estén activos en Graph API Explorer
- Genera un nuevo token después de activar los permisos

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. **Comparte el error exacto** que recibes
2. **Confirma que tienes**:
   - Una página de Facebook
   - Una cuenta de Instagram Business conectada a esa página
   - Permisos de administrador en ambas

---

## 🎯 Checklist Rápido

```
[ ] Ir a Graph API Explorer
[ ] Seleccionar/Crear App
[ ] Seleccionar Página de Facebook
[ ] Activar los 5 permisos necesarios
[ ] Generar Access Token
[ ] Copiar token
[ ] Obtener PAGE_ID (consulta: me/accounts)
[ ] Obtener INSTAGRAM_ACCOUNT_ID (consulta: PAGE_ID?fields=instagram_business_account)
[ ] Actualizar .env con los 3 valores
[ ] Ejecutar: node scripts/verify-tokens.js
[ ] Obtener token de larga duración (opcional pero recomendado)
```

---

**Una vez que tengas el token válido, podremos continuar con la configuración!** 🚀
